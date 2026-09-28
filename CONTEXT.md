# events-expo

App mobile dos membros de Events (Owners, Managers, Viewers) e do Super admin: acompanhar Events, RSVPs, a Registry e fazer a Verification das Contributions. Os termos de domínio (Event, User, Event member, RSVP, Registry item, Contribution, Verification, Receipt...) vêm do `CONTEXT.md` da [`events-api`](https://github.com/penteado40/events-api) (localmente `../events-api/CONTEXT.md`). Este arquivo define só os termos próprios do app.

## Sessão

**Session** (sessão):
O estado de login guardado no aparelho: qual User está dentro e de que forma entrou. Termina com "Sair" ou quando a API a recusa.
_Avoid_: login (é o ato de entrar), token (é só a credencial)

**Demo mode** (modo demo):
Uma Session aberta pelo botão "Modo demo", sem email nem senha, em que tudo vem de dados de exemplo locais. Não lê nem altera o último email digitado. Existe só durante o desenvolvimento; o app publicado não tem Demo mode.
_Avoid_: mock (é a implementação), modo offline

**Live session** (sessão real):
Uma Session apoiada em um login real na events-api.
_Avoid_: produção, modo real

Enquanto `auth` não é um módulo live (até o PROJ-86), "Entrar" em desenvolvimento abre uma Session contra o mock. Ela não é Live session nem Demo mode: grava o último email, e o Perfil a mostra com o rótulo `modo demo · dados locais`, como toda Session sem API por trás. O app publicado não entra pelo mock.
