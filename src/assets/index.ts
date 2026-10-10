// T07 이 실제 import URL 로 교체한다. 그 전까지 모든 값은 ''.
export type BgId = 'title'|'1960-room'|'1960-poll'|'1960-street'|'1960s-factory'|'1970s-hill'|'1970-highway'|'1970s-apt'|'1980-alley'|'1980-tv'|'1987-myeongdong'|'1987-poll'|'today-street';
export type PortraitAge = 'y10' | 'y20' | 'y30' | 'y37' | 'old';
export type Face = 'calm' | 'joy' | 'worry';

const ages: PortraitAge[] = ['y10', 'y20', 'y30', 'y37', 'old'];
const faces: Face[] = ['calm', 'joy', 'worry'];
const bgs: BgId[] = ['title','1960-room','1960-poll','1960-street','1960s-factory','1970s-hill','1970-highway','1970s-apt','1980-alley','1980-tv','1987-myeongdong','1987-poll','today-street'];

export const BG = Object.fromEntries(bgs.map((k) => [k, ''])) as Record<BgId, string>;
export const PORTRAIT = Object.fromEntries(
  ages.map((a) => [a, Object.fromEntries(faces.map((f) => [f, '']))]),
) as Record<PortraitAge, Record<Face, string>>;
export const COMPARE: Record<1|2|3|4|5, { then: string; today: string }> = {
  1: { then: '', today: '' }, 2: { then: '', today: '' }, 3: { then: '', today: '' }, 4: { then: '', today: '' }, 5: { then: '', today: '' },
};
export const INFO: Record<'radio'|'letter'|'magazine'|'market', string> = { radio: '', letter: '', magazine: '', market: '' };
export const ORGAN: Record<string, string> = {};
export const UI: Record<'card-raised'|'card-pressed'|'card-locked'|'btn-cloth'|'btn-paper'|'tag-apricot'|'dialog-panel'|'topbar-strip'|'portrait-frame'|'note-pin', string> = {
  'card-raised': '', 'card-pressed': '', 'card-locked': '', 'btn-cloth': '', 'btn-paper': '', 'tag-apricot': '',
  'dialog-panel': '', 'topbar-strip': '', 'portrait-frame': '', 'note-pin': '',
};
export const ICON: Record<string, string> = {};
export const BGM: Record<1|2|3|4|5, string> = { 1: '', 2: '', 3: '', 4: '', 5: '' };
