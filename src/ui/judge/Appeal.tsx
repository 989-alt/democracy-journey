import { useState } from 'preact/hooks';
import { ICON } from '../../assets';
import { sfx } from '../../audio/audio';
import { CONTENT } from '../../content';
import { COPY } from '../../content/copy';
import type { JudgeProps } from './drag';
import { Feedback, JudgeFrame, useVerdictSfx } from './shared';
import './judge.css';

const CARD_ICON: Record<string, string> = { assembly: 'assembly', court: 'gavel', press: 'newspaper', neighbor: 'house' };

// ② 호소처 — 카드 4장을 모두 뒤집어야 이유 3지가 열린다.
// R30: 까닭을 고르면 곧바로 채점 확정(onJudge). 피드백·고른 카드 표시는 저장된 결과(result)에서.
export function Appeal({ scene, result, onJudge, onNext }: JudgeProps) {
  const A = CONTENT.judges.appeal;
  const [flipped, setFlipped] = useState<string[]>([]);
  useVerdictSfx(result);
  const item = result?.items[0];
  // 결과에서 고른 까닭을 되살린다: 정답 여부와 오개념이 같은 선택지.
  const why = item ? A.why.find((w) => w.correct === item.correct && w.misconception === item.misconception)?.id ?? null : null;
  const all = !!result || flipped.length === A.cards.length;
  const text = !item ? '' : item.correct ? COPY.feedback.appealRight : COPY.feedback[item.misconception ?? 'appeal.wrong'] ?? COPY.feedback['appeal.wrong'];
  const task = all ? COPY.ui.why : scene.text[scene.text.length - 1];

  const pick = (id: string) => {
    if (result) return;
    sfx('tap');
    onJudge({ kind: 'appeal', why: id });
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
            const on = all || flipped.includes(c.id);
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
      {item ? <Feedback placement="bottom" items={[{ ok: item.correct, text }]} onNext={onNext} /> : null}
    </JudgeFrame>
  );
}
