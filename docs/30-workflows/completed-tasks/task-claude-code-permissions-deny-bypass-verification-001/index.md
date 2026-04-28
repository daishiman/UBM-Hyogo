# task-claude-code-permissions-deny-bypass-verification-001 — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-claude-code-permissions-deny-bypass-verification-001 |
| タスク名 | Claude Code permissions.deny の bypass モード下実効性検証 |
| ディレクトリ | docs/30-workflows/task-claude-code-permissions-deny-bypass-verification-001 |
| issue_number | 141 |
| Wave | - |
| 実行種別 | spec_created |
| 作成日 | 2026-04-28 |
| 担当 | dev-environment / tooling / security |
| 状態 | spec_created |
| タスク種別 | verification (docs-only) |
| visualEvidence | NON_VISUAL |
| 優先度 | HIGH（apply-001 の前提条件 / blocker） |
| 見積もり規模 | 小規模 |

## 目的

`--dangerously-skip-permissions` 適用時に `permissions.deny`（`Bash(git push --force:*)` /
`Write(/etc/**)` 等）が実効するか否かを確定するため、Anthropic 公式ドキュメント上の明示記述の
調査観点、isolated 環境での実機検証 runbook、判定不能時の fail-closed 方針を仕様化し、
`task-claude-code-permissions-apply-001` の前提条件として参照できる状態にする HIGH blocker タスク。

本タスク自体は `spec_created` であり、実 Claude Code 起動による実機検証は別途承認後に実施する。
公式 docs で明示判定できない場合の状態は `docs_inconclusive_requires_execution` とし、推測で
deny 実効性を YES 扱いしない。

判定が NO の場合、`cc` alias から `--dangerously-skip-permissions` を外す代替案
（settings 層のみで `bypassPermissions` を維持）に切り替える。

## 背景

`task-claude-code-permissions-decisive-mode` の Phase 3 R-2 にて、deny 実効性が
公式ドキュメントから取得できず UNKNOWN のまま BLOCKER として残った。
推測ベースで apply タスクに着手すると、`~/.zshrc` および `~/.claude/settings.json`
が「deny は効くはず」前提で書き換わり、後から手戻りが発生する。

## スコープ

### 含む（本タスクで設計・検証する範囲）

- E-1: Anthropic 公式 Claude Code docs の `permissions.deny` / `--dangerously-skip-permissions` 周辺記述調査
- E-2: 公式 docs で確定しない場合の isolated repo を用いた実機検証手順
- E-3: 検証結果の上流（decisive-mode Phase 3 R-2）/ 下流（apply-001）への反映
- E-4: 判定 NO 時のフォールバック（alias 縮小案）の文書化

### 含まない（別タスク）

- `~/.claude/settings.json` および `~/.zshrc` の本番反映（apply-001 の責務）
- MCP server / hook の permission 挙動検証（U4 として別タスク）
- project-local-first 案との比較設計（U3 として別タスク）
- whitelist の項目追加・拡張

## 受入条件 (AC)

- AC-1: 公式 docs 調査観点（URL 候補 / スニペット記録形式 / 「該当なし」時の扱い）が `outputs/phase-1/main.md` に確定している
- AC-2: 公式 docs で確定しない場合に備え、isolated repo の構築手順、検証ログテンプレート、実行 runbook が `outputs/phase-2/` / `outputs/phase-5/runbook.md` / `outputs/phase-11/verification-log.md` に揃っている
- AC-3: deny 実効性の判定状態が `docs_explicit_yes` / `docs_explicit_no` / `docs_inconclusive_requires_execution` のいずれかで扱われ、公式 docs で明示できない場合は実検証タスクへ送る条件が確定している
- AC-4: 判定結果の転記方針が `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md` の前提条件欄向けに定義されている。既存 apply-001 指示書は実反映未実施 / blocked として扱い、本タスクと execution-001 の判定結果を前提条件にする方針を `outputs/phase-12/system-spec-update-summary.md` に記録する
- AC-5: 判定 NO 時のフォールバック alias 案（`outputs/phase-2/alias-fallback-diff.md`）が文書化されている
- AC-6: 検証中に実プロジェクトの remote / branch / ファイルに変更が一切発生していない（Phase 11 で証跡確認）
- AC-7: NON_VISUAL タスクのため Phase 11 はスクリーンショット不要、`outputs/phase-11/manual-smoke-log.md` を主証跡とする
- AC-8: Phase 12 は 6 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が揃う

## 重要な不変条件

- **破壊的検証は必ず isolated 環境のみで実施**: `/tmp/cc-deny-verify-*` 配下の bare repo / dummy ref / `--dry-run` または実害のない isolated path に限定
- 実プロジェクトの `origin` / 実 ref / グローバル `~/.claude/settings.json` を一切変更しない
- 平文 `.env` をコミットしない（CLAUDE.md ルール準拠）
- `wrangler` 直接実行禁止（`scripts/cf.sh` 経由）— 本タスクは無関係だが破らない
- Claude Code バージョンを検証ログに必ず記録する（後続バージョンでの再検証可能性確保）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-1/main.md（公式 docs 調査結果 + 要件） |
| 2 | 設計 | phase-02.md | pending | outputs/phase-2/{main,verification-protocol,alias-fallback-diff}.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-3/{main,impact-analysis}.md |
| 4 | テスト設計 | phase-04.md | pending | outputs/phase-4/{main,test-scenarios}.md |
| 5 | 実装（検証手順具体化） | phase-05.md | pending | outputs/phase-5/{main,runbook}.md |
| 6 | テスト拡充 | phase-06.md | pending | outputs/phase-6/main.md |
| 7 | カバレッジ確認 | phase-07.md | pending | outputs/phase-7/main.md |
| 8 | リファクタリング | phase-08.md | pending | outputs/phase-8/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-9/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/{main,final-review-result}.md |
| 11 | 手動テスト | phase-11.md | pending | outputs/phase-11/{main,manual-smoke-log,verification-log,link-checklist}.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/* 6 種 |
| 13 | PR 作成 | phase-13.md | blocked | outputs/phase-13/{main,pr-template}.md |

## 主要参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/main.md` | R-2 BLOCKER の文脈 |
| 必須 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/impact-analysis.md` | 影響範囲 |
| 必須 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md` | 実装ガイド |
| 必須 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001.md` | 既存 4-phase 簡易版（本タスクの源泉） |
| 必須 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md` | 下流の apply タスク（指示書は存在、実反映は未実施） |
| 必須 | Anthropic 公式 Claude Code docs（permissions / CLI flags / settings） | Phase 1 の主参照 |
| 参考 | `docs/00-getting-started-manual/claude-code-config.md` | 階層優先順位の正本 |
| 参考 | `CLAUDE.md`（プロジェクトルート） | 権限モード / settings 参照記述 |

## 完了判定

- Phase 1〜12 は仕様実行時に完了判定し、Phase 13 はユーザー承認まで `blocked`
- AC-1〜AC-8 が Phase 7 / 10 で `queued` / `covered` / `verified` を分けてトレースされる
- Phase 12 が 6 成果物を揃え、`artifacts.json` / `outputs/artifacts.json` の parity が取れている
- 本仕様書は `spec_created` 状態であり、検証実行は別途承認後に実施する旨が記録されている

## 関連リンク

- Issue: https://github.com/daishiman/UBM-Hyogo/issues/141
- 上位 README: `../README.md`（存在すれば）
- Skill: `.claude/skills/task-specification-creator/`
- 上流タスク: `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/`
- 既存簡易版: `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001.md`
