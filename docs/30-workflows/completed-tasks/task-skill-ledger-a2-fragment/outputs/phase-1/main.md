# Phase 1 — 要件定義 main

## 真の論点（4 系統）

1. 複数 worktree 並列追記による同一バイト位置 conflict の構造的解消
2. 既存履歴の温存（`_legacy.md` 退避による blame / `git log --follow` 連続性維持）
3. 集約 view の代替提供（`pnpm skill:logs:render` の on-demand 集約）
4. writer 切替の最終化（fragment 受け皿 → render → writer の順整備）

## スコープ境界（MECE）

### 含む

- fragment ディレクトリ作成・`.gitkeep` 追跡
- legacy `git mv` 退避
- writer / append helper の fragment 化（`scripts/skill-logs-append.ts`）
- `pnpm skill:logs:render` 実装（T-5 包含）
- legacy migration（T-7 包含）
- front matter 必須項目検証（fail-fast）
- 4 worktree 並列 smoke（Phase 11 で計画固定）

### 含まない

- A-1（`.gitignore` 化）、A-3（Progressive Disclosure 分割）、B-1（`.gitattributes merge=union`）
- skill 本体機能変更
- legacy ファイル物理削除

## 命名 canonical

| 項目 | 値 |
| ---- | -- |
| fragment 命名 | `<dir>/<YYYYMMDD>-<HHMMSS>-<escaped-branch>-<nonce>.md` |
| 命名 regex | `^(LOGS\|changelog\|lessons-learned)/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$` |
| timestamp | `YYYYMMDD-HHMMSS`（UTC、front matter は ISO8601） |
| nonce | 8 hex（4 byte） |
| escaped-branch 上限 | 64 文字（trailing trim） |
| path 全体上限 | 240 byte |
| 退避形式 | `LOGS/_legacy.md` / `changelog/_legacy.md` / `lessons-learned/_legacy-<base>.md` |

## 横断依存

- 上流: `task-conflict-prevention-skill-state-redesign`（Phase 1〜13 承認済）
- 下流: `task-skill-ledger-a1-gitignore` / `a3-progressive-disclosure` / `b1-gitattributes`

## ドッグフーディング対象

- `aiworkflow-requirements/LOGS.md` → fragment 化
- `task-specification-creator/SKILL-changelog.md` → fragment 化

## 受入条件チェックリスト（8 項目）

- [x] fragment 受け皿作成
- [x] legacy 退避（`_legacy.md`）
- [ ] writer fragment 化（render/append helper は完了。`log_usage.js` 4 件は本レビューで fragment writer へ切替済み）
- [x] render script（`pnpm skill:logs:render`）
- [x] front matter fail-fast（exit 1）
- [x] `--out` tracked 拒否（exit 2）
- [x] `--include-legacy` 30 日 window
- [ ] 4 worktree conflict 0 件（Phase 11 evidence plan）

## 用語集

| 用語 | 意味 |
| ---- | ---- |
| fragment | 1 entry = 1 file の追記単位 |
| Changesets パターン | OSS で広く使われる fragment + render 方式 |
| append-only | 既存行を編集せず末尾追記する規約 |
| nonce | 衝突回避のための乱数 8 hex |
| legacy include window | 30 日（`_legacy.md` を render 末尾連結する期間） |
| front matter | YAML ヘッダ（`timestamp` / `branch` / `author` / `type`） |
| render view | on-demand 集約された読み取り専用 view |
