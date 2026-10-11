import { Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { ICON } from '../../assets';
import { sfx } from '../../audio/audio';
import { CONTENT } from '../../content';
import { COPY } from '../../content/copy';
import { scoreJudge } from '../../engine/judge';
import type { JudgeAnswer } from '../../engine/state';
import { completeGrid } from './drag';
import type { JudgeProps } from './drag';
import { Feedback, JudgeFrame, verdictSfx } from './shared';
import './judge.css';

type Cell = number | null;
const short = (s: string) => s.split('(')[0].trim(); // '구체적인가? (…)' → '구체적인가?'

// ④ 공약 채점표 — 3 후보 × 3 기준(1~5점). 9칸이 다 차야 투표할 수 있다(R14·R15).
export function Pledge({ scene, onJudge }: JudgeProps) {
  const { candidates, criteria } = CONTENT.judges.pledge;
  const [grid, setGrid] = useState<Record<string, Cell[]>>(() => Object.fromEntries(candidates.map((c) => [c.id, [null, null, null]])));
  const [warn, setWarn] = useState(0);
  const [answer, setAnswer] = useState<JudgeAnswer | null>(null);
  const filled = candidates.reduce((n, c) => n + grid[c.id].filter((v) => v !== null).length, 0);
  const complete = completeGrid(grid, candidates.map((c) => c.id), criteria.length);
  const sum = (id: string) => grid[id].reduce<number>((a, v) => a + (v ?? 0), 0);

  useEffect(() => {
    if (!warn) return;
    const t = setTimeout(() => setWarn(0), 3000);
    return () => clearTimeout(t);
  }, [warn]);

  const step = (id: string, i: number, d: 1 | -1) => {
    if (answer) return;
    sfx('tap');
    setGrid((g) => ({ ...g, [id]: g[id].map((v, j) => (j !== i ? v : v === null ? (d > 0 ? 1 : null) : Math.min(5, Math.max(1, v + d)))) }));
  };

  const vote = (id: string) => {
    if (answer) return;
    if (!complete) { sfx('wrong'); setWarn((n) => n + 1); return; }
    const a: JudgeAnswer = { kind: 'pledge', scores: Object.fromEntries(candidates.map((c) => [c.id, grid[c.id] as [number, number, number]])), vote: id };
    setAnswer(a);
    verdictSfx(scoreJudge('pledge', a, CONTENT.judges).items[0].correct);
  };

  const ok = answer ? scoreJudge('pledge', answer, CONTENT.judges).items[0].correct : false;

  return (
    <JudgeFrame scene={scene} task={scene.text[scene.text.length - 1]}>
      <div class="jbody pgrid">
        <div class="pcands">
          {candidates.map((c) => (
            <div key={c.id} class="card jcard pcand">
              <h3>{c.name}</h3>
              <ul>{c.pledges.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          ))}
        </div>
        <div class="card jcard ptable">
          <div class="ptab">
            <div class="plab" />
            {candidates.map((c) => <div key={c.id} class="plab nm">{c.name}</div>)}
            {criteria.map((cr, i) => (
              <Fragment key={cr}>
                <div class="plab">{short(cr)}</div>
                {candidates.map((c) => {
                  const v = grid[c.id][i];
                  return (
                    <div key={`${c.id}${i}`} class="step" role="group" aria-label={`${c.name} ${short(cr)}`}>
                      <button type="button" class="btn paper" aria-label={COPY.ui.scoreDown} disabled={!!answer || v === null || v <= 1} onClick={() => step(c.id, i, -1)}><span>−</span></button>
                      <output class="val" aria-label={v === null ? COPY.ui.scoreEmpty : `${v}${COPY.ui.point}`}>{v ?? '–'}</output>
                      <button type="button" class="btn paper" aria-label={COPY.ui.scoreUp} disabled={!!answer || v === 5} onClick={() => step(c.id, i, 1)}><span>+</span></button>
                    </div>
                  );
                })}
              </Fragment>
            ))}
            <div class="plab">{COPY.ui.total}</div>
            {candidates.map((c) => (
              <div key={c.id} class="psum"><b>{grid[c.id].some((v) => v !== null) ? sum(c.id) : '–'}</b>{COPY.ui.point}</div>
            ))}
            {answer ? (
              <Feedback
                placement="row"
                items={[{ ok, text: `${ok ? COPY.feedback.pledgeRight : COPY.feedback.pledgeWrong} ${candidates.map((c) => `${c.name} ${sum(c.id)}${COPY.ui.point}`).join(' · ')}` }]}
                onNext={() => onJudge(answer)}
              />
            ) : warn ? (
              <div class="fb row warn" role="alert">
                <ul class="fl"><li><img class="ic" src={ICON['stamp-cross']} alt="" /><span>{COPY.feedback['pledge.incomplete']}</span></li></ul>
              </div>
            ) : (
              <>
                <div class="plab">{`${filled} / ${candidates.length * criteria.length}`}</div>
                {candidates.map((c) => (
                  <button key={c.id} type="button" class="btn" aria-label={`${c.name}${COPY.ui.voteFor}`} aria-disabled={!complete} onClick={() => vote(c.id)}>
                    <span>{COPY.ui.vote}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </JudgeFrame>
  );
}
