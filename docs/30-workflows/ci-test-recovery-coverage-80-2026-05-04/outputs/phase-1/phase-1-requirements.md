# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 上流ブロッカー | main CI run 25297513424 (2026-05-04T02:04Z) |

## 目的

- main ブランチで継続的に発生している以下 3 系統の CI 失敗を回復する。
  1. apps/web の 36 件 vitest test file が `react/jsx-dev-runtime` 解決失敗で停止
  2. apps/api の 13 件 test 失敗で coverage 計測自体が成立しない
  3. coverage 80% 未達のためいずれは hard gate 化されると CI が赤に変わる
- 全パッケージ coverage Statements/Branches/Functions/Lines ≥80% を達成する。
- coverage-gate を soft gate (`continue-on-error: true`) から hard gate に昇格する。

## Acceptance Criteria

| ID | 内容 | 検証方法 |
| --- | --- | --- |
| AC-1 | apps/web の vitest run で `react/jsx-dev-runtime` import 解決エラーが 0 件 | `pnpm --filter @ubm-hyogo/web test` 実行ログに該当 error が無いこと |
| AC-2 | apps/web の test file 61 件全てが pass（または明示的 skip 理由付き） | `pnpm --filter @ubm-hyogo/web test` exit 0 |
| AC-3 | apps/api の 13 件 test 失敗が解消し coverage-summary.json が生成される | `apps/api/coverage/coverage-summary.json` が存在し JSON parse 成功 |
| AC-4 | apps/web の coverage 全 metric ≥80% | `apps/web/coverage/coverage-summary.json` の `total.{lines,branches,functions,statements}.pct` ≥80 |
| AC-5 | apps/api の coverage 全 metric ≥80% | `apps/api/coverage/coverage-summary.json` の `total.{lines,branches,functions,statements}.pct` ≥80 |
| AC-6 | packages/shared / packages/integrations* の coverage 全 metric ≥80% を維持 | 同上 |
| AC-7 | `bash scripts/coverage-guard.sh` が exit 0 | shell exit code |
| AC-8 | `.github/workflows/ci.yml` の `coverage-gate` job から `continue-on-error: true` が job レベルおよび `Run coverage-guard` step レベル両方で削除されている | 該当 yml の grep |
| AC-9 | main ブランチへ merge 後の CI run が緑（少なくとも `ci` / `coverage-gate` job が success） | `gh run list --branch main --limit 1 --json conclusion` |
| AC-10 | 本 wave の全成果物が CONST_007 の範囲内（後送り禁止）に収まり、別 PR 化や TODO 残しを行わない | `outputs/phase-12/unassigned-task-detection.md` で 0 件確認 |

## scope inventory（影響ファイル候補）

### Task A: jsx-dev-runtime 解決（環境修復）

| 候補ファイル | 理由 |
| --- | --- |
| `vitest.config.ts` (root) | `deps.optimizer.web.include` または `resolve.alias` で `react/jsx-dev-runtime` を解決可能 |
| `package.json` (root) | `react` / `react-dom` を root devDependencies に追加して hoisting を強制 |
| `apps/web/vitest.config.ts` (新規) | apps/web 専用 config を分離し `--root=../..` を `--root=.` に変更（test script 連動修正） |
| `apps/web/package.json` | test script の `--root` パラメタ修正（option 採用時） |
| `pnpm-workspace.yaml` | `publicHoistPattern` 追加（option 採用時） |

### Task B: apps/api test failure 修復

| 候補ファイル | 推測される失敗パターン |
| --- | --- |
| `apps/api/src/middleware/*.test.ts` (3 件) | Miniflare D1 binding setup の差分、tsconfig path alias、env injection |
| `apps/api/src/repository/__tests__/*.test.ts` (約 18 件) | D1 migration 適用順、`_setup.test.ts` の前提崩れ、shared schema 互換性 |
| `apps/api/src/repository/*.test.ts` (約 6 件) | 同上 |
| `apps/api/src/health-db.test.ts` | D1 binding 名 |
| `apps/api/tsconfig.json` / `tsconfig.build.json` | ts compile error が test runner で露出 |
| `vitest.config.ts` (root) | apps/api include パターン or hookTimeout |

具体的失敗内容は Task B Phase 1 で `pnpm --filter @ubm-hyogo/api test 2>&1` の実ログ取得を必須とする。

### Task C: apps/web coverage 補強

| 対象ディレクトリ | ファイル数 | 既存テスト状況 |
| --- | --- | --- |
| `apps/web/src/components/ui/` | 16 | __tests__ 10 件あり（残 6 件: Avatar, Button, Chip, Input, Select, Textarea, KVList, LinkPills） |
| `apps/web/src/components/admin/` | 7 | __tests__ あり、ut-web-cov-01 完了済み（残未達分のみ） |
| `apps/web/src/components/public/` | 6 | __tests__ あり、ut-web-cov-02 完了済み（残未達分のみ） |
| `apps/web/src/lib/admin/` | 3 (server-fetch, api, types) | テスト不足 |
| `apps/web/src/lib/api/me-requests*.ts` | 3 | テスト不足 |
| `apps/web/src/lib/url/` | 5 | 部分的 |
| `apps/web/src/lib/fetch/` | 2 | 部分的 |
| `apps/web/src/lib/auth/`, `auth.ts`, `session.ts` | — | ut-web-cov-03 完了済み |

実 baseline は Task A 完了後（vitest が動く状態）で `pnpm --filter @ubm-hyogo/web test:coverage` を再走させて確定する。

### Task D: apps/api coverage 補強

- `apps/api/src/**/*.ts` (104 test 件存在 → ファイル数約 60 推定)
- 実 baseline は Task B 完了後に確定。

### Task E: coverage-gate hard gate 化

| 対象ファイル | 変更内容 |
| --- | --- |
| `.github/workflows/ci.yml` (line 56-110) | `continue-on-error: true` を job レベル + step レベル両方から削除 |
| `docs/30-workflows/completed-tasks/coverage-80-enforcement/outputs/phase-12/implementation-guide.md` | "PR3/3" 完了マーク追記 |

## 上流ブロッカー（Phase 2/3 で再掲）

| ブロッカー | 影響 | 解消方法 |
| --- | --- | --- |
| Task A 未完 | apps/web coverage 計測不能 → AC-4 検証不能 → Task C 不可 | wave-1 で Task A 先行完了 |
| Task B 未完 | apps/api coverage 計測不能 → AC-5 検証不能 → Task D 不可 | wave-1 で Task B 先行完了 |
| Task C/D 未完 | AC-4/AC-5 未達 → Task E hard gate 化で main CI 赤化 | wave-2 で両方 80% 達成必須 |

## CONST_007 適用範囲

- 全 5 タスク (A/B/C/D/E) を本 wave サイクル内（実装プロンプト 1 サイクル）で完了する。
- 「将来別 PR」「次 wave で対応」「TODO コメント残し」は禁止。
- 個別ファイル単位で 80% に到達できない場合は `vitest.config.ts` の `coverage.exclude` 追加で対応し、その除外理由を `outputs/phase-12/unassigned-task-detection.md` に明記する（除外理由が docs に残れば後送りではなく確定処理）。

## 多角的チェック観点

- システム系: vitest deps optimizer が CI Linux と macOS で挙動が違う可能性 → CI 上で実証必須
- 戦略系: 既存 wave (`ut-coverage-2026-05-wave`) との重複を避け、未完部分のみ吸収する
- 問題解決系: jsx-dev-runtime 解決は「環境修復」、coverage 補強は「test code 追加」と責務分離

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase テンプレ | `.claude/skills/task-specification-creator/references/phase-template-core.md` | Phase 1 ルール |
| coverage 標準 | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 閾値の正本 |
| 既存 wave 仕様 | `docs/30-workflows/ut-coverage-2026-05-wave/README.md` | 重複回避の根拠 |
| coverage-guard | `scripts/coverage-guard.sh` | 検証 script |
| CI workflow | `.github/workflows/ci.yml` | coverage-gate 定義 |
| root vitest | `vitest.config.ts` | test 設定の正本 |
| react devDep 不在の根拠 | `apps/web/package.json` / root `package.json` | `react` は web のみ宣言、root devDep に不在 |

## 完了条件

- [x] AC-1〜AC-10 を本書に列挙
- [x] scope inventory 完了（候補ファイルリスト）
- [x] 上流ブロッカー記載
- [x] CONST_007 適用範囲明記
- [x] artifacts.json.metadata.visualEvidence = NON_VISUAL 確定

## 次 Phase

Phase 2（設計）— jsx-dev-runtime 解決 3 案比較と推奨案、validation matrix、concern 別 target topology を確定する。
