# 01c-parallel-google-workspace-bootstrap - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | google-workspace-bootstrap |
| ディレクトリ | doc/01c-parallel-google-workspace-bootstrap |
| Wave | 1 |
| 実行種別 | parallel |
| 作成日 | 2026-04-23 |
| 担当 | integration |
| 状態 | completed (Phase 1-12) / pending (Phase 13: user approval required) |
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
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01 |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02 |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03 |
| 4 | 事前検証手順 | phase-04.md | completed | outputs/phase-04 |
| 5 | セットアップ実行 | phase-05.md | completed | outputs/phase-05 |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06 |
| 7 | 検証項目網羅性 | phase-07.md | completed | outputs/phase-07 |
| 8 | 設定 DRY 化 | phase-08.md | completed | outputs/phase-08 |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09 |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10 |
| 11 | 手動 smoke test | phase-11.md | completed | outputs/phase-11 |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12 |
| 13 | PR作成 | phase-13.md | pending (user approval required) | outputs/phase-13 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/google-contract-map.md | OAuth / SA / Sheet 権限マップ |
| ドキュメント | outputs/phase-05/google-bootstrap-runbook.md | Console 手順 |
| ドキュメント | outputs/phase-05/sheets-access-contract.md | 入力源契約 |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec sync 結果 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 更新履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill フィードバック |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 準拠確認 |
| ドキュメント | outputs/phase-13/local-check-result.md | PR 前ローカル確認結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリー |
| メタ | artifacts.json | 機械可読サマリー |
| メタ | outputs/artifacts.json | root artifacts.json の同期コピー |
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
| GOOGLE_CLIENT_ID | OAuth id | Cloudflare Secrets / 1Password Environments | 04 Phase 5 |
| GOOGLE_CLIENT_SECRET | OAuth secret | Cloudflare Secrets / 1Password Environments | 04 Phase 5 |
| GOOGLE_SERVICE_ACCOUNT_JSON | server-side auth | Cloudflare Secrets / 1Password Environments | 04 Phase 5 |
| GOOGLE_SHEET_ID | non-secret id | GitHub Variables / docs | 04 Phase 5 |

- 実値は書かない。プレースホルダーのみ扱う。
- `GOOGLE_SHEET_ID` は non-secret identifier であり、secret としては扱わない。
- ローカル開発の値は `1Password Environments` を正本にし、平文 `.env` を正本にしない。

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
