# System Spec Update Summary — specs 追記方針（AC-7）

## ステータス

本ワークフローは `spec_created` であり、本 phase 段階では `docs/00-getting-started-manual/specs/`
配下の実テキストを編集しない。**追記すべき内容と配置先**を凍結し、後続実装タスクの完了時に
specs を更新する契約を本書で固定する。

## 既存 specs 棚卸し

`docs/00-getting-started-manual/specs/` の現状は以下:

| ファイル | 主題 | skill ledger に該当する節の有無 |
| --- | --- | --- |
| 00-overview.md | システム全体概要 | なし |
| 01-api-schema.md | フォーム schema | なし |
| 02-auth.md | 認証設計 | なし |
| 03-data-fetching.md | データ取得 | なし |
| 04-types.md | 型定義 | なし |
| 05-pages.md | ページ構成 | なし |
| 06-member-auth.md | 会員認証 | なし |
| 07-edit-delete.md | 編集削除 | なし |
| 08-free-database.md | D1 構成 | なし |
| 09-ui-ux.md | UI/UX | なし |
| 10-notification-auth.md | 通知認証 | なし |
| 11-admin-management.md | 管理機能 | なし |
| 12-search-tags.md | 検索タグ | なし |
| 13-mvp-auth.md | MVP 認証 | なし |

→ 既存 specs に skill ledger を扱う節は存在しない。

## 追記提案

### 配置先

**新規ファイル**: `docs/00-getting-started-manual/specs/skill-ledger.md`

理由:
- 既存 specs はすべて UBM 兵庫支部会のドメイン仕様（フォーム / 認証 / DB / UI）
- skill ledger は **開発基盤** の正本ルールであり、ドメイン仕様ファイルへの混入は責務違反
- 単独ファイルとすることで、後続の skill 改修時に diff が局在化

### 追記内容（実テキスト案）

```markdown
# skill-ledger — `.claude/skills/` 共有 ledger 設計

## 1. 4 施策の正本ルール

| ID | ルール |
| --- | --- |
| A-1 | 自動生成 ledger（カウンタ JSON / 集計 indexes）は `.gitignore` 対象。hook が再生成する |
| A-2 | append-only な記録は `LOGS/<YYYYMMDD-HHMMSS>-<escaped-branch>-<nonce>.md` の fragment として書く |
| A-3 | `SKILL.md` は 200 行未満の entrypoint。詳細は `references/<topic>.md` へ Progressive Disclosure |
| B-1 | fragment 化できない行独立 ledger は `.gitattributes` で `merge=union` を付与 |

## 2. fragment 命名規約

- パス: `<skill>/LOGS/<YYYYMMDD-HHMMSS>-<escaped-branch>-<nonce>.md`
- `escaped-branch`: `/` を `-` に、英数字以外をハイフン化
- `nonce`: 8〜12 文字の小文字 hex / base36
- 同一秒・同一 branch でも `nonce` で一意性を担保

## 3. render API 規約

- CLI: `pnpm skill:logs:render --skill <name> [--since <ISO>] [--out <path>]`
- 既定ソート: timestamp 降順
- `--out` は tracked な canonical ledger path を拒否

## 4. gitignore / gitattributes 適用範囲

- gitignore: `keywords.json` / `index-meta.json` / 集計 view 系
- gitattributes `merge=union`: 行独立な legacy ledger のみ（`SKILL.md` / 構造化 JSON には適用しない）

## 5. 後方互換方針

- 既存 `LOGS.md` は `_legacy.md` として退避し削除しない
- A-2 移行後 30 日間は `_legacy.md` を render に含める
- skill 利用者は外部 API の変更を受けない（render CLI のみ追加）
```

### 追記後に実行する更新コマンド

```bash
# topic-map 再生成（skill 仕様変更があるため）
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js
```

## 検証

| 検証 | 手段 |
| --- | --- |
| docs lint | プロジェクトに統一 lint なし。**手動レビュー**で代替 |
| typecheck / lint | docs-only のため不要 |
| リンク健全性 | `outputs/phase-11/link-checklist.md` の手順を再実行 |

## artifacts 同値性

`artifacts.json` と `outputs/artifacts.json` の双方に
`metadata.taskType: docs-only` / `metadata.visualEvidence: NON_VISUAL` を保持する。

## ステータス保持

`spec_created` を `completed` に置換しない。実テキスト書き込みは A-1〜B-1 実装タスクの
完了 PR にて実施する（`documentation-changelog.md` と整合）。
