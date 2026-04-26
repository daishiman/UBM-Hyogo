# 04-serial-cicd-secrets-and-environment-sync - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| ディレクトリ | docs/04-serial-cicd-secrets-and-environment-sync |
| Wave | 4 |
| 実行種別 | serial |
| 作成日 | 2026-04-23 |
| 担当 | delivery |
| 状態 | spec_created |
| タスク種別 | spec_created |

## 目的

GitHub Actions、Cloudflare、1Password Environments の役割を分離し、runtime secret と deploy secret を混ぜない。`web-cd` と backend deploy workflow を分け、dev / main 運用を固定する。

## スコープ

### 含む
- ci.yml / web-cd / backend deploy workflow
- secret placement matrix
- dev / main env difference
- rotation / revoke / rollback

### 含まない
- 通知基盤常設導入
- アプリ機能コード
- 本番データ投入

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 01a-parallel-github-and-branch-governance / 01b-parallel-cloudflare-base-bootstrap / 01c-parallel-google-workspace-bootstrap / 02-serial-monorepo-runtime-foundation / 03-serial-data-source-and-storage-contract | この task 開始前に必要 |
| 下流 | 05a-parallel-observability-and-cost-guardrails / 05b-parallel-smoke-readiness-and-handoff | この task の成果物を参照 |
| 並列 | なし | 同 Wave で独立実行可能 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | CI/CD 方針 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | dev / main mapping |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare / GitHub / Variables / 1Password |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | ローカル secret 正本 |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

注記: branch 名は `deployment-branch-strategy.md` の `dev` を優先する。backend workflow 名は外部正本で揺れがあるため、本 task では `backend deploy workflow` と総称し、具体ファイル名の確定は Phase 12 の同期対象に置く。

## 受入条件 (AC)

- AC-1: runtime secret / deploy secret / public variable の置き場が一意である
- AC-2: dev / main の trigger が branch strategy と一致している
- AC-3: local canonical は 1Password Environments であり、平文 .env は正本ではない
- AC-4: web と api の deploy path が分離されている
- AC-5: secret rotation / revoke / rollback の runbook がある

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01 |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-02 |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03 |
| 4 | 事前検証手順 | phase-04.md | spec_created | outputs/phase-04 |
| 5 | セットアップ実行 | phase-05.md | spec_created | outputs/phase-05 |
| 6 | 異常系検証 | phase-06.md | spec_created | outputs/phase-06 |
| 7 | 検証項目網羅性 | phase-07.md | spec_created | outputs/phase-07 |
| 8 | 設定 DRY 化 | phase-08.md | spec_created | outputs/phase-08 |
| 9 | 品質保証 | phase-09.md | spec_created | outputs/phase-09 |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10 |
| 11 | 手動 smoke test | phase-11.md | spec_created | outputs/phase-11 |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12 |
| 13 | PR作成 | phase-13.md | blocked_user_approval | outputs/phase-13 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/secrets-placement-matrix.md | placement matrix |
| ドキュメント | outputs/phase-02/workflow-topology.md | ci / web-cd / backend deploy workflow |
| ドキュメント | outputs/phase-05/github-actions-drafts.md | workflow draft |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec update summary |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| GitHub Actions | CI/CD | 無料枠 |
| Cloudflare | runtime target | 無料枠 |
| 1Password Environments | local canonical env | 既存契約前提 |

## Secrets 一覧（このタスクで投入）

| 変数名 | 種別 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| CLOUDFLARE_API_TOKEN | deploy auth | GitHub Secrets | 04 Phase 5 |
| CLOUDFLARE_ACCOUNT_ID | deploy metadata | GitHub Variables | 04 Phase 5 |
| GOOGLE_CLIENT_SECRET | runtime auth | Cloudflare Secret + 1Password | 04 Phase 5 |
| GOOGLE_SERVICE_ACCOUNT_JSON | runtime integration auth | Cloudflare Secret + 1Password | 04 Phase 5 |

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
