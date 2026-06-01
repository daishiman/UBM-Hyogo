# discovered-issues — 仕様書整備時点で検出された懸念

> 本ワークフローはタスク仕様書整備と実コード hardening。今回サイクルで追加検出された事象は実装サイクルで本ファイルへ追記する。

## 1. 仕様書整備時点で確認済みの懸念事項

| # | 懸念 | 影響 | 対応 / 緩和 |
| --- | --- | --- | --- |
| D-1 | hardening で出力文字列・JSON シリアライズ（`JSON.stringify(..., null, 2)`）を無意識に変えると index drift が出て CI fail | byte-identical 不変条件（AC-4）が崩れ、既存 CI が落ちる | 出力組み立てを Phase 8「残す重複」として不変に固定。QG-4 / S-1 で `git diff --quiet` を gate 化 |
| D-2 | `fs.rename` は同一 FS 上でのみ atomic。tmp を別 dir に置くと `EXDEV` で失敗 | atomic 保証が崩れ AC-2 不成立 | tmp は出力先と同一 `indexes/` dir に `<name>.tmp` で置く（Phase 2 D-1）。Phase 3 で MINOR として記録済み |
| D-3 | top-level `main().catch(...)` が import 時に即実行されると、spec test が import するだけで書き込みが走る | テスト不能 / 副作用で実 index を破壊 | CLI 実行ガード（`import.meta.url === pathToFileURL(process.argv[1]).href`）で囲む。TC-06 で回帰（AC-7） |
| D-4 | `extractHeadings` の silent catch を残すと、破損ファイルでも空 heading で「成功」扱いになり exit 0 | fail-fast が成立しない（AC-1 / AC-5 の穴） | ENOENT のみ空継続、その他 I/O エラーは context 付き throw に分離。TC-04 / TC-05 で両分岐確認 |
| D-5 | 失敗ログが `err.message` のみだと、どの skill / index / step で失敗したか特定できない | 原因切り分けが遠回りになる（AC-3 未達） | `[generate-index] <skill> / <index-file> <step> 失敗: <message>` の decisive フォーマットに統一 |
| D-6 | hardening 差分が `generate-index.js` 以外へ波及し scope が膨らむ | revert 1 コミット粒度が崩れる | 変更を `generate-index.js` + 新規 spec test の 2 件に限定。QG-7 / 手動 checklist §7 で `git status --porcelain` 確認 |
| D-7 | `task-specification-creator/scripts/generate-index.js` が同様の穴を持つが `indexes:rebuild` に未配線で本タスク scope 外 | 将来同等 hardening が必要になりうる | Phase 10 M-1 / Phase 12 unassigned-task-detection に未タスク候補として記録。新規 Issue 起票は user-gated |
| D-8 | NON_VISUAL タスクのため screenshot 系 evidence がなく、レビューで検証可能性が下がりがち | レビュー疲弊 | 回帰 spec test（TC-01〜07）+ CLI 回帰を一次 evidence とし、`screenshot-plan.json` でスクリーンショット不要を明示 |
| D-9 | Issue #229 を CLOSED のまま参照する運用がツール側で reopen 提案を出す可能性 | 運用ノイズ | index.md / artifacts.json で CLOSED 維持を明文化。reopen は実装サイクルでも行わない |

## 2. 今回サイクルで追記すべき項目（テンプレ）

| 項目 | 値 |
| --- | --- |
| 検出日 | PASS |
| 事象 | PASS |
| 影響範囲 | PASS |
| 一次切り分け | PASS |
| 戻し先 Phase | PASS |
| 関連 Issue | PASS |

## 3. 完了条件

- 仕様書整備フェーズでは D-1〜D-9 を反映済みとし、本ファイルが Phase 11 の懸念集約点であることを Phase 12 から参照できる状態にする。
- 実走（実装サイクル）で新規検出された事象のみ §2 テンプレを必要件数だけ追加する。
- **本ワークフロー時点での新規ブロッカー: 0 件**（D-1〜D-9 はすべて対応方針付き）。
