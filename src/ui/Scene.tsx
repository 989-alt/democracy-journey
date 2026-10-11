import { BG } from '../assets';
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

export function Scene({ scene, state, face, picked, onChoose, onConfirm }: {
  scene: SceneT;
  state: State;
  face: Face;
  picked: string | null;
  onChoose: (optionId: string) => void;
  onConfirm: () => void;
}) {
  const why = scene.culture?.why;
  const idx = scene.options.findIndex((o) => o.id === picked);
  const note = picked && why ? (why[idx] ?? why[0]) : null;
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
      <div class="dialog">
        {scene.speaker ? <div class="who">{scene.speaker}</div> : null}
        <p>{renderText(scene.text, state.flags)}</p>
      </div>
      <div class="cards">
        {scene.options.map((o, i) => (
          <Card key={o.id} n={i + 1} option={o} locked={isLocked(o, state.stats)} mark={note ? (o.id === picked ? 'picked' : 'dim') : undefined} onPick={() => onChoose(o.id)}>
            {i === 0 ? <Hint key={scene.id} /> : null}
          </Card>
        ))}
      </div>
      {note ? (
        <div class="culture-pick">
          <div class="note">
            <span>{note}</span>
            <button type="button" class="btn" onClick={onConfirm}><span>{COPY.ui.next}</span></button>
          </div>
        </div>
      ) : null}
    </>
  );
}
