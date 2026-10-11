import { useRef } from 'preact/hooks';
import { COMPARE } from '../../assets';
import { sfx } from '../../audio/audio';
import { CONTENT } from '../../content';
import { COPY } from '../../content/copy';
import type { Scene } from '../../content/types';
import { JudgeFrame } from './shared';
import './judge.css';

// 비교 카드 — 좌 그때(세피아) · 우 오늘(풀컬러), 가운데 잉크 선. '다음' 한 번에 넘기고 이중 탭은 무시한다(compare_view 는 리듀서가 한 번만 남긴다).
export function Compare({ scene, onNext }: { scene: Scene; onNext: () => void }) {
  const n = (scene.compare ?? 1) as 1 | 2 | 3 | 4 | 5;
  const c = CONTENT.compares.find((x) => x.n === n)!;
  const sent = useRef(false);
  const go = () => {
    if (sent.current) return;
    sent.current = true;
    sfx('tap');
    onNext();
  };
  return (
    <JudgeFrame scene={scene} task={c.title}>
      <div class="jbody cmp">
        <section class="side then" aria-label={COPY.ui.then}>
          <span class="tag"><span>{COPY.ui.then}</span></span>
          <div class="frame"><img src={COMPARE[n].then} alt="" /></div>
          <div class="card jcard ctext"><p>{c.then}</p></div>
        </section>
        <i class="ink" aria-hidden="true" />
        <section class="side today" aria-label={COPY.ui.today}>
          <span class="tag"><span>{COPY.ui.today}</span></span>
          <div class="frame"><img src={COMPARE[n].today} alt="" /></div>
          <div class="card jcard ctext">{c.today.map((t) => <p key={t}>{t}</p>)}</div>
        </section>
      </div>
      <button type="button" class="btn cnext" data-primary onClick={go}><span>{COPY.ui.next}</span></button>
    </JudgeFrame>
  );
}
