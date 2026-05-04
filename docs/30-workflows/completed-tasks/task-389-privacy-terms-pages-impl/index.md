# task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| Issue | #389 (CLOSED 2026-05-03) ※ closed のままタスク仕様書化 |
| タスクID | task-05a-privacy-terms-pages-001 |
| 起票元 | `ut-05a-followup-google-oauth-completion` Phase 11 Stage B-1 |
| 発見元レポート | `outputs/phase-11/discovered-issues.md` `P11-PRD-004` |
| 既存暫定仕様 | `docs/30-workflows/unassigned-task/task-05a-privacy-terms-pages-001.md` |
| wave | follow-up |
| mode | sequential |
| owner | daishiman |
| 状態 | implemented-local / web build blocked by #385 regression |
| taskType | **implementation** |
| visualEvidence | VISUAL_ON_EXECUTION（staging/production HTTP 200 + consent screen screenshot） |
| 実装区分 | **[実装区分: 実装仕様書]** — `apps/web/app/{privacy,terms}/page.tsx` のコード変更（暫定 OAuth URL ready 文面 + metadata + 連絡先 + 改定日）と Cloudflare Workers deploy が目的達成に必須のため（CONST_004）。final legal wording と OAuth consent screen 設定は外部/承認 gate 後に別状態で記録する |

## 目的

1. staging / production の `/privacy` `/terms` を **HTTP 200** にし、Google OAuth verification (Stage B-2) の consent screen URL 要件を満たす
2. Phase 11 で実装した暫定文面を、OAuth verification URL 要件に必要な公開ページとして検証可能な暫定文面・metadata・連絡先・改定日付きに更新する
3. Google Cloud Console の OAuth consent screen に Privacy/Terms URL を設定する（production deploy 承認後）

## scope in / out

### Scope In
- `apps/web/app/privacy/page.tsx` の本文編集（暫定 OAuth URL ready 文面 + metadata + 連絡先 + 改定日）
- `apps/web/app/terms/page.tsx` の本文編集（暫定 OAuth URL ready 文面 + metadata + 連絡先 + 改定日）
- `apps/web` の local test / typecheck / build readiness
- staging / production deploy runbook と、ユーザー承認後の HTTP 200 evidence 取得
- Google OAuth consent screen の Privacy Policy URL / Terms of Service URL 設定確認 evidence 取得（production deploy 後）
- 軽量 semantic render test 追加（ページ render と必須セクション存在の保証）

### Scope Out
- Cookie banner / consent management UI
- 多言語対応
- Cloudflare KV / D1 を介した動的 CMS 化
- Auth.js / Hono API 側の変更

## dependencies

### Depends On
- #385 task-05a-build-prerender-failure-001（`useContext null` build 失敗の解消） — GitHub Issue は 2026-05-02 に CLOSED だが、2026-05-03 の `pnpm --filter @ubm-hyogo/web build` 実測で再発。deploy は blocked。
- 1Password に格納済の `CLOUDFLARE_API_TOKEN`（`scripts/cf.sh` 経由で注入）
- 法務レビュー完了（オフライン対応 — CONST_007 例外として "本番文面確定" は別 PR 切り出し可）

### Blocks
- Google OAuth verification Stage B-2 申請

## 既存実装の状態

`apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx` は Phase 11 で**暫定文面**として実装済（6 セクション構成）。本タスクで:
- metadata canonical / robots、Google Form 連絡先、制定日・最終改定日を実コードへ反映
- semantic page tests を追加
- staging / production deploy と consent screen URL 設定はユーザー承認後の runtime evidence として分離

## phases

| Phase | 目的 | 主要成果物 |
| --- | --- | --- |
| 01 | 要件・制約・受け入れ条件の固定 | `outputs/phase-01/main.md` |
| 02 | 設計（ページ構造・metadata・SEO） | `outputs/phase-02/main.md` |
| 03 | 実装範囲・対象ファイル俯瞰 | `outputs/phase-03/main.md` |
| 04 | テスト戦略（semantic render test + HTTP smoke） | `outputs/phase-04/main.md` |
| 05 | 実装ランブック（コード差分 + deploy 手順） | `outputs/phase-05/main.md` |
| 06 | 法務レビュー反映フロー | `outputs/phase-06/main.md` |
| 07 | gate / quality check 定義 | `outputs/phase-07/main.md` |
| 08 | rollback 手順 | `outputs/phase-08/main.md` |
| 09 | observability / 監視 | `outputs/phase-09/main.md` |
| 10 | release readiness check | `outputs/phase-10/main.md` |
| 11 | 実測 evidence 収集 (HTTP 200 + consent URL screenshot) | `outputs/phase-11/main.md`, `manual-smoke-log.md` |
| 12 | implementation guide / system spec / unassigned / skill-feedback / compliance | `outputs/phase-12/*` (7 files) |
| 13 | PR 作成（ユーザー承認後） | `outputs/phase-13/main.md` |

## 受け入れ条件 (Issue #389 準拠)

- staging `/privacy` `/terms` が HTTP 200
- production `/privacy` `/terms` が HTTP 200
- 最小 deploy DoD: staging / production `/privacy` `/terms` が HTTP 200 を返し、metadata / 改定日 / 連絡先 / 必須セクションが local test で保証されている
- final legal DoD: 法務確認済みの本番文面が deploy されている
- OAuth DoD: Google OAuth consent screen の Privacy Policy URL / Terms URL に production URL が設定されている
