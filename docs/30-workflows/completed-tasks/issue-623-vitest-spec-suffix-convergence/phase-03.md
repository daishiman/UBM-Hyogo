# Phase 3: タスク分解

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 4 以降で実行する rename / vitest.config 編集 / bash script 実装 / GitHub Actions workflow 実装の作業単位を、CONST_005（変更対象・I/F・テスト方針・実行コマンド・DoD）を満たす粒度に分解する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | タスク分解 |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (実装計画) |
| 状態 | spec_created |

## 目的

Phase 2 で確定した 5 設計成果物（D-1〜D-5）を、Phase 4 以降で 1 サイクル内に完了できる単一責務タスクへ分解する（CONST_007）。各タスクは「変更対象ファイル」「実行コマンド」「DoD」「依存関係」を明記し、Phase 4 実装計画がそのまま着手できる粒度とする。

## タスク粒度方針

- 1 タスク = 1 commit = 1 単一責務
- 159 件 rename は領域別に 6 タスクへ分割（apps/web / apps/api / packages/shared / packages/integrations / scripts / .claude/skills）
- 「設定変更」「rename」「CI gate」「ドキュメント」を別 commit に分け、bisect 容易性を確保
- 中間状態（rename 未完了で vitest.config を絞る、CI gate なしで収斂する）を作らない順序制約を保持

## タスク一覧（Phase 4 以降での実行対象）

| Task ID | 名称 | Phase | 変更対象 | 依存 | 想定 commit メッセージ |
| --- | --- | --- | --- | --- | --- |
| T-01 | rename 補助スクリプト作成 | Phase 4 | `scripts/migration/rename-test-to-spec.sh` | なし | `chore(test): add rename-test-to-spec.sh helper` |
| T-02 | apps/web rename | Phase 4 | apps/web 配下 83 件 | T-01 | `refactor(test): rename apps/web *.test.ts(x) to *.spec` |
| T-03 | apps/api rename | Phase 4 | apps/api 配下 6 件 | T-01 | `refactor(test): rename apps/api *.test.ts(x) to *.spec` |
| T-04 | packages/shared rename | Phase 4 | packages/shared 配下 17 件 | T-01 | `refactor(test): rename packages/shared *.test.ts(x) to *.spec` |
| T-05 | packages/integrations rename | Phase 4 | packages/integrations 配下 11 件 | T-01 | `refactor(test): rename packages/integrations *.test.ts(x) to *.spec` |
| T-06 | scripts rename | Phase 4 | scripts 配下 35 件 | T-01 | `refactor(test): rename scripts *.test.ts to *.spec` |
| T-07 | .claude/skills rename | Phase 4 | .claude/skills 配下 7 件 | T-01 | `refactor(test): rename skill fixtures *.test.ts to *.spec` |
| T-08 | indexes 再生成 | Phase 4 | `.claude/skills/aiworkflow-requirements/indexes/*.json` | T-07 | `chore(skills): regenerate indexes after suffix rename` |
| T-09 | import path 修正（必要時） | Phase 4 | import が壊れた箇所 | T-02〜T-07 | `fix(test): update import paths after suffix rename` |
| T-10 | vitest.config.ts 収斂 | Phase 5 | `vitest.config.ts` | T-02〜T-07 | `chore(test): collapse vitest include/exclude to *.spec only` |
| T-11 | `block-test-suffix.sh` 追加 | Phase 6 | `scripts/hooks/block-test-suffix.sh` | T-10 | `feat(hooks): add block-test-suffix pre-commit guard` |
| T-12 | `lefthook.yml` に command 追加 | Phase 6 | `lefthook.yml` | T-11 | `chore(hooks): wire block-test-suffix into lefthook` |
| T-13 | `verify-test-suffix.yml` 追加 | Phase 7 | `.github/workflows/verify-test-suffix.yml` | T-10 | `ci: add verify-test-suffix workflow` |
| T-14 | CLAUDE.md 追記 | Phase 8 | `CLAUDE.md` | T-10〜T-13 | `docs: forbid *.test suffix in CLAUDE.md` |
| T-15 | ADR 追記 | Phase 8 | `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md` | T-10〜T-13 | `docs(adr): record test suffix convergence (issue-623)` |
| T-16 | skill changelog 追記 | Phase 8 | `.claude/skills/*/SKILL-changelog.md` | T-08 | `docs(skills): record suffix convergence in changelog` |
| T-17 | unassigned-task ファイル移動 | Phase 12 | 原典タスクを `docs/30-workflows/completed-tasks/task-issue-325-followup-003-vitest-spec-suffix-convergence.md` として consumed 化 | 全 task 完了 | `docs(workflow): move issue-623 source task to completed-tasks` |
| T-18 | Phase 11 evidence 収集 | Phase 11 | `outputs/phase-11/` | T-10〜T-13 | `docs(evidence): record issue-623 phase-11 evidence` |
| T-19 | PR 作成 | Phase 13 | (GitHub 上) | 全 task | `gh pr create --base dev` |

## 依存関係マップ

```
T-01 ─┬─ T-02 ─┐
      ├─ T-03 ─┤
      ├─ T-04 ─┤
      ├─ T-05 ─┤
      ├─ T-06 ─┤
      └─ T-07 ─┴─ T-08 ─┐
                        ├─ T-09 ── T-10 ─┬─ T-11 ── T-12 ─┐
                        │                └─ T-13 ─────────┤
                        │                                  ├── T-18 ── T-14, T-15, T-16 ── T-17 ── T-19
                        └─────────────────────────────────┘
```

## 各タスクの DoD（CONST_005 / CONST_007 準拠・1 サイクル完結）

### T-01: rename 補助スクリプト作成

- **変更対象**: `scripts/migration/rename-test-to-spec.sh`（新規）
- **シグネチャ**: `rename-test-to-spec.sh <path> [--dry-run]` / exit 0,1,2
- **実行コマンド**: `bash scripts/migration/rename-test-to-spec.sh apps/web --dry-run`
- **DoD**: dry-run で 83 件 list 出力、`git status` dirty で exit 1、path 不正で exit 2

### T-02〜T-07: rename タスク群

- **変更対象**: 各領域の `*.test.ts(x)` ファイル
- **実行コマンド**: `bash scripts/migration/rename-test-to-spec.sh <領域>`
- **DoD**: `git diff --stat` で rename 件数が領域分布と一致、`git log -1 --diff-filter=R --name-status` で `R100` が並ぶ（履歴保持）、`mise exec -- pnpm typecheck` PASS

### T-08: indexes 再生成

- **変更対象**: `.claude/skills/aiworkflow-requirements/indexes/*.json`
- **実行コマンド**: `mise exec -- pnpm indexes:rebuild`
- **DoD**: indexes に suffix 揺れが残らない、`verify-indexes` job が green

### T-09: import path 修正

- **変更対象**: `grep -rE "from ['\"].+\.test['\"]" apps packages scripts` のヒット箇所
- **実行コマンド**: `mise exec -- pnpm typecheck`
- **DoD**: typecheck PASS、grep 結果 0 hit

### T-10: vitest.config.ts 収斂

- **変更対象**: `vitest.config.ts`
- **実行コマンド**:
  ```bash
  grep -E '\{test,spec\}' vitest.config.ts  # 0 hit
  grep -E '\*\.test\.\{ts,tsx\}' vitest.config.ts  # 0 hit
  mise exec -- pnpm test --run --reporter=json > /tmp/after.json
  jq '.numTotalTests' /tmp/after.json
  ```
- **DoD**: AC-2 / AC-3 / AC-7 充足、`numTotalTests` が rename 前と一致

### T-11: `block-test-suffix.sh` 追加

- **変更対象**: `scripts/hooks/block-test-suffix.sh`（新規）
- **シグネチャ**: 引数なし、stdin/stdout なし、stderr に検出パス、exit 0/1
- **実行コマンド**: 単体ではテスト不能。T-12 と組合せて Phase 11 で reproduce
- **DoD**: chmod 0755、`set -euo pipefail` 含む、bash -n で構文 OK

### T-12: lefthook.yml に command 追加

- **変更対象**: `lefthook.yml`
- **実行コマンド**:
  ```bash
  git checkout -b test/verify-block-test-suffix
  printf "import { describe, it } from 'vitest';\ndescribe('x', () => it('y', () => {}));\n" > apps/api/src/__tests__/dummy.test.ts
  git add apps/api/src/__tests__/dummy.test.ts
  git commit -m "test gate"  # 期待: exit 1
  ```
- **DoD**: dummy commit が reject される、既存 commands に影響なし

### T-13: `verify-test-suffix.yml` 追加

- **変更対象**: `.github/workflows/verify-test-suffix.yml`（新規）
- **実行コマンド**: ローカルで `act` または PR push で workflow を trigger
- **DoD**: `*.test.ts(x)` 0 件時に green、1 件以上で red

### T-14〜T-16: ドキュメント追記

- **変更対象**: CLAUDE.md / ADR / skill changelog
- **実行コマンド**: `git diff` で内容確認
- **DoD**: AC-8 充足、追記行が指定箇所に存在

### T-17: unassigned-task ファイル移動

- **変更対象**: 該当 md ファイルを `completed-tasks/` 配下へ `git mv`
- **DoD**: 実装完了後のみ実施。spec_created close-out 時点では移動せず、`outputs/phase-12/unassigned-task-detection.md` に未移動理由と実施条件を記録する

### T-18: Phase 11 evidence 収集

- **変更対象**: `outputs/phase-11/` 配下に before/after `numTotalTests` JSON、`*.test.*` 残存 `find` 結果、CI gate 動作 log
- **DoD**: AC-1 / AC-4 / AC-6 / AC-7 の evidence が揃う

### T-19: PR 作成

- **実行コマンド**: `gh pr create --base dev`
- **DoD**: PR URL が返り、`verify-test-suffix` job が green、CLAUDE.md PR 作成フローに従う

## 中間状態禁止制約（順序保証）

1. T-10（vitest.config 収斂）は T-02〜T-07（rename 全件）完了後にのみ実行（silent skip 防止）
2. T-12（lefthook command 追加）は T-10 完了後（block 対象が「過去から残った既存ファイル」ではなく「新規追加」に限定されるべきタイミング）
3. T-13（GitHub Actions）は T-10 完了後（main / dev push 時点で残存 0 件であるべき）
4. T-14〜T-16（ドキュメント）は T-10〜T-13 完了後（記録対象が確定してから追記）

## Phase 4 以降に渡すインプット（handoff）

Phase 4-13 を作成する別 agent に対し、本 Phase は以下を引き渡す:

| 項目 | 引き渡し内容 |
| --- | --- |
| タスク一覧 | T-01〜T-19（19 タスク） |
| 依存関係マップ | 上記グラフ |
| 各タスクの DoD | CONST_005 形式で本ファイルに記載 |
| 順序制約 | rename → vitest.config 編集 → CI gate → ドキュメント（不可逆） |
| 検証コマンド | `find` / `grep` / `pnpm test --reporter=json` / `jq .numTotalTests` |
| Phase 4 想定 | T-01〜T-13 を実装計画として配置 |
| Phase 5 (実装) | T-01〜T-13 を実行 |
| Phase 6 (テスト) | typecheck / lint / test を実行 |
| Phase 7 (リファクタ) | 該当なし（rename のみ） |
| Phase 8 (パフォーマンス) | 該当なし |
| Phase 9 (セキュリティ) | CI gate 追加によりリスク低減のみ。新規攻撃面なし |
| Phase 10 (アクセシビリティ) | 該当なし（NON_VISUAL） |
| Phase 11 (evidence) | T-18 を配置、AC-1/4/6/7 の evidence を outputs/phase-11/ に保存 |
| Phase 12 (正本同期) | T-14〜T-17、CLAUDE.md / ADR / skill changelog / unassigned-task 移動 |
| Phase 13 (PR) | T-19、`gh pr create --base dev`、`.claude/commands/ai/diff-to-pr.md` 準拠 |

## CONST_007 充足チェック（1 サイクル完結）

| タスク | 1 サイクル完結？ | 根拠 |
| --- | --- | --- |
| T-01〜T-19 | YES | 各タスクは 1 commit 範囲・1 検証ループで完了。先送り項目なし |

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | テスト規約（Phase 12 で追記時参照） |
| `.claude/skills/aiworkflow-requirements/indexes/` | T-08 で再生成対象 |
| `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Phase 12 同期手順 |

## DoD (Phase 3 完了基準)

- [ ] T-01〜T-19 のタスク一覧が記載されている
- [ ] 依存関係マップが記載されている
- [ ] 各タスクの変更対象 / 実行コマンド / DoD が CONST_005 形式で明記されている
- [ ] 順序制約（rename → vitest.config → CI gate → docs）が記録されている
- [ ] Phase 4 以降に渡す handoff が表形式で整理されている
- [ ] CONST_007（1 サイクル完結）が全タスクで充足されている

## 次 Phase

- 次: 4 (実装計画) — 別 agent が作成
- 引き継ぎ事項: T-01〜T-19、依存関係マップ、順序制約、Phase 4-13 の責務割り当て
- ブロック条件: T-01〜T-19 の DoD のいずれかが未記入、または順序制約が未記録の場合は Phase 4 に進まない

## 実行タスク

- T-01〜T-19 の phase mapping / dependency / DoD を確定する。

## 参照資料

- `index.md`
- `phase-02.md`

## 成果物/実行手順

- `outputs/phase-03/task-breakdown.md`

## 完了条件

- タスク分解と依存関係が `artifacts.json` と一致している。

## 統合テスト連携

- Phase 9 / 10 の gate に T-18 evidence 収集を接続する。
