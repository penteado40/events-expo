# Previews de cada PR

Cada PR publica dois previews do app, para testar pelo celular sem o Mac ligado:

- **Web**, na Vercel, pela integração da Vercel com o GitHub (`vercel.json`).
- **Nativo**, no Expo Go, por um EAS Update publicado pelo workflow `.github/workflows/eas-update.yml` no branch `pr-<n>` do EAS.

Um push no `main` publica a versão estável dos dois: a produção da Vercel e o EAS Update no branch `main`.

Os dois são um **Demo build** (`EXPO_PUBLIC_DEMO_BUILD=true`, ver `CONTEXT.md`): um build de release que só tem Demo mode. Tudo vem do mock, sem events-api e sem Clerk. O login mostra só os botões do modo demo (Owner, Viewer, Super admin). Por isso nenhum preview precisa de segredo nem de chave.

Os dois caminhos são independentes. A Vercel faz o próprio build (`npm run build:preview:web`) e não roda o EAS. O workflow do EAS não depende da Vercel. Se um falhar, o outro publica igual.

## Setup, uma vez só

Quem faz é o dono das contas (Vercel, Expo, GitHub). Enquanto o passo 2 ou 3 não estiver feito, o workflow `EAS Update` passa verde com o aviso "EAS Update pulado" e não publica nada.

### 1. Vercel

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório `penteado40/events-expo`.
2. Em **Framework Preset**, deixe **Other**. O `vercel.json` já define a instalação (`npm ci`), o build (`npm run build:preview:web`), a pasta `dist` e o rewrite que faz uma rota funda (ex.: `/events/3/timeline`) abrir sem 404.
3. **Node.js Version**: 22.x. A Vercel lê do `engines` do `package.json`; confira em Settings → Build and Deployment.
4. **Environment Variables**: nenhuma é necessária. Não ponha a chave do Clerk. Se puser, só uma `pk_test_`, que o Demo build ignora. Uma `pk_live_` faz o preview falhar ao abrir, de propósito.
5. **Production Branch**: `main` (Settings → Git).
6. Para abrir o preview no celular sem login na Vercel, desligue a **Vercel Authentication** dos previews (Settings → Deployment Protection) ou entre na Vercel no navegador do celular.

### 2. Projeto na Expo

No Mac, na raiz do repo, num branch novo:

```bash
npx eas-cli@latest login
npx eas-cli@latest init              # cria o projeto na Expo e grava expo.extra.eas.projectId (e owner) no app.json
npx eas-cli@latest update:configure  # instala expo-updates e grava updates.url no app.json
```

Faça commit do `app.json`, do `package.json` e do `package-lock.json` e abra o PR. O projectId não é segredo.

O `app.json` já tem `"runtimeVersion": { "policy": "sdkVersion" }`, e ele tem de ficar assim. Com essa política o runtime de cada update é `exposdk:<SDK>` (ex.: `exposdk:58.0.0`), o único que o Expo Go carrega. O `update:configure` só grava um `runtimeVersion` quando não há nenhum, então não mexe nesse. Se o diff mostrar outro (ex.: `{ "policy": "appVersion" }`, que daria `1.0.0`), volte para `sdkVersion` antes do commit: com outro runtime o QR abre o Expo Go e o update não carrega.

Não precisa de `eas.json`. O `eas update` roda sem ele, e o `update:configure` não cria um: só grava os channels num `eas.json` que já exista. Channel é coisa de build do EAS, e o Expo Go não usa channel: o QR aponta direto para o update publicado.

### 3. `EXPO_TOKEN` como secret do GitHub Actions

1. Em [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens), crie um token (ex.: `github-actions-events-expo`).
2. No GitHub, em `penteado40/events-expo` → Settings → Secrets and variables → Actions → **New repository secret**, nome `EXPO_TOKEN`, valor o token.

O token fica só no secret: nunca no repositório, no `.env` nem na Vercel.

### Variáveis de ambiente do EAS

O workflow publica com `eas update --environment preview`, e as variáveis desse environment no expo.dev (Project → Environment variables) entram no build e valem mais que as do workflow. Deixe o environment `preview` sem variáveis `EXPO_PUBLIC_*`: nada de chave do Clerk (uma `pk_live_` faz o preview falhar ao abrir) e nada de `EXPO_PUBLIC_DEMO_BUILD`, que o workflow já define.

## Onde achar cada preview

### Num PR

- **Web**: nos checks do PR, o deployment **Vercel** tem o link **Visit Preview**. O bot da Vercel também comenta o link no PR. Abra no navegador do celular e entre pelo modo demo.
- **Nativo**: o workflow **EAS Update** comenta no PR um QR do branch `pr-<n>`. Cada push atualiza o mesmo comentário. No iPhone, instale o [Expo Go](https://apps.apple.com/app/expo-go/id982107779), entre nele com a conta da Expo que tem acesso ao projeto e leia o QR com a câmera. O Expo Go precisa suportar o SDK do app (o `expo` do `package.json`).

PRs vindos de fork não recebem o secret, então ficam só com o preview web.

### No `main`

- **Web**: o domínio de produção do projeto na Vercel (Project → Domains).
- **Nativo**: em expo.dev, no projeto → Updates → branch `main`. A página do update tem o QR para o Expo Go.

## Rodar o Demo build no Mac

```bash
npm run build:preview:web          # gera dist/ como a Vercel
npx serve --single dist            # serve com fallback de SPA, como o rewrite da Vercel
```
