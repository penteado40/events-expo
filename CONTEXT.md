# events-expo

App mobile dos integrantes de um Group (Owners e Viewers) e do Super admin: ver os Events do Group e a programação de cada um, e montá-la na produção. Os termos de domínio (Group, Event, Event item, Field, Personal note, Highlight, Audience, Participant, Team, Draft, Cancelled, Finished event, Summary, Timeline, General info, Change, Last seen...) vêm do `CONTEXT.md` da [`events-api`](https://github.com/penteado40/events-api) (localmente `../events-api/CONTEXT.md`). Este arquivo define só os termos próprios do app.

## Sessão

**Session** (sessão):
O estado de login guardado no aparelho: qual User está dentro (o User local de `GET /me`, com a Membership) e de que forma entrou. O token não fica nela: é do Clerk, pedido a cada requisição. Termina com "Sair" ou quando a API a recusa (sessão do Clerk inválida ou Deactivated user).
_Avoid_: login (é o ato de entrar), token (é só a credencial)

**Demo mode** (modo demo):
Uma Session aberta pelo botão "Modo demo" como um User de exemplo (Owner, Viewer ou Super admin), sem Clerk, em que tudo vem de dados de exemplo locais. Existe só durante o desenvolvimento e num Demo build (os previews); o app das lojas e a web de produção com a events-api não têm Demo mode.
_Avoid_: mock (é a implementação), modo offline

**Demo build** (preview):
Um build de release feito com `EXPO_PUBLIC_DEMO_BUILD=true` para os previews de cada PR e do `main` (a web na Vercel, o app no Expo Go via EAS Update; ver `docs/previews.md`). Só tem Demo mode: sem Clerk, sem events-api.
_Avoid_: staging, build de teste

**Live session** (sessão real):
Uma Session aberta por um login real no Clerk (e-mail e senha, Google ou Apple), aceito pela events-api. Toda Session é ou Live session ou Demo mode.
_Avoid_: produção, modo real
