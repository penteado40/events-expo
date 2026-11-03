from lib import *
from event import *
import s_group, s_event

def build():
  # ---------- Viewer ----------
  V = 'viewer'
  body = page_header('Olá, Lu', 'Vocal Livre · Cantores', '', crumb='seg., 2 de nov.', dot='#EF5A3C')
  mine = card(h2('Hoje e amanhã') + '<p style="margin: 0; font-size: 15px; color: $mu">Nada na sua programação. O próximo é <strong style="color: $tx">Ensaio geral</strong>, qui 05/11, 19:00, na Sede.</p>', gap=8)
  body += f'<div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start"><div style="flex: 999 1 520px; min-width: 0; display: flex; flex-direction: column; gap: 14px">{s_group.next_trip(True)}{card(h2("Agenda do Group", "<a href=\"W-Viewer-Events.dc.html\" style=\"font-size: 14px; font-weight: 600; text-decoration: none\">Ver todos os Events</a>") + s_group.agenda(True), "16px 20px 20px")}</div><aside style="flex: 1 1 320px; max-width: 420px; display: flex; flex-direction: column; gap: 14px">{mine}{card(h2("Seus Teams") + "<div style=\"display: flex; gap: 8px\">" + chip("Cantores", 12, h=36) + "</div>", gap=10)}</aside></div>'
  add('W-Viewer-Inicio', 'Início do Group (Viewer)', shell(body, 'inicio', V), 1000)

  body = page_header('Events', 'Events do Vocal Livre') + f'<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">{searchbox("Buscar Event")}{filt("Próximos", True)}{filt("Que eu vou")}{filt("Passados")}</div>' + s_group.events_table(True)
  add('W-Viewer-Events', 'Events (Viewer)', shell(body, 'events', V), 1000)

  vres = f'<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px">'
  hl = lambda n, w, s, big=False: f'<div style="border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 4px; {"background: " + EV["cover"] + "; color: #FFFFFF; grid-column: span 2; min-height: 150px; justify-content: flex-end" if big else "background: $sf; border: 1px solid $bd"}"><span style="font-size: 13px; {"color: #EDE5FE" if big else "color: $evT; font-weight: 600"}">{w}</span><span style="font-size: {26 if big else 18}px; font-weight: 700">{n}</span><span style="font-size: 13px; {"color: #EDE5FE" if big else "color: $mu"}">{s}</span></div>'
  vres += hl('Show', 'sáb 21, 19:00', 'Teatro Amazonas · figurino azul · chegar 18:00', True) + hl('Voo VIX → MAO', 'sex 20, 08:10 (Vitória)', 'Chega 13:20 · QX7P2M') + hl('Translado de volta', 'dom 22, 00:40', 'Você está no Carro 1 - EC') + hl('Hospedagem', 'Informação geral', 'Hotel Taj Mahal, quarto 101') + '</div>'
  vres += card(h2('Onde e quando') + dl([('Onde', 'Manaus, AM'), ('Quando', 'sex 20 a dom 22 de nov.'), ('Fuso', 'Cada hora é a do lugar onde o item acontece'), ('Seus itens', '9 itens para você')]))
  vh = lambda tab, **k: ev_header(tab, V, status='', extra_badge=badge('VOCÊ VAI', 'ok'), **k)
  add('W-Viewer-Resumo', 'Event · Resumo (Viewer)', shell(vh('Resumo') + vres, 'events', V), 1000)
  add('W-Viewer-Programacao', 'Event · Programação (Viewer)', shell(vh('Programação') + timeline_cols(viewer=True) + prog_compact(viewer=True), 'events', V), 1500)

  vit = f'''<span style="font-size: 15px; font-weight: 600; color: $evT">Dom 22/11, 00:40 <span style="font-weight: 400; color: $mu">horário de Manaus</span></span>
<div style="background: $ev05; border-radius: 16px; padding: 12px 14px; display: flex; align-items: center; gap: 12px"><span style="flex-grow: 1; display: flex; flex-direction: column"><span style="font-size: 15px; font-weight: 600">Você está no Carro 1 - EC</span><span style="font-size: 13px; color: $mu">3 carros neste translado</span></span>{btn("Ver todos", "pri", 36, href="W-Viewer-VerTodos.dc.html")}</div>
<div style="display: flex; flex-direction: column; gap: 8px">{"".join(f'<div style="display: flex; align-items: center; gap: 12px">{av(i, t, 36)}<span style="flex-grow: 1; display: flex; flex-direction: column"><span style="font-size: 15px; font-weight: 600">{n}</span><span style="font-size: 12px; color: $mu">{s}</span></span>{"" if n == "Você" else iconbtn(ico(I_PHONE, 16), "WhatsApp de " + n, 36)}</div>' for i, t, n, s in [("MA", "Banda", "Matias", "Banda · dirigindo"), ("LU", "Cantores", "Você", "Cantores"), ("AL", "Cantores", "Alice", "Cantores"), ("TS", "Banda", "Tiago", "Banda"), ("BR", "Produção", "Bruno", "Produção")])}</div>
{dl([("Local", "Teatro Amazonas → Hotel Taj Mahal"), ("Obs", "Despachar o som no Carro 2")], 90)}
<div style="border: 1.5px solid $bd2; border-radius: 16px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 600; color: $mu">Sua nota · só você e a produção</span><span style="font-size: 15px">Volto com a mala de figurino</span><a href="#" style="font-size: 13px; font-weight: 600; text-decoration: none; align-self: flex-start">Editar nota</a></div>
<span style="font-size: 12px; color: $mu">Alterado por Bruno Reis há 2 h</span>'''
  add('W-Viewer-Item', 'Event item (Viewer, leitura)', shell(vh('Programação') + prog_compact('Translado de volta', viewer=True), 'events', V, panel=panel('Translado de volta', vit, ctx='Dom 22 · Saída Manaus')), 1300)

  vt = ''.join(f'<div style="border: 1px solid $bd; border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 8px{"; background: $ev05" if me else ""}"><span style="font-size: 14px; font-weight: 700">{g} <span style="{MONO}; font-weight: 400; color: $mu">{len(p)}</span>{" " + badge("SEU", "ok", True) if me else ""}</span><div style="display: flex; flex-wrap: wrap; gap: 6px">{"".join(f"<span style=\"height: 30px; padding: 0 10px 0 4px; border-radius: 15px; background: $sf2; font-size: 13px; display: inline-flex; align-items: center; gap: 6px\">{av(x[:2].upper(), None, 22)}{x}</span>" for x in p)}</div></div>' for g, p, me in [('Carro 1 - EC', ['Matias', 'Lu', 'Alice', 'Tiago', 'Bruno'], True), ('Carro 2', ['Rafa', 'Jacque', 'Paulo', 'Carla'], False), ('Van Técnica', ['Diego', 'Técnica'], False)])
  add('W-Viewer-VerTodos', 'Field de pessoas · ver todos (Viewer)', shell(vh('Programação') + prog_compact('Translado de volta', viewer=True), 'events', V, panel=panel('Carros', vt, back='W-Viewer-Item.dc.html')), 1300)

  car = dict(name='Carnaval Vitória', cover='linear-gradient(135deg, #352053, #7347AF)', place='Vitória, ES', period='sex 05 de fev. de 2027', tz='horário de Vitória (UTC−3)')
  nv = banner('Você não está neste Event. Dá para ver onde e quando e quem vai, mas não a programação.', 'ne')
  who = card(h2('Quem vai', '<span style="font-size: 13px; color: $mu">28 pessoas</span>') + ''.join(f'<div style="display: flex; flex-direction: column; gap: 8px; padding-top: 6px"><span>{chip(t, n)}</span><div style="display: flex; flex-wrap: wrap; gap: 6px">{"".join(f"<span style=\"height: 30px; padding: 0 10px 0 4px; border-radius: 15px; background: $sf2; font-size: 13px; display: inline-flex; align-items: center; gap: 6px\">{av(x[:2].upper(), t, 22)}{x}</span>" for x in p)}</div></div>' for t, n, p in [('Banda', 8, ['Matias', 'Jacque', 'Tiago', 'Rafa', 'Diego']), ('Técnica', 6, ['Diego', 'Paulo', 'Rafa']), ('Produção', 5, ['Bruno', 'Carla'])]))
  add('W-Viewer-NaoVai', 'Event em que você não vai (Viewer)', shell(ev_header('Participants', V, status='', extra_badge=badge('VOCÊ NÃO VAI', 'ne'), **car) + nv + card(h2('Onde e quando') + dl([('Onde', 'Vitória, ES'), ('Quando', 'sex 05 de fev. de 2027'), ('Fuso', 'Horário de Vitória (UTC−3)')])) + who, 'events', V), 1000)

  fest = dict(name='Festival de Verão', cover='linear-gradient(135deg, #023538, #069FA6)', place='Vila Velha, ES', period='sáb 28 de nov. de 2026', tz='horário de Vitória (UTC−3)')
  vc = banner('Este Event foi cancelado. A programação abaixo não muda mais.', 'ca')
  vc += card(h2('Programação congelada') + ''.join(f'<div style="display: grid; grid-template-columns: 64px 1fr 1fr; gap: 12px; align-items: center; padding: 8px 0; border-top: 1px solid $sf2; color: $mu"><span style="{MONO}; font-size: 14px">{t}</span><span style="font-size: 15px; font-weight: 600">{n}</span><span style="font-size: 13px">{p}</span></div>' for t, n, p in [('13:00', 'Saída da sede', 'Vitória'), ('20:00', 'Show', 'Palco Praia da Costa'), ('23:30', 'Volta', 'Vitória')]))
  add('W-Viewer-Cancelado', 'Event cancelado (Viewer)', shell(ev_header('Resumo', V, status='CANCELADO', **fest) + vc, 'events', V), 1000)

  # ---------- Super admin ----------
  SA = 'sa'
  def groups_page(panel_=None, only_no_owner=False):
    body = page_header('Groups da plataforma', '12 Groups, 1 sem Owner', btn('+ Group', 'pri', href='W-Admin-NovoGroup.dc.html'), crumb=badge('SUPER ADMIN', 'sa'))
    body += f'<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">{searchbox("Buscar Group")}{filt("Todos", not only_no_owner)}{filt("Sem Owner", only_no_owner)}</div>'
    cols = 'grid-template-columns: 44px minmax(180px, 1.3fr) minmax(200px, 1.5fr) 90px 120px 120px'
    rows = [f'<div role="row" style="display: grid; {cols}; gap: 12px; padding: 10px 16px; background: $sf2; font-size: 12px; font-weight: 600; color: $mu">' + ''.join(f'<span role="columnheader">{h}</span>' for h in ['', 'Group', 'Owners', 'Pessoas', 'Criado', '']) + '</div>']
    for ini, n, ow, p, c in [('VL', 'Vocal Livre', 'Bruno Reis, Carla Dias', '31', 'mar. 2025'), ('CJ', 'Coral Jovem', 'Helena Vaz', '46', 'jun. 2025'), ('BS', 'Banda Sinfônica ES', '', '58', 'ago. 2025'), ('QA', 'Quarteto Aurora', 'Marina Costa', '4', 'set. 2026'), ('TV', 'Teatro Vila', 'Otávio Neves, Iara Pinto', '22', 'out. 2026')]:
      if only_no_owner and ow:
        continue
      rows.append(f'<div role="row" style="display: grid; {cols}; gap: 12px; align-items: center; padding: 0 16px; height: 54px; border-top: 1px solid $sf2"><span style="width: 32px; height: 32px; border-radius: 10px; background: #1F4FAE; color: #FFFFFF; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center">{ini}</span><a href="W-Admin-Group.dc.html" style="text-decoration: none; color: $tx; font-size: 15px; font-weight: 600">{n}</a><span style="font-size: 14px; color: $mu">{ow or badge("SEM OWNER", "ca")}</span><span style="{MONO}; font-size: 14px">{p}</span><span style="font-size: 13px; color: $mu">{c}</span><span>{btn("Definir Owner", "out", 30, href="W-Admin-Group.dc.html") if not ow else ""}</span></div>')
    body += f'<div style="background: $sf; border-radius: 24px; padding: 4px; overflow-x: auto"><div role="table" aria-label="Groups" style="min-width: 800px; border-radius: 20px; overflow: hidden">{"".join(rows)}</div></div>'
    return shell(body, 'groups', SA, panel=panel_, group=('QA', 'Quarteto Aurora'))
  add('W-Admin-Groups', 'Groups da plataforma (Super admin)', groups_page(), 1000)
  ng = '<div style="display: flex; flex-direction: column; gap: 12px">' + field('Nome do Group', 'Banda Municipal de Serra', focus=True) + field('E-mail do primeiro Owner', 'joana.prates@gmail.com') + '<span style="font-size: 13px; color: $mu">Se a pessoa ainda não tem conta, ela entra com convite pendente e você recebe o Activation link para repassar.</span></div>'
  add('W-Admin-NovoGroup', 'Criar Group (Super admin, painel)', groups_page(panel('Novo Group', ng, foot=btn('Cancelar', 'out') + btn('Criar Group', 'pri'), ctx='Plataforma')), 1000)
  og = f'''{dl([("Pessoas", "58"), ("Criado", "ago. 2025"), ("Owners", badge("SEM OWNER", "ca"))], 90)}
{banner("Este Group está sem Owner. Ninguém consegue montar Events nem cuidar das pessoas até alguém virar Owner.", "ca")}
<div style="display: flex; align-items: center; gap: 8px"><span style="font-size: 13px; font-weight: 600; color: $mu; flex-grow: 1">Membros</span>{searchbox("Buscar membro", "220px")}</div>
{"".join(f'<div style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-top: 1px solid $sf2">{av(i, size=34)}<span style="flex-grow: 1; display: flex; flex-direction: column"><span style="font-size: 15px; font-weight: 600">{n}</span><span style="font-size: 12px; color: $mu">{e}</span></span>{btn("Tornar Owner", "pri" if k == 0 else "out", 32)}</div>' for k, (i, n, e) in enumerate([("AF", "Aurélio Fontes", "aurelio.fontes@gmail.com"), ("BM", "Bianca Moraes", "bianca.moraes@gmail.com"), ("CN", "Caio Nunes", "caio.nunes@hotmail.com")]))}
<span style="font-size: 13px; color: $mu">Um Group com Owners nunca fica sem nenhum: o último Owner não pode ser rebaixado.</span>'''
  add('W-Admin-Group', 'Group · definir Owner (Super admin, painel)', groups_page(panel('Banda Sinfônica ES', og, ctx='Plataforma')), 1000)

  # ---------- Conta ----------
  def split(form):
    return f'''<div style="min-height: 1000px; display: flex; flex-wrap: wrap; background: $bg; font-family: Outfit, system-ui, sans-serif; color: $tx">
<div style="flex: 1 1 420px; background: linear-gradient(160deg, #10204A, #2F63C9); color: #FFFFFF; padding: 48px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; gap: 32px">
<span style="font-size: 28px; font-weight: 700">events<span style="color: #FFE2DC">·</span></span>
<div style="display: flex; flex-direction: column; gap: 12px; max-width: 460px"><span style="font-size: 44px; font-weight: 700; line-height: 1.1">A produção do Group num lugar só.</span><span style="font-size: 17px; color: #DBE7FF; line-height: 1.5">Monte Events, a programação e quem vai. Quem está na estrada vê tudo no celular.</span></div>
<span style="font-size: 13px; color: #DBE7FF">No celular, use o app.</span></div>
<div style="flex: 1 1 420px; display: flex; align-items: center; justify-content: center; padding: 48px 24px; box-sizing: border-box"><div style="width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 14px">{form}</div></div></div>'''
  def social():
    return f'<div style="display: flex; align-items: center; gap: 10px; color: $mu; font-size: 13px"><span style="flex-grow: 1; border-top: 1px solid $bd"></span>ou<span style="flex-grow: 1; border-top: 1px solid $bd"></span></div>{btn("Continuar com Google", "out", 48)}{btn("Continuar com Apple", "out", 48)}'
  lf = f'<h1 style="margin: 0; font-size: 30px; font-weight: 700">Entrar<span style="color: #EF5A3C">·</span></h1>{field("E-mail", "bruno.reis@gmail.com")}{field("Senha", "", focus=True, err="E-mail ou senha não conferem.")}{btn("Entrar", "pri", 52)}{btn("Esqueci a senha", "ghost", 40, extra="align-self: flex-start")}{social()}'
  FILES_LOGIN = split(lf)
  add('W-Login', 'Login', FILES_LOGIN, 1000)
  af = f'<span style="align-self: flex-start">{badge("CONVITE", "ac")}</span><h1 style="margin: 0; font-size: 30px; font-weight: 700; line-height: 1.15">Bruno te chamou para o Vocal Livre<span style="color: #EF5A3C">·</span></h1><p style="margin: 0; font-size: 15px; color: $mu">Confira seus dados e crie uma senha para entrar.</p>{field("Nome", "Tiago Souza")}{field("E-mail", "tiago.souza@gmail.com", ro=True)}{field("Telefone", "+55 27 99734-2281", mono=True)}{field("Crie uma senha", "", focus=True)}{btn("Ativar conta", "pri", 52)}{social()}'
  add('W-Ativar', 'Ativar conta (convite)', split(af), 1000)
  sg = f'<section style="background: $sf; border-radius: 24px; padding: 64px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center"><span style="width: 64px; height: 64px; border-radius: 20px; background: $acs; color: $lk; display: flex; align-items: center; justify-content: center">{ico(I_PPL, 30)}</span><h1 style="margin: 0; font-size: 24px; font-weight: 700">Você ainda não está em nenhum Group</h1><p style="margin: 0; font-size: 15px; color: $mu; max-width: 440px; line-height: 1.5">Peça para um Owner do seu Group te adicionar pelo e-mail <strong style="color: $tx">tiago.souza@gmail.com</strong>. Assim que ele fizer isso, o Group aparece aqui.</p>{btn("Tentar de novo", "out")}</section>'
  add('W-SemGroup', 'Sem Group ainda', shell(sg, 'none', 'viewer', no_group=True), 1000)

  def perfil(panel_=None):
    pc = card(f'<div style="display: flex; align-items: center; gap: 16px"><span style="width: 76px; height: 76px; border-radius: 24px; background: $ouB; color: $ouT; font-size: 26px; font-weight: 700; display: flex; align-items: center; justify-content: center">BR</span><div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 24px; font-weight: 700">Bruno Reis</span><span style="font-size: 14px; color: $mu">bruno.reis@gmail.com</span></div>{btn("Editar", "out", href="W-PerfilEditar.dc.html")}</div>' + dl([('Telefone', f'<span style="{MONO}">+55 27 99731-4420</span>'), ('Entrar com', 'E-mail e senha, Google')]))
    gc = card(h2('Seus Groups') + ''.join(f'<div style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-top: 1px solid $sf2"><span style="width: 36px; height: 36px; border-radius: 11px; background: #1F4FAE; color: #FFFFFF; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center">{i}</span><span style="flex-grow: 1; font-size: 15px; font-weight: 600">{n}</span>{badge(r, "ac" if r == "OWNER" else "ne")}</div>' for i, n, r in [('VL', 'Vocal Livre', 'OWNER'), ('CJ', 'Coral Jovem', 'VIEWER')]))
    sc = card(h2('Conta') + f'<div style="display: flex; gap: 8px; flex-wrap: wrap">{btn("Trocar senha", "out")}{btn("Sair", "dan")}</div><span style="font-size: 13px; color: $mu">Claro e escuro seguem o sistema.</span>')
    body = page_header('Perfil') + f'<div style="display: flex; flex-direction: column; gap: 14px; max-width: 760px">{pc}{gc}{sc}</div>'
    return shell(body, 'perfil', panel=panel_)
  add('W-Perfil', 'Perfil', perfil(), 1000)
  add('W-PerfilEditar', 'Editar nome e telefone (painel)', perfil(panel('Editar perfil', field('Nome', 'Bruno Reis', focus=True) + field('Telefone', '+55 27 99731-4420', mono=True) + field('E-mail', 'bruno.reis@gmail.com', ro=True) + '<span style="font-size: 13px; color: $mu">O e-mail é o do login e não muda aqui.</span>', foot=btn('Cancelar', 'out', href='W-Perfil.dc.html') + btn('Salvar', 'pri', href='W-Perfil.dc.html'), ctx='Perfil')), 1000)

  menu = f'''<div role="listbox" aria-label="Seus Groups" style="position: absolute; left: 12px; top: 74px; width: 300px; background: $sf; border: 1px solid $bd; border-radius: 18px; padding: 8px; box-shadow: 0 24px 48px -20px $sh; display: flex; flex-direction: column; gap: 2px; z-index: 3">
<span style="padding: 6px 10px; font-size: 12px; font-weight: 700; color: $mu; letter-spacing: 0.04em">SEUS GROUPS</span>
{"".join(f'<a href="W-Inicio.dc.html" role="option" aria-selected="{"true" if on else "false"}" style="text-decoration: none; color: $tx; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 12px; {"background: $acs;" if on else ""}"><span style="width: 32px; height: 32px; border-radius: 10px; background: #1F4FAE; color: #FFFFFF; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center">{i}</span><span style="flex-grow: 1; display: flex; flex-direction: column"><span style="font-size: 14px; font-weight: 600">{n}</span><span style="font-size: 12px; color: $mu">{r}</span></span>{ico(I_CHECK, 16, "2", "$lk") if on else ""}</a>' for i, n, r, on in [("VL", "Vocal Livre", "Owner", True), ("CJ", "Coral Jovem", "Viewer", False), ("BS", "Banda Sinfônica ES", "Viewer", False)])}
</div>'''
  # Trocar de Group: o Início com o seletor aberto
  body = page_header('Olá, Bruno', 'Vocal Livre: 31 pessoas, 4 Teams', btn('+ Pessoa', 'sec') + btn('+ Event', 'pri'), crumb='seg., 2 de nov.', dot='#EF5A3C') + stats([('Próximos Events', '4'), ('Em rascunho', '2', 'RASCUNHO', 'dr'), ('Cancelados', '1', 'CANCELADO', 'ca'), ('Convites pendentes', '3', 'CONVITE PENDENTE', 'dr')]) + s_group.next_trip()
  add('W-TrocarGroup', 'Trocar de Group', shell(body, 'inicio', overlay=menu, open_switch=True), 1000)

  # ---------- Estados ----------
  sk = lambda w, h=14, r=7: f'<span style="display: block; width: {w}; height: {h}px; border-radius: {r}px; background: $sf3"></span>'
  skel = f'<header style="background: $sf; border-radius: 24px; padding: 16px 20px; display: flex; gap: 16px; align-items: center"><span style="width: 52px; height: 52px; border-radius: 16px; background: $sf3"></span><div style="flex-grow: 1; display: flex; flex-direction: column; gap: 10px">{sk("120px", 12)}{sk("280px", 26, 10)}{sk("360px", 12)}</div></header>'
  skel += '<div style="background: $sf; border-radius: 24px; padding: 16px; display: flex; flex-direction: column; gap: 14px" aria-busy="true" aria-label="Carregando a programação">' + ''.join(f'<div style="display: grid; grid-template-columns: 64px 1fr 160px 100px; gap: 16px; align-items: center">{sk("48px")}{sk(w)}{sk("120px")}{sk("70px", 18, 8)}</div>' for w in ['60%', '45%', '70%', '52%', '38%', '64%', '48%', '58%']) + '</div>'
  add('W-Carregando', 'Carregando (esqueletos)', shell(skel, 'events'), 1000)
  err = f'<section style="background: $sf; border-radius: 24px; padding: 64px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center"><span style="width: 64px; height: 64px; border-radius: 20px; background: $caB; color: $caT; display: flex; align-items: center; justify-content: center">{ico(I_WIFI, 30)}</span><h1 style="margin: 0; font-size: 24px; font-weight: 700">Não deu para carregar</h1><p style="margin: 0; font-size: 15px; color: $mu; max-width: 420px; line-height: 1.5">Confira a internet e tente de novo. Nada do que você salvou se perdeu.</p>{btn("Tentar de novo", "pri")}</section>'
  add('W-Erro', 'Erro de conexão', shell(err, 'events'), 1000)
  inline = f'{ev_header("Programação")}{banner("Não deu para salvar a ordem. Tente de novo.", "ca", btn("Tentar de novo", "sec", 34))}{prog_table(only={"sab"})}'
  add('W-ErroSalvar', 'Erro ao salvar (aviso na tela)', shell(inline, 'events'), 1000)

  # ---------- Escuro ----------
  s_group.inicio_owner(dark=True, name='W-Dark-Inicio', title='Início do Group · escuro')
  add('W-Dark-Programacao', 'Event · Programação · escuro', shell(ev_header('Programação') + prog_toolbar() + prog_table(menu_on='Passagem de som'), 'events'), 1260, dark=True)
  add('W-Dark-Timeline', 'Event · Timeline · escuro', shell(ev_header('Timeline') + timeline_cols(), 'events'), 1100, dark=True)
  add('W-Dark-Item', 'Event · item (painel) · escuro', shell(ev_header('Programação') + prog_compact('Translado de volta'), 'events', panel=panel('Translado de volta', s_event.ITEM_PANEL, top=s_event.item_top(), ctx='Dom 22 · Saída Manaus')), 1500, dark=True)
