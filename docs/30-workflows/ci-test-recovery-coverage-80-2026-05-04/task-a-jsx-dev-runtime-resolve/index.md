# タスク仕様書: Task A — jsx-dev-runtime 解決 / vitest 環境修復

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | ci-recover-task-a-vitest-jsx-dev-runtime |
| 親 wave | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/` |
| 配置先 | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-a-jsx-dev-runtime-resolve/` |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親タスクの wave | wave-1（並列実行可能。Task B と同 wave） |
| dependencies | なし（wave-1 起点） |
| 後続依存 | Task C（apps/web coverage 80%）が本タスク完了を必須とする |
| ブランチ（想定） | `feat/ci-recover-task-a-vitest-jsx-dev-runtime` |
| 想定 PR 数 | 1 |
| coverage AC | 適用（≥80% を全 package で維持。本タスク単独の DoD は jsx-dev-runtime 解決に限定するが、coverage-standards.md 準拠で AC として記載） |

## 目的

apps/web の vitest 36 件 test file が CI / 一部ローカル環境で `Failed to resolve import "react/jsx-dev-runtime"` により停止している事象を解消し、apps/web の test suite を vitest で実行可能な状態へ戻す。これにより、後続 Task C（apps/web coverage 80%）の baseline 計測を可能にする。

## 根本原因（Phase 2 設計で確定済み）

- `react@19.2.5` / `react-dom@19.2.5` は `apps/web/package.json#dependencies` のみに宣言されており、root の `package.json#devDependencies` には不在。
- root 起動の vitest（`vitest.config.ts` / `--root=../..` 経路）が、CI の `pnpm install --frozen-lockfile` 環境で hoist された `node_modules/react/jsx-dev-runtime` を resolve できない。
- ローカル macOS では pnpm hoist が効くため再現しにくいが、CI Linux では確実に再現する。

## 採用方針（Phase 2 設計の案 1）

root `package.json#devDependencies` に以下を **apps/web と完全一致 version** で追加する。

| 追加 dep | version | 既存 apps/web 宣言 |
| --- | --- | --- |
| `react` | `19.2.5` | `dependencies.react = 19.2.5` |
| `react-dom` | `19.2.5` | `dependencies.react-dom = 19.2.5` |
| `@types/react` | `19.2.7` | `devDependencies.@types/react = 19.2.7` |
| `@types/react-dom` | `19.2.3` | `devDependencies.@types/react-dom = 19.2.3` |

## スコープ

| 含む | 含まない |
| --- | --- |
| root `package.json#devDependencies` への react / react-dom / 型定義 4 dep 追加 | apps/web の test code 追加（Task C スコープ） |
| `pnpm install` による `pnpm-lock.yaml` 再生成 | apps/api の test failure 修復（Task B スコープ） |
| 必要時のみ `vitest.config.ts` の `test.server.deps.inline` / `test.deps.optimizer.web.include` への `react` 系追記（Fallback） | `.github/workflows/ci.yml` 側の hard gate 化（Task E スコープ） |
| `apps/web` build / test の regression 確認 | apps/web の vitest config 分離（Phase 2 案 3 は不採用） |
| Phase 11 に jsx-dev-runtime 解決 evidence 配置 | apps/web 個別 test の assertion 失敗修復（Task C スコープ） |

## 不変条件（CLAUDE.md 継承）

- 不変条件 #5: D1 への直接アクセスは `apps/api` に閉じる（本タスクは package.json / lockfile 編集のみのため違反なし）
- 不変条件 #6: GAS prototype は本番バックエンド仕様に昇格させない
- CONST_007: 本 Task で発生した未解決事項は別 PR / 別 wave に送らず、`outputs/phase-12/unassigned-task-detection.md` に「除外理由付き 0 件 close」として吸収する

## DoD（本タスク固有）

1. `pnpm --filter @ubm-hyogo/web test` 実行ログに `Failed to resolve import "react/jsx-dev-runtime"` が **0 件**
2. `bash scripts/coverage-guard.sh` が apps/web で coverage 集計まで到達する（threshold 判定の合否は Task C スコープ）
3. CI の `coverage-gate` job log で apps/web の `react/jsx-dev-runtime` 系エラーが **0 件**
4. `pnpm --filter @ubm-hyogo/web build` が regression しない（exit 0）

## 完了条件（spec 段階）

- [x] Phase 1-13 の `phase-N.md` が `outputs/phase-N/` 配下に存在し、各 Phase が `## メタ情報` / `## 目的` / `## 実行タスク` / `## 完了条件` を持つ
- [x] coverage AC（≥80% / `bash scripts/coverage-guard.sh` exit 0）が Phase 6 / Phase 9 / Phase 11 完了条件に明記
- [x] Phase 13 が blocked placeholder（commit / push / PR 禁止）として配置
- [x] dependencies は wave-1 起点で空、後続 Task C の前提タスクであることを明記
- [x] artifacts.json.metadata.visualEvidence = NON_VISUAL 確定

## 完了条件（実装段階）

- [ ] root `package.json#devDependencies` に `react@19.2.5` / `react-dom@19.2.5` / `@types/react@19.2.7` / `@types/react-dom@19.2.3` が追加されている
- [ ] `pnpm-lock.yaml` が更新され、`pnpm install --frozen-lockfile` が exit 0
- [ ] `pnpm --filter @ubm-hyogo/web test 2>&1 | grep -c "jsx-dev-runtime"` が 0
- [ ] `pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] coverage Statements / Branches / Functions / Lines が apps/api / apps/web / packages/* 全パッケージで ≥80%（本タスク単独達成は不問。後続 Task C / D 後の最終確認用）
- [ ] `bash scripts/coverage-guard.sh` exit 0（同上、最終 wave 完了時の確認）
- [ ] Phase 11 evidence 3 点（`coverage-result.md` / `regression-check.md` / `manual-evidence.md`）配置
- [ ] Phase 12 必須 7 ファイル配置

## 参照資料

| 参照資料 | パス |
| --- | --- |
| 親 wave 仕様 | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/index.md` |
| Phase 1-3 共通設計 | `../outputs/phase-{1,2,3}/*.md` |
| root package.json | `package.json` |
| apps/web package.json | `apps/web/package.json` |
| root vitest config | `vitest.config.ts` |
| coverage-guard | `scripts/coverage-guard.sh` |
| CI workflow | `.github/workflows/ci.yml` |
| coverage-standards | `.claude/skills/task-specification-creator/references/coverage-standards.md` |
| 後続 Task C | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-c-apps-web-coverage-80/`（同 wave 内 or 配置時） |

## Phase 一覧

| Phase | 名称 | 状態 |
| --- | --- | --- |
| 1 | 要件定義 | spec_created |
| 2 | 設計（解決方針確定） | spec_created |
| 3 | アーキテクチャ確認 | spec_created |
| 4 | テスト方針 | spec_created |
| 5 | 実装（package.json 編集 + lockfile 再生成） | spec_created |
| 6 | テスト実行・カバレッジ確認 | spec_created |
| 7 | テストカバレッジ確認 | spec_created |
| 8 | 統合テスト | spec_created |
| 9 | 品質検証 | spec_created |
| 10 | 最終レビュー | spec_created |
| 11 | 手動テスト / runtime evidence | spec_created |
| 12 | ドキュメント更新（7 必須成果物） | spec_created |
| 13 | コミット・PR 作成 | blocked（user 明示承認後のみ） |
