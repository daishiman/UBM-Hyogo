# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト作成) |
| 状態 | spec_created |

## 目的

Phase 2 で確定した patch 設計が以下を満たすかをゲート判定する。

1. 受入条件 AC-1〜AC-5 を Phase 5 で全件達成可能であること
2. 旧 path 参照の置換が網羅的であること
3. `required_status_checks` 正本との整合性チェック（Phase 11）が実行可能な情報を含むこと

## レビュー観点

### 観点 1: 受入条件カバレッジ

| AC | Phase 2 設計の対応 | 判定 |
| --- | --- | --- |
| AC-1: 5 workflow 全件列挙 | 環境別観測対象表 dev / main 両方に追加 | 充足 |
| AC-2: trigger / job 構造記述 | 4 列分離 mapping 表に job id 列を持つ。trigger は環境別表で `(deploy-staging)` 等で示す | 充足 |
| AC-3: Discord 通知 current facts 注記 | 専用セクション新設 | 充足 |
| AC-4: documentation-changelog 同期記録 | Phase 12 で対応（本 Phase スコープ外） | 後段で対応 |
| AC-5: 4 列分離 mapping 表 | 専用セクション新設 | 充足 |

### 観点 2: drift 解消網羅性

```bash
rg -n "ci\.yml|backend-ci\.yml|validate-build\.yml|verify-indexes\.yml|web-cd\.yml" \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails
```

→ Phase 5 で実行し、SSOT 内のすべての参照箇所が更新されたことを確認する。本 Phase ではコマンド実行手順を Phase 5 仕様に落とせていることを確認する。

### 観点 3: 価値とコスト

| 項目 | 評価 |
| --- | --- |
| 価値 | observability owner が「何を見るべきか」一意に解決できる。cost guardrail / drift gate / deploy 観測の運用根拠が回復する |
| コスト | docs 1 ファイルの追記改修のみ。実装コスト < 文書化コスト |
| トレードオフ | UT-GOV-001 の context 表との二重管理が発生するリスク → 注記で「正本は branch protection API」と明示することで mitigate |

### 観点 4: 4 条件評価

| 条件 | 評価 |
| --- | --- |
| 価値性 | observability owner / cost guardrail 運用者の確認コストを下げる |
| 実現性 | Phase 5 は 1 ファイル更新で完結。docs-only |
| 整合性 | 4 列分離により workflow / display / job / context の責務境界が閉じる |
| 運用性 | Phase 11 で `gh api ... protection` 実値との diff 確認が運用 fixture として残る |

## ゲート判定

| 判定 | 結論 |
| --- | --- |
| MAJOR | なし |
| MINOR | なし。仕様書化のため後段の Phase 12 で「Discord/Slack 通知導入」を未タスク候補として正式起票する旨を予約 |
| 結論 | **Phase 4 へ進行可** |

## 次 Phase への引き渡し

Phase 4 では以下の検証コマンド suite を設計する。

1. drift 検出: `rg "ci\.yml\|backend-ci\.yml\|..." ...`
2. Discord 通知 0 件確認: `grep -iE "discord|webhook|notif" .github/workflows/{...}.yml`
3. SSOT 5 workflow 全件列挙確認: `rg "ci\.yml|backend-ci\.yml|validate-build\.yml|verify-indexes\.yml|web-cd\.yml" outputs/phase-02/observability-matrix.md | wc -l ≥ 5`
4. 旧 path 0 件確認: `rg "docs/05a-" docs/30-workflows/completed-tasks/05a-...` → 0 件

## 成果物

- `outputs/phase-03/main.md` — レビュー結果サマリー / ゲート判定記録
