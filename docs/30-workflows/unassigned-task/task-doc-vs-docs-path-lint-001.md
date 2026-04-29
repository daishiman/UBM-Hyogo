# 未割当タスク: `doc/` vs `docs/` 表記揺れ allow-list lint 導入

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-doc-vs-docs-path-lint-001 |
| 作成日 | 2026-04-29 |
| 起点 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/unassigned-task-detection.md (C-4) |
| 種別 | quality_governance / NON_VISUAL |
| 優先度 | Medium |
| 状態 | unassigned |
| 関連 | UT-GOV-003 (CODEOWNERS), UT-GOV-005 (docs-only nonvisual template skill sync) |

## 背景

UT-GOV-003 Phase 12 で、リポジトリ全体に `doc/`（s なし）始まりの過去 workflow / changelog / archive / 旧リンクが残置していることを検出した。実フォルダは `docs/00-getting-started-manual/` および `docs/30-workflows/`（s 付き）に統一されており、`doc/` 始まりのリンクは多くが履歴引用または既に切れたリンクである。

CODEOWNERS の glob を `docs/30-workflows/**` で書く前提とした以上、新規 commit で `doc/` 表記揺れが再導入されると CODEOWNERS と参照先が乖離する。単純な一括置換は履歴引用や外部参照を破壊するため不可で、allow-list を伴う lint gate が必要。

## スコープ

### 含む

- `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!.worktrees'` 相当の lint script
- 既存残置の分類: (a) 履歴引用 (b) リンク切れ修正対象 (c) 外部参照 / fixture / archive 例外
- (b) のリンク修正同 wave 適用
- allow-list ファイル（`scripts/lint/doc-vs-docs-allowlist.txt` 想定）
- lefthook pre-commit フック登録 (`.lefthook.yml` への step 追加)
- CI gate 化（`.github/workflows/verify-doc-vs-docs.yml` または既存 lint workflow へ統合）

### 含まない

- 実フォルダ rename / 移動
- `docs/00-getting-started-manual/` 配下の構成変更
- archive / 過去 PR description 等の git 履歴改変

## 受入条件

- AC-1: 新規 commit で `doc/` 始まりの新規リンクが導入されると lint が失敗する
- AC-2: allow-list に列挙された既存残置パスは lint を通過する
- AC-3: (b) リンク切れ修正は本タスク wave 内で完了し、修正後ファイルが allow-list に含まれない
- AC-4: lefthook 経由の pre-commit と CI gate の両方で同じ判定になる
- AC-5: 検出時のエラーメッセージに「`docs/` (s 付き) に統一」明示と該当行番号が含まれる

## 苦戦箇所（UT-GOV-003 で確認）

- **単純置換 NG の判断**: `docs/00-getting-started-manual/` と `docs/30-workflows/` の 2 系統が役割が異なる形で並存しており、`doc/` → `docs/` の機械的置換は不可。Phase 12 system-spec-update-summary.md でも実フォルダ rename を保留した。
- **allow-list 設計**: 履歴引用（changelog 等）と「実害のあるリンク切れ」を区別する判断基準が未定義。本タスクで「履歴ファイル / archive / fixture」を例外、「現役 docs / spec / workflow」を必須修正、と運用上の境界線を明文化すること。
- **CLAUDE.md 役割明示**: `doc/` `docs/` 2 系統の役割行を「主要ディレクトリ」表に追加する案が UT-GOV-003 Phase 12 で出ており、本タスクでも CLAUDE.md 改修を併走候補にすると lint の意義が contributor に伝わりやすい。

## 参照

- `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/skill-feedback-report.md` 観点 3
- `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/system-spec-update-summary.md`
- `lefthook.yml`
- CLAUDE.md「主要ディレクトリ」表
