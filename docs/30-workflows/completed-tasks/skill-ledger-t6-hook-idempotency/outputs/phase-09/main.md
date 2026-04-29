# Phase 9 成果物 — 品質保証（仕様レビュー観点）

> **本ワークフローのスコープ**: 本書はタスク仕様書整備（spec_created）のみが目的であり、実 hook 実装・実走 grep / jq / smoke は別 PR の責務である。本 Phase で行う「品質保証」は **仕様文書レベルでの静的レビュー** に限定し、実コマンドの実走 evidence は実装 PR 側で取得して `outputs/phase-07/ac-coverage-report.md` に記入する。

## 1. 目的とスコープ

Phase 1〜8 で固定した仕様が AC-1〜AC-11、skill-ledger 正本、Phase 1 / Phase 3 の判定基準と矛盾していないことを、本ワークフロー（仕様書整備）の責務範囲で確認する。

| 範囲 | 内容 |
| --- | --- |
| 含む（本ワークフロー） | 仕様文書内の禁止コマンド表記検査 / JSON 検査手順の文書化検査 / smoke 手順の文書化検査 / artifacts.json schema 検査 |
| 含まない（別 PR） | 実 hook の実走 grep / 実 `pnpm indexes:rebuild` 実行 / 4 worktree 並列 smoke 実走 / `outputs/phase-07/ac-coverage-report.md` の ◎ 記入 |

## 2. サブタスクごとの検査項目と PASS 基準

### 2.1 サブタスク 1 — 禁止コマンド検査（AC-1）

| 項目 | 内容 |
| --- | --- |
| 検査対象 | 仕様文書 / artifacts.json（実 hook 実装ファイルではない） |
| 検査コマンド（仕様レビュー） | `rg -n 'git (add\|stage\|update-index --add)' docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-*.md docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs` |
| PASS 基準 | hit が「禁止対象として記述している箇所」のみであり、「実行を許容する hook 手順」が無いこと |
| 実走（実装 PR） | `grep -nE 'git (add\|stage\|update-index --add)' lefthook.yml .lefthook 2>/dev/null \| wc -l` が `0` |
| 残課題 | 実 hook ファイルに対する CI gate（grep ベース）の有効化は実装 PR の責務 |

### 2.2 サブタスク 2 — JSON 検査（AC-3）

| 項目 | 内容 |
| --- | --- |
| 検査対象 | Phase 5 Step 2 ランブック / Phase 6 T6 / Phase 7 AC-3 行 |
| 検査コマンド（仕様レビュー） | `rg -n 'jq -e' docs/30-workflows/skill-ledger-t6-hook-idempotency` |
| PASS 基準 | 部分 JSON リカバリループ（`jq -e . \|\| rm`）と atomic write（tmp → rename）の両方が文書化されている |
| 実走（実装 PR） | `truncate -s 10 <file> && pnpm indexes:rebuild && jq -e . <file>` が exit 0 |
| 残課題 | generate-index.js 側の atomic write 実装は別 PR |

### 2.3 サブタスク 3 — smoke 手順検査（AC-4 / AC-6 / AC-7）

| 項目 | 内容 |
| --- | --- |
| 検査対象 | Phase 5 Step 3〜4 / Phase 8 `WORKTREE_COUNT` 変数化 / Phase 11 雛形 |
| 検査コマンド（仕様レビュー） | `rg -n 'WORKTREE_COUNT\|wait "\$pid"\|2-worktree\|4-worktree' docs/30-workflows/skill-ledger-t6-hook-idempotency` |
| PASS 基準 | 二段構え（2 → 4）が gate 化されており、`wait $PID` 個別集約が単一定義されている |
| 実走（実装 PR） | 4 worktree 並列実走後 `git ls-files --unmerged \| wc -l` が `0` |
| 残課題 | 実走ログ `outputs/phase-11/manual-smoke-log.md` の作成 |

### 2.4 サブタスク 4 — artifacts schema 検証（AC-9）

| 項目 | 内容 |
| --- | --- |
| 検査対象 | `docs/30-workflows/skill-ledger-t6-hook-idempotency/artifacts.json` |
| 検査コマンド（仕様レビュー） | `node .claude/skills/task-specification-creator/scripts/validate-schema.js --schema schemas/artifact-definition.json --data docs/30-workflows/skill-ledger-t6-hook-idempotency/artifacts.json` |
| PASS 基準 | schema 検証が exit 0、かつ `metadata.taskType=docs-only` / `metadata.docs_only=true` / `visualEvidence=NON_VISUAL` / `scope=infrastructure_governance` |
| 実走（実装 PR） | 同上（実装 PR でも回帰確認） |
| 残課題 | なし（本ワークフローで都度確認可能） |

## 3. 多角的チェック観点

| 観点 | 確認事項 | 結果（仕様レビュー段階） |
| --- | --- | --- |
| hook が canonical を書く経路を持っていないか | Phase 5 Step 1 のガード仕様で `git add` 系を明示禁止 | OK |
| A-2 / A-1 / B-1 の依存順序と矛盾していないか | Phase 5 Step 0 で A-2 (#130) gate を必須化 | OK |
| 品質確認が手動目視だけに依存していないか | 各 AC に CI gate 化可能な検証コマンドが指定されている | OK |
| DRY 化で AC が曖昧化していないか | Phase 8 で AC トレースを単一責務に固定済み | OK |
| 実走 evidence の取り扱い | `ac-coverage-report.md` への記入は別 PR Phase 11 後と明示 | OK |

## 4. 仕様レビュー結果サマリ

| サブタスク | 状態 | 備考 |
| --- | --- | --- |
| 1. 禁止コマンド検査 | spec PASS | 実走は実装 PR |
| 2. JSON 検査 | spec PASS | 実走は実装 PR、atomic write 実装も別 PR |
| 3. smoke 手順検査 | spec PASS | 実走は Phase 11（別 PR） |
| 4. artifacts 検査 | PASS | schema 検証は本ワークフローで都度実行可能 |

> 仕様レビュー段階での 4/4 サブタスク PASS。実走 evidence は別 PR の責務として明確化されている。

## 5. Phase 10 への残課題

1. **実走 evidence 不在**: 本ワークフローは spec_created 段階であり、grep / jq / smoke の実走 evidence は無い。Phase 10 の GO/NO-GO 判定では「仕様レビュー PASS / 実走 evidence は実装 PR の Phase 11 gate で取得」と整理する。
2. **`ac-coverage-report.md` の生成**: 実装担当者の Phase 11 完了時に作成。ファイル不在は本ワークフロー単体の NO-GO 要因ではない。
3. **CI gate（grep ベース）の有効化**: 実装 PR 側で `lefthook.yml` / CI workflow に grep ベースのチェックを追加すること。

## 6. 完了条件

- [x] 禁止コマンド検査（仕様レビュー）が PASS
- [x] JSON 検査（仕様レビュー）が PASS
- [x] smoke 手順検査（仕様レビュー）が PASS
- [x] artifacts schema 検証が PASS
- [x] Phase 10 への残課題が列挙されている

## 7. 次 Phase への引き渡し

- 次 Phase: 10（最終レビュー）
- 引き渡し:
  - サブタスク 4 件の仕様レビュー結果（4/4 PASS）
  - 残課題: 実走 evidence 取得は実装 PR 側 Phase 11 gate に委譲
  - 本ワークフローは spec_created で完了予定。Phase 13 はユーザー承認待ち blocked のまま
