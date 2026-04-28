# Phase 5: 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 4 |
| 下流 | Phase 6 (テスト拡充) |
| 状態 | pending |
| implementation_mode | new |

## 目的

> ⚠️ **本タスクは `workflow: spec_created`**。実装は別タスクで実行する。本 Phase では「実装ランブック」のみを設計成果物として残す。

別タスクで実コードを書く際の **手順書** を Markdown で定義する。

## 修正対象ファイル一覧

| 種別 | パス | 操作 | 担当 |
| --- | --- | --- | --- |
| 修正 | `~/.claude/settings.json` | `defaultMode` を `bypassPermissions` に統一（案 A 採用時） | 別タスクで実施 |
| 修正 | `<project>/.claude/settings.json` | `permissions.allow` / `deny` を Phase 2 設計通り更新 | 別タスクで実施 |
| 修正 | `~/.zshrc` または `~/.config/zsh/conf.d/<n>-claude.zsh` | `cc` エイリアスに `--dangerously-skip-permissions` 追加 | 別タスクで実施 |
| 新規 | なし | - | - |

## 実装ランブック（別タスク向け）

### Step 1: バックアップ取得

```bash
cp ~/.claude/settings.json ~/.claude/settings.json.bak.$(date +%Y%m%d%H%M%S)
cp ~/.zshrc ~/.zshrc.bak.$(date +%Y%m%d%H%M%S)
```

### Step 2: `~/.claude/settings.json` の `defaultMode` 統一

- 該当行（Phase 1 ダンプで確認した行番号付近）を編集
- `"defaultMode": "acceptEdits"` → `"defaultMode": "bypassPermissions"`
- JSON validity を `node -e "JSON.parse(require('fs').readFileSync('/Users/<USER>/.claude/settings.json','utf8'))"` で確認

### Step 3: `<project>/.claude/settings.json` の whitelist 更新

- `permissions.allow` / `permissions.deny` を Phase 2 `whitelist-design.md` に合わせる
- JSON validity 確認

### Step 4: `cc` エイリアス書き換え

```zsh
# Before
alias cc='claude --verbose --permission-mode bypassPermissions'
# After
alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

- 現行 shell 設定の **どのファイル** に alias があるか先に確認: `grep -rn "alias cc=" ~/.zshrc ~/.config/zsh/`
- 該当ファイルのみを編集
- `source` で反映: `source ~/.zshrc`

### Step 5: 動作確認

Phase 4 の TC-01〜TC-05 を順次実行。

### Step 6: ロールバック手順（失敗時）

```bash
cp ~/.claude/settings.json.bak.<timestamp> ~/.claude/settings.json
cp ~/.zshrc.bak.<timestamp> ~/.zshrc
source ~/.zshrc
```

## 注意事項

- **平文 `.env` を絶対に Read しない** / `cat` しない（CLAUDE.md ルール）
- API token / OAuth トークンの値はランブックに転記しない
- `wrangler` 直接実行禁止（`scripts/cf.sh` 経由）— 本タスクとは無関係だが破らない

## canUseTool 適用範囲と制約

本タスクは LLM SDK の canUseTool callback を使わない（settings ファイル変更タスクのため）。N/A。

## 主成果物

- `outputs/phase-5/main.md`
- `outputs/phase-5/runbook.md`

## 完了条件

- [ ] skill 準拠の完了条件を満たす。
- ランブックが Step 1〜6 で完結している
- ロールバック手順が記載されている
- 修正対象ファイルパス一覧が明示されている

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- Phase 4: `outputs/phase-4/` を参照する。
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

