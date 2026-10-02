# Handoff: Events App · Painel liquid glass (2a)

## Overview
App mobile para **membros** de Events (Owner, Manager, Viewer) e para o **Super admin** da plataforma events-api. Permite entrar, ver os eventos, acompanhar RSVPs, a Registry (lista de presentes) e fazer a **Verification** das Contributions via Pix que os Guests marcaram como pagas.

## About the Design Files
`Events App Glass.dc.html` é uma **referência de design em HTML**: um protótipo que mostra a aparência e o comportamento pretendidos, não código de produção. A tarefa é **recriar esse design em Expo (React Native) + expo-router** com os padrões dessa stack. Abra o HTML num navegador Chromium para ver a refração do vidro; em outros navegadores ele cai para vidro fosco.

## Fidelity
**High-fidelity.** Cores, tipografia, espaçamentos, raios e interações são finais. Reproduza fielmente.

## Frame de referência
Desenhado em 390×844 pt (iPhone 14/15). Status bar de 50 pt. Respeite safe areas reais no app.

---

## Design Tokens

### Cores
| Token | Valor | Uso |
|---|---|---|
| `bg` | `#07080a` | fundo da tela |
| `text` | `#f2f1ee` | texto principal |
| `textMuted` | `rgba(255,255,255,.66)` | rótulos, metadados |
| `textSoft` | `rgba(255,255,255,.78)` | endereço do evento |
| `accent` | `#b5e35a` | lima: ação primária, pendentes |
| `onAccent` | `#0f1011` | texto sobre lima e sobre pílula ativa |
| `verified` | `#9cc4ff` | status verificada |
| `danger` | `#ff9a86` | rejeitada, erros, Sair |
| `warning` | `#f0c24b` | arquivado, aviso Viewer |
| `divider` | `rgba(255,255,255,.08)` | linhas dentro de cartões (`.12` dentro da folha) |

### Fundo (atrás de todo o vidro)
Sobre `#07080a`, três orbs com `radial-gradient(circle, cor 0%, transparente 65%)`:
- Lima `#b5e35a`, 420×420, left −140, top −80, opacidade .55
- Azul `#4f7dff`, 460×460, right −200, top 260, opacidade .6
- Violeta `#b36bff`, 380×380, left −60, bottom −140, opacidade .45

Por cima, uma grade de linhas de 1 px `rgba(255,255,255,.05)` a cada 32 px (horizontal e vertical). O fundo é fixo (não rola).

### Materiais de vidro
Todos: borda 1 px, brilho interno no topo (`inset 0 1px 0`), refração nas bordas + leve desfoque.

| Material | Tinta | Borda | Brilho topo | Sombra | Desfoque |
|---|---|---|---|---|---|
| **Card** | `rgba(255,255,255,.06)` | `rgba(255,255,255,.16)` | `rgba(255,255,255,.3)` + `inset 0 -1px 0 rgba(255,255,255,.06)` | `0 16px 40px -16px rgba(0,0,0,.6)` | 1.5 px, saturate 1.6 |
| **Card acento** | `rgba(181,227,90,.14)` (.12 nos stats) | `rgba(181,227,90,.35)` (.32) | `rgba(255,255,255,.35)` | igual Card | 1.5 px, saturate 1.8 |
| **Pill** (voltar, abas, tab bar) | `rgba(255,255,255,.08)` | `rgba(255,255,255,.18)` (.2 na tab bar) | `rgba(255,255,255,.35)` (.4 na tab bar) | `0 12px 30px -12px rgba(0,0,0,.6)`; tab bar `0 18px 40px -12px rgba(0,0,0,.7)` | 1–2 px, saturate 1.6–1.7 |
| **Sheet** | `rgba(30,32,36,.45)` | `rgba(255,255,255,.2)` | `rgba(255,255,255,.4)` | `0 -10px 50px -10px rgba(0,0,0,.6)` | 14 px, saturate 1.8 |

**Refração (web):** o protótipo gera em canvas um mapa de deslocamento de squircle (vetor normal da borda × (1 − dist/bezel)², canal R = x, G = y) e o aplica com `backdrop-filter: url(#lgCard)` (bezel 42, escala .09) e `url(#lgPill)` (bezel 30, escala .14). Ver `lensMap()` no HTML.
**No Expo:** use `GlassView` do `expo-glass-effect` (iOS 26+, estilo `regular`, `tintColor` com a tinta da tabela). A refração nativa substitui o `lensMap()`. Fallback (iOS antigo e Android): `BlurView` do `expo-blur` (intensity ~20, tint `dark`) com a tinta, a borda e o brilho da tabela por cima. Sombras: `boxShadow` do RN (New Architecture).

### Tipografia
IBM Plex Sans (UI) e IBM Plex Mono (dados, rótulos, valores, endpoints).
| Uso | Fonte | Peso | Tamanho/linha |
|---|---|---|---|
| Título de tela (Eventos, Perfil) | Plex Sans | 600 | 32 |
| Título do login | Plex Sans | 500 | 34 / 1.12, tracking −.01em |
| Título do evento (detalhe) | Plex Sans | 600 | 30 / 1.12 |
| Nome do evento (cartão) | Plex Sans | 500 | 20 / 1.2 |
| Corpo | Plex Sans | 400–500 | 14–15 |
| Botões | Plex Sans | 600 primário / 500 | 15–16 |
| Metadados, rótulos | Plex Mono | 400 | 12–13 |
| Rótulo de stat | Plex Mono | 400 | 11, maiúsculas |
| Stat | Plex Mono | 500 | 30 (valor em R$: 22) |
| Número "para conferir" (hero) | Plex Mono | 500 | 50 / 1 |
| Valor na folha | Plex Mono | 500 | 40 |
| Inputs | Plex Mono | 400 | 16 |

### Raios
Cartão de evento 24 · hero / perfil / login 26–28 · stats, listas 20–22 · inputs 16 · botões primários 28 (pílula) · abas 24 (contêiner) / 19 (item) · tab bar 32 / 26 · sheet 40 · chip 10 · avatar circular.

### Espaçamento
Margem lateral da tela 16 · gap entre cartões 10–14 · padding de cartão 14–18 · padding de header do evento 22 lateral.

---

## Screens

A interface nunca mostra de onde vêm os dados nem detalhes da API (endpoints, host, códigos de erro, nomes de campos). Onde o protótipo HTML diverge disso, vale este README.

### 1. Login
- Layout em coluna, padding 36/18/30. Topo: título "Entre para gerenciar seus eventos." (sem marca nem ponto lima). Espaço flexível. Cartão de vidro **Card**, radius 28, padding 18, gap 12, contendo:
  - Input email e input senha: altura 52, radius 16, fundo `rgba(0,0,0,.28)`, borda `rgba(255,255,255,.14)`, placeholder "email" / "senha"
  - Erro (condicional): caixa radius 16, fundo `rgba(60,18,12,.55)`, borda `rgba(255,154,134,.35)`; só a `message` (14/1.45, `#f3d6cf`), sem o `code`. Em falha de rede: "Não foi possível conectar. Verifique sua internet e tente de novo."
  - Botão "Entrar" (carregando: "Entrando…"): altura 56, radius 28, fundo lima, texto `#0f1011` 16/600, `inset 0 1px 0 rgba(255,255,255,.6), 0 8px 24px -8px rgba(181,227,90,.6)`
  - Botão "Modo demo": altura 48, radius 24, fundo `rgba(255,255,255,.06)`, borda `rgba(255,255,255,.16)`
    - Ao tocar, o botão dá lugar a duas pills lado a lado, mesmo estilo: "Super admin" e "Cláudia Lima · user"; cada uma abre o Modo demo com aquele usuário
- Não há cadastro: só o Super admin cria Users.

### 2. Eventos (tab "Eventos")
- Header: "Eventos" + à direita `{n} · super admin` ou `{n} · seus eventos` (Mono 13, muted).
- **Hero "Para conferir"** (Card acento, radius 26, padding 18/20): à esquerda "PARA CONFERIR" (Mono 12/500, lima, tracking .06em) e "contribuições marcadas como pagas" (14, 80% branco); à direita o total de Contributions `PAID` em todos os eventos visíveis (Mono 50, lima).
- Lista de **cartões de evento** (ativos por data, o mais próximo primeiro; arquivados no fim, o mais recente primeiro) (Card, radius 24, padding 16/18, gap 10):
  - Linha 1: chip `arquivado` (só em evento arquivado; muted, borda `rgba(255,255,255,.18)`) antes da data, data `dd.mm.aa · HH:MM` e papel (`Owner`, `Manager`, `Viewer`, `Super admin`; + ` · principal` se Primary owner; o papel de membro prevalece, e `Super admin` só aparece onde ele não é membro). Mono 12, muted.
  - Nome do evento.
  - Linha 3: `Tipo · Cidade, UF` (13, muted; a cidade vem do campo `city` do Event, e sem ela só o tipo), alinhada com o chip de baixo, e à direita uma coluna de chips (alinhados à direita, gap 6): `N confirmados` / `1 confirmado` sempre, inclusive 0 (Mono 12/500, `#f2f1ee`, fundo `rgba(255,255,255,.08)`, borda `.22`, pressionado `.16`; neutro para não competir com o lima) e, abaixo, `N pendentes` quando houver (lima em `rgba(181,227,90,.16)`, borda `.35`, pressionado `.28`). Não está no protótipo HTML (PROJ-106).
  - Evento arquivado: cartão com opacidade .55.
- Toque no cartão → Detalhe (aba Resumo); no chip `confirmados` → aba RSVPs; no chip `pendentes` → aba Conferir.
- Padding inferior de 120 para não ficar sob a tab bar.

### 3. Detalhe do evento
- Barra: botão voltar circular 44 (Pill) com "←"; centro `#{id} · {papel}` (Mono 12, muted).
- Header: nome, `{data} · {tipo}` (Mono 13, muted), local (14, 78%). Se arquivado: "ARQUIVADO · site não aceita escritas" (Mono 12, warning).
- **Abas segmentadas** (Pill, sticky no topo ao rolar, grade 4 colunas, padding 5, radius 24): Resumo · RSVPs · Presentes · Conferir. Item 38 alto, radius 19; ativo = fundo `rgba(255,255,255,.88)` e texto `#0f1011`; inativo = transparente e muted. "Conferir" mostra um ponto lima de 6 px (com glow) quando há pendentes.
- **Resumo:** stats (Card, radius 22): CONFIRMADOS (número de RSVPs) em largura cheia; abaixo, lado a lado, VERIFICADO (soma em R$ das Contributions `VERIFIED`), PARA CONFERIR (Card acento, número lima). Depois cartão "Site" com o `siteUrl` em Mono. Depois cartão de Membros: linhas nome + papel (Mono 12), divisores de 1 px.
- **RSVPs:** só quem confirmou presença (não há "não vai"). Cartões radius 20: nome (15), email (Mono 12, com reticências) e data `dd/mm` à direita. O protótipo ainda mostra o ponto lima/cinza e respostas "não vai"; o app não.
- **Presentes:** cartões radius 22, padding 10: miniatura 48×48 radius 14 (placeholder listrado; no app, imagem do Registry item), nome, `N contribuições` / `nenhuma contribuição`, preço de referência em Mono 14/500. Sem itens: "Sem lista de presentes."
- **Conferir:** Contributions ordenadas com `PAID` primeiro. Cartão radius 22: convidado + valor (Mono 16/500); abaixo nome do presente (reticências) e status `● pendente` (lima) / `● verificada` (#9cc4ff) / `● rejeitada` (#ff9a86). Se o papel é Viewer: aviso "VIEWER · somente leitura. A conferência cabe a Managers e Owners." (Mono 12, warning). Toque → folha de Contribuição.

### 4. Folha de Contribuição (bottom sheet)
- Overlay `rgba(0,0,0,.35)`; toque fora fecha. Folha flutuante com inset de 8 nas laterais e embaixo, **Sheet**, radius 40, padding 14/20/26, gap 14, alça de 40×5.
- `Contribuição #{id}` + status colorido; valor (Mono 40); tabela: Convidado, Presente, Marcada paga (`dd/mm HH:MM`), Comprovante (`anexado` / `não anexado`).
- Se `PAID` e o papel pode verificar: botões em grade 1 : 1.4, altura 54, radius 27: **Rejeitar** (borda `rgba(255,154,134,.35)`, fundo `.08`, texto `#ff9a86`) e **Verificar Pix** (lima). Ação → atualiza o status e fecha a folha.
- Se `PAID` e Viewer: "Viewers não fazem a conferência." (Mono 12, warning).
- Nota de domínio: "paga" é declaração do Guest, não prova (ADR-0004).

### 5. Perfil (tab "Perfil")
- "Perfil"; cartão (radius 26) com avatar 52 lima com as iniciais e o nome. Só no Modo demo: chip `demo` ao lado do nome (estilo do chip `arquivado`: radius 10, muted, borda `rgba(255,255,255,.18)`).
- Cartão com linhas **Email**, **Papel** · Super admin (só para `SUPER_ADMIN`) e **Membro desde** · data pt-BR ("28 de set. de 2026"). Plex Sans 13, rótulo muted, valor à direita.
- Botão **Sair** (Pill, altura 52, radius 26, borda `rgba(255,154,134,.3)`, texto `#ff9a86`) → limpa sessão e volta ao login (mantém o email digitado).

### Tab bar flutuante
Visível em Eventos e Perfil (não no Detalhe). Centralizada, bottom 28, largura 220, padding 5, gap 4, radius 32, material Pill. Dois itens de 48 de altura e radius 26: "Eventos", "Perfil". Ativo = fundo `rgba(255,255,255,.88)`, texto `#0f1011`; inativo = transparente, texto `rgba(255,255,255,.75)`. Fonte 14/500.

---

## Interactions & Behavior
- Login → `POST /auth/login` → `GET /me` → Eventos. Botão mostra "Entrando…" enquanto carrega.
- Modo demo → usuário fake. Super admin: `{ id: 1, name: 'Admin Local', email: 'admin@local.test', role: 'SUPER_ADMIN' }`. User: `{ id: 7, name: 'Cláudia Lima', email: 'claudia.lima@gmail.com', role: 'USER' }`.
- Voltar do Detalhe → Eventos. Trocar aba não reseta a rolagem da lista.
- Verificar/Rejeitar atualiza o contador do hero, o badge da aba e o stat "Verificado" na hora (otimista).
- Transições sugeridas: push nativo entre Eventos e Detalhe; folha com spring (Reanimated); a pílula ativa desliza entre os itens (~250 ms, ease-out).
- Tocar em vidro: leve escala 0.98 + brilho do topo mais forte.

## API (real hoje)
Base `/api/v1`. Sucesso `{ data }`; erro `{ error: { code, message, details? } }`.
- `POST /auth/login` body `{ email, password }` → `{ data: { token, user } }`. JWT de 12 h.
- `GET /me` (Bearer) → `{ data: User }`, `User = { id: number, name, email, role: 'SUPER_ADMIN' | 'USER', createdAt: ISO }`.
- Códigos: `VALIDATION_ERROR` 400 ("Dados inválidos."), `INVALID_CREDENTIALS` 401 ("Email ou senha inválidos."), `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `INTERNAL_ERROR` 500. Use a `message` da API como texto.
- A sessão é revogada quando a senha muda: trate 401 em qualquer rota como logout.
- Seed local: `admin@local.test / admin123`.

## Dados mock (até existirem os módulos events / rsvp / registry)
Tipos sugeridos (pelo `CONTEXT.md`):
- `Event { id, name, type: 'WEDDING'|'BIRTHDAY'|'CORPORATE'|'BABY_SHOWER'|'PARTY'|'OTHER', startsAt, venue, siteUrl, archived, members: EventMember[] }` (dados do protótipo; o contrato real está no `docs/spec.md`, com `venueName`, `venueAddress`, `city` e `mapsUrl` no lugar de `venue`)
- `EventMember { userId, name, role: 'OWNER'|'MANAGER'|'VIEWER', isPrimaryOwner }`
- `Rsvp { name, email, createdAt }` (só confirmações: não há RSVP de quem não vai, events-api ADR-0015)
- `RegistryItem { id, name, price, imageUrl, contributionCount }`
- `Contribution { id, guestName, registryItemId, amount, status: 'PENDING'|'ABANDONED'|'PAID'|'VERIFIED'|'REJECTED', paidAt, hasReceipt }` (o app lista `PAID`, `VERIFIED`, `REJECTED`)

Rótulos de tipo: Casamento, Aniversário, Corporativo, Chá de bebê, Festa, Outro.
Os 5 eventos de exemplo (Ana & Rafael, Chá da Júlia, Marcos 40, Festa de fim de ano Vera Cruz, Offsite Kora 2026 arquivado), com RSVPs, presentes e contribuições, estão na constante `EVENTS` do HTML. Copie-os para o mock.

## State
`session { token, user, live }` persistido no `expo-secure-store` · `selectedEventId` · `tab` · `openContributionId` · resultados das Verifications (local até existir a rota).

## Assets
Nenhum asset de imagem. Miniaturas de presente são placeholders; no app use `RegistryItem.imageUrl`. Fontes: IBM Plex Sans (400/500/600) e IBM Plex Mono (400/500) via `@expo-google-fonts`.

## Files
- `Events App Glass.dc.html`: protótipo de referência (abra no Chrome). Lógica em `class Component`: `EVENTS` (mock), `view()` (regras de papel e status), `lensMap()` (mapa de refração).
- `support.js`: runtime do protótipo, carregado pelo HTML.

> O `PROMPT.md` original do handoff não foi copiado: ele foi substituído por `docs/spec.md`.
