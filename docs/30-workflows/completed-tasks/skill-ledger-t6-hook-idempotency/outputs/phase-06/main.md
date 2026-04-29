# Phase 6 成果物 — 異常系検証（fail path / 回帰 guard / T6〜T10）

> **本ワークフローは仕様書整備に閉じる。** 本ファイルは `phase-06.md` の異常系仕様を成果物として正本化したものである。**T6〜T10 の実走（破壊的シナリオを含む）は実装担当者が別 PR で実施** する。本ワークフロー (`task-20260429-073916`) では実走しない。特に T10（A-2 未完了で hook 起動）は **実際に `LOGS.md` を消す検証を絶対に行わない**（履歴確認のみ）。

## 0. 前提

- T1〜T5 happy path は Phase 4 で固定済み。
- A-2（Issue #130）completed の前提は Phase 5 Step 0 ゲートで担保済み。本 Phase は Step 0 をパスした前提で fail path を扱う。
- T10 のみ「A-2 未完了起動」を境界条件として明示的に検証する（履歴確認方式）。

## 1. 異常系テスト一覧（T6〜T10）

### T6: hook 中断時の半端 JSON 残留

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 対象 AC | AC-3 |
| 観点 | hook 実行中の SIGINT / `kill -9` による中断耐性 |
| シナリオ | `pnpm indexes:rebuild` 実行中に強制終了 → 半端 JSON / `.cache.json` が残留 → 次回起動で valid 性チェックが破損を検出し再生成にフォールバックされるか |
| 検証コマンド | `pnpm indexes:rebuild & sleep 0.05 && kill -9 $! ; pnpm indexes:rebuild && jq -e . .claude/skills/*/indexes/*.json` |
| 期待値 | 全 JSON が valid（部分 JSON を検出 → 削除 → 再生成） |
| Red 状態（仕掛け） | Phase 5 Step 2 のリカバリを一時的に外して再走 → `jq` parse error が出れば regression 検出 |
| 対応 | Phase 5 Step 2 を必須化 ／ atomic write（tmp → rename）を `generate-index.js` 側に組み込む |

### T7: `wait $PID` の return code 個別集約失敗

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 対象 AC | AC-4 |
| 観点 | 並列再生成での失敗検出漏れ |
| シナリオ | 4 worktree のうち 1 worktree のみ exit 1 になる状態を仕込む（例: `pnpm indexes:rebuild` を `false` に置換）。`wait` を引数なしで呼ぶ実装だと最後の子プロセスの return code しか見ず、失敗が見逃される |
| 検証コマンド | smoke スクリプトを `rg 'wait "\$p"' scripts/` で確認 ／ 仕込んだ失敗 worktree を実走して exit code 1 が伝播するか |
| 期待値 | smoke スクリプトが exit code 1 で失敗を伝播する |
| Red 状態（仕掛け） | `wait`（引数なし）に書き換えて再走 → exit 0 で smoke が PASS してしまえば regression |
| 対応 | Phase 5 Step 4 の `wait $PID` 個別集約パターンを CI gate 化（grep で `wait "$p"` 存在確認 → Phase 9 / 12 申し送り） |

### T8: merge=union 不在時の競合（A-1 単体での AC-4 達成可否境界）

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 対象 AC | AC-4（境界） |
| 観点 | A-1 の `.gitignore` 適用と `git rm --cached` 完了で T-6 単体が AC-4 を満たせるか |
| シナリオ | `.gitattributes` に `merge=union` が **設定されていない** 状態で、A-1 のみで 4-worktree smoke を走らせ unmerged 数を確認 |
| 検証コマンド | `cat .gitattributes \| rg merge=union; (各 worktree で pnpm indexes:rebuild); git ls-files --unmerged \| wc -l` |
| 期待値 | A-1 適用済みの場合、tracked canonical が無いため `merge=union` 無くても unmerged 0（T-6 単体で AC-4 達成可） |
| Red 状態 | unmerged > 0 → A-1 適用が不完全 ／ B-1（`merge=union`）が必要なケースに該当 |
| 対応 | A-1 の `.gitignore` 適用と `git rm --cached` 再確認 ／ 必要なら B-1 領域へ申し送り（Phase 8 DRY 化で B-1 と T-6 の境界を明記） |

### T9: `pnpm indexes:rebuild` の非決定性

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 対象 AC | AC-2 / AC-4 |
| 観点 | 同一入力に対する出力の安定性（並列実行の前提条件） |
| シナリオ | 同じ skill 状態に対して `pnpm indexes:rebuild` を 2 回連続実行し、`git write-tree` の hash が一致するか確認 |
| 検証コマンド | `pnpm indexes:rebuild && t1=$(git write-tree) && pnpm indexes:rebuild && t2=$(git write-tree) && [ "$t1" = "$t2" ]` |
| 期待値 | `t1 == t2`（hook 二重実行で tree 不変） |
| Red 状態 | tree hash が変動 → JSON シリアライズ順序が非決定 ／ mtime / 浮動小数 / `Date.now()` / locale collation 等が混入 |
| 対応 | `generate-index.js` を確認し、key sort / 固定 timestamp / ロケール非依存出力を保証 |

### T10: A-2 未完了で T-6 を起動した場合の `LOGS.md` 履歴喪失（AC-5 違反）

| 項目 | 内容 |
| --- | --- |
| ID | T10 |
| 対象 AC | AC-5 |
| 観点 | A-2（task-skill-ledger-a2-fragment, Issue #130）未完了状態での T-6 起動防止 |
| シナリオ | A-2 未完了状態で T-6 hook を有効化すると、`LOGS.md` 本体が hook の glob に巻き込まれて削除 / 上書き → 履歴喪失。**実走による検証は破壊的なため絶対に行わない**。Issue #130 状態 + git log の履歴確認のみで判定する |
| 検証コマンド | `gh issue view 130 --json state` / `git log --oneline --grep "skill-ledger-a2"` |
| 期待値 | A-2 が `CLOSED` / `completed`。未完了なら hook を有効化しない（Phase 5 Step 0 ゲートで block） |
| Red 状態 | A-2 未完了で hook を有効化 ／ `LOGS.md` が tracked から消える |
| 対応 | Phase 5 Step 0 のゲートを必ず通過 ／ hook 有効化時に Issue #130 状態を検査するスクリプトを CI に追加候補（Phase 12 unassigned-task-detection.md に申し送り） |

## 2. fail path × 対応 AC × Phase 早見表

| ID | 観点 | 対応 AC | 検出箇所 | 回帰 guard 配置 Phase |
| --- | --- | --- | --- | --- |
| T6 | hook 中断耐性 | AC-3 | atomic write 不在で半端 JSON 残留 | Phase 5 Step 2 ／ CI gate（Phase 9 / 12） |
| T7 | `wait` 個別集約 | AC-4 | smoke スクリプト | Phase 5 Step 4 ／ CI gate（grep で `wait "$p"` 存在確認） |
| T8 | merge=union 不在 | AC-4（境界） | `.gitattributes` / A-1 適用状態 | Phase 8 DRY 化 ／ B-1 申し送り |
| T9 | 非決定性 | AC-2 / AC-4 | `generate-index.js` 出力 | Phase 5 Step 1 ／ `generate-index.js` 側で key sort 等 |
| T10 | A-2 境界 | AC-5 | Phase 5 Step 0 ゲート | Phase 5 Step 0 ／ Phase 12 unassigned-task-detection に CI 化候補 |

## 3. 実走範囲の境界（本ワークフロー外）

- 本 Phase の責務は **fail path 仕様の正本化** のみ。
- T6〜T9 の実走は **実装 PR の Phase 5 / 11 直後 regression gate** で行う。
- T10 は実走しない（履歴確認のみ）。CI 化候補として Phase 12 へ申し送る。

## 4. 苦戦防止メモ

1. **T6 の atomic write**: `>` 単純リダイレクトでは中断時に半端ファイルが残る。`tmpfile && mv tmpfile <target>` パターンを `generate-index.js` 側にも要請。
2. **T7 の `wait` 落とし穴**: bash の `wait` は引数なしだと「最後の子の exit code」しか返さない。**配列 + 個別 `wait $PID`** が AC-4 の必須実装。
3. **T8 は A-1 完了で本来発生しないはず**: それでも検証する理由は「A-1 適用漏れ」を早期検出するため。B-1 領域に flow しないよう境界を明記。
4. **T9 の非決定性**: `Date.now()` ／ `Object.keys()` のイテレーション順 ／ locale collation を `generate-index.js` 側で総点検。
5. **T10 は実走でなく履歴確認**: `LOGS.md` を実際に消す検証は破壊的なので絶対やらない。Issue #130 状態 + git log の確認のみ。
6. **本 Phase は実走しない**: 仕様化のみ。実走は別 PR。

## 5. 完了条件（成果物観点）

- [x] T6〜T10 が表化されている（ID / 対象 AC / 観点 / シナリオ / 検証コマンド / 期待値 / Red 状態 / 対応）
- [x] hook 中断（T6）／ wait 集約（T7）／ merge=union（T8）／ 非決定性（T9）／ A-2 境界（T10）の 5 観点が網羅されている
- [x] fail path × 対応 AC × Phase 早見表が固定されている
- [x] T10 を実走しない旨が明記されている
- [x] 本ワークフローでは実走しない旨が冒頭で明記されている

## 6. 次 Phase への引き渡し

- **次 Phase**: 7（AC マトリクス）
- **引き継ぎ事項**:
  - T1〜T5（happy path）+ T6〜T10（fail path）の合計 10 件が Phase 7 AC マトリクスの入力
  - T7 / T10 を CI gate 候補として Phase 12 unassigned-task-detection.md に申し送り
  - T8 の境界条件は Phase 8 DRY 化で B-1 と T-6 の境界記述に再利用
- **ブロック条件**:
  - hook 中断 / wait 集約 / 非決定性 / A-2 境界のいずれかが未カバー
  - AC-5 違反検出（T10）が欠落
