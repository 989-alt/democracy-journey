---
name: 민주주의의 여정
description: 초등 6학년 사회 민주주의 스토리텔링 게임 — 세피아에서 컬러로 번지는 손그림 수채 회고록, Sol 생성 종이·천·수채 UI 아트 킷
colors:
  page: "#E9DFCF"
  background: "#F2E8DC"
  foreground: "#2B2B2B"
  card: "#FBF6EE"
  popover: "#FFFDF8"
  primary: "#8C7355"
  secondary: "#E8B887"
  muted: "#E4D7C4"
  muted-foreground: "#5C5248"
  accent: "#C9A27A"
  destructive: "#A9402F"
  border: "#B9A58A"
  stat-join: "#B9573B"
  stat-info: "#3F6F8E"
  stat-home: "#6E7F3A"
  judge-correct: "#4F7A4B"
  judge-wrong: "#A9402F"
  judge-locked: "#CFC3B1"
  trust-low: "#A9402F"
  trust-mid: "#C99A2E"
  trust-high: "#4F7A4B"
typography:
  display:
    fontFamily: "Gowun Batang, serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.25
  chapter:
    fontFamily: "Gowun Batang, serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "Gowun Dodum, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Gowun Dodum, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1
  hand:
    fontFamily: "Nanum Pen Script, cursive"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  sm: "8px"
  md: "14px"
  lg: "22px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
components:
  choice-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    minHeight: "112px"
  dialog-panel:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.card}"
    typography: "{typography.chapter}"
    height: "56px"
  button-paper:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    height: "48px"
  gauge-cell:
    backgroundColor: "{colors.muted}"
    size: "22px × 14px"
  portrait-frame:
    backgroundColor: "{colors.muted}"
    width: "240px"
    height: "300px"
---

# Design System: 민주주의의 여정

정본: 토큰 값은 `docs/democracy-journey/tokens.json`(`themes.watercolor`, 2026-10-10 1차 게이트 확정), UI 모양은 `시안/democracy-journey/ui/kit/*.png`(Sol 생성·마젠타 키잉), 배치 수치는 2차 게이트에서 확정된 `시안/democracy-journey/2-수채-B무대아래카드.html`. 세 곳이 어긋나면 **승인된 시안 HTML 의 수치**가 이긴다.

## Overview

**Creative North Star: "세피아에서 색이 번지는 수채 회고록"**

한 사람이 평생 그려 온 수채 스케치북을 펼친 화면이다. 장면은 콜드프레스 종이 위 수채·과슈에 세피아 잉크 선, 초상은 스케치북 창 안에, 대사는 가장자리가 번진 종이 패널에, 선택지는 잉크 테두리 종이 카드에 놓인다. 1장(1960)은 채도 .12 의 세피아 근처에서 시작해 장이 끝날 때마다 색이 번져 에필로그에서 풀컬러가 된다. UI 는 같은 스케치북의 물건 — **종이·천 띠·잉크 선·수채 번짐** — 이라 그림과 겹쳐도 어색하지 않다. 글자는 전부 UI 층(DOM)에만 있다.

밀도는 "6학년이 태블릿으로 혼자 읽고, 전자칠판에서도 읽힌다"로 잡는다. 한 화면에 결정 하나. 대사 20px 이상, 장 라벨 24px, 손글씨는 메모·회상 컷에만. 세피아는 차분하지만 글자 대비는 잉크(#2B2B2B) 대 종이(#FBF6EE) 로 12:1 이상.

**색의 서사**: `--sat-step` 0(1장)→1→2→3→4(에필로그). 배경·초상에만 `filter: saturate()`. "그때와 오늘" 비교 카드와 UI 크롬은 항상 풀컬러 — 오늘의 제도는 오늘의 색으로 본다.

확정된 거부(사용자 규칙 2026-10-10): CSS 사각형·SVG·이모지로 그린 UI, 그림 안의 글자·실존 인물·국기, 카드 속 카드, 밝은 파스텔 토이 UI(world-trade 의 그림체), 애니 셀·사진 콜라주(탈락 컨셉), 총·시신·고문 묘사, 설명 문장·힌트.

**Key Characteristics:**
- UI 는 전부 **Sol 생성 스프라이트**: 대사 패널·상단 띠·초상 창·카드·버튼은 9-slice, 아이콘·태그·핀 메모는 이미지. CSS 로 그리는 것은 게이지 칸·포커스 링·채도 필터뿐
- 액센트 하나: `accent`(#C9A27A 수채 황토) = 지금 할 일(유도 화살표·활성 버튼). 수치 3색(참여 녹슨 빨강·정보 먼지 파랑·살림 이끼 초록)은 항상 아이콘·글자와 함께
- 모션은 셋뿐: 유도 화살표 bob(3초 무입력 뒤), 색 번짐 전환(장 끝 1.5초, saturate 보간), 카드 눌림(pressed 스프라이트 교체 0.1초). `prefers-reduced-motion` 에서 앞 둘 정지

## Colors

바랜 종이 위에 세피아 잉크와 수채. 채도는 그림이 올리고 UI 는 종이·잉크·황토로 가라앉힌다.

### Primary
- **Sepia Brown `primary`** (#8C7355): 주 버튼 천 띠, 장 라벨 밑줄, 링. "이 책의 잉크".
- **Ink `foreground`** (#2B2B2B): 모든 글자·선. 종이 위에서 UI 를 떼어 놓는 선.

### Secondary
- **Watercolor Ochre `accent`** (#C9A27A): 유도 화살표, 활성 버튼 테두리, 현재 장 표시. 화면에 하나.
- **Apricot `secondary`** (#E8B887): 카드 모서리 번짐, 태그 종이, 비교 카드 "오늘" 쪽 띠.

### Neutral
- **Page** (#E9DFCF) 무대 밖 책상 / **Background** (#F2E8DC) 무대 바탕 / **Card** (#FBF6EE) 선택지 카드 / **Popover** (#FFFDF8) 대사 패널 / **Muted** (#E4D7C4) 게이지 트랙·초상 창 바탕 / **Muted Foreground** (#5C5248) 보조 글자 / **Border** (#B9A58A) 잉크 테두리 연한 쪽.

### Status
- **stat.join / info / home** (#B9573B / #3F6F8E / #6E7F3A): 참여(손)·정보(돋보기)·살림(집) 게이지와 카드 모서리 태그. 색만으로 나누지 않는다 — 아이콘 + 글자 동반.
- **judge.correct / wrong** (#4F7A4B / #A9402F): 판별 피드백. 항상 도장 아이콘(원 / 가위표)과 함께. **judge.locked** (#CFC3B1): 잠긴 카드 — `card-locked.png` 스프라이트 + 자물쇠 아이콘 + "정보 2칸 필요" 글자.
- **trust.low / mid / high** (#A9402F / #C99A2E / #4F7A4B): 판별③ 신뢰도. 글자 '낮음·중간·높음' 동반.
- `destructive` 는 "처음부터 다시" 한 곳에만.

## Typography

- **Gowun Batang** — 장 라벨(24)·화면 제목(30)·판별 제목(30)·버튼 글자(20~24). 명조의 결이 바랜 종이와 맞고 교과서 본문 서체와 한 결.
- **Gowun Dodum** — 대사·카드 본문(20)·보조 라벨(16). 둥근 고딕이라 아이 가독성.
- **Nanum Pen Script** — 손글씨(28): 회상 컷 메모, 결과 화면 연표 메모, 저장 토스트. **본문·카드·버튼에 쓰지 않는다.**
- 글자 세로 배치는 9-slice 면 중심에 절대 배치(`line-height:1`, `translateY(-50%)`). 면 중심 y 는 킷 측정값으로(`2-수채-kit.css` 의 `.btn>span`·`.dialog .who`).
- 글자는 그림에 넣지 않는다. 글자가 박힌 생성 그림은 폐기한다. 폰트는 03 에서 self-host(woff2 서브셋 인라인).

## Layout

- 스테이지 1024×768. 바깥은 Page, 안쪽은 장면 그림이 꽉 찬다(`object-fit: cover`, `filter: saturate(var(--sat-step))`).
- 장면 화면(S2) — **2차 게이트 확정: B 무대 아래 카드**(`시안/democracy-journey/2-수채-B무대아래카드.html`, 2026-10-10). 상단 띠(좌 20·우 20·상 16, 장 라벨 24px + 게이지 3줄) / 그림 / 초상 창 240×290(좌 20, 하 214) / 대사 패널(좌 300·우 20·하 214, 화자 이름표는 좌상 모서리 조각) / 선택지 카드 3장 가로(좌우 20·하 20, 간격 16, 최소 높이 150). 탈락 변주 A(왼쪽 세로 띠)·C(오른쪽 세로 카드 열)는 파일만 남긴다.
- 9-slice 수치(정본 `시안/democracy-journey/2-수채-kit.css`): 카드 slice 70 / 35px round, 판별 화면 카드 28px · 천 버튼 slice 95 / 28px(높이 56) · 종이 버튼 slice 90 / 24px(높이 48, 신뢰도 44) · 대사 패널 slice 90 90 80 360 / 45 45 40 180 · 상단 띠 slice 40 / 20px · 초상 창 slice 75 / 26px. 태그·핀 메모·아이콘은 img.
- 판별③ 정보 카드(S3-3): 카드 2×2 + 오른쪽 기준 패널 300px. 다른 판별 화면도 같은 격자(카드 격자 + 오른쪽 규칙 패널)를 따른다.
- 비교 카드(S3-c): 좌 "그때"(세피아) · 우 "오늘"(풀컬러) 2단, 가운데 잉크 선. 탭 1회.
- 그리드 8px. 히트박스 48px 이상(`size.tap-min`). 카드 최소 높이 112px.

## Elevation & Depth

깊이는 스프라이트가 가진다(종이 들뜸·잉크 바닥 그림자·천 두께). CSS 섀도는 `drop-shadow` 하나(카드 0 4px 14px, 대사 패널 0 4px 8px). 블러 글래스·그라디언트 UI 없음. 상단 띠는 종이 스프라이트이지 반투명 바가 아니다.

## Shapes

종이와 잉크 선. 카드·버튼 모서리는 스프라이트 그대로(둥근 종이 8~22px), 대사 패널은 번진 가장자리, 초상 창은 수채 붓 자국 테두리, 태그는 구멍 뚫린 종이표, 도장은 고르지 않은 잉크 원·가위표. 아이콘은 **수채 소품** 16종(손·돋보기·집·자물쇠·라디오·편지·신문·사진기·투표함·투표지·법봉·의사당·동그라미 도장·가위표 도장·화살표·펜과 잉크병).

## Components (아트 킷 `시안/democracy-journey/ui/kit/` 26조각, slice 수치는 `2-수채-kit.css`)

| 컴포넌트 | 파일 | 쓰는 법 |
| --- | --- | --- |
| 선택지 카드 | `card-raised.png` / `card-pressed.png` / `card-locked.png` | 9-slice. 본문 20px, 좌상 번호(label), 우하 수치 태그(아이콘 + 글자). 눌림은 pressed 교체, 잠김은 locked + `icon-lock` |
| 주 버튼 | `btn-cloth.png` | 9-slice 천 띠, 글자 Card 색 20~24px 면 중심 절대 배치. "판단 끝내기", "다음" |
| 종이 버튼 | `btn-paper.png` | 9-slice, 신뢰도 3단계·보조 동작. 선택 시 테두리 `accent` 2px |
| 태그 | `tag-apricot.png` | 카드 수치 태그·"다시 보기" 표시. 글자 16px |
| 대사 패널 | `dialog-panel.png` | 9-slice, 좌상 이름표 자리에 화자(label), 본문 20px 2~3문장 |
| 상단 띠 | `topbar-strip.png` | 9-slice 가로 띠, 장 라벨(chapter) + 게이지 3줄 |
| 초상 창 | `portrait-frame.png` | 9-slice 수채 테두리, 안에 초상 `object-fit: cover`, 초상에 `--sat-step` 적용 |
| 핀 메모 | `note-pin.png` | 저장 토스트·회상 메모. 손글씨 28px |
| 아이콘 | `icon-*.png` 16종 | 게이지 22px / 카드 태그 20px / 판별 자료 40px / 결과 연표 32px |
| 게이지 칸·포커스 링·채도 필터 | CSS | Muted 트랙 + stat 색 칸(2px 잉크 테두리), 3px `ring` 포커스 |

## Do's and Don'ts

- Do: 글자는 면 중심에 절대 배치하고 렌더를 측정한다. 결정은 화면당 하나. 판별은 기준으로 판단하게 한다(출처 종류 라벨에 정답 힌트 없음). 비교 카드만 풀컬러.
- Don't: CSS·SVG 로 UI 그리기, 그림에 글자, 1~3장 배경에 풀컬러, 선택을 평가하는 문구, 파스텔 토이·애니 셀·사진 콜라주, 카드 속 카드, 힌트·안내문.

## 레퍼런스 (하네스 02-3 필수 3요소)

| 출처 | 왜 골랐나 | 어디를 차용 | **어디는 따르면 안 되나** |
| --- | --- | --- | --- |
| Sol 생성 UI 아트 킷(자체, `시안/democracy-journey/ui/`) | UI 의 유일한 출처. 외부 UI 팩·아이콘 폰트·SVG 를 섞지 않는다(사용자 규칙) | `ui/kit/*` 전부, 1차 시안 프롬프트의 스타일 블록(수채·과슈·세피아 잉크 선·콜드프레스 종이) | 시트에서 겹쳐 잘린 조각은 쓰지 않는다. 글자·국기·실존 인물이 박힌 결과는 폐기. 마젠타 잔선은 디스필 뒤 재검수 |
| grandma-album(`docs/grandma-album/DESIGN.md`) | 같은 하네스·같은 날의 **생산 방식** 선례: Sol 시트 → 키잉 → 9-slice, 글자 면 중심 측정 | 9-slice `border-image` 수치화 절차, 킷 CSS 파일 분리(`2-<컨셉>-kit.css`), 글자 절대 배치·측정 | 등잔·가죽·황동·밤색 방의 재질 언어, 세피아 고정(이 게임은 색이 번진다), 사진첩 격자·뒷면 문항 형식 — 가져오지 않는다 |
| world-trade(`docs/world-trade/DESIGN.md`) | 화면당 결정 하나·힌트 없음·HUD 수치 비노출의 사용자 규칙 출처 | 그 세 규칙과 폰트 self-host 절차 | 그림체(캐주얼 3D·클레이), 크림 토이 플라스틱·파스텔, Jua 서체 — 전부 따르지 않는다(사용자 2026-10-10 "그림체를 따라하라는 건 아니야") |
| ui.shadcn.com | 시멘틱 토큰 **이름** 구조만 | `background/foreground/card/popover/primary/secondary/muted/accent/destructive/border/input/ring` 이름과 `*-foreground` 짝 | 회색 중립 팔레트·1px 테두리·블러 섀도·0.5rem radius·CSS 버튼 모양 전부 따르지 않는다 |
| 교과서 6-1 사회 p.106 "정보 판단 기준 4개" | 판별③ 체크 항목의 출처 | 기준 4개 문장 그대로, 신뢰도 3단계 | 교과서의 레이아웃·색·아이콘은 가져오지 않는다. 문장만 |

aceternity·magicui·reactbits·originui·AntV 는 쓰지 않는다. 모션 셋(화살표·색 번짐·눌림)은 CSS 키프레임·filter 보간이라 모션 라이브러리가 필요 없다.
