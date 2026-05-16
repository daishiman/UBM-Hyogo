# Phase 12: ドキュメント更新

> Phase: 12 / 13
> 名称: ドキュメント更新
> task classification: docs-only task
> visual classification: NON_VISUAL

---

## 必須 7 成果物

| Task | 出力先 | 必須 |
|------|--------|------|
| Task 12-1 | `outputs/phase-12/main.md`（Phase 12 root summary） | 必須 |
| Task 12-2 | `outputs/phase-12/implementation-guide.md`（Part 1 + Part 2） | 必須 |
| Task 12-3 | `outputs/phase-12/system-spec-update-summary.md` | 必須 |
| Task 12-4 | `outputs/phase-12/documentation-changelog.md` | 必須 |
| Task 12-5 | `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力） | 必須 |
| Task 12-6 | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力） | 必須 |
| Task 12-7 | `outputs/phase-12/phase12-task-spec-compliance-check.md`（root evidence） | 必須 |

---

## Task 12-1: main.md

Phase 12 root summary と strict 7 file inventory を記録する。

## Task 12-2: 実装ガイド（Part 1 + Part 2）

### Part 1: 中学生レベル概念説明

**何を作るの？**

学校の時間割を想像してください。クラスごとに「国語の授業に必要な教科書」「数学の授業に必要な定規」など、必要な道具が違いますね。

このタスクでは、私たちのウェブサイトを **3 つのクラス（公開・会員・管理）+ 共通の道具置き場** に分けて、それぞれのクラスに「どの作業（タスク）がどれくらい大事か」を表にまとめます。

**なぜ必要なの？**

22 個ある作業がすべて終わっても、ウェブサイトの「会員ページ」だけ動かない、ということが起こりえます。なぜなら、22 個の作業が「どのページ群に効くか」を整理した一覧表がないからです。

この表を作ると、「あ、会員ページに必須の作業がまだ完璧じゃないんだ」とすぐ気付けます。

**どう作るの？**

1. 22 個の作業について、4 つのクラスごとに「必須」「強関与」「軽関与」「無関係」のラベルを貼る
2. クラス側からも「このクラスの必須作業は何々」と逆向きで書く
3. 別の検証作業（task-23）で見つかった問題が、どのクラスに影響するかをまとめる

---

### Part 2: 技術者向け詳細

#### 成果物

`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md`

#### 構成

- Section 1: 概要 / 凡例（4 分類定義: 必須 / 強関与 / 軽関与 / 無関係）
- Section 2: 4 層定義（PUB 6 routes / MEM 2 routes / ADM 8 routes / COM 3 routes）
- Section 3: Matrix A（タスク → 層、22 行 × 4 列 = 88 セル）
- Section 4: Matrix B（層 → タスク、4 層 × 4 分類バケツ）
- Section 5: WARN / FAIL の層別影響集約
- Section 6: invariant audit（task-24）層別集約
- Section 7: smoke coverage（task-25）層別集約
- Section 8: 戦略 readiness 判定（READY / AT_RISK / BLOCKED）
- Section 9: 脚注 / 参考リンク

#### セル分類アルゴリズム

```
classify(task, layer):
  if task changes structural prerequisites of layer routes:
    return "必須"
  if task implements main feature of any route in layer:
    return "強関与"
  if task locally affects some route in layer:
    return "軽関与"
  return "無関係"
```

#### 双方向一致検証

Matrix A の各セル `(task, layer) = K` について Matrix B の `layer` 内 `K` バケツに `task` が含まれていることを確認する。

#### 入出力契約

| 入力 | 出典 |
|------|------|
| 19 routes 定義 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md` |
| 22 task 主題 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/task-NN/index.md` |
| WARN/FAIL 一覧 | `docs/30-workflows/task-23-.../outputs/phase-5/`（実体）または task-23 spec |
| invariant audit | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md` |
| smoke coverage | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |
| common surface context | `docs/30-workflows/completed-tasks/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/` |

| 出力 | 説明 |
|------|------|
| `MVP-3LAYER-TASK-MAPPING.md` | 上記 9 セクションを含む単一 markdown |

#### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡として `outputs/phase-11/manual-test-result.md` を参照。

---

## Task 12-3: システム仕様更新

### Step 1-A: 完了タスク記録

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/index.md` または `SCOPE.md` の「関連タスク」セクションに task-27 を追加
- 本 task root の `LOGS.md`（存在すれば）と上位 workflow の `LOGS.md` を同 wave で更新

### Step 1-B: 実装状況テーブル

`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` の workflow index / aiworkflow indexes に task-27 を `implemented_local_evidence_captured / docs-only / NON_VISUAL` で記録。

### Step 1-C: 関連タスクテーブル

task-23 / task-24 / task-25 / task-26 と task-27 の依存関係を上位 workflow index に明記。

### Step 2: システム仕様更新（条件付き）

新規インターフェース / 型 / 定数の追加なし → **N/A**

---

## Task 12-4: documentation-changelog

各 Step（1-A / 1-B / 1-C / Step 2）の結果を個別に記録。workflow-local 同期と global skill sync を別ブロックで記述。

---

## Task 12-5: 未タスク検出（0 件でも出力必須）

ソース別チェック:
- 元タスク仕様書「スコープ外」項目
- Phase 3/10 MINOR 指摘
- Phase 11 スコープ外発見事項
- TODO / FIXME / HACK / XXX
- `describe.skip` の旧参照（本タスクは該当なし、docs-only）

判定: 0 件の場合も `unassigned-task-detection.md` を出力し「検出 0 件」と明記。

---

## Task 12-6: skill-feedback-report

| 観点 | 記録 |
|------|------|
| テンプレート改善 | docs-only / NON_VISUAL のタスクで matrix 専用のテンプレ分岐があると効率化が見込める |
| ワークフロー改善 | 上流（task-23/24/25）の outputs 実体待ちが running blocker になりやすい |
| ドキュメント改善 | double-entry matrix の作り方を skill references に追記する案 |

改善点なしでも出力必須。

---

## Task 12-7: phase12-task-spec-compliance-check

Phase 12 Task 12-1〜12-5 / Step 1-A〜1-C / Step 2 判定を root evidence として `phase12-task-spec-compliance-check.md` に集約する。

---

## Phase 12 完了条件

- 必須 7 成果物すべて存在
- `artifacts.json` と `outputs/artifacts.json` の parity 確認
- LOGS.md / SKILL.md 関連の global sync を `documentation-changelog.md` に記録
- `index.md` の phase 表ステータスを同一 wave で更新
- generate-index.js 実行（skill 側）が必要であれば実施
## メタ情報

- Phase: 12 / ドキュメント更新
- taskType: docs-only
- visualEvidence: NON_VISUAL

## 目的

Phase 12 strict 7 と system spec sync を完了する。

## 実行タスク

- strict 7 outputs を作成する。
- aiworkflow-requirements へ task-27 を同期する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [x] Phase 12 strict 7 が存在する。
- [x] system spec sync が記録されている。
