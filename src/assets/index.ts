import type { BgId, PortraitAge, Face } from '../content/types';
import bg_1960_poll from './img/bg-1960-poll.webp';
import bg_1960_room from './img/bg-1960-room.webp';
import bg_1960_street from './img/bg-1960-street.webp';
import bg_1960s_factory from './img/bg-1960s-factory.webp';
import bg_1970_highway from './img/bg-1970-highway.webp';
import bg_1970s_apt from './img/bg-1970s-apt.webp';
import bg_1970s_hill from './img/bg-1970s-hill.webp';
import bg_1980_alley from './img/bg-1980-alley.webp';
import bg_1980_tv from './img/bg-1980-tv.webp';
import bg_1987_myeongdong from './img/bg-1987-myeongdong.webp';
import bg_1987_poll from './img/bg-1987-poll.webp';
import bg_title from './img/bg-title.webp';
import bg_today_street from './img/bg-today-street.webp';
import check_audit from './img/check-audit.webp';
import check_nullify from './img/check-nullify.webp';
import check_veto from './img/check-veto.webp';
import cmp_1_then from './img/cmp-1-then.webp';
import cmp_1_today from './img/cmp-1-today.webp';
import cmp_2_then from './img/cmp-2-then.webp';
import cmp_2_today from './img/cmp-2-today.webp';
import cmp_3_then from './img/cmp-3-then.webp';
import cmp_3_today from './img/cmp-3-today.webp';
import cmp_4_then from './img/cmp-4-then.webp';
import cmp_4_today from './img/cmp-4-today.webp';
import cmp_5_then from './img/cmp-5-then.webp';
import cmp_5_today from './img/cmp-5-today.webp';
import icon_arrow from './img/icon-arrow.webp';
import icon_assembly from './img/icon-assembly.webp';
import icon_ballot from './img/icon-ballot.webp';
import icon_ballotbox from './img/icon-ballotbox.webp';
import icon_camera from './img/icon-camera.webp';
import icon_gavel from './img/icon-gavel.webp';
import icon_hand from './img/icon-hand.webp';
import icon_house from './img/icon-house.webp';
import icon_letter from './img/icon-letter.webp';
import icon_lock from './img/icon-lock.webp';
import icon_magnifier from './img/icon-magnifier.webp';
import icon_newspaper from './img/icon-newspaper.webp';
import icon_pen from './img/icon-pen.webp';
import icon_radio from './img/icon-radio.webp';
import icon_stamp_cross from './img/icon-stamp-cross.webp';
import icon_stamp_ring from './img/icon-stamp-ring.webp';
import info_letter from './img/info-letter.webp';
import info_magazine from './img/info-magazine.webp';
import info_market from './img/info-market.webp';
import info_radio from './img/info-radio.webp';
import organ_audit from './img/organ-audit.webp';
import organ_ballotbox from './img/organ-ballotbox.webp';
import organ_budget from './img/organ-budget.webp';
import organ_cabinet from './img/organ-cabinet.webp';
import organ_hearing from './img/organ-hearing.webp';
import organ_law from './img/organ-law.webp';
import organ_ministries from './img/organ-ministries.webp';
import organ_threetier from './img/organ-threetier.webp';
import organ_trial from './img/organ-trial.webp';
import po_old_calm from './img/po-old-calm.webp';
import po_old_joy from './img/po-old-joy.webp';
import po_old_worry from './img/po-old-worry.webp';
import po_y10_calm from './img/po-y10-calm.webp';
import po_y10_joy from './img/po-y10-joy.webp';
import po_y10_worry from './img/po-y10-worry.webp';
import po_y20_calm from './img/po-y20-calm.webp';
import po_y20_joy from './img/po-y20-joy.webp';
import po_y20_worry from './img/po-y20-worry.webp';
import po_y30_calm from './img/po-y30-calm.webp';
import po_y30_joy from './img/po-y30-joy.webp';
import po_y30_worry from './img/po-y30-worry.webp';
import po_y37_calm from './img/po-y37-calm.webp';
import po_y37_joy from './img/po-y37-joy.webp';
import po_y37_worry from './img/po-y37-worry.webp';
import ui_btn_cloth from './img/ui-btn-cloth.webp';
import ui_btn_paper from './img/ui-btn-paper.webp';
import ui_card_locked from './img/ui-card-locked.webp';
import ui_card_pressed from './img/ui-card-pressed.webp';
import ui_card_raised from './img/ui-card-raised.webp';
import ui_dialog_panel from './img/ui-dialog-panel.webp';
import ui_note_pin from './img/ui-note-pin.webp';
import ui_portrait_frame from './img/ui-portrait-frame.webp';
import ui_tag_apricot from './img/ui-tag-apricot.webp';
import ui_topbar_strip from './img/ui-topbar-strip.webp';
import bgm1 from './bgm/bgm-1.ogg';
import bgm2 from './bgm/bgm-2.ogg';
import bgm3 from './bgm/bgm-3.ogg';
import bgm4 from './bgm/bgm-4.ogg';
import bgm5 from './bgm/bgm-5.ogg';

export const BG: Record<BgId, string> = {
  'title': bg_title,
  '1960-room': bg_1960_room,
  '1960-poll': bg_1960_poll,
  '1960-street': bg_1960_street,
  '1960s-factory': bg_1960s_factory,
  '1970s-hill': bg_1970s_hill,
  '1970-highway': bg_1970_highway,
  '1970s-apt': bg_1970s_apt,
  '1980-alley': bg_1980_alley,
  '1980-tv': bg_1980_tv,
  '1987-myeongdong': bg_1987_myeongdong,
  '1987-poll': bg_1987_poll,
  'today-street': bg_today_street,
};
export const PORTRAIT: Record<PortraitAge, Record<Face, string>> = {
  y10: { calm: po_y10_calm, joy: po_y10_joy, worry: po_y10_worry },
  y20: { calm: po_y20_calm, joy: po_y20_joy, worry: po_y20_worry },
  y30: { calm: po_y30_calm, joy: po_y30_joy, worry: po_y30_worry },
  y37: { calm: po_y37_calm, joy: po_y37_joy, worry: po_y37_worry },
  old: { calm: po_old_calm, joy: po_old_joy, worry: po_old_worry },
};
export const COMPARE: Record<1|2|3|4|5, { then: string; today: string }> = {
  1: { then: cmp_1_then, today: cmp_1_today },
  2: { then: cmp_2_then, today: cmp_2_today },
  3: { then: cmp_3_then, today: cmp_3_today },
  4: { then: cmp_4_then, today: cmp_4_today },
  5: { then: cmp_5_then, today: cmp_5_today },
};
export const INFO: Record<'radio'|'letter'|'magazine'|'market', string> = {
  radio: info_radio,
  letter: info_letter,
  magazine: info_magazine,
  market: info_market,
};
export const ORGAN: Record<string, string> = {
  'check-audit': check_audit,
  'check-nullify': check_nullify,
  'check-veto': check_veto,
  'organ-audit': organ_audit,
  'organ-ballotbox': organ_ballotbox,
  'organ-budget': organ_budget,
  'organ-cabinet': organ_cabinet,
  'organ-hearing': organ_hearing,
  'organ-law': organ_law,
  'organ-ministries': organ_ministries,
  'organ-threetier': organ_threetier,
  'organ-trial': organ_trial,
};
export const UI: Record<'card-raised'|'card-pressed'|'card-locked'|'btn-cloth'|'btn-paper'|'tag-apricot'|'dialog-panel'|'topbar-strip'|'portrait-frame'|'note-pin', string> = {
  'card-raised': ui_card_raised,
  'card-pressed': ui_card_pressed,
  'card-locked': ui_card_locked,
  'btn-cloth': ui_btn_cloth,
  'btn-paper': ui_btn_paper,
  'tag-apricot': ui_tag_apricot,
  'dialog-panel': ui_dialog_panel,
  'topbar-strip': ui_topbar_strip,
  'portrait-frame': ui_portrait_frame,
  'note-pin': ui_note_pin,
};
export const ICON: Record<string, string> = {
  'arrow': icon_arrow,
  'assembly': icon_assembly,
  'ballot': icon_ballot,
  'ballotbox': icon_ballotbox,
  'camera': icon_camera,
  'gavel': icon_gavel,
  'hand': icon_hand,
  'house': icon_house,
  'letter': icon_letter,
  'lock': icon_lock,
  'magnifier': icon_magnifier,
  'newspaper': icon_newspaper,
  'pen': icon_pen,
  'radio': icon_radio,
  'stamp-cross': icon_stamp_cross,
  'stamp-ring': icon_stamp_ring,
};
export const BGM: Record<1|2|3|4|5, string> = { 1: bgm1, 2: bgm2, 3: bgm3, 4: bgm4, 5: bgm5 };
