# Skill Feedback Report

## テンプレ改善

| Item | Routing | Decision |
| --- | --- | --- |
| 小規模 UI component 追加タスクは Phase 7 / Phase 10 の本文が薄くなりやすい | task-specification-creator candidate | 今回は no-op。単一事例のため owning skill 変更はしない |

## ワークフロー改善

| Item | Routing | Decision |
| --- | --- | --- |
| `outputs/phase-12/` strict 7 が初期生成に含まれていなかった | current task fix | strict 7 を今回 wave で物理追加 |
| `outputs/artifacts.json` がなかった | current task fix | root artifact mirror を今回 wave で追加 |
| 実 worktree に `apps/web` 差分があるのに `spec_created / no impl yet` と分類していた | current task fix + existing skill rule | `implemented_local_evidence_captured` へ再分類し、Phase 11 evidence と aiworkflow ledgers を同一 wave で同期。既存 `phase-12-spec.md` / `phase-12-documentation-guide.md` に再分類ルールがあるため skill 本体変更は不要 |
| Phase 11 screenshot selector 手順が現行 Playwright CLI と不一致 | current task fix | CLI `--selector` ではなく Playwright API `locator().screenshot()` 手順へ修正 |

## ドキュメント改善

| Item | Routing | Decision |
| --- | --- | --- |
| prototype 行番号だけの参照は drift しやすい | task-local mitigation | path、source spec、Phase 11 visual compare を併記。汎用 skill 変更は no-op |

## Promotion Verdict

owning skill への変更が必要な feedback はなし。今回検出した漏れは既存 skill ルールの適用漏れであり、対象 workflow / aiworkflow ledgers / Phase 11 evidence / test gate の実ファイル修正で解消済み。
