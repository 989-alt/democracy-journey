import { scenes } from './scenes';
import type { Scene } from './types';

// 장마다 생활 문화 사례 1장면(kind 'culture'). 본체는 scenes.ts.
export const cultures: Scene[] = scenes.filter((s) => s.kind === 'culture');
