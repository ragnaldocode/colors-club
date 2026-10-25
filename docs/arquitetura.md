# Arquitetura — Colors Club

Documento vivo das decisões técnicas do MVP. Complementa o `README.md` e a especificação do produto.

## 1. Camadas

```
rotas (src/app)  →  estado (src/state)  →  domínio (src/domain)  →  dados (src/data)
                          ↓
                   serviços (src/services: storage, áudio, háptica)
```

- **`src/domain`** não importa React, navegação nem armazenamento. Recebe e devolve objetos.
  Isso permite testar todas as regras de negócio no Node, sem emulador.
- **`src/state/progress-context.tsx`** é o único lugar que muta o estado persistido. Ele hidrata o
  snapshot, aplica as regras puras e agenda a gravação.
- **`src/app`** contém apenas telas e composição visual.
- **`src/data`** é conteúdo estático versionado no repositório (sem backend).

## 2. Regra 1:1 entre desenho e desafio

`Drawing.challengeId` e `Challenge.drawingId` são redundantes de propósito: a inconsistência aparece
como erro explícito em `parseCatalog()`, executado no import do catálogo (falha no boot, não em produção
silenciosa).

Validações aplicadas:

- ids únicos de desenho, desafio e região;
- `challengeId` do desenho existe e aponta de volta para o mesmo desenho;
- cada desafio desbloqueia exatamente um desenho (nenhum desafio órfão, nenhum desenho com 2 desafios);
- `correctOptionId` presente nas alternativas, alternativas com rótulo e ids únicos;
- `hint.text` não vazio e `attemptsBeforeHint >= 1` (conteúdo usa 2);
- `viewBox` no formato `x y w h`.

## 3. Progressão e persistência

Estados de desafio (`ChallengeProgress`):

| Campo | Uso |
| --- | --- |
| `wrongAttempts` | conta erros; dica aparece quando atinge `attemptsBeforeHint` |
| `hintShown` | uma vez mostrada, a dica continua visível ao voltar |
| `isCompleted` | única fonte de verdade para desbloqueio do desenho |
| `completedAt` | data local da conquista |

O desbloqueio é **derivado** de `isCompleted` (`isDrawingUnlocked`), nunca de um campo paralelo — evita
estado duplicado divergente. Responder de novo um desafio concluído retorna `already-completed` sem
alterar o snapshot (comparação por identidade no teste).

### Armazenamento

- Nativo: `expo-sqlite` (`colors-club.db`) com tabelas `meta`, `challenge_progress` e `artworks`.
  Gravação em transação, `DELETE + INSERT` do conjunto completo (volume pequeno, simplicidade e
  consistência acima de micro-otimização).
- Web (apenas desenvolvimento/verificação): `store.web.ts` grava o snapshot em `localStorage`.
  Ter um arquivo por plataforma mantém o wasm do SQLite fora do bundle web, que continua exportando.
- `ProgressProvider` grava com debounce de 450 ms, força gravação ao ir para segundo plano
  (`AppState`) e serializa escritas com uma fila de um item (`pendingRef`), evitando gravações concorrentes.

## 4. Pintura

### Preenchimento por regiões

Cada desenho é um conjunto de caminhos SVG fechados (`Drawing.regions`). Tocar numa região adiciona a
ação `{ kind: 'fill', regionId, color }`. O preenchimento não recalcula pixels: apenas troca o atributo
`fill` daquele caminho. Vantagens: custo O(1) por toque, funciona em aparelhos de entrada, contorno
original preservado e resultado sempre "dentro da linha".

O contorno é desenhado com o próprio caminho (`stroke`), então nenhuma máscara extra é necessária.
Detalhes não coloríveis (olhos, bigodes, miolo) ficam em `Drawing.details`, com `pointerEvents: none`.

### Traço livre

Traços são uma camada acima do desenho-base (`Stroke[]`), renderizados como `Polyline` dentro do mesmo
`Svg`. O desenho-base nunca é alterado. Amostragem: ponto adicionado só se deslocou > 1,5 unidades;
limite de 400 pontos por traço; histórico limitado a 240 ações para conter o tamanho do snapshot.

### Ações e histórico

`Artwork.actions` é uma lista ordenada (`fill`, `stroke`, `clear`) e `Artwork.undone` guarda o que foi
desfeito. As cores e os traços visíveis são **derivados** (`deriveFills`, `deriveStrokes`), então
desfazer/refazer é só mover o cursor — sem diffs de bitmap.

Limitação assumida: a borracha remove o traço inteiro tocado (distância até qualquer ponto do traço).
Ela não apaga parcialmente nem mexe em cores de região.

### Por que não Skia nesta versão

`@shopify/react-native-skia` foi avaliado conforme a especificação. Ele exigiria *dev build* (fora do
Expo Go), aumenta o bundle e não oferece vantagem para preenchimento por regiões, que é o modo principal
para 5–8 anos. A arquitetura isola a pintura em `PaintCanvas`, então trocar o renderizador depois não
afeta domínio, persistência nem telas.

## 5. Offline

Nenhuma tela importa cliente HTTP. Conteúdo (desenhos, enunciados, alternativas, respostas, dicas e
associações) está em `src/data`. Voz usa a engine do sistema (`expo-speech`); se não houver voz pt-BR
instalada, o app continua funcionando com o texto na tela.

## 6. Acessibilidade e uso infantil

- Todo controle é `Pressable` com `accessibilityRole="button"`, `accessibilityLabel` e
  `accessibilityState` (selecionado/desabilitado) — necessário também para testes de DOM na web.
- Estados não dependem só de cor: cadeado, texto, ícones e selos acompanham as cores.
- Alvos de toque >= 44 pt; botões principais com 64 pt de altura e borda inferior de 4 px.
- Textos curtos, linguagem direta, sem tempo limite, sem vidas, sem punição por erro.
- Sem ranking, sem comparação entre crianças, sem coleta de dados.

## 7. Estratégia de verificação

| Nível | Ferramenta | O que cobre |
| --- | --- | --- |
| Tipos | `npm run typecheck` (`tsc --noEmit`, strict) | erros de contrato em todas as camadas |
| Domínio | `npm run verify` (`scripts/verify-domain.mjs`) | catálogo, 1:1, erros/dica/acerto, recompensa única, persistência JSON, pintura, teto de histórico, medalhas |
| Bundle | `npx expo export -p web` | Metro resolve tudo (inclui o corte SQLite/web) |
| UI real | export + `scripts/spa-server.py` + navegador | navegação, desafio completo (erro → dica → acerto), pintura por região, traço, desfazer, limpar, finalizar, persistência após reload |

Testes manuais pendentes para dispositivo: gesto de pintura em telas pequenas, voz pt-BR instalada,
retomada após encerramento do app pelo sistema.

## 8. Limites conhecidos e próximos passos

1. Catálogo de 8 desenhos — ampliar com revisão pedagógica e novos assets vetoriais.
2. Exportar/compartilhar arte (opcional, com "portão" para adulto).
3. Borracha parcial e balde com tolerância para desenhos importados.
4. Migração de versão do snapshot (`SCHEMA_VERSION` já existe; falta o passo de migração).
5. Testes de componente (React Native Testing Library) para telas, hoje cobertas por DOM/e2e manual.
