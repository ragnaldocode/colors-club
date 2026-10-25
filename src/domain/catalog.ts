import type { Catalog, Challenge, Drawing } from './types';

/**
 * Erro de conteúdo: lançado no boot quando o catálogo local está inconsistente.
 * Preferimos falhar alto a exibir um desenho que não pode ser conquistado.
 */
export class CatalogError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Catálogo inválido (${issues.length} problema(s)):\n- ${issues.join('\n- ')}`);
    this.name = 'CatalogError';
    this.issues = issues;
  }
}

const CATEGORY_IDS = ['animals', 'nature', 'space', 'home', 'fantasy', 'vehicles'];

/**
 * Valida o catálogo estático e devolve os índices de acesso.
 * Garante a regra central: 1 desafio ⇄ 1 desenho, nos dois sentidos.
 */
export function parseCatalog(drawings: Drawing[], challenges: Challenge[]): Catalog {
  const issues: string[] = [];
  const byDrawingId = new Map<string, Drawing>();
  const byChallengeId = new Map<string, Challenge>();
  const challengeForDrawing = new Map<string, Challenge>();

  for (const drawing of drawings) {
    if (!drawing.id.trim()) issues.push('desenho sem id');
    if (byDrawingId.has(drawing.id)) issues.push(`id de desenho duplicado: ${drawing.id}`);
    if (!drawing.title.trim()) issues.push(`desenho ${drawing.id} sem título`);
    if (!CATEGORY_IDS.includes(drawing.category)) {
      issues.push(`desenho ${drawing.id} com categoria desconhecida: ${String(drawing.category)}`);
    }
    if (drawing.regions.length === 0) issues.push(`desenho ${drawing.id} sem regiões coloríveis`);
    const regionIds = new Set<string>();
    for (const region of drawing.regions) {
      if (regionIds.has(region.id)) issues.push(`desenho ${drawing.id}: região duplicada ${region.id}`);
      regionIds.add(region.id);
      if (!region.d.trim()) issues.push(`desenho ${drawing.id}: região ${region.id} sem caminho`);
    }
    if (!/^\d+\s+\d+\s+\d+\s+\d+$/.test(drawing.viewBox.trim())) {
      issues.push(`desenho ${drawing.id} com viewBox inválido: ${drawing.viewBox}`);
    }
    byDrawingId.set(drawing.id, drawing);
  }

  for (const challenge of challenges) {
    if (!challenge.id.trim()) issues.push('desafio sem id');
    if (byChallengeId.has(challenge.id)) issues.push(`id de desafio duplicado: ${challenge.id}`);
    byChallengeId.set(challenge.id, challenge);

    if (!byDrawingId.has(challenge.drawingId)) {
      issues.push(`desafio ${challenge.id} aponta para desenho inexistente: ${challenge.drawingId}`);
    }
    if (challenge.subject !== 'math' && challenge.subject !== 'portuguese') {
      issues.push(`desafio ${challenge.id} com matéria inválida: ${String(challenge.subject)}`);
    }
    if (!challenge.prompt.trim()) issues.push(`desafio ${challenge.id} sem enunciado`);
    if (challenge.options.length < 2) issues.push(`desafio ${challenge.id} precisa de 2+ alternativas`);

    const optionIds = new Set<string>();
    for (const option of challenge.options) {
      if (optionIds.has(option.id)) {
        issues.push(`desafio ${challenge.id}: alternativa duplicada ${option.id}`);
      }
      optionIds.add(option.id);
      if (!option.label.trim()) issues.push(`desafio ${challenge.id}: alternativa ${option.id} sem rótulo`);
    }
    if (!optionIds.has(challenge.correctOptionId)) {
      issues.push(`desafio ${challenge.id}: resposta correta ${challenge.correctOptionId} não está nas alternativas`);
    }
    if (!challenge.hint.text.trim()) issues.push(`desafio ${challenge.id} sem dica`);
    if (challenge.attemptsBeforeHint < 1) {
      issues.push(`desafio ${challenge.id}: attemptsBeforeHint deve ser >= 1`);
    }
  }

  // 1:1 nos dois sentidos.
  for (const drawing of drawings) {
    const challenge = byChallengeId.get(drawing.challengeId);
    if (!challenge) {
      issues.push(`desenho ${drawing.id} aponta para desafio inexistente: ${drawing.challengeId}`);
      continue;
    }
    if (challenge.drawingId !== drawing.id) {
      issues.push(
        `associação inconsistente: desenho ${drawing.id} -> desafio ${challenge.id} -> desenho ${challenge.drawingId}`,
      );
      continue;
    }
    challengeForDrawing.set(drawing.id, challenge);
  }

  for (const challenge of challenges) {
    const linked = drawings.filter((drawing) => drawing.challengeId === challenge.id);
    if (linked.length === 0) {
      issues.push(`desafio ${challenge.id} não desbloqueia nenhum desenho`);
    }
    if (linked.length > 1) {
      issues.push(`desafio ${challenge.id} desbloqueia ${linked.length} desenhos (regra 1:1 violada)`);
    }
  }

  if (issues.length > 0) throw new CatalogError(issues);

  return {
    drawings,
    challenges,
    byDrawingId,
    byChallengeId,
    challengeForDrawing,
  };
}

export function challengeOf(catalog: Catalog, drawingId: string): Challenge | undefined {
  return catalog.challengeForDrawing.get(drawingId);
}

export function drawingOf(catalog: Catalog, challengeId: string): Drawing | undefined {
  const challenge = catalog.byChallengeId.get(challengeId);
  if (!challenge) return undefined;
  return catalog.byDrawingId.get(challenge.drawingId);
}
