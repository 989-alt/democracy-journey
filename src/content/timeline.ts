import type { TimelineEvent } from './types';

// 고정 사건 연표(결과 화면 인생 연표). 같은 해는 일어난 순서.
// 교과분석에 있는 사건만 쓴다. '오늘' 은 연도가 없다(year 생략, 맨 끝).
export const timeline: TimelineEvent[] = [
  { year: 1960, label: '3·15 부정 선거', chapter: 1 },
  { year: 1960, label: '김주열 학생 발견', chapter: 1 },
  { year: 1960, label: '4·19 혁명', chapter: 1 },
  { year: 1960, label: '이승만 대통령 하야', chapter: 1 },
  { year: 1961, label: '5·16 군사 정변', chapter: 2 },
  { year: 1970, label: '경부 고속 국도 개통', chapter: 2 },
  { year: 1980, label: '5·18 민주화 운동', chapter: 3 },
  { year: 1987, label: '6월 민주 항쟁', chapter: 4 },
  { year: 1987, label: '대통령 직접 선거 (12월)', chapter: 4 },
  { label: '오늘', chapter: 5 },
];
