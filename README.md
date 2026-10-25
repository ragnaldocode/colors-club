# Colors Club 🎨

Aplicativo infantil **offline** que une pintura digital e aprendizagem para crianças de 5 a 8 anos.
Cada desenho novo é a recompensa por um desafio de Matemática ou Português concluído.

> **Princípio central:** cada desafio ensina uma habilidade, cada resposta correta conquista um desenho e
> cada desenho conquistado se transforma em uma nova oportunidade de criar.

---

## O que já funciona (MVP)

- Cinco áreas: **Início (Meu mundo)**, **Galeria**, **Desafios**, **Estúdio de pintura** e **Meu álbum**.
- Personagem original (**Lumi**, um vaga-lume-estrela) e identidade visual própria.
- 8 desenhos vetoriais originais e 8 desafios (4 de Matemática, 4 de Português), com associação **1:1**.
- Sistema de tentativas: erro não pune, **dica visual após 2 erros**, acerto desbloqueia o desenho uma única vez.
- Pintura em dois modos: **preencher por regiões** (toque) e **traço livre** (dedo/caneta), com borracha,
  desfazer/refazer, limpar com confirmação e finalizar pintura.
- **Salvamento automático** local e retomada da pintura no mesmo estado.
- Álbum com desenhos, artes, medalhas e progresso.
- **100% offline**: sem backend, sem login, sem anúncios, sem compras.

## Regra de negócio central (validada em teste)

| Regra | Onde vive | Como é garantida |
| --- | --- | --- |
| 1 desenho ⇄ 1 desafio | `src/data/drawings.ts`, `src/data/challenges.ts` | `parseCatalog()` no boot lança `CatalogError` se a relação quebrar |
| Erro nunca desbloqueia | `src/domain/progress.ts` → `answerChallenge()` | função pura testada em `scripts/verify-domain.mjs` |
| Dica após 2 erros | `Challenge.attemptsBeforeHint` + `hintShown` | validado no catálogo e no teste de fluxo |
| Acerto desbloqueia uma única vez | `ChallengeProgress.isCompleted` | segunda resposta retorna `already-completed` sem nova recompensa |
| Desbloqueio persistente | `expo-sqlite` (nativo) / `localStorage` (web) | `ProgressProvider` grava com debounce e ao ir para segundo plano |

## Stack e decisões técnicas

| Área | Escolha | Por quê |
| --- | --- | --- |
| Base | Expo SDK 58 + React Native 0.88 + TypeScript (strict) | requisito do projeto; tipagem forte no domínio |
| Navegação | `expo-router` (Tabs + Stack) | rotas por arquivo, deep links (`/challenge/gato`, `/studio/gato`) |
| Desenhos e pincel | `react-native-svg` | cada região é um **caminho fechado**: preencher é trocar `fill`, sem flood-fill de pixels (caro em mobile). Traços ficam em camada separada do desenho-base |
| Persistência | `expo-sqlite` com tabelas (`challenge_progress`, `artworks`, `meta`) | consultas estruturadas e gravação transacional; `store.web.ts` mantém o bundle web sem o wasm do SQLite |
| Voz | `expo-speech` (voz do sistema, pt-BR) | leitura de enunciados e dicas sem rede; falha silenciosa se não houver voz instalada |
| Feedback tátil | `expo-haptics` | opcional, desligado na web |
| Skia | **não usado nesta versão** | `@shopify/react-native-skia` exigiria dev build e não traz ganho para preenchimento por regiões; reavaliar se entrar pincel com textura/borracha parcial |

## Estrutura

```
src/
  app/                 rotas (expo-router): (tabs)/index|gallery|album, challenge/[drawingId], studio/[drawingId]
  components/          UI reutilizável (botões grandes, canvas, mascote, diálogos)
  data/                catálogo local: desenhos (SVG), desafios, coleções
  domain/              tipos, validação do catálogo e regras de progresso/pintura (sem React)
  services/            storage (SQLite/localStorage), áudio (TTS), háptica
  state/               ProgressProvider: hidrata, aplica regras e persiste
  theme/               cores, tipografia, espaçamento, paleta de pintura
scripts/               verify-domain.mjs, generate-icons.py, spa-server.py
docs/arquitetura.md    decisões, modelo de dados e limites conhecidos
```

## Como rodar

```bash
npm install
npx expo start          # Expo Go / dev build
npx expo start --web    # navegador (para inspeção rápida)
```

Verificações (sem dispositivo):

```bash
npm run typecheck       # tsc --noEmit (strict)
npm run verify          # 25 verificações de domínio no Node (type stripping nativo)
npm run check           # typecheck + verify
npx expo export -p web  # smoke test do bundle
python3 scripts/spa-server.py 8099 dist   # serve o export com fallback SPA
```

Ícones são gerados por script (sem assets de terceiros): `python3 scripts/generate-icons.py`
(requer Pillow em um venv).

## Conteúdo atual

| Desenho | Coleção | Desafio | Matéria | Habilidade |
| --- | --- | --- | --- | --- |
| Gatinho | Animais | Quantos gatinhos? | Matemática | contagem até 5 |
| Peixinho | Animais | Com que letra começa PEIXE? | Português | letra inicial |
| Borboleta | Animais | Número depois do 5 | Matemática | sequência numérica |
| Flor | Natureza | Complete _LOR | Português | completar palavra |
| Árvore frutífera | Natureza | 6 maçãs, 2 caíram | Matemática | subtração simples |
| Casinha | Casa | CA + SA | Português | sílabas |
| Foguete | Espaço | 4 estrelas + 2 | Matemática | adição simples |
| Balão de ar | Veículos | "O balão sobe no céu" | Português | compreensão de frase |

Para adicionar conteúdo: crie o desenho em `src/data/drawings.ts` (regiões fechadas + detalhes),
o desafio correspondente em `src/data/challenges.ts` e rode `npm run verify` — o catálogo recusa
ids duplicados, referências quebradas e associações que não sejam 1:1.

## Offline e privacidade

- Nenhuma chamada de rede é necessária para galeria, desafio, desbloqueio, pintura, salvamento ou álbum.
- Não há coleta de dados pessoais, conta, rastreamento ou publicidade.
- O progresso fica no aparelho; desinstalar o app apaga os dados.

## Limites conhecidos / próximos passos

- Catálogo inicial pequeno de propósito (8 desenhos) — qualidade pedagógica antes de volume.
- A borracha remove o traço inteiro tocado (não apaga parcialmente um traço).
- Sem exportação/compartilhamento de arte (previsto como opcional, com supervisão de adulto).
- Sem trilha sonora: só voz sintetizada e feedback tátil.
- Preenchimento por regiões depende de desenhos com áreas fechadas — o validador exige um caminho
  por região, mas a produção de novos desenhos precisa seguir esse formato.

## Licença

A definir pelo proprietário do repositório.
