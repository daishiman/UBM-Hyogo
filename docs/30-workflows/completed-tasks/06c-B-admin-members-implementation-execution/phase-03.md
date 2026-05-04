[実装区分: 実装仕様書]
> 根拠: docs-only ラベルだが、目的達成に `apps/api` / `apps/web` / `packages/shared` の実コード変更が必要なため、CONST_004 例外として実装仕様書扱いとする。

# Phase 3: 設計レビュー — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 3 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 2 の設計を 3 つ以上の代替案と比較し、不変条件・運用性・CONST_005 必須項目で PASS / MINOR / MAJOR を判定する。blocker と未解決リスクを Phase 4 に渡す。

## 実行タスク

1. Phase 2 の採用案を、D1 直参照案、client-side filter 案、別 worker BFF 案と比較し、不変条件違反の有無を確認する。
2. `completed-tasks/06c-B-admin-members` との重複・矛盾を確認し、本 workflow の責務を runtime evidence contract に絞る。
3. `tag` unknown は tag code AND の検索条件として扱い、該当なしなら 200 + 0 件、tag 件数超過は 422 に統一する。
4. `pageSize` は API 入力として採用せず、出力専用の固定値 50 とする。

## 代替案比較

| 案 | 概要 | 採否 | 判定 | 理由 |
| --- | --- | --- | --- | --- |
| A: apps/web から D1 直参照 | RSC で D1 binding を直接呼ぶ | 却下 | MAJOR | 不変条件 #5 違反 |
| B: apps/api 経由 + cookie forwarding（採用） | 06b-A session resolver を再利用 | 採用 | PASS | 不変条件 #5 / #13 を満たす |
| C: admin 専用 BFF を別 worker で建てる | 新 worker を追加 | 却下 | MAJOR | 無料枠と運用負担、deploy 単位増 |
| D: 検索を client-side filter で擬似実装 | 全件取得後 JS でフィルタ | 却下 | MAJOR | 性能・無料枠・12-search-tags 不整合 |
| E: delete を物理削除で代替 | DELETE で row を消す | 却下 | MAJOR | 07-edit-delete 不整合・復元不可・監査不能 |
| F: query parser を `apps/api` ローカルに留める | shared 抽出しない | 却下 | MINOR | apps/web の URL→API 変換で重複が発生、shared 抽出が DRY |
| G: SQL を ORM 化 | Drizzle/Prisma 化 | 却下 | MINOR | スコープ拡大、現在の D1 prepared statement で十分、別タスク化が妥当 |

## CONST_005 必須項目チェック

| 項目 | 状態 | 備考 |
| --- | --- | --- |
| 目的の SRP | PASS | 「admin members 残実装の実コード接続」に集中 |
| API 契約 | PASS | 4 endpoint の I/O・異常系を Phase 2 で確定 |
| 認可境界 | PASS | 401 / 403 / 404 / 409 / 422 を網羅 |
| 不変条件適合 | PASS | #4 / #5 / #11 / #13 を充足 |
| 監査要件 | PASS | `auditAppend()` で actor / target / action / before / after を記録 |
| 評価可能 AC | PASS | index.md AC が test / typecheck / lint / evidence で検証可能 |
| 依存整合性 | PASS | Depends/Blocks が 06c-A / 06b-A / 07 / 12 / 08b-A / 09a と整合 |
| Visual evidence | PASS | Phase 11 で 3 枚の screenshot path を固定 |
| 自走禁止操作の分離 | PASS | commit / push / PR / staging deploy を Phase 13 + ユーザー指示で gate |
| Secret 漏洩防止 | PASS | production secret 値を仕様書・コードに転記しない方針を明記 |

## 不変条件チェック

| ID | 内容 | 設計上の担保 |
| --- | --- | --- |
| #4 | 本文編集禁止 | 本タスクで本文編集 endpoint・UI を追加しない |
| #5 | apps/web D1 直アクセス禁止 | RSC は `fetchAdmin` 経由のみ、direct binding 利用なし |
| #11 | admin も他人本文編集不可 | drawer に編集 UI を持たない |
| #13 | admin 操作の audit log 必須 | delete / restore で `auditAppend()` を必ず呼ぶ |

## 依存整合性チェック

- 06c-A admin dashboard が admin shell を提供 → 本タスクは layout を再利用（変更不要）
- 06b-A session resolver が admin role を提供 → `requireAdmin` で参照
- 07-edit-delete API のポリシーと delete/restore の挙動が整合
- 12-search-tags の query 語彙（`zone`, repeated `tag`, `sort`, `density`, `page`）と整合
- 08b-A playwright admin E2E が本タスクの URL state / drawer 挙動を前提にできる
- 09a staging smoke が `GET /api/admin/members` の 401/403 を確認できる

## blocker / 未解決リスク

| リスク | 対応 |
| --- | --- |
| `pageSize` を query で渡された場合の挙動 | Phase 4 テスト戦略で「無視」または「422」のいずれかを test 化して固定する |
| `tag` 未知 code の扱い | 0 件結果（422 ではない）として Phase 4 で test 固定 |
| `auditAppend()` の before/after フォーマット差異 | 既存 audit row を読み合わせ、shape を Phase 5 ランブックで確定 |
| `MemberDrawer` の既存実装が想定と乖離する場合 | Phase 5 ランブック先頭で実コード差分確認を必須化 |
| Phase 11 の evidence 取得環境（localhost / preview） | Phase 11 で D1 seed と admin user の準備手順を runbook 化 |

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- apps/api/src/middleware/require-admin.ts
- docs/30-workflows/completed-tasks/06c-B-admin-members/outputs/phase-12/implementation-guide.md

## 実行手順

- 対象 directory: docs/30-workflows/06c-B-admin-members-implementation-execution/
- 本仕様書作成では実装、deploy、commit、push、PR を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 2 設計
- 下流: Phase 4 テスト戦略

## 多角的チェック観点

- #4 / #5 / #11 / #13 の不変条件への適合
- 認可境界（admin / member / guest）の網羅
- 12-search-tags のクエリ仕様と整合
- 07-edit-delete の論理削除/復元ポリシーと整合
- SQL injection 対策（prepared statement, LIKE escape）
- URL state とブラウザ history の整合

## サブタスク管理

- [ ] 代替案を 3 案以上記録する
- [ ] CONST_005 項目で PASS-MINOR-MAJOR を判定する
- [ ] 不変条件チェックを記録する
- [ ] 依存整合性を確認する
- [ ] blocker を Phase 4 に渡す
- [ ] outputs/phase-03/main.md を作成する

## 成果物

- outputs/phase-03/main.md

## 完了条件

- [ ] 採用案 B が PASS、却下案の MAJOR 理由が不変条件で説明される
- [ ] 12-search-tags / 07-edit-delete に整合する案のみが採用されている
- [ ] CONST_005 必須項目すべて PASS
- [ ] blocker と未解決リスクが Phase 4 引き渡し可能な粒度

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ、採用案 B、blocker、未解決リスク、test 対象 endpoint・関数、CONST_005 PASS evidence を渡す。
