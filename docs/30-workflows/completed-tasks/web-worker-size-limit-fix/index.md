# Worker サイズ超過 staging デプロイ失敗の解消 — Phase 1-13 タスク仕様書

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `web-worker-size-limit-fix` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | `implemented_local_evidence_captured`（Task A/B はローカル実装済み。staging deploy / commit / push / PR は user-gated） |
| base branch | `dev` |
| work branch | `docs/web-worker-size-limit-fix-spec` |
| 作成日 | 2026-05-29 |
| coverage AC | 適用対象（apps/web）。詳細は phase-7 |

## 目的

`ubm-hyogo-web-staging` Worker が gzip 後 **3316.04 KiB** で無料プラン制限 **3 MiB（3072 KiB）** を **約 244 KiB 超過**し、`web-cd / deploy-staging` が `[code: 10027]` で失敗している。staging / production 双方のデプロイがブロックされている。これを **無料プラン構成を維持したまま**解消し、再発を CI で防止する。

## 解決対象エラー（正本）

```
✘ [ERROR] Your Worker exceeded the size limit of 3 MiB. [code: 10027]
  Total Upload: 13865.37 KiB / gzip: 3316.04 KiB
  - .open-next/server-functions/default/apps/web/handler.mjs - 11649.85 KiB
  - next/dist/compiled/@vercel/og/resvg.wasm - 1346.05 KiB
  - .open-next/middleware/handler.mjs - 506.32 KiB
  - next/dist/compiled/@vercel/og/Geist-Regular.ttf.bin - 123.00 KiB
  - next/dist/compiled/@vercel/og/yoga.wasm - 70.05 KiB
```

## 根本原因（確定）

`next/og`（`@vercel/og`）の `ImageResponse` が `resvg.wasm`(1346KB)+`yoga.wasm`(70KB)+`Geist-Regular.ttf.bin`(123KB)＝**約 1539 KB** を Worker に焼き込んでいる。使用箇所は root OG（`apps/web/app/opengraph-image.tsx`、静的テキスト）と member 動的 OG（`apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`）の 2 つのみ。これを静的 OG 画像へ置換すれば gzip 後 700 KB 以上削減でき、制限を確実に下回る（試算 worker gzip ~2.5 MiB）。

## スコープ

### 含む
- `next/og`（`@vercel/og`）の Worker からの完全除去（静的 OG 画像へ置換）
- OpenNext production minify 維持化
- Worker gzip サイズの CI gate（再発防止）
- 関連テスト（vitest / Playwright / regression spec）の更新

### 含まない
- D1 / API / Google Form の変更（既存 endpoint surface のみ）
- 本サイクルでのコード実装実行・commit・PR・push（ローカル実装済み。CONST_002）
- Cloudflare Paid プラン移行（無料構成方針を維持）
- member 個別動的 OG の再導入（無料プラン制限のため撤去。再導入は Paid 移行 or OG 専用 Worker 分離が前提の将来課題 — 要ユーザー承認。phase-12 unassigned-task-detection 参照）

## タスク分解（単一責務 / 1 サイクル完了 / 並列可）— CONST_007

| タスク | 責務 | 主対象ファイル |
| --- | --- | --- |
| Task A | `next/og` 撤去 → 静的 OG（直接の修正） | `app/opengraph-image.tsx`(削除) / `members/[id]/opengraph-image/route.tsx`(削除) / `public/og-default.png`(新規) / `site-metadata.ts` / `members/[id]/page.tsx` / 関連 spec |
| Task B | OpenNext production minify 維持 + Worker サイズ CI gate（再発防止） | `scripts/check-worker-size.sh`(新規) / `.github/workflows/web-cd.yml` / `opennext-config-regression.spec.ts`（`open-next.config.ts` は確認のみ） |

> Task A/B は編集ファイルが重複せず並列実装可。size gate の green 判定のみ A 完了後（phase-3 依存関係参照）。

## Phase 一覧

| Phase | 名称 | 成果物 |
| --- | --- | --- |
| 1 | 要件定義 | `phase-1-requirements.md` |
| 2 | 設計 | `phase-2-design.md` |
| 3 | 設計レビュー | `phase-3-design-review.md` |
| 4 | テスト計画 | `phase-4-test-plan.md` |
| 5 | 実装手順 | `phase-5-implementation.md` |
| 6 | テスト追加 | `phase-6-test-additions.md` |
| 7 | カバレッジ | `phase-7-coverage.md` |
| 8 | リファクタ | `phase-8-refactor.md` |
| 9 | QA | `phase-9-qa.md` |
| 10 | 最終レビュー | `phase-10-final-review.md` |
| 11 | 手動テスト | `phase-11-manual-test.md` + `outputs/phase-11/` |
| 12 | ドキュメント同期 | `phase-12-documentation.md` + `outputs/phase-12/`（strict 7） |
| 13 | commit / PR | `phase-13-pr.md` |

## 正本順位（衝突時の優先度）

1. 本 `index.md` および `phase-1` 〜 `phase-3`
2. `docs/00-getting-started-manual/specs/08-free-database.md`（無料構成制約）
3. `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`（Worker bundle size ガード仕様）
4. 既存実装（`apps/web/`）
