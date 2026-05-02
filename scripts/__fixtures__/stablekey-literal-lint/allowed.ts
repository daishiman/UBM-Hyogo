// Phase 6 許可 fixture: 正本モジュールから import する正しい方式。
import { FieldByStableKeyZ, STABLE_KEY_LIST } from "@ubm-hyogo/shared";

export const ok = {
  schema: FieldByStableKeyZ,
  list: STABLE_KEY_LIST,
};
