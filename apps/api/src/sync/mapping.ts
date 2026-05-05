// u-04: Phase 6-8 では既存 jobs/mappers/sheets-to-members.ts を re-export し、
// Phase 9 で物理移動する。consent 正規化 / unmapped 退避ロジックは契約と一致する。

export {
  mapSheetRows,
  type MemberRow,
  type MapResult,
} from "../jobs/mappers/sheets-to-members";
