# Os previews rodam com a events-api e o Clerk; o Demo build fica como opção

Para testar cada PR pelo celular sem o Mac ligado (a web na Vercel, o app no Expo Go via EAS Update; ver `docs/previews.md`), os previews primeiro foram um **Demo build**: um build de release com `EXPO_PUBLIC_DEMO_BUILD=true` em que tudo vem do mock backend (ADR-0002), sem events-api e sem Clerk, e o login mostra só os botões do modo demo. Decidimos depois que todo deploy (a produção da Vercel, os previews de PR na Vercel e os EAS Updates de `pr-<n>` e `main`) roda como a produção: com a events-api de verdade e o login normal do Clerk, com a chave publishable da mesma instância do Clerk que a events-api usa, em todos. O Demo build continua no código, para um preview sem backend se um dia for preciso, mas nenhum deploy o usa.

## Considered Options

- **Demo build em todo preview**: não precisa de backend, de chave nem de conta, mas não testa o caminho real (login, events-api, dados), que é o que um PR precisa mostrar.
- **Previews de desenvolvimento** (`expo start` com túnel): já têm Demo mode, mas dependem do Mac ligado.

## Consequences

- O build web dos deploys é o `npm run build:web` (`scripts/build-web.js`): a Vercel não aceita variáveis com `PUBLIC` no nome, então o painel tem `API_URL` e `CLERK_PUBLISHABLE_KEY`, e o script as passa como `EXPO_PUBLIC_*` ao `expo export`. O workflow do EAS lê as mesmas duas das variables do repositório.
- Uma chave que não seja publishable (`pk_test_` ou `pk_live_`) faz o build falhar, no script e no workflow, para que uma secret key nunca vá para o bundle. Começamos aceitando só `pk_test_`; quando a events-api passou para a instância de produção do Clerk, a `pk_live_` passou a valer, porque app e API precisam da mesma instância.
- Os previews de PR usam a mesma events-api e os mesmos dados que o `main`: um teste num PR mexe nos dados de todos.
- A web roda em `*.vercel.app`, com uma URL por preview, e a events-api precisa aceitar essas origens no CORS. O Expo Go (nativo) não passa por CORS.
- O Demo build segue como antes: `selectRepository` usa o mock sempre nele, `resolveClerkKey` ignora uma `pk_test_` e recusa uma `pk_live_`, o `EXPO_PUBLIC_API_URL` é opcional, e o login e a ativação dizem que é um preview sem backend. Gera-se com `npm run build:demo:web`.
