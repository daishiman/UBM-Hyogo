# Phase 1: 要件定義 - skill-ledger-b1-gitattributes

> **状態**: completed
> **作成日**: 2026-04-28
> **対象タスク**: append-only skill ledger への `merge=union` 適用（B-1）
> **GitHub Issue**: #132
> **原典**: `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-b1-gitattributes.md`

---

## 1. 背景と問題

### 1.1 背景

`task-conflict-prevention-skill-state-redesign` は、`.claude/skills/<skill>/` 配下の派生物 / 正本境界に起因する並列 worktree merge conflict を 0 件化するため、4 施策（A-1: gitignore 化 / A-2: fragment 化 / A-3: Progressive Disclosure 化 / B-1: `merge=union` 適用）を確定した。

このうち A-2 fragment 化（1 worktree = 1 fragment ファイル名 timestamp 戦略）が本筋であり、append-only ledger は `LOGS/<timestamp>-<branch>-<sha>.md` のような **ファイル単位で衝突しない** 構造へ移行する。fragment は worktree ごとに必ず新規ファイルとなるため、Git の通常 merge で衝突は発生しない。

しかし以下のケースが残存する。

1. **A-2 移行猶予中の `_legacy.md` 系**: 既存 `LOGS.md` / `changelog.md` を `_legacy.md` に rename して凍結し、新規記録は fragment 側に書く構造で A-2 を実施する。`_legacy.md` は移行期間中も append が起きうる（例: 過去ログへの注釈追記、修正パッチ）。
2. **外部仕様で fragment 化できない行独立 Markdown**: 外部仕様や運用上の制約で「単一ファイルに append し続けるしかない」行独立な Markdown が一定数残る（例: skill-feedback-report の累積 ledger 等）。
3. **skill 自身の `_legacy.md`**: ドッグフーディング由来で skill 自身（`task-specification-creator/changelog/_legacy.md` / `aiworkflow-requirements/LOGS/_legacy.md` 等）にも `_legacy.md` が生まれる。これも A-2 移行猶予中は append-only ledger として残る。

これらは append-only であっても **同一末尾行** をめぐり通常の Git merge では衝突する。Git ビルトインの `merge=union` ドライバを `.gitattributes` で限定適用することで、両 worktree の追記行をそのまま並べる行単位機械マージが可能になり、merge 衝突を 0 件化できる。

### 1.2 問題点・課題

- **append-only でも末尾行衝突は発生する**: Git の 3-way merge は base / ours / theirs の差分を行ベースで比較するため、両 worktree が同じ位置（末尾）に異なる行を追記すると衝突する。append-only という性質だけでは衝突を防げない。
- **`merge=union` は両刃の剣**: 行単位マージしか行わないため、構造体（JSON / YAML / lockfile）に当てると静かに破損する。pattern を慎重に絞り込まないと事故が広範に広がる。
- **pending策の負債化**: `_legacy.md` への merge=union は本来、A-2 fragment 化が完了した時点で不要になるpending策。解除手順を明記しないと永続化し、技術負債として残る。
- **適用範囲の見極めが難しい**: skill 配下には `_legacy.md` 系以外にも append-only Markdown が混在しうる。「行独立であるか」を機械的に判定する基準が必要。
- **A-1〜A-3 未完での先行適用は二重管理を招く**: 派生物境界（A-1）/ fragment 化（A-2）/ SKILL.md 分割（A-3）の境界が確立される前に B-1 を当てると、後で削除すべき行が `.gitattributes` に残り、解除コストが増大する。

### 1.3 放置した場合の影響

- A-2 fragment 化で吸収しきれない `_legacy.md` への両側追記で merge コンフリクトが発生し、並列開発が止まる
- A-2 移行猶予中（A-2 着手後〜B-1 解除前）の数ヶ月間、`_legacy.md` 衝突解消の最終手段が存在しない
- 行独立性チェックの自動化が無いまま、将来誰かが「ついでに」`**/*.md` のような broad な glob で `merge=union` を広げると、JSON / YAML / SKILL.md が静かに破損する事故が起こりうる

---

## 2. 真の論点（システム / 戦略 / 問題解決の 3 系統レビュー）

### 2.1 システム論点

- `.gitattributes` の所有はリポジトリルート単一ファイルに閉じる。skill ごとに `.gitattributes` を分散配置すると、driver の有効範囲が把握困難になる
- `merge=union` は Git ビルトインドライバであり、外部依存を導入しない。custom merge driver（`.git/config` への登録 + script）と比べて運用コストが圧倒的に低い
- attribute は **merge 時のみ** 作用する。staging / commit / log には影響しないため、ロールバックは `.gitattributes` 該当行の `git revert` で完了し、既存ファイル本体への副作用はない

### 2.2 戦略論点

- B-1 は 4 施策の **最後** に位置する保険施策である。先行投入すると本来 A-2 で解決すべき範囲にまで driver が残り、A-2 完了後に二重管理化する
- 解除条件と解除手順を **着手前から明文化** することで、pending策の永続化を防ぐ。`.gitattributes` 内コメントに解除条件を埋め込み、A-2 完了レビューチェックリストに「B-1 attribute 残存確認」を追加する設計を Phase 2 で固定する
- pattern 設計は「広く書きすぎない」ことを最優先する。`**/*.md` のような broad な glob は禁止し、`**/_legacy.md` 系の限定 glob で済ませる

### 2.3 問題解決論点

- **行独立性の判定**: 対象候補 Markdown に対して以下の機械判定を Phase 1 で適用する
  - front matter（`^---$` で始まる YAML block）を持つもの → 除外
  - コードフェンス（` ``` `）を含むもの → 除外（コードブロック内行は構造的に独立でない）
  - インデント階層構造を持つもの（リスト / 表）→ 行順依存があるため要注意。append のみで使う運用が確立しているもののみ対象
  - JSON / YAML 構造体（`{` / `[` / key-value）→ 除外
- **対象 path の固定**: `git ls-files '.claude/skills/**/_legacy.md' '.claude/skills/**/LOGS/_legacy.md' '.claude/skills/**/changelog/_legacy.md' '.claude/skills/**/lessons-learned/_legacy*.md'` で機械的に列挙し、A-2 完了後の実態に基づく
- **検証の二重化**: `git check-attr merge` を **対象側 / 除外側 双方** に対して実行することで、誤適用を必ず検出する

---

## 3. 適用対象 path 列挙

### 3.1 列挙コマンド

```bash
# A-2 完了後の実態に基づく機械列挙
git ls-files \
  '.claude/skills/**/_legacy.md' \
  '.claude/skills/**/LOGS/_legacy.md' \
  '.claude/skills/**/changelog/_legacy.md' \
  '.claude/skills/**/lessons-learned/_legacy*.md'
```

### 3.2 期待される候補（A-2 設計 + ドッグフーディング知見）

| 候補 path | 由来 | 行独立性判定 |
| --- | --- | --- |
| `.claude/skills/<skill>/LOGS/_legacy.md` | A-2 で `LOGS.md` を凍結 rename | append のみの行独立 Markdown → 対象 |
| `.claude/skills/<skill>/changelog/_legacy.md` | A-2 で `changelog.md` を凍結 rename | append のみの行独立 Markdown → 対象 |
| `.claude/skills/<skill>/lessons-learned/_legacy*.md` | lessons-learned 系の凍結 | append のみの行独立 Markdown → 対象 |
| `.claude/skills/task-specification-creator/SKILL-changelog/_legacy.md` | F-2（skill 自身のドッグフーディング） | append のみの行独立 Markdown → 対象 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | F-3（skill 自身のドッグフーディング） | append のみの行独立 Markdown → 対象 |

### 3.3 除外候補（行独立でない / 別カテゴリ）

| path | 除外理由 |
| --- | --- |
| `.claude/skills/<skill>/SKILL.md` | front matter を持ち、Progressive Disclosure 化された structured Markdown |
| `.claude/skills/<skill>/indexes/keywords.json` | JSON 構造体（A-1 で gitignore 化済み） |
| `.claude/skills/<skill>/indexes/index-meta.json` | JSON 構造体（A-1 で gitignore 化済み） |
| `.claude/skills/<skill>/indexes/*.cache.json` | JSON 構造体（A-1 で gitignore 化済み） |
| `.claude/skills/<skill>/LOGS.rendered.md` | A-1 で gitignore 化された派生物 |
| `.claude/skills/<skill>/LOGS/<timestamp>-*.md` | fragment は元々衝突しない（worktree ごとに別ファイル名）|
| `.claude/skills/<skill>/references/*.md` | front matter を持つ structured Markdown / コードフェンス含む |
| `pnpm-lock.yaml` | YAML 構造体 |
| `lefthook.yml` / `*.yaml` / `*.yml` | YAML 構造体 |
| `apps/**/*.ts` / `*.tsx` / `*.js` | コード（行独立でない） |
| `CHANGELOG.md`（root） | skill ledger 範疇外 |

---

## 4. 行独立性判定基準

Phase 1 棚卸し時に各候補 Markdown に対して以下を機械判定する。**1 つでも該当した時点で対象から除外** する。

### 4.1 除外条件

| 条件 | 検出コマンド例 | 除外理由 |
| --- | --- | --- |
| front matter `^---$` を持つ | `head -n 1 <file> \| grep -q '^---$'` | `merge=union` で `---` が重複 / 順序逆転し意味が壊れる |
| コードフェンス ` ``` ` を含む | `grep -q '^```' <file>` | コードブロック内行は構造的に独立でない |
| JSON 構造体 | 拡張子 `.json` / `.json5` / `.jsonc` | 行マージで構造体が破損する |
| YAML 構造体 | 拡張子 `.yaml` / `.yml` | インデント階層の行マージで構造体が破損する |
| 表構造（pipe table） | `grep -q '^\|' <file>` | カラム整合が壊れる可能性 |
| インデント階層リスト主体 | 目視判定 | 親子関係が壊れる |

### 4.2 包含条件（対象とする）

- ファイル名が `_legacy.md` または `_legacy*.md` パターン
- 中身が「flat な箇条書き append」または「flat な見出し + 段落 append」のみで構成される
- A-2 で凍結 rename された ledger（A-2 設計で `_legacy.md` 命名規約に準拠）

---

## 5. スコープ

### 5.1 含む

- `.gitattributes` への B-1 セクション追記（仕様レベル）
- 適用対象 path 列挙の仕様化（`git ls-files` ベース）
- 行独立性判定基準の明文化
- 除外マトリクス（JSON / YAML / SKILL.md / lockfile / コード）の固定
- `git check-attr merge` による対象 / 除外双方の検証手順
- 4 worktree 並列追記 smoke の検証コマンド系列の仕様レベル定義
- 解除条件（A-2 完了後の `_legacy.md` 空化判定）と解除手順（`.gitattributes` 該当行削除）の明文化

### 5.2 含まない

- 実 `.gitattributes` 編集（派生実装タスクで実施）
- A-1 / A-2 / A-3 の実施
- root `CHANGELOG.md` への適用
- `merge=union` 以外の merge driver 導入（custom driver / `merge=ours` 等）
- `_legacy.md` 命名規約違反の CI 検出スクリプト（A-2 完了後の補助タスク）
- skill 自身の現役 fragment（`LOGS/<timestamp>-*.md`）への driver 適用

---

## 6. 受入条件

- **AC-1**: `.gitattributes` に B-1 セクション（コメント + `merge=union` pattern 群）が追加され、リポジトリルート単一ファイルに閉じる構造で固定されている。
- **AC-2**: pattern が `**/_legacy.md` 系の **行独立 append-only Markdown のみ** に限定されており、`**/*.md` のような broad な glob を一切含まない。
- **AC-3**: JSON / YAML / `**/SKILL.md` / lockfile / コードファイルに対して `git check-attr merge` が `unspecified` を返すことを検証マトリクスで担保している。
- **AC-4**: A-1 / A-2 / A-3 完了を必須前提とする旨が Phase 1 / 2 / 3 の 3 箇所で重複明記されている。
- **AC-5**: 4 worktree（最低 2 worktree）並列追記 smoke のコマンド系列が Phase 2 に固定されている。
- **AC-6**: 行独立性判定基準（front matter / コードフェンス / JSON-YAML 構造体 / 階層リスト）が Phase 1 で明記され、対象から除外される。
- **AC-7**: A-2 fragment 化完了時の解除条件と解除手順が `.gitattributes` 内コメントおよび Phase 2 / 3 の解除設計セクションに明文化されている。
- **AC-8**: ロールバック設計（`git revert` 1 コミット粒度）が Phase 2 / 3 のレビュー対象に含まれている。
- **AC-9**: タスク種別 `docs-only` / `visualEvidence: NON_VISUAL` / `scope: infrastructure_governance` / `priority: LOW` が Phase 1 で固定され、`artifacts.json.metadata` と一致している。
- **AC-10**: Phase 3 で代替案（A: 純 `merge=union` / B: `**/*.md` 広範適用 / C: custom merge driver / D: B-1 対象限定 + 解除手順明記 = base case）の 4 案以上が PASS/MINOR/MAJOR で評価され、base case D が PASS で確定している。
- **AC-11**: Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致し、4 条件（価値性 / 実現性 / 整合性 / 運用性）がすべて PASS。

---

## 7. 4 条件評価

### 7.1 価値性（Value）

- **PASS**: A-2 で吸収しきれない `_legacy.md` への両側追記衝突を機械マージで 0 件化できる。並列開発の停止リスクを直接解消する。
- 4 worktree 並列開発というプロジェクト前提（CLAUDE.md / new-worktree.sh）に対して、最後の保険として明確な価値を提供する。

### 7.2 実現性（Feasibility）

- **PASS**: `merge=union` は Git ビルトインドライバ。`.gitattributes` 1 行の追記で完結。CI / テスト / ランタイム影響なし。
- ロールバックは `git revert` 1 コミット粒度で完了し、既存ファイル本体への副作用なし。

### 7.3 整合性（Consistency）

- **PASS**: A-1（派生物 gitignore 化）/ A-2（fragment 化）/ A-3（SKILL.md 分割）と整合する境界設計（行独立 `_legacy.md` のみ対象）。
- task-conflict-prevention-skill-state-redesign Phase 7 の runbook と整合し、矛盾しない。
- 不変条件 #5（D1 アクセス境界）に抵触しない。

### 7.4 運用性（Operability）

- **PASS（with notes）**: 解除条件と解除手順の明文化が必要。`.gitattributes` 内コメント + A-2 完了レビューチェックリスト連動で運用負債を防ぐ。
- 検証は `git check-attr merge` のみで完結し、専用ツール不要。

---

## 8. 既存命名規則の確認

- A-2 で `_legacy.md` 命名規約が固定されることが前提（凍結 rename 先 = `_legacy.md` または `<dir>/_legacy.md`）。
- pattern は `**/_legacy.md` および `**/_legacy*.md` 系の単一 glob 群で統一する。新規 skill 作成時に `_legacy.md` 命名規約違反が起きると B-1 効果が部分的に失われるため、A-2 で命名規約を CI 検出可能な形で固定する補助タスクを別途定義する（B-1 スコープ外）。

---

## 9. carry-over 確認

| 項目 | 確認 |
| --- | --- |
| 原典スペック §3.1 前提条件 | A-1 / A-2 / A-3 main マージ済を 3 箇所で重複明記 → 反映済 |
| 原典スペック §4 Phase 1〜4 | Phase 2「pattern 設計」/ Phase 3「`.gitattributes` 適用」/ Phase 4「smoke 検証」を本ワークフローの Phase 1〜2（仕様）/ Phase 5〜11（実装）に分解再配置 |
| 原典スペック §7 リスク | JSON/YAML 誤適用 / front matter 重複 / 行順非保証 / 負債化 / A-1〜A-3 先行依存 を Phase 2 / 3 のリスクセクションへ持ち越し |
| 原典スペック §9 ドッグフーディング由来 | skill 自身の `_legacy.md`（`changelog/_legacy.md` / `LOGS/_legacy.md`）を適用対象に含める旨を §3.2 候補表に反映 |
| Phase 7 runbook | 対象 / 除外マトリクスを Phase 2 設計の正本とする |
| Phase 2 pattern | 許可マトリクスの根拠を Phase 2 設計の参照元として固定 |
