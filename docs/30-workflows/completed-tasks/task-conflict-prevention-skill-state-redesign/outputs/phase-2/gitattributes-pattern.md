# Phase 2 設計成果物: .gitattributes Pattern (AC-4)

B-1 の `merge=union` ドライバ適用範囲を確定。**行レベル独立**を満たすファイルにのみ適用。

## 1. 位置づけ

- **暫定策**: A-2 fragment 化までの繋ぎ。A-2 移行完了 path は `.gitattributes` から除去
- **恒久策の側面**: fragment 化が困難な行独立 Markdown（外部仕様の制約等）にも適用

## 2. 適用対象（追記内容）

リポジトリルート `.gitattributes` に追記する想定:

```gitattributes
# === skill ledger - merge=union ===
# 行独立 Markdown のみ（A-2 fragment 化までの暫定 + 恒久行独立分）
.claude/skills/**/LOGS.md              merge=union
.claude/skills/**/lessons-learned-*.md merge=union
```

| パターン | 想定対象 | 理由 |
| --- | --- | --- |
| `.claude/skills/**/LOGS.md` | append-only 利用ログ | 1 行 = 1 entry の独立性あり |
| `.claude/skills/**/lessons-learned-*.md` | 学び記録 | bullet 1 行単位で独立 |

## 3. 適用しないファイル（明示除外）

| 除外対象 | 拒否理由 |
| --- | --- |
| `*.json`（`indexes/keywords.json` 等） | 構造体。union は中括弧整合を破壊 |
| `*.yaml` / `*.yml` | 構造体。インデント整合を破壊 |
| `.claude/skills/**/SKILL.md` | A-3 で entrypoint を縮小するため不要 |
| `.claude/skills/**/SKILL-changelog.md` | A-2 で `changelog/<semver>.md` に分割するため不要 |
| `.claude/skills/**/indexes/*` | A-1 で gitignore（追跡対象外） |
| root `CHANGELOG.md` | skill ledger 範疇外 |
| `.claude/skills/**/EVALS.json` | 構造体 + A-1 対象 |

## 4. A-2 完了時の解除手順

A-2 fragment 化が完了した skill については `.gitattributes` から該当行を削除する:

```bash
# 例: aiworkflow-requirements の LOGS.md が完全 fragment 移行したら
# 以下の行を .gitattributes から削除
.claude/skills/aiworkflow-requirements/LOGS.md merge=union
```

判断基準:

- `.claude/skills/<skill>/LOGS.md` が untracked（または存在しない）
- `.claude/skills/<skill>/LOGS/<fragment>.md` が機能している
- render script で legacy が読めることを確認

## 5. 制約・注意

- `merge=union` は「同一行を異なる内容で書き換える」ケースで両方残す。意味的衝突は人手解決が必要
- bullet list 順序は保証されない（時系列性は front matter / fragment 命名側で担保）
- merge driver はリポジトリ側設定のみ。`.git/config` への登録は不要

## 6. AC-4 充足根拠

- 適用対象は **行独立 Markdown のみ**（`.md`、append-only）に限定
- `*.json` / `*.yaml` / 構造体は明示除外し、cell 単位で根拠を付した
- A-2 移行完了後の解除手順を併記し、暫定策としての位置付けを明確化
