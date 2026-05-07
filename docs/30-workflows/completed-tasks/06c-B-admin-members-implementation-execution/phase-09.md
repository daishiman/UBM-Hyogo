[実装区分: 実装仕様書]

# Phase 9: 品質保証 — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 9 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

実装後に静的検査・テスト・無料枠・secret hygiene・a11y を確認するための品質保証コマンドと期待結果を確定する。

## 実行タスク

1. `mise exec -- pnpm typecheck` と `mise exec -- pnpm lint` の実行結果を確認する。
2. admin members / member-delete / shared schema / web component focused tests を実行する。
3. `apps/web` から D1 binding へ直接触れていないことを grep で確認する。
4. secret / cookie / production 値が outputs に混入していないことを確認する。

## quality gate コマンドと期待結果

| # | コマンド | 期待結果 |
| --- | --- | --- |
| Q1 | `mise exec -- pnpm typecheck` | exit 0、新規エラー 0 件 |
| Q2 | `mise exec -- pnpm lint` | exit 0、新規 warning 0 件（既存 string-literal warning は許容） |
| Q3 | `mise exec -- pnpm vitest run apps/api/src/routes/admin/members.test.ts` | 14 ケース全 pass |
| Q4 | `mise exec -- pnpm vitest run apps/api/src/routes/admin/member-delete.test.ts` | 全 pass |
| Q5 | `mise exec -- pnpm vitest run packages/shared` | 全 pass |
| Q6 | `rg "D1Database\|c\\.env\\.DB" apps/web -n` | production app direct D1 access 0 件（boundary test fixture のみ match 許容） |

## free-tier 見積もり

| 項目 | 想定 | 限度 |
| --- | --- | --- |
| Workers requests | admin 1 操作あたり list+detail で 2〜3 req、admin 数 1〜数名 | Cloudflare Workers free 100k/day 内 |
| D1 reads | list 検索 1 回あたり 2 query（list + count） | D1 free 5M reads/day 内 |
| D1 writes | delete / restore + audit_log = 各 2 write を batch | 100k writes/day 内 |
| Pages | LIMIT 50 + index 利用 | 全件スキャン回避 |

## secret hygiene チェックリスト

- [ ] AUTH_SECRET / DATABASE 接続情報を仕様書中に記載していない
- [ ] audit に PII が漏れない（actor は memberId のみ、name は記載しない）
- [ ] error response に内部 SQL や stack trace を含めない
- [ ] apps/web 側で D1 binding を直参照しない（不変条件 #5）
- [ ] PR body / commit message に secret を転記しない

## a11y チェックリスト

- [ ] 検索フォームの input に `<label>` が紐付く
- [ ] table の column header が `<th scope="col">` で表現される
- [ ] delete / restore confirmation が `<dialog>` で focus trap される
- [ ] error toast が `aria-live="polite"` で読み上げられる
- [ ] keyboard で 一覧→詳細→操作 まで到達できる
- [ ] density=list 時もモバイル幅で崩れない

## 入出力・副作用

- 入力: Phase 5 実装、Phase 8 抽出方針
- 出力: quality gate 結果、無料枠見積もり、a11y / secret チェック結果
- 副作用: テスト実行による D1 ローカル fixture の作成・破棄のみ

## DoD

- [ ] Q1〜Q7 が全 pass
- [ ] 無料枠で運用可能
- [ ] secret 漏洩経路ゼロ
- [ ] a11y AA 必須項目満たす

## 参照資料

- `docs/00-getting-started-manual/specs/09-ui-ux.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`

## 統合テスト連携

- 上流: Phase 8 DRY 化
- 下流: Phase 10 最終レビュー

## 多角的チェック観点

- #5 / #13 / a11y / 無料枠

## サブタスク管理

- [ ] quality gate 表を確定する
- [ ] 無料枠見積もり完了
- [ ] secret hygiene 完了
- [ ] a11y 完了
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- `outputs/phase-09/main.md`

## 完了条件

- [ ] Q1〜Q7 を実装担当が再現可能
- [ ] 無料枠超過の懸念がない

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装・deploy・commit・push・PR を行っていない
- [ ] CONST_005 必須項目が網羅されている

## 次 Phase への引き渡し

Phase 10 へ、QA 結果を渡す。
