# Phase 9: 品質保証

`[実装区分: 実装仕様書]` / `implementation_mode: edit` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

Issue #1126「bulk tag picker visual baseline の viewport 拡張（mobile/tablet/wide）」の品質保証フェーズ。
本フェーズはコマンドを実行しない。本実行サイクルが通すべき品質ゲート・read-only / auth leak ガード・flaky 対策を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1126-bulk-tag-picker-viewport-baseline-expansion` |
| issue | #1126（CLOSED 維持 / `Refs #1126`） |
| phase | 9（品質保証） |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` |
| 編集対象 fixture | `apps/web/playwright/fixtures/viewports.ts` |
| 実行前提 | すべての pnpm コマンドは `mise exec --` 経由（Node 24 / pnpm 10 を保証） |

## 1. 品質ゲート一覧

| ゲート | コマンド | 期待 | user-gated |
| --- | --- | --- | --- |
| 型チェック | `mise exec -- pnpm typecheck` | PASS（spec / fixture の型整合） | 不要 |
| lint | `mise exec -- pnpm lint` | PASS（spec / fixture の lint 違反なし） | 不要 |
| 親 component 回帰 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | PASS（BulkActionBar の component test が緑） | 不要 |
| playwright staging visual | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated` | PASS（8 baseline 比較。初回は `--update-snapshots` で生成） | **必要** |
| read-only grep ガード | `scripts/lib/grep-no-auth-leak.sh`（Phase 9 §2） | auth artifact / token のコミット混入なし | 不要 |

> typecheck / lint / focused component test / grep ガードは user 承認不要のローカル検証。
> staging 実機 capture（`--project=staging-visual-authenticated`）は secrets / storageState mint を伴うため user-gated。

### 1.1 各ゲートの責務

| ゲート | 担保する観点 |
| --- | --- |
| typecheck | `wide` additive 追加後の `viewports.ts` 型、`prepareBulkRegion/switchToUnassignMode` の引数型、`RESPONSIVE_VIEWPORTS` の要素型が整合する |
| lint | spec / fixture に未使用 import・スタイル違反がない |
| 親 component test | spec が観測する BulkActionBar tag picker の DOM 構造（mode toggle / region）が回帰していない |
| playwright staging | 4 viewport × 2 状態 = 8 baseline の生成・比較が PASS する（実機 capture） |
| grep ガード | `.auth` storageState / token が成果物・コミットへ漏れない |

## 2. read-only / auth leak ガード

本タスクは read-only（mutation 厳禁）かつ認証付き staging を使うため、副作用ゼロと認証情報の非漏洩を二重に保証する。

| ガード | 内容 | 確認方法 |
| --- | --- | --- |
| mutation ゼロ | apply を呼ばず picker 表示のみを撮る。全 viewport ループ通過後に `getByTestId('bulk-tag-result')` の count が 0 | spec 内 assertion（`expect(...).toHaveCount(0)`）。result パネルが一度も出ないこと |
| auth artifact 残存なし | capture 後に `apps/web/playwright/.auth` の storageState がコミット対象に残らない | `.auth` が `.gitignore` 配下。`git status` で `.auth` 配下が未追跡・未ステージであること |
| auth leak grep | storageState / token 文字列が spec・baseline・evidence・outputs に混入しない | `scripts/lib/grep-no-auth-leak.sh` を実行し検出 0 |
| evidence path 固定 | `PLAYWRIGHT_EVIDENCE_DIR` を本 workflow の `outputs/phase-11/evidence` に固定し、generic staging visual 既定の evidence path を汚さない | capture command（Phase 11 §4）の環境変数で固定 |

> read-only 不変条件の本質は「全 viewport を横断しても mutation 副作用がゼロ」であること。
> viewport ループは picker 表示の撮影のみを行い、`bulk-tag-result` は最後まで count 0 を維持する。

## 3. flaky 対策

responsive viewport 切替を伴う visual baseline は、アニメーション・reflow タイミング・微小な antialiasing 差で flaky 化しやすい。以下で安定化する。

| 対策 | 内容 |
| --- | --- |
| animations disabled | `toHaveScreenshot` の `animations: 'disabled'`（既存 desktop と同設定）を全 viewport へ適用。トランジション中のフレーム差を排除 |
| viewport reflow 待ち | `page.setViewportSize()` 直後に reflow 完了を待つ（picker region の可視・安定を待ってから撮る）。切替直後の未確定レイアウトを撮らない |
| maxDiffPixelRatio | `maxDiffPixelRatio: 0.05` を全 baseline に適用。フォントレンダリング差等の微小ノイズを許容しつつレイアウト退行は検出 |
| 撮影対象の限定 | full page ではなく BulkActionBar tag picker region を `toHaveScreenshot` 対象にし、画面外要素の揺れを排除 |
| desktop 設定との一致 | 新規 6 baseline の `animations` / `maxDiffPixelRatio` を desktop 既存 2 baseline と同値に揃え、判定基準を viewport 間で統一 |

> flaky 対策の閾値（`maxDiffPixelRatio: 0.05` / `animations: 'disabled'`）は desktop 既存 baseline と同一値に揃える。
> viewport 切替後の reflow 待ちを入れることで、未確定レイアウトを撮ることによる偽陽性 diff を防ぐ。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` | ゲート対象 |
| 編集対象 fixture | `apps/web/playwright/fixtures/viewports.ts` | typecheck 対象 |
| auth leak grep | `scripts/lib/grep-no-auth-leak.sh` | 認証情報非漏洩の機械検証 |
| 親 component test | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | 回帰検証 |
| Phase 8 リファクタ方針 | `../phase-8/phase-8.md` | helper / ループの保持境界 |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-9/phase-9.md` | 品質ゲート一覧（typecheck / lint / focused component test / playwright staging[user-gated] / read-only grep）、read-only & auth leak ガード（mutation ゼロ・`.auth` 残存なし・grep・evidence path 固定）、flaky 対策（animations disabled / reflow 待ち / maxDiffPixelRatio 0.05）|

## 完了条件（Phase 9）

| 項目 | 基準 |
| --- | --- |
| ゲート列挙 | typecheck / lint / focused component test / staging visual（user-gated）/ grep ガードを `mise exec --` 経由コマンド付きで確定した |
| read-only | mutation ゼロ（`bulk-tag-result` count 0）と auth leak ガードを明記した |
| flaky 対策 | animations disabled / viewport reflow 待ち / `maxDiffPixelRatio: 0.05` を確定し、desktop 既存と同値に揃える方針を明記した |
| user-gate 境界 | staging capture のみ user-gated、ローカル 4 ゲートは承認不要であることを区別した |
