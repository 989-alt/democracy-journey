import { ICON } from '../assets';
import { COPY } from '../content/copy';
import type { Chapter, TimelineEvent } from '../content/types';
import { chapterTitle, CHAPTERS } from '../engine/summary';

// 인생 연표: 사건은 CONTENT.timeline 고정 순서, 선택 메모는 장마다 손글씨 메모(평가 없음).
// 같은 해가 이어지면 연도 태그는 한 번만 붙인다.
export function Timeline({ events, memos }: { events: TimelineEvent[]; memos: Record<Chapter, string[]> }) {
  return (
    <section class="tl" aria-label={COPY.ui.timeline} tabIndex={0}>
      <ol class="tl-row">
        {CHAPTERS.map((c) => {
          const evs = events.filter((e) => e.chapter === c);
          return (
            <li class="tl-col" key={c}>
              <h3><img class="ic" src={ICON.pen} alt="" /><span>{chapterTitle(c)}</span></h3>
              <ul class="tl-ev">
                {evs.map((e, i) => (
                  <li key={e.label}>
                    {i === 0 || evs[i - 1].year !== e.year ? <span class="yr"><span>{e.year ?? COPY.ui.timelineToday}</span></span> : null}
                    <span class="lb">{e.year === undefined ? COPY.ui.timelineNow : e.label}</span>
                  </li>
                ))}
              </ul>
              {memos[c].length > 0 ? (
                <ul class="tl-memo">
                  {memos[c].map((m) => <li key={m}>{m}</li>)}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p class="cite">{COPY.ui.sourceBook}</p>
    </section>
  );
}
