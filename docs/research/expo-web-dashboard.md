# Viabilidade do Expo web para um dashboard desktop

Pesquisa do ticket PROJ-243 (mapa PROJ-241, "Events-Web: dashboard web da produção"). Data: 02/11/2026.

**Pergunta.** O events-expo (Expo + expo-router, TanStack Query, Zustand, Zod, Clerk para Expo) consegue servir um dashboard web desktop para Owners e Super admin (tabelas densas, barra lateral + conteúdo + painel, hover e teclado, arrastar para reordenar, login Clerk com convite e Google/Apple, hospedagem), ou o web pede outra stack (Next.js ou Vite + React) compartilhando módulos?

**Resposta curta.** Sim, o mesmo app consegue. Nada de bloqueante foi encontrado: o app atual já exporta para web hoje (`npx expo export -p web`, testado nesta pesquisa), o Clerk para Expo no web usa por baixo o SDK de React para navegador, e as rotas, os layouts e a hospedagem são suportados oficialmente. O custo está na UI. React Native Web não traz tabela, menu de contexto nem arrastar e soltar, então o dashboard terá que construir esses componentes (ou usar DOM em arquivos `.web.tsx`). Além disso, várias peças do app supõem celular e precisam de uma versão web: o `Stack` com modal em tela cheia, a barra de abas flutuante, a `Sheet` em `Modal`, o `secure-storage` e o `AppState`. Um app separado ganha o ecossistema web (tabelas, dnd, CSS), mas paga um monorepo e duas camadas de UI, e os módulos compartilháveis ainda dependem de `__DEV__`, `process.env.EXPO_PUBLIC_*` e do `useSession`.

Legenda: **[fonte]** é fato de documentação ou código-fonte primário; **[verificado]** foi testado ou lido neste repo; **[inferência]** é conclusão minha, não está escrita na fonte.

---

## 0. Versões no repo (package.json em `main`, bfcc088)

| Pacote | Versão | Observação |
| --- | --- | --- |
| `expo` | ~58.0.22 | SDK 58 |
| `expo-router` | ~58.0.29 | `app.json`: `web.output: "single"`, `typedRoutes`, `reactCompiler` |
| `react` / `react-dom` | 19.3.0 | `react-dom` já está instalado |
| `react-native` | 0.88.1 | |
| `react-native-web` | ^0.21.4 (instalado 0.21.4) | |
| `@clerk/expo` | ^4.14.4 | Core 3; depende de `@clerk/react` 6.18.3 (instalado) |
| `@tanstack/react-query` | ^5.104.0 | sem persister de cache instalado |
| `zustand` | ^5.0.15 | `persist` sobre `expo-secure-store` |
| `zod` | ^4.6.5 | |
| `react-native-reanimated` / `react-native-worklets` | 4.7.1 / 0.13.0 | usado no `events-home.tsx` (header que encaixa) |
| `expo-secure-store` | ~58.0.2 | só nativo |
| `expo-web-browser` / `expo-auth-session` / `expo-apple-authentication` | 58.0.x | SSO |

O código já admite o web como *preview de desenvolvimento*: `src/shared/session/secure-storage.web.ts` diz "Web is not a target platform; this fallback only lets `expo start --web` be used as a development preview" **[verificado]**.

---

## 1. Expo Router no web

**Rotas e URLs.** Toda rota do `src/app` já é uma URL no web; Expo Router existe para que as rotas sejam universais. Arquivos por plataforma são aceitos no `src/app` "only if a **non-platform version** also exists", justamente "to keep routes universal for deep linking". Por exemplo, `_layout.web.tsx` vale no web e `_layout.tsx` nas outras plataformas **[fonte: Expo, Platform-specific modules]**. Portanto o dashboard pode ter um `_layout.web.tsx` com barra lateral, sem tocar no layout nativo, desde que cada rota web exista também como arquivo universal (ou como rota que o nativo simplesmente não navega).

**Layouts aninhados (barra lateral + conteúdo + painel).** As abas headless de `expo-router/ui` (`Tabs`, `TabList`, `TabTrigger`, `TabSlot`) "are unstyled and flexible" e permitem "build complex UI patterns from scratch". `TabSlot` "can be nested inside other components within `Tabs`" **[fonte: Expo, Custom tab layouts]**. Os exemplos oficiais também usam `Slot` dentro de um layout web próprio **[fonte: Expo, Platform-specific modules]**. Uma barra lateral é só um `View` com `TabTrigger`s ao lado de um `TabSlot` **[inferência]**: a página não fala de barra lateral nem de web, então isso pede um spike curto. O painel lateral (detalhe ao lado da lista) pode ser uma rota aninhada (`events/[id]/_layout.web.tsx` com lista + `Slot`), o que deixa a URL do painel compartilhável **[inferência]**.

**Rotas protegidas.** `Stack.Protected` redireciona para "its anchor route or the first available screen" quando o guard é falso. As telas protegidas "are evaluated on the client side only" e "are not a replacement for server-side authentication" **[fonte: Expo, Protected routes]**. No web isso não muda nada para nós, porque a autorização de verdade já está na events-api.

**Saída do build e hospedagem.**

- `web.output`: `single` gera um SPA com um `index.html` ("all requests must be redirected" para ele), `static` gera um HTML por rota, e `server` gera `client` + `server` e exige servidor **[fonte: Expo, Publishing websites]**.
- Em `static`, rotas dinâmicas precisam de `generateStaticParams` e não há renderização por requisição **[fonte: Expo, Static rendering]**. Num dashboard autenticado, todo conteúdo útil depende do login, então `static` não traz ganho e `single` (o que o app já usa) basta **[inferência]**.
- Hosts documentados: EAS Hosting (recomendado), Netlify, Vercel, AWS Amplify, Firebase, GitHub Pages. Em `single`, Netlify precisa de `/* /index.html 200` e Vercel de um `rewrites` para `/` **[fonte: Expo, Publishing websites]**.
- EAS Hosting aceita `single`, `static` e `server`. O deploy é `npx expo export --platform web` seguido de `eas deploy`, com deploys imutáveis, aliases e rollback. "Custom domains are available on paid plans", com um domínio por projeto. Roda em Cloudflare Workers **[fonte: EAS Hosting]**.
- **[verificado]** `npx expo export -p web` no estado atual de `main` termina sem erro e gera `dist/index.html` com 12 bundles divididos por rota. O `entry` tem ~1,1 MB e o `__common` ~1,2 MB, sem compressão. Um build de release sem `EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` lança erro na inicialização (`api-url.ts`, `clerk-key.ts`), por desenho. A hospedagem precisa dessas variáveis no build.

**CORS.** A spec registra: "CORS in the backend is localhost-only outside production; irrelevant for native, matters only for `expo start --web`" (`docs/spec.md`) **[verificado]**. Um dashboard em produção precisa que a events-api aceite a origem do domínio web. É uma mudança na events-api, seja qual for a stack.

---

## 2. Clerk no web a partir do mesmo app

**Como `@clerk/expo` 4.14.4 se comporta no web** (lido em `node_modules/@clerk/expo/dist`) **[fonte: código do SDK]**:

- `ClerkProvider` verifica `isWeb()` (`Platform.OS === "web"`). No web ele não cria a instância nativa (`Clerk: null`), passa `standardBrowser: true` ao `InternalClerkProvider` de `@clerk/react` e chama `maybeCompleteAuthSession()` de `expo-web-browser` durante o render. Ou seja, no web o app roda o Clerk de navegador (clerk-js) normal.
- O `tokenCache` (que usa `expo-secure-store`) só é passado à instância nativa. **No web ele é ignorado** e a sessão fica com o clerk-js do navegador. Então o `tokenCache` do `_layout.tsx` não quebra o web.
- `@clerk/expo/web` exporta os componentes prontos do `@clerk/react` (`SignIn`, `UserButton`, `UserProfile`…). No nativo eles lançam "component is not supported in native environments". A doc diz: "Use the components that match the platform" e, para projetos existentes, ajuste os fluxos customizados que tenham código nativo "with platform-specific code or Expo Router's platform-specific modules" **[fonte: Clerk, Expo web support]**.

**Senha + MFA (fluxo customizado atual).** `clerk-sign-in.ts` usa `useSignIn` do Core 3 (`signIn.mfa.*`, `signIn.finalize()`), que é a mesma API do `@clerk/react` **[inferência a partir do código]**. O fluxo deve rodar no web sem mudança. A UI é RN puro (`TextInput`, `Pressable`).

**Google.** `useSSO` "can be used in both web and native apps" **[fonte: Clerk, useSSO]**. No código, `startSSOFlow` chama `WebBrowser.openAuthSessionAsync`, que no web abre um **popup** (`window.open`), e o `maybeCompleteAuthSession` fecha o popup na volta **[fonte: código de `expo-web-browser` 58.0.7 e `@clerk/expo`]**. O `use-sso-sign-in.ts` atual passa `redirectUrl: AuthSession.makeRedirectUri()`, que no web vira a URL do próprio site. Essa URL precisa estar na allowlist de redirect do Clerk **[fonte: Clerk, OAuth custom flow: "The redirect URL must be registered… Without this… the session will not be created"]**. Risco: bloqueador de popup se a chamada não vier direto de um clique **[inferência]**.

**Apple.** `useSignInWithApple` é "only available on iOS devices", e o stub fora do iOS diz: "For web platforms, use the OAuth-based Apple Sign-In flow instead via useSSO" com `strategy: 'oauth_apple'` **[fonte: Clerk docs e código do SDK]**. O `use-sso-sign-in.ts` já faz isso: Apple nativo só quando `Platform.OS === 'ios'`, senão `startSSOFlow({ strategy: 'oauth_apple' })` **[verificado]**. No web funciona pelo mesmo popup. A configuração do Apple OAuth no Clerk de produção precisa incluir o domínio web **[inferência; conferir no painel do Clerk]**.

**Convite / Activation link.** No convite do Clerk, o link leva à URL de redirect com `?__clerk_ticket=…`, e o fluxo customizado lê o parâmetro e chama `signUp.ticket({ ticket })` ou `signIn.ticket({ ticket })`, depois `finalize()`. A doc tem o exemplo para Expo com `useLocalSearchParams<{ __clerk_ticket?: string }>()` **[fonte: Clerk, Application invitations; Accept organization invitations]**. No web isso é mais simples que no nativo: o link do e-mail é uma URL comum que cai numa rota do Expo Router, sem precisar de universal link nem do scheme `events-expo://` **[inferência]**. Se o "Activation link" for da events-api (ativação de usuário, events-api #4) e não do Clerk, vale a mesma lógica: uma rota web que lê o parâmetro.

**Conclusão Clerk:** nada força `@clerk/react` direto. O `@clerk/expo` já é ele no web. Sobra configurar a allowlist de redirect, o domínio e o Apple OAuth no painel do Clerk.

---

## 3. React Native Web para UI densa

| Necessidade | O que RNW 0.21 oferece | Avaliação |
| --- | --- | --- |
| Hover | `Pressable` com `onHoverIn`/`onHoverOut` e estado `hovered` ("Whether the view is being hovered over by a mouse") **[fonte: RNW Pressable]** | Funciona |
| Foco e teclado | `Pressable` "responds to touch, mouse, and keyboard interactions", com estado `focused`. `onKeyDown`/`onKeyUp`, `onFocus`/`onBlur` como eventos sintéticos do React DOM **[fonte: RNW Pressable, Interactions]** | Funciona; atalhos globais pedem um `keydown` no `document` (hook próprio) **[inferência]** |
| Menu de contexto | `onContextMenu` "Called when a native context menu is displayed" **[fonte: RNW Interactions]** | Só o evento; o menu (posicionamento, foco, teclado) é para construir |
| Tabelas | `role` "is used to infer an analogous HTML element where appropriate" (exemplos: `article`, `heading`, `paragraph`) **[fonte: RNW Accessibility]**. A doc não diz se `table`/`row`/`cell` viram `<table>` | Não há componente de tabela. Construir com `View` em flex/grid e `role` ARIA, ou usar DOM num `.web.tsx` |
| Arrastar para reordenar | A doc de interações não documenta drag. Reanimated no web roda "purely in JavaScript", e "the efficiency of the animations might be lower" **[fonte: RNW Interactions; Reanimated web support]** | Não há solução pronta no stack atual. `react-native-gesture-handler` não está instalado |
| Layout largo e responsivo | `useWindowDimensions` e flexbox do RN funcionam no web **[inferência; API padrão do RN]** | Funciona; breakpoints são responsabilidade nossa |

**Saída para o que falta.** No web o renderizador é o `react-dom`. Num arquivo `.web.tsx` dá para usar elementos HTML e bibliotecas DOM (por exemplo, uma lib de dnd ou de tabela) **[inferência; a doc da Expo afirma que o runtime nativo "does not support elements like `<div>`", e não proíbe isso no web]**. As DOM components (`'use dom'`) existem para levar código web ao nativo via WebView ("as-is on web") **[fonte: Expo, DOM components]**. Para um dashboard só web elas não são necessárias, mas mostram que misturar DOM e RN no web é um caminho previsto. O custo é ter componentes de UI só web e manter dois estilos (StyleSheet do RN e, nesses pontos, DOM).

---

## 4. O que do app atual roda no web sem mudança

| Peça | Roda no web? | Evidência / observação |
| --- | --- | --- |
| Schemas Zod (`features/*/schemas.ts`) | Sim | TS puro |
| Módulos de domínio (`shared/domain/*`: `group-role`, `local-dates`, `auto-tone`, `phone`, `initials`; `home-lines`, `current-group`, `profile-form`) | Sim | Nenhum importa `react-native` nem `expo-*` **[verificado por grep]**. `local-dates` usa `Intl`, que o navegador tem |
| `http.ts` / `api-client.ts` / repositórios / `selectRepository` / `LIVE_MODULES` | Sim | `fetch` e `AbortController` são nativos do navegador. Dependem de `__DEV__` e `process.env.EXPO_PUBLIC_*`, que o Metro define também no web **[verificado: o export passou]** |
| Mock backend compartilhado | Sim | TS puro. Lembrete: o Demo mode só existe em build de desenvolvimento (`session-store.ts`, `isDev = __DEV__`), então um dashboard de produção exige os módulos em `LIVE_MODULES` |
| Hooks TanStack | Sim | `@tanstack/react-query` é web-first. `refetchOnAppFocus` liga o `focusManager` ao `AppState` do RN; no web o padrão do TanStack já usa `visibilitychange`, então no web basta não registrar esse listener (`query-client.web.ts` ou um `Platform.OS`) **[inferência]** |
| `expo-secure-store` | **Não** | Plataformas: "Android, iOS, tvOS"; `isAvailableAsync()` "resolves `true` on Android and iOS only" **[fonte: Expo SecureStore]**. O app já tem `secure-storage.web.ts` com `localStorage` |
| Store da Session persistida (Zustand `persist`) | Sim, via `localStorage` | Já existe `secure-storage.web.ts` e o `createPersistedStore` trata storage síncrono ("with synchronous storage (web) this runs before `store` is assigned") **[verificado]**. O token do Clerk não fica aí: no web ele vive no clerk-js |
| Cache persistido do Event (V2, citado no mapa) | Decisão, não bloqueio | Nada instalado hoje (sem persister do TanStack). No web seria `localStorage`/IndexedDB; o mapa já lista "Cache offline no web" como não especificado |
| `ClerkProvider` + `tokenCache` | Sim | `tokenCache` é ignorado no web (seção 2) |
| SSO Google/Apple (`use-sso-sign-in.ts`) | Sim, com config | Popup + allowlist de redirect (seção 2) |
| `Stack` com `presentation: 'fullScreenModal'`, `floating-tab-bar`, `Sheet` (`Modal` RN), `KeyboardAvoidingView`, header com Reanimated | Rodam, mas são UI de celular | O dashboard precisa de layout próprio (`_layout.web.tsx` + componentes desktop) |

Resumo: a camada de dados e de domínio roda no web como está. O que muda é a casca: layouts, navegação, componentes densos e dois ajustes de plataforma (`AppState` e storage).

---

## 5. Alternativa de referência: app web separado (Vite ou Next.js) com módulos compartilhados

**Stack.** `@clerk/react` (Core 3 renomeou `@clerk/clerk-react` para `@clerk/react`, v6; o pacote antigo está deprecado) ou `@clerk/nextjs` v7, mais TanStack Query, Zod e Zustand, que são todos web-first **[fonte: Clerk, Core 3 upgrade guide e changelog]**. Ganha o ecossistema DOM inteiro (tabelas, dnd, menus, CSS) sem adaptação.

**Custo de compartilhar código.**

- **Monorepo**: a Expo configura o Metro para monorepo automaticamente desde o SDK 52 e aceita workspaces de npm, pnpm, Yarn e Bun (`apps/`, `packages/`, dependência `"*"`). Atenções: "Duplicate React versions in a single app will cause runtime errors". Isolated installs são suportados desde o SDK 54, mas "some React Native libraries may still fail" **[fonte: Expo, Monorepos]**. Isso significa mover o repo para `apps/mobile` + `apps/web` + `packages/*`, ajustar o CI (`checks`, `gitleaks`, `expo-doctor`), o `eslint-plugin-boundaries` e os aliases `@/`. A doc avisa: "Monorepos are not for every project."
- **O que precisaria de refatoração para virar pacote** **[verificado por grep]**: `select-repository.ts`, `api-client.ts`, `api-url.ts`, `clerk-key.ts` e `session-store.ts` leem `__DEV__` (global do RN) e `process.env.EXPO_PUBLIC_*` (inlining do Metro). Vite usa `import.meta.env.VITE_*` e Next usa `NEXT_PUBLIC_*`. O `selectRepository` e o `api-client` dependem do `useSession`, que depende do `secure-storage` (`expo-secure-store`). Seria preciso injetar ambiente, storage e identidade por parâmetro. Schemas Zod, domínio e mock backend saem quase de graça.
- **Duas UIs**: tokens do design D em `shared/theme` (objetos StyleSheet) teriam que ser reescritos em CSS/Tailwind, e duas implementações do mesmo design tendem a divergir **[inferência]**.
- **Next.js** traz SSR/RSC que um dashboard autenticado e SPA não aproveita muito. Vite + React é a alternativa mais próxima do modelo atual (SPA, mesmos hooks) **[inferência]**.

---

## 6. Riscos

1. **Componentes desktop do zero** (o maior custo): tabela densa com ordenação e seleção, menu de contexto, arrastar para reordenar, atalhos de teclado, foco visível. Em RNW cada um é construção própria ou um `.web.tsx` com DOM. Mitigação: spike de 1 a 2 dias com uma tabela + reorder + menu num `_layout.web.tsx` antes de decidir.
2. **Mistura nativo/web no mesmo `src/app`**: toda rota web precisa de uma versão sem extensão. Rotas só do dashboard (por exemplo, Super admin) existiriam também no bundle nativo, a menos que sejam guardadas por `Stack.Protected` e pela plataforma **[inferência]**. Isso exige disciplina de estrutura (um grupo `(dashboard)` por exemplo) e mexe no `eslint-plugin-boundaries`.
3. **Testes**: `jest-expo` roda o preset nativo por padrão; testar componentes `.web.tsx` pede o preset web do `jest-expo` ou configuração multiprojeto **[inferência; não verificado]**.
4. **Popup de SSO e configuração do Clerk** (allowlist de redirect, domínio, Apple OAuth web): é configuração, não código, mas bloqueia o login se faltar.
5. **CORS e variáveis de build**: a events-api precisa liberar a origem do web, e o build precisa de `EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`. Vale para qualquer stack.
6. **Tamanho de bundle**: ~2,3 MB de JS sem compressão no export atual. Aceitável para dashboard interno, mas o RN Web e o Reanimated entram mesmo onde não são usados **[verificado; impacto: inferência]**.
7. **Domínio próprio no EAS Hosting é pago** **[fonte]**. Netlify e Vercel com rewrite SPA são alternativas documentadas.
8. **Comentário e postura do repo**: hoje o código declara o web como "not a target platform". Mudar isso é uma decisão a registrar (ADR em `docs/adr/`).

---

## 7. Insumo para a decisão "Onde mora o web"

- **Mesmo app (Expo web)**, recomendado se o escopo for o do mapa: *paridade, sem capacidades novas*. Reaproveita sem refatorar repositórios, `selectRepository`/`LIVE_MODULES`, Zod, domínio, hooks TanStack, Session, Clerk (senha, MFA, Google, Apple via `oauth_apple`, convite via `__clerk_ticket`) e o design D (tokens já em RN). Hospeda como SPA (`web.output: "single"`) no EAS Hosting ou Netlify/Vercel. Custo concentrado em componentes desktop e num `_layout.web.tsx`.
- **App separado (Vite + React, em monorepo)**, faz sentido se o roadmap trouxer os "poderes de desktop" que o mapa deixou fora (Timeline em grade, importar planilha, impressão). Aí o ecossistema DOM vale o custo de monorepo, de refatorar a injeção de ambiente/storage/identidade e de manter duas UIs.
- **Critério de desempate sugerido**: o spike do risco 1. Se tabela + reorder + menu de contexto saírem aceitáveis em RNW/`.web.tsx` dentro do app, fica no mesmo app. Se cada um exigir uma lib DOM, o argumento para Vite ganha força.

---

## Fontes

- Expo: Static rendering, https://docs.expo.dev/router/reference/static-rendering/
- Expo: Publishing websites, https://docs.expo.dev/guides/publishing-websites/
- Expo: EAS Hosting, https://docs.expo.dev/eas/hosting/introduction/
- Expo: Platform-specific modules, https://docs.expo.dev/router/advanced/platform-specific-modules/
- Expo: Custom tab layouts (`expo-router/ui`), https://docs.expo.dev/router/advanced/custom-tabs/
- Expo: Protected routes, https://docs.expo.dev/router/advanced/protected/
- Expo: SecureStore, https://docs.expo.dev/versions/latest/sdk/securestore/
- Expo: DOM components, https://docs.expo.dev/guides/dom-components/
- Expo: Monorepos, https://docs.expo.dev/guides/monorepos/
- Clerk: Expo web support, https://clerk.com/docs/reference/expo/web-support/overview
- Clerk: `useSSO`, https://clerk.com/docs/reference/expo/native-hooks/use-sso
- Clerk: `useSignInWithApple` e OAuth custom flow (via clerk-docs, `docs/reference/expo/native-hooks/use-sign-in-with-apple.mdx`, `docs/guides/development/custom-flows/authentication/oauth-connections.mdx`)
- Clerk: Application invitations, `docs/guides/development/custom-flows/authentication/application-invitations.mdx` (clerk-docs)
- Clerk: Core 3 upgrade guide, https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3 ; changelog https://clerk.com/changelog/2026-03-03-core-3
- React Native Web: Pressable, https://necolas.github.io/react-native-web/docs/pressable/ ; Interactions, https://necolas.github.io/react-native-web/docs/interactions/ ; Accessibility, https://necolas.github.io/react-native-web/docs/accessibility/
- Reanimated: Web support, https://docs.swmansion.com/react-native-reanimated/docs/guides/web-support/
- Código-fonte instalado: `@clerk/expo` 4.14.4 (`dist/provider/ClerkProvider.js`, `dist/token-cache/index.js`, `dist/hooks/useSSO.js`, `dist/hooks/useSignInWithApple.js`, `dist/web/uiComponents.js`), `expo-web-browser` 58.0.7 (`build/ExpoWebBrowser.web.js`)
- Este repo: `package.json`, `app.json`, `src/shared/session/*`, `src/shared/lib/*`, `src/features/auth/hooks/use-sso-sign-in.ts`, `docs/spec.md`; export web executado em 02/11/2026
