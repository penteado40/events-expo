# Spec: events-expo na V2 (design D), app da primeira fatia

> Spec canônica. Origem: PRD da V2 no Jira (PROJ-210, épico PROJ-84); a descrição do PROJ-210 é uma cópia. Edite este arquivo, não ela. Design: canvas [events-expo · Design D](https://claude.ai/artifact/XBggR1iFpMS3Ht8x7Hw8k6) (páginas App e Media kit). Arquitetura: [ADR-0001](adr/0001-estrutura-por-feature.md), [ADR-0002](adr/0002-mock-backend-compartilhado.md); o [ADR-0003](adr/0003-inicio-sobre-o-event-summary.md) foi substituído por este PRD. Termos do app: [`CONTEXT.md`](../CONTEXT.md); termos de domínio: `CONTEXT.md` da events-api.
>
> A spec da V1 (liquid glass, RSVP, Registry, Verification) e o handoff de design `docs/design/` foram removidos; estão no histórico do git.

## Problem Statement

A produção do Vocal Livre monta cada viagem num PDF ("SAÍDA 18 a 20 de setembro MANAUS-AM") e manda pelo WhatsApp. Cada integrante precisa achar no PDF o que é dele (o seu voo, o seu quarto, o seu carro), e quando algo muda (a passagem de som foi das 15h para as 16h, a Jacque saiu do Carro 1) sai um PDF novo e ninguém sabe o que mudou. A events-api pivotou para Groups (PROJ-51, primeira fatia PROJ-122, PRD events-api #57) e vai servir essa programação, mas o events-expo ainda é o app da V1 (RSVP, Registry, Verification de Pix), com outro domínio, outro login e outro visual. Sem o app, o critério de sucesso da primeira fatia ("o Vocal Livre roda uma viagem real no sistema em vez do PDF") não se cumpre.

## Solution

Reescrever o events-expo para a primeira fatia da V2, com o design D (canvas "events-expo · Design D", páginas App e Media kit). Um integrante entra com o login do Clerk (e-mail e senha, Google ou Apple), escolhe o Group, vê os Events (onde e quando), abre um Event em que é Participant e encontra só a programação dele: o Resumo com os Highlights ("Seu quarto: 101") e a Timeline dia a dia, na hora local de cada lugar, com o que mudou desde a última visita riscado ao lado do novo, o que é novo com selo e o que deixou de alcançá-lo como fantasma. A produção (Owners) faz tudo pelo app: adiciona pessoas e Teams, cria o Event em Draft, ajusta os Participants, cria e edita Event items com Fields de texto e de pessoas, Personal notes, Highlight e Audience, publica, cancela e descancela. O Super admin cria Groups e define Owners. O visual tem cor base azul, Events e Teams com cores automáticas e estados em selos coloridos, nos modos claro e escuro.

## User Stories

### Entrada e conta

1. Como integrante, quero entrar com e-mail e senha, Google ou Apple pelo Clerk, para usar o login que já tenho.
2. Como integrante convidado, quero abrir o Activation link e definir minha senha ou escolher Google ou Apple com o e-mail do convite, para entrar pela primeira vez.
3. Como integrante, quero uma mensagem clara quando entro com uma conta Google ou Apple de outro e-mail (`USER_NOT_INVITED`), para entender que preciso usar o e-mail do convite.
4. Como integrante, quero ver que não há cadastro aberto ("quem convida é a produção do seu Group"), para não procurar um botão de criar conta.
5. Como integrante, quero recuperar a senha pelo fluxo do Clerk, para voltar a entrar sem depender da produção.
6. Como integrante, quero continuar logado entre aberturas do app, para não digitar a senha toda vez.
7. Como integrante, quero ser levado ao login quando a sessão expira ou é recusada (`UNAUTHENTICATED`), para nunca ficar numa tela quebrada.
8. Como Deactivated user, quero ser recusado com uma mensagem, para entender que não tenho mais acesso.
9. Como integrante sem nenhum Group ainda, quero ver "Você ainda não está em nenhum Group" com um botão de atualizar, para saber que falta a produção me adicionar.
10. Como integrante, quero ver no Perfil meu nome, e-mail (só leitura), telefone e meus Groups com o papel em cada um, para conferir minha conta.
11. Como integrante, quero editar meu nome e meu telefone (com DDI, validado), para que a produção e os colegas falem comigo pelo WhatsApp.
12. Como integrante, quero sair da conta, para trocar de usuário.
13. Como integrante de vários Groups, quero trocar de Group por uma folha a partir do Início, para ver a programação de cada um.
14. Como desenvolvedor, quero o Demo mode em builds de desenvolvimento, com Owner, Viewer e Super admin de exemplo, para explorar o app sem backend.

### Início do Group

15. Como integrante, quero ver o Início com a saudação, a data e a busca de Events, para começar pelo que importa.
16. Como integrante, quero ver os Events do Group em ordem de data, com coluna de data, onde e quando, para saber o que vem.
17. Como integrante, quero filtrar entre "Próximos", "Que eu vou" e "Passados", para achar um Event.
18. Como Participant, quero o próximo Event em destaque com capa na cor dele, o selo "VOCÊ VAI", o número de itens para mim e "N mudanças" desde a última visita, para abrir direto o que importa.
19. Como Viewer que não é Participant, quero ver o Event com "você não vai", para saber que ele existe sem achar que fui esquecido.
20. Como integrante, quero ver um Event cancelado com o nome riscado e o selo "CANCELADO", para não me programar para ele.
21. Como Owner, quero ver os Events em Draft com o selo "RASCUNHO", para lembrar o que falta publicar.
22. Como integrante, quero um atalho "Hoje" na barra, que abre a Timeline do Event em andamento ou do próximo em que vou, para ver o dia sem procurar.
23. Como integrante, quero puxar para atualizar e ver os dados atualizados ao voltar ao app, para não ficar com a versão velha.

### Event para quem vai

24. Como integrante, quero ver o cabeçalho do Event com a capa na cor dele, nome, onde, período e o fuso ("horário de Manaus"), para ter o contexto.
25. Como Participant, quero ver onde e quando riscados ao lado do novo quando mudaram desde a última visita, para perceber uma mudança de data ou de cidade.
26. Como Participant, quero ver o Resumo: General info primeiro, depois um cartão por Event item com Field em Highlight, só com esses Fields, para ter o essencial numa tela.
27. Como Participant, quero ver nos cartões os Fields de pessoas filtrados para mim ("Seu carro: Carro 1 - EC", "Seu quarto: 101"), para não procurar meu nome.
28. Como Participant, quero ver a Timeline dia a dia, primeiro os itens com data e sem hora ("a definir") e depois os com hora, em ordem, para seguir o dia.
29. Como Participant, quero ver cada hora na hora local do lugar, com o rótulo do fuso quando difere do Event ("horário de Vitória"), nunca convertida, para chegar no horário certo.
30. Como Participant, quero um seletor de dias no topo da Timeline que pula para o dia, para navegar numa viagem longa.
31. Como Participant, quero ver os dias que têm itens, inclusive fora do período do Event, para não perder o que vem antes.
32. Como Participant, quero ver, desde a minha última visita, o valor antigo riscado ao lado do novo em coral ("~~15:00~~ 16:00"), só a diferença líquida, para saber o que mudou sem ler tudo.
33. Como Participant, quero que um item que passou a me alcançar apareça com o selo "NOVO", para notar o que entrou.
34. Como Participant, quero que um item que deixou de me alcançar apareça como fantasma, riscado e com "você não está mais neste item", só com o que eu já via, até a próxima visita, para entender por que sumiu.
35. Como Participant, quero que um item que estava em Draft apareça só como novo quando for publicado, nunca riscado, para não ver mudanças de algo que nunca vi.
36. Como Participant, quero que o Last seen seja marcado quando abro o Event, para que as marcas sumam na visita seguinte.
37. Como Participant, quero ver um item cancelado com o selo "CANCELADO" e o nome riscado, para não ir a ele.
38. Como Participant, quero abrir um Event item e ver nome, dia, hora local, fuso e todos os Fields na ordem da produção, para ter todos os detalhes.
39. Como Participant, quero ver num Field de pessoas quem está comigo, com "Ver todos" para os outros Fields de pessoas do item (os outros carros), para saber com quem vou.
40. Como Participant, quero ver minha Personal note ("Sua nota · só você e a produção"), e as dos outros só quando o Field as deixa visíveis para todos, para respeitar a privacidade.
41. Como Participant, quero ver, num Field de pessoas, quem entrou marcado e quem saiu riscado desde a última visita, para saber da troca de carro.
42. Como Participant, quero ver quem saiu do Event marcado como "fora do Event" nos Fields de pessoas, para não contar com essa pessoa.
43. Como Participant, quero ver nomes soltos (o motorista local) com o selo "SEM LOGIN", para saber que é alguém de fora.
44. Como Participant, quero tocar numa pessoa e abrir o WhatsApp dela pelo telefone, para falar com ela rápido.
45. Como Participant, quero ver quem fez a última alteração de um item e quando ("Alterado por Bruno Reis há 2 h"), para saber a quem perguntar.
46. Como Viewer que não é Participant, quero abrir o Event e ver só onde e quando, a explicação de que a programação não aparece para mim e a lista de quem vai, para entender e falar com a produção se for o caso.
47. Como integrante, quero ver a lista de Participants de qualquer Event do Group, para saber quem vai.
48. Como Participant de um Event cancelado, quero ver o aviso de que ele não vai acontecer e a programação congelada só para consulta, para não me confundir.
49. Como Participant de um Event publicado sem itens para mim, quero ver "A programação ainda não saiu", para saber que não é erro.

### Produção (Owner)

50. Como Owner, quero criar um Event com nome, onde (cidade ou local), fuso padrão e datas de início e fim, sem hora, para começar a montar a programação.
51. Como Owner, quero ser avisado que o Event nasce em Draft (o Group vê só onde e quando), para saber quando publicar.
52. Como Owner, quero editar nome, onde, fuso e datas, inclusive de um Finished event, para corrigir ou completar depois.
53. Como Owner, quero ver o Event em Draft com os Participants, a General info e um resumo por dia, com "+ Item", para montar tudo antes de publicar.
54. Como Owner, quero ver o aviso "FORA DO PERÍODO" em itens com data fora do período do Event, para conferir se foi intencional.
55. Como Owner, quero publicar o Event, para que os Participants vejam a programação.
56. Como Owner, quero cancelar o Event (com confirmação) e descancelar depois, para registrar que ele não vai acontecer sem perder nada.
57. Como Owner, quero que um Event cancelado fique congelado no app (sem editar) até descancelar, para respeitar a regra da API.
58. Como Owner, quero que os Participants nasçam como cópia de todos os Group members ou de um ou mais Teams, para não montar a lista do zero.
59. Como Owner, quero marcar e desmarcar Participants, com atalhos por Team, para ajustar quem vai.
60. Como Owner, quero saber que quem sai deixa de ver os itens e fica marcado como fora do Event nos Fields de pessoas, para entender o efeito.
61. Como Owner, quero criar um Event item com nome, data e hora opcionais (hora só com data, sempre locais) e lugar opcional (nome, endereço e fuso; sem fuso vale o do Event), para descrever cada passo.
62. Como Owner, quero que o item nasça publicado num Event em Draft e em Draft num Event publicado, com o selo "RASCUNHO" e o botão Publicar, para soltar a mudança quando estiver pronta.
63. Como Owner, quero apagar um item em Draft, para descartar o que não vai acontecer.
64. Como Owner, quero cancelar e descancelar um item publicado, para manter o histórico visível com o selo.
65. Como Owner, quero adicionar, editar, apagar e reordenar Fields de texto, para registrar obs, contatos, voltagem e o que levar.
66. Como Owner, quero adicionar Fields de pessoas com Participants e nomes soltos, para montar carros e quartos.
67. Como Owner, quero vincular um nome solto a um User, trocando o nome em todos os Fields do Event, para corrigir quando a pessoa ganhar conta.
68. Como Owner, quero escrever uma Personal note para cada pessoa de um Field de pessoas e escolher se as notas ficam visíveis só para cada um ou para todos no item, para guardar localizadores e "dirigindo".
69. Como Owner, quero ligar e desligar o Highlight de cada Field ("no Resumo"), para decidir o que vai para o Resumo.
70. Como Owner, quero escolher quem vê o item: "Todos que vão" (acompanha os Participants) ou uma lista escolhida montada com Teams (copiados naquele momento) e avulsos, para alcançar só quem precisa.
71. Como Owner, quero saber que quem está num Field de pessoas também vê o item, para não ter que repetir no Audience.
72. Como Owner, quero ver quantas pessoas o Audience alcança antes de aplicar, para conferir.
73. Como Owner, quero reordenar à mão a General info, os itens sem hora de um dia e os empates de hora, sabendo que isso não avisa ninguém, para deixar na ordem certa.
74. Como Owner, quero ver todos os itens, inclusive Drafts e de qualquer Audience, para enxergar a programação inteira.
75. Como Owner, quero abrir as ações de um item (editar, mudar a ordem, cancelar, apagar) e ver a última mudança dele, para agir rápido.

### Group: pessoas e Teams

76. Como integrante, quero ver as pessoas do Group separadas em Owners e Viewers, com Teams, telefone (WhatsApp) e "convite pendente" para quem ainda não entrou, para saber quem é quem.
77. Como Owner, quero adicionar uma pessoa como Viewer com nome, e-mail, telefone e Teams opcionais, para trazer um integrante novo.
78. Como Owner, quero receber o Activation link para repassar pelo WhatsApp ou copiar quando a pessoa ainda não tem conta, para garantir que o convite chegue.
79. Como Owner, quero ver a mensagem certa quando a pessoa já é do Group (`ALREADY_A_GROUP_MEMBER`), para não duplicar.
80. Como Owner, quero gerar um novo Activation link para um Viewer pendente, sabendo que o anterior para de funcionar, para resolver um convite que não chegou.
81. Como Owner, quero remover um Viewer do Group (com confirmação), para tirar quem saiu.
82. Como Owner, quero criar, renomear e apagar Teams e adicionar e tirar pessoas deles, para usar como atalho nos Participants e nos Audiences.
83. Como Owner, quero ver a explicação de que escolher um Team só copia quem está nele naquele momento, para não esperar que mudar o Team mude o que já foi montado.
84. Como Viewer, quero ver as Pessoas e os Teams sem os botões de editar, para consultar sem medo de mexer.

### Super admin

85. Como Super admin, quero ver os Groups da plataforma com o número de Owners e pessoas e o selo "SEM OWNER", para cuidar da plataforma.
86. Como Super admin, quero criar um Group com nome e, opcionalmente, o primeiro Owner pelo e-mail, para abrir a plataforma a um grupo novo.
87. Como Super admin, quero definir um Owner pelo e-mail (Viewer vira Owner, e-mail novo vira convite) e rebaixar um Owner, para manter a produção do Group.
88. Como Super admin, quero ver que o último Owner não pode ser rebaixado nem sair, para respeitar a regra da API.

### Estados e acessibilidade

89. Como integrante, quero esqueletos com a forma dos cartões enquanto carrega, para a tela não pular.
90. Como integrante sem conexão, quero ver a última versão salva com o aviso de quando ela é e "Tentar de novo", para consultar a programação no avião.
91. Como integrante, quero erros com mensagem clara e "Tentar de novo", sem códigos nem detalhes do backend, para me recuperar sozinho.
92. Como integrante, quero o app no modo claro ou escuro, seguindo o sistema, para usar à noite no ônibus.
93. Como usuário de leitor de tela, quero rótulos nos botões só com ícone, estados lidos por texto (nunca só pela cor) e áreas de toque de 44 pt, para usar o app sem enxergar.

## Implementation Decisions

**Escopo e ponto de partida**

- Reescrita do app sobre o domínio V2; o código das features da V1 (events, members, rsvps, registry, contributions) sai. Ficam a estrutura por feature (ADR-0001 do app), o seam de repositórios com `selectRepository` e `LIVE_MODULES`, o cliente HTTP compartilhado, TanStack Query, Zustand, Zod e o `eslint-plugin-boundaries`.
- O ADR-0002 do app (mock backend compartilhado) continua, com um mock backend V2. O ADR-0003 (Início sobre o Event summary da V1) é substituído: o Início é uma leitura da lista de Events do Group.
- `CONTEXT.md` do app: Session, Live session e Demo mode continuam; os termos de domínio vêm do `CONTEXT.md` da events-api (Group, Event, Event item, Field, Personal note, Highlight, Audience, Participant, Team, Draft, Cancelled, Finished event, Summary, Timeline, General info, Change, Last seen). A nota do glossário que cita RSVP e Registry sai.
- Design: canvas "events-expo · Design D". A página App tem as 33 telas; a página Media kit tem marca, cores, tipografia, ícones, componentes, cartões e navegação.

**Identidade (Clerk)**

- O login próprio da V1 sai. O app usa o SDK do Clerk para Expo (e-mail e senha, Google, Apple) e manda o token de sessão do Clerk em `Authorization: Bearer` em toda requisição (ADR-0020 da events-api, PROJ-163).
- A Session do app passa a guardar o User local (de `GET /me`) e o modo (Live ou Demo); o token fica com o Clerk. O cliente HTTP pede o token ao Clerk a cada requisição.
- `UNAUTHENTICATED` encerra a Session e limpa o cache, como hoje. `USER_NOT_INVITED` mostra a mensagem do e-mail do convite. Deactivated user mostra a mensagem de acesso retirado.
- O Activation link chega como convite do Clerk e abre o app por deep link (PROJ-170, PROJ-176). Reset de senha é do Clerk.
- `GET /me` traz nome, e-mail, telefone, a Membership (`[{ groupId, groupName, role }]`) e se é Super admin (PROJ-178). `PATCH /me` edita nome e telefone (PROJ-165).
- Desvio do PROJ-122: o design D mostra Google e Apple; isso já está no PROJ-159.

**Módulos e repositórios** (cada um com repositório, schemas Zod compartilhados entre mock e HTTP, hooks TanStack)

- `auth`: Clerk, `me`, editar perfil, deep link do convite.
- `groups`: listar Groups, membros (nome, e-mail, telefone, papel, pendente), adicionar Viewer, novo Activation link, remover Viewer, Teams (CRUD e membros).
- `events`: listar Events do Group, criar, editar, publicar, cancelar e descancelar; Participants (nascer de Group members ou Teams, ajustar).
- `schedule`: `GET /events/:id/schedule` (General info, Timeline por dia, marcas de mudança, `seenUpTo`) e `POST /events/:id/last-seen` (PROJ-187, PROJ-196, PROJ-202, PROJ-207, PROJ-209).
- `items`: criar, editar, apagar, publicar, cancelar e descancelar Event items; Fields de texto e de pessoas (Users e nomes soltos, Personal note, visibilidade, Highlight, ordem), vincular nome solto, Audience, ordem manual.
- `admin`: Groups da plataforma, criar Group, definir e rebaixar Owner.
- `profile`: tela sobre a Session.
- Contratos: período do Event como `{ startDate, endDate, timezone }`; hora de item como `{ date, time, timezone }`, sem conversão; instantes técnicos em ISO 8601 UTC (PROJ-182, PROJ-187). Os nomes exatos dos campos de cada rota se fecham com o PRD #57 e as tarefas da events-api; o app segue o OpenAPI do Scalar quando cada módulo entrar em `LIVE_MODULES`.

**Módulos puros (profundos, sem React, testáveis isolados)**

- **Montagem da programação**: recebe o payload da `schedule` e quem está vendo, e devolve as linhas da tela: General info; dias com itens (sem hora primeiro, depois por hora, respeitando a ordem manual); por item, o estado visual (padrão, sem hora, mudou, novo, cancelado, fantasma, rascunho), os valores antigos riscados, os Fields filtrados para a pessoa ("Seu carro"), as Personal notes visíveis e o rótulo de fuso quando difere do Event. Usada pelo Resumo e pela Timeline.
- **Rascunho do item**: o estado do editor (nome, data, hora, lugar, Fields, Audience) com ações puras (adicionar Field, mover, trocar visibilidade, copiar Team para o Audience) e a geração do payload de escrita. Copiar um Team expande as pessoas naquele momento (o Team não fica vinculado). Também diz quantas pessoas o Audience alcança.
- **Permissões**: a partir da Membership e do estado do Event, diz o que a pessoa pode fazer (editar Event, editar itens, gerenciar pessoas e Teams, ver Drafts, ver a programação, ser Super admin). Esconde ações; a API continua sendo quem decide.
- **Cores automáticas**: tom categórico de um Event ou Team pelo id (coral, verde, roxo, rosa, turquesa, ouro; nunca o azul da marca), sem campo na API.
- **Datas locais**: formatação de data, dia da semana, hora e rótulo de fuso a partir de `{ date, time, timezone }`, sem conversão; "fora do período"; Finished event pela data final no fuso do Event.

**Visual (design D)**

- Tokens por papel (`bg`, `surface`, `surface-brand`, `text`, `text-muted`, `action`, `link`, `badge-bg`, `badge-text`, `team-chip`, `cover`, `timeline-dot`), com valores claro e escuro. Paleta em 5 passos (50, 100, 500, 700, 900): azul da identidade, 6 categóricas, vermelho para cancelado e cinza.
- Estados em selos pequenos e sempre com texto: coral = mudou/novo, verde = agora/você vai, ouro = rascunho, vermelho = cancelado, cinza = removido. Event items ficam neutros. Ações sempre azuis, mesmo dentro de um Event colorido.
- Tipografia: Outfit, com IBM Plex Mono só para links e códigos; o "·" colorido nos títulos.
- Navegação: barra flutuante azul do Group (Início, Hoje, Pessoas, Perfil); dentro do Event, a barra troca para Resumo, Timeline e Pessoas. Cabeçalho azul no Group e na cor do Event dentro dele, com cartão flutuante sobre a capa. Folhas baixas e altas e ações fixas no rodapé como no Media kit.
- O glass da V1 (`expo-glass-effect`, `expo-blur`, fundo com orbs) sai.
- Ícone do app: W2 (cartão branco com a linha do tempo azul, o ponto coral e os itens nas cores da paleta) e a versão escura dele. Splash: fundo azul 900 → 500 com o ícone ao centro. O nome "Events" é provisório.

**Dados e sincronização**

- Ao abrir um Event, o app lê a `schedule` e então chama `last-seen` com o `seenUpTo` recebido, para que as marcas apareçam nesta visita e sumam na próxima.
- As escritas da produção invalidam a `schedule`, a lista de Events e os Participants do Event. Sem atualização otimista nesta fatia, exceto a ordem manual.
- A última leitura de cada Event fica em cache persistido no aparelho, para a consulta sem conexão.
- Os módulos entram em `LIVE_MODULES` um a um, conforme as tarefas da events-api ficam prontas; até lá, o mock V2 responde com o cenário de Manaus.

## Testing Decisions

- Um bom teste exercita comportamento externo pelos seams combinados (repositórios, módulos puros, hooks, telas com regra) e sobrevive à troca do mock pelo HTTP e à refatoração das telas. Não testa estilos nem a árvore de componentes.
- **Contrato dos repositórios**: uma suíte por repositório, rodando contra o mock V2 e contra o HTTP com o `fetch` falso (`*-repository.contract.test.ts`). Cobre envelope de erro, `NETWORK`, `UNAUTHENTICATED`, `USER_NOT_INVITED`, `ALREADY_A_GROUP_MEMBER`, `403` de Viewer nas escritas, Event em Draft sem itens para Viewer, Viewer não Participant sem itens, regra do último Owner.
- **Módulos puros**: tabelas de casos com o cenário de Manaus. Montagem da programação: translado de domingo 00:40 no domingo, item na véspera do período, sem hora antes de com hora, riscado só pela diferença líquida, novo, fantasma, Draft só como novo, Personal notes privadas e para todos, rótulo de fuso. Rascunho do item: Teams expandidos, contagem do Audience, ordem dos Fields, payload. Permissões: Owner, Viewer Participant, Viewer não Participant e Super admin × Draft, publicado, Cancelled e Finished. Cores e datas locais com relógio fixo. Prior art: os testes de domínio em `shared/domain` e a matriz de papéis da events-api (AccessPolicy em Vitest).
- **Sessão e hooks** (`renderHook`): login pelo Clerk com um Clerk falso, restauração da Session, `UNAUTHENTICATED` limpando a Session uma vez, `USER_NOT_INVITED`, troca de Group, marcar o Last seen ao abrir o Event, invalidação após escritas da produção. Prior art: os testes de `auth-hooks` e `session-store`.
- **Telas com regra** (RNTL, com os mocks de Reanimated e Worklets do `jest.setup`): editor de item (Fields, Highlight, Draft e Publicar), Quem vê (Todos vs escolhido, Teams copiados, contagem) e Field de pessoas (nota, visibilidade, nome solto).
- Fora dos testes automáticos: animações e navegação; validação manual no iPhone e no simulador iOS 26.

## Out of Scope

- As fatias seguintes da events-api: Event manager e Item lead (PROJ-114, PROJ-119, PROJ-125), Event guest e Guest access link (PROJ-110, PROJ-118), Request (PROJ-123, PROJ-125), despublicar e Archived event (PROJ-112), Field de fotos, paletas e Saved fields (PROJ-113, PROJ-114), Item templates (PROJ-114), tela do Change log (PROJ-115), Notifications, push e preferência de canal (PROJ-75, PROJ-116, PROJ-117).
- Saved place (lugar salvo) como atalho do Group.
- Copiar um Event; mover os itens quando o período muda.
- Web e tablet; landscape; idiomas além de pt-BR. O dashboard web da produção é um esforço à parte: o mapa "Events-Web: dashboard web da produção" (PROJ-241).
- EAS Build, App Store e políticas de loja (ficam para um ticket de release).
- Qualquer mudança na events-api.

## Further Notes

- Fontes: mapa PROJ-51 e tickets resolvidos (PROJ-107 a 125, 159), tarefas da primeira fatia (PROJ-161 a 209) e glossário da events-api (branch `docs/pivo-groups`). Os contratos finais vêm do PRD da events-api (#57) e do OpenAPI.
- Cenário de exemplo do mock e dos testes: Group Vocal Livre; Event "Saída Manaus" (20 a 22 de novembro, Manaus, AM) com voo VIX → MAO, Hotel Taj Mahal, passagem de som 15h → 16h, show no Teatro Amazonas, translado de 00:40 no domingo, Carro 1 - EC (Matias, Jacque saindo, Lu entrando), Seu Raimundo como nome solto; Teams Cantores, Banda, Técnica e Produção.
- Pontos em aberto na events-api que afetam o app: o Owner ver a programação "como" um Participant; mudança de Audience ser Change só da produção (PROJ-160).
- Histórias da V2 no Jira: épico PROJ-84, rótulos `events-expo` e `v2` (PROJ-211 em diante).
