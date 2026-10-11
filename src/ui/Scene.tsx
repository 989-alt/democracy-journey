import { BG, ICON } from '../assets';
import { COPY } from '../content/copy';
import { isLocked } from '../engine/state';
import type { State } from '../engine/state';
import type { Face, Scene as SceneT } from '../content/types';
import { Card } from './Card';
import { Gauge } from './Gauge';
import { Hint } from './Hint';
import { Portrait } from './Portrait';

// '{{flag:x|문장}}' → 플래그가 켜져 있으면 문장, 아니면 빈 문자열
export function renderText(text: string[], flags: string[]): string {
  return text
    .map((s) => s.replace(/\{\{flag:([^|}]+)\|([^}]*)\}\}/g, (_m, f: string, v: string) => (flags.includes(f) ? v : '')).replace(/\{\{[^}]*\}\}/g, '').replace(/ {2,}/g, ' ').trim())
    .filter(Boolean)
    .join(' ');
}

// 선택 직후 메모(R28·R31). 대사 패널 자리를 메모로 바꿔 카드를 가리지 않는다.
//  culture: 맞음/틀림 도장 + '정답: <정답 라벨>' + 까닭(why)
//  story 오개념 선택지: 사실 교정 문구(COPY.feedback[M])만 — 도장·수치·칭찬 없음
export interface Memo { stamp?: boolean; head?: string; text: string }
export function memoFor(scene: SceneT, picked: string | null): Memo | null {
  if (!picked) return null;
  if (scene.kind === 'culture' && scene.culture) {
    const answer = scene.options.find((o) => o.id === scene.culture!.answer);
    return { stamp: picked === scene.culture.answer, head: `${COPY.ui.answerIs} ${answer?.label ?? ''}`, text: scene.culture.why.join(' ') };
  }
  const m = scene.options.find((o) => o.id === picked)?.misconception;
  return m && COPY.feedback[m] ? { text: COPY.feedback[m] } : null;
}

export function Scene({ scene, state, face, picked, onChoose, onConfirm }: {
  scene: SceneT;
  state: State;
  face: Face;
  picked: string | null;
  onChoose: (optionId: string) => void;
  onConfirm: () => void;
}) {
  const memo = memoFor(scene, picked);
  const culture = scene.kind === 'culture';
  return (
    <>
      <img class="art" src={BG[scene.bg]} alt="" />
      <header class="topbar">
        <span class="chapter">{COPY.ui.chapterTitles[scene.chapter - 1]}</span>
        <span class="sp" />
        <Gauge stat="join" value={state.stats.join} />
        <Gauge stat="info" value={state.stats.info} />
        <Gauge stat="home" value={state.stats.home} />
      </header>
      <Portrait age={scene.portrait} face={face} />
      {memo ? (
        <div class="dialog memo" role="status">
          {scene.speaker ? <div class="who">{scene.speaker}</div> : null}
          <div class="mm">
            {memo.stamp !== undefined ? (
              <img class="stamp" src={ICON[memo.stamp ? 'stamp-ring' : 'stamp-cross']} alt={memo.stamp ? COPY.ui.right : COPY.ui.wrong} />
            ) : null}
            <p>{memo.head ? <b>{memo.head}</b> : null}{memo.text}</p>
          </div>
          <button type="button" class="btn" data-primary onClick={onConfirm}><span>{COPY.ui.next}</span></button>
        </div>
      ) : (
        <div class="dialog">
          {scene.speaker ? <div class="who">{scene.speaker}</div> : null}
          <p>{renderText(scene.text, state.flags)}</p>
        </div>
      )}
      <div class="cards">
        {scene.options.map((o, i) => (
          <Card key={o.id} n={i + 1} option={o} locked={isLocked(o, state.stats)} hideStat={culture} mark={picked ? (o.id === picked ? 'picked' : 'dim') : undefined} onPick={() => onChoose(o.id)}>
            {i === 0 ? <Hint key={scene.id} /> : null}
          </Card>
        ))}
      </div>
    </>
  );
}
