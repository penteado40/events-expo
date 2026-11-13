# Um Demo build de release, só com Demo mode, para os previews de cada PR

Até aqui, um build de release nunca usava o mock: Demo mode existia só em desenvolvimento (`__DEV__`), e um release sem `EXPO_PUBLIC_API_URL` ou sem a chave do Clerk falhava ao abrir. Para testar cada PR pelo celular sem o Mac ligado (a web na Vercel, o app no Expo Go via EAS Update; ver `docs/previews.md`), decidimos criar o **Demo build**: um build de release com `EXPO_PUBLIC_DEMO_BUILD=true` em que tudo vem do mock backend (ADR-0002), sem events-api e sem Clerk, e o login mostra só os botões do modo demo. Assim um preview não precisa de backend, de segredo nem de login.

## Considered Options

- **Preview apontando para a events-api e o Clerk de verdade**: testa o caminho real, mas cada preview precisaria de uma events-api no ar, da URL e da chave do Clerk como configuração, e de uma conta para entrar.
- **Previews de desenvolvimento** (`expo start` com túnel): já têm Demo mode, mas dependem do Mac ligado.

## Consequences

- `selectRepository` passa a usar o mock sempre num Demo build; qualquer outro release continua sem mock.
- A guarda é a chave do Clerk: um Demo build ignora uma `pk_test_` e lança erro ao abrir com uma `pk_live_` (`resolveClerkKey`), para que um preview nunca saia com configuração de produção. O `EXPO_PUBLIC_API_URL` vira opcional nele, porque nunca é chamado.
- O app das lojas e a web de produção continuam sem Demo mode: o Demo build é só dos previews.
