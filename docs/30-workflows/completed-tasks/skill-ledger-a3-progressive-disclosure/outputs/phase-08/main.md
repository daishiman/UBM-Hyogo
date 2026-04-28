# Phase 8 — DRY 化 / references 重複棚卸し

Phase 3 で分割した `references/<topic>.md` 群を skill 内で横断 grep し、
重複セクションが発生していないかを棚卸しする。重複検出時は方針 A/B/C のいずれかで
解消する。skill 横断の共通 reference は **本タスクスコープ外** (別タスク化)。

---

## 棚卸し対象 skill (Phase 1 inventory より)

| skill | 状態 |
| --- | --- |
| task-specification-creator | 重点棚卸し (代表例として before/after を作成) |
| automation-30 | 棚卸し対象 |
| skill-creator | 棚卸し対象 |
| github-issue-manager | 棚卸し対象 |
| claude-agent-sdk | 棚卸し対象 |
| aiworkflow-requirements | スコープ外 (既分割の参考レイアウト) |
| int-test-skill, skill-fixture-runner | スコープ外 (200 行未満で分割不要) |

---

## 重複検出のアプローチ

### 一次検出: grep ベース

```bash
# skill 単位で references 内の章タイトルを列挙
for skill in .claude/skills/*/; do
  echo "=== $skill ==="
  rg -n '^## ' "$skill/references/" 2>/dev/null || true
done

# 同一フレーズの重複頻度を測る (例)
rg -c '品質ゲート|Quality Gate|Phase テンプレ' .claude/skills/<skill>/references/
```

### 方針判定マトリクス (A / B / C / D)

| # | 状況 | 推奨方針 |
| --- | --- | --- |
| A | 同 skill 内で 2 ファイル以上に同一章が物理コピー | **A. 別 reference (例: `references/_shared.md`) に切り出して両方から単方向参照** |
| B | entry SKILL.md にも references にも同概要が散在 | **B. entry に戻し references からは削除** |
| C | 同名章でも責務が異なる (例: phase-templates の「品質ゲート」と quality-gates の「品質ゲート」が別概念) | **C. 重複許容、両方に責務注記を付与** |
| D | skill 横断で同 Anchor 説明が出現 | **D. スコープ外 (別タスク化)** |

### 候補表 (棚卸しテンプレート)

> 実値は対象 skill ごとに記入。spec_created 段階では候補抽出規約のみ確定。

| skill | 重複候補 (章タイトル / フレーズ) | 出現ファイル | 方針 (A/B/C/D) | 備考 |
| --- | --- | --- | --- | --- |
| task-specification-creator | 「品質ゲート判定基準」 | `phase-templates.md`, `quality-gates.md` | A | 共通判定基準を quality-gates に集約 |
| task-specification-creator | 「Phase 構造の概要」 | `phase-templates.md`, SKILL.md | B | entry に戻す |
| task-specification-creator | 「Anchors 命名規約」 | (skill 横断で発生する可能性) | D | skill 横断スコープ外として未タスク化 |

---

## 循環参照の禁止と依存グラフ

- references 同士の参照は **DAG (有向非巡回グラフ)** 必須。
- 検出: `rg -n 'references/' .claude/skills/<skill>/references/` で各 reference の依存先を抽出 → トポロジカルソート可能性を目視。
- 違反例: `phase-templates.md → quality-gates.md → phase-templates.md` (往復) は禁止。
- 解決: 共通要素を 3 つ目の reference (例: `references/_shared/judgement-criteria.md`) に切り出し、両者から単方向参照。
- 自動化補助: Phase 4 V2 拡張の `link-integrity.sh` 内 reverse-link 検査で SKILL.md への戻り参照は 0 件確認済み。references 同士の DAG 確認は Phase 8 で目視 (追加自動化は別タスク)。

依存グラフ作成手順:

```bash
SKILL=task-specification-creator
echo "graph LR" > /tmp/$SKILL-graph.txt
for ref in .claude/skills/$SKILL/references/*.md; do
  src=$(basename "$ref" .md)
  rg -No 'references/[A-Za-z0-9_./\-]+\.md' "$ref" 2>/dev/null \
    | sort -u \
    | while read -r dep; do
        dst=$(basename "${dep%.md}")
        echo "  $src --> $dst" >> /tmp/$SKILL-graph.txt
      done
done
cat /tmp/$SKILL-graph.txt
```

---

## skill 横断の共通 reference (スコープ外)

- 複数 skill にまたがる共通章 (例: 全 skill 共通の Anchors 規約、共通 trigger 定義) は **本タスクで処理しない**。
- 理由:
  1. A-3 不変条件「機械的 cut & paste のみ」「1 PR = 1 skill」を破る。
  2. 共通化は skill-creator テンプレ整備として再発防止策の文脈で扱うべき。
- 受け皿:
  - 検出した skill 横断候補は `outputs/phase-12/unassigned-task-detection.md` に未タスクとして登録。
  - 再発防止策 (skill-creator テンプレへの 200 行制約組込み) も同ファイルに登録。

---

## 解消後の行数再見積もり

> 実測は Phase 11 で確定。本ドキュメントでは budget の不変を確認する観点を固定。

| skill | entry before | entry after (Phase 5 案) | 重複解消後 entry | budget < 200 |
| --- | --- | --- | --- | --- |
| task-specification-creator | 517 | < 200 (見込) | < 200 (本文重複は references 内部の解消であり entry 行数に影響しない) | PASS (必達) |
| automation-30 | 432 | < 200 | < 200 | PASS |
| skill-creator | 402 | < 200 | < 200 | PASS |
| github-issue-manager | 363 | < 200 | < 200 | PASS |
| claude-agent-sdk | 324 | < 200 | < 200 | PASS |

> 重複解消で references 内本文行数は減るが、entry 側は references リンク表で参照するのみのため変動しない。AC-1 / AC-6 監視は Phase 4 V1 で継続。

---

## 実行手順 (Phase 8)

### ステップ 1: 重複候補の列挙

- 各 skill の `references/` を `rg` で章単位走査し、出現ファイル一覧を表化。

### ステップ 2: 方針判定 (A / B / C / D)

- 候補ごとに方針マトリクス参照で判定。
- D (skill 横断) は `outputs/phase-12/unassigned-task-detection.md` 送出予定リストへ追記。

### ステップ 3: 依存グラフ作成と循環検査

- references 間リンクを列挙し DAG であることを目視。
- 循環検出時は 3 つ目の reference 切り出し案を Phase 5 ランブックへフィードバック。

### ステップ 4: スコープ境界の明文化

- skill 横断は本タスクスコープ外。Phase 12 unassigned-task-detection に登録予約。

### ステップ 5: Before / After サンプル作成

- `task-specification-creator` の Phase テンプレ × quality-gates 重複を `outputs/phase-08/before-after.md` に記述。

### ステップ 6: 行数再見積もり

- 重複解消後も entry < 200 行が維持されることを Phase 4 V1 で再確認 (Phase 11 実測)。

---

## 多角的チェック観点

- 価値性: 重複解消で worktree 並列編集時の衝突面積がさらに縮小。
- 実現性: 解消手順がメカニカル cut & paste 原則を破らない (方針 A はファイル間移動のみ)。
- 整合性: 循環参照禁止 / 単方向参照原則 / 1 PR = 1 skill が維持。
- 運用性: 解消後も loader が必要とする情報が entry に残存 (V5 で確認)。
- スコープ境界: skill 横断は別タスク化として明示。
- 行数: 解消後も AC-1 (200 行未満) が維持。

---

## 完了条件

- [x] 各対象 skill で重複候補表のテンプレートが存在
- [x] 全候補に方針 A/B/C/D が付与可能
- [x] 循環参照ゼロが依存グラフ作成手順で確認可能
- [x] skill 横断はスコープ外として明記
- [x] before/after サンプル先 (before-after.md) を別出し
- [x] 重複解消後も entry < 200 行が維持される観点を記述
