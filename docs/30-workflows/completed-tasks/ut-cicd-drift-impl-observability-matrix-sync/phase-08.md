# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 前 Phase | 7 (テストグリーン化) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |

## 目的

docs-only タスクのため、コード refactor は対象外。本 Phase では SSOT
(`docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md`)
内の重複表現と navigation drift を整理し、可読性と一貫性を確保する。

## 対象 / Before / After / 理由

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 環境別観測対象表 | dev 行と main 行で workflow の列挙順が不揃い | `ci.yml` → `backend-ci.yml` → `validate-build.yml` → `verify-indexes.yml` → `web-cd.yml` の順に統一 | 読み手が dev / main を縦比較できる |
| workflow 名称定義 | 環境別表と Discord 注記で workflow 名称を独立記述 | 4 列分離 mapping 表を SSOT として参照する形に統一 | 重複定義を解消し、名称変更時の修正点を 1 箇所に集約 |
| 旧 path 表記 | `docs/05a-...` 形式が混在 | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/...` に一括置換 | リポジトリ移行後の path 体系に整合 |
| 相対 path 表記 | 一部 `./outputs/...` と `outputs/...` が混在 | リポジトリルート起点の絶対表記に統一 | rg / link checker が安定して解決できる |

## duplicate 削除確認

同一 workflow が複数行に分散していないかを確認する。

```bash
# 各 workflow が SSOT 内に何回出現するかカウント
rg -c "ci\.yml" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
rg -c "backend-ci\.yml" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
rg -c "validate-build\.yml" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
rg -c "verify-indexes\.yml" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
rg -c "web-cd\.yml" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
```

→ 期待値: 各 workflow は「環境別表 dev 行」「環境別表 main 行」「4 列分離 mapping 表 1 行」の合計 ≤ 3 行に収まる。
4 行以上出現する場合は重複定義の疑いがあるため、mapping 表参照に置換する。

## navigation drift 確認

05a の他 outputs 内に古い workflow リストが残っていないかを横断確認する。

```bash
# 旧 workflow リスト形式の残存を検出
rg -l "ci\.yml.*validate-build\.yml" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/

# 旧 path 表記の残存
rg -l "docs/05a-" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/
```

→ いずれも phase-02/observability-matrix.md のみがヒットすることを期待。
他ファイルに残存している場合は本 Phase スコープ外として Phase 12 で未タスク化する。

## 整理アクション

1. SSOT の編集差分を `git diff outputs/phase-02/observability-matrix.md` で確認
2. 行末空白・余分な空行・table column alignment を整える
3. Markdown lint（あれば `pnpm lint:md` に相当するもの）が pass することを確認
4. mapping 表の column header を `workflow / display name / job id / context (status check)` の 4 列に固定

## 4 条件評価

| 条件 | 評価 |
| --- | --- |
| 価値性 | 重複削除により mapping 表が単一の真実源として機能する |
| 実現性 | docs 1 ファイル内の整理のみ。所要時間 < 30 分 |
| 整合性 | 名称変更時の修正点が mapping 表 1 箇所に閉じる |
| 運用性 | rg コマンドが本 Phase の検証手順としてそのまま再利用できる |

## 成果物

- `outputs/phase-08/main.md` — refactor 差分サマリー / duplicate / drift 確認ログ
