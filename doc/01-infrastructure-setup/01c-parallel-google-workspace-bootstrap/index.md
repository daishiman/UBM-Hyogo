# 01c-parallel-google-workspace-bootstrap - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | google-workspace-bootstrap |
| ディレクトリ | doc/01-infrastructure-setup/01c-parallel-google-workspace-bootstrap |
| Wave | 1 |
| 実行種別 | parallel |
| 作成日 | 2026-04-23 |
| 担当 | integration |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

Google Sheets を入力源として利用するために、Google Cloud Project、Sheets API、Drive API、OAuth client、service account の責務を分離して定義する。Sheets を正本DBにしない。

## スコープ

### 含む
- Google Cloud Project
- Sheets API / Drive API
- OAuth client / service account
- Sheet access contract

### 含まない
- sync 実装
- Sheets を canonical DB にする設計
- 通知機能

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | ../00-serial-architecture-and-scope-baseline/ | この task 開始前に必要 |
| 下流 | 03-serial-data-source-and-storage-contract / 04-serial-cicd-secrets-and-environment-sync / 05b-parallel-smoke-readiness-and-handoff | この task の成果物を参照 |
| 並列 | 01a-parallel-github-and-branch-governance / 01b-parallel-cloudflare-base-bootstrap | 同 Wave で独立実行可能 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | integration package の責務 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | local canonical env |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret placement |
| 参考 | Google Cloud Console | Project / OAuth / service account |
| 参考 | User request on 2026-04-23 | Google スプレッドシート入力 |

## 受入条件 (AC)

- AC-1: OAuth client と service account の用途が分離されている
- AC-2: Google Sheet access contract が docs に残る
- AC-3: Google secret 名が task 間で一意に統一される
- AC-4: Sheets input / D1 canonical の責務が崩れない
- AC-5: downstream task が参照する identifiers と secrets が明示される

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
| ドキュメント | outputs/phase-02/google-contract-map.md | OAuth / SA / Sheet 権限マップ |
| ドキュメント | outputs/phase-05/google-bootstrap-runbook.md | Console 手順 |
| ドキュメント | outputs/phase-05/sheets-access-contract.md | 入力源契約 |
| ドキュメント | outputs/phase-12/google-integration-guide.md | 運用ガイド |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Google Cloud Project | API / OAuth 管理 | 無料枠 |
| Google Sheets API | 入力取得 | 無料枠 |
| Google Drive API | 権限共有補助 | 無料枠 |

## Secrets / Variables 一覧（このタスクで定義し、04 Phase 5 で投入）

| 変数名 | 種別 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| GOOGLE_CLIENT_ID | OAuth id | Cloudflare / 1Password | 04 Phase 5 |
| GOOGLE_CLIENT_SECRET | OAuth secret | Cloudflare / 1Password | 04 Phase 5 |
| GOOGLE_SERVICE_ACCOUNT_JSON | server-side auth | Cloudflare / 1Password | 04 Phase 5 |
| GOOGLE_SHEET_ID | non-secret id | GitHub Variables / docs | 04 Phase 5 |

- 実値は書かない。プレースホルダーのみ扱う。
- `GOOGLE_SHEET_ID` は non-secret identifier であり、secret としては扱わない。

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
