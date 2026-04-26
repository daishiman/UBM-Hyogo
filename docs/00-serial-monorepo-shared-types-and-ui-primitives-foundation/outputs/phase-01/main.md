# Phase 1 成果物: 要件定義

## 真の論点（true issue）

| # | 論点 | 詳細 |
|---|------|------|
| issue 1 | 物理境界の確立 | app 層で 24 タスクを並列実行可能にするには、ディレクトリ + lint rule で「触れていい場所」「触ってはいけない場所」を固定する必要がある |
| issue 2 | packages/shared の export 表面確定 | 型4層（schema/response/identity/viewmodel）を 01b で実装する前に、MemberId/ResponseId/ResponseEmail/StableKey の placeholder が決まっていなければ 02a/b/c が repository を書けない |
| issue 3 | UI primitives 15種の命名・barrel export 確定 | 06a/b/c の 3 タスクが同時参照するので Wave 0 で決まっていないと Wave 6 が並列化できない |
| issue 4 | D1 直接アクセス回路の閉鎖 | Wave 0 で apps/web → D1 を ESLint rule で塞がないと Wave 4〜6 で漏れが発生し不変条件 #5 を破る |

## 依存境界

| 境界 | 定義 |
|------|------|
| runtime 境界 | apps/web（Workers + Next.js）と apps/api（Workers + Hono）を別 build target |
| package 境界 | packages/shared, packages/integrations/google の 2 package を独立化（relative import 不可） |
| layer 境界 | UI primitives は apps/web/src/components/ui/ のみに配置 |
| D1 境界 | apps/web に @cloudflare/d1 依存を入れない、ESLint rule で import を禁止 |

## 価値とコスト

| 観点 | 内容 |
|------|------|
| 初回価値 | 後続 22 並列タスクが「土台」のせいで衝突しない、Wave 1 を即時開始できる |
| 払うコスト | UI primitives 15 種を一度に整備する初期投資 |
| 払わないコスト | ビジネスロジック / D1 / 認証 / API 実装（各 Wave に分離済み） |

## 4 条件評価

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | scaffold 完了で Wave 1a/1b が同時着手可能 |
| 実現性 | PASS | scaffold は Cloudflare resource を消費しない |
| 整合性 | PASS | secrets を扱わず、apps/web ↔ D1 境界を ESLint rule で固定 |
| 運用性 | PASS | scaffold は git revert で完全 rollback 可能 |

## AC-1〜AC-9（定量的受入条件）

| AC | 内容 | 判定基準 |
|----|------|----------|
| AC-1 | pnpm install 成功 | exit 0、lockfile 生成 |
| AC-2 | pnpm -w typecheck exit 0 | 全 4 package（web/api/shared/integrations-google）が exit 0 |
| AC-3 | pnpm -w lint exit 0 + ESLint rule | apps/web から @cloudflare/d1 系 import が error |
| AC-4 | pnpm -w test exit 0 | Vitest 全 spec PASS |
| AC-5 | UI primitives 15 種 export | index.ts から Chip/Avatar/Button...15 種すべて export |
| AC-6 | tones.ts 2 関数 export | zoneTone/statusTone が正しい ChipTone を返す |
| AC-7 | next.config.ts @opennextjs/cloudflare 対応 | next.config.ts に initOpenNextCloudflareForDev が存在 |
| AC-8 | GET /healthz 200 {"ok":true} | curl で確認可能 |
| AC-9 | shared から 4 型 export | MemberId/ResponseId/ResponseEmail/StableKey が typecheck 通過 |

## 不変条件マッピング

| 不変条件 | Phase 1 での対応 |
|----------|----------------|
| #1 schema 固定回避 | 型 4 層を placeholder で分離。直書き禁止を明文化 |
| #5 apps/web → D1 禁止 | ESLint rule placeholder を AC-3 に含める |
| #6 GAS prototype 非昇格 | UI primitives に localStorage 依存禁止を要件化 |
| #8 localStorage 非正本 | Avatar の hue を memberId 由来の決定論的算出に固定 |
