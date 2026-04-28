# Phase 8 — Before / After サンプル (task-specification-creator)

`task-specification-creator/SKILL.md` の Progressive Disclosure 分割における
重複解消の代表例。Phase テンプレ章 × quality-gates 章で同一の品質判定基準
(4 条件 / PASS-MINOR-MAJOR) が二重に提示される問題を、方針 A
(別 reference に切り出して両者から単方向参照) で解消する。

---

## Before (重複ありの状態)

### 構造

```
.claude/skills/task-specification-creator/
├── SKILL.md (517 行)
└── references/
    ├── phase-templates.md            # Phase 1〜13 のテンプレ
    │   └── ## 品質ゲート判定基準 (4 条件 / PASS-MINOR-MAJOR) ← 重複コピー
    ├── quality-gates.md              # 品質ゲート集約
    │   └── ## 品質ゲート判定基準 (4 条件 / PASS-MINOR-MAJOR) ← 重複コピー
    └── ...
```

### 問題点

- 同じ「品質ゲート判定基準」章が 2 ファイルに物理コピー。
- 片方を更新したらもう片方の整合性が崩れるリスク (DRY 違反)。
- 並列読みでレビュアーに「同じ内容が 2 度提示される」体験。
- references 配下のメンテ負荷が二倍化。

### 検出コマンド

```bash
SKILL=task-specification-creator
rg -c '品質ゲート判定基準' .claude/skills/$SKILL/references/
# phase-templates.md:1
# quality-gates.md:1
# → 2 ファイルに重複ヒット
```

---

## After (DRY 解消後)

### 構造

```
.claude/skills/task-specification-creator/
├── SKILL.md (< 200 行)
└── references/
    ├── phase-templates.md            # Phase 1〜13 のテンプレ
    │   └── 「品質ゲート判定基準は [quality-gates.md](./quality-gates.md) を参照」 # 単方向リンク
    ├── quality-gates.md              # ← canonical な集約先
    │   └── ## 品質ゲート判定基準 (4 条件 / PASS-MINOR-MAJOR) ← 一元管理
    └── ...
```

### 解消後のリンク構造 (DAG 維持)

```mermaid
graph LR
  SKILL[SKILL.md] --> PT[references/phase-templates.md]
  SKILL --> QG[references/quality-gates.md]
  PT --> QG
  %% QG → PT への戻り参照は禁止 (DAG 維持)
```

- `phase-templates.md` から `quality-gates.md` への単方向参照のみ。
- `quality-gates.md` から `phase-templates.md` への戻り参照なし。
- 循環参照ゼロ (AC-4 PASS)。

### 解消手順 (Phase 5 cut & paste)

```bash
SKILL=task-specification-creator
# 1. quality-gates.md を canonical として残す (コピー先)
# 2. phase-templates.md の「品質ゲート判定基準」章を削除し、リンクに置換
#    手作業で以下のように編集:
#    -## 品質ゲート判定基準
#    -...本文...
#    +## 品質ゲート判定基準
#    +詳細は [quality-gates.md](./quality-gates.md#品質ゲート判定基準) を参照。
# 3. mirror 同期
rsync -av --delete \
  .claude/skills/$SKILL/ \
  .agents/skills/$SKILL/
diff -r .claude/skills/$SKILL .agents/skills/$SKILL
# 4. 検証
bash outputs/phase-04/scripts/link-integrity.sh
bash outputs/phase-04/scripts/orphan-references.sh
```

---

## Before / After 比較

| 観点 | Before | After |
| --- | --- | --- |
| 「品質ゲート判定基準」章の出現箇所 | 2 ファイル (重複コピー) | 1 ファイル (quality-gates.md) |
| 更新時の整合性リスク | 2 箇所同時更新が必要 | 1 箇所更新で完結 |
| 行数 (`phase-templates.md`) | TBD (重複分含む) | TBD (リンク 1 行に置換され縮小) |
| 行数 (`quality-gates.md`) | TBD | 不変 (canonical) |
| 行数 (entry SKILL.md) | 517 | < 200 (本タスク必達) |
| references 件数 | N | N (件数は不変、本文重複のみ解消) |
| AC-4 (片方向 / 循環なし) | OK (元から DAG) | OK (DAG 維持) |
| AC-7 (リンク切れ 0) | OK | OK (link-integrity.sh PASS) |
| AC-8 (orphan 0) | OK | OK (orphan-references.sh PASS) |

> entry SKILL.md の 200 行未満化は Phase 5 ランブックの主目的であり、本 DRY 解消はその副次効果として references 内のメンテ性を向上させる。

---

## 方針判定の根拠 (なぜ A を選んだか)

| 候補方針 | 採用可否 | 理由 |
| --- | --- | --- |
| A. 別 reference に共通化 | **採用** | 既に `quality-gates.md` という単一責務の reference が存在する。canonical 化が最も自然。 |
| B. entry に戻す | 不採用 | entry は 200 行制約があり、品質ゲート判定基準を戻すと AC-1 を破る。 |
| C. 重複許容 | 不採用 | 両者の責務が同一 (4 条件 / PASS-MINOR-MAJOR の判定基準) であり、責務分化できない。 |
| D. skill 横断スコープ外 | 不採用 | 同一 skill 内の重複であり、A-3 のスコープ内で解消可能。 |

---

## 検証 (Phase 11 で実施予定)

```bash
SKILL=task-specification-creator

# 重複解消後、ヒット数が 1 になることを確認 (canonical 1 + リンク 1 = 2 だが、本文章は 1 のみ)
rg -c '^## 品質ゲート判定基準' .claude/skills/$SKILL/references/
# 期待: quality-gates.md:1 のみ (phase-templates.md は本文を持たないためヒットしない)

# DAG 維持確認
rg -n 'references/phase-templates' .claude/skills/$SKILL/references/quality-gates.md \
  || echo "OK: quality-gates.md は phase-templates.md を逆参照していない"

# 全体検証
bash outputs/phase-04/scripts/link-integrity.sh
bash outputs/phase-04/scripts/orphan-references.sh
bash outputs/phase-04/scripts/line-count.sh
bash outputs/phase-04/scripts/mirror-diff.sh
```

---

## 留意事項 (cut & paste 原則の遵守)

- 本解消はテキストの **物理移動 (削除 + リンクへの置換)** のみで、意味的な書き換えは行わない。
- リンク先 (`./quality-gates.md#品質ゲート判定基準`) のアンカーが正しく機能するため、`quality-gates.md` 側の見出しテキストは一切変更しない。
- F-5 (意味的書き換え混入) のリスクを最小化するため、本 DRY 解消は **本体分割 PR と同一 PR 内** に含めず、必要に応じて Phase 5 PR 計画に従って独立 commit に分離する。
