<?php
// /var/www/html/nds/fas-hid-https.php
// https://app.wifikids.fun/nds/fas-hid-https.php
declare(strict_types=1);

// =====================================
// CONFIG
// =====================================
$faskey          = getenv('OPENNDS_FASKEY') ?: 'troque-para-o-mesmo-faskey-do-roteador';
$landing_url_ok  = 'https://app.wifikids.fun/sucesso'; // pós-login (opcional; CPD pode fechar)
$queue_backend   = 'file'; // 'file' | 'redis'
$queue_file_path = '/var/www/html/nds/authmon_queue.json';

// Redis (opcional)
$redis_host = '127.0.0.1';
$redis_port = 6379;
$redis_key  = 'wifikids:authmon:queue';

// Quotas/políticas default (ajuste conforme MVP)
$defaults = [
  'sessionlength'  => 1440, // minutos (24h)
  'uploadrate'     => 0,    // kbps (0=sem limite)
  'downloadrate'   => 0,    // kbps
  'uploadquota'    => 0,    // kBytes
  'downloadquota'  => 0,    // kBytes
  'custom'         => '',   // string livre p/ BinAuth/logs
];

// =====================================
// Helpers de fila para o Authmon
// =====================================
function authmon_enqueue(array $entry, string $backend, string $file, ?Redis $r=null, string $rkey=''): void {
  if ($backend === 'redis') {
    $r->rPush($rkey, json_encode($entry, JSON_UNESCAPED_SLASHES));
    return;
  }
  // file
  if (!file_exists($file)) file_put_contents($file, json_encode([]));
  $arr = json_decode(file_get_contents($file), true) ?: [];
  $arr[] = $entry;
  file_put_contents($file, json_encode($arr));
}

function authmon_dequeue_all(string $backend, string $file, ?Redis $r=null, string $rkey=''): array {
  if ($backend === 'redis') {
    $out = [];
    while (($raw = $r->lPop($rkey)) !== false) {
      $item = json_decode($raw, true);
      if ($item) $out[] = $item;
    }
    return $out;
  }
  if (!file_exists($file)) return [];
  $arr = json_decode(file_get_contents($file), true) ?: [];
  // limpa a fila
  file_put_contents($file, json_encode([]));
  return $arr;
}

// Conexão Redis se habilitado
$redis = null;
if ($queue_backend === 'redis') {
  $redis = new Redis();
  $redis->connect($redis_host, $redis_port, 1.5);
}

// =====================================
// Roteamento simples
// =====================================
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1) Endpoint UI/entrada do FAS (GET) - recebe ?fas=base64(…)
if ($path === '/nds/fas-hid-https.php' && $_SERVER['REQUEST_METHOD'] === 'GET') {
  if (!isset($_GET['fas'])) {
    http_response_code(400);
    echo 'Missing fas parameter';
    exit;
  }
  // Decodifica a string base64 enviada pelo NDS (nível 1/4)
  // Formato decodificado: "var1=val1, var2=val2, ..."
  $decoded = base64_decode($_GET['fas'], true);
  if ($decoded === false) {
    http_response_code(400);
    echo 'Invalid base64';
    exit;
  }
  // Parseia pares "k=v" separados por ", "
  $vars = [];
  foreach (explode(', ', $decoded) as $pair) {
    $kv = explode('=', $pair, 2);
    if (count($kv) === 2) $vars[$kv[0]] = $kv[1];
  }

  // Campos típicos (podem variar por versão): hid, clientip, clientmac, gatewayaddress, originurl, gatewayname, authdir, clientif...
  $hid             = $vars['hid']            ?? ($vars['client_hid'] ?? null);
  $originurl       = $vars['originurl']      ?? 'http://connectivitycheck.gstatic.com/generate_204';
  $gatewayaddress  = $vars['gatewayaddress'] ?? ''; // usado apenas para debug/telemetria aqui
  $gatewayname     = $vars['gatewayname']    ?? 'Wi-Fi Kids';
  $router_id       = $vars['gw_id']          ?? ''; // se você adicionou como custom parameter no NDS
  $clientmac       = $vars['clientmac']      ?? '';
  $clientip        = $vars['clientip']       ?? '';

  if (!$hid) {
    http_response_code(400);
    echo 'HID not present';
    exit;
  }

  // Renderiza uma página simples que aciona o app (ou mostra "permitir")
  // MVP: auto-aprovar após 1 clique; em produção, troque por fluxo do agente (OAuth/JWT/WebSocket etc.)
  $payload_ui = [
    'gatewayname' => $gatewayname,
    'router_id'   => $router_id,
    'client_mac'  => $clientmac,
    'client_ip'   => $clientip,
    'origin_url'  => $originurl,
    'hid'         => $hid,
  ];
  $json_ui = htmlspecialchars(json_encode($payload_ui), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

  ?>
  <!doctype html>
  <html lang="pt-br">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title><?php echo htmlspecialchars($gatewayname); ?> - Portal</title>
      <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif;margin:0;background:#0b0f19;color:#e5e7eb}
        .card{max-width:560px;margin:10vh auto;padding:24px;background:#111827;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.35)}
        button{padding:12px 16px;border:0;border-radius:12px;font-weight:600;cursor:pointer}
        .cta{background:#22c55e;color:#0b0f19}
        .ghost{background:transparent;color:#9ca3af;border:1px solid #374151;margin-left:8px}
        small{color:#9ca3af}
        pre{white-space:pre-wrap;background:#0b1220;padding:12px;border-radius:10px;color:#cbd5e1;overflow:auto}
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Conectar ao Wi‑Fi</h2>
        <p>Para continuar, confirme no app do responsável ou toque em <strong>Permitir Internet</strong> para este dispositivo.</p>
        <form method="POST" action="/nds/approve.php">
          <input type="hidden" name="hid" value="<?php echo htmlspecialchars($hid); ?>" />
          <button class="cta" type="submit">Permitir Internet</button>
          <a class="ghost" href="<?php echo htmlspecialchars($originurl); ?>">Cancelar</a>
        </form>
        <hr style="border-color:#1f2937;margin:20px 0" />
        <small>Dados do dispositivo:</small>
        <pre><?php echo $json_ui; ?></pre>
      </div>
    </body>
  </html>
  <?php
  exit;
}

// 2) Ação do botão "Permitir Internet" (cria RHID e enfileira p/ Authmon)
if ($path === '/nds/approve.php' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $hid = $_POST['hid'] ?? '';
  if (!$hid) { http_response_code(400); echo 'HID ausente'; exit; }

  // RHID = sha256(hid + faskey) — exigido pelos níveis 1/4
  // (o token do cliente nunca é exposto; quem valida é o NDS) 
  // ref: FAS levels 1/4 – retorno de hash baseado no hid + faskey
  $rhid = hash('sha256', $hid . $faskey);

  // Monta entrada com quotas (Authmon irá puxar)
  $entry = [
    'rhid'           => $rhid,
    'sessionlength'  => (int)$defaults['sessionlength'],
    'uploadrate'     => (int)$defaults['uploadrate'],
    'downloadrate'   => (int)$defaults['downloadrate'],
    'uploadquota'    => (int)$defaults['uploadquota'],
    'downloadquota'  => (int)$defaults['downloadquota'],
    'custom'         => (string)$defaults['custom'],
  ];

  authmon_enqueue($entry, $queue_backend, $queue_file_path, $redis, $redis_key);

  // Redireciona o usuário p/ landing (CPD pode fechar a aba)
  header('Location: ' . $landing_url_ok, true, 302);
  exit;
}

// 3) Endpoint do Authmon (HTTPS) — OpenNDS vai fazer POSTs periódicos
// Este endpoint devolve uma lista de tokens RHID prontos para autorizar.
// Formatos e ciclo do Authmon descritos na doc/papers; aqui usamos um formato simples.
if ($path === '/nds/authmon.php' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  // Opções comuns na literatura: auth_get = view | list | clear
  $auth_get = $_POST['auth_get'] ?? 'view';

  header('Content-Type: text/plain; charset=utf-8');

  if ($auth_get === 'clear') {
    // consome e descarta
    authmon_dequeue_all($queue_backend, $queue_file_path, $redis, $redis_key);
    echo "OK\n";
    exit;
  }

  // 'view' (ou padrão): retorna e limpa a fila (pull-then-clear)
  $items = authmon_dequeue_all($queue_backend, $queue_file_path, $redis, $redis_key);

  // Saída simples linha-a-linha:
  // "* <rhid>;<sessionlength>;<uploadrate>;<downloadrate>;<uploadquota>;<downloadquota>;<custom>"
  // (Parâmetros iguais aos documentados; campos ausentes/0 => usar globais)
  // ref: quotas e variáveis suportadas pelo Authmon/FAS. 
  foreach ($items as $it) {
    $line = sprintf(
      "* %s;%d;%d;%d;%d;%d;%s",
      $it['rhid'],
      $it['sessionlength'] ?? 0,
      $it['uploadrate'] ?? 0,
      $it['downloadrate'] ?? 0,
      $it['uploadquota'] ?? 0,
      $it['downloadquota'] ?? 0,
      $it['custom'] ?? ''
    );
    echo $line . "\n";
  }
  // Se não houver itens, devolvemos vazio (Authmon volta mais tarde)
  exit;
}

// 404 para qualquer outra rota
http_response_code(404);
echo "Not found";
