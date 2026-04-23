# 03-serial-data-source-and-storage-contract - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| ディレクトリ | doc/01-infrastructure-setup/03-serial-data-source-and-storage-contract |
| Wave | 3 |
| 実行種別 | serial |
| 作成日 | 2026-04-23 |
| 担当 | data |
| 状態 | pending |

## 目的

Google Sheets input と Cloudflare D1 canonical store の契約を決める。sync の責務、audit、障害時復旧、backfill の扱いを定義し、source-of-truth を一意にする。

## スコープ

### 含む
- Sheets -> integration -> D1 flow
- D1 schema direction
- manual / scheduled / backfill sync
- audit / rollback / restore 方針

### 含まない
- sync 実装
- 本番データ投入
- Sheets 直接 read でアプリ成立させる設計

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 01b-parallel-cloudflare-base-bootstrap / 01c-parallel-google-workspace-bootstrap / 02-serial-monorepo-runtime-foundation | この task 開始前に必要 |
| 下流 | 04-serial-cicd-secrets-and-environment-sync / 05a-parallel-observability-and-cost-guardrails / 05b-parallel-smoke-readiness-and-handoff | この task の成果物を参照 |
| 並列 | なし | 同 Wave で独立実行可能 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | Repository / D1 / API route |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 基本手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | rollback 基本方針 |
| 必須 | User request on 2026-04-23 | Sheets と DB の最適解 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | env boundary |

## 受入条件 (AC)

- AC-1: Sheets input / D1 canonical の source-of-truth が競合しない
- AC-2: sync の manual / scheduled / backfill が分かれている
- AC-3: D1 の backup / restore / preview 方針が runbook 化されている
- AC-4: 障害時の復旧基準が Sheets 基準か D1 基準か明確である
- AC-5: 純 Sheets 案を非採用とした理由が無料運用と整合している

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
| ドキュメント | outputs/phase-02/data-contract.md | Sheets / D1 contract |
| ドキュメント | outputs/phase-02/sync-flow.md | manual / scheduled / backfill flow |
| ドキュメント | outputs/phase-05/d1-bootstrap-runbook.md | D1 runbook |
| ドキュメント | outputs/phase-10/data-decision-review.md | decision review |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Google Sheets | 運用入力源 | 無料 |
| Cloudflare D1 | canonical DB | 無料枠 |

## Secrets 一覧（このタスクで導入）

| 変数名 | 種別 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| GOOGLE_SERVICE_ACCOUNT_JSON | sync auth | Cloudflare / 1Password | 04 Phase 5 |

- 実値は書かない。プレースホルダーのみ扱う。

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
