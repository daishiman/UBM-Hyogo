# Phase 9: 品質保証

## メタ情報
正本: `outputs/phase-9/phase-9.md` / 上位 SSOT: `../../_shared-context.md`

参照: SSOT §6（実行コマンド）・§4（AC-5〜AC-8）/ `../phase-2/phase-2.md`（§6 #11 機械的保証 / §9 validation path）/ `../phase-8/phase-8.md`（安全性チェック・rollback）

> workflow_state は `implemented_local_evidence_captured`。本 Phase は**本サイクルで実行する品質保証計画**であり、本サイクルでは各ゲートの結果欄は **present** とする（本サイクルで実行済み）。

## 目的
実装フェーズで満たすべき品質ゲートを一括コマンド + PASS 基準として固定する。typecheck / lint / focused vitest に加え、本タスク固有の 3 ゲート（**apps/web 非接触 / migrations 非接触 / memberId 非露出 grep gate**）を機械検証として定義する。

NON_VISUAL タスクのため **design-token gate（`verify-design-tokens`）は対象外**（UI / 色 / HEX / `tokens.css` に一切触れない。本タスクは apps/api のエラーハンドリング・ログ・テストのみ）。

---

## 1. 品質ゲート一覧（実行コマンドと PASS 基準）

| # | ゲート | コマンド | PASS 基準 | 根拠 AC | 結果 |
|---|--------|----------|-----------|---------|------|
| Q1 | 型チェック | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 | AC-8 | PASS |
| Q2 | lint | `mise exec -- pnpm --filter @ubm-hyogo/api lint` | exit 0 | AC-8 | PASS |
| Q3 | focused vitest | `vitest.d1.config.ts` の focused + full contract spec | issue-1190 6 cases PASS、`index.contract.spec.ts` 34/34 PASS | AC-1/2/3/4/8 | PASS |
| Q4 | apps/web 非接触 | `git diff --stat -- apps/web` | **出力が空**（apps/web 差分 0） | AC-6 | PASS |
| Q5 | migrations 非接触 | `git diff --stat -- apps/api/migrations` | **出力が空**（D1 schema 変更 0） | AC-7 | PASS |
| Q6 | memberId 非露出 grep gate | §3 の 2 コマンド | helper の scope 型が literal union で、call site が 3 値 literal のみ。memberId / email の混入 0 | AC-5 | PASS |
| Q7 | NON_VISUAL 宣言 | design-token gate（`verify-design-tokens`） | **対象外**（色変更なし・実行不要） | — | n/a |

## 2. focused vitest（Q3）の実行コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts -t issue-1190
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts
```

- D1 依存 spec のため `vitest.d1.config.ts` を使う。新規 spec ファイルは作らず `index.contract.spec.ts` に集約する。
- **既知の罠**: focused 実行は monorepo root 基準（`--root=. --config=vitest.d1.config.ts <パス>`）が必須。`--filter web/api exec` 経由やディレクトリ内直実行は include glob 不一致で "No test files found" になる。

PASS 基準の内訳:

| TC | 期待値（要約。正本は Phase 4 期待値表） |
|----|------------------------------------------|
| TC-1 | `GET /me` identity/status lookup 例外が 500・`application/problem+json`・`code: "UBM-5001"`・body に `m_001`/email 非含有 |
| TC-2 | `GET /me` admin lookup 例外が 500・`application/problem+json`・`code: "UBM-5001"`・body に `m_001`/email 非含有 |
| TC-3 | `GET /me/profile` builder 例外が 500・`UBM-5001` |
| TC-4 | `GET /me/profile` pendingRequests 例外が **200**・`pendingRequests: {}`・profile 本体完全 |
| 回帰 | 既存 describe 群すべて緑維持（34/34 PASS） |

## 3. memberId 非露出 grep gate（Q6・AC-5）の具体コマンド

```bash
# G-1: 変更 2 ファイル内の context 構築箇所を全件列挙
grep -n 'context: {' \
  apps/api/src/middleware/session-guard.ts \
  apps/api/src/routes/me/index.ts

# G-2: helper scope 型と literal call site を列挙
grep -nE 'type Me.*DatabaseScope|toMeDatabaseError\("me-(session-guard|profile-builder)"|scope: "me-pending-requests"' \
  apps/api/src/middleware/session-guard.ts \
  apps/api/src/routes/me/index.ts
```

**PASS 基準**: `toMeDatabaseError` の `scope` 引数型が literal union（`"me-session-guard"` / `"me-profile-builder"`）であり、call site がその literal のみであること。直接 `logError` する pendingRequests は `scope: "me-pending-requests"` literal 固定であること。`context` に memberId / email / 動的 user 値を入れない。

> 補強（任意・証跡向け）: `grep -nE 'context: .*(memberId|email)' apps/api/src/middleware/session-guard.ts apps/api/src/routes/me/index.ts` が **0 ヒット**であることを Phase 11 証跡に併記してよい。なお response 側の非露出は grep ではなく TC-1〜TC-3 の `not.toContain("m_001")` / email 非含有アサーションが正（Phase 2 §6）。`sanitize()` は memberId/email を REDACT しないため、grep + テストの 2 層が必須である点に注意。

## 4. ゲート判定の見方（失敗時の切り分け）

| ゲート | 失敗時の典型原因 | 一次対応 |
|--------|------------------|----------|
| Q1 typecheck | `.catch` handler の `never` 注釈が union に残る / `PendingRequests` 型 import 漏れ | Phase 3 R1 の代替実装（try/catch + let）へ機械的書き換え / `./schemas` から型 import |
| Q2 lint | unused import（`ApiError` / `logError` の入れ忘れ・消し忘れ） | `pnpm lint --fix` → 残違反を手修正 |
| Q3 vitest | failing D1 Proxy の SQL パターンが意図経路を選択していない（R2）/ 既存ケース回帰 | Phase 4 期待値表の fail パターン（テーブル名）と builder.ts 実 SQL を照合 / 回帰は Phase 2 §8 エラーハンドリング表と diff を照合 |
| Q4 apps/web diff | 誤って apps/web を編集した | 当該変更を revert（本 WF は apps/api + docs のみ） |
| Q5 migrations diff | 誤って migration / 新規 route を追加した | 当該変更を revert（D1 schema・endpoint surface 不変が不変条件） |
| Q6 grep gate | `context` に scope 以外のキー・動的値を追加した | literal `{ scope: "<3値>" }` 固定へ戻す（Phase 2 §6） |

## 5. spec 検証ゲート（仕様書自体の health・本サイクルで実行可）

```bash
pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix
pnpm gate-metadata:validate
```

期待: compliance `ok:true` / gate-metadata ERROR 0。これらは implemented_local_evidence_captured の本サイクルでも実行する（コード実装ゲート Q1〜Q6 とは独立）。

## 統合テスト連携
Q1〜Q6 は実装フェーズの合格ゲートであり、Phase 6 のテスト資産（TC-1〜TC-4）・Phase 7 のカバレッジ・Phase 8 のリファクタ判断（実施時は振る舞い不変チェック込み）をまとめて検証する。staging 実機での `UBM-5001` + scope ログ確認（`wrangler tail`・`bash scripts/cf.sh` 経由）はローカルゲートでは確認できないため、Phase 11 の手動手順（user-gated）に委譲する。

## 参照資料
- `../../_shared-context.md`（SSOT §4 AC / §5 不変条件 / §6 実行コマンド / §7 DoD）
- `../phase-2/phase-2.md`（§6 #11 機械的保証 / §7 テスト戦略 / §9 validation path）
- `../phase-8/phase-8.md`（安全性チェック・rollback）

## 成果物
- `outputs/phase-9/phase-9.md`

## 完了条件
- [x] Q1〜Q7 の一括コマンドと PASS 基準を表で固定した（結果欄は implemented_local_evidence_captured につき pending と明記）。
- [x] focused vitest の正確な実行コマンド（monorepo root 基準）と TC 別 PASS 基準を記述した。
- [x] `git diff --stat -- apps/web` 空（AC-6）・`apps/api/migrations` 非接触（AC-7）をゲート化した。
- [x] memberId 非露出 grep gate（G-1/G-2 完全一致方式）の具体コマンドと PASS 基準を定義した（AC-5）。
- [x] NON_VISUAL のため design-token gate 対象外と明記し、失敗時切り分けと spec 検証ゲートを記述した。

## 次 Phase への引き継ぎ
- 品質ゲート Q1〜Q7 は**本サイクルで実行する計画**として固定済み（本サイクルの結果欄はlocal present/staging pending・spec 検証ゲートのみ実行可）。
- Q6 の PASS 判定は「helper scope 型 union + literal call site + pendingRequests literal」の機械基準。response 側 #11 はテストアサーション（TC-1〜TC-4）が正で grep は補完。
- Phase 10 は Q1〜Q7 計画と Phase 1〜8 成果物を入力に、AC-1〜AC-10 の spec 段階判定（実装・検証済み）と blocker 有無を確定する。
- 本サイクル実装後は Q1〜Q6 の実行ログを Phase 11 証跡（focused tests / grep / diff）として記録する。
