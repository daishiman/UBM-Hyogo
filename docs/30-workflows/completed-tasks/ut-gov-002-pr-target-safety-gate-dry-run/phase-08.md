# Phase 08: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 8 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

Phase 1〜7 で生成した仕様書群を **before / after で見直し**、表記ゆれ / 重複 / 用語不整合 / リンク切れを除去する。docs-only タスクのため「コードリファクタ」ではなく「ドキュメントリファクタ」を行う。

## 実行タスク

- `outputs/phase-8/before-after.md` を作成し、修正前後の差分を表で記録する。
- 用語整合チェック：`pull_request_target safety gate` / `triage workflow` / `untrusted build workflow` / `pwn request pattern` の 4 用語が phase-NN.md / outputs/phase-N/* で表記揺れなく使われているか `grep` で確認する手順を記述。
- 重複削減：Phase 2 design.md と Phase 5 runbook.md で重複している記述（permissions / persist-credentials の方針）について、片方を **正本**としてもう片方を参照に置き換える方針を before-after.md に記録。
- 章構成の見直し：phase-NN.md は 7 章固定（メタ情報 / 目的 / 実行タスク / 参照資料 / 成果物 / 統合テスト連携 / 完了条件）。逸脱していないか確認。
- 図表の最小化：本タスクは NON_VISUAL のため、Mermaid 等の図は使わない。表（Markdown table）のみを使用する方針を再確認。
- 参照リンクの正規化：相対パスは `docs/30-workflows/...` から書き、絶対 URL は GitHub Security Lab / GitHub Docs のみに限定する方針を記述。
- リンク切れ抽出：`grep -RnE '\\]\\(.*\\.md\\)' docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/` で内部リンクを列挙し、ファイル存在を確認する手順（実走は Phase 11）。
- 修正サマリ：本 Phase で実施したリファクタを 1 行ずつ列挙する。
- dry-run / dry-run specification / dry-run runbook の語義を点検し、実走と仕様策定が混ざる表現を修正する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `phase-01.md` 〜 `phase-07.md`
- `outputs/phase-2/design.md`
- `outputs/phase-5/runbook.md`

## 成果物

- `outputs/phase-8/main.md`
- `outputs/phase-8/before-after.md`

## 統合テスト連携

リファクタは docs 内に閉じる。挙動を変える変更ではないため、Phase 9 quality-gate では「文書整合のみ確認」とする。

## 完了条件

- [ ] before-after.md にリファクタ前後の差分が記録されている。
- [ ] 用語整合チェックが行われ、表記揺れゼロが確認されている。
- [ ] 重複削減方針（正本 / 参照の役割分担）が記録されている。
- [ ] 章構成（7 章）が phase-NN.md 全件で守られている。
- [ ] リンク切れ抽出手順が記述されている。
- [ ] artifacts.json の Phase 8 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
