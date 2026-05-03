# Phase 11: 手動 smoke / 実測 evidence — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

`visualEvidence: VISUAL_ON_EXECUTION` のため、本 phase 仕様書は手順と evidence path / template を
正本化し、実環境 smoke 自体は user gate 後の実行とする（spec 段階では `pending_user_approval`）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 11 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 上流 | 03b / 04c / 02a |
| 下流 | 公開ディレクトリ重複解消運用 / 04c admin E2E |

## 目的

screenshot / curl / wrangler tail / a11y / PII 検査の evidence path、取得手順、合否基準を確定する。
実行は user gate 後のみ。

## 実行タスク

1. 候補一覧 / merge 確認モーダル / 完了画面の screenshot を取得
2. curl で 200 / 400 / 403 / 409 / 500 を確認
3. `wrangler tail` で `identity_merge_audit` / `audit_log` insert ログを確認
4. axe-core で a11y scan
5. screenshot 内 PII 漏洩目視確認

## 参照資料

- `phase-05.md`（実装ランブック）
- `phase-06.md`（異常系）
- 実装: `apps/api/src/routes/admin/identity-conflicts.ts`
- 実装: `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`

## 実環境 smoke 実行手順

1. `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev` で 0010-0012 を staging に適用
2. seed: `EMAIL_CONFLICT` を意図的に発生させる二重回答を投入
3. admin cookie で `/admin/identity-conflicts` を開き、screenshot 3 枚取得
4. 下記 curl matrix を実行し HTTP status と body を `outputs/phase-11/curl-results.md` に保存
5. `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env dev` を別 terminal で起動し insert を確認
6. axe-core を `/admin/identity-conflicts` に対して実行し結果を保存
7. 全 screenshot を目視確認し PII（フル responseEmail）が映っていないことを確認

## curl matrix

| 期待 status | コマンド要旨 | 検証ポイント |
| --- | --- | --- |
| 200 (list) | `curl -b cookie.txt $API/admin/identity-conflicts` | masked email / pagination cursor |
| 200 (merge) | `curl -X POST -b cookie.txt -H 'Content-Type: application/json' -d '{"targetMemberId":"...","reason":"same person re-submitted"}' $API/admin/identity-conflicts/<id>/merge` | `archivedSourceMemberId` / `auditId` 返却 |
| 403 | non-admin cookie | fail closed |
| 400 | reason 欠落 / self-reference | バリデーション |
| 409 | 二重 dismiss / 既 merge 済 | UNIQUE / `MergeConflictAlreadyApplied` |
| 500 | DB 切断 | rollback |

## evidence 保存先（VISUAL_ON_EXECUTION）

| 項目 | path |
| --- | --- |
| 候補一覧 screenshot | `outputs/phase-11/admin-identity-conflicts-list.png` |
| merge 確認モーダル | `outputs/phase-11/admin-identity-merge-confirm.png` |
| merge 完了 | `outputs/phase-11/admin-identity-merge-success.png` |
| curl 結果 | `outputs/phase-11/curl-results.md` |
| wrangler tail 抜粋 | `outputs/phase-11/wrangler-tail.log` |
| a11y scan | `outputs/phase-11/axe-result.json` |
| 手動 log | `outputs/phase-11/manual-smoke-log.md` |
| link 確認 | `outputs/phase-11/link-checklist.md` |

## 多角的チェック観点

- 不変条件 #3 / #11 / #13
- screenshot に PII（responseEmail 全体）が映り込まないこと
- `wrangler tail` で `identity_aliases` / `identity_merge_audit` / `audit_log` の三重 insert を確認

## サブタスク管理

- [ ] migration を staging に適用
- [ ] seed → screenshot 取得
- [ ] curl matrix 実行と結果保存
- [ ] wrangler tail で insert 確認
- [ ] axe-core で a11y scan
- [ ] PII 目視確認
- [ ] outputs/phase-11/main.md に PASS/FAIL 記録

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
- 実行時のみ: 上記 evidence 保存先一式

## 完了条件

- 全 manual evidence が evidence path に配置済み
- PII 漏洩なし、a11y violation 0 critical
- audit insert 確認済み

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] spec 段階では実環境操作を行わない（user gate 後）
- [ ] commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ、evidence 一覧、PII 検査結果、approval gate を渡す。
