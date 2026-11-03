from lib import *

EV = dict(name='Saída Manaus', place='Manaus, AM', period='sex 20 a dom 22 de nov. de 2026', tz='horário de Manaus (UTC−4)',
  cover='linear-gradient(135deg, #352053, #A06AEC)')

# (hora, fuso, nome, sub, lugar, quem vê, estado, alterado, flags)
DAYS = [
  ('Informações gerais', 'info', [
    ('', '', 'Hospedagem', 'Hotel Taj Mahal, quartos por Team', 'Hotel Taj Mahal', 'Todos', '', 'há 3 dias', 'hl'),
    ('', '', 'Contatos da produção', 'Bruno, Carla e motoristas', '', 'Todos', '', 'há 3 dias', ''),
  ]),
  ('Sex 20/11', 'sex', [
    ('05:30', 'Vitória', 'Saída da sede', 'Ônibus até o aeroporto', 'Sede, Vitória', 'Todos', '', 'há 3 dias', ''),
    ('08:10', 'Vitória', 'Voo VIX → MAO', 'Chega 13:20 (Manaus) · QX7P2M', 'Aeroporto de Vitória', 'Todos', '', 'ontem', 'hl'),
    ('14:30', '', 'Check-in · Hotel Taj Mahal', 'Quartos por Team', 'Hotel Taj Mahal', 'Todos', '', 'há 3 dias', ''),
  ]),
  ('Sáb 21/11', 'sab', [
    ('', '', 'Almoço', 'Horário a confirmar', 'Hotel', 'Todos', '', 'ontem', ''),
    ('10:00', '', 'Entrevista na rádio', 'Rádio Difusora', 'Rádio Difusora', 'Cantores', 'CANCELADO', 'ontem', ''),
    ('16:00', '', 'Passagem de som', 'Chegar 15:45', 'Teatro Amazonas', 'Banda, Técnica', '', 'há 2 h', ''),
    ('19:00', '', 'Show', 'Figurino azul · chegar 18:00', 'Teatro Amazonas', 'Todos', '', 'há 3 dias', 'hl'),
    ('19:00', '', 'Transmissão ao vivo', 'Câmeras e redes', 'Teatro Amazonas', 'Produção', '', 'há 3 dias', ''),
    ('21:30', '', 'Desmontagem', 'Equipe técnica', 'Teatro Amazonas', 'Técnica', 'RASCUNHO', 'há 20 min', ''),
  ]),
  ('Dom 22/11', 'dom', [
    ('00:40', '', 'Translado de volta', 'Carros · 3 grupos', 'Teatro → Hotel', 'Todos', '', 'há 2 h', 'hl'),
    ('11:00', '', 'Check-out', 'Até 11:00', 'Hotel Taj Mahal', 'Todos', '', 'há 3 dias', ''),
    ('14:05', '', 'Voo MAO → VIX', 'LA3343 · QX7P2M', 'Aeroporto de Manaus', 'Todos', '', 'ontem', ''),
  ]),
  ('Fora do período', 'fora', [
    ('20:00', 'Vitória', 'Jantar de encerramento', 'Seg 23/11, depois do Event', 'Vitória', 'Produção', 'FORA DO PERÍODO', 'há 1 dia', ''),
  ]),
]
# Programação de Lu (Cantores): o que alcança a Viewer
LU_HIDE = {'Passagem de som', 'Desmontagem', 'Transmissão ao vivo', 'Jantar de encerramento', 'Contatos da produção'}

BK = {'RASCUNHO': 'dr', 'CANCELADO': 'ca', 'FORA DO PERÍODO': 'ne', 'PUBLICADO': 'ok'}

def tabs(cur, who='owner'):
  if who == 'owner':
    t = [('Visão geral', 'W-Event-Visao'), ('Programação', 'W-Event-Programacao'), ('Timeline', 'W-Event-Timeline'), ('Resumo', 'W-Event-Resumo'), ('Participants <span style="' + MONO + '; font-weight: 400">24</span>', 'W-Event-Participants')]
  else:
    t = [('Resumo', 'W-Viewer-Resumo'), ('Programação', 'W-Viewer-Programacao'), ('Participants <span style="' + MONO + '; font-weight: 400">24</span>', 'W-Viewer-NaoVai')]
  out = []
  for label, f in t:
    on = label.startswith(cur)
    st = 'background: $ac; color: #FFFFFF; font-weight: 600;' if on else 'color: $mu;'
    out.append(f'<a href="{f}.dc.html" role="tab" aria-selected="{"true" if on else "false"}" style="text-decoration: none; height: 36px; padding: 0 14px; border-radius: 16px; {st} font-size: 14px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap">{label}</a>')
  return f'<div role="tablist" style="display: flex; flex-wrap: wrap; background: $sf2; border-radius: 20px; padding: 4px; gap: 2px">{"".join(out)}</div>'

def ev_header(tab, who='owner', status='PUBLICADO', actions=None, name=None, cover=None, place=None, period=None, extra_badge='', tz=None):
  name = name or EV['name']; cover = cover or EV['cover']
  if actions is None:
    actions = btn('Editar Event', 'sec', href='W-Event-Editar.dc.html') + btn('Cancelar Event', 'dan', href='W-Event-CancelarConfirma.dc.html') if who == 'owner' else ''
  b = badge(status, BK.get(status, 'ok')) if status else ''
  ev = f'<a href="W-Events.dc.html" style="color: $mu">Events</a>' if who == 'owner' else f'<a href="W-Viewer-Events.dc.html" style="color: $mu">Events</a>'
  return f'''<header style="background: $sf; border-radius: 24px; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px">
<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px">
<span aria-hidden="true" style="width: 52px; height: 52px; border-radius: 16px; background: {cover}; flex-shrink: 0"></span>
<div style="flex: 1 1 340px; display: flex; flex-direction: column; gap: 4px">
<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: $mu">{ev}<span aria-hidden="true">/</span>{b}{extra_badge}</div>
<h1 style="margin: 0; font-size: 28px; font-weight: 700">{name}<span style="color: $ev5">·</span></h1>
<span style="font-size: 14px; color: $mu">{place or EV["place"]} <span aria-hidden="true">·</span> {period or EV["period"]} <span aria-hidden="true">·</span> {tz or EV["tz"]}</span>
</div>
<div style="display: flex; gap: 8px; flex-wrap: wrap">{actions}</div>
</div>
{tabs(tab, who)}
</header>'''

COLS = 'grid-template-columns: 64px 80px minmax(200px, 2fr) minmax(140px, 1.3fr) 120px 130px 96px 40px'

def _time(t, off):
  if not t:
    return f'<span style="font-size: 12px; color: $mu">sem hora</span>'
  st = ' color: $mu2; text-decoration: line-through;' if off else ''
  return f'<span style="{MONO}; font-size: 14px; font-weight: 500;{st}">{t}</span>'

def _name(n, off, sub=None):
  st = ' color: $mu; text-decoration: line-through;' if off else ''
  s = f'<span style="font-size: 12px; color: $mu; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{sub}</span>' if sub else ''
  return f'<span style="display: flex; flex-direction: column; min-width: 0"><span style="font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;{st}">{n}</span>{s}</span>'

MENU = f'''<div role="menu" aria-label="Ações do item" style="position: absolute; right: 16px; top: 42px; z-index: 2; width: 260px; background: $sf; border: 1px solid $bd; border-radius: 16px; padding: 6px; box-shadow: 0 18px 40px -16px $sh; display: flex; flex-direction: column">
<span style="padding: 8px 10px; font-size: 12px; color: $mu; border-bottom: 1px solid $bd; margin-bottom: 4px">Bruno mudou a hora de 15:00 para 16:00, há 2 h</span>
<a href="W-Event-ItemEditar.dc.html" role="menuitem" style="text-decoration: none; height: 36px; padding: 0 10px; border-radius: 10px; background: $acs; color: $tx; font-size: 14px; display: flex; align-items: center; gap: 10px">{ico(I_PEN, 16, "1.8", "$lk")}Editar</a>
<a href="W-Event-Ordenar.dc.html" role="menuitem" style="text-decoration: none; height: 36px; padding: 0 10px; border-radius: 10px; color: $tx; font-size: 14px; display: flex; align-items: center; gap: 10px">{ico(I_SORT, 16, "1.8", "$lk")}Mudar a ordem</a>
<button role="menuitem" style="height: 36px; padding: 0 10px; border: 0; border-radius: 10px; background: transparent; color: $caT; font: inherit; font-size: 14px; display: flex; align-items: center; gap: 10px">{ico(I_BAN, 16)}Cancelar item</button>
<button role="menuitem" style="height: 36px; padding: 0 10px; border: 0; border-radius: 10px; background: transparent; color: $caT; font: inherit; font-size: 14px; display: flex; align-items: center; gap: 10px">{ico(I_TRASH, 16)}Apagar</button>
</div>'''

def prog_table(menu_on=None, frozen=False, viewer=False, only=None):
  head = ''.join(f'<span role="columnheader">{h}</span>' for h in ['Hora', 'Fuso', 'Item', 'Lugar', 'Quem vê', 'Estado', 'Alterado']) + f'<span role="columnheader">{srl("Ações")}</span>'
  rows = [f'<div role="row" style="display: grid; {COLS}; gap: 12px; padding: 10px 16px; background: $sf2; font-size: 12px; font-weight: 600; color: $mu">{head}</div>']
  for title, key, items in DAYS:
    if only and key not in only:
      continue
    act = '' if (frozen or viewer) else f'{btn("Ordenar", "ghost", 28, href="W-Event-Ordenar.dc.html")}{btn("+ Item", "ghost", 28, href="W-Event-ItemEditar.dc.html")}'
    rows.append(f'<div role="row" style="display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-top: 1px solid $bd; background: $sf"><span aria-hidden="true" style="width: 4px; height: 16px; border-radius: 2px; background: $ev5"></span><span role="rowheader" style="font-size: 13px; font-weight: 700; flex-grow: 1">{title} <span style="font-weight: 400; color: $mu">{len(items)}</span></span>{act}</div>')
    for (t, tz, n, sub, pl, aud, st, ch, fl) in items:
      off = st == 'CANCELADO' or frozen
      m = menu_on == n
      bg = ' background: $sf2;' if m else ''
      stc = badge(st, BK[st]) if st else f'<span style="font-size: 13px; color: $mu">Publicado</span>'
      tzc = f'<span style="font-size: 12px; font-weight: 700; color: $evT">{tz}</span>' if tz else '<span style="font-size: 12px; color: $mu2">Manaus</span>'
      more = '' if viewer else (f'<button aria-label="Ações do item" style="width: 32px; height: 32px; border-radius: 16px; font: inherit; font-size: 18px; line-height: 1; color: $mu; ' + ('border: 1.5px solid $ac; background: $sf;' if m else 'border: 0; background: transparent;') + '">⋯</button>')
      rows.append(f'<div role="row" style="position: relative; display: grid; {COLS}; gap: 12px; align-items: center; padding: 0 16px; height: 46px; border-top: 1px solid $sf2;{bg}">{_time(t, off)}{tzc}<a href="{"W-Viewer-Item" if viewer else "W-Event-Item"}.dc.html" style="text-decoration: none; color: $tx; min-width: 0">{_name(n, off)}</a><span style="font-size: 13px; color: $mu; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{pl}</span><span style="font-size: 13px; color: $mu">{aud}</span><span>{stc}</span><span style="font-size: 12px; color: $mu; white-space: nowrap">{ch}</span><span>{more}</span>{MENU if m else ""}</div>')
  return f'<div style="background: $sf; border-radius: 24px; padding: 4px; overflow-x: auto"><div role="table" aria-label="Programação" style="min-width: 940px; border-radius: 20px; overflow: hidden">{"".join(rows)}</div></div>'

def prog_toolbar():
  return f'<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">{searchbox("Buscar item")}{filt("Tudo", True)}{filt("Rascunho")}{filt("Cancelados")}{filt("Sem hora")}<span style="flex-grow: 1"></span>{btn("+ Item", "pri", href="W-Event-ItemEditar.dc.html")}</div>'

def prog_compact(selected=None, viewer=False):
  out = []
  for title, key, items in DAYS:
    rs = []
    for (t, tz, n, sub, pl, aud, st, ch, fl) in items:
      if viewer and n in LU_HIDE:
        continue
      off = st == 'CANCELADO'
      sel = n == selected
      bg = ' background: $ev05; box-shadow: inset 3px 0 0 $ev5;' if sel else ''
      b = badge(st, BK[st], True) if st else ''
      tzs = f'<span style="font-size: 11px; font-weight: 700; color: $evT">{tz}</span>' if tz else ''
      rs.append(f'<a href="{"W-Viewer-Item" if viewer else "W-Event-Item"}.dc.html" style="text-decoration: none; color: $tx; display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 8px 16px; border-top: 1px solid $sf2;{bg}"><span style="display: flex; flex-direction: column">{_time(t, off)}{tzs}</span>{_name(n, off, sub)}<span>{b}</span></a>')
    if rs:
      out.append(f'<div style="background: $sf; border-radius: 20px; overflow: hidden"><div style="padding: 10px 16px; font-size: 14px; font-weight: 700">{title}<span style="color: $ev5">·</span></div>{"".join(rs)}</div>')
  return f'<div style="display: flex; flex-direction: column; gap: 12px">{"".join(out)}</div>'

def timeline_cols(viewer=False, frozen=False):
  cols = []
  meta = {'info': ('Event', 'Geral', 'Informações gerais'), 'sex': ('sex', '20', 'Saída'), 'sab': ('sáb', '21', 'Show'), 'dom': ('dom', '22', 'Volta'), 'fora': ('', 'Fora', 'Fora do período do Event')}
  for title, key, items in DAYS:
    if viewer and key == 'fora':
      continue
    dow, day, note = meta[key]
    its = []
    for (t, tz, n, sub, pl, aud, st, ch, fl) in items:
      if viewer and n in LU_HIDE:
        continue
      off = st == 'CANCELADO' or frozen
      dashed = (not t) or st == 'RASCUNHO'
      dot = 'background: $sf3; border: 2.5px solid $bd2;' if off else ('background: $sf2; border: 2px dashed $ev5;' if dashed else 'background: $sf; border: 2.5px solid $ev5;')
      cardst = 'background: $sf3; border: 0;' if off else ('background: $sf; border: 1.5px dashed $bd2;' if dashed else 'background: $sf; border: 1px solid $bd;')
      b = badge(st, BK[st], True) if st else ''
      tzs = f'<span style="font-size: 11px; font-weight: 700; color: $evT">{tz}</span>' if tz else ''
      tm = f'<span style="{MONO}; font-size: 13px; font-weight: 500;{" color: $mu2; text-decoration: line-through;" if off else ""}">{t}</span>' if t else '<span style="font-size: 11px; color: $mu">sem hora</span>'
      nm = f'<span style="font-size: 14px; font-weight: 600; line-height: 1.25;{" color: $mu; text-decoration: line-through;" if off else ""}">{n}</span>'
      its.append(f'<div style="position: relative; display: flex; gap: 10px; align-items: flex-start"><span style="width: 12px; height: 12px; margin-top: 12px; border-radius: 50%; flex-shrink: 0; box-sizing: border-box; {dot}"></span><a href="{"W-Viewer-Item" if viewer else "W-Event-Item"}.dc.html" style="text-decoration: none; color: $tx; flex-grow: 1; min-width: 0; border-radius: 14px; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; {cardst}"><span style="display: flex; align-items: center; gap: 6px">{tm}{tzs}<span style="flex-grow: 1"></span>{b}</span>{nm}<span style="font-size: 12px; color: $mu">{aud} · {pl or sub}</span></a></div>')
    info = key == 'info'; out = key == 'fora'
    head = 'background: ' + EV['cover'] + '; color: #FFFFFF;' if info else 'background: $sf;'
    subc = '#EDE5FE' if info else '$mu'
    box = 'background: transparent; border: 1.5px dashed $bd2;' if out else 'background: $sf3;'
    add_btn = '' if (viewer or frozen) else f'<a href="W-Event-ItemEditar.dc.html" style="text-decoration: none; margin-left: 22px; height: 34px; border-radius: 17px; border: 1.5px dashed $bd2; color: $lk; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center">+ Item</a>'
    cols.append(f'<section style="border-radius: 20px; overflow: hidden; {box}"><div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; {head}"><div style="display: flex; align-items: baseline; gap: 8px"><span style="font-size: 13px; color: {subc}">{dow}</span><span style="font-size: 26px; font-weight: 700; line-height: 1">{day}</span><span style="flex-grow: 1"></span><span style="{MONO}; font-size: 12px; color: {subc}">{len(its)}</span></div><span style="font-size: 12px; color: {subc}">{note}</span></div><div style="position: relative; padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 8px"><span aria-hidden="true" style="position: absolute; left: 17px; top: 14px; bottom: 30px; border-left: 2px dashed $evL"></span>{"".join(its)}{add_btn}</div></section>')
  n = len(cols)
  return f'<div style="overflow-x: auto"><div style="display: grid; grid-template-columns: repeat({n}, minmax(220px, 1fr)); gap: 12px; min-width: {n * 232}px; align-items: start">{"".join(cols)}</div></div>'
