# issue-623-vitest-spec-suffix-convergence - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本タスクは設計成果物の作成だけで完結しない。具体的には以下 3 種類の実装変更を必須で伴う。
>
> 1. `vitest.config.ts` の `test.include` および `coverage.exclude` の編集（TypeScript 設定ファイルの差分実装）
> 2. `scripts/hooks/block-test-suffix.sh` の新規実装（bash script、`*.test.ts(x)` の staged 検出と reject ロジック）
> 3. `.github/workflows/verify-test-suffix.yml` の新規実装（GitHub Actions workflow、main / dev への push と PR の `*.test.ts(x)` 残存検出）
>
> いずれもコードベース実体への書き込みを要するため、ドキュメント単独タスク（spec-only）ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | issue-623 |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 |
| ディレクトリ | docs/30-workflows/issue-623-vitest-spec-suffix-convergence |
| 親 Issue | #325（test suffix rename migration） |
| 親タスク | docs/30-workflows/issue-325-test-suffix-rename-migration/ |
| Wave | followup（#325 親完了後の独立後追い） |
| 実行種別 | 実装タスク（rename + config 編集 + CI gate 追加） |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 状態 | implemented_local_runtime_pending |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | MEDIUM |
| GitHub Issue | #623（CLOSED だが調査の結果未解決のため再着手） |

## 目的

Issue #325 で確立した「テストファイル名 suffix は `*.spec.{ts,tsx}` に統一する」という ADR を、リポジトリ全体（apps/web / apps/api / packages/* / scripts / .claude/skills 配下のテストフィクスチャを含む）で完全実施し、`vitest.config.ts` の `test.include` および `coverage.exclude` を `*.spec.{ts,tsx}` 単一に収斂させる。あわせて新規に `*.test.ts(x)` が再混入することを構造的に block する CI gate（lefthook pre-commit + GitHub Actions workflow）を導入し、後戻りを不可能にする。

## 背景（Issue #623 close 後の調査結果）

Issue #623 は GitHub 上で close 済みだが、close 時点の調査が不完全だった。今回の再調査で以下の未解決状態が判明している。

- `vitest.config.ts:42-48` の `test.include` は `apps/**/src/**/*.{test,spec}.{ts,tsx}` 等の二段階対応のままで、`*.spec.*` 単一には未収斂
- `vitest.config.ts:57-77` の `coverage.exclude` も `**/*.test.{ts,tsx}` 行が削除されておらず、`*.test.*` と `*.spec.*` の両方を除外している
- リポジトリ全体に `*.test.ts(x)` ファイルが **159件残存**（apps/web 83 / apps/api 6 / packages 28（shared 17 + integrations 11）/ scripts 35 / .claude/skills 7）
- 親 #621/#622 が close された後に作成された機能タスク（task-05 error boundary、schema aliases、shared coverage uplift 等）で新規 `*.test.ts(x)` が再混入している
- 新規 `*.test.ts(x)` 追加を block する CI gate は未導入で、再混入を構造的に防げる仕組みがない

本タスクはこの状況を一括解消し、ADR を実装に追従させる。

## スコープ

### 含む

- 既存 `*.test.ts(x)` 159件を `*.spec.ts(x)` へ一括 rename（`git mv` による履歴保持を必須）
- `vitest.config.ts` の `test.include` を `*.spec.{ts,tsx}` 単一に収斂
- `vitest.config.ts` の `coverage.exclude` から `**/*.test.{ts,tsx}` 行を削除
- 新規 `*.test.ts(x)` 追加を block する CI gate の追加
  - lefthook `pre-commit` 新規 command `block-test-suffix`
  - bash script `scripts/hooks/block-test-suffix.sh`（既存 `staged-task-dir-guard` と並列実行する独立 step）
  - GitHub Actions workflow `.github/workflows/verify-test-suffix.yml`（main / dev への push と PR で trigger）
- ドキュメント追従
  - `CLAUDE.md` への「新規 test ファイルは `*.spec.{ts,tsx}` のみ」1 行追記
  - skill changelog 追記（`task-specification-creator` / `aiworkflow-requirements` の changelog）
  - 既存 ADR `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md` への「二段階対応終了」追記

### 含まない

- vitest 自体の version up / reporter 変更
- coverage threshold の変更（rename のみで coverage delta は ±0% 想定）
- Playwright / Storybook など別 runner の suffix 規約
- テスト内容（assertion / describe / it）の変更
- `__tests__` ディレクトリ命名の見直し（別タスク管轄）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | docs/30-workflows/issue-325-test-suffix-rename-migration/ | ADR / Phase 12 設計の継承元。本タスクは ADR の「未実装部分」を完成させる |
| 上流 | completed-tasks/task-issue-325-followup-003-vitest-spec-suffix-convergence.md | 原典タスク指示書（Why / What / How、consumed） |
| 連携 | docs/30-workflows/task-git-hooks-lefthook-and-post-merge/ | lefthook.yml への新規 command 追加で参照 |
| 連携 | .github/workflows/verify-indexes.yml 等の既存 verify workflow | 命名規約と CI 配置の整合性確認 |
| 下流 | 将来の任意の test 追加タスク | 本タスク導入後は `*.test.ts(x)` 追加が CI で reject される |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-issue-325-followup-003-vitest-spec-suffix-convergence.md | 原典タスク指示書（consumed） |
| 必須 | docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md | ADR 追記先 |
| 必須 | vitest.config.ts | 編集対象（include / coverage.exclude） |
| 必須 | lefthook.yml | `block-test-suffix` command の追加先 |
| 必須 | scripts/hooks/staged-task-dir-guard.sh | 並列実行する独立 step の参照実装 |
| 必須 | CLAUDE.md | 「新規 test ファイルは `*.spec.{ts,tsx}` のみ」の追記先 |
| 参考 | .claude/skills/aiworkflow-requirements/references/testing.md | テスト規約参照 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |
| 参考 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/index.md | フォーマット参照 |

## 受入条件 (AC)

- **AC-1**: `find . -name '*.test.ts' -o -name '*.test.tsx' | grep -v node_modules | grep -v .next | grep -v .open-next` が **0 件** であること（rename 全件完了）。Phase 11 evidence に before/after の `wc -l` を保存する。
- **AC-2**: `vitest.config.ts` の `test.include` が `*.spec.{ts,tsx}` のみで、`{test,spec}` 二段階記法を含まないこと（`grep -E '\{test,spec\}' vitest.config.ts` が 0 hit）。
- **AC-3**: `vitest.config.ts` の `coverage.exclude` から `**/*.test.{ts,tsx}` 行が削除され、`**/*.spec.{ts,tsx}` のみが残ること。
- **AC-4**: `scripts/hooks/block-test-suffix.sh` が新規実装され、staged ファイルに `*.test.ts(x)` が含まれる場合 exit code 1 で reject すること。既存の `staged-task-dir-guard.sh` を改変せず、独立 script として配置すること。
- **AC-5**: `lefthook.yml` の `pre-commit.commands` に `block-test-suffix` が追加され、既存 commands（`main-branch-guard` / `staged-task-dir-guard`）と並列実行可能であること。
- **AC-6**: `.github/workflows/verify-test-suffix.yml` が新規追加され、`push` (branches: main, dev) と `pull_request` で trigger し、`*.test.ts(x)` を 1 件でも検出したら job が fail すること。
- **AC-7**: `pnpm test --run` 実行時の `numTotalTests` が rename 前後で同一であること（discovery 漏れ・silent skip がないこと）。Phase 11 evidence に before/after の JSON 出力を保存する。
- **AC-8**: `CLAUDE.md` に「新規 test ファイルは `*.spec.{ts,tsx}` のみ」が 1 行追記され、ADR (`test-file-suffix-adr.md`) に「2026-05-12: 二段階対応終了」追記が存在すること。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-02/{rename-strategy.md, vitest-config-diff.md, lefthook-script-design.md, verify-workflow-design.md, adr-update-plan.md} |
| 3 | タスク分解 | phase-03.md | spec_created | outputs/phase-03/task-breakdown.md |
| 4 | 実装計画（rename 実施） | phase-04.md | spec_created | outputs/phase-04/implementation-plan.md |
| 5 | vitest.config 収斂 | phase-05.md | spec_created | outputs/phase-05/implementation-summary.md |
| 6 | lefthook pre-commit gate | phase-06.md | spec_created | outputs/phase-06/test-plan.md |
| 7 | GitHub Actions verify-test-suffix | phase-07.md | spec_created | outputs/phase-07/refactor-summary.md |
| 8 | ドキュメント追従 | phase-08.md | spec_created | outputs/phase-08/documentation-sync.md |
| 9 | テスト戦略 | phase-09.md | spec_created | outputs/phase-09/test-strategy.md |
| 10 | 品質ゲート | phase-10.md | spec_created | outputs/phase-10/gate-summary.md |
| 11 | Evidence 収集 | phase-11.md | spec_created | outputs/phase-11/test-report.md |
| 12 | 正本同期 | phase-12.md | spec_created | outputs/phase-12/strict 7 files |
| 13 | PR・振り返り | phase-13.md | spec_created | outputs/phase-13/pr-checklist.md |

## 主要成果物（Phase 1-3）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物（AC-1〜AC-8 確定、4 条件評価、既存資産インベントリ） |
| ドキュメント | outputs/phase-02/rename-strategy.md | rename 戦略（`git mv` 一括スクリプト方針、159件の対象列挙、import-path 影響評価） |
| ドキュメント | outputs/phase-02/vitest-config-diff.md | vitest.config.ts の before/after diff 設計 |
| ドキュメント | outputs/phase-02/lefthook-script-design.md | `scripts/hooks/block-test-suffix.sh` の I/O・exit code・並列性設計 |
| ドキュメント | outputs/phase-02/verify-workflow-design.md | `.github/workflows/verify-test-suffix.yml` の trigger / steps / failure condition 設計 |
| ドキュメント | outputs/phase-02/adr-update-plan.md | ADR / CLAUDE.md / skill changelog の追記方針 |
| ドキュメント | outputs/phase-03/task-breakdown.md | Phase 4 以降のタスク粒度設計と依存マップ |

## 不変条件

1. rename は必ず `git mv` で実施し、git の rename 検出が効くようにする（contents 変更と同時 commit 禁止）
2. lefthook の新規 command 名は **`block-test-suffix`** で固定。bash script は `scripts/hooks/block-test-suffix.sh` で固定
3. GitHub Actions workflow ファイル名は **`.github/workflows/verify-test-suffix.yml`** で固定
4. CI gate は既存 hook（`staged-task-dir-guard` / `main-branch-guard`）を改変せず、独立 step として並列追加する
5. coverage delta は ±0%（rename のみで実体不変）。逸脱した場合は rename 漏れ・include 設定漏れを示唆するので Phase 11 で再調査
6. vitest.config.ts の編集と CI gate 追加は同一 PR / 同一 commit 群に含める（gate なしの収斂状態を作らないため）
7. `__tests__` ディレクトリの名称変更は対象外（suffix のみ変更）
8. fixture や mock など test 本体以外のファイル名は変更しない（`*.test.ts(x)` 拡張子に限定）

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| rename 漏れにより include 収斂後に silent skip が発生し、`numTotalTests` が減少 | AC-7 で before/after `numTotalTests` 一致を強制。Phase 11 で JSON evidence 保存 |
| `*.test.ts(x)` を import している他ファイル（fixture import 等）が壊れる | Phase 2 rename-strategy で `grep -r "\.test'" src/` 影響範囲を事前評価、Phase 4 で `tsc --noEmit` を rename 直後に必須化 |
| `block-test-suffix` が既存 hook と競合し pre-commit 全体が壊れる | 独立 script 配置 + lefthook の `parallel: true` を活用、Phase 2 lefthook-script-design で動作確認手順を明記 |
| 159 件の rename を 1 commit にまとめると review 困難 | Phase 3 で「rename commit / config 編集 commit / CI gate commit / ドキュメント commit」の 4 分割方針を確定 |
| GitHub Actions の新 workflow が他 verify workflow と naming/permissions 衝突 | Phase 2 verify-workflow-design で既存 `.github/workflows/verify-*.yml` を全列挙し命名を確定 |
| .claude/skills 配下のテストフィクスチャ 7 件の rename が AI memory に影響 | Phase 2 で skill 自体の changelog 追記対象として明記、indexes 再生成も Phase 4 工程に含める |

## 注意点

- Issue #623 は GitHub 上で CLOSED だが、本タスクでは close のまま spec_created として進行する（ユーザー明示指示）
- 親 #325 の Phase 12 ADR (`test-file-suffix-adr.md`) が「二段階対応中」のまま停滞しているため、本タスクの完了をもって ADR に「二段階対応終了 2026-05-12」を追記する
- 本タスクの実装完了に伴い、原典は `docs/30-workflows/completed-tasks/task-issue-325-followup-003-vitest-spec-suffix-convergence.md` へ移動済み。full `pnpm test --run` `numTotalTests` parity は CI/runtime evidence pending として扱う。
