# 01a-parallel-github-and-branch-governance - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| ディレクトリ | doc/01-infrastructure-setup/01a-parallel-github-and-branch-governance |
| Wave | 1 |
| 実行種別 | parallel |
| 作成日 | 2026-04-23 |
| 担当 | governance |
| 状態 | pending |

## 目的

GitHub Repository と Environment 設定を、feature -> dev -> main の正本仕様に一致させる。review rule、branch protection、PR / Issue template、CODEOWNERS を一つの task で閉じる。

## スコープ

### 含む
- dev / main protection
- production / staging environment
- PR / Issue template
- CODEOWNERS と review rule

### 含まない
- Cloudflare deploy 実行
- secret 実値投入
- 実コード実装

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 00-serial-architecture-and-scope-baseline | この task 開始前に必要 |
| 下流 | 02-serial-monorepo-runtime-foundation / 04-serial-cicd-secrets-and-environment-sync | この task の成果物を参照 |
| 並列 | 01b-parallel-cloudflare-base-bootstrap / 01c-parallel-google-workspace-bootstrap | 同 Wave で独立実行可能 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | branch / reviewers / env mapping |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | CI/CD 品質ゲート |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | PR は承認後のみ |
| 参考 | GitHub Repository Settings | branch protection / environments |

## 受入条件 (AC)

- AC-1: main は reviewer 2 名、dev は reviewer 1 名である
- AC-2: production は main、staging は dev のみ受け付ける
- AC-3: PR template に true issue / dependency / 4条件の欄がある
- AC-4: CODEOWNERS と task 責務が衝突しない
- AC-5: local-check-result.md と change-summary.md の close-out path がある

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
| ドキュメント | outputs/phase-02/github-governance-map.md | branch / env / review map |
| ドキュメント | outputs/phase-05/repository-settings-runbook.md | GitHub 設定適用 runbook |
| ドキュメント | outputs/phase-05/pull-request-template.md | PR テンプレ案 |
| ドキュメント | outputs/phase-13/local-check-result.md | PR 前ローカル確認結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリー |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| GitHub | repo governance | 無料 |
| GitHub Actions | CI | 無料枠 |

## Secrets 一覧（このタスクで定義し、04 Phase 5 で投入）

| 変数名 | 種別 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| CLOUDFLARE_API_TOKEN | deploy auth | GitHub Secrets | 04 Phase 5 |
| CLOUDFLARE_ACCOUNT_ID | deploy metadata | GitHub Secrets | 04 Phase 5 |

- 実値は書かない。プレースホルダーのみ扱う。
- この task では secret 名と配置先だけを固定し、実投入は `04-serial-cicd-secrets-and-environment-sync` で扱う。

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
