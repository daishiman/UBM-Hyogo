# 05a-parallel-observability-and-cost-guardrails - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | observability-and-cost-guardrails |
| ディレクトリ | doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails |
| Wave | 5 |
| 実行種別 | parallel |
| 作成日 | 2026-04-23 |
| 担当 | ops |
| 状態 | pending |

## 目的

Cloudflare Pages / Workers / D1 と GitHub Actions の無料運用を壊さないための監視・runbook・rollback 判断を定義する。通知基盤を増やす前に、手動確認可能な観測点を優先する。

## スコープ

### 含む
- Pages build budget
- Workers/D1 quota
- GitHub Actions usage
- rollback / degrade runbook

### 含まない
- 有料監視SaaS
- 通知メール基盤常設導入
- アプリ機能監視実装

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04-serial-cicd-secrets-and-environment-sync / 03-serial-data-source-and-storage-contract | この task 開始前に必要 |
| 下流 | 実装フェーズ / 05b-parallel-smoke-readiness-and-handoff (Phase 10-12 same-wave sync) | この task の成果物を参照 |
| 並列 | 05b-parallel-smoke-readiness-and-handoff | 同 Wave で独立着手し、終盤で同期する |

注記: Wave 5 は `05a` と `05b` を並列着手し、`05a` の観測性・無料枠証跡は `05b` の final readiness gate に Phase 10-12 で取り込む。

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | quality gate / rollback |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Pages / Workers / D1 operational view |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | secret hygiene |
| 参考 | .claude/skills/task-specification-creator/SKILL.md | 運用性観点 |

## 受入条件 (AC)

- AC-1: Pages build budget を含む無料枠一覧がある
- AC-2: Workers / D1 / GitHub Actions の閾値と対処が runbook 化されている
- AC-3: 新規 secret を増やさずに初回運用できる
- AC-4: dev / main の観測対象が分離されている
- AC-5: rollback / pause / degrade の判断基準がある

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-01 |
| 2 | 設計 | phase-02.md | pending | outputs/phase-02 |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-03 |
| 4 | 事前検証手順 | phase-04.md | pending | outputs/phase-04 |
| 5 | セットアップ実行 | phase-05.md | pending | outputs/phase-05 |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06 |
| 7 | 検証項目網羅性 | phase-07.md | pending | outputs/phase-07 |
| 8 | 設定 DRY 化 | phase-08.md | pending | outputs/phase-08 |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09 |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10 |
| 11 | 手動 smoke test | phase-11.md | pending | outputs/phase-11 |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12 |
| 13 | PR作成 | phase-13.md | pending | outputs/phase-13 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/observability-matrix.md | metric / owner / threshold |
| ドキュメント | outputs/phase-05/cost-guardrail-runbook.md | free-tier runbook |
| ドキュメント | outputs/phase-11/manual-ops-checklist.md | manual check list |
| ドキュメント | outputs/phase-12/operations-guide.md | operations guide |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Analytics | Pages / Workers / D1 visibility | 無料枠 |
| GitHub Actions | workflow visibility | 無料枠 |

## Secrets 一覧（このタスクで導入）

なし。初期仕様 task のため、新規 secret は導入しない。

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルールが破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-infra.md
- Legacy snapshot: 未作成（必要なら別 archive task で作成）
