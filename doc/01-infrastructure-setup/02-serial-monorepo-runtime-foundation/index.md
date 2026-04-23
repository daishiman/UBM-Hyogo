# 02-serial-monorepo-runtime-foundation - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-runtime-foundation |
| ディレクトリ | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation |
| Wave | 2 |
| 実行種別 | serial |
| 作成日 | 2026-04-23 |
| 担当 | runtime |
| 状態 | pending |

## 目的

apps/web on Pages、apps/api on Workers、packages/shared、packages/integrations の構造を固定する。Node 22.x、pnpm 9.x、Next.js 15.x、React 19、TypeScript strict を前提にする。

## スコープ

### 含む
- apps/web / apps/api 分離
- workspace ルール
- runtime version policy
- local dev / staging / production の起点整理

### 含まない
- 業務機能実装
- 本番デプロイ
- sync ロジック実装

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 00-serial-architecture-and-scope-baseline / 01a-parallel-github-and-branch-governance / 01b-parallel-cloudflare-base-bootstrap | この task 開始前に必要 |
| 下流 | 03-serial-data-source-and-storage-contract / 04-serial-cicd-secrets-and-environment-sync / 05b-parallel-smoke-readiness-and-handoff | この task の成果物を参照 |
| 並列 | なし | 同 Wave で独立実行可能 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/web / apps/api |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | dependency rule |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-core.md | Node / pnpm / Next.js |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-frontend.md | Next.js / Tailwind |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-backend.md | Workers / D1 / backend stack |

注記: app 境界は `architecture-overview-core.md` の `apps/web` / `apps/api` を優先し、`architecture-monorepo.md` は dependency rule 参照として使う。両者が衝突した場合は本 task で app 境界を再定義せず、Phase 12 の同期対象として記録する。

## 受入条件 (AC)

- AC-1: apps/web と apps/api の責務境界が明文化されている
- AC-2: Node 22.x / pnpm 9.x / Next.js 15.x / TS strict に揃う
- AC-3: apps/web / apps/api / packages/shared / packages/integrations の dependency rule がこの task 内で一意に説明できる
- AC-4: OpenNext 一体構成を採用しない理由が残る
- AC-5: local / staging / production の entry point が説明できる

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
| ドキュメント | outputs/phase-02/runtime-topology.md | apps/web / apps/api / packages 図 |
| ドキュメント | outputs/phase-02/version-policy.md | runtime version policy |
| ドキュメント | outputs/phase-05/foundation-bootstrap-runbook.md | workspace 構築手順 |
| ドキュメント | outputs/phase-08/dependency-boundary-rules.md | boundary ルール |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Node.js | runtime | 無料 |
| pnpm | workspace manager | 無料 |
| Cloudflare Pages | web target | 無料枠 |
| Cloudflare Workers | api target | 無料枠 |

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
