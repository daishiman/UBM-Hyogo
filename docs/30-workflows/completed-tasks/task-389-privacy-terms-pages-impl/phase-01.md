# Phase 1: 要件定義 — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 1 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Issue #389 の受け入れ条件・前提・blocker を確定し、本仕様書全体の Definition of Done を固定する。

## 受け入れ条件 (AC)

| ID | 条件 | evidence path |
| --- | --- | --- |
| AC-1 | staging `/privacy` が HTTP 200 を返す | `outputs/phase-11/manual-smoke-log.md` |
| AC-2 | staging `/terms` が HTTP 200 を返す | `outputs/phase-11/manual-smoke-log.md` |
| AC-3 | production `/privacy` が HTTP 200 を返す | `outputs/phase-11/manual-smoke-log.md` |
| AC-4 | production `/terms` が HTTP 200 を返す | `outputs/phase-11/manual-smoke-log.md` |
| AC-5 | local code に metadata / 改定日 / Google Form 連絡先 / 必須セクションが実装されている | `apps/web/app/{privacy,terms}/__tests__/page.test.tsx` |
| AC-6 | Google OAuth consent screen に Privacy / Terms URL が登録されている | `outputs/phase-11/consent-screen-screenshot.png` |
| AC-7 | semantic render test がページ必須セクションを保証する | `apps/web/app/privacy/__tests__/page.test.tsx` / `apps/web/app/terms/__tests__/page.test.tsx` |

## 前提 / blocker

- **#385 task-05a-build-prerender-failure-001 は 2026-05-02 CLOSED 確認済み**。再発時のみ deploy gate を blocked に戻す。
- 法務レビューは外部依存。暫定文面でも OAuth URL 可用性のための deploy は許容するが、final legal DoD は `outputs/phase-11/legal-review-note.md` で別状態として管理する。
- Cloudflare API Token は 1Password 経由で `bash scripts/cf.sh` ラッパで注入する（CLAUDE.md ルール）。

## scope 確認

| 観点 | 内容 |
| --- | --- |
| 対象機能 | apps/web 公開ページ `/privacy` `/terms` |
| 影響範囲 | Cloudflare Workers (apps/web) のみ。apps/api / D1 に影響なし |
| 不変条件 | CLAUDE.md `5. D1 直アクセス禁止` に抵触しない（純粋な静的ページ） |

## 自走禁止ゲート

- Phase 13 の `gh pr create` は**ユーザー明示承認後のみ**
- production deploy（`bash scripts/cf.sh deploy --env production`）はユーザー承認後のみ

## 完了条件

- [ ] AC 一覧と evidence path の対応が明示されている
- [ ] blocker (#385) の状態が記録されている
- [ ] `outputs/phase-01/main.md` を作成する

## 統合テスト連携

- Focused test: `mise exec -- pnpm --filter @ubm-hyogo/web test -- privacy terms`
- Coverage: 静的 App Router page の semantic render test で保証する。`coverage-guard.sh` は既存 coverage 対象が `apps/**/src` 中心のため本タスクでは例外扱い。
