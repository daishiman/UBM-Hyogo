# Phase 13: 完了確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 13 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| user_approval_required | true |

## 目的

ユーザー承認ゲートとして Phase 1〜12 の成果物総和を提示し、**PR 草案テンプレ**と **change-summary**を整え、承認を待つ。承認前は commit / push / PR 作成を一切行わない。Issue #145 は CLOSED のまま spec_created で扱い、本タスクは docs-only に閉じる。

## 実行タスク

- `outputs/phase-13/main.md` 冒頭にユーザー承認ゲートであることを明記する（user_approval_required: true）。
- `outputs/phase-13/local-check-result.md` にローカル確認結果（validate-phase-output / verify-all-specs / 計画系 wording grep / outputs 実体確認）を記録する。
- `outputs/phase-13/change-summary.md` に 13 Phase 成果物の索引と変更ファイル統計（実コード変更ゼロ / docs 追加のみ）を記録する。
  - 追加：`docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/index.md` / `artifacts.json` / `phase-01.md` 〜 `phase-13.md` / 各 `outputs/phase-N/*`。
  - 変更：なし。
  - 削除：なし。
- `outputs/phase-13/pr-template.md` に Title / Summary / Test plan / レビュアー指定方針 / dev → main 昇格手順を記述する：
  - Title 例：`docs(governance): UT-GOV-002 pull_request_target safety gate dry-run 仕様書 (Phase 1-13)`
  - Summary（3-5 bullet）：(1)親タスク Phase 12 U-2 の formalize、(2)`pull_request_target` triage 専用 + `pull_request` 分離設計の固定、(3)dry-run マトリクス T-1〜T-5 と failure-cases FC-1〜FC-8 の整備、(4)docs-only / 実 workflow 編集は別 PR、(5)Issue #145 は CLOSED のまま spec_created。
  - Test plan：actionlint / yq / grep のコマンドが runbook 通りに動作可能か文書整合確認、内部リンク切れゼロ確認、artifacts.json / 本文 status 同期確認。
  - レビュアー指定方針：solo 開発のため必須レビュアー数は 0。CI gate / 線形履歴 / 会話解決必須 / force push 禁止で品質を担保。
  - dev → main 昇格手順：feature/ut-gov-002-spec-creation → dev → main の 2 段昇格。各昇格時に CI gate 通過を待つ。
- artifacts.json で Phase 13 status を `pending` に固定し、user_approval_required: true を確認する。
- ユーザー承認後の遷移経路を明示：feature/* → dev（staging）→ main（production）。
- 承認時の口頭/チャット記録を `outputs/phase-13/main.md` 末尾に追記する欄を確保する。
- 承認なしでの destructive オペレーション（force push / branch protection 直接適用 / Issue 状態変更）の禁止を再宣言する。Issue #145 は CLOSED のまま操作しない。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`
- `index.md`
- `artifacts.json`
- `outputs/phase-10/go-no-go.md`
- `outputs/phase-12/*`
- `CLAUDE.md`（ブランチ戦略 / solo 運用ポリシー）

## 成果物

- `outputs/phase-13/main.md`
- `outputs/phase-13/local-check-result.md`
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-template.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。Phase 13 はユーザー承認待ちで pending のまま終わる。

## 完了条件

- [ ] main.md にユーザー承認ゲート（user_approval_required: true）が明記されている。
- [ ] local-check-result.md にローカル確認結果が記録されている。
- [ ] change-summary.md に追加ファイル一覧と「実コード変更ゼロ」が記録されている。
- [ ] pr-template.md に Title / Summary / Test plan / レビュアー指定 / 昇格手順が記述されている。
- [ ] artifacts.json の Phase 13 status が `pending`（承認待ち）で固定されている。
- [ ] Issue #145 は CLOSED のまま操作しないことが明記されている。
- [ ] ユーザー承認なしの commit / push / PR 作成 / Issue 状態変更を行わない。
