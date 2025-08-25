#!/bin/sh
set -e

# ---------- parâmetros de ambiente ----------
FAS_FQDN="app.wifikids.fun"
FAS_PORT="443"                 # HTTPS obrigatório no nível 4
FAS_PATH="/"                   # ajuste do endpoint, ex: "/fas-aes-https.php" ou "/nds/fas"
FAS_KEY="$(head -c 24 /dev/urandom | base64 | tr -d '=+/')"
GATEWAY_NAME="Wi-Fi Kids"
ADMIN_FQDN="admin.wifikids.fun"
ROOT_LAN_IP="192.168.1.1"     # ajuste se a LAN não for 192.168.1.1

# ---------- pacotes necessários ----------
opkg update
# OpenNDS + dependências do Walled Garden por FQDN
opkg install opennds
# Para OpenWrt >= 23.05 não precisa ipset; para compatibilidade, tenta instalar se existir:
opkg install ipset 2>/dev/null || true

# Substitui dnsmasq pelo dnsmasq-full (necessário para nftset / walled garden por FQDN)
opkg remove dnsmasq --autoremove || true
opkg install dnsmasq-full

# ---------- atalho DNS local p/ admin.wifikids.fun ----------
uci set dhcp.@dnsmasq[0].address="/${ADMIN_FQDN}/${ROOT_LAN_IP}"
uci commit dhcp
/etc/init.d/dnsmasq restart

# ---------- coleta do router_id (MAC da br-lan sem :) ----------
BR_IF="br-lan"
if [ ! -e "/sys/class/net/$BR_IF/address" ]; then
  # fallback p/ lan física
  BR_IF="lan"
fi
ROUTER_MAC="$(cat /sys/class/net/$BR_IF/address | tr -d ':')"
GW_ID="wifikids-${ROUTER_MAC}"

# ---------- configurações OpenNDS via UCI ----------
# habilita NDS e define interface/identidade
uci set opennds.@opennds[0].enabled='1'
uci set opennds.@opennds[0].gatewayinterface="$BR_IF"
uci set opennds.@opennds[0].gatewayname="$GATEWAY_NAME"
uci set opennds.@opennds[0].gw_id="$GW_ID"

# timeout e limites básicos (ajuste conforme sua política)
uci set opennds.@opennds[0].preauthidletimeout='300'    # 5 min para tela de portal
uci set opennds.@opennds[0].sessiontimeout='86400'      # 24h após autenticação
uci set opennds.@opennds[0].downloadlimit='0'           # sem modelagem aqui
uci set opennds.@opennds[0].uploadlimit='0'

# ---------- FAS remoto (nível 4, HTTPS + Authmon) ----------
uci set opennds.@opennds[0].fasport="$FAS_PORT"
uci set opennds.@opennds[0].fasremotefqdn="$FAS_FQDN"
uci set opennds.@opennds[0].faspath="$FAS_PATH"
uci set opennds.@opennds[0].fas_secure_enabled='4'      # 4 = HID + HTTPS + Authmon
uci set opennds.@opennds[0].faskey="$FAS_KEY"

# ---------- Walled Garden por FQDN (pré-autenticado) ----------
# liberar FAS e admin local; limitar às portas 443 para não quebrar CPD
uci -q delete opennds.@opennds[0].walledgarden_fqdn_list
uci add_list opennds.@opennds[0].walledgarden_fqdn_list="$FAS_FQDN"
uci add_list opennds.@opennds[0].walledgarden_fqdn_list="$ADMIN_FQDN"
# se quiser liberar também o domínio raiz:
uci add_list opennds.@opennds[0].walledgarden_fqdn_list="wifikids.fun"

uci -q delete opennds.@opennds[0].walledgarden_port_list
uci add_list opennds.@opennds[0].walledgarden_port_list='443'

# ---------- commit e restart ----------
uci commit opennds
/etc/init.d/opennds restart

echo "------------------------------------------------------------"
echo "OpenNDS configurado."
echo "Gateway Name : $GATEWAY_NAME"
echo "gw_id / router_id : $GW_ID"
echo "FAS            : https://${FAS_FQDN}:${FAS_PORT}${FAS_PATH}"
echo "faskey (anote) : $FAS_KEY"
echo "Admin local    : http://${ADMIN_FQDN} (resolve para ${ROOT_LAN_IP})"
echo "------------------------------------------------------------"