# Phase 6 成果物 — A-2 実装ランブック総括

## 位置付け

A-2「Changesets パターンによる append-only ログの fragment 化」を別タスクが実装できる
粒度に固定する。本タスクは仕様提示のみで、実コード（追記コード書換え・render script 本体）
は **別タスク** (`task-skill-ledger-a2-fragment`) に委譲する。

## 成果物 index

| ファイル | 役割 |
| --- | --- |
| `fragment-runbook.md` | A-2 実装手順書（ディレクトリ転換・命名・render API 雛形・rollback） |
| `main.md` (本ファイル) | 概観 / 委譲先 / 整合性 |

## 対象施策の射程

| 対象 ledger | 旧形式 | 新形式 |
| --- | --- | --- |
| `aiworkflow-requirements/LOGS.md` | 単一 append-only Markdown | `LOGS/<ts>-<branch>-<nonce>.md` (1 entry / 1 file) |
| `task-specification-creator/SKILL-changelog.md` | 単一 append-only changelog | `changelog/<semver>.md` (1 release / 1 file) |
| `**/lessons-learned-*.md` | 単一 ファイル append | `lessons-learned/<YYYYMMDD>-<topic>.md` (1 lesson / 1 file) |

## 必須プロパティ

- 1 entry = 1 file
- 命名は決定論的に検証可能（regex で完全に一致）
- 既存履歴は `_legacy*.md` で温存（git mv でリネーム検出）
- 集約 view は on-demand render（git 管理外）

## 依存仕様

| 仕様 | 出典 |
| --- | --- |
| 命名規則 (regex / front matter) | `outputs/phase-2/fragment-schema.md` |
| 集約 view API | `outputs/phase-2/render-api.md` |
| 後方互換 (`_legacy.md`) | `outputs/phase-3/backward-compat.md` |

## 移行順序

1. fragment ディレクトリ作成
2. 既存 ledger を `_legacy.md` または fragment として import
3. writer を fragment 生成方式に書換え（実装は別タスク）
4. render command 提供
5. 2 worktree 並列 fragment 生成で merge 検証

## 後続 Phase との関係

| Phase | 関係 |
| --- | --- |
| Phase 4 C-1 / C-2 / C-6 / C-7 | fragment 並列生成・render の検証 |
| Phase 11 | 実装後の手動検証 |
| Phase 12 | specs / SKILL.md への正本化 |
