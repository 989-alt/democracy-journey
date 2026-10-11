import { useEffect } from 'preact/hooks';
import { BG } from '../assets';
import type { Scene } from '../content/types';

export function ChapterTitle({ scene, onDone }: { scene: Scene; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [scene.id]);
  return (
    <>
      <img class="art" src={BG[scene.bg]} alt="" />
      <div class="chtitle" role="heading" aria-level={1}>
        <h1>{scene.text[0]}</h1>
        {scene.text[1] ? <p>{scene.text[1]}</p> : null}
      </div>
    </>
  );
}
