# api/core/timewin.py
from datetime import datetime, time
from typing import Tuple
from zoneinfo import ZoneInfo

def parse_window(window: str) -> Tuple[time, time]:
    """
    Converte "07:00-21:00" -> (time(7,0), time(21,0))
    """
    start_s, end_s = window.split("-")
    h1, m1 = [int(x) for x in start_s.split(":")]
    h2, m2 = [int(x) for x in end_s.split(":")]
    return time(h1, m1), time(h2, m2)

def is_within_window(now: datetime, window: str, tz: ZoneInfo) -> bool:
    """
    Checa se 'now' (na timezone tz) está dentro da janela "HH:MM-HH:MM".
    """
    local = now.astimezone(tz)
    start_t, end_t = parse_window(window)
    cur_t = local.time()
    return start_t <= cur_t <= end_t

def normalize_mac(v: str) -> str:
    """
    Normaliza MAC p/ minúsculo com ':' (ex.: 'AA-BB' -> 'aa:bb').
    """
    if not v:
        return v
    return v.strip().lower().replace("-", ":")
