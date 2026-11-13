# O dashboard web é o alvo web do próprio events-expo, e web quer dizer desktop

A produção (Owners) e o Super admin vão ganhar um dashboard web para cuidar dos dados no computador, com paridade com o app (mapa PROJ-241). Decidimos que ele é o alvo web deste mesmo app Expo, hospedado como SPA (`web.output: "single"`), e não um app separado. Na paridade, o web tem as mesmas capacidades que o app e muda só a casca. Assim ele divide as features, os repositórios (`selectRepository`, `LIVE_MODULES`), os schemas Zod, os módulos de domínio, os hooks do TanStack, a Session e o Clerk sem refatorar nada. A pesquisa da PROJ-243 (`docs/research/expo-web-dashboard.md`, no branch `feat/proj-243`) confirmou que tudo isso roda no web: o `@clerk/expo` no web é o `@clerk/react` de navegador, e o convite chega por `__clerk_ticket` numa rota comum.

No código, **web é desktop**: o dashboard vive em arquivos `.web.tsx` e `_layout.web.tsx` ao lado das versões nativas, escolhidos pela plataforma. Não há layout responsivo que mostre as telas mobile no navegador. Quem está no celular usa o app nativo.

## Considered Options

- **App separado (Vite + React) num monorepo** (`apps/mobile`, `apps/web`, `packages/*`): ganha o ecossistema DOM (tabelas, arrastar e soltar, menus), mas exige mover o repo e injetar por parâmetro o ambiente (`__DEV__`, `process.env.EXPO_PUBLIC_*`), o storage e a identidade da Session, e manter o design D duas vezes (StyleSheet e CSS). Só compensa se os "poderes de desktop" (Timeline em grade, importar planilha, impressão) entrarem no escopo.
- **Repo novo**: duplica schemas e regras de permissão que precisam andar junto com o app.
- **Web responsivo por largura**: dobra a matriz de telas e testes para atender quem já tem o app nativo.
- **Spike de componentes antes de decidir**: descartado. Na paridade, os componentes densos (tabela, ordem manual, menu de contexto) têm escopo pequeno, e uma resposta ruim se resolve com DOM num `.web.tsx` sem mudar onde o web mora.

## Consequences

- O web deixa de ser só um preview de desenvolvimento e vira plataforma alvo (o comentário em `secure-storage.web.ts` muda).
- React Native Web não traz tabela, menu de contexto nem arrastar para reordenar. Esses componentes são construídos em RN Web ou, quando precisar, com DOM em `.web.tsx`.
- Todo arquivo de rota `.web.tsx` precisa de uma versão universal ao lado (regra do Expo Router). A convivência das rotas do dashboard com as do app se decide junto com a arquitetura de informação.
- Componentes `.web.tsx` pedem o preset web do `jest-expo` nos testes.
- Se os poderes de desktop voltarem, a saída é um monorepo. A camada de dados, já isolada atrás dos repositórios, é o que vira pacote.
