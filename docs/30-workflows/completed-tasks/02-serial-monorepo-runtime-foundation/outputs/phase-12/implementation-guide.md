# Implementation Guide — 02-serial-monorepo-runtime-foundation

> PR 作成時のメッセージ原本。Phase 13 でそのまま使用する。

## 概要

Wave 2 serial task。UBM-Hyogo モノレポの runtime 基盤（apps/web / apps/api / packages）の構造・責務境界・バージョンポリシーを固定し、最小実装スケルトンまで作成する。

## Part 1 — 初学者向け説明

### なぜ必要か

新しい建物を作る前に、教室・職員室・倉庫の場所を決めずに工事を始めると、あとから「水道管が教室を通っている」「倉庫に先生しか入れない」ような困った状態になります。このタスクは、コードを書く前に「画面の場所」「データを扱う場所」「みんなで使う道具の場所」を先に決めるためのものです。

この順番にすると、後続タスクは迷わず同じ地図を見て作業できます。何をするかを後から決めるのではなく、なぜその置き場所が必要かを先にそろえたため、仕様書・成果物・正本仕様の間でずれが起きにくくなります。

### 何をするか

今回の作業では、UBM-Hyogo の実行基盤について次の約束を文書と実ファイルに反映しました。

- ユーザーが見る画面は `apps/web/` に置く
- データを扱う入口は `apps/api/` に置く
- 共通の型や部品は `packages/shared/` に置く
- 外部サービス連携は `packages/integrations/` に置く
- D1 データベースへ直接触る場所は `apps/api/` に限定する

### 今回作ったもの

| 成果物 | 役割 |
| --- | --- |
| `outputs/phase-02/runtime-topology.md` | どの場所が何を担当するかを示す地図 |
| `outputs/phase-02/version-policy.md` | Node.js / pnpm / Next.js / TypeScript などの採用バージョン表 |
| `outputs/phase-05/foundation-bootstrap-runbook.md` | 後続実装で実ファイルを作るときの手順書 |
| `outputs/phase-08/dependency-boundary-rules.md` | 依存してよい方向・禁止する方向のルール |
| `apps/web/`, `apps/api/`, `packages/shared/`, `packages/integrations/` | runtime foundation の最小実装 |
| `outputs/phase-11/*` | 手動確認ログと home 画面スクリーンショット |
| `outputs/phase-12/*` | 正本仕様同期、未タスク検出、スキル改善報告 |

### スクリーンショットについて

このタスクは `code_and_docs` です。`apps/web` に runtime foundation home を追加したため、Phase 11 で `outputs/phase-11/screenshots/RF-01-runtime-foundation-home-after.png` を取得しました。証跡は `outputs/phase-11/main.md`、`outputs/phase-11/manual-smoke-log.md`、`outputs/phase-11/link-checklist.md`、`outputs/phase-11/screenshots/` です。

## Part 2 — 開発者向け詳細

### インターフェースと型定義

```ts
type TaskType = "code_and_docs";
type RuntimeSurface = "apps/web" | "apps/api" | "packages/shared" | "packages/integrations";

interface RuntimeFoundationArtifact {
  phase: number;
  path: string;
  role: "topology" | "version-policy" | "runbook" | "dependency-rule" | "phase-summary";
  downstreamConsumers: string[];
}

interface RuntimeVersionPolicy {
  node: "24.x";
  pnpm: "10.x";
  next: "16.x";
  react: "19.2.x";
  typescript: "6.x";
  wrangler: "4.x";
  hono: "4.12.x";
}

interface RuntimeBoundaryRule {
  surface: RuntimeSurface;
  owns: string[];
  forbiddenDependencies: string[];
}
```

### CLIシグネチャ

```bash
node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow doc/02-serial-monorepo-runtime-foundation --strict --json
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow doc/02-serial-monorepo-runtime-foundation --json
node .claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js --workflow doc/02-serial-monorepo-runtime-foundation --json
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
```

### 使用例

```bash
# Phase 12 implementation guide の構造を検証
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js \
  --workflow doc/02-serial-monorepo-runtime-foundation \
  --json

# code_and_docs Phase 11 の証跡を検証
node .claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js \
  --workflow doc/02-serial-monorepo-runtime-foundation \
  --json
```

### エラーハンドリング

| エラー | 検出方法 | 対応 |
| --- | --- | --- |
| Phase 12 Part 1/2 欠落 | `validate-phase12-implementation-guide.js` | 本ファイルに Part 1 / Part 2 と必須小見出しを追加 |
| Phase 11 スクリーンショット欠落 | `validate-phase11-screenshot-coverage.js` / 手動確認 | `outputs/phase-11/screenshots/RF-01-runtime-foundation-home-after.png` を取得し、Phase 11/12 へ参照を追加 |
| artifacts drift | `diff -u artifacts.json outputs/artifacts.json` | 2ファイルを同期 |
| 正本仕様 drift | `system-spec-update-summary.md` と aiworkflow references の突合 | `technology-core.md` / `technology-frontend.md` を same-wave sync |

### エッジケース

| ケース | 扱い |
| --- | --- |
| UI stub のみ | runtime foundation 情報が読めることをスクリーンショットで確認し、詳細 UI 品質は後続機能 task へ渡す |
| Node 24 実環境検証 | Node v24.15.0 / pnpm 10.33.2 で install / typecheck / OpenNext build / bundle size 証跡を取得済み |
| `@cloudflare/next-on-pages` が残る | Deprecated のため不採用。`@opennextjs/cloudflare` を正本仕様と version ledger に記録 |
| TypeScript 7.0 beta が見える | ベータ版のため採用しない。6.x（6.0.3以上）を採用 |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| task path | `doc/02-serial-monorepo-runtime-foundation` |
| task type | `code_and_docs` |
| docs_only | `false` |
| Node.js | `24.x` |
| pnpm | `10.x` |
| Next.js | `16.x` |
| React | `19.2.x` |
| TypeScript | `6.x` |
| Web adapter | `@opennextjs/cloudflare` |
| API framework | `Hono 4.12.x` |
| D1 owner | `apps/api/` |

### テスト構成

| 検証 | 対象 | 期待値 |
| --- | --- | --- |
| Phase 仕様検証 | `phase-01.md`〜`phase-13.md` | error 0 |
| Phase 11 visual stub 検証 | `outputs/phase-11/*` | screenshot ありで PASS |
| Phase 12 guide 検証 | `outputs/phase-12/implementation-guide.md` | Part 1/2 必須項目 PASS |
| artifact 同期 | `artifacts.json` / `outputs/artifacts.json` | 差分なし |
| 正本仕様同期 | aiworkflow references | TypeScript 6.x / OpenNext 方針が反映済み |
| Node 24 実環境検証 | `volta run --node 24 --pnpm 10.33.2 ...` | install / typecheck / OpenNext build PASS |
| Workers bundle size | `.open-next/worker.js` / `.open-next/assets` | worker.js 2,278 bytes / assets 約 644KB |

## 変更内容

### 1. docs: Phase 1〜12 の成果物を outputs/ に作成

| ファイル | 内容 |
| --- | --- |
| outputs/phase-01/main.md | 要件定義・AC・採用方針 |
| outputs/phase-02/main.md | 設計サマリー |
| outputs/phase-02/runtime-topology.md | apps/web / apps/api / packages 構成図（重要 ledger） |
| outputs/phase-02/version-policy.md | runtime version policy（重要 ledger） |
| outputs/phase-03/main.md | 設計レビュー・代替案・MINOR 追跡 |
| outputs/phase-04/main.md | 事前検証手順 |
| outputs/phase-05/main.md | セットアップ実行サマリー |
| outputs/phase-05/foundation-bootstrap-runbook.md | workspace 構築手順・rollback（重要 ledger） |
| outputs/phase-06/main.md | 異常系検証（A1〜A9 の CLEAR / PENDING） |
| outputs/phase-07/main.md | AC × 検証項目マトリクス |
| outputs/phase-08/main.md | 設定 DRY 化サマリー |
| outputs/phase-08/dependency-boundary-rules.md | dependency boundary rules（重要 ledger） |
| outputs/phase-09/main.md | 品質保証・命名規則・Secrets 漏洩チェック |
| outputs/phase-10/main.md | 最終レビュー・AC 全項目 PASS 判定・GO/NO-GO |
| outputs/phase-11/main.md | code_and_docs smoke test サマリー |
| outputs/phase-11/manual-smoke-log.md | 手動確認ログ |
| outputs/phase-11/link-checklist.md | 主要リンク確認 |
| outputs/phase-11/screenshots/RF-01-runtime-foundation-home-after.png | runtime foundation home の視覚証跡 |
| outputs/phase-12/main.md | Phase 12 サマリー |
| outputs/phase-12/implementation-guide.md | 本ファイル |
| outputs/phase-12/system-spec-update-summary.md | 正本仕様同期サマリー |
| outputs/phase-12/documentation-changelog.md | 変更履歴 |
| outputs/phase-12/unassigned-task-detection.md | 実装済み項目の再分類と Node 24 検証未タスク |
| outputs/phase-12/skill-feedback-report.md | skill feedback |
| outputs/phase-12/phase12-task-spec-compliance-check.md | 最終準拠チェック |

### 2. docs: 正本仕様の同期（same-wave sync）

| ファイル | 変更内容 |
| --- | --- |
| .claude/skills/aiworkflow-requirements/references/technology-core.md | TypeScript 5.7.x → 6.x（6.0.3 以上）、変更履歴 v1.2.0 |
| .claude/skills/aiworkflow-requirements/references/technology-frontend.md | Next.js 16.x に @opennextjs/cloudflare 採用方針・不採用理由を追記、変更履歴 v1.1.0 |
| .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | Web/API 独立デプロイ責務を Next.js 16 + OpenNext Workers / Hono Workers に同期 |
| .claude/skills/aiworkflow-requirements/references/technology-backend.md | apps/web の古い Next.js 15 / Pages 記述を Next.js 16 / OpenNext Workers に同期 |

### 3. code: runtime foundation skeleton を作成

| ファイル | 内容 |
| --- | --- |
| package.json, pnpm-workspace.yaml, .nvmrc, tsconfig.json | pnpm workspace / Node 24 / TS 6 strict 設定 |
| apps/web/package.json, next.config.ts, open-next.config.ts, wrangler.toml | Next.js 16 + @opennextjs/cloudflare on Workers 設定 |
| apps/web/app/page.tsx, layout.tsx, styles.css | runtime foundation home |
| apps/api/src/index.ts, wrangler.toml | Hono Workers entry point と D1 binding |
| packages/shared/src/index.ts | runtime foundation contract |
| packages/integrations/src/index.ts | integration runtime target |

## 主要な設計判断

### apps/web と apps/api の分離

- apps/web: Next.js 16.x + @opennextjs/cloudflare（Workers runtime）
- apps/api: Hono 4.12.x（Workers runtime）
- D1 アクセスは apps/api に完全封じ込め（CLAUDE.md 不変条件 5）

### @cloudflare/next-on-pages 不採用

廃止予定（Deprecated）のため @opennextjs/cloudflare を採用。Workers バンドルサイズ 3MB 制限に注意。超過時は Pages Functions（25MB）へ移行。

### TypeScript 6.x への移行

v6 は strict モード強化・型推論改善。v7.0 はベータのため非推奨。

### Auth.js v5 の注意事項

環境変数プレフィックスが NEXTAUTH_* → AUTH_* に変更。AUTH_SECRET（64文字以上）を Cloudflare Secrets に必ず設定する。JWT 暗号化に既知バグあり。

## リスク

| リスク | 対処 |
| --- | --- |
| Workers バンドルサイズ 3MB 超過 | `optimizePackageImports` オプション使用。超過なら Pages Functions（25MB）へ |
| Auth.js v5 JWT 暗号化の既知バグ | OAuth 周りの実装時に公式 issues を確認 |
| Node 24.x 実環境検証 | 完了。Node v24.15.0 / pnpm 10.33.2 で install / typecheck / OpenNext build PASS |

## Verification close-out

なし。実装スケルトン、Node 24.x 実環境検証、OpenNext build、Workers bundle size 証跡取得まで同一 wave で完了。

## downstream task への参照

| 下流 task | 参照するファイル |
| --- | --- |
| 03-serial-data-source-and-storage-contract | outputs/phase-02/runtime-topology.md, outputs/phase-02/version-policy.md |
| 04-serial-cicd-secrets-and-environment-sync | outputs/phase-02/version-policy.md（環境変数設計） |
| 05b-parallel-smoke-readiness-and-handoff | outputs/phase-02/runtime-topology.md, outputs/phase-05/foundation-bootstrap-runbook.md |
