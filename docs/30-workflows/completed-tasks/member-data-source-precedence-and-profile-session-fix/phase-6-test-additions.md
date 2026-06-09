---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 6
title: テスト拡充（fail path / 回帰 guard / 補助 command）
updated: 2026-06-09
---

# Phase 6 — テスト拡充（member-data-source-precedence-and-profile-session-fix）

Phase 4（happy path 中心の RED→GREEN）を補完し、**fail path・回帰 guard・補助 command** を追加する。
正本は [`_shared-context.md`](_shared-context.md)（§10b CORR-1..8）と [`phase-2-design.md`](phase-2-design.md) / [`phase-5-implementation.md`](phase-5-implementation.md)。
新規 test は `*.spec.ts` のみ（CLAUDE.md #8）。

---

## 0. 既存テストへの影響と更新方針

| 既存 spec | 影響 | 更新方針 |
| --- | --- | --- |
| `apps/api/src/jobs/mappers/sheets-to-members.spec.ts` | `DB_FIELD_MAP` 全面是正（RC-1）/ `CONSENT_MAP` 追加（RC-2）/ 値正規化（CORR-5）/ 出力 shape `SheetSeedRow` 化（B-1 d） | 旧ヘッダー前提アサーションを実ヘッダー（§3-1）へ全面差し替え。`"同意する（掲載OK）"`→consented を追加。`"0→1"`→`"0_to_1"` 等の正規化ケース追加。旧 `MemberRow` 列前提のアサーションは削除し `SheetSeedRow` へ。 |
| `apps/api/src/jobs/sync-sheets-to-d1.contract.spec.ts`（存在する場合） | `UPSERT_COLUMNS`/`ROW_FIELD_ORDER`/`upsertMembers` 削除・Form 書込モデル合流（CORR-1・B-2） | 「member_responses の個別列 INSERT」前提を削除。新 seed 関数が `member_identities` ensure + `member_responses(answers_json)` + `response_fields`(stable_key) + `member_status` consent を書くことを検証する形へ刷新。import-once（既存 email スキップ）を必須ケース化。 |
| `apps/api/src/jobs/sync-forms-responses.*.spec.ts` | provenance mark 追加のみ（B-3） | 既存挙動（`current_response_id` 切替・consent snapshot）の回帰非破壊を確認。新規 identity 作成時に `seed_source='form'` が入ることを 1 ケース追加。 |
| `packages/integrations/google/src/forms/mapper.spec.ts` | 2 ラベル是正（CORR-3） | `"X（Twitter）URL"`→`urlX` / `"その他のSNS・URL"`→`urlOthers` の解決を追加。slug fallback で unknown 化しないことを確認。残り 29 ラベルは非破壊。 |
| `apps/api/src/use-cases/public/*.spec.ts`（list/detail） | projection 適用（C-2） | override 不在時はレスポンス shape 不変（AC-6・回帰）を必須に。override 有時に L1 値が出ることを追加。 |
| `apps/web/app/(member)/profile/page.spec.tsx` | エラー分岐是正（E-3） | 既存「`MEMBER_SESSION_404`→再ログイン」を非破壊で維持。新規「`MEMBER_SESSION_FAILED`/`_500`→fail-safe 分岐（会員専用案内＋公開導線）」ケースを追加（汎用「時間をおいて」で詰まらないこと）。 |

---

## 1. fail path（異常系）追加テスト

### Lane A — repository / migration
- `memberFieldOverrides.spec.ts`:
  - `upsertOverride` 同一 `(member_id, stable_key)` 二重 upsert → 後勝ち（更新・行数増えない）。
  - `getOverrides` 0 件 → 空 map（null/undefined を返さない）。
  - 不正 `value_json`（非 JSON）混入行が `json_valid` ガードで読み飛ばされ全体が落ちない（CORR と D1 JSON 方針）。
  - `deleteOverride` 存在しない key → no-op（例外なし）。
- migration `0027`:
  - 補助 command（§4）で列/テーブル存在を SQL 検証。`seed_source`/`seed_imported_at` の DEFAULT と NULL 許容を確認。

### Lane B — ingestion
- import-once 二重実行: 同一スプレッドシートを 2 回 seed → 2 回目は全 row スキップ（書込 0・`seed_imported_at` 不変）。
- 部分一致: 既存 member（email A）+ 新規 member（email B）混在シート → A はスキップ、B のみ seed（AC-3 境界）。
- 未マップヘッダー残存: §3-1 外の未知ヘッダーは `extra_fields_json` へ退避し row 全体は seed 成功（fail-soft）。
- consent 表記揺れ網羅: `"同意する"` / `"同意する（掲載OK）"` / `"はい"` → consented、`"同意しない"` → declined、空/未知 → unknown。
- 値正規化 fail-soft: 未知 zone 値（例 `"100→"`）は正規化マップに無ければ raw 保持 + unmapped 記録（例外を投げない・WEEKGRD-02）。

### Lane C — projection / endpoint
- `field-precedence.ts`: override 値が空文字/null のときの扱い（空文字 override は「意図的空」として L1 採用 or 設計判断を phase-2 に従い固定。テストで明示）。
- admin endpoint `PUT /admin/member-fields/:memberId`:
  - 未認証 / require-admin 不成立 → 401/403。
  - 不正 stable_key（31 key 外）→ 400（zod reject）。
  - 存在しない member_id → 404。
  - 正常 → 200 + override 反映、直後の detail fetch で L1 値が最優先。

### Lane E — profile session
- web fail-safe: `/me` が `MEMBER_SESSION_500` / `MEMBER_SESSION_FAILED` / `MEMBER_SESSION_UNKNOWN` のいずれでも、汎用「時間をおいて」一辺倒でなく fail-safe 分岐に入る（CORR-2）。
- 401（AuthRequiredError）→ 既存 redirect 維持（回帰）。
- 404 → 既存「再ログイン」維持（回帰）。

---

## 2. 回帰 guard（既存挙動を壊さない保証）

| guard | 内容 |
| --- | --- |
| RG-1 | override **不在**時、公開一覧/詳細/profile のレスポンス shape が現行と完全一致（AC-6・スナップショット or フィールド単位比較）。 |
| RG-2 | Form 再回答の `current_response_id` 切替・consent snapshot が従来通り（B-3 で壊さない）。 |
| RG-3 | DEC-4 粘着: override 済みフィールドに Form 再回答が来ても**表示は override**。Form snapshot 自体は更新される（二重確認）。 |
| RG-4 | `apps/web` から D1 直接アクセスが増えていない（`lint-boundaries` / grep gate）。 |
| RG-5 | HEX 直書き 0（Lane D・`verify:tokens`）。`*.test.*` 不在（test-suffix gate）。 |

---

## 3. 補助 command（テスト・検証の足回り）

```bash
# 全件 run を避け targeted（FB-UI-02-2）
cd apps/api && mise exec -- pnpm vitest run \
  src/jobs/mappers/sheets-to-members.spec.ts \
  src/jobs/sync-sheets-to-d1.contract.spec.ts \
  src/repository/memberFieldOverrides.spec.ts \
  src/use-cases/_shared/field-precedence.spec.ts \
  src/use-cases/public \
  src/routes/admin/member-fields.contract.spec.ts \
  --root ../..

cd packages/integrations/google && mise exec -- pnpm vitest run src/forms/mapper.spec.ts --root ../../..

cd apps/web && mise exec -- pnpm vitest run "app/(member)/profile" --root ../..
```

### migration 列/テーブル存在の SQL 検証（user-gated・適用は承認後）
```sql
SELECT name FROM pragma_table_info('member_identities') WHERE name IN ('seed_source','seed_imported_at');
SELECT name FROM sqlite_master WHERE type='table' AND name='member_field_overrides';
SELECT name FROM pragma_table_info('member_field_overrides');
```

---

## 4. DoD（Phase 6）

- 上記 fail path / 回帰 guard が `*.spec.ts` として spec 化され、Phase 5 実装後に RED→GREEN で緑になることが追跡可能。
- 既存 spec の更新方針（§0）が漏れなく列挙されている。
- import-once 二重実行・DEC-4 粘着・consent 正規化・fail-safe 分岐が必須ケースに含まれる。
- targeted 実行コマンドが用意され、全件 run（SIGKILL リスク）を避けている。
- 実装・コミット・PR はしない（user-gated）。
