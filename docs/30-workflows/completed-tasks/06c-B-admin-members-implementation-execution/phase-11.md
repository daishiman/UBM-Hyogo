[実装区分: 実装仕様書]

# Phase 11: 手動 smoke / 実測 evidence — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 11 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

実装後の手動 smoke と evidence 取得手順、および screenshot 3 枚の取得手順とパスを定義する。

## 実行タスク

1. 本 workflow 内では VISUAL_ON_EXECUTION の runtime evidence contract を実体化し、staging screenshot を実測 PASS として扱わない。
2. `manual-smoke-log.md` に user approval / staging fixture 待ちの境界を記録する。
3. `link-checklist.md` に Phase 11 evidence path と downstream 08b / 09a handoff を記録する。
4. 実測 screenshot は 08b admin E2E / 09a staging smoke の承認後に取得する。

## 前提条件（staging credentials）

- Cloudflare staging 環境に admin role の test user が seed されている
- staging URL: `https://staging.<project>.workers.dev/admin/members`
- credentials は 1Password 経由で取得（`op://Staging/admin-test-user`）。仕様書・ログ・PR 本文への転記禁止
- seed/sanitized fixture のみ使用、production には触れない

## screenshot 取得対象

| # | path（必須） | 取得タイミング |
| --- | --- | --- |
| S1 | `outputs/phase-11/screenshots/admin-members-list.png` | 一覧 + 検索結果（zone=0_to_1, sort=name, density=dense） |
| S2 | `outputs/phase-11/screenshots/admin-members-detail.png` | drawer 詳細（audit log 表示状態） |
| S3 | `outputs/phase-11/screenshots/admin-members-delete.png` | delete confirmation dialog（reason input フォーカス時） |

## evidence path（curl / D1 / wrangler tail）

| 種別 | path |
| --- | --- |
| curl GET list | `outputs/phase-11/curl/admin-members-list.txt` |
| curl GET detail | `outputs/phase-11/curl/admin-members-detail.txt` |
| curl POST delete | `outputs/phase-11/curl/admin-members-delete.txt` |
| curl POST restore | `outputs/phase-11/curl/admin-members-restore.txt` |
| wrangler tail | `outputs/phase-11/wrangler-tail.txt` |
| audit_log SELECT | `outputs/phase-11/d1/audit-log.txt` |
| redaction checklist | `outputs/phase-11/redaction-checklist.md` |

## smoke 手順（再現可能）

1. staging に admin test user で login し、`/admin/members` に到達する。
2. 検索条件（filter=published, q=Test, zone=0_to_1, tag=tag_a, sort=name, density=dense, page=1）を順次適用し、結果が変化することを確認 → S1 取得。
3. 任意の会員を click → drawer 詳細を開き、audit log が時刻降順で表示されることを確認 → S2 取得。
4. delete ボタンで confirmation dialog を開き、reason input にフォーカス → S3 取得。reason 入力後 OK で delete 実行。
5. `filter=deleted` を指定すると当該会員が表示され、デフォルトでは表示されないことを確認。
6. restore 実行 → 通常 list に戻ることを確認。
7. `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT actor, target, action, created_at FROM audit_log WHERE target=? ORDER BY created_at DESC LIMIT 5"` で audit_log に delete / restore 行が追記されていることを確認 → `audit-log.txt` に保存。
8. role 変更 UI/API が存在しないことを確認（routing と画面の両方）。
9. member ロール cookie に切替え → 403 を確認。
10. cookie を破棄 → 401 / login redirect を確認。

## redaction（PII 除去）チェックリスト

- [ ] screenshot に実会員の name / email が映っていない（seed fixture のみ）
- [ ] curl 出力から `Authorization` / `Cookie` header を削除した
- [ ] D1 SELECT は `actor / target / action / created_at` のみ、`before_json` / `after_json` は出力しない
- [ ] wrangler tail のログから secret / cookie 値を削除した

## 入出力・副作用

- 入力: Phase 5 実装結果、staging 環境
- 出力: screenshot 3 枚 + curl/D1/wrangler-tail evidence
- 副作用: staging 環境の test fixture を delete / restore する（後で復旧）

## DoD

- [ ] S1 / S2 / S3 の 3 枚が指定 path に存在
- [ ] curl / d1 / wrangler-tail evidence が揃う
- [ ] redaction checklist が完了
- [ ] smoke 手順 1〜10 が再現可能

## 参照資料

- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`

## 統合テスト連携

- 上流: Phase 10 GO 判定
- 下流: 09a admin staging smoke / Phase 12 ドキュメント更新

## 多角的チェック観点

- screenshot は seed/sanitized fixture のみで実会員 name / email が映り込まない
- curl 出力に Authorization header を残さない
- D1 SELECT は actor/target/action/timestamp のみ、before/after JSON は出力しない
- evidence は staging 環境のものを使用、production は触らない

## サブタスク管理

- [ ] staging admin test user が seed されていることを確認
- [ ] smoke 手順 1〜10 を実行
- [ ] S1 / S2 / S3 を取得
- [ ] curl / d1 / wrangler-tail evidence を保存
- [ ] redaction checklist を実行
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/screenshots/admin-members-list.png`
- `outputs/phase-11/screenshots/admin-members-detail.png`
- `outputs/phase-11/screenshots/admin-members-delete.png`
- `outputs/phase-11/curl/*.txt`
- `outputs/phase-11/d1/audit-log.txt`
- `outputs/phase-11/wrangler-tail.txt`
- `outputs/phase-11/redaction-checklist.md`

## 完了条件

- [ ] evidence path がすべて埋まっている
- [ ] smoke 手順が再現可能
- [ ] redaction が完了している

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] production を触っていない
- [ ] CONST_005 必須項目が網羅されている

## 次 Phase への引き渡し

Phase 12 へ、evidence path と smoke 結果を渡す。
