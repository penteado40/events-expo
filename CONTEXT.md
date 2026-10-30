# events-expo

App mobile dos integrantes de um Group (Owners e Viewers) e do Super admin: ver os Events do Group e a programação de cada um, e montá-la na produção. Os termos de domínio (Group, Event, Event item, Field, Personal note, Highlight, Audience, Participant, Team, Draft, Cancelled, Finished event, Summary, Timeline, General info, Change, Last seen...) vêm do `CONTEXT.md` da [`events-api`](https://github.com/penteado40/events-api) (localmente `../events-api/CONTEXT.md`). Este arquivo define só os termos próprios do app.

## Sessão

**Session** (sessão):
O estado de login guardado no aparelho: qual User está dentro e de que forma entrou. Termina com "Sair" ou quando a API a recusa.
_Avoid_: login (é o ato de entrar), token (é só a credencial)

**Demo mode** (modo demo):
Uma Session aberta pelo botão "Modo demo", sem email nem senha, em que tudo vem de dados de exemplo locais. Existe só durante o desenvolvimento; o app publicado não tem Demo mode.
_Avoid_: mock (é a implementação), modo offline

**Live session** (sessão real):
Uma Session aberta pelo botão "Entrar", apoiada em um login real na events-api. Toda Session é ou Live session ou Demo mode.
_Avoid_: produção, modo real
