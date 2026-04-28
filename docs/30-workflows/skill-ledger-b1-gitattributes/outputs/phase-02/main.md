# Phase 2: 設計 - skill-ledger-b1-gitattributes

> **状態**: completed
> **作成日**: 2026-04-28
> **対象タスク**: append-only skill ledger への `merge=union` 適用（B-1）
> **GitHub Issue**: #132
> **入力**: Phase 1 要件定義 (`outputs/phase-01/main.md`)

---

## 1. トポロジ

### 1.1 実行モード

- **execution_mode**: `serial`（単独 PR）
- **並列タスク**: なし
- **依存タスク**: A-1 / A-2 / A-3（すべて main マージ済み必須）
- **後続タスク**: なし（B-1 は 4 施策の最後）

### 1.2 PR 構成

- 派生実装タスクの単一 PR で `.gitattributes` 1 ファイルのみを編集
- コミット粒度: 1 コミット（pattern 追記 + コメント）
- ロールバック単位: 1 コミットの `git revert`

### 1.3 Wave 配置

- Wave 0（infrastructure governance）
- A-1 / A-2 / A-3 と同じ Wave だが、実行は最後に直列化

---

## 2. ファイル変更計画

### 2.1 編集対象ファイル

| パス | 変更種別 | 変更内容 |
| --- | --- | --- |
| `.gitattributes`（リポジトリルート） | 追記（既存ファイルがあればセクション追加。なければ新規作成） | B-1 セクション = コメント（解除条件 + 適用範囲 + 禁止事項）+ `merge=union` pattern 群 |

### 2.2 編集禁止ファイル

- `.git/info/attributes`（リポジトリ間で共有されないため不可）
- `.claude/skills/<skill>/.gitattributes`（分散配置は禁止。所有はルートに一本化）
- skill 配下の `_legacy.md` 本体（attribute は merge 時のみ作用するため本体編集不要）
- `lefthook.yml` / hook script（B-1 では新規 hook 不要）

### 2.3 セクション構造（仕様レベル）

```gitattributes
# === B-1: append-only skill ledger merge=union ===
# 目的: A-2 fragment 化で吸収しきれない `_legacy.md` 系（移行猶予中の集約 ledger）の
#       並列 worktree 追記行衝突を機械マージで 0 件化する。
#
# 解除条件: A-2 fragment 化完了レビュー時に該当 `_legacy.md` が空または不要になった時点で
#           該当行を削除する（永続化禁止）。
#
# 適用禁止: JSON / YAML / SKILL.md / lockfile / コードファイル / front matter 付き Markdown
#
# pattern は `**/_legacy.md` 系の限定 glob のみ。`**/*.md` のような broad な glob は禁止。
.claude/skills/**/_legacy.md                        merge=union
.claude/skills/**/LOGS/_legacy.md                   merge=union
.claude/skills/**/changelog/_legacy.md              merge=union
.claude/skills/**/lessons-learned/_legacy*.md       merge=union
.claude/skills/**/SKILL-changelog/_legacy.md        merge=union
# === /B-1 ===
```

> 上記は **仕様レベルの diff 形式** であり、実 `.gitattributes` 編集は 派生実装タスクで実施する。

---

## 3. pattern 設計

### 3.1 許可マトリクス（適用対象）

| pattern | 想定される具体 path 例 | 行独立性判定 | 由来 |
| --- | --- | --- | --- |
| `.claude/skills/**/_legacy.md` | `.claude/skills/some-skill/_legacy.md` | flat append-only Markdown | A-2 凍結 rename |
| `.claude/skills/**/LOGS/_legacy.md` | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | flat append-only | A-2 + ドッグフーディング F-3 |
| `.claude/skills/**/changelog/_legacy.md` | `.claude/skills/task-specification-creator/changelog/_legacy.md` | flat append-only | A-2 + ドッグフーディング F-2 |
| `.claude/skills/**/lessons-learned/_legacy*.md` | `.claude/skills/<skill>/lessons-learned/_legacy.md` | flat append-only | A-2 凍結 rename |
| `.claude/skills/**/SKILL-changelog/_legacy.md` | `.claude/skills/task-specification-creator/SKILL-changelog/_legacy.md` | flat append-only | F-2 |

### 3.2 除外マトリクス（適用禁止）

| 除外対象 | 例 | `git check-attr merge` 期待値 | 理由 |
| --- | --- | --- | --- |
| JSON 全般 | `**/*.json` | `unspecified` | 構造体破損 |
| `indexes/keywords.json` | `.claude/skills/<skill>/indexes/keywords.json` | `unspecified` | A-1 で gitignore 化済 + JSON |
| `indexes/index-meta.json` | 同上 | `unspecified` | 同上 |
| `*.cache.json` | `.claude/skills/<skill>/indexes/*.cache.json` | `unspecified` | 同上 |
| YAML 全般 | `**/*.yaml` / `**/*.yml` | `unspecified` | インデント構造体破損 |
| `lefthook.yml` | repo root | `unspecified` | YAML 構造体 |
| `pnpm-lock.yaml` | repo root | `unspecified` | lockfile 構造体破損で依存解決不能化 |
| `**/SKILL.md` | `.claude/skills/<skill>/SKILL.md` | `unspecified` | front matter + structured Markdown |
| 現役 fragment | `.claude/skills/<skill>/LOGS/<timestamp>-*.md` | `unspecified` | fragment は worktree ごとに別ファイル名で衝突しない |
| references | `.claude/skills/<skill>/references/*.md` | `unspecified` | front matter + コードフェンス |
| コード | `**/*.ts` / `**/*.tsx` / `**/*.js` | `unspecified` | 行独立でない |
| root `CHANGELOG.md` | `CHANGELOG.md` | `unspecified` | skill ledger 範疇外 |
| `LOGS.rendered.md` | `.claude/skills/<skill>/LOGS.rendered.md` | `unspecified` | A-1 で gitignore 化済の派生物 |

### 3.3 pattern 設計原則

1. **限定 glob のみ**: `**/_legacy.md` 系の固定パターンに絞る。`**/*.md` は禁止。
2. **コメント二重化**: pattern 追記の直前に「適用禁止対象」「解除条件」「broad glob 禁止」をコメントで明記。
3. **ファイル名末尾固定**: `_legacy.md` または `_legacy*.md` で終わる pattern のみを許可。中間階層名（例: `legacy/`）は対象外。
4. **dotfile / hidden 配下除外**: `.git/`, `.github/`, `.husky/`, `.next/`, `.wrangler/` 等は明示的に対象外（pattern が `.claude/skills/` 配下に閉じているため自動的に除外される）。

---

## 4. State Ownership 表

| エンティティ | 所有者 | 書き込み権限 | 読み取り境界 |
| --- | --- | --- | --- |
| `.gitattributes`（リポジトリルート単一ファイル） | 本タスク（B-1） | 派生実装タスクの B-1 PR のみが追記。他タスクは触らない | Git merge 時に Git 自身が読む |
| merge driver `union` の有効範囲 | Git ビルトイン | N/A（ドライバ実装は Git 内蔵） | `**/_legacy.md` 系のみ |
| `_legacy.md` 本体 | A-2（凍結 rename 元） | A-2 完了後は append のみ。fragment 移行後は read-only | 各 worktree |
| 現役 fragment（`LOGS/<timestamp>-*.md`） | A-2 | worktree ごとに新規作成。merge=union 適用なし | 各 worktree |
| 派生物（`indexes/*.json`） | A-1（gitignore 化済） | hook が再生成。merge=union 対象外 | 各 worktree |

### 4.1 解除条件

A-2 fragment 化完了レビュー時に以下のいずれかを満たした `_legacy.md` 該当行を `.gitattributes` から削除する。

1. `_legacy.md` がリポジトリから削除された（`git ls-files <path>` で出ない）
2. `_legacy.md` が事実上 read-only 化し、append が発生しなくなった（A-2 完了時点 + 一定期間追記が無いことをレビューで確認）

### 4.2 解除手順

```bash
# 該当行を `.gitattributes` から削除
$EDITOR .gitattributes

# コミット
git add .gitattributes
git commit -m "chore(skill-ledger): release merge=union for <path> (B-1 completion)"

# 検証
git check-attr merge -- <path>
# => unspecified
```

または `git revert <B-1-commit-sha>` で 1 コミット粒度ロールバック。

---

## 5. SubAgent Lane 設計

| Lane | 役割 | Phase | 並列性 |
| --- | --- | --- | --- |
| Lane 1 | 適用対象 path 列挙（`git ls-files` 実行 + 行独立性判定） | Phase 1 / 5 | 単独 |
| Lane 2 | `.gitattributes` 編集（pattern 追記 + コメント） | Phase 5 | Lane 1 完了後 |
| Lane 3 | `git check-attr` 検証（対象 / 除外双方） | Phase 5 / 9 | Lane 2 完了後 |
| Lane 4 | 4 worktree smoke 実行 + 証跡記録 | Phase 11 | Lane 3 完了後 |

> Lane 数は **4 以下**（タスク仕様 SubAgent 上限に準拠）。各 Lane は serial 依存で、並列実行は行わない（B-1 は本質的に直列タスク）。

---

## 6. Validation Path

### 6.1 対象側検証

```bash
# Phase 1 候補列挙
git ls-files \
  '.claude/skills/**/_legacy.md' \
  '.claude/skills/**/LOGS/_legacy.md' \
  '.claude/skills/**/changelog/_legacy.md' \
  '.claude/skills/**/lessons-learned/_legacy*.md' \
  | while read -r f; do
      result=$(git check-attr merge -- "$f")
      echo "$result"
    done
# 期待: すべて `merge: union`
```

### 6.2 除外側検証

```bash
# 除外対象が `unspecified` であることを確認
for f in \
  ".claude/skills/aiworkflow-requirements/SKILL.md" \
  ".claude/skills/aiworkflow-requirements/indexes/keywords.json" \
  ".claude/skills/aiworkflow-requirements/indexes/index-meta.json" \
  ".claude/skills/task-specification-creator/SKILL.md" \
  "pnpm-lock.yaml" \
  "lefthook.yml" \
  "CHANGELOG.md"; do
    git check-attr merge -- "$f"
done
# 期待: すべて `merge: unspecified`
```

### 6.3 fragment 側検証（誤適用 0 件確認）

```bash
# 現役 fragment（worktree ごとに別ファイル名）には適用されていないこと
git ls-files '.claude/skills/**/LOGS/[0-9]*.md' | while read -r f; do
  git check-attr merge -- "$f"
done
# 期待: すべて `merge: unspecified`
```

---

## 7. 4 worktree Smoke 設計

### 7.1 検証目的

- 同一 `_legacy.md` 末尾に異なる行を追記した複数 worktree を main へ merge した際、**すべての追記行が保存され衝突 0 件** であることを実証する。

### 7.2 コマンド系列（仕様レベル固定）

```bash
# 前提: A-1 / A-2 / A-3 完了済み main、`.gitattributes` に B-1 セクション適用済
git checkout main
git pull --ff-only

# 4 worktree 作成
bash scripts/new-worktree.sh verify/b1-1
bash scripts/new-worktree.sh verify/b1-2
bash scripts/new-worktree.sh verify/b1-3
bash scripts/new-worktree.sh verify/b1-4

# 各 worktree から同一 _legacy.md 末尾追記
TARGET=".claude/skills/aiworkflow-requirements/LOGS/_legacy.md"

for i in 1 2 3 4; do
  ( cd .worktrees/verify-b1-$i && \
    printf -- "- entry from wt%d\n" "$i" >> "$TARGET" && \
    git add "$TARGET" && \
    git commit -m "log(b1-smoke): wt$i append" )
done

# main で順次 merge
git checkout main
for i in 1 2 3 4; do
  git merge --no-ff verify/b1-$i
  echo "merge $i exit=$?"
done

# 検証
git ls-files --unmerged | wc -l            # => 0
for i in 1 2 3 4; do
  grep -c "entry from wt$i" "$TARGET"      # => 1 (各 1 件保存)
done

# 証跡保存
RUN_ID=$(date +%Y%m%d-%H%M%S)
EVIDENCE_DIR="docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-11/evidence/$RUN_ID/b1"
mkdir -p "$EVIDENCE_DIR"
cp "$TARGET" "$EVIDENCE_DIR/_legacy-after-merge.md"
git log --oneline -n 10 > "$EVIDENCE_DIR/git-log.txt"
```

### 7.3 期待される証跡

| 項目 | 期待値 |
| --- | --- |
| `git merge --no-ff` 終了コード | 0（衝突なし） |
| `git ls-files --unmerged` | 0 行 |
| `_legacy.md` 内 `entry from wt1`〜`wt4` の保存 | 4 件すべて 1 件ずつ存在 |
| 行順 | 必ずしも追記順とは限らない（行順非保証は仕様） |

---

## 8. ロールバック設計

### 8.1 ロールバック粒度

- 1 コミット粒度（B-1 PR が単一コミット構成）

### 8.2 ロールバック手順

```bash
# B-1 適用コミット SHA を特定
git log --oneline --all | grep "B-1"

# revert 実行
git revert <B-1-commit-sha>
git push origin <branch>

# 検証（attribute が無効化されていること）
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
# => unspecified
```

### 8.3 副作用範囲

- `.gitattributes` のみが変更される。既存ファイル本体（`_legacy.md` 含む）は変更されない。
- attribute は merge 時のみ作用するため、ロールバック後に既存ファイルへの再書き込みや再生成は不要。
- ロールバック後は通常の Git 3-way merge に戻り、`_legacy.md` への両側追記は再び衝突する可能性がある。これは想定された挙動（B-1 が無くても A-2 fragment 化が完了していれば衝突は限定的）。

---

## 9. 解除手順（A-2 fragment 化完了時）

### 9.1 解除トリガ

A-2 fragment 化完了レビュー時に以下を確認した時点で B-1 解除。

1. 該当 `_legacy.md` が空または削除済み
2. または fragment 化完了から 30 日以上経過し append が発生していない
3. または skill 自身が削除された / 別 skill に統合された

### 9.2 解除手順（部分解除）

特定 path のみ解除する場合。

```bash
# `.gitattributes` から該当行のみ削除
sed -i.bak '/^\.claude\/skills\/<対象 skill>\/LOGS\/_legacy\.md/d' .gitattributes
rm .gitattributes.bak

git add .gitattributes
git commit -m "chore(skill-ledger): release merge=union for <skill>/LOGS/_legacy.md (A-2 完了)"

# 検証
git check-attr merge -- .claude/skills/<対象 skill>/LOGS/_legacy.md
# => unspecified
```

### 9.3 解除手順（全解除）

すべての `_legacy.md` が不要になった場合。

```bash
# B-1 セクション全体を削除（コメント + pattern 群）
$EDITOR .gitattributes

git add .gitattributes
git commit -m "chore(skill-ledger): release B-1 merge=union (all legacy ledger migrated)"
```

### 9.4 A-2 完了レビューチェックリストへの統合

A-2 完了 PR レビュー時に以下を必須項目として追加（A-2 タスク仕様で連携）。

- [ ] B-1 `.gitattributes` 該当行の解除可否を判定
- [ ] 解除可能なら同 PR または直後の PR で解除コミット作成
- [ ] `git check-attr merge` で対象が `unspecified` に戻ったことを確認

---

## 10. 既存コンポーネント再利用可否

| コンポーネント | 再利用可否 | 備考 |
| --- | --- | --- |
| Git ビルトイン `merge=union` ドライバ | **可（必須）** | 外部依存ゼロ。本タスクの中核 |
| `git check-attr` | **可（必須）** | 検証の中核。専用ツール不要 |
| `scripts/new-worktree.sh` | **可** | 4 worktree smoke で使用 |
| lefthook | 不要 | B-1 では新規 hook なし |
| custom merge driver | **不採用** | 外部 script 依存を増やすため Phase 3 代替案 C で却下 |
| `.git/info/attributes` | **不採用** | リポジトリ間で共有されないため。正本 `.gitattributes` のみを使う |

### 10.1 新規導入コンポーネント

なし。`.gitattributes` のテキスト追記のみで完結する。
