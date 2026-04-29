# Phase 8 成果物 — DRY 化（重複検出と共通化計画）

> **本ワークフローのスコープ**: 本書はタスク仕様書整備（spec_created）のみが目的であり、実 hook 実装・smoke 実走は別 PR の責務である。本 Phase で行うのは「Phase 5〜7 で固定したロジック（禁止コマンド検査 / 派生物存在スキップ / JSON パース検査 / 二段 smoke）の重複検出と共通化計画の固定」であり、実コードの DRY 化は実装 PR の Phase 5 ランブック実行時に併せて行う。

## 1. 目的

Phase 5 実装ランブック・Phase 6 異常系 T6〜T10・Phase 7 AC マトリクスにわたって繰り返し参照される判定ロジックを単一責務へ畳み、AC-1〜AC-11 のトレースを失わないこと。

## 2. 重複検出結果

### 2.1 禁止コマンド検査（`git add` / `git stage` / `git update-index --add`）

| 出現箇所 | 用途 | 重複扱い |
| --- | --- | --- |
| Phase 5 Step 1 ランブック | hook script 実装の AC-1 ガード | 正本 |
| Phase 6 T10 | hook 内禁止コマンド残留検査（fail path） | 正本（Phase 5 と相互参照） |
| Phase 7 AC-1 行 | 検証コマンドとして `grep -nE 'git (add\|stage\|update-index --add)'` を記載 | 重複（Phase 5 を参照） |
| Phase 9 サブタスク 1 | 禁止コマンド検査 PASS 確認 | 重複（Phase 5 を参照） |

**共通化方針**: grep パターン文字列 `git (add|stage|update-index --add)` を Phase 5 Step 1 の単一定義箇所に固定し、Phase 6 / 7 / 9 はそこを参照する形に統一する（コピーではなく明示的な参照）。

### 2.2 派生物存在スキップ（`[[ -f <target> ]] && continue` 系）

| 出現箇所 | 用途 | 重複扱い |
| --- | --- | --- |
| Phase 5 Step 1 ランブック | hook ガード本体 | 正本 |
| Phase 6 T9 | 決定論性検証（`t1 == t2`） | 補完（fail path） |
| Phase 7 AC-2 行 | `git write-tree` 比較コマンド | 参照 |

**共通化方針**: ガードロジックは hook script 内部の単一関数として実装することを Phase 5 で要請。Phase 6 / 7 はテスト観点としてのみ記載し、実装ロジックを再掲しない。

### 2.3 JSON パース検査（`jq -e .` ループ）

| 出現箇所 | 用途 | 重複扱い |
| --- | --- | --- |
| Phase 5 Step 2 ランブック | 部分 JSON リカバリ正本 | 正本 |
| Phase 6 T6 | 中断シナリオの fail path | 正本（Phase 5 と相互参照） |
| Phase 7 AC-3 行 | `truncate -s 10 <file> && pnpm indexes:rebuild && jq -e .` | 重複（Phase 5 を参照） |
| Phase 9 サブタスク 2 | JSON 検査 PASS 確認 | 重複（Phase 5 を参照） |

**共通化方針**: リカバリループの実コード（`find ... -exec sh -c 'jq -e . "$1" >/dev/null || rm "$1"' _ {} \;`）は Phase 5 Step 2 を正本とし、Phase 6 / 7 / 9 から見た場合は「Phase 5 Step 2 を参照」と表記する。実装は generate-index.js の atomic write（tmp → rename）と組合わせる。

### 2.4 4 worktree 並列 smoke の `wait $PID` 個別集約

| 出現箇所 | 用途 | 重複扱い |
| --- | --- | --- |
| Phase 2 設計 | コマンド系列雛形 | 設計 |
| Phase 5 Step 4 ランブック | 実装ランブック正本 | 正本 |
| Phase 6 T7 | 並列 fail 集約検証 | 補完 |
| Phase 7 AC-6 行 | rg 検証 | 参照 |
| Phase 11 | 実走手順 | 実走 |

**共通化方針**: PID 配列と `wait "$pid"` ループは Phase 5 Step 4 のランブック節を正本とし、Phase 11 manual-smoke-log.md はそこを `WORKTREE_COUNT` のみ差し替えて使う形に統一する。

## 3. 共通化計画 — `WORKTREE_COUNT` 変数化

2 worktree 事前 smoke と 4 worktree full smoke は手順上 PID 数（並列度）以外は同一であり、別個の手順記述に展開すると drift の原因となる。

```bash
# 共通化スケルトン（Phase 5 Step 3〜4 ランブックの単一定義）
WORKTREE_COUNT="${WORKTREE_COUNT:-4}"   # 2 worktree 事前 smoke 時は WORKTREE_COUNT=2 で起動
pids=()
for i in $(seq 1 "$WORKTREE_COUNT"); do
  ( cd ".worktrees/wt-$i" && mise exec -- pnpm indexes:rebuild ) &
  pids+=("$!")
done
fail=0
for pid in "${pids[@]}"; do
  wait "$pid" || fail=$((fail+1))
done
test "$fail" -eq 0
git ls-files --unmerged | wc -l   # 期待値: 0
```

| 段階 | `WORKTREE_COUNT` | 用途 | 通過条件 |
| --- | --- | --- | --- |
| 2-worktree 事前 smoke | `2` | I/O 競合・hook 冪等性の早期検出 | `fail=0` かつ `unmerged=0` |
| 4-worktree full smoke | `4` | AC-4 本体検証 | `fail=0` かつ `unmerged=0` |

> 2 worktree が PASS する前に 4 worktree へ進むことは禁止（AC-7 二段構え）。

## 4. AC トレース更新（DRY 化後の参照先）

| AC | DRY 化前の参照 | DRY 化後の参照（単一責務） |
| --- | --- | --- |
| AC-1 | Phase 5 / 6 / 7 / 9 に grep 文字列が散在 | **Phase 5 Step 1 を正本**、他は参照 |
| AC-2 | Phase 5 / 6 T9 / 7 にガードロジックが点在 | **Phase 5 Step 1 を正本**、Phase 6 T9 は決定論性テストとして残す |
| AC-3 | Phase 5 Step 2 / 6 T6 / 7 / 9 に jq ループ | **Phase 5 Step 2 を正本**、他は参照 |
| AC-4 / AC-6 / AC-7 | Phase 2 / 5 Step 3〜4 / 6 T7 / 7 / 11 に PID ループ | **Phase 5 Step 3〜4 を正本**（`WORKTREE_COUNT` 変数化）、Phase 11 はそこを呼び出す |
| AC-5 | Phase 5 Step 0 / 6 T10 / 7 に gate 記述 | **Phase 5 Step 0 を正本**、他は参照 |
| AC-8 〜 AC-11 | Phase 1 / 3 / 7 のメタ情報 | 重複なし（既に単一箇所） |

## 5. 残した重複と理由

完全な重複除去は AC トレースの可読性を損ねるため、以下は意図的に残す。

| 重複箇所 | 残す理由 |
| --- | --- |
| Phase 7 AC マトリクスの検証コマンド列 | AC ごとの 1 行サマリとして必要。詳細は Phase 5 を参照する形を維持 |
| Phase 9 のサブタスクごとの検証コマンド | QA 実行時の self-contained チェックリストとして必要 |
| Phase 6 T6 / T9 / T10 の fail path 記述 | 異常系視点の独立性を保つため、Phase 5 と意図的に相互参照する |
| `WORKTREE_COUNT` ループ本体（Phase 5 と Phase 11） | Phase 11 は実走時に貼り付ける具体手順が必要。Phase 5 をテンプレートとして引用する形は維持 |

## 6. 共通化で AC が曖昧化していないことの確認

- AC-1: grep 文字列は Phase 5 Step 1 単一定義 → CI gate 化時にここを参照すれば一意 ✓
- AC-3: jq ループは Phase 5 Step 2 単一定義 → atomic write 要件と紐付き ✓
- AC-4: `WORKTREE_COUNT` 変数化により 2 / 4 worktree の差分が `2` か `4` のみに局所化 → AC-7 二段構えの gate 通過条件が明確 ✓
- AC-5: Phase 5 Step 0 ゲートが正本 → DRY 化で gate が消えていない ✓

## 7. 完了条件

- [x] 重複検出結果が 4 領域（禁止コマンド / 派生物スキップ / JSON / smoke ループ）について明記
- [x] `WORKTREE_COUNT` 変数化計画が固定されている
- [x] AC-1〜AC-11 の DRY 化後参照先が明示されている
- [x] 残した重複とその理由が記述されている
- [x] Phase 9 の検証入力としての参照先が更新済み

## 8. 次 Phase への引き渡し

- 次 Phase: 9（品質保証）
- 引き渡し:
  - 禁止コマンド検査 / JSON 検査 / smoke 手順検査 / artifacts schema 検証の 4 サブタスクは本 Phase で固定した正本箇所を参照する形で実施
  - `WORKTREE_COUNT` 変数化は Phase 11 manual-smoke-log.md のテンプレート化に直結
- ブロック条件:
  - AC トレース上、被覆 T が消えるような共通化を行った場合（本 Phase ではそのような共通化は採用していない）
