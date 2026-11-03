# Gerador das telas web do canvas Design D (protótipo, descartável).
import re

LIGHT = dict(bg='#F6F7F9', sf='#FFFFFF', sf2='#F6F7F9', sf3='#ECEEF3', tx='#15171C', mu='#5B6170', mu2='#8A909C',
  bd='#ECEEF3', bd2='#C9CDD6', ac='#1F4FAE', lk='#1F4FAE', acs='#EEF3FB', okT='#057743', okB='#EEFBF2',
  drT='#815B04', drB='#FDF6EA', caT='#AA2E4A', caB='#FFF4F5', caBd='#FFE1E4', neT='#5B6170', neB='#ECEEF3',
  evT='#7347AF', ev5='#A06AEC', ev1='#EDE5FE', ev05='#F8F5FE', evL='#C9B6F2', sh='rgba(16,32,74,0.16)',
  scrim='rgba(21,23,28,0.45)', rsB='#FEE0EB', rsT='#A43068', tqB='#C8F3F5', tqT='#057176', ouB='#FAE7C8',
  ouT='#815B04', vdB='#D3F3DD', vdT='#057743', avB='#ECEEF3', saB='#DBE7FF', saT='#10204A', inv='#15171C', invT='#FFFFFF')
DARK = dict(bg='#0E1320', sf='#171D2B', sf2='#1C2333', sf3='#232B3D', tx='#F2F4F8', mu='#A7AEBD', mu2='#7D8597',
  bd='#232B3D', bd2='#3A4358', ac='#2F63C9', lk='#DBE7FF', acs='#142038', okT='#D3F3DD', okB='#0D3B3A',
  drT='#FAE7C8', drB='#3E2A00', caT='#FFE1E4', caB='#511522', caBd='#511522', neT='#A7AEBD', neB='#232B3D',
  evT='#EDE5FE', ev5='#A06AEC', ev1='#352053', ev05='#231638', evL='#4A3570', sh='rgba(0,0,0,0.45)',
  scrim='rgba(0,0,0,0.6)', rsB='#4E1530', rsT='#FEE0EB', tqB='#023538', tqT='#C8F3F5', ouB='#3E2A00',
  ouT='#FAE7C8', vdB='#0D3B3A', vdT='#D3F3DD', avB='#232B3D', saB='#10204A', saT='#DBE7FF', inv='#F2F4F8', invT='#15171C')
_TOK = re.compile(r'\$(' + '|'.join(sorted(LIGHT, key=len, reverse=True)) + r')\b')

def theme(html, dark=False):
  t = DARK if dark else LIGHT
  return _TOK.sub(lambda m: t[m.group(1)], html)

MONO = "font-family: 'IBM Plex Mono', monospace"
FILES = {}

def doc(title, root):
  return f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&amp;family=IBM+Plex+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
<style>
body{{margin:0}}
a{{color:$lk}}a:hover{{color:$lk}}
</style>
</helmet>
{root}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":%H%}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''

def add(name, title, root, h=1000, dark=False):
  html = doc('Web · ' + title, root).replace('%H%', str(h))
  FILES[name] = dict(html=theme(html, dark), title=title, h=h)

# ---------- ícones (traço) ----------
def ico(path, s=18, sw='1.8', color='currentColor'):
  return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{path}</svg>'
I_HOME = '<rect x="4" y="4" width="7" height="7" rx="1.5"></rect><rect x="13" y="4" width="7" height="4" rx="1.5"></rect><rect x="13" y="10" width="7" height="10" rx="1.5"></rect><rect x="4" y="13" width="7" height="7" rx="1.5"></rect>'
I_CAL = '<rect x="4" y="5" width="16" height="15" rx="2"></rect><path d="M4 10h16M9 3v4M15 3v4"></path>'
I_PPL = '<circle cx="9" cy="8" r="3.5"></circle><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.6-4.8-4-5.6"></path>'
I_GRID = '<path d="M4 6h16M4 12h16M4 18h16"></path><path d="M8 3v18"></path>'
I_CHEV = '<path d="M7 10l5 5 5-5"></path>'
I_SEARCH = '<circle cx="11" cy="11" r="6"></circle><path d="M20 20l-4.5-4.5"></path>'
I_BACK = '<path d="M15 5l-7 7 7 7"></path>'
I_GRIP = '<circle cx="9" cy="6" r="1"></circle><circle cx="15" cy="6" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="18" r="1"></circle><circle cx="15" cy="18" r="1"></circle>'
I_LOCK = '<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>'
I_PHONE = '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path>'
I_CHECK = '<path d="M5 12l5 5 9-10"></path>'
I_PEN = '<path d="M4 20h4L19 9l-4-4L4 16z"></path>'
I_SORT = '<path d="M8 4v16M8 4 4 8M8 4l4 4M16 20V4M16 20l-4-4M16 20l4-4"></path>'
I_BAN = '<circle cx="12" cy="12" r="9"></circle><path d="M8 8l8 8"></path>'
I_TRASH = '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"></path>'
I_COPY = '<rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"></path>'
I_WIFI = '<path d="M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M12 20h.01M3 3l18 18"></path>'
I_STAR = '<path d="M12 4l2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z"></path>'

def srl(t):  # texto só para leitor de tela
  return f'<span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">{t}</span>'

# ---------- peças ----------
BADGE = dict(ok=('$okT', '$okB'), dr=('$drT', '$drB'), ca=('$caT', '$caB'), ne=('$neT', '$neB'),
  ac=('$lk', '$acs'), sa=('$saT', '$saB'), co=('#AB331C', '#FFF4F2'))
def badge(text, k='ne', small=False):
  fg, bg = BADGE[k]
  fs = '10px' if small else '11px'
  return f'<span style="font-size: {fs}; font-weight: 700; letter-spacing: 0.02em; color: {fg}; background: {bg}; border-radius: 8px; padding: 3px 7px; white-space: nowrap">{text}</span>'

def btn(text, kind='pri', h=40, href=None, aria=None, extra=''):
  fs = '14px' if h >= 38 else '13px'
  base = f'height: {h}px; padding: 0 {16 if h >= 38 else 12}px; border-radius: {h//2}px; font: inherit; font-size: {fs}; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; text-decoration: none; box-sizing: border-box; '
  st = {
    'pri': 'border: 0; background: $ac; color: #FFFFFF; ',
    'sec': 'border: 1.5px solid $tx; background: $sf; color: $tx; ',
    'out': 'border: 1.5px solid $bd2; background: $sf; color: $tx; ',
    'dan': 'border: 1.5px solid $caBd; background: $sf; color: $caT; ',
    'danf': 'border: 0; background: #AA2E4A; color: #FFFFFF; ',
    'ghost': 'border: 0; background: transparent; color: $lk; ',
    'soft': 'border: 0; background: $acs; color: $lk; ',
    'dis': 'border: 0; background: $sf3; color: $mu2; ',
  }[kind]
  a = f' aria-label="{aria}"' if aria else ''
  if href:
    return f'<a href="{href}"{a} style="{base}{st}{extra}">{text}</a>'
  return f'<button{a} style="{base}{st}{extra}">{text}</button>'

def iconbtn(sym, aria, size=36, border=True):
  b = 'border: 1.5px solid $bd2; background: $sf;' if border else 'border: 0; background: transparent;'
  return f'<button aria-label="{aria}" style="width: {size}px; height: {size}px; border-radius: {size//2}px; {b} color: $mu; font: inherit; font-size: 18px; line-height: 1; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0">{sym}</button>'

TEAMS = {'Cantores': ('$rsB', '$rsT', '#DF4E92'), 'Banda': ('$tqB', '$tqT', '#069FA6'), 'Técnica': ('$ouB', '$ouT', '#B68103'), 'Produção': ('$vdB', '$vdT', '#1FB86A')}
def chip(team, n=None, sel=False, h=28):
  bg, fg, full = TEAMS[team]
  if sel:
    bg, fg = full, '#FFFFFF'
  cnt = f' <span style="{MONO}; font-weight: 400">{n}</span>' if n is not None else ''
  pre = '✓ ' if sel else ''
  return f'<span style="height: {h}px; padding: 0 {h//2 - 2}px; border-radius: {h//2}px; background: {bg}; color: {fg}; font-size: {13 if h < 34 else 14}px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap">{pre}{team}{cnt}</span>'

def av(ini, team=None, size=32, pending=False):
  ring = f' box-shadow: 0 0 0 2px {TEAMS[team][2]};' if team and not pending else ''
  if pending:
    return f'<span style="width: {size}px; height: {size}px; border-radius: 50%; background: $avB; border: 2px dashed $bd2; box-sizing: border-box; color: $mu; font-size: {max(10, size//3)}px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0">{ini}</span>'
  return f'<span style="width: {size}px; height: {size}px; border-radius: 50%; background: $avB; color: $tx;{ring} font-size: {max(10, size//3)}px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0">{ini}</span>'

def card(inner, pad='16px 20px', gap=12, extra=''):
  return f'<section style="background: $sf; border-radius: 24px; padding: {pad}; display: flex; flex-direction: column; gap: {gap}px; {extra}">{inner}</section>'

def h2(text, right='', dot=False):
  d = '<span style="color: $ev5">·</span>' if dot else ''
  return f'<div style="display: flex; align-items: center; gap: 10px"><h2 style="margin: 0; font-size: 18px; font-weight: 700; flex-grow: 1">{text}{d}</h2>{right}</div>'

def field(label, value='', ph='', focus=False, err=None, ro=False, w=None, mono=False):
  if ro:
    return f'<div style="background: $sf3; border-radius: 14px; padding: 8px 14px; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; font-weight: 600; color: $mu">{label}</span><span style="font-size: 15px; color: $mu">{value}</span></div>'
  bc = '$caT' if err else ('$ac' if focus else '$bd2')
  lc = '$caT' if err else ('$lk' if focus else '$mu')
  mf = f'{MONO}; ' if mono else ''
  e = f'<span style="font-size: 12px; color: $caT">{err}</span>' if err else ''
  return f'<div style="display: flex; flex-direction: column; gap: 4px"><label style="border: 1.5px solid {bc}; border-radius: 14px; padding: 8px 14px; display: flex; flex-direction: column; gap: 2px; background: $sf"><span style="font-size: 12px; font-weight: 600; color: {lc}">{label}</span><input value="{value}" placeholder="{ph}" style="{mf}border: 0; background: transparent; color: $tx; font: inherit; font-size: 15px; padding: 0; outline: none; min-width: 0"></label>{e}</div>'

def select(label, value):
  return f'<label style="border: 1.5px solid $bd2; border-radius: 14px; padding: 8px 14px; display: flex; align-items: center; gap: 8px; background: $sf"><span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; font-weight: 600; color: $mu">{label}</span><span style="font-size: 15px">{value}</span></span>{ico(I_CHEV, 16, "2", "$mu")}</label>'

def seg(opts, i=0, h=36):
  out = []
  for k, o in enumerate(opts):
    on = k == i
    st = 'background: $ac; color: #FFFFFF; font-weight: 600;' if on else 'background: transparent; color: $mu;'
    out.append(f'<button role="radio" aria-checked="{"true" if on else "false"}" style="height: {h}px; padding: 0 14px; border-radius: {h//2}px; border: 0; {st} font: inherit; font-size: 13px">{o}</button>')
  return f'<div role="radiogroup" style="display: inline-flex; background: $sf2; border-radius: {h//2 + 4}px; padding: 4px; gap: 2px">{"".join(out)}</div>'

def searchbox(ph, w='280px'):
  return f'<label style="flex: 0 1 {w}; height: 38px; border: 1.5px solid $bd2; border-radius: 19px; padding: 0 14px; display: flex; align-items: center; gap: 8px; background: $sf">{ico(I_SEARCH, 16, "2", "$mu")}{srl(ph)}<input placeholder="{ph}" style="border: 0; background: transparent; color: $tx; font: inherit; font-size: 14px; outline: none; width: 100%"></label>'

def filt(text, on=False):
  st = 'border: 0; background: $inv; color: $invT; font-weight: 600;' if on else 'border: 1.5px solid $bd2; background: $sf; color: $mu;'
  return f'<button aria-pressed="{"true" if on else "false"}" style="height: 34px; padding: 0 14px; border-radius: 17px; {st} font: inherit; font-size: 13px; white-space: nowrap">{text}</button>'

def checkbox(on, label):
  return f'<input type="checkbox" {"checked " if on else ""}aria-label="{label}" style="width: 20px; height: 20px; accent-color: $ac; margin: 0">'

def stat(label, n, b='', k='ne', href='#'):
  bb = badge(b, k) if b else ''
  return f'<a href="{href}" style="text-decoration: none; color: $tx; background: $sf; border-radius: 20px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px"><span style="font-size: 13px; color: $mu">{label}</span><span style="display: flex; align-items: baseline; gap: 10px"><span style="{MONO}; font-size: 30px; font-weight: 500; line-height: 1">{n}</span>{bb}</span></a>'

def stats(items):
  return f'<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px">{"".join(stat(*i) for i in items)}</div>'

def banner(text, k='dr', action=''):
  fg, bg = BADGE[k]
  return f'<div role="status" style="background: {bg}; color: {fg}; border-radius: 18px; padding: 12px 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; font-size: 14px; font-weight: 500"><span style="flex: 1 1 300px">{text}</span>{action}</div>'

def dl(rows, lw=120):
  out = ''.join(f'<dt style="color: $mu">{k}</dt><dd style="margin: 0; font-weight: 500">{v}</dd>' for k, v in rows)
  return f'<dl style="margin: 0; display: grid; grid-template-columns: {lw}px 1fr; row-gap: 10px; column-gap: 12px; font-size: 14px">{out}</dl>'

# ---------- casca ----------
USERS = {
  'owner': dict(ini='BR', name='Bruno Reis', bg='$ouB', fg='$ouT', role='Owner'),
  'viewer': dict(ini='LU', name='Lu Andrade', bg='$rsB', fg='$rsT', role='Viewer'),
  'sa': dict(ini='MC', name='Marina Costa', bg='$saB', fg='$saT', role='Owner'),
}
NAV = [('inicio', 'Início', I_HOME), ('events', 'Events', I_CAL), ('pessoas', 'Pessoas', I_PPL)]

def navlink(key, label, icon, active, href):
  if key == active:
    return f'<a href="{href}" aria-current="page" style="text-decoration: none; height: 40px; padding: 0 12px; border-radius: 20px; background: $ac; color: #FFFFFF; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 10px">{ico(icon)}{label}</a>'
  return f'<a href="{href}" style="text-decoration: none; height: 40px; padding: 0 12px; border-radius: 20px; color: $mu; font-size: 15px; display: flex; align-items: center; gap: 10px">{ico(icon)}{label}</a>'

def sidebar(active, who='owner', group=('VL', 'Vocal Livre'), open_switch=False, no_group=False):
  u = USERS[who]
  hrefs = {'inicio': 'W-Inicio.dc.html' if who != 'viewer' else 'W-Viewer-Inicio.dc.html',
           'events': 'W-Events.dc.html' if who != 'viewer' else 'W-Viewer-Events.dc.html',
           'pessoas': 'W-Pessoas.dc.html'}
  if no_group:
    sel = f'<div style="display: flex; align-items: center; gap: 10px; padding: 8px; border: 1.5px dashed $bd2; border-radius: 14px; margin-bottom: 12px"><span style="width: 36px; height: 36px; border-radius: 11px; background: $sf3; flex-shrink: 0"></span><span style="font-size: 14px; color: $mu">Sem Group</span></div>'
    links = ''
  else:
    sel = f'<a href="W-TrocarGroup.dc.html" aria-expanded="{"true" if open_switch else "false"}" style="text-decoration: none; color: $tx; display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid {"$ac" if open_switch else "$bd"}; border-radius: 14px; background: $sf; margin-bottom: 12px"><span style="width: 36px; height: 36px; border-radius: 11px; background: #1F4FAE; color: #FFFFFF; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0">{group[0]}</span><span style="flex-grow: 1; display: flex; flex-direction: column"><span style="font-size: 15px; font-weight: 700">{group[1]}</span><span style="font-size: 12px; color: $mu">{u["role"]}</span></span>{ico(I_CHEV, 16, "2", "$mu")}</a>'
    links = ''.join(navlink(k, l, i, active, hrefs[k]) for k, l, i in NAV)
  sa = ''
  if who == 'sa':
    sa = f'<span style="margin: 18px 12px 6px; font-size: 12px; font-weight: 700; color: $mu; letter-spacing: 0.04em">PLATAFORMA</span>' + navlink('groups', 'Groups', I_GRID, active, 'W-Admin-Groups.dc.html')
  prof_on = active == 'perfil'
  pbg = 'background: $acs;' if prof_on else ''
  return f'''<nav aria-label="Navegação principal" style="flex: 1 1 232px; max-width: 248px; box-sizing: border-box; background: $sf; border-right: 1px solid $bd; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px">
{sel}{links}{sa}
<span style="flex-grow: 1; min-height: 24px"></span>
<a href="W-Perfil.dc.html"{' aria-current="page"' if prof_on else ''} style="text-decoration: none; padding: 8px; border-radius: 12px; {pbg} color: $tx; display: flex; align-items: center; gap: 10px"><span style="width: 32px; height: 32px; border-radius: 10px; background: {u["bg"]}; color: {u["fg"]}; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center">{u["ini"]}</span><span style="display: flex; flex-direction: column"><span style="font-size: 14px; font-weight: 600">{u["name"]}</span><span style="font-size: 12px; color: $mu">Perfil</span></span></a>
<button style="height: 36px; padding: 0 12px; border: 0; background: transparent; color: $mu; font: inherit; font-size: 14px; text-align: left">Sair</button>
</nav>'''

def shell(body, active='events', who='owner', panel=None, overlay=None, **kw):
  if panel:
    body = f'<div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start"><div style="flex: 999 1 460px; min-width: 0; display: flex; flex-direction: column; gap: 14px">{body}</div>{panel}</div>'
  ov = overlay or ''
  return f'''<div style="position: relative; min-height: 1000px; display: flex; flex-wrap: wrap; background: $bg; font-family: Outfit, system-ui, sans-serif; color: $tx">
{sidebar(active, who, **kw)}
<main style="flex: 999 1 560px; min-width: 0; padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; gap: 14px">
{body}
</main>
{ov}
</div>'''

def page_header(title, sub='', actions='', crumb='', pre='', dot='$ac'):
  c = f'<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: $mu">{crumb}</div>' if crumb else ''
  s = f'<span style="font-size: 14px; color: $mu">{sub}</span>' if sub else ''
  return f'<header style="background: $sf; border-radius: 24px; padding: 16px 20px; display: flex; flex-wrap: wrap; align-items: center; gap: 16px">{pre}<div style="flex: 1 1 340px; display: flex; flex-direction: column; gap: 4px">{c}<h1 style="margin: 0; font-size: 28px; font-weight: 700">{title}<span style="color: {dot}">·</span></h1>{s}</div><div style="display: flex; gap: 8px; flex-wrap: wrap">{actions}</div></header>'

def panel(title, body, top='', foot='', back=None, ctx='', w=540):
  b = f'<a href="{back}" style="text-decoration: none; color: $lk; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px">{ico(I_BACK, 16, "2")}Voltar</a>' if back else f'<span style="font-size: 13px; color: $mu">{ctx}</span>'
  f = f'<div style="padding: 14px 20px; border-top: 1px solid $bd; display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap">{foot}</div>' if foot else ''
  return f'''<aside aria-label="{title}" style="flex: 1 1 400px; max-width: {w}px; background: $sf; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 48px -24px $sh; display: flex; flex-direction: column">
<div style="padding: 14px 20px; border-bottom: 1px solid $bd; display: flex; align-items: center; gap: 8px"><span style="flex-grow: 1">{b}</span>{top}{iconbtn("×", "Fechar", 36, False)}</div>
<div style="padding: 20px; display: flex; flex-direction: column; gap: 16px"><h2 style="margin: 0; font-size: 24px; font-weight: 700; line-height: 1.15">{title}</h2>{body}</div>
{f}
</aside>'''

def scrim_dialog(title, text, actions):
  return f'''<div style="position: absolute; inset: 0; background: $scrim; display: flex; align-items: flex-start; justify-content: center; padding-top: 180px">
<div role="dialog" aria-label="{title}" style="width: 460px; max-width: calc(100% - 32px); background: $sf; border-radius: 28px; padding: 24px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 30px 60px -20px rgba(0,0,0,0.5)">
<h2 style="margin: 0; font-size: 22px; font-weight: 700">{title}</h2><p style="margin: 0; font-size: 15px; color: $mu; line-height: 1.5">{text}</p><div style="display: flex; justify-content: flex-end; gap: 8px">{actions}</div></div></div>'''
