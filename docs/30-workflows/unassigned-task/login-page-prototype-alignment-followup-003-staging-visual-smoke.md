# login-page-prototype-alignment staging visual smoke - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | login-page-prototype-alignment-followup-003-staging-visual-smoke                                |
| タスク名     | login-page staging 環境 Playwright visual smoke runtime evidence 取得                            |
| 分類         | infrastructure / runtime evidence completion                                                    |
| 対象機能     | `/login` route 6 state visual smoke の staging 環境（Cloudflare Workers `dev` 環境）での再走     |
| 優先度       | 中                                                                                              |
| 見積もり規模 | 小規模                                                                                          |
| ステータス   | pending (staging deploy gate 待ち)                                                              |
| 発見元       | login-page-prototype-alignment Phase 12                                                         |
| 発見日       | 2026-05-23                                                                                      |

## Canonical Workflow Status

- canonical_workflow: `docs/30-workflows/login-page-prototype-alignment/`
- 親 workflow: `docs/30-workflows/login-page-prototype-alignment/`
- 親タスク状態: `implemented_local_visual_evidence_captured`
- 遷移先タスク状態: `implementation_completed`
- Phase 11 evidence 状態（local）: `completed`（local URL 起動 + 6 state screenshot 取得済み）
- Phase 11 evidence 状態（staging）: `pending`（本 followup で消化）
- 関連 outputs:
  - `docs/30-workflows/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md`（FU-LOGIN-003）
  - `docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/main.md`（local evidence design）
- 関連実装:
  - `apps/web/playwright/tests/login-smoke.spec.ts`
  - `apps/web/src/app/(auth)/login/page.tsx`
  - `apps/web/src/components/login/`
- 関連 governance: CLAUDE.md「ブランチ戦略」セクション（`dev` = Cloudflare staging / `main` = Cloudflare production）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

login-page-prototype-alignment では `docs/00-getting-started-manual/claude-design-prototype/` の login 画面プロトタイプを正本に `/login` を実装し、Phase 11 で `apps/web/playwright/tests/login-smoke.spec.ts` を用いた visual smoke を **local URL (`http://127.0.0.1:8788` または `pnpm --dir apps/web dev` の dev URL)** に対して走らせ、6 state（idle / focused-email / oauth-loading / magic-link-sent / error / mobile-375）の screenshot を `outputs/phase-11/screenshots/` に取得済み。これにより local visual evidence は `completed`。

しかし、Cloudflare Workers 上の **staging 環境（`dev` ブランチ deploy 先）** では以下が local と構造的に異なる:

- `@opennextjs/cloudflare` で再 bundle された JS / CSS（Turbopack dev bundle と OpenNext webpack production bundle の差）
- Cloudflare CDN 経由の静的アセット配信レイテンシ / cache header
- OAuth callback URL (`AUTH_GOOGLE_REDIRECT_URI`) の domain 差による button rendering / form action 差
- session cookie の `Domain` / `SameSite` 差による初期 hydration 挙動

local では検知できない visual 差分が staging で初めて出る可能性があるため、staging deploy 後に同 spec を再走させて local baseline と diff 比較する必要がある。

### 1.2 問題点・課題

- 親タスクは local evidence までで `implementation_completed` 直前に止まっており、staging runtime evidence が無い
- staging deploy gate は user-approval が必要（CLAUDE.md「PR作成の完全自律フロー」によりPR作成までは自律、deploy 実行は user 承認後）であり、Phase 11 内に閉じられなかった
- 後続 production リリース時（dev → main）の事前確認 baseline が不在

### 1.3 放置した場合の影響

- staging 固有の bundle 差や cookie domain 差による視覚的回帰を production 反映前に検知できない
- 後続の admin 系画面（task-18 visual-design-tokens / task-22 regression smoke）が staging baseline に依存する際、login の staging baseline が無いため CI 拡張時の足場が欠ける
- CLAUDE.md ブランチ戦略の「dev = staging で検証 / main = production」運用が形骸化する

---

## 2. 何を達成するか（What）

### 2.1 目的

staging 環境 URL に対して `apps/web/playwright/tests/login-smoke.spec.ts` を再走し、6 state screenshot を staging baseline として取得。local baseline との pixel diff を確認して、構造的差分が allowable な範囲（フォント rendering 差・CDN cache header 差のみ）に収まることを確認する。

### 2.2 最終ゴール

- staging URL（`dev` 環境 deploy 後の Cloudflare Workers URL）に対する `login-smoke.spec.ts` が 0 fail で完走
- 6 state screenshot が staging evidence path に取得済み
- local baseline との diff が allowable 範囲内（major regression なし）であることを目視レビューで確認
- FU-LOGIN-003 が consumed に更新

### 2.3 スコープ

#### 含むもの

- staging URL（`dev` 環境）に対する `login-smoke.spec.ts` の再実行
- 6 state screenshot 再取得（idle / focused-email / oauth-loading / magic-link-sent / error / mobile-375）
- local baseline との diff 確認（目視 + 必要なら `pixelmatch` 等）
- `outputs/phase-12/unassigned-task-detection.md` の FU-LOGIN-003 を consumed に更新

#### 含まないもの

- production smoke（`main` deploy 後の別 followup として切り出す）
- CI workflow への visual job 組込み（task-18 visual-design-tokens / task-22 regression smoke の責務）
- spec 自体の書き換え（既存 spec を staging URL 向けに env で切替）
- 新規 state 追加（プロトタイプ正本順位違反）

### 2.4 成果物

- staging evidence 6 PNG（path 命名は §3.2 で確定）
- local vs staging diff レビューメモ
- FU-LOGIN-003 consumed 更新差分

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 local / staging 完全一致しない構造的要因

- Next 16 dev tools overlay が local dev mode で injection されると視覚差を作る → staging では production build なので overlay は出ないが、local baseline 側に overlay が混入していると常に diff になる
- Turbopack 由来の HMR runtime script が local では `<head>` に挿入されるが OpenNext Workers bundle には無い
- フォント rendering: local macOS と Cloudflare CDN 経由配信で sub-pixel rendering が微妙に差分化

→ baseline は `--reporter=line` + Playwright `expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.02 })` 程度の閾値で許容する設計案。

### 3.2 Playwright `PLAYWRIGHT_EVIDENCE_DIR` で screenshot 保存先を変えられない件

`apps/web/playwright/tests/login-smoke.spec.ts` は `page.screenshot({ path: '...' })` で evidence path を spec 内に直書きしているため、環境変数で staging evidence path に動的切替できない。対処方針:

1. spec の `path` を `process.env.PLAYWRIGHT_EVIDENCE_DIR ?? 'docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/screenshots'` で env-override 可能にする最小改修
2. または staging 実行時にだけ別 evidence dir に出力する config をもう 1 本追加（`playwright.login-staging.config.ts`）

最小改修案（1）を推奨。spec の書き換えはこのタスクのスコープ外と§2.3 で宣言しているが、env-override のための 1 行差分は許容範囲とし、§2.3 の「spec 自体の書き換え」は logic 変更を指すものとする。

### 3.3 `waitUntil: 'domcontentloaded'` の安定性

staging では Cloudflare CDN cache miss 時に初回 TTFB が local より大きく、`domcontentloaded` 到達後も OAuth provider の async hydration が継続している可能性がある。oauth-loading state screenshot で button spinner 表示の race が起きやすい。

対処: oauth-loading state のみ `page.waitForSelector('[data-state="oauth-loading"]')` で明示待機する。`waitUntil: 'networkidle'` への切替は CDN 由来 long-tail request で timeout 化するため避ける。

### 3.4 学んだこと / 横展開メモ

- staging deploy 後の visual smoke は user-approval が必要 = Phase 11 evidence 内に閉じられない構造であり、followup 切り出しが正しい設計判断
- env-override 可能な evidence path は parallel-09 / task-18 / task-22 でも横展開候補
- production smoke は別 followup として独立化（dev → main リリース後）

---

## 4. 受入条件 (AC)

- **AC-1**: staging URL（`dev` 環境 Cloudflare Workers URL）に対し `pnpm --dir apps/web exec playwright test apps/web/playwright/tests/login-smoke.spec.ts --reporter=line` が 0 fail / 0 flaky で完走
- **AC-2**: staging evidence 6 PNG（idle / focused-email / oauth-loading / magic-link-sent / error / mobile-375）が staging 用 evidence dir に保存済み、各ファイルが non-empty かつ ≤ 500KB
- **AC-3**: local baseline 6 PNG との diff を目視レビューし、構造的回帰（要素欠落 / レイアウト崩れ / OKLch token 違反由来の色差）が無いことを確認
- **AC-4**: spec 内 evidence path が `process.env.PLAYWRIGHT_EVIDENCE_DIR` で env-override 可能になっており、local 既定値は従来通り
- **AC-5**: `docs/30-workflows/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` の FU-LOGIN-003 が consumed に更新
- **AC-6**: staging deploy は `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` 経由で user 承認後に実行された記録が followup §3 完了記録に残る
- **AC-7**: production smoke（`main` deploy 後）は別 followup として切り出され、本 followup には混入させない

---

## 5. 参照資料

- `docs/30-workflows/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` - FU-LOGIN-003 検知元
- `docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/main.md` - local visual evidence 設計
- `docs/30-workflows/unassigned-task/parallel-09-followup-001-playwright-visual-evidence-completion.md` - フォーマット参考 / ENOSPC リカバリ知見
- `apps/web/playwright/tests/login-smoke.spec.ts` - 再走対象 spec
- `apps/web/src/app/(auth)/login/page.tsx` - 対象 route 実装
- `apps/web/wrangler.toml` - staging / production env 定義
- CLAUDE.md「ブランチ戦略」セクション - `dev` = Cloudflare staging / `main` = production
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」 - `bash scripts/cf.sh deploy ...` 経由必須
- `docs/00-getting-started-manual/claude-design-prototype/` - プロトタイプ正本（不変条件3）
