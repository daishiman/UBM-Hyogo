# Phase 11: 手動テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 11 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

NON_VISUAL タスクの手動テスト = **リンク整合 + テキスト整合**を最終確認する。phase-NN.md / outputs/phase-N/* / artifacts.json / index.md の相互参照が解決可能であることを確認し、後続実装タスク（dry-run 実走担当）が docs から runbook へ漏れなく到達できる経路を保証する。

## 実行タスク

- `outputs/phase-11/manual-smoke-log.md` に手動チェックの結果を記録する。
- `outputs/phase-11/link-checklist.md` に内部リンク一覧を表形式で作成し、各 phase-NN.md → outputs / 横断依存タスクへのリンクを ✓ / ✗ で網羅する。
- リンク整合の検証手順：`grep -RnE '\\]\\(.*\\.md\\)' docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/` で内部リンクを抽出し、各 link target の存在を `ls` で確認した結果を記録。
- 想定読者の到達経路を確認：(a)レビュアーが `index.md` → `phase-05.md` → `outputs/phase-5/runbook.md` に到達できる、(b)後続実装タスク担当者が `phase-04.md` → `outputs/phase-4/test-matrix.md` → 実 dry-run コマンドへ到達できる。
- 表記ゆれ最終確認：`pull_request_target safety gate` / `triage workflow` / `untrusted build workflow` / `pwn request pattern` の 4 用語が全 phase-NN.md / outputs / index.md で一貫使用されているか `grep -ric` で確認。
- artifacts.json と本文の status 同期最終確認：13 Phase の status を `jq '.phases[] | "\\(.phase) \\(.status)"' artifacts.json` で抽出し、index.md / phase-NN.md と突き合わせる手順を記述。
- 視覚証跡を必要としない理由（NON_VISUAL）を明記し、後続実装タスクが dry-run logs（visual ではないが実走証跡）を `outputs/phase-9/dry-run-log.md` に追加する旨を引き継ぎ事項として残す。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `index.md`
- `artifacts.json`
- `phase-01.md` 〜 `phase-10.md`
- 各 `outputs/phase-N/*`

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## 統合テスト連携

本 Phase は docs 内のリンク整合を保証する。dry-run の実走は後続実装タスクで実行する。

## 完了条件

- [ ] manual-smoke-log.md と link-checklist.md が作成されている。
- [ ] 内部リンク切れがゼロであることが記録されている。
- [ ] 想定読者の 2 経路（レビュアー / 実装担当）が確認されている。
- [ ] 表記ゆれゼロが `grep` 結果で確認されている。
- [ ] artifacts.json と本文の status 同期が確認されている。
- [ ] NON_VISUAL の理由と引き継ぎ事項が記述されている。
- [ ] artifacts.json の Phase 11 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
