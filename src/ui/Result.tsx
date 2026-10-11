import { useEffect, useRef, useState } from 'preact/hooks';
import { BG, ICON, PORTRAIT } from '../assets';
import { sfx } from '../audio/audio';
import { COPY } from '../content/copy';
import type { PortraitAge } from '../content/types';
import { clearAndReset, summarize } from '../engine/summary';
import type { Action, State } from '../engine/state';
import { Timeline } from './Timeline';
import './result.css';

const AGES: PortraitAge[] = ['y10', 'y20', 'y30', 'y37', 'old'];
const AGE_LABEL: Record<PortraitAge, string> = { y10: '10살', y20: '20살', y30: '30살', y37: '37살', old: '어르신' };
const KIND_LABEL = { poll: '투표소 그림', appeal: '호소처', source: '정보 카드', pledge: '공약 채점', organ: '기관 카드' } as const;

export function Result({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const s = summarize(state);
  const [open, setOpen] = useState(false);
  const [habit, setHabit] = useState<number | null>(null); // 세션 한정, 저장하지 않는다
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) closeRef.current?.focus(); }, [open]);
  const minutes = Math.max(1, Math.round(s.playMs / 60000));

  return (
    <>
      <img class="art" src={BG['today-street']} alt="" style={{ filter: 'none' }} />
      <ol class="life" aria-label="나의 인생 사진첩">
        {AGES.map((a) => (
          <li key={a} class="portrait-s"><img src={PORTRAIT[a].calm} alt={`${AGE_LABEL[a]}의 나`} /></li>
        ))}
      </ol>
      
      <p class="pin" role="status">
          <span>{habit === null ? '습관 다짐을 하나 골라 보세요' : COPY.habits[habit]}</span>
        </p>

      <div class="card box sum">
        <h1 class="sr">나의 이야기</h1>
        <ul class="stats">
          <li><img class="ic" src={ICON.pen} alt="" /><span>플레이 시간</span><b>{minutes}분</b></li>
          <li><img class="ic" src={ICON.house} alt="" /><span>도달 지점</span><b>{s.reachedChapter === '완주' ? '완주' : COPY.ui.chapterTitles[s.reachedChapter - 1].split(' · ')[0]}</b></li>
          <li><img class="ic" src={ICON.ballot} alt="" /><span>{COPY.ui.judgeScore}</span><b>{s.judged.correct} / {s.judged.total}</b></li>
        </ul>
        <div class="acts">
          <button type="button" class="btn paper" aria-expanded={open} aria-controls="wrong-list" onClick={() => { sfx('tap'); setOpen(!open); }}>
            <span>{COPY.ui.reviewWrong}</span>
          </button>
          <button type="button" class="btn" onClick={() => { sfx('tap'); clearAndReset(dispatch); }}>
            <span>{COPY.ui.restart}</span>
          </button>
        </div>
      </div>

      <div class="card box habits">
        <h2><img class="ic" src={ICON.hand} alt="" />습관 다짐</h2>
        <ul>
          {COPY.habits.map((h, i) => (
            <li key={h}>
              <button type="button" class="btn paper" aria-pressed={habit === i} onClick={() => { sfx('tap'); setHabit(habit === i ? null : i); }}>
                <span>{habit === i ? '✓ ' : ''}{h}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {open ? (
        <div class="card box wrong" id="wrong-list" role="region" aria-label={COPY.ui.reviewWrong}>
          <h2>{COPY.ui.reviewWrong}</h2>
          <button type="button" class="btn paper" ref={closeRef} onClick={() => setOpen(false)}><span>{COPY.ui.close}</span></button>
          {s.wrongItems.length === 0 ? (
            <p class="none"><img class="ic" src={ICON['stamp-ring']} alt="" />{COPY.ui.allRight}</p>
          ) : (
            <ul class="wl">
              {s.wrongItems.map((w) => (
                <li key={`${w.kind}|${w.item}`}>
                  <img class="ic" src={ICON['stamp-cross']} alt={COPY.ui.wrong} />
                  <span><b>{KIND_LABEL[w.kind]}</b> {w.question}</span>
                  <span class="ans"><img class="ic" src={ICON['stamp-ring']} alt="" /><b>{COPY.ui.answerLabel}</b> {w.answer}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <Timeline events={s.timeline} memos={s.memos} />
    </>
  );
}
