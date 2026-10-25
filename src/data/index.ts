import { parseCatalog } from '../domain/catalog';
import type { Catalog, CategoryId } from '../domain/types';
import { challenges } from './challenges';
import { drawings } from './drawings';

/** Catálogo validado no boot: conteúdo inconsistente falha alto. */
export const catalog: Catalog = parseCatalog(drawings, challenges);

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  emoji: string;
}

export const categories: CategoryMeta[] = [
  { id: 'animals', label: 'Animais', emoji: '🐾' },
  { id: 'nature', label: 'Natureza', emoji: '🌿' },
  { id: 'space', label: 'Espaço', emoji: '🚀' },
  { id: 'home', label: 'Casa', emoji: '🏠' },
  { id: 'vehicles', label: 'Veículos', emoji: '🎡' },
  { id: 'fantasy', label: 'Fantasia', emoji: '✨' },
];

export function categoryMeta(id: CategoryId): CategoryMeta {
  return categories.find((category) => category.id === id) ?? categories[0];
}
