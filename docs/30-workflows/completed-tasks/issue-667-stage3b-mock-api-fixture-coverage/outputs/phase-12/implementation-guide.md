# Implementation Guide — issue-667 stage3b mock-api fixture coverage

## Part 1: 中学生レベル

このタスクは、テスト用の「本物の API の代役」を強くする作業です。
今までは代役が「適当な ok」を返すだけだったので、本物と違う形でもテストが通る危険がありました。
今回、答えの「形の決まり書（contract）」を packages/contracts に作り、
代役は答えを返す前に必ずこの決まり書で形をチェックするようにしました。

| 用語 | 日常語 |
| --- | --- |
| API | 質問すると決まった形で答える窓口 |
| mock | 本物の代わりにテスト用の答えを返す係 |
| contract | 答えの形を決めた約束 |
| schema | 約束どおりか確認する型紙 (zod) |
| CI | 変更ごとに自動で確認する機械 |

## Part 2: 技術者レベル

### 変更概要

| 領域 | 種別 | 内容 |
|------|------|------|
| `packages/contracts/` | 新設 | `@ubm-hyogo/contracts` パッケージ。zod schema + canonical fixtures の SSOT |
| `scripts/e2e-mock-api.mjs` | 拡張 | `safeJson` ラッパー導入、業務 endpoint で zod parse、`{ok:true}` 200 fallthrough 廃止、`identity-conflicts` merge / dismiss 追加 |
| `scripts/__tests__/e2e-mock-api.contract.spec.ts` | 新設 | mock を spawn し全 endpoint を契約検証 (28 tests) |
| `packages/contracts/src/index.spec.ts` | 新設 | schema self-test + AC-4 fixtures invariants (21 tests) |
| `.github/workflows/e2e-tests.yml` | patch | `Wait for mock API readiness` step + `Upload mock API log` artifact step を追加 |
| `.github/workflows/ci.yml` | patch | `Mock API contract tests` step を追加 |
| `apps/api/package.json` / `apps/web/package.json` | 編集 | `@ubm-hyogo/contracts: workspace:*` 依存追加 |

### AC 充足

| AC | 内容 | 結果 |
|----|------|------|
| AC-1 | endpoint 網羅 | 23 endpoint + `/health` 全カバー |
| AC-2 | contracts SSOT + parse 必須 | 業務 endpoint は `safeJson(schema)` で parse。`/health` と `/__test__/*` は readiness/control 例外 |
| AC-3 | 契約テスト | 28 tests / Vitest 経路で全 GREEN |
| AC-4 | seed 強化 | members 3 / zones 2 (Kobe, Himeji) / memberships 2 (regular, honorary) / negative `zzz_no_match_zzz` / tag facets 2 (ABC法, DEF法) |
| AC-5 | CI 健全化 | curl-based readiness wait (max 30s) + log artifact (retention 7d) |
| AC-6 | regression 不在 | 既存 dispatcher 順序を維持し、新規 endpoint は完全一致と startsWith の間に挿入 |
| AC-7 | 型・lint・coverage | focused contracts typecheck + focused Vitest 49 tests PASS。Full repo coverage / GitHub Actions runtime は pending |

### 仕様書からの逸脱

- **`packages/contracts` を tsup ビルドではなく plain ESM (`.mjs`) で実装**
  - 理由: `scripts/e2e-mock-api.mjs` を Node 直接実行する経路で `dist/` build step を要求しないため
  - 理由: `packages/shared` の既存 pattern (`src/index.ts` を直接 export) と整合
  - 影響: TypeScript からの import は `// @ts-ignore` で `.mjs` を読み込む。型は zod 自身が提供するため実害なし

### Evidence contract

- 実装前: `spec_created`
- 実装 + focused local evidence 完了後 (本 PR): `runtime_pending`
- CI runtime evidence 取得後: `completed`

### スクリーンショット

NON_VISUAL タスク (visualEvidence=NON_VISUAL のため画像添付なし)。
