import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/**
 * Leitura em voz alta dos enunciados (expo-speech).
 * Usa a voz do sistema: funciona offline quando o dispositivo já tem voz pt-BR instalada.
 */
let lastSpoken = '';

export function speak(text: string): void {
  try {
    Speech.stop();
    lastSpoken = text;
    Speech.speak(text, {
      language: 'pt-BR',
      rate: 0.9,
      pitch: 1.05,
    });
  } catch {
    // Sem voz disponível: o enunciado continua visível na tela.
  }
}

export function stopSpeaking(): void {
  try {
    Speech.stop();
  } catch {
    // ignorado
  }
}

export function speechAvailable(): boolean {
  return Platform.OS !== 'web' || typeof window !== 'undefined';
}

export function lastSpokenText(): string {
  return lastSpoken;
}
