# Phase 11: 手動テスト計画 + 証跡計画（NON_VISUAL / implemented_local_evidence_captured）

## NON_VISUAL 宣言

| 項目 | 値 |
|------|------|
| タスク種別 | **NON_VISUAL** |
| 非視覚的理由 | 変更は apps/api の `/me` 系エラーハンドリング（fail-soft 統一 T01・`UBM-5001` 分類 rethrow T02）・構造化ログ・契約テスト（T03）のみで、UI 表現（文言・色・レイアウト・DOM 構造）を一切変更しない。apps/web は非接触（AC-6・web 側 5xx degrade は既存 `session-error-display.ts` のまま不変） |
| 代替証跡 | focused vitest（TC-1〜TC-4）+ grep gate（不変条件 #11）+ diff 証跡（apps/web 空 / migrations なし）+ staging 実機ログ（`wrangler tail` での `UBM-5001` + scope 観測・user-gated）。スクリーンショットは取得しない |
| workflow_state | `implemented_local_evidence_captured`（本サイクルでコード実装・ローカル検証まで完了。コード実装・テスト実行は完了。commit・PR は user-gated） |

> 本タスクは UI 表現を変えないため Phase 11 のスクリーンショットは作成しない（物理 PNG・空ディレクトリも作らない）。証跡の主ソースは (1) focused vitest（TC-1〜TC-4）の名前と件数、(2) 不変条件 #11 の grep gate、(3) 非接触 diff 証跡、(4) staging 実機の `UBM-5001` + `context.scope` ログ（user-gated）である。詳細手順と結果欄は `manual-test-result.md` に置く。

## 実施情報

| 項目 | 値 |
|------|------|
| 実施 wave | `implemented_local_evidence_captured`（コード実装・ローカル証跡取得まで完了） |
| ブランチ | `docs/issue-1190-me-5xx-root-fix-spec`（起点 `origin/dev` 52ade3866） |
| 対象 endpoint | `GET /me`・`GET /me/profile`（apps/api・path/shape/status 体系不変） |
| 対象環境（実機確認時） | staging（`bash scripts/cf.sh` 経由のみ・`wrangler` 直叩き禁止） |

## 証跡計画（implemented_local_evidence_captured：取得タイミングを明示）

### 1. focused vitest（TC-1〜TC-4）— present

期待値は `../phase-2/phase-2.md` §7.2（および Phase 4 の I/O 契約表）がグラウンドトゥルース。

| TC | テストファイル | 観点 | 期待値 | 取得状態 |
|----|----------------|------|--------|----------|
| TC-1 | `apps/api/src/routes/me/index.contract.spec.ts`（追記） | P1/P2 の D1 例外分類 | `GET /me` 500・problem+json・`code: "UBM-5001"`・`context.scope="me-session-guard"`（ログのみ） | **present** |
| TC-2 | `apps/api/src/routes/me/index.contract.spec.ts`（追記） | P3 buildMemberProfile の例外分類 | `GET /me/profile` 500・`UBM-5001`・`context.scope="me-profile-builder"` | **present** |
| TC-3 | `apps/api/src/routes/me/index.contract.spec.ts`（追記） | P4 fail-soft | `GET /me/profile` **200**・`pendingRequests: {}`・profile 本体完全・`scope="me-pending-requests"` ログ | **present** |
| TC-4 | 既存 describe 群 | 回帰 | 200/401/410/202/409/422/403/429 全緑維持 | **present** |

実行コマンド（monorepo root 基準・`--filter` 経由禁止）:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts -t issue-1190
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts
```

### 2. grep gate（不変条件 #11・AC-5）— present

```bash
grep -n "context: {" apps/api/src/middleware/session-guard.ts apps/api/src/routes/me/index.ts
# 全ヒットが literal { scope: "me-session-guard" | "me-profile-builder" | "me-pending-requests" } のみであること
```

取得状態: **present**。

### 3. diff 証跡（AC-6 / AC-7）— present

```bash
git diff --stat -- apps/web                      # 空（apps/web 非接触）
git status --porcelain | grep -v docs/           # migrations / 新規 route なし
```

取得状態: **present**。

### 4. スクリーンショット — n/a（NON_VISUAL）

UI 表現差分が存在しないため取得しない。`outputs/phase-11/screenshots/` ディレクトリ自体を作成しない（空ディレクトリ・物理 PNG とも作らない）。

### 5. staging 実機確認 — user-gated

実装・deploy 後に `manual-test-result.md` の MT-1〜MT-6 に従って実施する（`bash scripts/cf.sh` 経由・user-gated）。`/me` 5xx 再発時に worker ログ 1 件（`UBM-5001` + `context.scope`）で発生 scope を確定できることが確認対象。

## 完了条件

- [x] 冒頭に NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）を明記した。
- [x] 証跡計画（focused vitest TC-1〜TC-4 / grep gate / diff 証跡）を「present」として記録した。
- [x] スクリーンショットを作らない理由（NON_VISUAL）を明記し、物理 PNG・空ディレクトリを作らなかった。
- [x] staging 実機確認手順を `manual-test-result.md` に分離し user-gated を明記した。

## 成果物
- `outputs/phase-11/phase-11.md`（本ファイル）
- `outputs/phase-11/manual-test-result.md`

## 参照資料
- `../../_shared-context.md` §4（AC）/ §6（検証コマンド）/ §7（DoD）
- `../phase-1/phase-1.md`（P1-P8 経路マップ / F-1〜F-3 / AC-1〜AC-10）
- `../phase-2/phase-2.md` §7（テスト戦略 TC-1〜TC-4）/ §9（validation path）

## 統合テスト連携
本タスクは node 環境 vitest（InMemoryD1 + failing Proxy + fake resolveSession 注入）で決定的に完結する設計（Phase 2 §7）。staging 実機での 5xx 再現・`wrangler tail` による `UBM-5001` ログ確認は `manual-test-result.md` の手動手順（user-gated）で代替する。証跡取得後、Phase 12 compliance check の inventory を pending → present へ更新する。
