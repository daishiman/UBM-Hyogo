---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 2
artifact: design
status: completed
updated: 2026-06-09
---

# Phase 2 outputs — design（要約）

正本は `../../phase-2-design.md`。本ファイルはその要約コピー。

## 状態所有権
- L1 = `member_field_overrides`（admin-managed・writer は PUT のみ）
- L2/L3 = response 系（`member_responses`/`response_fields`/`member_identities`/`member_status`・sync が writer）
- provenance = `member_identities.seed_source` / `seed_imported_at`
- projection = 純関数（state 無し・use-case/builder が DI）

## Lane A: DDL
- `0028_member_field_overrides.sql`: テーブル `member_field_overrides(member_id, stable_key, value_json, raw_value_json, updated_by, updated_at, PK(member_id, stable_key))` + `member_identities` へ `seed_source` / `seed_imported_at` 列追加（ALTER）。FK は張らない（既存設計整合・app 層で identity 存在確認）。provenance を別テーブルにしない根拠 = identity と 1:1 で列追加が最小。
- repository `memberFieldOverrides.ts`: `listOverridesByMemberId` / `listOverridesByMemberIds` / `upsertOverride` / `deleteOverride`。
- `identities.ts`: `getSeedProvenance` / `markSeedImported`（seed_source IS NULL のときのみ書く＝ import-once 根拠）。

## Lane B: 取込
- import-once: Sheets は `findIdentityByEmail` で既存ならスキップ。Form は既存への再回答を従来通り反映（L2 維持）。
- 🔴 Sheets 書込モデル合流: 存在しない列への INSERT をやめ、`createMemberWithStatus` + `upsertResponse`(answers_json) + `upsertKnownField`(response_fields) + `setConsentSnapshot` + `markSeedImported` の共通 `seedMemberFromSheetRow` へ。
- `DB_FIELD_MAP` を実ヘッダー key へ全面是正・`CONSENT_MAP` に `"同意する（掲載ok）"` 追加・zone/status enum 正規化マップ追加。
- `mapper.ts` の 2 label 是正（X（Twitter）URL / その他のSNS・URL）。

## Lane C: projection + admin PUT
- `field-precedence.ts` 純関数: `resolveFieldValue(stableKey, overrides, responseFields)` / `mergeFieldProjection(fields, overrides)` / `toOverrideMap(rows)`。override 有→override（null=明示クリア=除外）、無→response。
- list/detail/builder の 3 経路が同一純関数を呼ぶ。public read 外形契約は不変。
- `routes/admin/member-fields.ts`: `GET /admin/member-fields/:memberId`（fields の override/response/effective）+ `PUT /admin/member-fields/:memberId`（fields[].{stableKey, value:string|null} の一括 upsert・404 identity 無・audit append）。`requireAdmin` 経由。内部型→公開 DTO 変換表は正本 §4.1。

## Lane E: session fix
- `sessionGuard` の DB 例外は 500 で正しく分類（握り潰さない）。member 不在は 401 維持（fail-closed）。
- web `profile/page.tsx`: `MEMBER_SESSION_404`（会員未登録案内）/ `MEMBER_SESSION_FAILED`（接続不可）/ default（500）で文言分離。
- 会員未登録ユーザーは 401→/login 維持 + login に登録案内（最小変更）。transport binding は config（user-gated）で解消。

## topology
A（直列ゲート）→ B / C-1（純関数+3経路）/ E（並列 wave-1・≤3）→ C-2（PUT route）→ D（web editor）→ 統合検証。validation lane は直列締め。

## 再利用
FormField / useAdminMutation / SectionError / 既存 repository write 関数。新規 primitive ゼロ。
