# Phase 7 成果物 — AC マトリクス（受入条件 × Phase × 検証コマンド）

> **本ワークフローのスコープ**: 本書はタスク仕様書整備（spec_created）のみが目的であり、実 hook 実装・smoke 実走は別 PR の責務である。本 Phase で固定するのは AC × T × Phase × 検証コマンド × 担当成果物のマトリクスと、運用ルール（「全テスト一律 PASS」表記禁止）まで。実走証跡（`outputs/phase-07/ac-coverage-report.md` への ◎ 記入）は実装担当者が別 PR の Phase 11 smoke 後に更新する。

## 1. 目的とスコープ

GitHub Issue #161 原典 AC-1〜AC-5 と本ワークフローで拡張した AC-6〜AC-11 を、Phase 4 で抽出した T1〜T5 + Phase 6 で抽出した T6〜T10 と Phase 5 ランブック（Step 0〜4）/ Phase 11 smoke にマッピングし、被覆漏れがないことを双方向に確認する。Phase 9 品質保証および Phase 10 GO/NO-GO 判定は本マトリクスを根拠とする。

| 範囲 | 内容 |
| --- | --- |
| 含む | AC × T × Phase × 検証コマンド × 期待値 × 担当成果物 |
| 含む | AC × T 双方向対応表（◎ 主被覆 / ◎(注記) 補助被覆 / -）|
| 含まない | hook 実コード、smoke 実走ログ、`ac-coverage-report.md` の ◎ 記入 |

## 2. AC ごとの対応表

### AC-1: hook は `git add` / `git stage` / `git update-index --add` を呼ばない

| 項目 | 内容 |
| --- | --- |
| 対応 T | T1（hook 冪等性） |
| 対応 Phase | Phase 5 Step 1 / Phase 11 smoke |
| 検証コマンド | `grep -nE 'git (add\|stage\|update-index --add)' lefthook.yml .lefthook 2>/dev/null \| wc -l` |
| 期待値 | `0` |
| 担当成果物 | hook script diff（コミット 1）/ CI gate（grep ベース） |

### AC-2: 派生物が存在する場合は再生成をスキップし tracked canonical を上書きしない

| 項目 | 内容 |
| --- | --- |
| 対応 T | T1 / T3 / T9 |
| 対応 Phase | Phase 5 Step 1 / Phase 6 T9 |
| 検証コマンド | `pnpm indexes:rebuild && git status --porcelain` および `pnpm indexes:rebuild && t1=$(git write-tree) && pnpm indexes:rebuild && t2=$(git write-tree) && [ "$t1" = "$t2" ]` |
| 期待値 | `git status --porcelain` 空 / `t1 == t2` |
| 担当成果物 | hook script の `[[ -f <target> ]] && continue` ガード / generate-index.js の決定論的出力 |

### AC-3: `pnpm indexes:rebuild` 失敗時の部分 JSON リカバリ手順を確立する

| 項目 | 内容 |
| --- | --- |
| 対応 T | T2 / T6 |
| 対応 Phase | Phase 5 Step 2 / Phase 6 T6 |
| 検証コマンド | `truncate -s 10 <file> && pnpm indexes:rebuild && jq -e . <file>` / 中断シナリオ（T6） |
| 期待値 | 再生成後 `jq -e .` exit 0 |
| 担当成果物 | 部分 JSON 検出ロジック（コミット 2）/ atomic write（tmp → rename） |

### AC-4: 4 worktree 並列再生成 smoke で `git ls-files --unmerged \| wc -l` が `0`

| 項目 | 内容 |
| --- | --- |
| 対応 T | T4（2-worktree 前段）/ T5（4-worktree 本体）/ T7 / T8 / T9 |
| 対応 Phase | Phase 5 Step 3〜4 / Phase 11 smoke |
| 検証コマンド | 4 worktree 並列 → 順次 merge → `git ls-files --unmerged \| wc -l` |
| 期待値 | `0` |
| 担当成果物 | `outputs/phase-11/manual-smoke-log.md`（実走ログ）/ `wait $PID` 個別集約スクリプト |

### AC-5: A-2 (#130) 完了前は実行しないことを gate として明記する

| 項目 | 内容 |
| --- | --- |
| 対応 T | T10（fail path / 履歴確認） |
| 対応 Phase | Phase 5 Step 0 / Phase 6 T10 |
| 検証コマンド | `gh issue view 130 --json state` / `git log --oneline --grep "skill-ledger-a2"` |
| 期待値 | Issue #130 が `CLOSED` / マージコミットが履歴に存在 |
| 担当成果物 | Phase 5 Step 0 ゲート記述 / hook 有効化前の Issue 状態検査 |

### AC-6: `wait $PID` ごとの return code 個別集約

| 項目 | 内容 |
| --- | --- |
| 対応 T | T5 / T7 |
| 対応 Phase | Phase 5 Step 4 / Phase 6 T7 / Phase 11 |
| 検証コマンド | `rg -n 'for .*pid\|wait "\$pid"\|wait "\$p"' docs/30-workflows/skill-ledger-t6-hook-idempotency phase-*.md` |
| 期待値 | PID 配列と個別 `wait` が記述されている |
| 担当成果物 | full smoke 手順 / `manual-smoke-log.md` |

### AC-7: 2 worktree → 4 worktree の二段構え固定

| 項目 | 内容 |
| --- | --- |
| 対応 T | T4 / T5 |
| 対応 Phase | Phase 5 Step 3〜4 / Phase 11 |
| 検証コマンド | `rg -n '2-worktree\|4-worktree\|二段' docs/30-workflows/skill-ledger-t6-hook-idempotency` |
| 期待値 | 2 worktree PASS 後のみ 4 worktree へ進む gate がある |
| 担当成果物 | Phase 11 smoke ログ |

### AC-8: ロールバック設計 1〜2 コミット粒度

| 項目 | 内容 |
| --- | --- |
| 対応 T | T1 / T2 |
| 対応 Phase | Phase 2 / Phase 5 |
| 検証コマンド | `rg -n 'git revert\|コミット 1\|コミット 2\|ロールバック' docs/30-workflows/skill-ledger-t6-hook-idempotency` |
| 期待値 | hook guard と JSON recovery が分離され、revert 境界が明記されている |
| 担当成果物 | Phase 5 実装ランブック |

### AC-9: taskType / visualEvidence / scope の整合

| 項目 | 内容 |
| --- | --- |
| 対応 T | metadata validation |
| 対応 Phase | Phase 1 / Phase 9 |
| 検証コマンド | `node -e 'const a=require("./docs/30-workflows/skill-ledger-t6-hook-idempotency/artifacts.json"); console.log(a.metadata.taskType,a.metadata.docs_only,a.metadata.visualEvidence,a.metadata.scope)'` |
| 期待値 | `docs-only true NON_VISUAL infrastructure_governance` |
| 担当成果物 | `artifacts.json` / `index.md` |

### AC-10: Phase 3 で代替案 4 案以上を PASS/MINOR/MAJOR 評価し base case D 確定

| 項目 | 内容 |
| --- | --- |
| 対応 T | design review gate |
| 対応 Phase | Phase 3 |
| 検証コマンド | `rg -n '^\| [A-D] \|' docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-03.md` |
| 期待値 | A〜D の 4 案、D = PASS with notes |
| 担当成果物 | `outputs/phase-03/main.md` |

### AC-11: 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS

| 項目 | 内容 |
| --- | --- |
| 対応 T | review gate |
| 対応 Phase | Phase 1 / Phase 3 / Phase 10 |
| 検証コマンド | `rg -n '価値性 \| PASS\|実現性 \| PASS\|整合性 \| PASS\|運用性 \| PASS' docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-01.md docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-03.md` |
| 期待値 | 4 条件すべて PASS |
| 担当成果物 | Phase 1 / Phase 3 / Phase 10 |

## 3. AC × T 双方向対応表

| AC \ T | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | ◎ | - | - | - | - | - | - | - | - | - |
| AC-2 | ◎ | - | ◎ | - | - | - | - | - | ◎ | - |
| AC-3 | - | ◎ | - | - | - | ◎ | - | - | - | - |
| AC-4 | - | - | - | ◎ | ◎ | - | ◎ | ◎(境界) | ◎(基盤) | - |
| AC-5 | - | - | - | - | - | - | - | - | - | ◎ |
| AC-6 | - | - | - | - | ◎ | - | ◎ | - | - | - |
| AC-7 | - | - | - | ◎ | ◎ | - | - | - | - | - |
| AC-8 | ◎ | ◎ | - | - | - | - | - | - | - | - |
| AC-9 | - | - | ◎ | - | - | - | - | - | - | - |
| AC-10 | - | - | - | - | - | - | - | - | - | ◎ |
| AC-11 | - | - | - | - | - | - | - | - | - | ◎ |

> 凡例: ◎ = 主たる被覆、◎(注記) = 補助 / 境界条件被覆、- = 該当なし。
> **全 AC が最低 1 つの ◎ を持つこと** がカバレッジ要件 PASS の必要条件。本表は 11 行すべてに最低 1 つの ◎ がある状態で確定。

### T → AC 逆引き（全 T が最低 1 つの AC に紐付くことの確認）

| T | 主に紐付く AC |
| --- | --- |
| T1 | AC-1 / AC-2 / AC-8 |
| T2 | AC-3 / AC-8 |
| T3 | AC-2 / AC-9 |
| T4 | AC-4 / AC-7 |
| T5 | AC-4 / AC-6 / AC-7 |
| T6 | AC-3 |
| T7 | AC-4 / AC-6 |
| T8 | AC-4（境界） |
| T9 | AC-2 / AC-4（基盤） |
| T10 | AC-5 / AC-10 / AC-11 |

> T1〜T10 すべてが最低 1 つの AC に紐付く。空 T 無し。

## 4. 「全テスト一律 PASS」表記禁止の運用ルール

1. PR 説明・QA 報告・ac-coverage-report.md のいずれにおいても **「全テスト一律 PASS」「all green」等の薄い包括表現は禁止**。AC-1〜AC-11 単位で被覆 T と検証コマンドの結果（PASS / FAIL / SKIP の理由）を記載する。
2. PR の diff（コミット 1〜2）に対して `git diff --stat <base>..HEAD` を取得し、AC-1〜AC-11 の各 ◎ が当該 diff に紐付くことを確認する。
3. CI gate 化される検証コマンドを AC ごとに 1 つ以上指定する（AC-1 の grep、AC-3 の jq、AC-9 の artifacts schema など）。
4. 実走後の ◎ 書き換え（pending → PASS）は `outputs/phase-07/ac-coverage-report.md` に限定し、本マトリクス（main.md）は仕様骨格として保持する。

## 5. 証跡保存先

| 種別 | パス | 記入タイミング | 担当 |
| --- | --- | --- | --- |
| AC マトリクス（仕様骨格） | `outputs/phase-07/main.md` | 本ワークフロー（spec 作成時 / pending） | 仕様策定者 |
| AC カバレッジレポート（実走証跡） | `outputs/phase-07/ac-coverage-report.md` | Phase 11 smoke 完了後 | 実装担当者（別 PR） |
| 4 worktree smoke ログ | `outputs/phase-11/manual-smoke-log.md` | Phase 11 実走時 | 実装担当者（別 PR） |
| 部分 JSON リカバリ証跡 | smoke ログ内 / コミット 2 のテストログ | Phase 5 Step 2 実装時 | 実装担当者（別 PR） |

## 6. 本 Phase の完了状態

- [x] AC-1〜AC-11 が main.md にマトリクス化されている
- [x] AC × T 双方向対応表が空セルなく整合している（全 AC に最低 1 つ ◎、全 T が最低 1 つ AC に紐付く）
- [x] 各 AC に検証コマンド・期待値・担当成果物が記述されている
- [x] 「全テスト一律 PASS」表記禁止の運用ルールが固定されている
- [x] 実走（ac-coverage-report.md 記入）は別 PR に委ねる旨が明示されている

## 7. 次 Phase への引き渡し

- 次 Phase: 8（DRY 化）
- 引き渡し:
  - 本マトリクスを Phase 8 の重複検出対象（禁止コマンド検査・派生物存在スキップ・JSON パース検査）と紐付ける
  - Phase 9 品質保証および Phase 10 GO/NO-GO の根拠として再利用
  - `ac-coverage-report.md` の記入は実装 PR 側 Phase 11 後の必須作業として申し送り
- ブロック条件:
  - AC のいずれかに被覆 T 不在のセルが生じた場合
  - 「全テスト一律 PASS」表記が混入した場合
