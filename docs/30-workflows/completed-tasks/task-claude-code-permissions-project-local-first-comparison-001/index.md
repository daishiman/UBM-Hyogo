# task-claude-code-permissions-project-local-first-comparison-001 — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| ディレクトリ | docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001 |
| Wave | - |
| 実行種別 | spec_created |
| 作成日 | 2026-04-28 |
| 担当 | dev-environment / tooling |
| 状態 | spec_created |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| 関連 Issue | #142（CLOSED 扱いのまま継続） |

## 目的

Claude Code の `settings` 階層（global / global.local / project / project.local）について、prompt 復帰問題を防ぐための「project-local-first（案 B）」と「global + shell alias 強化（案 A）」、ならびにその「ハイブリッド案」を 4 層 × 5 評価軸で比較し、`task-claude-code-permissions-apply-001` が即着手できる粒度で **採用方針を 1 案に確定する** ことを目的とする。

本タスクは **設計のみ（spec_created / docs-only / NON_VISUAL）** であり、実 `~/.claude/settings.json` / `~/.zshrc` への書き換えは一切行わない。書き換えは `task-claude-code-permissions-apply-001` で実施する。

## 背景

`task-claude-code-permissions-decisive-mode` Phase 3 で、prompt 復帰を防ぐための候補として以下 2 案が出た。

- 案 A: `~/.claude/settings.json` の `defaultMode` を `bypassPermissions` に変更し、`cc` alias に `--dangerously-skip-permissions` を追加する（global + shell 全体に波及）
- 案 B: `<project>/.claude/settings.local.json` のみで bypass を維持する（影響半径は当該プロジェクトに限定）

Phase 3 では案 A を「個人開発マシン限定」で CONDITIONAL ACCEPT としたが、global / shell alias 変更が他プロジェクト（特に `scripts/cf.sh` 経由の Cloudflare CLI 運用や `op run` 注入経路）の権限評価に副作用を与えるかを即断できなかった。本タスクはその判断を確定させる比較設計タスクである。

## スコープ

### 含む（本タスクで設計する範囲）

- 4 層（global / global.local / project / project.local）の優先順位と責務分担を 1 表に集約
- project-local-first での prompt 復帰防止可否を、公式仕様引用または fresh プロジェクトでの実機観測で判定
- 案 A / 案 B / ハイブリッドの trade-off 比較表（5 評価軸: 影響半径 / 再発リスク / rollback コスト / 他プロジェクト副作用 / fresh 環境挙動）
- 採用方針の確定と `task-claude-code-permissions-apply-001` へのハンドオフ箇条書き
- global 採用時の rollback 手順（差分の保存・復元コマンド）

### 含まない（別タスクで実装）

- 実 `~/.claude/settings.json` / `~/.zshrc` への書き換え（→ `task-claude-code-permissions-apply-001`）
- bypass モード下の deny 実効性検証（→ `task-claude-code-permissions-deny-bypass-verification-001`）
- MCP server / hook の permission 挙動検証（U4 候補）

## 受入条件 (AC)

- AC-1: 4 層責務表が phase-02 成果物として存在する（想定利用者 / 変更頻度 / git 管理可否 / 担当キーが列挙されている）
- AC-2: project-local-first 単独での再発有無が phase-03 で 1 結論として記録されている（公式仕様引用 or 実機ログを伴う）
- AC-3: 案 A / 案 B / ハイブリッドの比較が 5 軸で表化され phase-05 比較表として揃う
- AC-4: 採用案が 1 つに確定し、phase-05 / phase-12 ハンドオフ箇条書きで `task-claude-code-permissions-apply-001` の入力として参照可能
- AC-5: global 採用時の rollback 手順（差分保存 / 復元コマンド）が記載される
- AC-6: 他プロジェクト副作用（`scripts/cf.sh` / `op run` / 他 worktree）への言及が比較表に含まれる
- AC-7: Phase 3 シナリオ A〜D との対応が比較表に明示される
- AC-8: NON_VISUAL タスクのため Phase 11 はスクリーンショット不要、`manual-smoke-log.md` を主証跡とする
- AC-9: Phase 12 は 5 必須成果物 + `main.md` + `phase12-task-spec-compliance-check.md` を揃え、`task-claude-code-permissions-apply-001` 指示書の参照欄追記依頼を documentation-changelog または unassigned-task-detection に内包する
- AC-10: `task-claude-code-permissions-decisive-mode` の Phase 3 / Phase 12 成果物がリンクされている

## 重要な不変条件

- 実 `~/.claude/settings.json` / `~/.zshrc` への書き換えは一切行わない（spec_only）
- `--dangerously-skip-permissions` / `defaultMode` / `bypassPermissions` 等のキー名は公式表記をそのまま使用する
- `wrangler` 直接実行禁止（CLAUDE.md 由来。比較表で `Bash(wrangler *)` 言及時も方針を破らない）
- 平文 `.env` の中身を読み取ったり転記したりしない（CLAUDE.md ルール準拠）
- global 設定を変更する案は、他プロジェクト影響レビュー（Phase 3）が完了するまで採用しない

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-1/main.md |
| 2 | 設計 | phase-02.md | pending | outputs/phase-2/{main,layer-responsibility-table,comparison-axes}.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-3/{main,impact-analysis}.md |
| 4 | テスト設計 | phase-04.md | pending | outputs/phase-4/{main,test-scenarios}.md |
| 5 | 実装（比較表本体） | phase-05.md | pending | outputs/phase-5/{main,comparison}.md |
| 6 | テスト拡充 | phase-06.md | pending | outputs/phase-6/main.md |
| 7 | カバレッジ確認 | phase-07.md | pending | outputs/phase-7/main.md |
| 8 | リファクタリング | phase-08.md | pending | outputs/phase-8/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-9/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/{main,final-review-result}.md |
| 11 | 手動テスト | phase-11.md | pending | outputs/phase-11/{main,manual-smoke-log,link-checklist}.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/* 7 種 |
| 13 | PR 作成 | phase-13.md | blocked | outputs/phase-13/{main,pr-template,local-check-result,change-summary}.md |

## 主要参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/impact-analysis.md` | 案 A の CONDITIONAL ACCEPT 経緯 |
| 必須 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/main.md` | レビュー結論 |
| 必須 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/unassigned-task-detection.md` | U3 として本タスクを起票した経緯 |
| 必須 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md` | 実装手引きの正本 |
| 必須 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md` | ハンドオフ先 |
| 必須 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001.md` | deny 実効性検証の並行タスク |
| 必須 | `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` | 階層優先順位の正本 |
| 参考 | `CLAUDE.md`（プロジェクトルート） | 「Claude Code 設定」「シークレット管理」節 |
| 参考 | Anthropic 公式 docs（settings 階層と `defaultMode` 仕様） | 公式仕様の出典 |

## 完了判定

- Phase 1〜12 は仕様実行時に完了判定し、Phase 13 はユーザー承認まで `blocked`
- AC-1〜AC-10 が Phase 7 / 10 でトレースされる
- Phase 12 が成果物を揃え、`artifacts.json` / outputs 実体の parity が取れている
- 本仕様書は `spec_created` 状態であり、実装は `task-claude-code-permissions-apply-001` で実行する旨が記録されている

## 関連リンク

- 上位 README: `../README.md`（存在すれば）
- 依存元: `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/`
- Skill: `.claude/skills/task-specification-creator/`
