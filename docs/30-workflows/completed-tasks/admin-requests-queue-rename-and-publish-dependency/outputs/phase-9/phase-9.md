# Phase 9 — 品質保証

`[実装区分: 実装仕様書]` / taskType: implementation / visualEvidence: VISUAL / workflow_state: implemented_local_evidence_captured

> 正本は [_shared-context.md](../../_shared-context.md)（§8 検証コマンド / §10 不変条件）。本 Phase は静的解析・セキュリティ・性能・リグレッションの 4 観点で品質ゲートを確定する。本サイクルでローカル品質ゲートを実行済み。staging runtime と PR close-out のみ user-gated とする。

---

## 9.1 静的解析

| 項目 | コマンド | 合格基準 |
| --- | --- | --- |
| 型チェック（api） | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | エラー 0 |
| 型チェック（web） | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | エラー 0 |
| Lint | `mise exec -- pnpm lint` | 違反 0（`pnpm lint --fix` 後の残違反 0）|
| OKLch トークン gate | `mise exec -- pnpm verify:tokens` | PASS（`scripts/verify-design-tokens.ts`）|
| HEX 直書き grep gate | `rg -n "bg-\[#\|text-\[#\|#[0-9a-fA-F]{6}" apps/web/src/components/admin` | **0 件** |

> 型同期の必須確認: `pendingRequestTypes` を (1) `apps/api` の `MemberListRow`（`pending_request_types_json: string \| null`）、(2) `AdminMemberListViewZ`（`z.array(z.enum([...])).default([])`）、(3) web 側再宣言 zod / adapter / 行型、の 3 層すべてに通したか typecheck で機械検証する。1 層でも欠けると web typecheck が落ちる設計にする（adapter で参照する）。

---

## 9.2 セキュリティ

| 観点 | 検証内容 | 手段 |
| --- | --- | --- |
| **PII を新たに露出しない** | 会員一覧 API に追加するのは `pendingRequestTypes`（`note_type` の配列＝`visibility_request`/`delete_request` のみ）。**申請本文 `body`（reason / payload）は一覧 projection に載せない**。email / phone / 住所等の PII を新規に list へ追加しない。 | members.ts の projection 差分レビュー + members.contract.spec で list item の key 集合に `body`/`reason`/PII が含まれないことを assert。相関サブクエリは `json_group_array(DISTINCT amn.note_type)` のみを select し `amn.body` を参照しない。 |
| **admin gate 認証の維持** | `/members`（一覧）・`/admin/requests`（申請）双方が既存の admin gate（`AdminGateEnv` / `require-admin` ミドルウェア）の背後にあり続けること。projection 拡張で認証境界を緩めない。 | `members.ts` / `requests.ts` の route が `_shared.ts` の `AdminRouteEnv`（admin-gate + require-admin）配下のまま不変であることをレビュー + 既存 contract spec（未認証 401/403）が GREEN。 |
| **seed の権限境界** | seed は `created_by`/`updated_by` = `seed:test-accounts` 明示で cleanup 対象を限定。production への seed 投入は `scripts/seed-test-accounts.sh` が拒否（staging のみ）。 | スクリプト既存ガード（production 拒否）を変更しない。cleanup に `note_id LIKE 'TEST-NOTE-%'` を含め本番データに触れない。 |
| **入力検証** | `parsePendingRequestTypes` は未知 note_type を除外し既知 enum のみ通す（Phase 7 §7.3 #9, #10）。`AdminMemberListViewZ` の `z.enum` が API→web 境界で enum 外値を reject。 | contract spec の不正入力分岐。 |

> **不変条件**: `apps/web` から D1 への直接アクセスはしない（API 経由のみ）。バッジは API レスポンスの `pendingRequestTypes` を読むだけで、web から D1/admin_member_notes を直接照会しない。

---

## 9.3 性能

| 観点 | 検証内容 | 合格基準 |
| --- | --- | --- |
| **N+1 を増やさない** | pending 申請種別は `tags_json` と**同型の相関サブクエリ 1 本**（`json_group_array(DISTINCT amn.note_type)`）を会員一覧 SELECT 内に追加する。member ごとの追加クエリ（ループ内 await）を発生させない。 | members.ts の list クエリが member 配列に対し **1 回の SQL 実行**で完結すること（既存 tags_json と同じクエリ内）。レビューで「ループ内 DB アクセスなし」を確認。 |
| **index が効く** | pending 申請の絞り込み（`note_type IN (...) AND request_status='pending' AND member_id=...`）が `idx_admin_notes_pending_requests` でカバーされること。 | migration（`0007_admin_member_notes_request_status.sql` 系）に該当 index が存在することを Read 確認。サブクエリの WHERE 列順が index と整合。不在なら index 追加ではなく既存 index 活用（D1 schema 変更は不可＝§10）。 |
| **DISTINCT 集約の互換** | SQLite/D1 は集約関数内 `DISTINCT` をサポート（`json_group_array(DISTINCT ...)`）。 | fakeD1 contract spec で複数 pending（重複 note_type）が dedup されることを assert。 |

> index 確認手順: `rg -n "idx_admin_notes_pending\|admin_member_notes.*request_status\|CREATE INDEX.*admin_member_notes" apps/api/migrations/`。index が `request_status` を含むことを確認。**新規 index 追加は D1 schema 変更にあたり禁止**（§10）。既存 index で N+1 が増えないことのみ担保する。

---

## 9.4 リグレッション（AC-4 不変確認）

命名変更は人間可読テキスト + `aria-label` のみ。以下の grep で内部識別子が不変であることを機械確認する。

| 不変対象 | 確認 grep（変更前後で結果が同一であること） |
| --- | --- |
| ルートパス | `rg -n "/admin/requests" apps/web` — ルート定義・Link href が `/admin/requests` のまま（リネーム/リダイレクト追加なし） |
| API パス | `rg -n "/admin/requests\|/members" apps/api/src/routes` — endpoint path 不変 |
| コンポーネントファイル名 | `ls apps/web/src/components/admin/RequestQueue*.tsx` — `RequestQueuePanel.tsx` / `RequestQueueDetail.tsx` が存在し改名なし |
| id / data-\* / テストセレクタ | `rg -n "admin-requests-\|data-testid\|id=\"admin-requests" apps/web/src/components/admin` — `admin-requests-*` の id/data 属性が不変 |
| import 名 | `rg -n "RequestQueuePanel\|RequestQueueDetail" apps/web` — import 名不変 |

### 既存テスト非破壊

| 既存 spec | 非破壊確認 |
| --- | --- |
| `apps/api/src/routes/admin/requests.contract.spec.ts` | 命名変更は web 側のみ・API 不変ゆえ無影響で GREEN |
| `apps/api/src/routes/admin/members.contract.spec.ts` | `pendingRequestTypes` 追加で拡充するが既存 assert（既存フィールド）は壊さない |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | 旧ラベル assert を新ラベル（「会員からの申請」「申請一覧」）へ同 wave 更新。`id`/`data-*` セレクタ参照は不変 |
| RequestQueueDetail spec（存在すれば） | 「申請詳細」へラベル更新・セレクタ不変 |
| `requests.mount.spec.ts` | mount/route 不変ゆえ無影響 |
| build-seed-sql.spec.ts / catalog.spec.ts | 依頼 3 件分の assert を追加し、既存 member/admin/meeting assert は不変 |

---

## 9.5 品質ゲート総合（DoD）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
rg -n "bg-\[#|text-\[#|#[0-9a-fA-F]{6}" apps/web/src/components/admin   # 0 件
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/routes/admin src/testing/test-accounts
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin
mise exec -- node scripts/gen-test-accounts-seed.mjs --check   # seed drift PASS
```

全 PASS + HEX 0 件 + drift PASS + AC-1..13 充足を DoD とする。staging seed 投入・screenshot・commit・PR は user-gated（Phase 13）。

---

## 9.6 完了条件（Phase 9）

- [ ] 静的解析（typecheck api/web・lint・verify:tokens・HEX grep gate）の合格基準を定義した
- [ ] セキュリティ（PII 非露出＝note_type のみ・body 非載せ / admin gate 維持 / seed 権限境界 / 入力検証）を確定した
- [ ] 性能（相関サブクエリ 1 本で N+1 なし / pending index 活用 / DISTINCT 互換）を確定した
- [ ] リグレッション（AC-4 不変の grep 手順 + 既存 spec 非破壊表）を確定した
- [ ] DoD 総合コマンドを SSOT §8 から正本化した
- [x] 本 Phase のローカル品質ゲートは本実装サイクルで実行済み（staging 投入は user-gated）
