# Phase 12 Task-Spec Compliance Check

## 仕様書との準拠確認

### 受入条件（AC）全 5 項目

| AC | 仕様書記載 | 実施内容 | 判定 |
| --- | --- | --- | --- |
| AC-1 | apps/web と apps/api の責務境界が明文化されている | outputs/phase-02/runtime-topology.md に境界を記録 | PASS |
| AC-2 | Node 24.x / pnpm 10.x / Next.js 16.x / React 19.2.x / TS 6.x strict に揃う | outputs/phase-02/version-policy.md に全バージョンを記録。TS 6.x は Phase 12 Step 2 で正本同期完了 | PASS |
| AC-3 | dependency rule が一意に説明できる | outputs/phase-08/dependency-boundary-rules.md を作成 | PASS |
| AC-4 | @opennextjs/cloudflare を採用し、理由が残る | phase-02 設定値表 + phase-03 代替案 + technology-frontend.md に記録 | PASS |
| AC-5 | local / staging / production の entry point が説明できる | outputs/phase-05/foundation-bootstrap-runbook.md に記録 | PASS |

### Phase 12 必須成果物（仕様書記載）

| 成果物 | 仕様書記載パス | 状態 |
| --- | --- | --- |
| 実装ガイド | outputs/phase-12/implementation-guide.md | DONE |
| system spec update | outputs/phase-12/system-spec-update-summary.md | DONE |
| changelog | outputs/phase-12/documentation-changelog.md | DONE |
| unassigned | outputs/phase-12/unassigned-task-detection.md | DONE |
| skill feedback | outputs/phase-12/skill-feedback-report.md | DONE |
| compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | DONE（本ファイル） |

### index.md の完了判定条件

| 条件 | 状態 |
| --- | --- |
| Phase 1〜13 の状態が artifacts.json と一致する | artifacts.json を completed に更新後 PASS |
| AC が Phase 7 / 10 で完全トレースされる | PASS（Phase 7 AC マトリクス・Phase 10 PASS 判定表で確認） |
| 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS | PASS（Phase 10 最終判定） |
| Phase 12 の same-wave sync ルールが破られていない | PASS（B-01, B-02 解消済み） |
| Phase 13 はユーザー承認なしでは実行しない | PASS（Phase 13 は承認待ち状態で停止） |

### スコープ遵守確認

| 項目 | 仕様書記載 | 実施状況 |
| --- | --- | --- |
| 業務機能実装 | スコープ外 | 実施しない |
| 本番デプロイ | スコープ外 | 実施しない |
| sync ロジック実装 | スコープ外 | 実施しない |

### 正本同期ゲートの確認

| 対象 | 現行正本との差分 | Phase 12 判定 |
| --- | --- | --- |
| Runtime version（TS） | 5.7.x → 6.x | Step 2 同期完了（PASS） |
| Web runtime（@opennextjs/cloudflare） | technology-frontend.md に未明示 → 明示 | Step 2 同期完了（PASS） |
| Adapter policy | @cloudflare/next-on-pages 不採用を明示 | Step 2 同期完了（PASS） |
| Evidence | version-policy.md を version ledger として確立 | Phase 10 / 12 で照合済み（PASS） |
| OpenNext wrangler | `apps/web/wrangler.toml` を Workers 形式へ更新 | `main = ".open-next/worker.js"` / `[assets] directory = ".open-next/assets"` を確認（PASS） |
| Visual evidence | `apps/web` home のスクリーンショットを取得 | `outputs/phase-11/screenshots/RF-01-runtime-foundation-home-after.png`（PASS） |

### 検証環境メモ

| 項目 | 結果 |
| --- | --- |
| `pnpm typecheck` | PASS |
| Node version | v24.15.0（`volta run --node 24 --pnpm 10.33.2`） |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm --filter @ubm-hyogo/web build:cloudflare` | PASS |
| Workers bundle size | `apps/web/.open-next/worker.js` 2,278 bytes、assets 約 644KB |
| 後続検証 | なし。UT-20 は同一 wave で完了 |

## 最終判定

**PASS** — 全 AC が SPEC-PASS 以上。必須 6 成果物と Phase 11 スクリーンショットが存在。正本同期、Node 24.x 実環境検証、OpenNext build、bundle size 確認まで完了。
