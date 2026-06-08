# Phase 9 — 品質保証（QA）

> 実装区分: 実装仕様書 / NON_VISUAL / new
> 入力: `phase-8-refactor.md` / `phase-4-test-plan.md` 〜 `phase-7-coverage.md` / `index.md`
> 判定対象: DB migration タスク向け QA チェックリスト全件 PASS
> 出力: PASS → Phase 10（最終レビュー）へ進行

---

## 9.1 タスク特性に応じた QA 観点

本タスクは UI を持たない **DB migration 追加タスク**（NON_VISUAL / new）。UI タスクの line budget / link 検証 / mirror parity / design-token gate は **非該当**。代わりに以下の DB migration 向け QA を正本とする。

> **削除でなく新規追加タスクの PASS 基準**（[FB-UI-02-1] 準拠）: 「ファイル削除に伴う dangling 参照 0」ではなく、**「新規ファイル追加 + live import（適用経路）整合」** を PASS 基準とする。すなわち `0026_*.sql` が `setupD1()` の昇順全件適用に正しく取り込まれ、test が GREEN になることを以て import 整合とみなす。

---

## 9.2 QA チェックリスト（DB migration 向け）

| # | チェック項目 | コマンド / 方法 | PASS 基準 |
|---|------------|----------------|----------|
| QA-1 | sequence guard | `pnpm verify:d1-migrations` | pass（0026 が unique prefix・連番整合・`sequence-exceptions.json` 編集不要） |
| QA-2 | D1 contract test 全 GREEN | `pnpm --filter @ubm-hyogo/api test -- 0026_member_status_fk_constraint` | FK 違反拒否 / 正常許容 / 既存データ不変 / 冪等 / INDEX 再作成 全ケース pass |
| QA-3 | 型チェック | `pnpm typecheck` | エラー 0 |
| QA-4 | リント | `pnpm lint` | 違反 0 |
| QA-5 | apps/web diff 0 | `git diff --name-only HEAD \| grep '^apps/web/'` | **出力 0 行**（apps/web に一切変更が無い・AC-8） |
| QA-6 | DEFAULT 値 byte 一致 | 0002 と 0026 の `member_status` DEFAULT 句を比較（§9.5） | 現行10カラムの DEFAULT が完全一致 |
| QA-7 | `idx_member_status_public` 再作成 | test 内 `PRAGMA index_list(member_status)` / SQL §4 確認 | 同一定義 INDEX が再構築後も存在（AC-9） |
| QA-8 | test 命名規約 | `find apps/api/migrations/__tests__ -name '*.test.ts'` | 0 件（`*.spec.ts` のみ・不変条件#8） |
| QA-9 | live import 整合（新規追加） | `0026_*.sql` が `migrations/*.sql` 昇順適用に取り込まれるか | QA-2 が GREEN であること＝適用経路に正しく載った証跡 |

---

## 9.3 apps/web diff 0 の grep 確認（AC-8 / QA-5）

```bash
# apps/web に変更が一切含まれないことを確認（出力 0 行が PASS）
git diff --name-only HEAD | grep '^apps/web/' || echo "OK: apps/web diff 0"

# 非 docs 変更が apps/api の FK migration / test / fixture 追従に限定されることの裏取り
git diff --name-only HEAD | grep -v '^docs/'
#   → apps/api/migrations/0026_member_status_fk_constraint.sql
#   → apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts
#   → apps/api/src/repository/__tests__/notificationOutbox.repository.spec.ts
#   → apps/api/src/repository/__tests__/memberNotificationPreference.repository.spec.ts
#   → apps/api/src/routes/admin/member-notification-pref.contract.spec.ts
#   → apps/api/src/sync/backfill.contract.spec.ts
#   → apps/api/src/routes/admin/tags-queue.contract.spec.ts
#   → apps/api/src/workflows/tagQueueResolve.contract.spec.ts
#   → apps/api/src/routes/auth/session-resolve.contract.spec.ts
#   → apps/api/src/repository/__tests__/_setup.ts
#   が期待出力
```

| 確認 | 期待 |
|------|------|
| `apps/web/` を含む差分 | 0 行 |
| 非 docs 変更 | `0026_*.sql` + `0026_*.spec.ts` + 既存 D1 test fixtures の FK 前提追従 |

---

## 9.4 sequence guard（QA-1）詳細

| 確認 | 内容 |
|------|------|
| prefix の一意性 | `0026` は既存 migration に未使用（0025 backfill / 0024 photos variants の後） |
| 連番の連続性 | 0025 → 0026 で gap なし |
| `sequence-exceptions.json` | **編集不要**（0026 は正規連番のため例外登録対象外） |
| 順序依存 | 0025（orphan 解消）が 0026（FK 導入）より先に適用される（番号順保証・AC-5） |

---

## 9.5 DEFAULT 値 byte 一致検証（QA-6 / AC-7）

`0002_admin_managed.sql` L5-16 の `member_status` DEFAULT 句と、`0026_*.sql` の `member_status_new` DEFAULT 句が **完全一致** することを検証する。

| カラム | 0002 の DEFAULT | 0026 の DEFAULT | 一致 |
|--------|----------------|----------------|------|
| `public_consent` | `'unknown'` | `'unknown'` | ✓ |
| `rules_consent` | `'unknown'` | `'unknown'` | ✓ |
| `publish_state` | `'member_only'` | `'member_only'` | ✓ |
| `is_deleted` | `0` | `0` | ✓ |
| `updated_at` | `(datetime('now'))` | `(datetime('now'))` | ✓ |
| `hidden_reason` / `last_notified_at` / `updated_by` | DEFAULT なし（NULL 許容） | DEFAULT なし（NULL 許容） | ✓ |

> 不一致が 1 件でもあれば QA-6 FAIL。移行後の新規 INSERT 既定値が従来と乖離する＝非回帰違反（AC-7）となるため blocker 扱い。

---

## 9.6 判定

| QA 項目 | 結果 |
|---------|------|
| QA-1 sequence guard | PASS（`verify:d1-migrations`: 33 migrations / 5 documented duplicate prefix groups OK） |
| QA-2 contract test 全 GREEN | PASS（focused D1 Vitest 1 file / 6 tests） |
| QA-3 typecheck | PASS（`mise exec -- pnpm --filter @ubm-hyogo/api typecheck`） |
| QA-4 lint | PASS（API package の lint/typecheck は同一 `tsc -p tsconfig.json --noEmit`） |
| QA-5 apps/web diff 0 | PASS（grep 0 行） |
| QA-6 DEFAULT byte 一致 | PASS |
| QA-7 INDEX 再作成 | PASS（focused D1 Vitest で `idx_member_status_public` 同一定義を確認） |
| QA-8 test 命名規約 | PASS（追加 test は `*.spec.ts`） |
| QA-9 live import 整合 | PASS（QA-2 GREEN を以て確認） |
| **総合** | **PASS → Phase 10 へ進行** |

> local実装は本 wave で追加済み。focused D1 contract test / apps/api D1 full regression 109 files / 937 tests / API typecheck / sequence guard / apps-web diff 0 は実測 PASS。remote D1 apply / commit / PR は user-gated とする。
