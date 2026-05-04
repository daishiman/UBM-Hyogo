[実装区分: 実装仕様書]

# Phase 4: テスト戦略 — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 4 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`06c-B-admin-members` workflow の admin members 残実装を `apps/api` / `apps/web` / `packages/shared` の実コードに落とす際に必要な、unit / contract / authorization / E2E の 4 層テスト戦略を確定する。Issue #430 の AC（検索/ページング/詳細/delete/restore/role 不在/admin guard/D1 直参照禁止/audit_log 必須）が、いずれも 1 つ以上の検証層に紐付くことを保証する。

## 実行タスク

1. API route の focused test を `filter` / `q` / `zone` / repeated `tag` / `sort` / `density` / `page` / delete / restore に分解する。
2. shared schema は `AdminMemberSearchZ` と `toAdminApiQuery()` の正常系・異常系で検証する。
3. Web UI は URL state、filter 遷移、drawer open、D1 直参照不在の構造検証に限定する。
4. `pageSize=50` 固定、unknown tag 0 件、tag 6 件以上 422 をテスト期待値として統一する。

## verify suite

| 層 | 対象 | 主な検証内容 | 実行コマンド |
| --- | --- | --- | --- |
| unit | `packages/shared/src/admin/search.ts`（`AdminMemberSearchZ` / `toAdminApiQuery()` / `ADMIN_SEARCH_LIMITS`）、`apps/api` query builder（filter/q/zone/tag/sort/density/page → SQL & bindings）、`apps/api/src/lib/audit.ts` writer | Zod による境界値（Q_LIMIT=200 / TAG_LIMIT=5 / PAGE_SIZE=50）・空白正規化・SQL placeholder 数・ORDER BY 句・LIMIT/OFFSET 計算 | `mise exec -- pnpm vitest run packages/shared apps/api/src/lib` |
| contract | `apps/api/src/routes/admin/members.test.ts` の 14 ケース（list / detail / delete / restore） | クエリ別 status code・response shape `{ total, members }` 互換・`audit_log` 1 行追記・rollback | `mise exec -- pnpm vitest run apps/api/src/routes/admin/members.test.ts` |
| authorization | `apps/api/src/middleware/require-admin.ts`、`apps/web` middleware | guest=401 / member=403 / admin=200、二段防御の冗長性確認 | contract suite に統合 |
| E2E | `apps/web/app/(admin)/admin/members/page.tsx` + `MembersClient.tsx` + `MemberDrawer.tsx` の一覧→詳細→delete→restore | 08b admin members E2E（Playwright）で seeded/sanitized fixture 前提で実行 | 後続 08b workflow に委譲 |

## 追加テストケース定義（apps/api/src/routes/admin/members.test.ts）

| # | ケース | 期待値 |
| --- | --- | --- |
| T1 | `GET /admin/members?sort=invalid` | 422 / `error.code = "BAD_REQUEST"`（zod parse fail） |
| T2 | `GET /admin/members?density=invalid` | 422 |
| T3 | `GET /admin/members?zone=invalid` | 422 |
| T4 | `q` が 201 文字 | 422 |
| T5 | `q=Test`（fixture に `fullName` "Test User" を含む） | 200 / `members[].fullName` に "Test" を含む 1 件以上 |
| T6 | `q=NoMatch` | 200 / `total=0` / `members=[]` |
| T7 | `page=99999` | 200 / `total>=0` / `members=[]`（過大ページ → 空） |
| T8 | `page=0` | 422 |
| T9 | `tag=tag_a&tag=tag_b`（AND） | 200 / 両 tag を持つ会員のみ |
| T10 | guest（cookie なし） | 401 |
| T11 | member ロールで admin endpoint | 403 |
| T12 | 存在しない id に delete | 404 |
| T13 | 既に deleted な対象を再 delete | 409 |
| T14 | delete 時に reason 欠落 / audit 書込み失敗時 | 422（reason 欠落）／ 5xx + mutation rollback（audit fail） |

## 不変条件と検証層の対応

| 不変条件 | 主検証層 | 補足 |
| --- | --- | --- |
| #4 本文編集禁止 | contract | mutation endpoint が delete / restore のみであることを routing 単位で確認 |
| #5 apps/web D1 直アクセス禁止 | unit + 構造 grep | `apps/web` から `c.env.DB` / `D1Database` を import していないこと |
| #11 admin も他人本文編集不可 | contract | admin 用 update endpoint が存在しない |
| #13 audit_log 必須 | contract | delete / restore 後に `audit_log` 行が 1 件追加 |

## 入出力・副作用

- 入力: Phase 3 採用案、Issue #430 AC、12-search-tags / 07-edit-delete / 11-admin-management の正本仕様。
- 出力: 4 層テスト責務表、追加テスト 14 ケース定義、検証コマンド。
- 副作用: 本 phase ではコード/テスト実装は行わない（ファイル作成は仕様書のみ）。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run apps/api/src/routes/admin/members.test.ts
```

## DoD

- [ ] 4 層のテスト責務が分離され、責任範囲に重複がない
- [ ] 追加 14 ケースが Issue #430 AC のすべてを 1 件以上カバーする
- [ ] 不変条件 #4 / #5 / #11 / #13 がいずれも検証層に紐付く
- [ ] ローカル実行コマンドが Phase 9 と整合する

## 参照資料

- `docs/00-getting-started-manual/specs/12-search-tags.md`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/30-workflows/completed-tasks/06c-B-admin-members/outputs/phase-12/implementation-guide.md`

## 統合テスト連携

- 上流: Phase 3 採用案
- 下流: Phase 5 実装ランブック / Phase 6 異常系検証 / 08b admin members E2E

## 多角的チェック観点

- AC × 検証層が 1:N で漏れなし
- audit_log 書込み失敗時の rollback 検証が contract 層に確保されている
- E2E 範囲を 08b に明確に委譲している（本タスクで Playwright を起動しない）

## サブタスク管理

- [ ] 4 層テスト責務表を確定する
- [ ] 14 ケースの fixture 前提を確定する
- [ ] 不変条件 ↔ 検証層対応表を確定する
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- `outputs/phase-04/main.md`

## 完了条件

- [ ] 14 ケースの期待値・status code が Phase 6 / Phase 7 と整合する
- [ ] 検証コマンドが Phase 9 と一致する

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 仕様書作成内で実装・deploy・commit・push・PR を行っていない
- [ ] CONST_005 必須項目（変更対象/シグネチャ/入出力/テスト方針/コマンド/DoD）が網羅されている

## 次 Phase への引き渡し

Phase 5 へ、テスト suite と 14 ケースの fixture 要件を渡す。
