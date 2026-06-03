# Phase 11: 手動テスト計画 + 証跡

## タスク種別

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| implementation_mode | new（新規コード + 新規テスト） |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| 主証跡ソース（NON_VISUAL: T01/T02） | 自動テスト（Vitest）の名前と件数 |
| 主証跡ソース（VISUAL: T03） | jsdom render（`page.spec.tsx` / `SectionError.spec.tsx`）+ static UI contract screenshot。staging runtime screenshot は二次証跡 |

## 実施情報

| 項目 | 値 |
| --- | --- |
| 実施 wave | implemented_local_evidence_captured（実装・focused Vitest・static UI contract screenshot 実行済み。staging 認証 runtime screenshot は user-gated） |
| ブランチ | `docs/profile-reload-session-404-fix-spec` |
| 起点 | `origin/dev` (bd0393a29) |
| 対象環境（将来の VISUAL 検証） | staging（`ubm-hyogo-web-staging.daishimanju.workers.dev`） |

## 仕様判断根拠（FB-4: スクリーンショット二段境界）

- workflow_state は `implemented_local_evidence_captured`。本 wave で実コードと focused Vitest は完了した。
- T03 のエラーバナー（`SectionError` の再ログイン CTA）の staging runtime screenshot は、`/profile` がログイン必須ルートであり認証セッションが前提のため **user-gated**。Claude Code が staging に認証ログインして screenshot を取得することはできない。
- ただし UI 変更の物理画像証跡を欠落させないため、本 wave では static UI contract screenshot を Playwright Chromium で取得し、`outputs/phase-11/screenshots/` に保存した。
- Phase 12 compliance check では static UI contract screenshot を captured、staging runtime screenshot を user-gated として分離して扱う。

## 実行記録

本 wave では下記の focused Vitest と static UI contract screenshot を実行した。staging runtime screenshot は user-gated のため未実行。

| コマンド | 結果 |
| --- | --- |
| `pnpm exec vitest run apps/api/src/middleware/__tests__/trailing-slash.spec.ts apps/api/src/__tests__/me-route-mount.integration.spec.ts` | PASS（2 files / 9 tests） |
| `pnpm exec vitest run 'apps/web/app/api/me/[...path]/route.route.spec.ts' 'apps/web/app/(member)/profile/page.spec.tsx' apps/web/src/components/member/__tests__/SectionError.spec.tsx` | PASS（3 files / 16 tests） |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| Playwright Chromium static UI contract screenshot | PASS（2 PNG + metadata + coverage 生成） |

### NON_VISUAL パート（T01 / T02）— 自動テスト主証跡

| ID | 対象 | テストファイル（予定） | 予定テスト名 | 期待結果 |
| --- | --- | --- | --- | --- |
| MT-01 | T01 middleware 単体 | `apps/api/src/middleware/__tests__/trailing-slash.spec.ts` | `redirects a trailing-slash path to its normalized path` | PASS |
| MT-02 | T01 middleware 単体 | `apps/api/src/middleware/__tests__/trailing-slash.spec.ts` | root / query / multi slash / OPTIONS cases | PASS |
| MT-03 | T01 フルアプリ・マウント統合 | `apps/api/src/__tests__/me-route-mount.integration.spec.ts` | `GET /me` は 404 ではなく 401、`GET /me/` は 308、`GET /` は 200 | PASS |
| MT-04 | T02 proxy URL 構築 | `apps/web/app/api/me/[...path]/route.route.spec.ts` | 空 path（`/api/me`）は upstream を `/me`（末尾スラッシュ無し）にする | PASS |
| MT-05 | T02 proxy 既存非回帰 | `apps/web/app/api/me/[...path]/route.route.spec.ts` | session なし 401 / POST body+headers / GET query passthrough | PASS |

### VISUAL パート（T03）— jsdom render 主証跡 + screenshot 二次証跡

| ID | 対象 | 証跡 | 予定内容 | 期待結果 |
| --- | --- | --- | --- | --- |
| MT-06 | T03 `/profile` 404 分岐 | jsdom render（`apps/web/app/(member)/profile/page.spec.tsx`） | `MEMBER_SESSION_404` 時に再ログイン CTA（`/login?redirect=/profile`）を描画し、生 message を露出しない | PASS |
| MT-07 | T03 `/profile` 非 404 分岐 | jsdom render（`apps/web/app/(member)/profile/page.spec.tsx`） | 404 以外の非 2xx で固定一般文言 + `retryHref="/profile"`（生 message 非露出） | PASS |
| MT-08 | T03 `/profile` 401 分岐 | jsdom render（`apps/web/app/(member)/profile/page.spec.tsx`） | 401（`AuthRequiredError`）は `/login?redirect=/profile` へ redirect | PASS |
| MT-09 | T03 `SectionError` CTA | jsdom render（`apps/web/src/components/member/__tests__/SectionError.spec.tsx`） | `actionHref` && `actionLabel` で `data-role="action"` リンク描画。`retryHref` のみは後方互換 | PASS |
| TC-01 | T03 エラーバナー外観 | static UI contract screenshot（`outputs/phase-11/screenshots/profile-session-404-relogin-static-contract.png`） | 再ログイン CTA バナーの文言・リンク視覚契約 | PASS |
| TC-02 | T03 エラーバナー外観 | static page screenshot（`outputs/phase-11/screenshots/profile-session-404-relogin-static-page.png`） | ページ内配置の視覚契約 | PASS |

## 完了条件

- [x] タスク種別・実施情報・仕様判断根拠・実行記録の 4 節を記録
- [x] NON_VISUAL（T01/T02）の主証跡を自動テスト名・件数として記録
- [x] VISUAL（T03）の主証跡を jsdom render + static UI contract screenshot と定義し、staging runtime screenshot を user-gated として分離
- [x] screenshot 物理ファイル、screenshot-plan.json、phase11-capture-metadata.json、screenshot-coverage.md を `outputs/phase-11/` 配下に保存

## 成果物

- `outputs/phase-11/manual-test-result.md`（本ファイル）

## 参照資料

- `outputs/phase-1/phase-1.md`（AC-1〜AC-8）
- `outputs/phase-3/phase-3.md`（T01〜T03 修正方針）
- `outputs/phase-5/task-01..03-*.md`（実装仕様書本体）

## 統合テスト連携

Authenticated staging runtime screenshot は user-gated 承認後に取得し `outputs/phase-11/screenshots/` へ配置する。
