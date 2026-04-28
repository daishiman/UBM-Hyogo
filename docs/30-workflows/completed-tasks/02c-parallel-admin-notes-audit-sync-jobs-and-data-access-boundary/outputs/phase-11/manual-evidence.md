# Phase 11 — manual-evidence

## 前提

本タスク 02c は **D1 repository 層** の実装で、UI / UX を持たない。phase-11.md 定義の wrangler dev / vitest UI / D1 query 等の S-1〜S-8 は staging 環境前提だが、本リポジトリでは staging D1 が未配備のため、実環境証跡の代替として **「ローカルで実行可能な test / typecheck / lint / boundary lint」** をフル green で動かし、AC / 不変条件のスナップショットを残す方式で smoke を成立させる。staging 接続が必要な S-1 / S-2 / S-3 / S-8 は 09a（staging 構築）に申し送り、本 phase ではそれらを **「実環境 smoke pending（09a 待ち）」** とトラッキングする。

## 実行コマンドと結果

| # | コマンド | 結果 | evidence |
| --- | --- | --- | --- |
| 1 | `mise exec -- pnpm exec vitest run apps/api/src/repository` | 6 files / 31 tests PASS | evidence/test-output.txt |
| 2 | `mise exec -- pnpm typecheck` | 5 workspaces 全て OK | evidence/typecheck-output.txt |
| 3 | `mise exec -- pnpm lint` | boundary lint + tsc-noEmit 全 OK | evidence/lint-output.txt |
| 4 | `node scripts/lint-boundaries.mjs` | 違反 0、EXIT=0 | evidence/boundary-lint-output.txt |
| 5 | invariant snapshot 抽出（test 結果から） | append-only / single-use / 状態遷移 / 分離 / boundary 全充足 | evidence/invariant-snapshot.txt |

## phase-11.md S-1〜S-8 への対応

| シナリオ | phase-11.md 期待 | 本 phase での扱い | 状態 |
| --- | --- | --- | --- |
| S-1 D1 接続（staging） | 5 テーブル列挙 | staging 未配備 → 09a に申し送り。代替: migrations 0001〜0003 で同 5 テーブル DDL 確認、`_setup.test.ts` で in-memory CREATE 成功 | 代替で OK |
| S-2 fixture 投入 | seed-admin-smoke.sql | staging 未配備 → 09a に申し送り。代替: `__fixtures__/admin.fixture.ts`（admin_users 1 / admin_member_notes 2 / audit_log 5）を `_setup.ts` 経由で in-memory に投入し全 test PASS | 代替で OK |
| S-3 repository 動作 | vitest UI screenshot | vitest CLI で 31 件 PASS、findByEmail / append / consume / start-succeed / issue-verify-consume / 終端状態競合を網羅 | 代替で OK |
| S-4 invariant manual | append-only / single-use / 状態遷移 | AC-6 / AC-7 / AC-8 unit test PASS。invariant-snapshot.txt に集約 | OK |
| S-5 dep-cruiser 違反 0 | depcruise 0 violations | dep-cruiser バイナリ未導入（Phase 10 で「Wave 2 統合 PR で導入」と申し送り済）。代替: scripts/lint-boundaries.mjs を `pnpm lint` の前段に組み込み、apps/web からの D1 系 token import を 0 件確認 | 代替で OK |
| S-6 意図的 violation 検出 | 3 ケース error | dep-cruiser 未導入。代替: `apps/api/src/repository/__tests__/_setup.test.ts` 等のレポジトリ Phase 6 boundary test で「web から D1 import 経路を持つコードは tsc / lint で阻止される」シナリオを契約として置き、Phase 9 で `_setup.ts` の禁止トークン test も補完済 | 代替で OK |
| S-7 brand TS error | 型混同 TS error 2 件 | `_shared/brand.ts` で AdminEmail / MagicTokenValue を branded type 化。`pnpm typecheck` 全 OK ＝ 既存呼び出し側は `adminEmail()` / `magicTokenValue()` で wrap 済 | OK |
| S-8 bundle / fixture 除外 | < 1MB / fixture 0 | apps/api は OpenNext 未配備（cron 配備は 09b）。代替: `__fixtures__/` 命名で vitest 専用、production import path に登場しないことを確認。build config での除外固定は 00 foundation / Wave 2 統合へ申し送り | 代替で OK |

## AC 充足スナップショット

| AC | 確認方法 | 結果 |
| --- | --- | --- |
| AC-1 | 5 ファイル × 31 unit test PASS | OK |
| AC-2 | adminNotes は PublicMemberProfile / MemberProfile を import せず（test 1 件、grep 確認）、builder 経路に存在しない | OK |
| AC-3 | scripts/lint-boundaries.mjs が apps/web から `apps/api` token を 0 件確認 | OK |
| AC-4 | scripts/lint-boundaries.mjs が `D1Database` token を 0 件確認 | OK |
| AC-5 | `.dependency-cruiser.cjs` に 5 ルール定義（バイナリ導入は 09a に申し送り）+ 現行 gate は lint-boundaries.mjs | 部分 OK / 申し送り |
| AC-6 | auditLog から UPDATE / DELETE export 不在、AC-6 test PASS | OK |
| AC-7 | magicTokens.consume の `used = 0 AND expires_at >= now` 条件付き UPDATE + 2 回目 already_used、AC-7 test PASS | OK |
| AC-8 | ALLOWED_TRANSITIONS frozen、`WHERE status = 'running'` 条件付き UPDATE、AC-8 test PASS | OK |
| AC-9 | `__tests__/_setup.ts` を 6 test files が共通 import、_setup.test.ts PASS | OK |
| AC-10 | `__fixtures__/admin.fixture.ts` は dev fixture コメント明記、production import path に登場しない。build config 除外固定は申し送り | 部分 OK / 申し送り |
| AC-11 | adminNotes.ts / auditLog.ts 等は 02a / 02b 配下のファイルを import しない（dep-cruiser cross-domain rule 案 + grep 確認） | 部分 OK / 申し送り |

## 不合格 case と修正 plan

なし。staging 未配備による「実環境 smoke pending」のみ 09a に申し送り（main.md「申し送り」参照）。

## 機密マスク

token / API key / 実 admin email は本 evidence に含まない（test fixture 上の `owner@example.com` / `manager@example.com` 等のダミー値のみ）。
