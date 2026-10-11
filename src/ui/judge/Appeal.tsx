import { useState } from 'preact/hooks';
import { ICON } from '../../assets';
import { sfx } from '../../audio/audio';
import { CONTENT } from '../../content';
import { COPY } from '../../content/copy';
import { scoreJudge } from '../../engine/judge';
import type { JudgeProps } from './drag';
import { Feedback, JudgeFrame, verdictSfx } from './shared';
import './judge.css';

const CARD_ICON: Record<string, string> = { assembly: 'assembly', court: 'gavel', press: 'newspaper', neighbor: 'house' };

// ② 호소처 — 카드 4장을 모두 뒤집어야 이유 3지가 열린다.
export function Appeal({ scene, onJudge }: JudgeProps) {
  const A = CONTENT.judges.appeal;
  const [flipped, setFlipped] = useState<string[]>([]);
  const [why, setWhy] = useState<string | null>(null);
  const all = flipped.length === A.cards.length;
  const item = why ? scoreJudge('appeal', { kind: 'appeal', why }, CONTENT.judges).items[0] : null;
  const text = !item ? '' : item.correct ? COPY.feedback.appealRight : COPY.feedback[item.misconception ?? 'appeal.wrong'] ?? COPY.feedback['appeal.wrong'];
  const task = all ? COPY.ui.why : scene.text[scene.text.length - 1];

  const pick = (id: string) => {
    if (why) return;
    sfx('tap');
    setWhy(id);
    verdictSfx(!!A.why.find((w) => w.id === id)?.correct);
  };

  return (
    <JudgeFrame scene={scene} task={task}>
      <div class="jbody jcol">
        <div class="dialog jdlg">
          <div class="who">{COPY.ui.situation}</div>
          <p>{A.situation}</p>
        </div>
        <div class="grid4" role="group" aria-label={COPY.ui.appealCards}>
          {A.cards.map((c) => {
            const on = flipped.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                class={`card jcard flipcard${on ? ' flip' : ''}`}
                aria-pressed={on}
                onClick={() => { if (on || why) return; sfx('tap'); setFlipped((f) => [...f, c.id]); }}
              >
                {on ? (
                  <>
                    <span class="ft"><img class="ic" src={ICON['stamp-cross']} alt="" />{c.title}</span>
                    <span class="t">{c.back}</span>
                  </>
                ) : (
                  <>
                    <img class="big" src={ICON[CARD_ICON[c.id]]} alt="" />
                    <span class="ft">{c.title}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        {all ? (
          <div class="grid3" role="group" aria-label={COPY.ui.why}>
            {A.why.map((w, i) => (
              <button
                key={w.id}
                type="button"
                class={`card jcard${why ? (w.id === why ? ' picked' : ' dim') : ''}`}
                onClick={() => pick(w.id)}
              >
                <span class="n">{i + 1}</span>
                <span class="t">{w.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {item ? <Feedback placement="bottom" items={[{ ok: item.correct, text }]} onNext={() => onJudge({ kind: 'appeal', why: why! })} /> : null}
    </JudgeFrame>
  );
}
