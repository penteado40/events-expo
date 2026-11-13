# Previews de cada PR

Cada PR publica dois previews do app, para testar pelo celular sem o Mac ligado:

- **Web**, na Vercel, pela integração da Vercel com o GitHub (`vercel.json`).
- **Nativo**, no Expo Go, por um EAS Update publicado pelo workflow `.github/workflows/eas-update.yml` no branch `pr-<n>` do EAS.

Um push no `main` publica a versão estável dos dois: a produção da Vercel e o EAS Update no branch `main`.

Todo deploy roda como a produção: com a events-api de verdade e o login normal do Clerk, sem modo demo (ADR-0005). Todos usam a mesma URL da events-api e a mesma chave do Clerk, sempre uma `pk_test_` (a instância de desenvolvimento): uma `pk_live_` faz o build falhar. Por isso **os previews de PR mexem na mesma events-api e nos mesmos dados que o `main`**: o que se cria ou apaga num preview aparece em todos.

Os dois caminhos são independentes. A Vercel faz o próprio build (`npm run build:web`) e não roda o EAS. O workflow do EAS não depende da Vercel. Se um falhar, o outro publica igual.

## O que falta configurar

O setup de uma vez só (importar na Vercel, `eas init`, o secret `EXPO_TOKEN`) já está feito; ver [Setup inicial](#setup-inicial). Falta dar aos dois caminhos a URL da events-api e a chave do Clerk, e liberar a web no CORS da events-api.

Os dois valores, iguais na Vercel e no GitHub:

- `API_URL`: a URL base da events-api com o prefixo, ex.: `https://<host>/api/v1`.
- `CLERK_PUBLISHABLE_KEY`: a *Publishable key* (`pk_test_...`) do Clerk, em *API keys* da mesma instância cuja `CLERK_SECRET_KEY` essa events-api usa. Se as instâncias não baterem, todo login volta 401.

Nenhum dos dois é segredo: a chave publicável e a URL vão no bundle de qualquer jeito.

### 1. Vercel

1. Em Settings → Environment Variables, cadastre `API_URL` e `CLERK_PUBLISHABLE_KEY` para **Production** e **Preview**. Sem o prefixo `EXPO_PUBLIC_`: a Vercel não aceita nomes com `PUBLIC`. O `npm run build:web` (`scripts/build-web.js`) lê as duas, recusa uma `pk_live_`, e as passa ao `expo export` como `EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, os nomes que o Expo embute no bundle.
2. Faça um **Redeploy** do último deploy de produção e de um preview: variáveis novas só valem para builds novos.

Sem uma das duas, ou com uma `pk_live_`, o build da Vercel falha com a mensagem `build-web: ...` no log.

### 2. GitHub Actions

Em `penteado40/events-expo` → Settings → Secrets and variables → Actions → aba **Variables** → **New repository variable**, cadastre `API_URL` e `CLERK_PUBLISHABLE_KEY` com os mesmos valores. São variables, não secrets. O workflow as passa ao `eas update` como `EXPO_PUBLIC_*`.

Sem uma das duas, o workflow `EAS Update` passa verde com o aviso "EAS Update pulado" e não publica nada. Com uma `pk_live_`, ele falha.

### 3. EAS: o environment `preview` fica vazio

O workflow publica com `eas update --environment preview`, e as variáveis desse environment no expo.dev (Project → Environment variables) entram no bundle e valem mais que as do workflow. Deixe o environment `preview` sem nenhuma `EXPO_PUBLIC_*`: a URL e a chave vêm só das variables do GitHub.

### 4. CORS na events-api

A web roda em `*.vercel.app`: o domínio de produção do projeto e uma URL diferente a cada preview (`events-expo-<hash>-<conta>.vercel.app`, mais o alias do branch, `events-expo-git-<branch>-<conta>.vercel.app`). O navegador só deixa a web chamar a events-api se ela aceitar essa origem no CORS. O Expo Go (nativo) não passa por CORS e funciona sem nada disso.

Na events-api, o CORS aceita só as origens exatas da variável `CORS_ORIGINS` (separadas por vírgula, sem `/` no fim, ex.: `https://events-expo.vercel.app`), e, fora de `NODE_ENV=production`, qualquer `localhost`. Não há curinga. Então:

- **Produção da web**: cadastre o domínio de produção (Project → Domains na Vercel do events-expo) em `CORS_ORIGINS` no projeto `events-api` da Vercel, no ambiente da events-api para onde o `API_URL` aponta, e faça redeploy dela.
- **Previews de PR na web**: a URL muda a cada deploy, então não dá para listar. Até a events-api aceitar um padrão (ex.: `https://events-expo-*-<conta>.vercel.app`), o que é uma mudança de código lá, a web de um PR abre e mostra o login, mas as chamadas à events-api são bloqueadas pelo navegador. Use o Expo Go para testar um PR de ponta a ponta.

Cuidado com a `CLERK_AUTHORIZED_PARTIES` da events-api: o token da web leva no `azp` a origem da página, que teria de estar nessa lista (com o mesmo problema da URL por preview), e, preenchida, ela recusa também o token **sem** `azp`, o que pode ser o caso do app nativo. Deixe-a sem definir, a não ser que confira antes o que o app manda nos dois casos.

## Onde achar cada preview

### Num PR

- **Web**: nos checks do PR, o deployment **Vercel** tem o link **Visit Preview**. O bot da Vercel também comenta o link no PR. Abra no navegador do celular e entre com a sua conta.
- **Nativo**: o workflow **EAS Update** comenta no PR um QR do branch `pr-<n>`. Cada push atualiza o mesmo comentário. No iPhone, instale o [Expo Go](https://apps.apple.com/app/expo-go/id982107779), entre nele com a conta da Expo que tem acesso ao projeto e leia o QR com a câmera. O Expo Go precisa suportar o SDK do app (o `expo` do `package.json`).

PRs vindos de fork não recebem o secret, então ficam só com o preview web.

### No `main`

- **Web**: o domínio de produção do projeto na Vercel (Project → Domains).
- **Nativo**: em expo.dev, no projeto → Updates → branch `main`. A página do update tem o QR para o Expo Go.

## Rodar o build web no Mac

```bash
API_URL=http://localhost:3000/api/v1 CLERK_PUBLISHABLE_KEY=pk_test_... npm run build:web   # gera dist/ como a Vercel
npx serve --single dist            # serve com fallback de SPA, como o rewrite da Vercel
```

Para um build sem backend, só com modo demo (o Demo build, ADR-0005, que nenhum deploy usa): `npm run build:demo:web`.

## Setup inicial

Já feito; fica aqui para refazer o projeto do zero. Quem faz é o dono das contas (Vercel, Expo, GitHub).

### Vercel

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório `penteado40/events-expo`.
2. Em **Framework Preset**, deixe **Other**. O `vercel.json` já define a instalação (`npm ci`), o build (`npm run build:web`), a pasta `dist` e o rewrite que faz uma rota funda (ex.: `/events/3/timeline`) abrir sem 404.
3. **Node.js Version**: 22.x. A Vercel lê do `engines` do `package.json`; confira em Settings → Build and Deployment.
4. **Environment Variables**: as de [O que falta configurar](#1-vercel).
5. **Production Branch**: `main` (Settings → Git).
6. Para abrir o preview no celular sem login na Vercel, desligue a **Vercel Authentication** dos previews (Settings → Deployment Protection) ou entre na Vercel no navegador do celular.

### Projeto na Expo

No Mac, na raiz do repo, num branch novo:

```bash
npx eas-cli@latest login
npx eas-cli@latest init              # cria o projeto na Expo e grava expo.extra.eas.projectId (e owner) no app.json
npx eas-cli@latest update:configure  # instala expo-updates e grava updates.url no app.json
```

Faça commit do `app.json`, do `package.json` e do `package-lock.json` e abra o PR. O projectId não é segredo.

O `app.json` já tem `"runtimeVersion": { "policy": "sdkVersion" }`, e ele tem de ficar assim. Com essa política o runtime de cada update é `exposdk:<SDK>` (ex.: `exposdk:58.0.0`), o único que o Expo Go carrega. O `update:configure` só grava um `runtimeVersion` quando não há nenhum, então não mexe nesse. Se o diff mostrar outro (ex.: `{ "policy": "appVersion" }`, que daria `1.0.0`), volte para `sdkVersion` antes do commit: com outro runtime o QR abre o Expo Go e o update não carrega.

Não precisa de `eas.json`. O `eas update` roda sem ele, e o `update:configure` não cria um: só grava os channels num `eas.json` que já exista. Channel é coisa de build do EAS, e o Expo Go não usa channel: o QR aponta direto para o update publicado.

### `EXPO_TOKEN` como secret do GitHub Actions

1. Em [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens), crie um token (ex.: `github-actions-events-expo`).
2. No GitHub, em `penteado40/events-expo` → Settings → Secrets and variables → Actions → **New repository secret**, nome `EXPO_TOKEN`, valor o token.

O token fica só no secret: nunca no repositório, no `.env` nem na Vercel.
