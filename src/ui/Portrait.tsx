import { PORTRAIT } from '../assets';
import { COPY } from '../content/copy';
import type { Face, PortraitAge, Stats } from '../content/types';

// delta 합이 + 면 기쁨, - 면 곤란, 0 이면 평상
export function faceFor(delta: Partial<Stats>): Face {
  const sum = (delta.join ?? 0) + (delta.info ?? 0) + (delta.home ?? 0);
  return sum > 0 ? 'joy' : sum < 0 ? 'worry' : 'calm';
}

export function Portrait({ age, face }: { age: PortraitAge; face: Face }) {
  return (
    <div class="portrait">
      <img src={PORTRAIT[age][face]} alt={COPY.ui.portraitAlt} />
    </div>
  );
}
