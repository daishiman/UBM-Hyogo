# Phase 1: 要件定義 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 状態 | completed |
| 完了日 | 2026-04-26 |

## 目的確認

Cloudflare Pages / Workers / D1 と GitHub Actions の **無料枠を壊さない** ための観測点・runbook・rollback 判断を文書化する。通知基盤の常設導入は含まない。

## スコープ確定

| 含む | 含まない |
| --- | --- |
| Pages build budget (500ビルド/月) | 有料監視 SaaS |
| Workers quota (100,000 req/日) | 通知メール基盤常設 |
| D1 quota (5GB / 500万行読み/日) | アプリ機能監視実装 |
| GitHub Actions usage | — |
| rollback / degrade runbook | — |

## 受入条件 (AC) — 要件段階の解釈

| AC | 要件レベルの解釈 |
| --- | --- |
| AC-1 | 無料枠一覧を observability-matrix.md に記載する |
| AC-2 | 閾値と対処を cost-guardrail-runbook.md に runbook 化する |
| AC-3 | 本タスクでは新規 secret を導入しない（既存 CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID を再利用） |
| AC-4 | dev / main それぞれの観測対象を分離して記述する |
| AC-5 | rollback / pause / degrade の判断基準を runbook に定義する |

## 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | ops メンバーが無料枠超過前に手動で確認できる観測点を提供する |
| 実現性 | PASS | Cloudflare Analytics + GitHub Actions UI のみで成立。新規インフラ不要 |
| 整合性 | PASS | branch: feature→dev→main / env: staging(dev), production(main) / secret: Cloudflare Secrets + GitHub Secrets / source-of-truth: D1 canonical |
| 運用性 | PASS | rollback は Cloudflare ダッシュボード 1クリック。05b との same-wave sync は Phase 10-12 で実施 |

## downstream handoff

| 下流 | 参照するもの |
| --- | --- |
| Phase 2 (設計) | 本 Phase で確定したスコープ・AC 解釈 |
| Phase 7 (AC トレース) | AC-1〜5 の要件定義 |
| Phase 10 (最終レビュー) | 4条件評価の根拠 |
| Phase 12 (ドキュメント更新) | スコープ境界の確定 |
| 05b-parallel-smoke-readiness-and-handoff | Phase 10-12 で観測性証跡を提供 |

## open questions / blockers

なし。上流タスク (04-serial-cicd-secrets-and-environment-sync, 03-serial-data-source-and-storage-contract) は完了前提で仕様書を作成する。
