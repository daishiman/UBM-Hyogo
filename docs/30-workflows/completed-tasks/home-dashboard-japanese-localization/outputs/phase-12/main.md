# Phase 12 main — ドキュメント更新サマリ

> 正本: `_shared-context.md` 全体。本タスクは implemented_local_evidence_captured（ローカル実装・証跡取得済み）。

## 実施内容

ホーム画面の英語表記日本語化・eyebrow 削除タスクの Phase 12 ドキュメントを strict 7 として整備した。

| # | ファイル | 状態 |
| --- | --- | --- |
| 1 | main.md（本ファイル） | present |
| 2 | implementation-guide.md | present（Part 1 / Part 2 / 視覚証跡） |
| 3 | system-spec-update-summary.md | present（Step 1-A/1-B/1-C/Step 2=N/A） |
| 4 | documentation-changelog.md | present（全 Step + skill sync） |
| 5 | unassigned-task-detection.md | present（current 0 件） |
| 6 | skill-feedback-report.md | present（3 観点・編集無し） |
| 7 | phase12-task-spec-compliance-check.md | present（作成済・canonical 9 セクション） |

## 結論

- システム正本仕様（schema / auth / DB / interfaces）への影響なし → Step 2 = N/A。
- 新規インターフェース・型・定数・API の追加なし。
- 文字列置換・要素削除・CSS 削除・テスト更新のみの apps/web 表現層タスク。
- commit・PR は user-gated（Phase 13・pending）。

## 識別子整合（現行コードと一致）

- `data-component="stats"` / `data-stat="members|zones|meetings|sync"` / `data-role="label|value|sub|badge-sync|dot"` は現行 `Stats.tsx` と一致（変更対象は `label` の文字列と `badge-sync` 内テキストのみ）。
- eyebrow は `data-role="eyebrow"`。Hero は `eyebrow` prop 経由（条件描画）。
