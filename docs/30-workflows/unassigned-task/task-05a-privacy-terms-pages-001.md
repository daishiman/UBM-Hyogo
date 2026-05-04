# 05a follow-up: /privacy /terms 静的ページ実装（Google OAuth verification 必須）

## メタ情報

```yaml
issue_number: 389
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-05a-privacy-terms-pages-001 |
| タスク名 | `/privacy` `/terms` ページの実装と本番文面確定 |
| 分類 | implementation / legal |
| 対象機能 | apps/web 公開ページ |
| 優先度 | High |
| ステータス | 暫定実装済（local 未 deploy） — 本番文面要レビュー |
| 発見元 | `ut-05a-followup-google-oauth-completion` Phase 11 Stage B-1 |
| 発見日 | 2026-05-01 |
| 前提 | `task-05a-build-prerender-failure-001` 完了 |

## 背景

staging / production の `/privacy` / `/terms` が **404**（`apps/web/app/` 配下に `.tsx` 未実装）。Google OAuth verification (Stage B-2) では consent screen に Privacy Policy URL / Terms URL の要件があり、404 状態では verification 申請不可。

local には Phase 11 で 2026-05-01 時点の暫定文面（取得情報・利用目的・第三者提供・管理・開示/訂正/削除・改定 / 利用規約 6 セクション）を実装済だが、build 失敗 (P11-PRD-002) のため deploy できていない。

## 目的

1. `/privacy` `/terms` の URL が 200 を返し、Google OAuth verification 要件を満たす状態にする
2. 暫定文面を法務確認の上で本番文面に置き換える

## スコープ

含む:

- `apps/web/app/privacy/page.tsx` の実装と deploy（**暫定文面は実装済**）
- `apps/web/app/terms/page.tsx` の実装と deploy（**暫定文面は実装済**）
- 本番文面の法務レビュー / 確定 / 反映
- staging / production で 200 evidence 取得
- Google OAuth consent screen の Privacy / Terms URL 設定確認

含まない:

- Cookie banner / consent management UI
- 多言語対応

## 受け入れ条件

- staging `/privacy` `/terms` が 200
- production `/privacy` `/terms` が 200
- 法務確認済みの本番文面が deploy されている
- Google OAuth consent screen の Privacy Policy URL / Terms URL に上記が設定されている

## 関連

- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-004`
- 前提タスク: `task-05a-build-prerender-failure-001`

## 苦戦箇所【記入必須】

- 対象:
  - `apps/web/app/privacy/page.tsx`（暫定文面で実装済 / deploy 不可）
  - `apps/web/app/terms/page.tsx`（暫定文面で実装済 / deploy 不可）
- 症状: 暫定文面はローカルに実装済だが、`task-05a-build-prerender-failure-001` の build 失敗 (`useContext` null) が解消するまで staging / production に反映できず、staging / production の `/privacy` `/terms` は 404 のまま。Google OAuth verification の consent screen URL 要件（Privacy Policy URL / Terms URL）を満たせない。本番文面は法務レビュー pending（未確定）
- 参照:
  - `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-004`
  - 前提タスク: `task-05a-build-prerender-failure-001`
  - GitHub Issue #389

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 暫定文面のまま production deploy され、法的記載要件に不足が残る | 本番文面確定までは「暫定」と明記し、法務レビュー完了後に置換 PR を出す運用とする |
| build-prerender-failure-001 が長期化し OAuth verification 申請が遅延 | 暫定でも 200 を返せれば verification 申請は可能。build 修正タスクを最優先で進める |
| Google OAuth consent screen の URL 設定漏れ | deploy 後に Google Cloud Console 上で Privacy / Terms URL を更新し、設定 screenshot を evidence として保存 |
| 法務レビュー指摘で文面が大幅変更となる | レビュー指摘は別 PR として切り出し、deploy と切り離して反映できる構成にする |

## 検証方法

- 実行コマンド:
  - `mise exec -- pnpm --filter web build`（前提タスク解消後）
  - `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/privacy`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/terms`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<production>/privacy`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<production>/terms`
- 期待結果:
  - staging / production それぞれの `/privacy` `/terms` が 200
  - 法務確認済みの本番文面が deploy されている
  - Google OAuth consent screen の Privacy / Terms URL に上記 URL が設定されている
- 失敗時の切り分け:
  1. 404 が継続 → build artifact に `app/privacy/page.tsx` `app/terms/page.tsx` が含まれているか `.open-next` を確認
  2. build が失敗 → `task-05a-build-prerender-failure-001` の状態を確認し、未解消であれば本タスクは blocked
  3. consent screen に反映されない → Google Cloud Console の OAuth consent screen 編集ステータスを確認
