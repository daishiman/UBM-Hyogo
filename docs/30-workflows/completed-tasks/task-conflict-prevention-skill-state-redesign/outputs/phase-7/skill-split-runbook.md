# A-3 実装ランブック — SKILL.md Progressive Disclosure 分割

## 適用範囲

`.claude/skills/*/SKILL.md` のうち **200 行を超えるもの** が対象。
代表事例: `task-specification-creator/SKILL.md`（既存で 200 行超）。

## 分割方針

| 役割 | ファイル | 内容 |
| --- | --- | --- |
| index 役（200 行未満） | `SKILL.md` 本体 | front matter / 1 段落の目的 / trigger / Anchors / references リンク表 / 最小 workflow |
| 詳細 topic | `references/<topic>.md` | 単一責務トピックの詳細 |

SKILL.md は「概要 + Anchors + topic への相対リンク表」のみを保持。
各 references は **単一責務 topic** とし、worktree 間で同時編集しにくい粒度に切る。

## Step 1 — 棚卸し

```bash
for f in .claude/skills/*/SKILL.md; do
  printf '%5d  %s\n' "$(wc -l < "$f")" "$f"
done | sort -nr
```

200 行超の SKILL.md を **対象リスト** として固定。

## Step 2 — `task-specification-creator/SKILL.md` の分割例

推測トピック（実装タスクで現行 SKILL.md を読んで確定する）:

| topic | 配置例 | 想定責務 |
| --- | --- | --- |
| phase-templates | `references/phase-templates.md` | Phase 1〜13 テンプレ規約 |
| asset-conventions | `references/asset-conventions.md` | `assets/` 配下のテンプレ運用 |
| quality-gates | `references/quality-gates.md` | Phase 9 品質ゲート定義 |
| orchestration | `references/orchestration.md` | skill 連携 / loader 仕様 |

分割後 SKILL.md の構成（テンプレ）:

```markdown
# task-specification-creator

<概要 5〜10 行>

## Anchors
- ...

## References
| topic | path |
| --- | --- |
| Phase テンプレ | references/phase-templates.md |
| アセット規約 | references/asset-conventions.md |
| 品質ゲート | references/quality-gates.md |
| オーケストレーション | references/orchestration.md |
```

## Step 3 — 抽出手順

```bash
skill_dir=.claude/skills/task-specification-creator
mkdir -p "$skill_dir/references"

# 既存 references がある場合は重複を確認
ls "$skill_dir/references" || true

# 各 topic を切り出し（編集はエディタで実施）
$EDITOR "$skill_dir/SKILL.md" "$skill_dir/references/phase-templates.md"
```

切り出しの原則:

1. SKILL.md → references の参照は **片方向**（references から SKILL.md へ戻り参照しない）
2. references 同士の循環参照禁止
3. front matter / Anchors はトピックの単一責務に揃える

## Step 4 — 200 行未満達成の検証 (AC-3 達成根拠)

```bash
for f in .claude/skills/*/SKILL.md; do
  lines=$(wc -l < "$f")
  if [[ $lines -ge 200 ]]; then
    echo "FAIL: $f = $lines lines"
  else
    echo "OK:   $f = $lines lines"
  fi
done
```

すべて `OK` であることを確認 → **AC-3 達成根拠**として Phase 11 ログに添付。

## Step 5 — Progressive Disclosure 整合確認

| 観点 | コマンド / 観察 |
| --- | --- |
| skill loader が references を解決できる | `pnpm skill:doctor` 等（実装タスク側で提供） |
| 全 references が SKILL.md からリンクされる | `rg -n 'references/' .claude/skills/<skill>/SKILL.md` |
| 未参照 reference がない | `find references -type f` × `rg` で消し込み |
| references ディレクトリの存在 | `test -d .claude/skills/<skill>/references` |

## ロールバック手順

1. references をすべて削除
2. SKILL.md を分割前バックアップ（`git stash` or commit 単位）から復元
3. commit: `revert(skill): rollback A-3 progressive disclosure split`

## 注意

- 既存 `.claude/skills/aiworkflow-requirements/references/` のように既に分割済みの skill は対象外
- 分割は「メカニカルなセクション切り出し」のみ。**意味的な書き換えは別タスク**
- SKILL.md が entrypoint として機能しつづけることを最優先（loader が見つけられないと skill 全体が動かない）
