import { scenes } from './scenes';
import { judges } from './judges';
import { compares } from './compares';
import { cultures } from './cultures';
import { timeline } from './timeline';
import { COPY } from './copy';

export const CONTENT = { scenes, judges, compares, cultures, timeline, copy: COPY };
export const sceneOrder: string[] = scenes.map((s) => s.id);
