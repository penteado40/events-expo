# Um mock backend compartilhado em `shared/`, atrás dos mocks das features

Os dados de exemplo do protótipo (`EVENTS`: Events, memberships, RSVPs, Registry items, Contributions) formam uma teia só, lida pelos mocks de várias features (`events`, `members`, `rsvps`, `registry`, `contributions`) e com efeitos cruzados: verificar uma Contribution no mock de `contributions` tem de baixar o `paidContributionCount` que o mock de `events` devolve. Como a ADR-0001 proíbe uma feature de importar outra, decidimos criar `src/shared/mock-backend/`, que faz o papel de um servidor falso: guarda o conjunto de dados em memória (incluindo os Users de exemplo, que antes ficavam no mock de `auth`, para que memberships e Users compartilhem os ids) e aplica as mesmas regras da events-api (visibilidade, `FORBIDDEN`, contagens). O `mock.ts` de cada feature vira um adaptador fino: chama o mock backend com o User da Session e valida a resposta com os schemas da feature.

## Considered Options

- Cada feature com a sua fatia dos dados: duplica dados e uma Verification em `contributions` não chega a `events`.
- Tudo dentro da feature `events`: quebra a organização por feature da ADR-0001.

## Consequences

- Exceção à ADR-0001: `shared/mock-backend/` só pode ser importado pelo `mock.ts` das features e pelos testes; telas, hooks e o `api.ts` não o alcançam. O `eslint-plugin-boundaries` fiscaliza isso.
- O estado vive só em memória (volta ao inicial ao recarregar o app).
