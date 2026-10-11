import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { BG, ICON } from '../../assets';
import { sfx } from '../../audio/audio';
import { COPY } from '../../content/copy';
import type { Scene } from '../../content/types';
import './judge.css';

// 판별·비교·다시 보기 공통 틀: 장 배경(채도 단계 적용) + 상단 띠(과제 한 줄).
export function JudgeFrame({ scene, task, children }: { scene: Scene; task: string; children?: ComponentChildren }) {
  return (
    <>
      <img class="art" src={BG[scene.bg]} alt="" />
      <header class="topbar jtop"><span class="task" role="status">{task}</span></header>
      {children}
    </>
  );
}

export const verdictSfx = (ok: boolean) => sfx(ok ? 'correct' : 'wrong');

export interface FeedbackItem { ok: boolean; text: string; label?: string }

// 피드백(R24 — 내용을 덮지 않고 화면의 제 자리에 붙는다).
//  side   : 오른쪽 규칙 패널 자리(카드 패널, 안에서 스크롤)
//  bottom : 아래 띠가 위로 자란 종이 패널(그림·카드는 위에 그대로 보인다)
//  row    : 표 카드 맨 아래 한 줄
// '다음' 은 data-primary, 이중 탭은 무시한다.
export function Feedback({ items, onNext, placement, className = '', footer }: { items: FeedbackItem[]; onNext: () => void; placement: 'side' | 'bottom' | 'row'; className?: string; footer?: ComponentChildren }) {
  const sent = useRef(false);
  const go = () => {
    if (sent.current) return;
    sent.current = true;
    sfx('tap');
    onNext();
  };
  const list = (
    <ul class="fl" role="status">
      {items.map((it, i) => (
        <li key={i}>
          <img class="ic" src={ICON[it.ok ? 'stamp-ring' : 'stamp-cross']} alt={it.ok ? COPY.ui.right : COPY.ui.wrong} />
          <span>{it.label ? <b>{it.label}</b> : null}{it.text}</span>
        </li>
      ))}
    </ul>
  );
  const btn = <button type="button" class="btn" data-primary onClick={go}><span>{COPY.ui.next}</span></button>;
  if (placement === 'side') return <aside class={`card jcard fside ${className}`}>{list}{btn}</aside>;
  return <div class={`fb ${placement} ${className}`}>{list}{footer ? <span class="ft">{footer}</span> : null}{btn}</div>;
}
