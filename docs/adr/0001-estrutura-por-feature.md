# Estrutura por feature, com o mock escondido atrás do api.ts de cada feature

O app é organizado por feature, no estilo do bulletproof-react: `src/features/<feature>/` (`api.ts`, `repository.ts`, `mock.ts`, `schemas.ts`, `hooks/`, `components/`), código comum em `src/shared/` (`components/ui`, `lib`, `theme`, `session`) e rotas do expo-router em `src/app/`, que só compõem telas a partir das features. Escolhemos esse modelo por ser o padrão de mercado mais reconhecível em React/React Native. Consideramos organizar por camada (`components/`, `hooks/`, `services/`: simples, mas uma mudança em Contributions se espalha por várias pastas), Feature-Sliced Design (regras rígidas e boas, mas pesado para um app deste tamanho, e a pasta `app/` do FSD disputa o nome com a do expo-router) e a Clean Architecture/DDD da `events-api` (cerimônia demais para um front e pouco comum em vagas de React Native).

Como a maioria dos endpoints ainda não existe, cada feature fala com os dados por uma interface de repositório (declarada no `repository.ts`, para o `mock.ts` usá-la sem import circular, e reexportada pelo `api.ts`); o `api.ts` escolhe a implementação: Demo mode sempre usa o `mock.ts` da feature; uma Live session usa HTTP para os módulos listados em `LIVE_MODULES` e o mock para o resto. Hooks do TanStack Query chamam só o `api.ts`, e o Zod valida as respostas do mock e do HTTP com os mesmos schemas.

## Consequences

- Features não importam umas das outras; o que é comum sobe para `shared/`. A Session (store Zustand persistido no SecureStore, o último email digitado e o sinal de sessão expirada) fica em `src/shared/session/` porque todas as features dependem dela.
- As fronteiras são fiscalizadas por `eslint-plugin-boundaries`, como na `events-api`: `app` importa `features` e `shared`; uma feature importa só a si mesma e `shared`; `shared` importa só `shared`; o `mock.ts` de uma feature só é importado pelo `api.ts` e pelos testes dela.
- Trocar um módulo para HTTP é adicionar a implementação HTTP no `api.ts` e o nome em `LIVE_MODULES`; as telas não mudam. A mesma suíte de contrato roda contra o mock e contra o HTTP.
- Uma feature pode ter módulos puros próprios na raiz (ex.: `account-rows.ts`), fora da lista acima. Regras usadas por mais de uma feature sobem para `src/shared/domain/`, um arquivo por conceito.
- Regras de domínio que cruzam features (ex.: `canVerify`, que precisa do User da Session e do Event) têm de morar em `shared/`, e não em uma feature.
