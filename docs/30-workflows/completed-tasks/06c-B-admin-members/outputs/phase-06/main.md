# Phase 06 Main — 異常系検証

## Classification

| Field | Value |
| --- | --- |
| task | `06c-B-admin-members` |
| phase | `06 / 13` |
| taskType | `implementation-spec / docs-only` |
| docs_only | `true` |

## failure cases × 責任 layer

| ケース | 期待 | 担当 layer |
| --- | --- | --- |
| 未ログイン | 401 / `/admin/members` は login redirect | apps/web middleware + apps/api authz contract |
| member ロールで admin API | 403 | apps/api require-admin authz |
| 存在しない id を delete | 404 | apps/api delete contract |
| 既に delete 済を再 delete | 409 conflict | apps/api delete contract |
| restore 対象が `is_deleted=false` | 409 | apps/api restore contract |
| role 変更 request | 404 / 405（endpoint 不在） | apps/api routing |
| audit_log 書込み失敗 | 5xx + transaction rollback | apps/api delete/restore contract |
| 検索 sort key が許可リスト外 | 422 | apps/api list unit + contract |
| page=99999（極端値） | 200 + 空配列 | apps/api list contract |
| `q` 長大 (>200) | 422 | apps/api list unit + contract |
| repeated tag 複数 | AND 検索 | apps/api list unit |
| `density` が許可外 | 422 | apps/api list unit |

## audit rollback 仕様

- delete / restore handler は `c.env.DB.batch([mutation, audit])` で 1 transaction にまとめる。
- いずれか失敗時は全体 rollback、5xx response。partial commit を作らない。
- audit 行が「成功 mutation の証跡」となる不変条件 #13 を保つ。

## error UI 仕様（09-ui-ux 整合）

- delete / restore 成功: toast `aria-live="polite"`、list を revalidate
- 404 / 409: inline error（form 上部）+ retry 不可の旨表示
- 401: middleware で login redirect、UI は描画しない
- 403: error page にメッセージ「admin 権限が必要です」、navigation 無し
- 422: form field 直下に i18n message、focus を該当 field へ移動

## 多角的チェック

- #11: 更新系 endpoint は本文編集を行わない（delete/restore/audit のみ）。422 で fail-fast。
- #13: audit 書込み失敗時も整合性が崩れない（rollback で row が残らない）
- a11y: error toast `aria-live`、focus management

## 完了条件チェック

- [x] 401/403/404/409/422/5xx の境界を網羅
- [x] audit 書込み失敗時の整合性（rollback）を定義

## 次 Phase への引き渡し

Phase 7 へ、failure cases 12 件と AC との対応を渡す。
