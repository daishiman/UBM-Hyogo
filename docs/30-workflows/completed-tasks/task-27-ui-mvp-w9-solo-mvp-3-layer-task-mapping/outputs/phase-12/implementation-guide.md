# 実装ガイド（Implementation Guide）

> task-27 / Phase 12 / docs-only / NON_VISUAL
> 本書は `phase-12-documentation.md` の Task 12-2 に対する正本成果物であり、
> Part 1（中学生レベル概念説明）と Part 2（技術者向け詳細）から構成する。

---

## Part 1: 中学生レベル概念説明

### 何を作るの？

このサイトを「学校」にたとえて整理します。

| 学校での場所 | サイトの層 | 含まれるページ数 |
|--------------|------------|------------------|
| 校門前の掲示板（誰でも見られる） | 公開層（PUB） | 6 ページ（トップ・会員名簿・会員詳細・登録・プライバシー・利用規約） |
| 教室（自分の席で勉強する場所） | 会員層（MEM） | 2 ページ（ログイン・マイページ） |
| 職員室（先生だけが入れる場所） | 管理層（ADM） | 8 ページ（管理ダッシュボード・会員/タグ/会合/スキーマ/申請/同一性衝突/監査） |
| 黒板やチョーク（どの教室でも使う共通道具） | 共通層（COM） | 3 つ（error.tsx・not-found.tsx・loading.tsx） |

UI を復旧させるための作業（タスク）は全部で **22 個** あります。
このタスク（task-27）はその 22 個を「学校のどの場所に効く作業か」を一覧表にまとめる仕事です。

### なぜ必要なの？

22 個の作業が全部完了しても、「教室（会員ページ）だけ動かない」という事故が起こりえます。
理由は、どの作業がどの場所に効くかを整理した地図がないと、抜けや重複に気付けないからです。

この地図（マッピング表）があると、次のことが一目で分かります。

- 「教室（会員層）を完成させるのに必須の作業はどれか」
- 「ある作業が終わると、どの場所のどのページに影響するか」
- 「先に検証で見つかった問題（WARN / FAIL）が、どの場所の弱点か」

### どう作るの？

3 ステップで完成させます。

1. **洗い出し**: 22 タスクの目的を `task-NN/index.md` から読み取り、主題を 1 行で要約する。
2. **分類**: 「タスク × 4 層」の表（22 行 × 4 列 = 88 セル）に「必須・強関与・軽関与・無関係」の 4 種類のラベルを貼る。
3. **双方向確認**: 逆方向（層 → タスク）からも同じ表を作り直し、両方向で内容がぴったり一致することを確かめる。これで穴あきや書き忘れが防げる。

---

## Part 2: 技術者向け詳細

### 成果物（出力先）

`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md`

本 task-27 のアプリ実行時コード変更は無し（docs-only / NON_VISUAL）。
生成物は親 workflow `ui-prototype-alignment-mvp-recovery` の completed-tasks 直下に集約する。

### 章構成（9 セクション）

| Section | 内容 |
|---------|------|
| Section 1 | 概要 / 凡例（4 分類定義: 必須 / 強関与 / 軽関与 / 無関係） |
| Section 2 | 4 層定義（PUB 6 routes / MEM 2 routes / ADM 8 routes / COM 3 routes） |
| Section 3 | Matrix A（タスク → 層、22 行 × 4 列 = 88 セル） |
| Section 4 | Matrix B（層 → タスク、4 層 × 4 分類バケツ） |
| Section 5 | WARN / FAIL の層別影響集約（task-23 由来） |
| Section 6 | invariant audit 層別集約（task-24 由来） |
| Section 7 | smoke coverage 層別集約（task-25 由来） |
| Section 8 | 戦略 readiness 判定（READY / AT_RISK / BLOCKED） |
| Section 9 | 脚注 / 参考リンク |

### 4 層定義（19 routes + 3 共通）

| 層 | 略号 | 件数 | 主な routes |
|----|------|------|------------|
| 公開 | PUB | 6 | `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` |
| 会員 | MEM | 2 | `/login`, `/profile` |
| 管理 | ADM | 8 | `/(admin)/admin`, `/(admin)/admin/{members,tags,meetings,schema,requests,identity-conflicts,audit}` |
| 共通 | COM | 3 | `error.tsx`, `not-found.tsx`, `loading.tsx` |

正本は `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`。

### セル分類アルゴリズム（layer × domain の判定ロジック）

各セル `(task, layer)` に対し、上から順に最初に true となった分類を採用する（短絡評価）。

```text
classify(task, layer):
  if task changes structural prerequisites of any route in layer:
    return "必須"         # 例: tokens / primitives / error boundary など層全体が依存する基盤
  if task implements main feature of any route in layer:
    return "強関与"       # 例: 会員一覧の検索フィルタを実装する作業 → PUB
  if task locally affects some route in layer:
    return "軽関与"       # 例: 1 コンポーネントの軽微なリファクタ
  return "無関係"
```

分類は (task, layer) ペアに対して **必ず 1 つだけ** 確定する（多値・未定義禁止）。

### 双方向一致検証

Matrix A（タスク → 層）と Matrix B（層 → タスク）の整合を 2 方向で確認する。

1. **A → B**: Matrix A の各セル `(task_i, layer_j) = K` について、Matrix B の `layer_j` 内 `K` バケツに `task_i` が含まれることを確認する。
2. **B → A**: Matrix B の `layer_j` 内 `K` バケツに含まれる任意の `task_i` について、Matrix A の対応セル `(task_i, layer_j)` が `K` であることを確認する。

両方向で 88 セルすべての整合が取れている場合のみ「双方向一致 = OK」と判定する。
不一致が 1 件でもあれば該当 cell を Section 9 の脚注で個別注記し、判定を `AT_RISK` 以下に格下げする。

### 入出力契約

#### 入力

| 入力 | 出典 |
|------|------|
| 19 routes 定義 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md` |
| 22 task 主題 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/task-NN/index.md` |
| WARN / FAIL 一覧 | `docs/30-workflows/task-23-.../outputs/phase-5/` または task-23 spec |
| invariant audit | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md` |
| smoke coverage | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |
| 共通サーフェス文脈 | `docs/30-workflows/completed-tasks/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/` |

#### 出力

| 出力 | 説明 |
|------|------|
| `MVP-3LAYER-TASK-MAPPING.md` | 上記 9 セクションを含む単一 markdown（88-cell matrix を内包） |

### Phase 11 視覚証跡の参照

task-27 は docs-only / NON_VISUAL のため UI/UX 変更は無く、Phase 11 スクリーンショット PNG は生成しない。
代替の手動検証証跡として下記 Phase 11 成果物を参照する。

| ファイル | 役割 |
|----------|------|
| `outputs/phase-11/manual-test-result.md` | docs-only 経路の手動検証結果（リンク到達性・章構成確認） |
| `outputs/phase-11/link-checklist.md` | 9 セクションから外部参照する全リンクの到達性チェック |
| `outputs/phase-11/manual-smoke-log.md` | 双方向一致検証の手動再現ログ |
| `outputs/phase-11/main.md` | Phase 11 root summary |

### 戦略 readiness 判定

Section 8 で次のいずれかを最終判定として記録する。

| 判定 | 条件 |
|------|------|
| READY | 双方向一致 OK、かつ WARN/FAIL/invariant/smoke のいずれも層別ブロッカーを生まない |
| AT_RISK | 双方向一致 OK だが、いずれかの層で WARN が残存 |
| BLOCKED | 双方向不一致が 1 件以上、または FAIL が層別必須セルに重なる |

### 非変更不変条件（task-27 において守るもの）

- 既存 API endpoint surface を変更しない（`apps/api/src/routes/` 触らず）。
- D1 schema・Google Form 仕様を変更しない。
- `apps/web` から D1 直接アクセスを発生させない（docs-only のため該当行為自体なし）。
- 新規 primitive / token を生やさず、既存の `apps/web/src/styles/tokens.css` 正本順位に従う。

---

## 参考リンク

- 仕様: `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/phase-12-documentation.md`
- Phase 12 root summary: `outputs/phase-12/main.md`
- システム仕様更新サマリ: `outputs/phase-12/system-spec-update-summary.md`
- 未割当タスク検出: `outputs/phase-12/unassigned-task-detection.md`
- 親 SCOPE: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
