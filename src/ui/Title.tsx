import { BG } from '../assets';
import { COPY } from '../content/copy';

export function Title({ resumeChapter, onStart, onResume }: {
  resumeChapter: number | null;
  onStart: () => void;
  onResume: () => void;
}) {
  return (
    <>
      <img class="art title-art" src={BG.title} alt="" />
      <img class="art title-sepia" src={BG.title} alt="" />
      <div class="title-box">
        <h1>{COPY.ui.title}</h1>
        <div class="title-btns">
          {resumeChapter !== null ? (
            <button type="button" class="btn" onClick={onResume}>
              <span>{COPY.ui.resume} ({resumeChapter === 5 ? COPY.ui.epilogue : COPY.ui.chapterN(resumeChapter)})</span>
            </button>
          ) : null}
          <button type="button" class="btn" onClick={onStart}><span>{COPY.ui.start}</span></button>
        </div>
      </div>
    </>
  );
}
