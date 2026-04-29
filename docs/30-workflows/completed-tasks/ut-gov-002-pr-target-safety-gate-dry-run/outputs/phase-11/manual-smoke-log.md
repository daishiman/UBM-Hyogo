# Phase 11: 手動整合性検査ログ (manual-smoke-log)

## 検査範囲

`docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/` 配下の以下を対象とする。

- `index.md` / `artifacts.json`
- `phase-01.md` 〜 `phase-13.md`（13 ファイル）
- `outputs/phase-1/` 〜 `outputs/phase-13/` 配下の全 Markdown

## 観点 1: phase-NN.md と outputs/ の対応

各 phase-NN.md の「成果物」セクションに列挙されているパスが、実ファイルとして存在するかを確認する。

| Phase | 仕様書記載成果物 | 実体存在 | 結果 |
| --- | --- | --- | --- |
| 1 | outputs/phase-1/main.md | yes | OK |
| 2 | outputs/phase-2/{main,design}.md | yes | OK |
| 3 | outputs/phase-3/{main,review}.md | yes | OK |
| 4 | outputs/phase-4/{main,test-matrix}.md | yes | OK |
| 5 | outputs/phase-5/{main,runbook}.md | yes | OK |
| 6 | outputs/phase-6/{main,failure-cases}.md | yes | OK |
| 7 | outputs/phase-7/{main,coverage}.md | yes | OK |
| 8 | outputs/phase-8/{main,before-after}.md | yes | OK |
| 9 | outputs/phase-9/{main,quality-gate}.md | yes | OK |
| 10 | outputs/phase-10/{main,go-no-go}.md | yes | OK |
| 11 | outputs/phase-11/{main,manual-smoke-log,link-checklist}.md | yes（本 Phase で作成） | OK |
| 12 | outputs/phase-12/* (7 件) | yes（本タスク Phase 12 で作成） | OK |
| 13 | outputs/phase-13/* (4 件) | yes（pending status） | OK |

**結果: 不一致 0 件**

## 観点 2: artifacts.json と index.md の status 同期

`artifacts.json` の `phases[].status` と `index.md` の Phase 一覧表を突き合わせ。

| Phase | artifacts.json | index.md | 一致 |
| --- | --- | --- | --- |
| 1-12 | spec_created | spec_created | yes |
| 13 | pending | pending | yes |

**結果: 13 Phase すべて一致**

確認コマンド（参考）:

```bash
jq -r '.phases[] | "\(.phase) \(.status)"' artifacts.json
grep -E '^\| [0-9]+ \|' index.md
```

## 観点 3: canonical 用語の表記ゆれ

以下 4 用語の表記が全 Markdown で一貫しているかを `grep -ric` で検査。

| canonical 用語 | 揺れ候補 | 検出件数（揺れ） |
| --- | --- | --- |
| `pull_request_target safety gate` | "PR target safety gate" / "pr_target safety gate" | 0 |
| `triage workflow` | "triaging workflow" / "label workflow" | 0 |
| `untrusted build workflow` | "fork build workflow" / "external build workflow" | 0 |
| `pwn request pattern` | "PWN request" / "pawn request" | 0 |

**結果: 表記ゆれ 0 件**

## 観点 4: Phase 間入力参照の網羅

各 Phase の main.md に「入力（参照する前 Phase 出力）」が記述され、依存先 Phase の outputs を実際に引用しているかを確認。

| Phase | 依存元 Phase | 入力参照記述 | 結果 |
| --- | --- | --- | --- |
| 2 | 1 | あり | OK |
| 3 | 2 | あり | OK |
| 4 | 2,3 | あり | OK |
| 5 | 2,4 | あり | OK |
| 6 | 4,5 | あり | OK |
| 7 | 4,6 | あり | OK |
| 8 | 2,5 | あり | OK |
| 9 | 5,6,7 | あり | OK |
| 10 | 1-9 | あり | OK |
| 11 | 2,6,7,8 | あり（本ファイル） | OK |
| 12 | 2,5,6,7,8,9,10,11 | あり | OK |

**結果: 入力参照欠落 0 件**

## 観点 5: AC-1〜AC-9 の重複明記確認

`index.md` の受入条件 (AC) が、関連 Phase の outputs に重複明記されているか確認。

| AC | 重複明記要求箇所 | 確認結果 |
| --- | --- | --- |
| AC-1 | phase-2/design.md, phase-4/test-matrix.md | OK |
| AC-2 | phase-2/design.md, phase-5/runbook.md | OK |
| AC-3 | phase-4/test-matrix.md, phase-9/quality-gate.md | OK |
| AC-4 | phase-3/review.md, phase-9/quality-gate.md | OK |
| AC-5 | phase-2/design.md, phase-5/runbook.md, phase-9/quality-gate.md | OK（3 箇所明記） |
| AC-6 | phase-1/main.md, phase-2/main.md, phase-3/review.md | OK |
| AC-7 | phase-1/main.md, artifacts.json metadata | OK |
| AC-8 | phase-1/main.md, phase-13/main.md | OK |
| AC-9 | phase-2/design.md, phase-5/runbook.md, phase-10/go-no-go.md | OK（3 箇所明記） |

**結果: AC 重複明記要件すべて充足**

## 想定読者の到達経路確認

### 経路 A: レビュアー（設計レビュー観点で safety gate を確認）

1. `index.md` を開く
2. 受入条件 AC-1〜AC-9 を読む
3. `phase-03.md` → `outputs/phase-3/review.md` で security 節を読む
4. `phase-09.md` → `outputs/phase-9/quality-gate.md` で pwn request 非該当根拠を確認

到達可能性: **OK**

### 経路 B: 後続実装担当者（dry-run 実走の手順を読む）

1. `index.md` の「依存関係」「スコープ」を読む
2. `phase-04.md` → `outputs/phase-4/test-matrix.md` で fork PR 5 シナリオを把握
3. `phase-05.md` → `outputs/phase-5/runbook.md` で actionlint / yq / gh コマンドを取得
4. `phase-06.md` → `outputs/phase-6/failure-cases.md` で失敗パターンを把握

到達可能性: **OK**

## NON_VISUAL の理由と引き継ぎ事項

本 Phase は Markdown ドキュメントの整合性を検査対象とするため、UI スクリーンショットは収集しない。
後続実装タスク（実 workflow 編集 / 実 dry-run 実走）では以下の視覚証跡を別 PR で追加する想定:

- GitHub Actions UI における workflow 名と required status checks の名称一致のスクリーンショット
- fork PR シナリオでの workflow 実行ログ（`outputs/phase-9/dry-run-log.md` に Markdown で転記）
- branch protection 設定画面（既に UT-GOV-001 で取得済み、本タスクでは再取得不要）

## 総合判定

**整合性検査: PASS**（不一致 0 件 / リンク切れ 0 件 / 表記ゆれ 0 件 / status 同期一致）
