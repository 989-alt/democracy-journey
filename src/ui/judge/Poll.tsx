import { useState } from 'preact/hooks';
import { BG, ICON } from '../../assets';
import { sfx } from '../../audio/audio';
import { CONTENT } from '../../content';
import { COPY } from '../../content/copy';
import { scoreJudge } from '../../engine/judge';
import type { JudgeAnswer } from '../../engine/state';
import { sortSpots, toggle } from './drag';
import type { JudgeProps } from './drag';
import { Feedback, verdictSfx } from './shared';
import './judge.css';

const W = 1536; // 그림 좌표계(1536×1024)
const H = 1024;
const pct = (n: number, of: number) => `${(n / of) * 100}%`;

// ① 투표소 — 그림은 가로 1024 에 맞춰 위에 붙이고(682px), 아래 띠(과제 + 버튼)는 판단 뒤 위로 자라 피드백 패널이 된다.
export function Poll({ onJudge }: JudgeProps) {
  const spots = sortSpots(CONTENT.judges.poll.spots);
  const [tapped, setTapped] = useState<string[]>([]);
  const [answer, setAnswer] = useState<JudgeAnswer | null>(null);
  const result = answer ? scoreJudge('poll', answer, CONTENT.judges) : null;
  const good = (id: string) => result?.items.find((i) => i.item === id)?.correct === true;
  const missed = spots.some((s) => s.violation !== null && !tapped.includes(s.id));
  const trapHit = spots.some((s) => s.violation === null && tapped.includes(s.id));
  const right = result ? result.items.filter((i) => i.correct).length : 0;

  const finish = () => {
    if (answer) return;
    const a: JudgeAnswer = { kind: 'poll', tapped };
    setAnswer(a);
    verdictSfx(scoreJudge('poll', a, CONTENT.judges).items.every((i) => i.correct));
  };

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
              disabled={!!answer}
              onClick={() => { sfx('tap'); setTapped((t) => toggle(t, s.id)); }}
            >
              {answer ? (
                on || s.violation !== null ? <img class="mk" src={ICON[good(s.id) ? 'stamp-ring' : 'stamp-cross']} alt="" /> : null
              ) : on ? (
                <img class="mk" src={ICON['stamp-ring']} alt="" />
              ) : null}
            </button>
          );
        })}
      </div>
      {answer ? (
        <Feedback
          placement="bottom"
          className="poll"
          items={spots.map((s) => ({
            ok: good(s.id),
            text: `${s.violation !== null && !tapped.includes(s.id) ? COPY.feedback.pollMissed : ''}${s.explain}`,
          }))}
          footer={<><img class="ic" src={ICON['stamp-ring']} alt="" />{right} / {spots.length}{missed ? ` · ${COPY.feedback['poll.miss']}` : trapHit ? ` · ${COPY.feedback['poll.trap']}` : ''}</>}
          onNext={() => onJudge(answer)}
        />
      ) : (
        <div class="pbar">
          <span class="task">{COPY.ui.pollTask}</span>
          <span class="cnt" role="status">
            <img class="ic" src={ICON['stamp-ring']} alt="" />
            {tapped.length}
          </span>
          <button type="button" class="btn" data-primary onClick={finish}><span>{COPY.ui.finishJudge}</span></button>
        </div>
      )}
    </>
  );
}
