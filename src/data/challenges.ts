import type { Challenge } from '../domain/types';

/**
 * Desafios educativos locais — um por desenho (regra 1:1).
 * Cada dica é específica do desafio e não revela a alternativa correta.
 */
export const challenges: Challenge[] = [
  {
    id: 'ch-gato',
    drawingId: 'gato',
    subject: 'math',
    skill: 'contagem até 5',
    difficulty: 1,
    prompt: 'Quantos gatinhos você vê?',
    illustration: [{ emoji: '🐱', count: 3 }],
    options: [
      { id: '2', label: '2' },
      { id: '3', label: '3' },
      { id: '4', label: '4' },
    ],
    correctOptionId: '3',
    hint: {
      text: 'Toque em cada gatinho e conte devagar: um, dois, três.',
      groups: [{ emoji: '🐱', count: 3 }],
    },
    attemptsBeforeHint: 2,
  },
  {
    id: 'ch-peixe',
    drawingId: 'peixe',
    subject: 'portuguese',
    skill: 'letra inicial',
    difficulty: 1,
    prompt: 'Com que letra começa a palavra PEIXE?',
    illustration: [{ emoji: '🐟', count: 1 }],
    options: [
      { id: 'P', label: 'P' },
      { id: 'B', label: 'B' },
      { id: 'T', label: 'T' },
    ],
    correctOptionId: 'P',
    hint: {
      text: 'O começo de PEIXE tem o som “pê”. Procure a letra que faz esse som.',
    },
    attemptsBeforeHint: 2,
  },
  {
    id: 'ch-borboleta',
    drawingId: 'borboleta',
    subject: 'math',
    skill: 'sequência numérica',
    difficulty: 2,
    prompt: 'As borboletas contam 1, 2, 3, 4, 5... Qual número vem depois do 5?',
    illustration: [{ emoji: '🦋', count: 5 }],
    options: [
      { id: '6', label: '6' },
      { id: '7', label: '7' },
      { id: '4', label: '4' },
    ],
    correctOptionId: '6',
    hint: {
      text: 'Conte devagar: 4, 5, e o próximo é o 6. Ele vem logo depois do 5.',
      groups: [{ emoji: '🦋', count: 6 }],
    },
    attemptsBeforeHint: 2,
  },
  {
    id: 'ch-flor',
    drawingId: 'flor',
    subject: 'portuguese',
    skill: 'completar palavra',
    difficulty: 2,
    prompt: 'Complete a palavra: _LOR',
    illustration: [{ emoji: '🌸', count: 1 }],
    options: [
      { id: 'F', label: 'F' },
      { id: 'V', label: 'V' },
      { id: 'M', label: 'M' },
    ],
    correctOptionId: 'F',
    hint: {
      text: 'A palavra é FLOR, a flor do jardim. Ela começa com o som “fé”.',
    },
    attemptsBeforeHint: 2,
  },
  {
    id: 'ch-arvore',
    drawingId: 'arvore',
    subject: 'math',
    skill: 'subtração simples',
    difficulty: 2,
    prompt: 'A árvore tinha 6 maçãs. Duas caíram. Quantas maçãs ficaram na árvore?',
    illustration: [
      { emoji: '🍎', count: 6, caption: 'na árvore' },
      { emoji: '🍂', count: 2, caption: 'caíram' },
    ],
    options: [
      { id: '3', label: '3' },
      { id: '4', label: '4' },
      { id: '5', label: '5' },
    ],
    correctOptionId: '4',
    hint: {
      text: 'Comece com 6 maçãs e tire 2: 6, 5, 4. Sobraram 4 maçãs.',
      groups: [
        { emoji: '🍎', count: 4, caption: 'ficaram' },
        { emoji: '🍂', count: 2, caption: 'caíram' },
      ],
    },
    attemptsBeforeHint: 2,
  },
  {
    id: 'ch-casa',
    drawingId: 'casa',
    subject: 'portuguese',
    skill: 'formação de palavras com sílabas',
    difficulty: 3,
    prompt: 'Junte as sílabas CA + SA. Qual palavra aparece?',
    options: [
      { id: 'casa', label: 'CASA' },
      { id: 'cama', label: 'CAMA' },
      { id: 'cadeira', label: 'CADEIRA' },
    ],
    correctOptionId: 'casa',
    hint: {
      text: 'Fale devagar: CA... SA. Junte os dois pedacinhos: CASA, o lugar onde moramos.',
      groups: [{ emoji: '🏠', count: 1 }],
    },
    attemptsBeforeHint: 2,
  },
  {
    id: 'ch-foguete',
    drawingId: 'foguete',
    subject: 'math',
    skill: 'adição simples',
    difficulty: 3,
    prompt: 'O foguete juntou 4 estrelas e depois mais 2. Quantas estrelas ele tem agora?',
    illustration: [
      { emoji: '⭐', count: 4, caption: 'primeiro' },
      { emoji: '⭐', count: 2, caption: 'depois' },
    ],
    options: [
      { id: '5', label: '5' },
      { id: '6', label: '6' },
      { id: '7', label: '7' },
    ],
    correctOptionId: '6',
    hint: {
      text: 'Conte todas as estrelas juntas: 1, 2, 3, 4 e mais 5, 6. São 6 estrelas.',
      groups: [{ emoji: '⭐', count: 6 }],
    },
    attemptsBeforeHint: 2,
  },
  {
    id: 'ch-balao',
    drawingId: 'balao',
    subject: 'portuguese',
    skill: 'compreensão de frase',
    difficulty: 3,
    prompt: 'Qual imagem combina com a frase “O balão sobe no céu”?',
    options: [
      { id: 'balao', label: 'Balão subindo', emoji: '🎈' },
      { id: 'carro', label: 'Carro na rua', emoji: '🚗' },
      { id: 'tartaruga', label: 'Tartaruga no chão', emoji: '🐢' },
    ],
    correctOptionId: 'balao',
    hint: {
      text: 'A frase fala de algo que vai para cima, no céu. Olhe as imagens e pense em qual delas sobe.',
    },
    attemptsBeforeHint: 2,
  },
];
