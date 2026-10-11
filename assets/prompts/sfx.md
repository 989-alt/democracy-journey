# 효과음 (Suno Generate sounds — kie.ai `ai-music-api/sounds`, model V6, sound_loop false)

요청당 2개가 나오고, 소리가 시작되는 지점부터 잘라 0.005초 페이드 인·끝 35% 페이드 아웃, 피크 −3dB 정규화, 모노 44.1kHz libvorbis q3 로 `src/assets/sfx/*.ogg` 를 만들었다. 원본 mp3 는 `assets/sfx/`.

| 파일 | 원본 | 자른 구간 | 프롬프트 |
| --- | --- | --- | --- |
| sfx-tap | sfx-tap.mp3 | 0.06s~0.41s | A single crisp paper card being flipped and set down on a wooden desk, one short dry tap, no music, no reverb |
| sfx-correct | sfx-correct.alt1.mp3 | 0.05s~1.25s | A gentle bright two-note wooden marimba chime for a correct answer in a children's game, warm and soft, single short sound, no melody after |
| sfx-wrong | sfx-wrong.mp3 | 0.08s~0.58s | A soft low muted wooden thunk for a wrong answer in a children's game, gentle not harsh, single short sound |
| sfx-save | sfx-save.alt1.mp3 | 0.10s~0.60s | A rubber ink stamp pressed once onto paper, soft thud with a light paper rustle, single short sound |
| sfx-bleed | sfx-bleed.mp3 | 0.22s~2.22s | A soft shimmering watercolor wash sound, airy rising glissando of light chimes and a gentle brush stroke, about two seconds, calm |
