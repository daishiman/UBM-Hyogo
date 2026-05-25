# home-page-prototype-alignment follow-up 001: `/terms` env validation prefetch エラーの解消

## メタ情報

```yaml
issue_number: 882
```

| 項目 | 値 |
| --- | --- |
| タスクID | home-page-prototype-alignment-followup-001 |
| タスク名 | `/terms` route の env validation prefetch error 解消（JavaScript 有効時に `/` 描画を阻害） |
| 分類 | bugfix / runtime |
| 対象機能 | `apps/web` 公開ページ runtime / Next.js prefetch |
| 優先度 | High |
| 状態 | consumed_by_canonical_workflow |
| 発見元 | `home-page-prototype-alignment` Phase 11 manual test + Phase 12 implementation-guide |
| 発見日 | 2026-05-23 |
| 前提 | `home-page-prototype-alignment` task-01 / task-02 完了済み（Phase 12 までクローズ） |
| 既存 issue | なし（gh issue / 既存 unassigned-task に該当エントリなし） |

## 背景

> 2026-05-25 追記: 本 follow-up は `docs/30-workflows/issue-882-terms-prefetch-env-validation-fix/` に canonical workflow として昇格し、同 workflow 内の実装で吸収済み。未実施 unassigned としては扱わない。

`home-page-prototype-alignment` の Phase 11 manual test で `next start` + deterministic mock API による `/` の表示検証を行った際、**JavaScript 有効状態で `/` を開くと、ヘッダ等から prefetch される `/terms` route の env validation throw が原因で client-side error が発生**することが判明した。

ホーム CSS 実装そのものは server-rendered HTML / CSS が正しく描画されるため、Phase 11 では **JavaScript 無効で screenshot を取得**することで CSS validation を分離した。しかしユーザーが実際に `/` を訪問した場合、prefetch 経由で `/terms` 側の env validation throw が走り、SPA navigation や hover prefetch が破綻する状況が残存する。

参照:
- `docs/30-workflows/completed-tasks/home-page-prototype-alignment/outputs/phase-11/manual-test-result.md` §視覚的検証 / Boundary
- `docs/30-workflows/completed-tasks/home-page-prototype-alignment/outputs/phase-12/implementation-guide.md` Part 3 / Part 6

Phase 12 unassigned-task-detection は当初「0」と判定したが、CONST_002（2 回確認）で本現象が明示的に "deferred"（boundary 外として除外）として記録されていることが確認できたため、本 follow-up として独立タスク化する。

## 目的

`/` を JavaScript 有効状態で開いた際に、Next.js が `<Link href="/terms">` 等を prefetch しても client-side error / hydration mismatch を発生させない状態にする。`/terms` route の env 参照経路を見直し、prefetch 時に `getEnv()` の zod parse 失敗で throw しない設計に揃える。

## スコープ

### 含む

- `apps/web/app/terms/page.tsx` および `LegalProse` / 関連 module の env 参照経路調査
- `apps/web/src/lib/env.ts` (`getEnv()` / `getPublicEnv()`) の throw タイミング確認
- prefetch 経路（Next.js Link）/ React Server Component / Edge runtime での env evaluation 順序の特定
- prefetch 失敗時に `/` 自体の hydration を阻害しない仕組み（`error.tsx` 補足範囲含む）の実装
- 修正後の `/` 訪問時 JavaScript 有効 screenshot 取得（home-desktop / home-mobile 2 種）
- staging への deploy 前の `bash scripts/verify-pr-ready.sh` 全 green 確認

### 含まない

- `/terms` 文面の本番化（既存 `task-05a-privacy-terms-pages-001` のスコープ）
- 新規 env var の追加
- D1 schema 変更
- `home-page-prototype-alignment` の CSS / className 変更（同 workflow で完了済み）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 前提 | `home-page-prototype-alignment` Phase 12 完了 | 本 follow-up の発見元 |
| 前提 | `apps/web/src/lib/env.ts` の `getEnv()` API（task-02 wrangler-env-injection 不変条件） | env 参照は `getEnv()` 経由のみ。`process.env.*` 直参照禁止 |
| 関連 | `apps/web/src/app/error.tsx` (task-05) | prefetch 失敗時の error boundary 補足挙動の確認対象 |
| 関連 | `task-05a-privacy-terms-pages-001` | `/terms` 静的ページ実装本体（既存 unassigned-task）。文面更新は本タスク対象外 |

## 苦戦箇所・知見

**現象の切り分けが必要**: Phase 11 では「server-rendered HTML / CSS は正常」「JavaScript 有効時に `/terms` env validation prefetch でエラー」と切り分けた。再現には `next start` + deterministic mock API + `/` を browser DevTools で `JavaScript: enabled` 状態で訪問し、Network panel と Console を観察する必要がある。Playwright で再現スクリプトを書く際は `page.goto('/')` 後 `page.waitForLoadState('networkidle')` で prefetch 完了を待つこと。

**`getEnv()` の throw 位置**: `apps/web/src/lib/env.ts` の `getEnv()` は zod parse 失敗時に throw し、`apps/web/src/app/error.tsx` (task-05) で補足される設計（CLAUDE.md `apps/web` env アクセス不変条件）。prefetch 経路ではこの error boundary が SPA navigation の途中で発火し、`/` 側の hydration に副作用を与える可能性がある。throw を Suspense / error boundary より外側に出すか、`/terms` 側で「prefetch 時には env を参照しない」設計に変える選択肢を比較すること。

**OpenNext Workers と Next.js prefetch の差分**: `next dev` と `next build --webpack` + Workers ランタイムでは prefetch 挙動が異なる場合がある。production-equivalent 環境（staging）での再現も必須。`UT-DSF-07` の production-equivalent runtime screenshot 取得タスクと並行確認できると効率的。

**`/terms` がそもそも env を要求している理由の調査**: `apps/web/app/terms/page.tsx` は単純な静的 page だが、`LegalProse` primitive または共通 layout / `proxy.ts` (Next.js 16 proxy migration, #850) 経由で env 参照が混入している可能性がある。`grep -rn "getEnv\|process.env" apps/web/app/terms apps/web/src/components/legal apps/web/proxy.ts` で参照経路を洗い出すこと。

**CONST_002 適用の教訓**: Phase 12 unassigned-task-detection.md が当初「0」と判定したが、Phase 11 / 12 本文に明示された "boundary / followup" 項目を 2 回目確認で精査することで本タスクが浮上した。CONST_002 を遵守しない場合、現象を残したまま workflow を completed-tasks/ に移動するリスクがあった。今後の Phase 12 unassigned-task-detection 作成時は **`manual-test-result.md` / `implementation-guide.md` の "Boundary" / "Known Limits" 節を逐語確認**するチェックポイントを追加すべき。

**staging deploy はユーザー承認後のみ**: CLAUDE.md `Cloudflare 系 CLI 実行ルール` に従い `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` はユーザー明示承認後に実行する。本タスクの受け入れ基準には local 検証 + screenshot を含めるが、staging 検証は別ゲートで扱う。

## 受け入れ基準

- [ ] `/` を JavaScript 有効状態で開いた際、Console に `/terms` env validation 由来の error が出ないこと
- [ ] `<Link href="/terms">` の hover / focus prefetch が成功すること（Network panel で 200 確認）
- [ ] `/` の hydration mismatch / client-side error 0 件
- [ ] `apps/web/app/terms/page.tsx` / `LegalProse` / 共通 layout / `proxy.ts` のいずれかで env 参照経路を是正
- [ ] env 参照は引き続き `getEnv()` / `getPublicEnv()` 経由のみ（`process.env.*` 直接参照を導入しないこと）
- [ ] JavaScript 有効 screenshot を `outputs/phase-11/screenshots/home-desktop-js-enabled-YYYY-MM-DD.png` / `home-mobile-js-enabled-YYYY-MM-DD.png` で取得
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web test` 全 PASS
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] regression: `pnpm verify:tokens` PASS（HEX / negative letter-spacing 0 件維持）

## 参照

- `docs/30-workflows/completed-tasks/home-page-prototype-alignment/outputs/phase-11/manual-test-result.md`
- `docs/30-workflows/completed-tasks/home-page-prototype-alignment/outputs/phase-12/implementation-guide.md`
- `apps/web/src/lib/env.ts`（env アクセスの正本）
- `apps/web/src/app/error.tsx`（error boundary, task-05）
- `apps/web/app/terms/page.tsx`
- CLAUDE.md `apps/web` env アクセス不変条件 / Cloudflare 系 CLI 実行ルール
- `docs/30-workflows/unassigned-task/task-05a-privacy-terms-pages-001.md`（隣接タスク）
- `docs/30-workflows/unassigned-task/UT-DSF-07-visual-runtime-production-equivalent-screenshots.md`（production-equivalent runtime での再現）
