# member-data-source-precedence-and-profile-session-fix artifact inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/member-data-source-precedence-and-profile-session-fix/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| purpose | 会員プロフィール表示を L1 管理者確定編集 > L2 Google Form 本人再回答 > L3 スプレッドシート初回 seed に統一し、`/profile` のセッションエラーを fail-safe にする |
| implementation | `apps/api/migrations/0028_member_field_overrides.sql`, `apps/api/src/repository/memberFieldOverrides.ts`, `apps/api/src/use-cases/_shared/field-precedence.ts`, `apps/api/src/routes/admin/member-fields.ts`, `apps/api/src/jobs/{mappers/sheets-to-members,sync-sheets-to-d1}.ts`, `apps/api/src/repository/_shared/builder.ts`, `apps/api/src/use-cases/public/list-public-members.ts`, `apps/web/app/(member)/profile/page.tsx`, `apps/web/src/components/admin/MemberFieldEditor.tsx`, `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`, `packages/integrations/google/src/forms/mapper.ts` |
| system specs | `docs/00-getting-started-manual/specs/00-overview.md`, `01-api-schema.md`, `08-free-database.md` |
| evidence | `pnpm verify:d1-migrations` PASS, API typecheck PASS, Web typecheck PASS, focused Vitest + MemberFieldEditor review tests PASS, D1 contract Vitest review set 3 files / 18 tests PASS |
| invariant | 本人更新は Google Form 再回答。管理者確定編集のみ `member_field_overrides` に保持し、再同期 / 本人再回答で消さない。Sheets seed は import-once。 |
| user gate | remote D1 migration apply, staging deploy, authenticated visual capture, commit, push, PR |

## Phase 12 sync

- Root/output `artifacts.json` は `implemented_local_runtime_pending` に昇格。
- Gate-A/B は local PASS、Gate-C は external ops pending。
- system specs と task-specification-creator lesson は同一 wave で更新済み。

## Lessons Learned

- **L-MDSP-001（DDL を読まずに UPSERT 列を設計しない）**: `member_responses` には `full_name`/`ubm_zone` 等の個別列が存在せず（DDL は `answers_json`/`extra_fields_json` のみ）、`sync-sheets-to-d1.ts` の `UPSERT_COLUMNS` が存在しない列へ INSERT していたため **Sheets 同期は SQL レベルで 1 行も書き込めず全失敗**していた（CORR-1）。設計前に対象テーブルの実 DDL（`migrations/0001_init.sql` 等）を Read で裏取りし、「フィールド = 列」と推測しないこと。表示が読む `response_fields` への書込有無も必ず確認する。
- **L-MDSP-002（ラベルマップは実フォーム実ヘッダーで照合する）**: Sheets 経路の `DB_FIELD_MAP` はほぼ全項目が実ヘッダーと不一致（RC-1）、Form 経路 `mapper.ts` も `"X（Twitter）URL"`・`"その他のSNS・URL"`（全角スペース差）の 2 ラベルが slug fallback で unknown 化していた（CORR-3）。ラベルマップ検証は想定ラベルではなく **Google Drive MCP で実取得したスプレッドシート実ヘッダー**と 1:1 照合する。consent 値も `"同意する（掲載OK）"` 等の実値網羅が必要（RC-2/CORR-2）。
- **L-MDSP-003（enum と実回答値の値ドメイン正規化）**: `stable_key` は camelCase・enum 値（`ubmZone="0_to_1"`）だが実シート値は `"0→1"`/`"会員"` 形式のため、取込時に値ドメイン正規化マップが必須（CORR-5）。既存 WF `members-search-filter-ux-and-api-fix` の真因と同根 — 隣接 WF と正規化責務の重複範囲を残論点で明示分担する。
- **L-MDSP-004（provenance は最小コストで・projection は単一純関数で共有）**: import-once provenance は別テーブルではなく `member_identities` に 2 列追加（`seed_source`/`seed_imported_at`・1:1・最小コスト、CORR-7）。表示合成は `use-cases/_shared/field-precedence.ts` の純関数 1 つを list/detail/profile の 3 経路で共有しロジック重複を排除（CORR-8・branch 100%）。
- **L-MDSP-005（独立バグは実コードで真因を再特定し fail-safe で両立させる）**: `/profile` の汎用エラーは当初仮説 H-1（`/me` が 500）だったが、実コード裏取りで `me-session-resolver` は member 不在で **401**（500 ではない）と判明（CORR-2）。staging 実機切り分けが user-gated のときは、真因（500 / transport 失敗）を断定せず web 側で両真因に fail-safe（login redirect / 会員未登録案内）を効かせる設計に倒す。
- **L-MDSP-006（VISUAL × 実装済みは `spec_created` で閉じない）**: 具体的な apps/packages 実装対象がある WF は、VISUAL screenshot が user-gated でもローカル実装・typecheck・focused tests・spec/skill sync は同一サイクルで完了し `implemented_local_runtime_pending` へ昇格する（task-specification-creator SP-MDSP-001 として横展開済み）。outputs/artifacts.json の gate parity は WF 初期化時に root と outputs 双方を生成しておくと Phase 11-13 での追加作成が不要。
