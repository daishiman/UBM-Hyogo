# Phase 7: AC マトリクス（受入条件 × Phase × 検証コマンド）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill ledger hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス（AC-1〜AC-11 のカバレッジ確認） |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | template_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |
| GitHub Issue | #161 |

## 目的

GitHub Issue #161 原典 AC-1〜AC-5 と、本ワークフローで拡張した AC-6〜AC-11 が T1〜T10（Phase 4 + Phase 6）と Phase 5 ランブック / Phase 11 smoke でどのように被覆されるかを **AC × Phase × 検証コマンド × 担当成果物** のマトリクスとして固定する。「全テスト一律 PASS」のような薄いゴールは禁止。Phase 9 / Phase 10 で本マトリクスを GO/NO-GO の根拠として再利用する。

## 依存タスク順序（A-2 完了必須）

A-2 完了は Phase 5 Step 0 ゲートで担保済み。本 Phase は AC-5 を「Step 0 ゲート通過」として明示的に表化する。

## 実行タスク

- タスク1: AC-1〜AC-11 を T1〜T10 と Phase / 検証コマンド / 担当成果物にマッピングする。
- タスク2: 「全 AC が最低 1 つの T で被覆」「全 T が最低 1 つの AC に紐付く」双方向整合を確認する。
- タスク3: 実走証跡（coverage-report.md / smoke ログ）の保存先を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md | AC-1〜AC-5 原典 |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-04.md | T1〜T5 |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-05.md | Step 0〜4 / コミット粒度 |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-06.md | T6〜T10 |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-07.md | カバレッジ表フォーマット参照 |

## 実行手順

1. AC-1〜AC-11 と T1〜T10 を縦軸 / 横軸に取り対応マトリクスを作成する。
2. 各セルに主たる検証コマンド / 期待値を記載する。
3. 担当成果物（hook script / smoke ログ / coverage-report.md）を AC ごとに紐付ける。

## 統合テスト連携

Phase 9 品質保証 / Phase 10 最終レビューで本マトリクスを GO/NO-GO の根拠として再利用する。Phase 11 smoke 実走後に各セルに ◎（PASS）を記入することで AC 達成証跡となる。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-07/main.md | AC × T マトリクス / Phase 対応 / 検証コマンド（pending のため骨格のみ予約） |
| 証跡（実走時） | outputs/phase-07/ac-coverage-report.md | 実装担当者が別 PR で記入 |
| メタ | artifacts.json `phases[6].outputs` | `outputs/phase-07/main.md` |

## AC × Phase × 検証コマンド マトリクス

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
| 検証コマンド | `pnpm indexes:rebuild && git status --porcelain` / `pnpm indexes:rebuild && t1=$(git write-tree) && pnpm indexes:rebuild && t2=$(git write-tree) && [ "$t1" = "$t2" ]` |
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

### AC-4: 4 worktree 並列再生成 smoke で `git ls-files --unmerged \| wc -l` が `0` になる

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
| 対応 Phase | Phase 5 Step 0（実装着手前ゲート）/ Phase 6 T10 |
| 検証コマンド | `gh issue view 130 --json state` / `git log --oneline --grep "skill-ledger-a2"` |
| 期待値 | Issue #130 が `CLOSED` / マージコミットが履歴に存在 |
| 担当成果物 | Phase 5 Step 0 ゲート記述 / hook 有効化前の Issue 状態検査（Phase 12 申し送り候補） |

### AC-6: `wait $PID` ごとの return code 個別集約が 4 worktree smoke 系列に組み込まれている

| 項目 | 内容 |
| --- | --- |
| 対応 T | T5 / T7 |
| 対応 Phase | Phase 5 Step 4 / Phase 6 T7 / Phase 11 |
| 検証コマンド | `rg -n 'for .*pid|wait \"\\$pid\"|wait \"\\$p\"' docs/30-workflows/skill-ledger-t6-hook-idempotency phase-*.md` |
| 期待値 | PID 配列と個別 `wait` が記述されている |
| 担当成果物 | full smoke 手順 / `manual-smoke-log.md` |

### AC-7: 2 worktree 事前 smoke → 4 worktree full smoke の二段構えが固定されている

| 項目 | 内容 |
| --- | --- |
| 対応 T | T4 / T5 |
| 対応 Phase | Phase 5 Step 3〜4 / Phase 11 |
| 検証コマンド | `rg -n '2-worktree|4-worktree|二段' docs/30-workflows/skill-ledger-t6-hook-idempotency` |
| 期待値 | 2 worktree PASS 後のみ 4 worktree へ進む gate がある |
| 担当成果物 | Phase 11 smoke ログ |

### AC-8: ロールバック設計が 1〜2 コミット粒度として固定されている

| 項目 | 内容 |
| --- | --- |
| 対応 T | T1 / T2 |
| 対応 Phase | Phase 2 / Phase 5 |
| 検証コマンド | `rg -n 'git revert|コミット 1|コミット 2|ロールバック' docs/30-workflows/skill-ledger-t6-hook-idempotency` |
| 期待値 | hook guard と JSON recovery が分離され、revert 境界が明記されている |
| 担当成果物 | Phase 5 実装ランブック |

### AC-9: taskType / visualEvidence / scope が artifacts metadata と一致している

| 項目 | 内容 |
| --- | --- |
| 対応 T | metadata validation |
| 対応 Phase | Phase 1 / Phase 9 |
| 検証コマンド | `node -e 'const a=require(\"./docs/30-workflows/skill-ledger-t6-hook-idempotency/artifacts.json\"); console.log(a.metadata.taskType,a.metadata.visualEvidence,a.metadata.scope)'` |
| 期待値 | `implementation NON_VISUAL infrastructure_governance` |
| 担当成果物 | `artifacts.json` / `index.md` |

### AC-10: Phase 3 で代替案 4 案以上を PASS/MINOR/MAJOR で評価し、base case D を確定している

| 項目 | 内容 |
| --- | --- |
| 対応 T | design review gate |
| 対応 Phase | Phase 3 |
| 検証コマンド | `rg -n '^\\| [A-D] \\|' docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-03.md` |
| 期待値 | A〜D の 4 案、D = PASS with notes |
| 担当成果物 | `outputs/phase-03/main.md` |

### AC-11: 4 条件が Phase 1 / Phase 3 で PASS 確認されている

| 項目 | 内容 |
| --- | --- |
| 対応 T | review gate |
| 対応 Phase | Phase 1 / Phase 3 / Phase 10 |
| 検証コマンド | `rg -n '価値性 \\| PASS|実現性 \\| PASS|整合性 \\| PASS|運用性 \\| PASS' docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-01.md docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-03.md` |
| 期待値 | 4 条件すべて PASS |
| 担当成果物 | Phase 1 / Phase 3 / Phase 10 |

## AC × T 双方向対応表

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
> **全 AC が最低 1 つの ◎ を持つこと** がカバレッジ要件 PASS の必要条件。

## 「変更ブロック AC 100%」の運用ルール

1. PR の diff（コミット 1〜2）に対して `git diff --stat <base>..HEAD` を取得。
2. AC-1〜AC-11 すべてが上記マトリクスで最低 1 つの ◎ を持つことを確認。
3. 「全テスト一律 PASS」のような薄い表記は **禁止**（AC 単位での被覆を要求）。
4. CI gate 化される検証コマンドを AC ごとに 1 つ以上指定する。

## 証跡保存先

| 種別 | パス | 記入タイミング |
| --- | --- | --- |
| AC マトリクス（本仕様） | outputs/phase-07/main.md | 本ワークフロー（spec 作成時 / pending） |
| AC カバレッジレポート（実走証跡） | outputs/phase-07/ac-coverage-report.md | 実装担当者が別 PR で記入 |
| smoke ログ | outputs/phase-11/manual-smoke-log.md | Phase 11 で実走 |

## 完了条件

- [ ] AC-1〜AC-11 が `outputs/phase-07/main.md` にマトリクス化されている
- [ ] AC × T 双方向対応表が空セルなく埋まっている（全 AC に最低 1 つ ◎）
- [ ] 各 AC に対応する検証コマンド・期待値・担当成果物が記述されている
- [ ] 「全テスト一律 PASS」表記が **無い** ことが確認されている
- [ ] 実走（ac-coverage-report.md 記入）は別 PR に委ねる旨が明示されている

## 検証コマンド（仕様確認用）

```bash
test -f docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-07.md
rg -c "^### AC-[0-9]+:" docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-07.md
# => 11
rg -q "全テスト一律" docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-07.md && echo NG || echo OK
# => OK
rg -c "◎" docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-07.md
# => 5 以上（全 AC に最低 1 つの主被覆）
```

## 苦戦防止メモ

1. **「全テスト一律 PASS」と書かない**: AC 単位の被覆を要求する。マトリクス内に空行 AC があれば NO-GO。
2. **AC-4 は T4 + T5 の段階通過**: T4（2-worktree）を飛ばして T5 に行かない。
3. **AC-5 はテストではなく gate**: 実テスト不可。Phase 5 Step 0 のゲート通過記録を証跡とする。
4. **AC-3 の atomic write 要請**: `pnpm indexes:rebuild` 側にも tmp → rename を要請（generate-index.js）。
5. **本 Phase は計画のみ**: 実走 / 数値記入は別 PR。

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC マトリクスを Phase 9 品質保証 / Phase 10 GO/NO-GO の根拠に再利用
  - `ac-coverage-report.md` の記入を実装担当者に申し送り
- ブロック条件:
  - AC のいずれかが空セル（被覆 T 不在）
  - 「全テスト一律 PASS」表記が混入
