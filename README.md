# 민주주의의 여정

초등 6학년 사회(6-1) 「민주화와 산업화」·「민주주의와 시민 참여」 복습용 스토리텔링 게임. 1950년생 한 사람이 1960년 봄부터 오늘까지를 살며, 장마다 그 시대 보통 사람이 해야 했던 판단(선거 원칙 위반 찾기, 호소처, 정보 신뢰도, 공약 채점, 권력 분립)을 한다.

- 결과물: `dist/index.html` 한 파일(약 7.5MB). 서버·네트워크·로그인 없음, `file://` 로 열림. 저장은 브라우저 localStorage.
- 기준 화면: 태블릿 가로 1024×768.

## 실행

```bash
npm ci
npm run dev        # 개발 서버
npm run build      # dist/index.html 단일 파일
npm test           # 단위 테스트 (vitest)
npm run e2e        # 시드 완주 e2e (playwright)
```

## 폴더

| 경로 | 내용 |
| --- | --- |
| `src/content` | 장면·판별·비교 카드·연표·문구 |
| `src/engine` | 리듀서·판별 채점·판정식 S1~S10·저장 |
| `src/ui` | 장면·판별·결과 화면 (Preact) |
| `src/assets` | 빌드에 들어가는 webp·ogg·woff2 와 변환 스크립트 `convert.mjs` |
| `assets` | 원본 그림(PNG)·배경음악(mp3)·UI 킷·생성 프롬프트 |
| `docs` | PRD·DESIGN·PRODUCT·토큰·에셋 목록·인터페이스 |

원본 그림을 바꾸면 `node src/assets/convert.mjs` 로 webp 를 다시 만든다.

## 출처

교과 내용은 사회 6-1 교과서·지도서를 바탕으로 했다. 그림은 GPT-image(Sol), 배경음악은 Suno(kie.ai, V6, 연주곡)로 생성했다. 효과음은 Web Audio 로 합성한다. 서체는 Gowun Batang·Gowun Dodum·Nanum Pen Script(SIL OFL).
