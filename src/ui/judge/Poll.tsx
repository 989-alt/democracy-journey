import { useState } from 'preact/hooks';
import { BG, ICON } from '../../assets';
import { sfx } from '../../audio/audio';
import { CONTENT } from '../../content';
import { COPY } from '../../content/copy';
import { POLL_H as H, POLL_W as W, sortSpots, toggle } from './drag';
import type { JudgeProps } from './drag';
import { Feedback, useVerdictSfx } from './shared';
import './judge.css';

const pct = (n: number, of: number) => `${(n / of) * 100}%`;

// ① 투표소 — 그림은 가로 1024 에 맞춰 위에 붙이고(682px), 아래 띠(과제 + 버튼)는 판단 뒤 위로 자라 피드백 패널이 된다.
// R30: '판단 끝내기' = 채점 확정(onJudge). 피드백은 저장된 결과(result)로만 그린다 → 새로고침해도 같은 결과.
export function Poll({ result, onJudge, onNext }: JudgeProps) {
  const spots = sortSpots(CONTENT.judges.poll.spots);
  const [local, setLocal] = useState<string[]>([]);
  useVerdictSfx(result);
  const ok = (id: string) => result?.items.find((i) => i.item === id)?.correct === true;
  // 결과가 있으면 누른 곳을 결과에서 되살린다(위반: 맞음 = 누름, 함정: 틀림 = 누름).
  const tapped = result ? spots.filter((s) => (s.violation !== null) === ok(s.id)).map((s) => s.id) : local;
  const missed = spots.some((s) => s.violation !== null && !tapped.includes(s.id));
  const trapHit = spots.some((s) => s.violation === null && tapped.includes(s.id));
  const right = result ? result.items.filter((i) => i.correct).length : 0;

  return (
    <>
      <div class="pfield">
        <img src={BG['1960-poll']} alt="" />
        {spots.map((s, i) => {
          const on = tapped.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              class={`spot${on ? ' on' : ''}`}
              style={{ left: pct(s.x, W), top: pct(s.y, H), width: pct(s.w, W), height: pct(s.h, H) }}
              aria-label={`${COPY.ui.spotLabel} ${i + 1}`}
              aria-pressed={on}
              disabled={!!result}
              onClick={() => { sfx('tap'); setLocal((t) => toggle(t, s.id)); }}
            >
              {result ? (
                on || s.violation !== null ? <img class="mk" src={ICON[ok(s.id) ? 'stamp-ring' : 'stamp-cross']} alt="" /> : null
              ) : on ? (
                <img class="mk" src={ICON['stamp-ring']} alt="" />
              ) : null}
            </button>
          );
        })}
      </div>
      {result ? (
        <Feedback
          placement="bottom"
          className="poll"
          items={spots.map((s) => ({
            ok: ok(s.id),
            text: `${s.violation !== null && !tapped.includes(s.id) ? COPY.feedback.pollMissed : ''}${s.explain}`,
          }))}
          footer={<><img class="ic" src={ICON['stamp-ring']} alt="" />{right} / {spots.length}{missed ? ` · ${COPY.feedback['poll.miss']}` : trapHit ? ` · ${COPY.feedback['poll.trap']}` : ''}</>}
          onNext={onNext}
        />
      ) : (
        <div class="pbar">
          <span class="task">{COPY.ui.pollTask}</span>
          <span class="cnt" role="status">
            <img class="ic" src={ICON['stamp-ring']} alt="" />
            {tapped.length}
          </span>
          <button type="button" class="btn" data-primary onClick={() => onJudge({ kind: 'poll', tapped: local })}><span>{COPY.ui.finishJudge}</span></button>
        </div>
      )}
    </>
  );
}
