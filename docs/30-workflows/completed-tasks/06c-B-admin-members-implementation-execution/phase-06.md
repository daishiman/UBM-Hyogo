[実装区分: 実装仕様書]

# Phase 6: 異常系検証 — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 6 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

401 / 403 / 404 / 409 / 422 / 5xx および audit 書込み失敗時の rollback、不正クエリ・極端ケースの動作を網羅し、Phase 4 のテストケースに過不足なく対応付ける。

## 実行タスク

1. 認可境界 401 / 403、存在確認 404、状態競合 409、validation 422 を endpoint ごとに確認する。
2. `q` 201 文字、tag 6 件以上、`page=0`、invalid `zone/sort/density` の異常系を確認する。
3. unknown tag code は validation error にせず、検索結果 0 件として扱うことを明記する。
4. delete / restore の二重実行と audit log append を確認する。

## failure case 一覧

| # | ケース | endpoint | 期待 | 検証層 |
| --- | --- | --- | --- | --- |
| F1 | 未ログイン（cookie なし） | GET /admin/members | 401 / `/admin/members` は login へ redirect | authz / contract |
| F2 | member ロールで admin endpoint | GET /admin/members | 403 | authz |
| F3 | 存在しない `memberId` を delete | POST /admin/members/:id/delete | 404 | contract |
| F4 | 既に deleted な対象を再 delete | POST /admin/members/:id/delete | 409 | contract |
| F5 | restore 対象が `is_deleted=false` | POST /admin/members/:id/restore | 409 | contract |
| F6 | role 変更系 endpoint への request | POST /admin/members/:id/role | 404 / 405（routing 不在） | contract |
| F7 | audit_log INSERT が失敗（DB 内蔵 rollback） | POST .../delete | 5xx + soft-delete も巻き戻る | contract |
| F8 | `sort=invalid` | GET /admin/members | 422 | contract |
| F9 | `density=invalid` / `zone=invalid` | GET /admin/members | 422 | contract |
| F10 | `q` 201 文字 | GET /admin/members | 422 | contract |
| F11 | `page=0` / 非整数 | GET /admin/members | 422 | contract |
| F12 | `page=99999` 過大 | GET /admin/members | 200 + `members=[]` | contract |
| F13 | `tag` 6 件以上指定 | GET /admin/members | 422（TAG_LIMIT=5 超過） | contract |
| F14 | delete に reason 欠落 / 501 文字超 | POST .../delete | 422 | contract |
| F15 | repeated tag 複数 | GET /admin/members?tag=a&tag=b | AND 動作 200 | contract |
| F16 | apps/web 側の 5xx 受領 | UI | error toast（aria-live="polite"） | E2E（08b）|

## audit 書込み失敗時の整合性

- `c.env.DB.batch([softDeleteStmt, auditAppendStmt])` を用い、いずれか失敗で全文 rollback される（D1 batch は同一 txn）
- handler は失敗時 `c.json({ error: "INTERNAL" }, 500)` を返却
- response 本文に SQL や stack trace を含めない
- 復旧手順: ユーザーは再操作で良い（idempotency は memberId + action で論理的に保証）

## エラー UI（apps/web）

- delete / restore の confirmation は `<dialog>` で focus trap
- 5xx 時は toast を `aria-live="polite"` で表示し、文言は「処理に失敗しました。時間をおいて再試行してください。」
- 検索の 422 はフォームインライン error（field 単位）
- 401 は middleware で login へ redirect

## 入出力・副作用

- 入力: 不正クエリ・存在しない id・既 deleted 対象・cookie 欠落
- 出力: 上記 status code とエラーペイロード `{ error: <CODE> }`
- 副作用: 失敗時に DB 状態は変化しない（batch rollback）。audit_log も書込まれない。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm vitest run apps/api/src/routes/admin/members.test.ts
mise exec -- pnpm vitest run apps/api/src/routes/admin/member-delete.test.ts
```

## DoD

- [ ] failure case F1〜F16 が Phase 4 のテストケースまたは E2E 引き渡し項目に紐付く
- [ ] audit 書込み失敗時の rollback が batch txn で保証される
- [ ] error UI が 09-ui-ux.md の a11y 要件と整合

## 参照資料

- `docs/00-getting-started-manual/specs/09-ui-ux.md`
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`

## 統合テスト連携

- 上流: Phase 5 runbook
- 下流: Phase 7 AC マトリクス / 08b admin members E2E

## 多角的チェック観点

- #11 admin も他人本文編集不可（更新系 422 で fail-fast）
- #13 audit 必須（失敗時は両方書込まれない）
- error UI が a11y / i18n に整合

## サブタスク管理

- [ ] failure case を全件記述する
- [ ] rollback 動作を仕様化する
- [ ] error UI 規定を確定する
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- `outputs/phase-06/main.md`

## 完了条件

- [ ] 401/403/404/409/422/5xx の境界を全件網羅
- [ ] audit 書込み失敗時の整合性が batch txn で説明できる

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装・deploy・commit・push・PR を行っていない
- [ ] CONST_005 必須項目が網羅されている

## 次 Phase への引き渡し

Phase 7 へ、failure case 一覧と検証層対応を渡す。
