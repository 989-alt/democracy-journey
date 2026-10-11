// 디버그 훅. ?debug 또는 dev 에서만 main.tsx 가 동적 import 한다.
// 앱 상태는 app.tsx 안에 있어 직접 못 읽는다 → 판별·장 끝에 저장되는 localStorage 저장본을 읽는다.
import { CONTENT, sceneOrder } from './content';
import { load } from './engine/save';
import { verdict } from './engine/verdict';

const dj = {
  getState: () => load(),
  getLog: () => load()?.log ?? [],
  verdict: () => verdict(load()?.log ?? []),
  CONTENT,
  sceneOrder,
};
// singlefile 빌드는 동적 import 를 본문에 인라인해 이 모듈이 항상 실행된다 → 여기서도 같은 가드를 건다.
if (import.meta.env.DEV || location.search.includes('debug')) (window as unknown as { __dj: typeof dj }).__dj = dj;
