/**
 * Verificação do domínio, sem framework e sem dispositivo.
 * Roda com Node >= 22.18 (type stripping nativo): `npm run verify`.
 */
import assert from 'node:assert/strict';

import { CatalogError, parseCatalog } from '../src/domain/catalog.ts';
import {
  MAX_ART_ACTIONS,
  answerChallenge,
  applyArtAction,
  challengeProgress,
  computeMedals,
  computeStats,
  createArtwork,
  createProgress,
  deriveFills,
  deriveStrokes,
  eraseAt,
  isDrawingUnlocked,
  noteActivity,
  redoArt,
  setArtworkStatus,
  undoArt,
} from '../src/domain/progress.ts';
import { challenges } from '../src/data/challenges.ts';
import { drawings } from '../src/data/drawings.ts';

let checks = 0;
function check(label, fn) {
  fn();
  checks += 1;
  console.log(`  ok  ${label}`);
}

const NOW = '2026-10-25T12:00:00.000Z';
const LATER = '2026-10-25T12:05:00.000Z';

console.log('catálogo');
const catalog = parseCatalog(drawings, challenges);

check('catálogo válido e indexado', () => {
  assert.equal(catalog.drawings.length, drawings.length);
  assert.equal(catalog.challenges.length, challenges.length);
  assert.equal(catalog.challengeForDrawing.size, drawings.length);
});

check('todo desenho tem exatamente um desafio', () => {
  for (const drawing of drawings) {
    const linked = challenges.filter((challenge) => challenge.drawingId === drawing.id);
    assert.equal(linked.length, 1, `desenho ${drawing.id} tem ${linked.length} desafios`);
    assert.equal(linked[0].id, drawing.challengeId);
  }
});

check('todo desafio desbloqueia exatamente um desenho', () => {
  for (const challenge of challenges) {
    const linked = drawings.filter((drawing) => drawing.challengeId === challenge.id);
    assert.equal(linked.length, 1, `desafio ${challenge.id} desbloqueia ${linked.length} desenhos`);
    assert.equal(linked[0].id, challenge.drawingId);
  }
});

check('ids únicos de desenhos e desafios', () => {
  assert.equal(new Set(drawings.map((drawing) => drawing.id)).size, drawings.length);
  assert.equal(new Set(challenges.map((challenge) => challenge.id)).size, challenges.length);
  const ids = new Set();
  for (const drawing of drawings) {
    for (const region of drawing.regions) {
      const key = `${drawing.id}:${region.id}`;
      assert.ok(!ids.has(key), `região duplicada ${key}`);
      ids.add(key);
    }
  }
});

check('cada desafio tem resposta correta, dica e 2+ alternativas', () => {
  for (const challenge of challenges) {
    assert.ok(challenge.options.length >= 2, `${challenge.id} sem alternativas`);
    assert.ok(
      challenge.options.some((option) => option.id === challenge.correctOptionId),
      `${challenge.id} com resposta correta fora das alternativas`,
    );
    assert.ok(challenge.hint.text.length > 10, `${challenge.id} sem dica útil`);
    assert.equal(challenge.attemptsBeforeHint, 2, `${challenge.id} fora da regra de 2 erros`);
  }
});

check('conteúdo cobre Matemática e Português', () => {
  const subjects = new Set(challenges.map((challenge) => challenge.subject));
  assert.deepEqual([...subjects].sort(), ['math', 'portuguese']);
});

console.log('validação de conteúdo inconsistente');
check('id duplicado quebra o boot', () => {
  assert.throws(
    () => parseCatalog([...drawings, drawings[0]], challenges),
    (error) => error instanceof CatalogError && error.issues.some((issue) => issue.includes('duplicado')),
  );
});

check('desafio sem desenho quebra o boot', () => {
  assert.throws(
    () => parseCatalog(drawings, [...challenges, { ...challenges[0], id: 'ch-fantasma', drawingId: 'inexistente' }]),
    (error) => error instanceof CatalogError,
  );
});

check('desafio com dois desenhos quebra o boot', () => {
  const first = drawings[0];
  const second = drawings[1];
  const duplicated = drawings.map((drawing) =>
    drawing.id === second.id ? { ...drawing, challengeId: first.challengeId } : drawing,
  );
  assert.throws(() => parseCatalog(duplicated, challenges), (error) => error instanceof CatalogError);
});

console.log('fluxo de progressão');
const challenge = catalog.byChallengeId.get('ch-gato');
const wrong = challenge.options.find((option) => option.id !== challenge.correctOptionId);
const right = challenge.options.find((option) => option.id === challenge.correctOptionId);

let snapshot = createProgress(NOW);
Object.freeze(snapshot);

check('estado inicial: tudo bloqueado', () => {
  assert.equal(isDrawingUnlocked(snapshot, challenge.id), false);
  const stats = computeStats(snapshot, drawings, challenges);
  assert.equal(stats.unlockedDrawings, 0);
  assert.equal(stats.completedChallenges, 0);
});

check('primeiro erro não desbloqueia e não mostra dica', () => {
  const result = answerChallenge(snapshot, challenge, wrong.id, NOW);
  assert.equal(result.kind, 'incorrect');
  assert.equal(result.hintVisible, false);
  assert.equal(result.wrongAttempts, 1);
  assert.equal(isDrawingUnlocked(result.snapshot, challenge.id), false);
  snapshot = result.snapshot;
});

check('segundo erro mostra a dica e continua bloqueado', () => {
  const result = answerChallenge(snapshot, challenge, wrong.id, NOW);
  assert.equal(result.kind, 'incorrect');
  assert.equal(result.wrongAttempts, 2);
  assert.equal(result.hintVisible, true);
  assert.equal(challengeProgress(result.snapshot, challenge.id).hintShown, true);
  assert.equal(isDrawingUnlocked(result.snapshot, challenge.id), false);
  snapshot = result.snapshot;
});

check('acerto conclui o desafio e desbloqueia só o desenho associado', () => {
  const result = answerChallenge(snapshot, challenge, right.id, LATER);
  assert.equal(result.kind, 'correct');
  assert.equal(result.drawingId, challenge.drawingId);
  assert.equal(isDrawingUnlocked(result.snapshot, challenge.id), true);
  const linked = drawings.find((drawing) => drawing.challengeId === challenge.id);
  assert.equal(linked.id, result.drawingId);
  for (const other of challenges.filter((item) => item.id !== challenge.id)) {
    assert.equal(isDrawingUnlocked(result.snapshot, other.id), false, `${other.id} desbloqueado indevidamente`);
  }
  snapshot = result.snapshot;
});

check('acertar de novo não gera segunda recompensa', () => {
  const before = challengeProgress(snapshot, challenge.id);
  const result = answerChallenge(snapshot, challenge, right.id, LATER);
  assert.equal(result.kind, 'already-completed');
  assert.equal(result.snapshot, snapshot);
  assert.equal(challengeProgress(result.snapshot, challenge.id).completedAt, before.completedAt);
});

check('progresso sobrevive à serialização (persistência local)', () => {
  const restored = JSON.parse(JSON.stringify(snapshot));
  assert.equal(isDrawingUnlocked(restored, challenge.id), true);
  assert.equal(challengeProgress(restored, challenge.id).wrongAttempts, 2);
  assert.equal(challengeProgress(restored, challenge.id).hintShown, true);
  const stats = computeStats(restored, drawings, challenges);
  assert.equal(stats.unlockedDrawings, 1);
  assert.equal(stats.completedChallenges, 1);
  assert.equal(stats.wrongAttempts, 2);
});

check('medalha de primeira conquista é liberada', () => {
  const medals = computeMedals(snapshot, drawings, challenges);
  const first = medals.find((medal) => medal.id === 'first-drawing');
  assert.equal(first.earned, true);
  const all = medals.find((medal) => medal.id === 'all-drawings');
  assert.equal(all.earned, false);
});

console.log('pintura');
let artwork = createArtwork('gato', NOW);

check('preenchimento por regiões', () => {
  artwork = applyArtAction(artwork, { kind: 'fill', regionId: 'corpo', color: '#FF5C5C' }, NOW);
  artwork = applyArtAction(artwork, { kind: 'fill', regionId: 'cabeca', color: '#3FA9F5' }, NOW);
  const fills = deriveFills(artwork);
  assert.equal(fills.corpo, '#FF5C5C');
  assert.equal(fills.cabeca, '#3FA9F5');
  assert.equal(Object.keys(fills).length, 2);
});

check('desfazer e refazer', () => {
  const undone = undoArt(artwork, LATER);
  assert.equal(deriveFills(undone).cabeca, undefined);
  const redone = redoArt(undone, LATER);
  assert.equal(deriveFills(redone).cabeca, '#3FA9F5');
});

check('traço livre fica separado do desenho-base', () => {
  artwork = applyArtAction(
    artwork,
    {
      kind: 'stroke',
      stroke: {
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 },
        ],
        color: '#FFD23F',
        width: 12,
      },
    },
    NOW,
  );
  assert.equal(deriveStrokes(artwork).length, 1);
  assert.equal(Object.keys(deriveFills(artwork)).length, 2);
});

check('borracha remove apenas o traço tocado', () => {
  artwork = applyArtAction(
    artwork,
    {
      kind: 'stroke',
      stroke: { points: [{ x: 150, y: 150 }], color: '#2EC4B6', width: 8 },
    },
    NOW,
  );
  const erased = eraseAt(artwork, { x: 152, y: 148 }, 10, LATER);
  assert.equal(deriveStrokes(erased).length, 1);
  assert.equal(deriveStrokes(erased)[0].color, '#FFD23F');
});

check('limpar zera cores e traços', () => {
  const cleared = applyArtAction(artwork, { kind: 'clear' }, LATER);
  assert.deepEqual(deriveFills(cleared), {});
  assert.deepEqual(deriveStrokes(cleared), []);
});

check('histórico tem teto para não crescer sem limite', () => {
  let big = createArtwork('gato', NOW);
  for (let index = 0; index < MAX_ART_ACTIONS + 40; index += 1) {
    big = applyArtAction(big, { kind: 'fill', regionId: 'corpo', color: '#FF5C5C' }, NOW);
  }
  assert.equal(big.actions.length, MAX_ART_ACTIONS);
});

check('arte pode ser finalizada e reaberta', () => {
  const finished = setArtworkStatus(artwork, 'finished', LATER);
  assert.equal(finished.status, 'finished');
  const reopened = setArtworkStatus(finished, 'in_progress', LATER);
  assert.equal(reopened.status, 'in_progress');
});

check('última atividade é registrada', () => {
  const withActivity = noteActivity(snapshot, 'studio', 'gato', LATER);
  assert.equal(withActivity.lastActivity.kind, 'studio');
  assert.equal(withActivity.lastActivity.drawingId, 'gato');
});

console.log('estatísticas do catálogo');
check('contagem de coleções e assuntos', () => {
  const stats = computeStats(createProgress(NOW), drawings, challenges);
  assert.equal(stats.totalDrawings, drawings.length);
  assert.equal(stats.totalChallenges, challenges.length);
  const math = challenges.filter((item) => item.subject === 'math').length;
  assert.equal(math, 4);
  assert.equal(challenges.length - math, 4);
});

console.log(`\n${checks} verificações passaram.`);
