from lib import *
from event import *

# ---------- Início (Owner) ----------
AGENDA = [
  ('OUTUBRO', None),
  (('dom', '25/10', 'Ensaio da Banda', '1 dia', 'Sede, Vitória', '#DF4E92', 'PASSADO', '8', '12'), None),
  ('NOVEMBRO', None),
  (('qui', '05/11', 'Ensaio geral', '1 dia', 'Sede, Vitória', '#B68103', 'PUBLICADO', '31', '4'), None),
  (('sex', '20/11', 'Saída Manaus', '3 dias', 'Manaus, AM', '#A06AEC', 'PUBLICADO', '24', '14'), None),
  (('sáb', '28/11', 'Festival de Verão', '1 dia', 'Vila Velha, ES', '#069FA6', 'CANCELADO', '18', '6'), None),
  ('DEZEMBRO', None),
  (('sáb', '12/12', 'Natal na Praça', '1 dia', 'Vitória, ES', '#EF5A3C', 'RASCUNHO', '20', '3'), None),
  ('JANEIRO DE 2027', None),
  (('sex', '15/01', 'Turnê Sul', '5 dias', 'Curitiba e Porto Alegre', '#1FB86A', 'RASCUNHO', '14', '0'), None),
]
SB = {'PUBLICADO': 'ok', 'RASCUNHO': 'dr', 'CANCELADO': 'ca', 'PASSADO': 'ne'}

def agenda(viewer=False):
  rows = []
  for e, _ in AGENDA:
    if isinstance(e, str):
      rows.append(f'<span style="margin: 8px 0 2px; font-size: 12px; font-weight: 700; color: $mu; letter-spacing: 0.04em">{e}</span>')
      continue
    dow, date, name, span, place, color, st, np, ni = e
    if viewer and st == 'RASCUNHO':
      continue
    off = st in ('CANCELADO', 'PASSADO'); dr = st == 'RASCUNHO'
    dot = 'background: $sf3; border: 2.5px solid $bd2' if off else (f'background: $sf; border: 2px dashed {color}' if dr else f'background: {color}; border: 2.5px solid {color}')
    nst = ' color: $mu; text-decoration: line-through;' if st == 'CANCELADO' else (' color: $mu;' if st == 'PASSADO' else '')
    if viewer:
      goes = name in ('Ensaio geral', 'Saída Manaus', 'Festival de Verão')
      right = badge('VOCÊ VAI', 'ok') if goes and not off else (badge(st, SB[st]) if off else badge('VOCÊ NÃO VAI', 'ne'))
      href = 'W-Viewer-Resumo.dc.html' if name == 'Saída Manaus' else ('W-Viewer-NaoVai.dc.html' if not goes else '#')
      cols = 'grid-template-columns: 72px 16px minmax(160px, 1fr) minmax(120px, 0.8fr) 130px'
      mid = ''
    else:
      right = badge(st, SB[st])
      href = 'W-Event-Visao.dc.html' if name == 'Saída Manaus' else ('W-Event-Rascunho.dc.html' if name == 'Natal na Praça' else '#')
      cols = 'grid-template-columns: 72px 16px minmax(160px, 1fr) minmax(120px, 0.8fr) 110px 110px'
      mid = f'<span style="font-size: 13px; color: $mu"><span style="{MONO}">{np}</span> pessoas · <span style="{MONO}">{ni}</span> itens</span>'
    rows.append(f'<a href="{href}" style="text-decoration: none; color: $tx; position: relative; display: grid; {cols}; gap: 12px; align-items: center; min-height: 52px; padding: 4px 8px; border-radius: 14px"><span style="display: flex; flex-direction: column; align-items: flex-end"><span style="font-size: 12px; color: $mu">{dow}</span><span style="{MONO}; font-size: 15px; font-weight: 500">{date}</span></span><span style="width: 14px; height: 14px; border-radius: 50%; box-sizing: border-box; position: relative; {dot}"></span><span style="display: flex; flex-direction: column; min-width: 0"><span style="font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;{nst}">{name}</span><span style="font-size: 12px; color: $mu">{span}</span></span><span style="font-size: 13px; color: $mu; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{place}</span>{mid}<span style="justify-self: end">{right}</span></a>')
  return f'<div style="position: relative; display: flex; flex-direction: column; gap: 4px"><span aria-hidden="true" style="position: absolute; left: 93px; top: 18px; bottom: 18px; border-left: 2px dashed $bd2"></span>{"".join(rows)}</div>'

def next_trip(viewer=False):
  pills = ['Programação', 'Timeline', 'Participants'] if not viewer else ['Resumo', 'Minha programação']
  href = 'W-Event-Visao.dc.html' if not viewer else 'W-Viewer-Resumo.dc.html'
  ps = ''.join(f'<span style="height: 36px; padding: 0 14px; border-radius: 18px; background: {"#FFFFFF; color: #352053" if i == 0 else "rgba(255,255,255,0.16)"}; font-size: 14px; font-weight: 600; display: flex; align-items: center">{p}</span>' for i, p in enumerate(pills))
  vb = '<span style="align-self: flex-start; font-size: 11px; font-weight: 700; color: #057743; background: #EEFBF2; border-radius: 8px; padding: 3px 7px">VOCÊ VAI</span>' if viewer else ''
  nxt = '<span style="font-size: 14px; color: #EDE5FE">Seu primeiro item: <strong style="color: #FFFFFF">Saída da sede, sex 20, 05:30</strong> (horário de Vitória)</span>' if viewer else '<span style="font-size: 14px; color: #EDE5FE"><span style="' + MONO + '">24</span> Participants · <span style="' + MONO + '">14</span> itens · <span style="' + MONO + '">1</span> em rascunho</span>'
  return f'''<a href="{href}" style="text-decoration: none; color: #FFFFFF; border-radius: 24px; background: linear-gradient(120deg, #352053, #A06AEC); padding: 20px 22px; display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end">
<div style="flex: 1 1 300px; display: flex; flex-direction: column; gap: 6px">{vb}<span style="font-size: 13px; color: #EDE5FE">Próxima viagem</span><span style="font-size: 30px; font-weight: 700; line-height: 1.1">Saída Manaus</span><span style="font-size: 15px; color: #EDE5FE">Manaus, AM <span aria-hidden="true">·</span> sex 20 a dom 22 de nov. <span aria-hidden="true">·</span> horário de Manaus</span>{nxt}</div>
<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px"><span style="{MONO}; font-size: 40px; font-weight: 500; line-height: 1">18</span><span style="font-size: 13px; color: #EDE5FE">dias para começar</span></div>
<div style="flex-basis: 100%; display: flex; gap: 8px; flex-wrap: wrap">{ps}</div></a>'''

def inicio_owner(dark=False, name='W-Inicio', title='Início do Group (Owner)'):
  drafts = ''.join(f'<div style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1.5px dashed $bd2; border-radius: 16px"><span style="width: 6px; align-self: stretch; border-radius: 3px; background: {c}"></span><span style="flex-grow: 1; display: flex; flex-direction: column; min-width: 0"><span style="font-size: 15px; font-weight: 600">{n}</span><span style="font-size: 12px; color: $mu">{w}</span></span>{btn("Abrir", "pri", 32, href="W-Event-Rascunho.dc.html")}</div>' for n, w, c in [('Natal na Praça', 'sáb 12/12 · Vitória · 3 itens', '#EF5A3C'), ('Turnê Sul', '15 a 19/01/2027 · sem itens ainda', '#1FB86A')])
  inv = ''.join(f'<div style="display: flex; align-items: center; gap: 12px; min-height: 48px">{av(i, pending=True, size=36)}<span style="flex-grow: 1; display: flex; flex-direction: column; min-width: 0"><span style="font-size: 14px; font-weight: 600">{n}</span><span style="font-size: 12px; color: $mu">{t} · convidado {a}</span></span>{btn("Copiar link", "out", 32, href="W-Convite.dc.html")}</div>' for i, n, t, a in [('TS', 'Tiago Souza', 'Banda', 'há 5 dias'), ('PM', 'Paulo Mendes', 'Técnica', 'há 2 dias'), ('CD', 'Carla Dias', 'Produção', 'ontem')])
  changes = ''.join(f'<div style="display: flex; gap: 10px; align-items: flex-start; font-size: 14px">{av(i, size=28)}<span style="flex-grow: 1; line-height: 1.4"><strong>{w}</strong> {t}<br><span style="font-size: 12px; color: $mu">{e} · {q}</span></span></div>' for i, w, t, e, q in [('BR', 'Bruno', 'mudou a hora de Passagem de som', 'Saída Manaus', 'há 2 h'), ('CD', 'Carla', 'criou Desmontagem como rascunho', 'Saída Manaus', 'há 20 min'), ('BR', 'Bruno', 'cancelou Entrevista na rádio', 'Saída Manaus', 'ontem'), ('BR', 'Bruno', 'cancelou o Event Festival de Verão', 'Festival de Verão', 'há 3 dias')])
  body = page_header('Olá, Bruno', 'Vocal Livre: 31 pessoas, 4 Teams', btn('+ Pessoa', 'sec', href='W-AddPessoa.dc.html') + btn('+ Event', 'pri', href='W-NovoEvent.dc.html'), crumb='seg., 2 de nov.', dot='#EF5A3C')
  body += stats([('Próximos Events', '4', '', 'ne', 'W-Events.dc.html'), ('Em rascunho', '2', 'RASCUNHO', 'dr', 'W-Events.dc.html'), ('Cancelados', '1', 'CANCELADO', 'ca', 'W-Events.dc.html'), ('Convites pendentes', '3', 'CONVITE PENDENTE', 'dr', 'W-Pessoas.dc.html')])
  left = next_trip() + card(h2('Agenda do Group', '<a href="W-Events.dc.html" style="font-size: 14px; font-weight: 600; text-decoration: none">Ver todos os Events</a>') + agenda(), '16px 20px 20px')
  right = card(h2('Para publicar', badge('2 RASCUNHOS', 'dr')) + drafts, '16px 18px', 10) + card(h2('Convites pendentes', '<a href="W-Pessoas.dc.html" style="font-size: 13px; font-weight: 600; text-decoration: none">Pessoas</a>') + inv, '16px 18px', 6) + card(h2('Mudanças recentes') + changes, '16px 18px', 12) + card(h2('Teams', '<a href="W-Teams.dc.html" style="font-size: 13px; font-weight: 600; text-decoration: none">Ver Teams</a>') + '<div style="display: flex; flex-wrap: wrap; gap: 8px">' + ''.join(chip(t, n, h=36) for t, n in [('Cantores', 12), ('Banda', 8), ('Técnica', 6), ('Produção', 5)]) + '</div>', '16px 18px', 10)
  body += f'<div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start"><div style="flex: 999 1 520px; min-width: 0; display: flex; flex-direction: column; gap: 14px">{left}</div><aside style="flex: 1 1 320px; max-width: 420px; display: flex; flex-direction: column; gap: 14px">{right}</aside></div>'
  add(name, title, shell(body, 'inicio'), 1240, dark)

# ---------- Events ----------
def events_table(viewer=False):
  hd = ['', 'Data', 'Event', 'Onde', 'Fuso'] + ([] if viewer else ['Participants', 'Itens']) + ['Estado']
  cols = 'grid-template-columns: 20px 130px minmax(180px, 1.6fr) minmax(150px, 1.2fr) 90px ' + ('' if viewer else '100px 70px ') + '130px'
  out = [f'<div role="row" style="display: grid; {cols}; gap: 12px; padding: 10px 16px; background: $sf2; font-size: 12px; font-weight: 600; color: $mu">' + ''.join(f'<span role="columnheader">{h}</span>' for h in hd) + '</div>']
  data = [
    ('#B68103', 'qui 05/11', 'Ensaio geral', 'Sede, Vitória', 'Vitória', '31', '4', 'PUBLICADO', True),
    ('#A06AEC', '20 a 22/11', 'Saída Manaus', 'Manaus, AM', 'Manaus', '24', '14', 'PUBLICADO', True),
    ('#069FA6', 'sáb 28/11', 'Festival de Verão', 'Vila Velha, ES', 'Vitória', '18', '6', 'CANCELADO', True),
    ('#EF5A3C', 'sáb 12/12', 'Natal na Praça', 'Vitória, ES', 'Vitória', '20', '3', 'RASCUNHO', False),
    ('#1FB86A', '15 a 19/01/27', 'Turnê Sul', 'Curitiba e Porto Alegre', 'Vitória', '14', '0', 'RASCUNHO', False),
    ('#7347AF', 'sex 05/02/27', 'Carnaval Vitória', 'Vitória, ES', 'Vitória', '28', '9', 'PUBLICADO', False),
  ]
  for c, d, n, o, tz, p, i, st, goes in data:
    if viewer and st == 'RASCUNHO':
      continue
    off = st == 'CANCELADO'
    stc = badge(st, SB[st]) if not viewer else (badge('VOCÊ VAI', 'ok') if goes and not off else (badge(st, 'ca') if off else badge('VOCÊ NÃO VAI', 'ne')))
    href = {'Saída Manaus': 'W-Event-Visao' if not viewer else 'W-Viewer-Resumo', 'Natal na Praça': 'W-Event-Rascunho', 'Festival de Verão': 'W-Event-Cancelado' if not viewer else 'W-Viewer-Cancelado', 'Carnaval Vitória': 'W-Viewer-NaoVai' if viewer else '#'}.get(n, '#')
    href = href + '.dc.html' if href != '#' else '#'
    extra = '' if viewer else f'<span style="{MONO}; font-size: 14px">{p}</span><span style="{MONO}; font-size: 14px">{i}</span>'
    nst = ' color: $mu; text-decoration: line-through;' if off else ''
    out.append(f'<div role="row" style="display: grid; {cols}; gap: 12px; align-items: center; padding: 0 16px; height: 52px; border-top: 1px solid $sf2"><span style="width: 14px; height: 14px; border-radius: 5px; background: {c}"></span><span style="{MONO}; font-size: 14px">{d}</span><a href="{href}" style="text-decoration: none; color: $tx; font-size: 15px; font-weight: 600;{nst}">{n}</a><span style="font-size: 14px; color: $mu">{o}</span><span style="font-size: 13px; color: $mu">{tz}</span>{extra}<span>{stc}</span></div>')
  return f'<div style="background: $sf; border-radius: 24px; padding: 4px; overflow-x: auto"><div role="table" aria-label="Events" style="min-width: 860px; border-radius: 20px; overflow: hidden">{"".join(out)}</div></div>'

def events_page(panel_=None):
  body = page_header('Events', 'Todos os Events do Vocal Livre', btn('+ Event', 'pri', href='W-NovoEvent.dc.html'))
  body += stats([('Próximos', '4', '', 'ne'), ('Em rascunho', '2', 'RASCUNHO', 'dr'), ('Cancelados', '1', 'CANCELADO', 'ca'), ('Convites pendentes', '3', 'CONVITE PENDENTE', 'dr', 'W-Pessoas.dc.html')])
  body += f'<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">{searchbox("Buscar Event")}{filt("Próximos", True)}{filt("Que eu vou")}{filt("Passados")}{filt("Rascunhos")}</div>'
  body += events_table()
  return shell(body, 'events', panel=panel_)

def build():
  inicio_owner()
  add('W-Events', 'Events (Owner)', events_page(), 1000)
  form = '<div style="display: flex; flex-direction: column; gap: 12px">' + field('Nome', 'Natal na Praça', focus=True) + field('Onde', 'Praça Costa Pereira, Vitória') + select('Fuso', 'Horário de Vitória (UTC−3)') + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">' + field('Começa', '12/12/2026', mono=True) + field('Termina', '12/12/2026', mono=True) + '</div>' + '<span style="font-size: 13px; font-weight: 600; color: $mu">Participants vêm de</span>' + f'<label style="border: 1.5px solid $ac; border-radius: 16px; padding: 12px 14px; display: flex; gap: 12px; align-items: center"><input type="radio" name="o" checked style="width: 20px; height: 20px; accent-color: $ac; margin: 0"><span style="display: flex; flex-direction: column"><span style="font-size: 15px; font-weight: 600">Todos os Group members</span><span style="font-size: 12px; color: $mu">31 pessoas, dá para tirar depois</span></span></label>' + f'<label style="border: 1.5px solid $bd2; border-radius: 16px; padding: 12px 14px; display: flex; gap: 12px; align-items: flex-start"><input type="radio" name="o" style="width: 20px; height: 20px; accent-color: $ac; margin: 0"><span style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 15px; font-weight: 600">Alguns Teams</span><span style="display: flex; gap: 6px; flex-wrap: wrap">{chip("Cantores")}{chip("Banda")}{chip("Técnica")}{chip("Produção")}</span></span></label></div><span style="font-size: 13px; color: $mu">O Event nasce em rascunho. Só a produção vê até publicar.</span>'
  add('W-NovoEvent', 'Criar Event (painel)', events_page(panel('Novo Event', form, foot=btn('Cancelar', 'out') + btn('Criar Event', 'pri', href='W-Event-Rascunho.dc.html'), ctx='Events')), 1000)

  # ---------- Pessoas ----------
  PEOPLE = [
    ('BR', 'Bruno Reis', 'bruno.reis@gmail.com', '+55 27 99731-4420', 'OWNER', ['Produção'], ''),
    ('CD', 'Carla Dias', 'carla.dias@hotmail.com', '+55 27 98812-0371', 'OWNER', ['Produção'], 'CONVITE PENDENTE'),
    ('LU', 'Lu Andrade', 'lu.andrade@gmail.com', '+55 27 99654-1187', 'VIEWER', ['Cantores'], ''),
    ('AL', 'Alice Monteiro', 'alice.m@gmail.com', '+55 27 99210-5532', 'VIEWER', ['Cantores'], ''),
    ('MA', 'Matias Rocha', 'matias.rocha@gmail.com', '+55 27 99877-0094', 'VIEWER', ['Banda'], ''),
    ('JA', 'Jacque Lima', 'jacque.lima@outlook.com', '+55 27 98123-6640', 'VIEWER', ['Cantores', 'Banda'], ''),
    ('TS', 'Tiago Souza', 'tiago.souza@gmail.com', '+55 27 99734-2281', 'VIEWER', ['Banda'], 'CONVITE PENDENTE'),
    ('DI', 'Diego Pires', 'diego.pires@gmail.com', '+55 27 99001-7765', 'VIEWER', ['Técnica'], ''),
    ('PM', 'Paulo Mendes', 'paulo.mendes@gmail.com', '+55 27 99318-4402', 'VIEWER', ['Técnica'], 'CONVITE PENDENTE'),
    ('RA', 'Rafa Teixeira', '', '+55 27 99562-9013', 'VIEWER', ['Técnica'], 'SEM LOGIN'),
  ]
  def people_table(viewer=False):
    cols = 'grid-template-columns: minmax(200px, 1.4fr) minmax(200px, 1.4fr) 160px 90px minmax(140px, 1fr) 150px'
    out = [f'<div role="row" style="display: grid; {cols}; gap: 12px; padding: 10px 16px; background: $sf2; font-size: 12px; font-weight: 600; color: $mu">' + ''.join(f'<span role="columnheader">{h}</span>' for h in ['Nome', 'E-mail', 'Telefone', 'Papel', 'Teams', '']) + '</div>']
    for ini, n, e, t, r, ts, st in PEOPLE:
      out.append(f'<div role="row" style="display: grid; {cols}; gap: 12px; align-items: center; padding: 0 16px; height: 54px; border-top: 1px solid $sf2"><a href="W-Pessoa.dc.html" style="text-decoration: none; color: $tx; display: flex; align-items: center; gap: 10px">{av(ini, ts[0], 32, bool(st))}<span style="font-size: 15px; font-weight: 600">{n}</span></a><span style="font-size: 14px; color: $mu">{e or "sem e-mail"}</span><span style="{MONO}; font-size: 13px; color: $mu">{t}</span><span>{badge(r, "ac" if r == "OWNER" else "ne")}</span><span style="display: flex; gap: 4px; flex-wrap: wrap">{"".join(chip(x) for x in ts)}</span><span>{badge(st, "dr" if st == "CONVITE PENDENTE" else "ne") if st else ""}</span></div>')
    return f'<div style="background: $sf; border-radius: 24px; padding: 4px; overflow-x: auto"><div role="table" aria-label="Pessoas" style="min-width: 960px; border-radius: 20px; overflow: hidden">{"".join(out)}</div></div>'
  def ptabs(cur):
    return '<div role="tablist" style="display: inline-flex; background: $sf; border-radius: 20px; padding: 4px; gap: 2px">' + ''.join(f'<a href="{f}" role="tab" aria-selected="{"true" if l == cur else "false"}" style="text-decoration: none; height: 36px; padding: 0 16px; border-radius: 16px; {"background: $ac; color: #FFFFFF; font-weight: 600;" if l == cur else "color: $mu;"} font-size: 14px; display: inline-flex; align-items: center">{l}</a>' for l, f in [('Pessoas', 'W-Pessoas.dc.html'), ('Teams', 'W-Teams.dc.html')]) + '</div>'
  def pessoas_page(panel_=None):
    body = page_header('Pessoas', 'Vocal Livre: 31 pessoas, 3 convites pendentes', btn('+ Pessoa', 'pri', href='W-AddPessoa.dc.html'))
    body += f'<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">{ptabs("Pessoas")}<span style="width: 8px"></span>{searchbox("Buscar por nome, e-mail ou telefone", "320px")}{filt("Todos os Teams", True)}{filt("Cantores")}{filt("Banda")}{filt("Técnica")}{filt("Produção")}{filt("Convite pendente")}</div>'
    body += people_table()
    return shell(body, 'pessoas', panel=panel_)
  add('W-Pessoas', 'Pessoas do Group', pessoas_page(), 1000)

  pess = f'''<div style="display: flex; align-items: center; gap: 14px"><span style="width: 64px; height: 64px; border-radius: 20px; background: $tqB; color: $tqT; box-shadow: 0 0 0 3px #069FA6; font-size: 22px; font-weight: 700; display: flex; align-items: center; justify-content: center">MA</span><div style="display: flex; flex-direction: column; gap: 6px"><span style="display: flex; gap: 6px">{badge("VIEWER")}</span><span style="font-size: 13px; color: $mu">No Group desde mar. de 2025</span></div></div>
{dl([("E-mail", "matias.rocha@gmail.com"), ("Telefone", f'<span style="{MONO}">+55 27 99877-0094</span>'), ("Teams", chip("Banda"))], 90)}
<div style="display: flex; gap: 8px; flex-wrap: wrap">{btn(ico(I_PHONE, 16) + "Abrir no WhatsApp", "soft", 36)}{btn("Editar", "out", 36)}</div>
<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 13px; font-weight: 600; color: $mu">Papel no Group</span>{seg(["Viewer", "Owner"], 0)}<span style="font-size: 12px; color: $mu">Owner monta Events e cuida das pessoas. Viewer só vê.</span></div>
<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 13px; font-weight: 600; color: $mu">Events em que vai</span>{"".join(f'<div style="display: flex; align-items: center; gap: 10px; font-size: 14px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {c}"></span><span style="flex-grow: 1">{n}</span><span style="{MONO}; font-size: 13px; color: $mu">{d}</span></div>' for c, n, d in [("#B68103", "Ensaio geral", "05/11"), ("#A06AEC", "Saída Manaus", "20/11"), ("#7347AF", "Carnaval Vitória", "05/02")])}</div>
{btn("Tirar do Group", "dan", 36, extra="align-self: flex-start")}'''
  add('W-Pessoa', 'Pessoa (painel)', pessoas_page(panel('Matias Rocha', pess, ctx='Pessoas')), 1000)

  addp = '<div style="display: flex; flex-direction: column; gap: 12px">' + field('Nome', 'Tiago Souza') + field('E-mail', 'tiago.souza@gmail.com', focus=True) + field('Telefone', '+55 27 9973', err='Telefone incompleto.', mono=True) + f'<span style="font-size: 13px; font-weight: 600; color: $mu">Papel</span>{seg(["Viewer", "Owner"], 0)}<span style="font-size: 13px; font-weight: 600; color: $mu">Teams</span><div style="display: flex; gap: 6px; flex-wrap: wrap">{chip("Cantores", h=36)}{chip("Banda", sel=True, h=36)}{chip("Técnica", h=36)}{chip("Produção", h=36)}</div></div><span style="font-size: 13px; color: $mu">Sem e-mail, a pessoa entra no Group sem login e não recebe convite.</span>'
  add('W-AddPessoa', 'Owner adiciona pessoa (painel)', pessoas_page(panel('Nova pessoa', addp, foot=btn('Cancelar', 'out') + btn('Adicionar e gerar convite', 'pri', href='W-Convite.dc.html'), ctx='Pessoas')), 1000)

  conv = f'''<div role="status" style="background: $okB; color: $okT; border-radius: 16px; padding: 12px 14px; font-size: 14px; font-weight: 500">Tiago Souza entrou no Vocal Livre com convite pendente.</div>
<p style="margin: 0; font-size: 15px; line-height: 1.5">Mande este Activation link para o Tiago. Ao abrir, ele cria a senha (ou entra com Google ou Apple) e já cai no Group.</p>
<div style="display: flex; gap: 8px; align-items: center; border: 1.5px solid $bd2; border-radius: 14px; padding: 10px 12px"><span style="{MONO}; font-size: 13px; flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">https://events.app/ativar/7Qm2-xK9p-LrT4</span>{btn(ico(I_COPY, 16) + "Copiar", "pri", 34)}</div>
{btn(ico(I_PHONE, 16) + "Abrir no WhatsApp", "soft", 40, extra="align-self: flex-start")}
<span style="font-size: 13px; color: $mu">O link fica aqui, no painel da pessoa, enquanto o convite estiver pendente.</span>'''
  add('W-Convite', 'Activation link (painel)', pessoas_page(panel('Convite do Tiago', conv, foot=btn('Concluir', 'pri'), ctx='Pessoas')), 1000)

  # ---------- Teams ----------
  def teams_page(panel_=None):
    body = page_header('Pessoas', 'Vocal Livre: 4 Teams', btn('+ Team', 'pri', href='W-Team.dc.html'))
    body += f'<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">{ptabs("Teams")}</div>'
    cols = 'grid-template-columns: 24px minmax(160px, 1fr) minmax(220px, 1.4fr) 90px 120px'
    rows = [f'<div role="row" style="display: grid; {cols}; gap: 12px; padding: 10px 16px; background: $sf2; font-size: 12px; font-weight: 600; color: $mu">' + ''.join(f'<span role="columnheader">{h}</span>' for h in ['', 'Team', 'Membros', 'Pessoas', 'Events']) + '</div>']
    for t, n, ev, ppl in [('Cantores', 12, 5, ['LU', 'AL', 'JA']), ('Banda', 8, 4, ['MA', 'JA', 'TS']), ('Técnica', 6, 3, ['DI', 'PM', 'RA']), ('Produção', 5, 6, ['BR', 'CD'])]:
      stack = ''.join(f'<span style="margin-left: {0 if i == 0 else -8}px; border: 2px solid $sf; border-radius: 50%; display: inline-flex">{av(x, size=28)}</span>' for i, x in enumerate(ppl)) + f'<span style="margin-left: -8px; width: 28px; height: 28px; border-radius: 50%; border: 2px solid $sf; background: $inv; color: $invT; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center">+{n - len(ppl)}</span>'
      rows.append(f'<div role="row" style="display: grid; {cols}; gap: 12px; align-items: center; padding: 0 16px; height: 56px; border-top: 1px solid $sf2"><span style="width: 16px; height: 16px; border-radius: 50%; background: {TEAMS[t][2]}"></span><a href="W-Team.dc.html" style="text-decoration: none">{chip(t, h=32)}</a><span style="display: flex; align-items: center">{stack}</span><span style="{MONO}; font-size: 14px">{n}</span><span style="font-size: 14px; color: $mu"><span style="{MONO}">{ev}</span> próximos</span></div>')
    body += f'<div style="background: $sf; border-radius: 24px; padding: 4px; overflow-x: auto"><div role="table" aria-label="Teams" style="min-width: 640px; border-radius: 20px; overflow: hidden">{"".join(rows)}</div></div>'
    return shell(body, 'pessoas', panel=panel_)
  add('W-Teams', 'Teams', teams_page(), 1000)
  members = ''.join(f'<label style="display: flex; align-items: center; gap: 12px; min-height: 48px; border-top: 1px solid $sf2">{checkbox(on, n)}{av(i, size=32)}<span style="flex-grow: 1; display: flex; flex-direction: column"><span style="font-size: 15px; font-weight: 600">{n}</span><span style="font-size: 12px; color: $mu">{o}</span></span></label>' for i, n, o, on in [('MA', 'Matias Rocha', 'Banda', True), ('JA', 'Jacque Lima', 'Cantores, Banda', True), ('TS', 'Tiago Souza', 'Banda · convite pendente', True), ('LU', 'Lu Andrade', 'Cantores', False), ('AL', 'Alice Monteiro', 'Cantores', False), ('DI', 'Diego Pires', 'Técnica', False), ('RA', 'Rafa Teixeira', 'Técnica · sem login', False)])
  tm = f'<div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: end">{field("Nome do Team", "Banda")}<span style="display: flex; flex-direction: column; gap: 4px; align-items: center"><span style="font-size: 12px; color: $mu">Cor</span><span style="width: 44px; height: 44px; border-radius: 14px; background: #069FA6"></span></span></div><span style="font-size: 12px; color: $mu">A cor vem sorteada e não se escolhe.</span><div style="display: flex; align-items: center; gap: 8px"><span style="font-size: 13px; font-weight: 600; color: $mu; flex-grow: 1">Membros <span style="{MONO}; font-weight: 400">8</span></span>{searchbox("Buscar pessoa", "220px")}</div><div style="display: flex; flex-direction: column">{members}</div>'
  add('W-Team', 'Team · membros (painel)', teams_page(panel('Banda', tm, foot=btn('Apagar Team', 'dan') + '<span style="flex-grow: 1"></span>' + btn('Salvar', 'pri'), ctx='Teams')), 1000)
