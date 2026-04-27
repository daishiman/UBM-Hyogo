# Phase 1: 要件定義 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 状態 | completed |
| 作成日 | 2026-04-26 |

## 確認した正本仕様との差分

| 対象ファイル | 現行正本の記述 | 本 task の採用方針 | Phase 12 同期要否 |
| --- | --- | --- | --- |
| technology-core.md | TypeScript 推奨バージョン: `5.7.x` | TypeScript 6.x strict | required |
| technology-core.md | Node.js 推奨バージョン: `24.x LTS`（最小 22.x） | Node 24.x LTS | no-op（既に24.x） |
| technology-core.md | Next.js 推奨バージョン: `16.x` | Next.js 16.x | no-op（既に16.x） |
| technology-core.md | pnpm 推奨バージョン: `10.x` | pnpm 10.x | no-op（既に10.x） |
| architecture-overview-core.md | apps/web: @opennextjs/cloudflare on Cloudflare Workers | 同じ | no-op |
| architecture-monorepo.md | dependency rule 定義済み | 同じ（参照として使用） | no-op |

注記: technology-core.md の TypeScript バージョンは `5.7.x` と記述されているが、本 task では `6.x` を採用する。Phase 12 Step 2 で `6.x` へ同期する。

## 採用方針の確認

### runtime バージョン（採用候補固定）

| 項目 | 採用バージョン | 採用理由 |
| --- | --- | --- |
| Node.js | 24.x LTS（Krypton） | 2028年4月まで LTS 保証。Next.js 16 要件（Node 20.9.0+）を満たす |
| pnpm | 10.x | pnpm 9 は 2026-04-30 EOL。workspace 管理の継続性確保 |
| Next.js | 16.x（16.2.4+） | @opennextjs/cloudflare 推奨。App Router 安定。Turbopack 対応 |
| React | 19.2.x | Next.js 16 対応。Server Components, Actions, Concurrent Features 安定 |
| TypeScript | 6.x（6.0.3+） | strict モード。v7.0 はベータのため非推奨 |
| Wrangler | 4.x（4.85.0+） | v3 は保守モード。v4 を使用 |
| Hono | 4.12.x | Workers 向け軽量フレームワーク |
| Tailwind CSS | 4.x（4.2.4+） | 高速再コンパイル |
| Auth.js | 5.x | Google OAuth + Magic Link。AUTH_* 環境変数プレフィックス（v5 仕様） |
| @opennextjs/cloudflare | 最新安定版 | @cloudflare/next-on-pages 廃止予定のため採用 |

### apps/web / apps/api 責務境界

| アプリ | 技術 | 責務 | Cloudflare ターゲット |
| --- | --- | --- | --- |
| apps/web | Next.js 16 + @opennextjs/cloudflare | UI 配信・SSR / RSC | Workers（バンドル 3MB 以内） |
| apps/api | Hono 4.12.x | REST API / D1 アクセス | Workers |

- apps/web から D1 への直接アクセス禁止（CLAUDE.md 不変条件 5）
- apps/api が D1 binding を唯一保持する

### @cloudflare/next-on-pages 不採用理由

`@cloudflare/next-on-pages` は廃止予定（Deprecated）のため採用しない。代替として `@opennextjs/cloudflare` を採用し、Next.js を Cloudflare Workers 上で動かす。Workers 無料枠バンドルサイズ（3MB）超過時は Pages Functions（25MB）を検討する。

### packages 依存関係ルール

| パッケージ | 依存許可 |
| --- | --- |
| packages/shared/core/ | なし（外部依存ゼロ） |
| packages/shared/src/types/ | なし（外部依存ゼロ） |
| packages/shared/src/services/ | types/ のみ |
| packages/shared/infrastructure/ | core/, types/ |
| packages/integrations/{service}/ | core/ のみ（integrations 間の相互依存禁止） |
| apps/web | shared/*, integrations/* |
| apps/api | shared/*, integrations/* |

### local / staging / production 環境

| 環境 | branch | Cloudflare | entry point |
| --- | --- | --- | --- |
| local | feature/* | ローカル（wrangler dev） | localhost |
| staging | dev | Cloudflare Workers staging | workers URL（staging） |
| production | main | Cloudflare Workers production | workers URL（production） |

## 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | apps/web・apps/api の境界と version policy を明文化し、開発者の実装ミスを防ぐ |
| 実現性 | PASS | Node 24.x / pnpm 10.x / Next.js 16.x はすべて無料。Workers 無料枠 (3MB) 内でのバンドル管理が必要（確認手順は Phase 5 で実施） |
| 整合性 | PASS | feature→dev→main ブランチ戦略と runtime split が一致。pnpm 9 EOL 対応済み（pnpm 10.x 採用） |
| 運用性 | PASS | @opennextjs/cloudflare 採用により rollback 手順は runbook に記録（Phase 5 実施）。Phase 12 で same-wave sync を完了する |

## downstream handoff

| 下流 task / Phase | 参照するもの |
| --- | --- |
| Phase 2 | 本 Phase の採用方針・AC・4条件評価 |
| Phase 7 | AC トレースの根拠として使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out・spec sync 判断（TypeScript 6.x 同期） |
| 03-serial-data-source-and-storage-contract | apps/api が D1 を保持し apps/web からの直アクセス禁止を前提とする |
| 04-serial-cicd-secrets-and-environment-sync | secret placement matrix（Cloudflare Secrets / GitHub Secrets）を参照 |
| 05b-parallel-smoke-readiness-and-handoff | runtime-topology と bootstrap-runbook を参照 |

## blocker / open question

| ID | 内容 | 対応 Phase |
| --- | --- | --- |
| B-01 | TypeScript 5.7.x → 6.x の正本仕様同期が未実施 | Phase 12 Step 2 |
| B-02 | workers バンドルサイズ (3MB) の確認が必要 | Phase 5（docs-first 前提で runbook 記録） |

## 完了条件チェック

- [x] 主成果物が作成済み
- [x] 正本仕様参照が残っている（差分表記録済み）
- [x] downstream handoff が明記されている
