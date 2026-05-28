# admin meetings staging ADMIN_FETCH_404 runtime follow-up

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-meetings-staging-admin-fetch-404-runtime-followup |
| タスク名 | staging `/admin/meetings` の `ADMIN_FETCH_404` runtime 原因調査 |
| 分類 | Runtime Evidence / Auth Session Investigation |
| 対象機能 | staging admin meetings runtime |
| 優先度 | 中 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/admin-meetings-prototype-alignment/outputs/phase-1/phase-1.md` |
| 発見日 | 2026-05-27 |
| GitHub Issue | [#976](https://github.com/daishiman/UBM-Hyogo/issues/976) |

## 1. なぜ必要か

`admin-meetings-prototype-alignment` の要件整理中に、staging `/admin/meetings` で `ADMIN_FETCH_404` が観測された。今回の UI prototype alignment は API surface / D1 schema を変更しないため、同サイクルで原因確定まで扱うと UI 整流と auth/session runtime 調査が混ざる。

## 2. スコープ

含む:

- staging `/admin/meetings` と `/admin/meetings/:id` の authenticated request を再実行する
- `safeServerFetch` の upstream path、admin proxy、session/auth gate、staging env binding を切り分ける
- `ADMIN_FETCH_404` が再現する場合は request URL、response status、Cloudflare tail、auth state を evidence 化する

含まない:

- admin meetings UI の primitive 再設計
- D1 schema 変更
- user approval なしの deploy / secret mutation

## 3. 受け入れ基準

| ID | 内容 |
| --- | --- |
| AC-1 | staging authenticated `/admin/meetings` の HTTP status と画面状態を記録する |
| AC-2 | `ADMIN_FETCH_404` の upstream route / auth / env のどれが原因か分類する |
| AC-3 | 修正が必要な場合は実コードまたは env 手順を特定し、Phase 11 runtime evidence を保存する |
| AC-4 | commit / push / PR / staging deploy はユーザー承認後に実行する |

## 4. 参照

- `docs/30-workflows/completed-tasks/admin-meetings-prototype-alignment/outputs/phase-1/phase-1.md`
- `docs/30-workflows/completed-tasks/admin-meetings-prototype-alignment/outputs/phase-11/discovered-issues.md`
- `apps/web/src/lib/admin/safe-server-fetch.ts`
