# 01b-parallel-cloudflare-base-bootstrap - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| ディレクトリ | doc/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap |
| Wave | 1 |
| 実行種別 | parallel |
| 作成日 | 2026-04-23 |
| 担当 | infra |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

Cloudflare Pages / Workers / D1 を前提に、アカウント・プロジェクト・権限・環境の土台を定義する。OpenNext 一体構成は採用せず、web と api のデプロイ経路を分離する。

## スコープ

### 含む
- Pages project 方針
- Workers service 方針
- D1 database 方針
- Cloudflare API Token 最小権限

### 含まない
- 本番デプロイ
- 通知基盤導入
- 有料オプション導入

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | ../00-serial-architecture-and-scope-baseline/ | この task 開始前に必要 |
| 下流 | 02-serial-monorepo-runtime-foundation / 03-serial-data-source-and-storage-contract / 04-serial-cicd-secrets-and-environment-sync | この task の成果物を参照 |
| 並列 | 01a-parallel-github-and-branch-governance / 01c-parallel-google-workspace-bootstrap | 同 Wave で独立実行可能 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ |

注記: branch 名は `deployment-branch-strategy.md` の `dev` を優先し、`deployment-cloudflare.md` に残る `develop` 表記は Phase 12 の同期対象として扱う。

## 受入条件 (AC)

- AC-1: Pages / Workers / D1 の役割が分離されている
- AC-2: staging / production の環境名が branch strategy と一致している
- AC-3: Cloudflare API Token は最小権限である
- AC-4: Pages build budget と Workers/D1 quota を両方追跡できる
- AC-5: rollback 導線が Pages と Workers で分かれている

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
| ドキュメント | outputs/phase-02/cloudflare-topology.md | Pages / Workers / D1 topology |
| ドキュメント | outputs/phase-05/cloudflare-bootstrap-runbook.md | Dashboard / CLI 手順 |
| ドキュメント | outputs/phase-05/token-scope-matrix.md | API Token scope |
| ドキュメント | outputs/phase-11/manual-cloudflare-checklist.md | manual smoke checklist |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Pages | Web hosting | 500 builds/month |
| Cloudflare Workers | API backend | 100k req/day |
| Cloudflare D1 | canonical DB | 5GB / 5M reads/day |

## Secrets 一覧（このタスクで定義し、04 Phase 5 で投入）

| 変数名 | 種別 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| CLOUDFLARE_API_TOKEN | deploy auth | GitHub Secrets | 04 Phase 5 |
| CLOUDFLARE_ACCOUNT_ID | account id | GitHub Secrets | 04 Phase 5 |

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
