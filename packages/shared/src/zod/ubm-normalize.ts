// members-search-filter-ux-and-api-fix / Lane B 真因A 根治
// Google Form 実回答ラベル → 英語 enum への正規化（純粋関数）。
// 不変条件 #1: 戻り値 enum は field.ts の zod 正本から z.infer で導出し二重定義しない。
//             マップは「選択肢ラベル ↔ enum」の対応に限定し、フォーム schema 全体は固定化しない。
// WEEKGRD-02: 例外を投げず、未知/空は null（安全側）を返す。

import type { z } from "zod";

import { UbmMembershipTypeZ, UbmZoneZ } from "./field";

export type UbmZone = z.infer<typeof UbmZoneZ>;
export type UbmMembershipType = z.infer<typeof UbmMembershipTypeZ>;

// 左辺 = Google Form 選択肢ラベル（実フォーム 01-design.md セクション2 / 設問7・8）。
// 矢印は U+2192（RIGHTWARDS ARROW）。
const UBM_ZONE_LABEL_MAP: Record<string, UbmZone> = {
  "0→1": "0_to_1",
  "1→10": "1_to_10",
  "10→100": "10_to_100",
};

const UBM_MEMBERSHIP_LABEL_MAP: Record<string, UbmMembershipType> = {
  会員: "member",
  非会員: "non_member",
  アカデミー生: "academy",
};

/**
 * UBM ゾーンの Google Form 生回答ラベルを enum に正規化する。
 * @param raw Google Form の生回答（前後空白は trim で吸収）
 * @returns enum 値。空文字 / null / undefined / マップ未ヒットは null。
 */
export function normalizeUbmZone(
  raw: string | null | undefined,
): UbmZone | null {
  const key = raw?.trim();
  if (!key) return null;
  return UBM_ZONE_LABEL_MAP[key] ?? null;
}

/**
 * UBM 参加ステータス（会員種別）の Google Form 生回答ラベルを enum に正規化する。
 * @param raw Google Form の生回答（前後空白は trim で吸収）
 * @returns enum 値。空文字 / null / undefined / マップ未ヒットは null。
 */
export function normalizeUbmMembershipType(
  raw: string | null | undefined,
): UbmMembershipType | null {
  const key = raw?.trim();
  if (!key) return null;
  return UBM_MEMBERSHIP_LABEL_MAP[key] ?? null;
}
