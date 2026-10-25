import type { Drawing, DrawingDetail, DrawingRegion } from '../domain/types';

/**
 * Catálogo de desenhos originais, vetoriais e locais.
 * Cada região é um caminho fechado: tocar pinta a área, sem flood-fill de pixels.
 */

const circle = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;

const rect = (x: number, y: number, w: number, h: number) =>
  `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;

const polygon = (points: ReadonlyArray<readonly [number, number]>) =>
  `M ${points.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;

const region = (id: string, label: string, d: string): DrawingRegion => ({ id, label, d });
const detail = (d: string, width = 3, fill?: string): DrawingDetail => ({ d, width, fill });

const VIEW_BOX = '0 0 200 200';

const petalCenters = [0, 1, 2, 3, 4].map((index) => {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 5;
  return { x: 100 + Math.cos(angle) * 34, y: 78 + Math.sin(angle) * 34 };
});

export const drawings: Drawing[] = [
  {
    id: 'gato',
    title: 'Gatinho',
    category: 'animals',
    challengeId: 'ch-gato',
    difficulty: 1,
    viewBox: VIEW_BOX,
    regions: [
      region('cauda', 'cauda', 'M 150 146 q 42 -6 30 -46 q -14 20 -34 22 Z'),
      region('corpo', 'corpo', ellipse(100, 140, 54, 38)),
      region('pata-esquerda', 'pata', ellipse(74, 174, 16, 10)),
      region('pata-direita', 'pata', ellipse(126, 174, 16, 10)),
      region('orelha-esquerda', 'orelha', polygon([[68, 58], [60, 18], [96, 42]])),
      region('orelha-direita', 'orelha', polygon([[132, 58], [140, 18], [104, 42]])),
      region('cabeca', 'cabeça', circle(100, 84, 40)),
    ],
    details: [
      detail(circle(88, 80, 4.5), 1, '#2E2440'),
      detail(circle(112, 80, 4.5), 1, '#2E2440'),
      detail('M 96 92 h 8 l -4 5 Z', 1, '#2E2440'),
      detail('M 100 97 q -5 6 -10 3', 2),
      detail('M 100 97 q 5 6 10 3', 2),
      detail('M 62 88 h -14', 2),
      detail('M 62 98 h -14', 2),
      detail('M 138 88 h 14', 2),
      detail('M 138 98 h 14', 2),
    ],
  },
  {
    id: 'peixe',
    title: 'Peixinho',
    category: 'animals',
    challengeId: 'ch-peixe',
    difficulty: 1,
    viewBox: VIEW_BOX,
    regions: [
      region('bolha', 'bolha', circle(34, 46, 11)),
      region('bolha-pequena', 'bolha', circle(18, 26, 6)),
      region('cauda', 'cauda', polygon([[146, 104], [188, 74], [188, 134]])),
      region('nadadeira-cima', 'nadadeira', 'M 84 74 q 10 -30 34 -18 q -8 16 -10 20 Z'),
      region('nadadeira-baixo', 'nadadeira', 'M 82 134 q 10 26 32 14 q -8 -14 -10 -18 Z'),
      region('corpo', 'corpo', ellipse(92, 104, 54, 36)),
    ],
    details: [
      detail(circle(68, 96, 5), 1, '#2E2440'),
      detail('M 44 112 q 6 6 12 2', 2),
      detail('M 118 88 q -8 16 0 32', 2),
    ],
  },
  {
    id: 'borboleta',
    title: 'Borboleta',
    category: 'animals',
    challengeId: 'ch-borboleta',
    difficulty: 2,
    viewBox: VIEW_BOX,
    regions: [
      region('asa-sup-esquerda', 'asa', ellipse(64, 76, 34, 28)),
      region('asa-sup-direita', 'asa', ellipse(136, 76, 34, 28)),
      region('asa-inf-esquerda', 'asa', ellipse(74, 128, 26, 20)),
      region('asa-inf-direita', 'asa', ellipse(126, 128, 26, 20)),
      region('corpo', 'corpo', ellipse(100, 100, 9, 46)),
      region('cabeca', 'cabeça', circle(100, 48, 11)),
    ],
    details: [
      detail('M 94 40 q -12 -16 -20 -18', 2),
      detail('M 106 40 q 12 -16 20 -18', 2),
      detail(circle(56, 72, 7), 1, '#FFC93C'),
      detail(circle(144, 72, 7), 1, '#FFC93C'),
      detail(circle(74, 126, 5), 1, '#FFC93C'),
      detail(circle(126, 126, 5), 1, '#FFC93C'),
      detail(circle(100, 116, 3), 1, '#FFC93C'),
    ],
  },
  {
    id: 'flor',
    title: 'Flor',
    category: 'nature',
    challengeId: 'ch-flor',
    difficulty: 2,
    viewBox: VIEW_BOX,
    regions: [
      ...petalCenters.map((center, index) =>
        region(`petala-${index + 1}`, 'pétala', circle(center.x, center.y, 22)),
      ),
      region('miolo', 'miolo', circle(100, 78, 20)),
      region('caule', 'caule', rect(95, 96, 10, 74)),
      region('folha-esquerda', 'folha', ellipse(78, 140, 20, 11)),
      region('folha-direita', 'folha', ellipse(122, 156, 20, 11)),
      region('terra', 'terra', ellipse(100, 184, 58, 9)),
    ],
    details: [detail('M 100 120 v 50', 2)],
  },
  {
    id: 'arvore',
    title: 'Árvore frutífera',
    category: 'nature',
    challengeId: 'ch-arvore',
    difficulty: 2,
    viewBox: VIEW_BOX,
    regions: [
      region('copa-esquerda', 'copa', circle(62, 98, 26)),
      region('copa-direita', 'copa', circle(138, 98, 26)),
      region('copa', 'copa', circle(100, 72, 40)),
      region('tronco', 'tronco', rect(88, 112, 24, 58)),
      region('fruta-1', 'fruta', circle(84, 64, 8)),
      region('fruta-2', 'fruta', circle(118, 80, 8)),
      region('fruta-3', 'fruta', circle(92, 98, 8)),
      region('terra', 'terra', ellipse(100, 178, 66, 10)),
    ],
    details: [
      detail('M 96 126 q 6 10 0 20', 2),
      detail('M 104 146 q -6 10 0 18', 2),
    ],
  },
  {
    id: 'foguete',
    title: 'Foguete',
    category: 'space',
    challengeId: 'ch-foguete',
    difficulty: 3,
    viewBox: VIEW_BOX,
    regions: [
      region('chama', 'chama', polygon([[86, 142], [100, 186], [114, 142]])),
      region('asa-esquerda', 'asa', polygon([[78, 116], [46, 158], [78, 142]])),
      region('asa-direita', 'asa', polygon([[122, 116], [154, 158], [122, 142]])),
      region('corpo', 'corpo', rect(78, 72, 44, 70)),
      region('bico', 'bico', polygon([[78, 72], [100, 18], [122, 72]])),
      region('janela', 'janela', circle(100, 96, 13)),
    ],
    details: [
      detail('M 78 120 h 44', 2),
      detail('M 34 40 l 3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z', 1, '#FFC93C'),
      detail('M 166 62 l 2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z', 1, '#FFC93C'),
    ],
  },
  {
    id: 'casa',
    title: 'Casinha',
    category: 'home',
    challengeId: 'ch-casa',
    difficulty: 3,
    viewBox: VIEW_BOX,
    regions: [
      region('sol', 'sol', circle(174, 30, 15)),
      region('chamine', 'chaminé', rect(122, 54, 16, 30)),
      region('telhado', 'telhado', polygon([[40, 98], [100, 42], [160, 98]])),
      region('parede', 'parede', rect(54, 96, 92, 70)),
      region('janela', 'janela', rect(64, 112, 22, 22)),
      region('porta', 'porta', rect(88, 130, 24, 36)),
      region('grama', 'grama', ellipse(100, 176, 70, 10)),
    ],
    details: [
      detail('M 75 112 v 22', 2),
      detail('M 64 123 h 22', 2),
      detail(circle(106, 150, 2.5), 1, '#2E2440'),
    ],
  },
  {
    id: 'balao',
    title: 'Balão de ar',
    category: 'vehicles',
    challengeId: 'ch-balao',
    difficulty: 3,
    viewBox: VIEW_BOX,
    regions: [
      region('faixa-esquerda', 'faixa', 'M 78 38 q -22 42 0 84 q -12 -42 0 -84 Z'),
      region('faixa-direita', 'faixa', 'M 122 38 q 22 42 0 84 q 12 -42 0 -84 Z'),
      region('envelope', 'envelope', circle(100, 80, 50)),
      region('cesto', 'cesto', rect(82, 152, 36, 28)),
      region('nuvem', 'nuvem', circle(30, 54, 13)),
      region('nuvem-pequena', 'nuvem', circle(46, 62, 9)),
    ],
    details: [
      detail('M 66 124 l 16 28', 2),
      detail('M 134 124 l -16 28', 2),
      detail('M 82 160 h 36', 2),
    ],
  },
];
