# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (運用検証 / 実値整合性確認) |
| 状態 | spec_created |

## 目的

Phase 5〜9 の成果物を統合的に評価し、Phase 11 以降（運用検証 / 文書化 /
完了処理）への進行可否を最終判定する。docs-only タスクのため、blocker は
SSOT 記述自体の不整合のみが対象。

## acceptance criteria 全件判定

| AC | 内容 | 判定 | 根拠 |
| --- | --- | --- | --- |
| AC-1 | `.github/workflows/` 実体 5 本（`ci.yml`, `backend-ci.yml`, `validate-build.yml`, `verify-indexes.yml`, `web-cd.yml`）が SSOT 内に全件列挙されている | PASS | Phase 9 の `rg -c` 結果 ≥ 5 |
| AC-2 | 各 workflow の trigger / job 構造が記述されている | PASS | 4 列分離 mapping 表に job id 列が存在し、trigger は環境別表に明記 |
| AC-3 | Discord 通知の current facts（未導入であること）が注記されている | PASS | `grep -c "Discord 通知"` ≥ 1 を Phase 9 で確認 |
| AC-4 | documentation-changelog への同期記録 | 条件付き PASS | Phase 12 で正式記録予定。本 Phase では Phase 12 タスクの予約存在を確認 |
| AC-5 | 4 列分離 mapping 表（workflow / display / job id / context）が存在 | PASS | Phase 8 で mapping 表を SSOT として確定 |

## blocker 確認

| カテゴリ | 確認内容 | 結果 |
| --- | --- | --- |
| SSOT 記述矛盾 | 環境別表と mapping 表で workflow 名や job id が食い違っていないか | なし想定 |
| path 残存 | `rg "docs/05a-"` で旧 path が SSOT 内にゼロ件 | なし想定 |
| mirror 影響 | `.claude/` / `.agents/` への意図せぬ変更 | なし（Phase 9 で確認済み） |

→ blocker なし。

## MAJOR 指摘

なし。

## MINOR 指摘 → 未タスク化対象（Phase 12 で正式起票）

| # | 指摘 | 起票方針 |
| --- | --- | --- |
| MIN-01 | Discord / Slack 通知導入は本タスクスコープ外。current facts として「未導入」を注記したのみ | 別タスクとして観測通知導入 issue を Phase 12 で起票 |
| MIN-02 | スコープ外 workflow（`e2e-tests.yml`, `pr-build-test.yml`, `pr-target-safety-gate.yml`）の SSOT 統合判断が未決 | Phase 12 で「SSOT 拡張範囲決定タスク」を未タスク化 |
| MIN-03 | SSOT と `.github/workflows/` 実体の drift を CI で自動検出する workflow が未整備 | Phase 12 で「SSOT 自動同期 CI（drift 検出 workflow）」導入タスクを起票 |

## 4 条件評価

| 条件 | 評価 |
| --- | --- |
| 価値性 | AC 全件 PASS により observability owner の判断コストが恒久的に下がる |
| 実現性 | docs 1 ファイルの修正で完結。リスクなし |
| 整合性 | mapping 表が単一の真実源として機能し、後続の drift 検出 CI の基盤になる |
| 運用性 | MINOR 3 件は明確に未タスク化されるため、本タスクの境界が閉じる |

## ゲート判定

| 判定 | 結論 |
| --- | --- |
| MAJOR | なし |
| MINOR | 3 件あり、いずれも Phase 12 で未タスク化することで本タスクの境界を確定 |
| 結論 | **Phase 11 へ進行可** |

## 次 Phase への引き渡し

Phase 11 では以下の運用検証を実施する。

1. `.github/workflows/` 実体 5 本のファイル名・job id・status check context が SSOT と一致することを `gh api` / `yq` で diff 検証
2. `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` の `required_status_checks.contexts` と SSOT の context 列を比較
3. drift があれば即座に SSOT 側を修正（実体側は本タスクで変更しない）

## 成果物

- `outputs/phase-10/main.md` — AC 全件判定マトリクス / blocker 確認 / MINOR 3 件の起票方針
