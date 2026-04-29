# Phase 6: 異常系検証（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill ledger hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（fail path / 回帰 guard） |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | template_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |
| GitHub Issue | #161 |

## 目的

Phase 4 の T1〜T5（happy path）に加えて、**fail path / 回帰 guard** を T6〜T10 として固定する。本 Phase は「hook 中断時の半端 JSON」「`wait $PID` の return code 集約失敗」「merge=union 不在時の競合」「`pnpm indexes:rebuild` の非決定性」「A-2 未完了で T-6 を起動した場合の `LOGS.md` 履歴喪失リスク」の 5 観点を網羅する。

## 依存タスク順序（A-2 完了必須）

A-2（GitHub Issue #130）completed の前提は Phase 5 Step 0 ゲートで担保済み。本 Phase は Step 0 をパスした前提で fail path を扱う。T10 で「A-2 未完了起動」を異常系として明示的に検証する。

## 実行タスク

- タスク1: T6〜T10 の fail path を hook 中断 / wait 集約失敗 / merge=union 不在 / 非決定性 / A-2 境界の 5 軸で定義する。
- タスク2: 各 fail path に対する回帰 guard を Phase 5 / CI / Phase 11 のどこで gate 化するかを明記する。
- タスク3: 実走を別 PR に委譲する範囲を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-04.md | T1〜T5 happy path |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-05.md | 2 コミット粒度 / smoke 手順 |
| 必須 | docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md | AC-1〜AC-5 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-06.md | fail path フォーマット参照 |

## 実行手順

1. Phase 4 happy path と Phase 5 ランブックを確認する。
2. T6〜T10 をシナリオ / 検証コマンド / 期待値 / 対応に分解する。
3. Phase 7 AC マトリクス入力として引き渡す。

## 統合テスト連携

T6〜T10 は実装 PR 側の regression gate として実走する。本 Phase は fail path 仕様の正本化のみを行う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-06/main.md | T6〜T10 のテスト一覧 / 期待値 / 観測手順（pending のため骨格のみ予約） |
| メタ | artifacts.json `phases[5].outputs` | `outputs/phase-06/main.md` |

## 異常系テスト一覧

### T6: hook 中断時の半端 JSON 残留

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 対象 AC | AC-3 |
| 観点 | hook 実行中の SIGINT / kill による中断耐性 |
| シナリオ | `pnpm indexes:rebuild` 実行中に `kill -9 <pid>` を送る → 半端 JSON が `.cache.json` 等に残留 → 次回起動で valid 性チェックが失敗し再生成にフォールバックされるか |
| 検証コマンド | `pnpm indexes:rebuild & sleep 0.05 && kill -9 $! ; pnpm indexes:rebuild && jq -e . .claude/skills/*/indexes/*.json` |
| 期待値 | 全 JSON が valid（部分 JSON を検出 → 削除 → 再生成） |
| Red 状態（仕掛け） | 部分 JSON リカバリ（Phase 5 Step 2）を一時的に外して再走 → `jq` parse error が出れば regression 検出 |
| 対応 | Phase 5 Step 2 を必須化 / atomic write（tmp → rename）を generate-index.js 側に組み込む |

### T7: `wait $PID` の return code 個別集約失敗

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 対象 AC | AC-4 |
| 観点 | 並列再生成の失敗検出漏れ |
| シナリオ | 4 worktree のうち 1 worktree だけ exit 1 になる状態を仕込む（例: `pnpm indexes:rebuild` を `false` に置換） → `wait` を引数なしで呼ぶ実装だと最後の子しか return code を見ず、失敗が見逃される |
| 検証コマンド | smoke スクリプトの `for p in "${pids[@]}"; do wait "$p" \|\| rc=$?; done` を grep で確認 / 仕込んだ失敗 worktree を実走して exit code 1 が伝播するか |
| 期待値 | smoke スクリプトが exit code 1 で失敗を伝播する |
| Red 状態（仕掛け） | `wait` を引数なしで呼ぶ実装に書き換えて再走 → exit code 0 で smoke が PASS してしまえば regression |
| 対応 | Phase 5 Step 4 の `wait $PID` 個別集約パターンを CI gate 化（grep で `wait "$p"` の存在確認） |

### T8: merge=union 不在時の競合

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 対象 AC | AC-4（境界） |
| 観点 | A-1 単独で 4-worktree merge が 0 unmerged になる前提の検証 |
| シナリオ | `.gitattributes` に merge=union が設定されていない状態で、A-1 のみで 4-worktree smoke を走らせ、unmerged が 0 になるか確認 |
| 検証コマンド | `cat .gitattributes \| rg merge=union; cd .worktrees/A && pnpm indexes:rebuild; ... ; git ls-files --unmerged \| wc -l` |
| 期待値 | A-1 適用済みの場合、tracked canonical が無いため merge=union 無くても unmerged 0（T-6 単体で AC-4 達成） |
| Red 状態 | unmerged > 0 → A-1 適用が不完全 / B-1（merge=union）が必要なケースに該当 |
| 対応 | A-1 の `.gitignore` 適用と `git rm --cached` を再確認 / B-1 領域へ申し送り（Phase 8 DRY 化で B-1 と T-6 の境界を明記） |

### T9: `pnpm indexes:rebuild` の非決定性

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 対象 AC | AC-2 / AC-4 |
| 観点 | 同一入力に対する出力の安定性 |
| シナリオ | 同じ skill 状態に対して `pnpm indexes:rebuild` を 2 回連続実行し、`git write-tree` の hash が一致するか確認 |
| 検証コマンド | `pnpm indexes:rebuild && t1=$(git write-tree) && pnpm indexes:rebuild && t2=$(git write-tree) && [ "$t1" = "$t2" ]` |
| 期待値 | `t1 == t2`（hook 二重実行で tree 不変） |
| Red 状態 | tree hash が変動 → JSON シリアライズ順序が非決定 / mtime / 浮動小数 / Date.now() 等が混入 |
| 対応 | generate-index.js を確認し、key sort / 固定 timestamp / ロケール非依存出力を保証 |

### T10: A-2 未完了で T-6 を起動した場合の `LOGS.md` 履歴喪失（AC-5 違反）

| 項目 | 内容 |
| --- | --- |
| ID | T10 |
| 対象 AC | AC-5 |
| 観点 | A-2（task-skill-ledger-a2-fragment, #130）未完了状態での T-6 起動防止 |
| シナリオ | A-2 未完了状態で T-6 hook を有効化すると、`LOGS.md` 本体が hook の glob に巻き込まれて削除 / 上書き → 履歴喪失 |
| 検証コマンド | `git log --oneline --grep "skill-ledger-a2"` の存在確認 / `gh issue view 130 --json state` |
| 期待値 | A-2 が CLOSED / completed 状態であること。未完了なら hook を有効化しない |
| Red 状態 | A-2 未完了で hook を有効化 / `LOGS.md` が tracked から消える |
| 対応 | Phase 5 Step 0 のゲートを必ず通過 / hook 有効化時に Issue #130 状態を検査するスクリプトを CI に追加候補（Phase 12 unassigned-task-detection.md に申し送り） |

## fail path × 対応 AC / Phase 早見表

| ID | 観点 | 対応 AC | 対応 Phase |
| --- | --- | --- | --- |
| T6 | hook 中断耐性 | AC-3 | Phase 5 Step 2 / CI gate |
| T7 | wait 個別集約 | AC-4 | Phase 5 Step 4 / CI gate |
| T8 | merge=union 不在 | AC-4（境界） | Phase 8 DRY 化 / B-1 申し送り |
| T9 | 非決定性 | AC-2 / AC-4 | Phase 5 Step 1 / generate-index.js 側 |
| T10 | A-2 境界 | AC-5 | Phase 5 Step 0 ゲート |

## 完了条件

- [ ] T6〜T10 が `outputs/phase-06/main.md` に表化されている
- [ ] 各テストにシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応が記述されている
- [ ] hook 中断（T6）/ wait 集約（T7）/ merge=union（T8）/ 非決定性（T9）/ A-2 境界（T10）の 5 観点がカバーされている
- [ ] 実テスト走行は別 PR に委ねる旨が明示されている

## 検証コマンド（仕様確認用）

```bash
test -f docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-06.md
rg -c "^### T(6|7|8|9|10):" docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-06.md
# => 5
```

## 苦戦防止メモ

1. **T6 の atomic write**: `>` でリダイレクトすると中断時に半端ファイルが残る。`tmp file → mv` パターンを generate-index.js 側にも要請する。
2. **T7 の `wait` 落とし穴**: bash の `wait` は引数なしだと「最後の子の exit code」しか返さない。**配列 + 個別 wait** が AC-4 の必須実装。
3. **T8 は A-1 完了で本来発生しないはず**: それでも検証する理由は「A-1 適用漏れ」を早期検出するため。B-1 領域に flow しないよう境界を明記。
4. **T9 の非決定性**: `Date.now()` / `Object.keys()` のイテレーション順 / locale collation を generate-index.js 側で総点検。
5. **T10 は実走でなく履歴確認**: `LOGS.md` を実際に消す検証は破壊的なので絶対やらない。Issue #130 状態 + git log の確認のみ。
6. **本 Phase は実走しない**: 仕様化のみ。

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - T1〜T5（happy path）+ T6〜T10（fail path）の合計 10 件が Phase 7 AC マトリクスの入力
  - T7 / T10 を CI gate 候補として Phase 12 に申し送り
- ブロック条件:
  - hook 中断 / wait 集約 / 非決定性 / A-2 境界のいずれかが未カバー
  - AC-5 違反検出（T10）が欠落
