# A Início agrega o Event summary de `GET /events`, sem um `GET /dashboard`

A tela Início mostra totais de todos os Events visíveis (eventos ativos, RSVPs, valor verificado, Registry items, Contributions para conferir) e listas por Event (acontecendo agora, próximos, conferir por evento). O pedido original era um `DashboardRepository.getSummary()` espelhando um futuro `GET /dashboard`. Decidimos, em vez disso, que cada item de `GET /events` traz o seu **Event summary** (o conceito da events-api: os números agregados de um Event, sem dado de nenhum Guest), como já traz o `paidContributionCount` (events-api PROJ-67), e que a Início é uma função pura do app sobre essa lista. Assim a Início faz a mesma requisição da tela Eventos, divide o cache com ela e acompanha a Verification otimista sem invalidação própria; e o backend expõe um conceito de domínio, não um endpoint com a forma de uma tela.

## Considered Options

- `GET /dashboard` com tudo já agregado: uma requisição, mas um endpoint no formato de uma tela (cada mudança na Início vira mudança no backend), que repete as regras de visibilidade que a API já aplica por Event e não basta sozinho, porque as listas por Event precisam da lista de Events de qualquer jeito. O glossário da events-api evita "dashboard" justamente como sinônimo de Event summary.
- Compor no app a partir de RSVPs, Registry e Contributions de cada Event: sem mudar o backend, mas 1 + 3N requisições.

## Consequences

- O schema de Event do app ganha `summary`, simulado hoje pelo mock backend; o módulo `events` só entra em `LIVE_MODULES` quando a events-api entregar o Event summary em `GET /events`.
- O reducer otimista da Verification passa a corrigir também o `summary.verifiedAmount` do Event em cache.
- O Event summary é o que Managers e Viewers veem de um Archived event (events-api ADR-0011): o Resumo do Detalhe poderá usá-lo no lugar do "—" depois.
