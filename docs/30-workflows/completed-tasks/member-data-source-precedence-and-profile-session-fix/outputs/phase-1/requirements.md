---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 1
artifact: requirements
status: completed
updated: 2026-06-09
---

# Phase 1 outputs — requirements（要約）

正本は `../../phase-1-requirements.md`。本ファイルはその要約コピー。

## 実装区分 / 分類
- `implementation_spec`（全 Lane code change・docs-only ではない）
- `visual_category: VISUAL`（Lane D のみ実 UI 変更。A/B/C/E は NON_VISUAL）
- `implementation_mode: new`（current branch に実装なし）

## Lane（単一責務）
- A データモデル基盤（`member_field_overrides` 新設 + `member_identities` provenance 列）
- B 取込是正（RC-1 ラベル/構造 + RC-2 consent + L3 import-once + Form mapper label）
- C 表示プレシデンス純関数 + admin override 書込 API（`PUT /admin/member-fields/:id`）
- D Web UI（admin field editor + 公開/会員表示の merged projection 確認）
- E /profile セッションエラー修正（RC-3）

## 受入条件
AC-1..AC-9（正本 §2）。要点: AC-1 は「ラベル一致 + `response_fields` への書込経路新設」を含む（現行 Sheets は response_fields に書いていない）。AC-7 の H-1（resolver 500化）は否定（resolver/sessionGuard は member 不在で 401）。

## 🔴 SSOT 訂正注記（実コード裏取り）
1. **RC-1 はさらに深い**: `member_responses` に `full_name`/`ubm_zone` 等の列が DDL に存在せず、`sync-sheets-to-d1.ts` の `UPSERT_COLUMNS` は存在しない列へ INSERT → Sheets 同期は SQL レベルで全失敗。さらに表示は `response_fields` を読むが Sheets 経路は response_fields に書かない。
2. **RC-3 H-1 誤り**: `me-session-resolver.ts`/`session-guard.ts` は member 不在で 401（500 ではない）。500/FAILED は DB 例外 or transport 未解決のみ。
3. **Form 経路も RC-1 該当**: `mapper.ts` の label `X URL`（実 `X（Twitter）URL`）/ `その他の SNS・URL`（実 `その他のSNS・URL`）が不一致 → urlX/urlOthers が slug fallback。
4. **integrations パス**: `packages/integrations/google/src/forms/mapper.ts`（SSOT の `packages/integrations-google` は不正確）。
5. **STABLE_KEY = camelCase**（`response_fields.stable_key` も camelCase）。31 key。
6. **最新 migration = 0026**（二重番号あり）→ 新規 `0027_member_field_overrides.sql`。

## 命名規則
- repository: camelCase 多数派 → `memberFieldOverrides.ts`
- use-case 共通: kebab → `field-precedence.ts`
- admin route: kebab → `member-fields.ts`
- migration: `00NN_snake.sql` → `0027_member_field_overrides.sql`
- admin web component: PascalCase → `MemberFieldEditor.tsx`

## inventory / targeted vitest
正本 §6 / §8 を参照。
