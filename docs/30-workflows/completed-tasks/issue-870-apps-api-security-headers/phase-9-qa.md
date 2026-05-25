# Phase 9: 品質保証 — issue-870-apps-api-security-headers

> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-8-refactor.md](phase-8-refactor.md) / 次 Phase: [phase-10-final-review.md](phase-10-final-review.md)

## 目的

typecheck / lint / test の 3 系を一括実行し、全て合格することを DoD 達成の証跡とする。
「ファイル削除無し」前提（新規追加 + 修正のみ）で実行する。

---

## 9-1. 実行コマンドと期待結果

### Step 1: 依存インストール（ワークツリー起動後は必ず実行）

```bash
mise exec -- pnpm install
```

期待: `node_modules/.pnpm` が更新され、エラーなし。

---

### Step 2: 型チェック

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

判定基準:

| 結果 | 判定 |
|------|------|
| `Found 0 errors.` または exit 0 | PASS |
| 任意の型エラー | FAIL → Phase 5 に差し戻し、実装を修正する |

---

### Step 3: リント

```bash
mise exec -- pnpm --filter @ubm-hyogo/api lint
```

判定基準:

| 結果 | 判定 |
|------|------|
| exit 0 / 警告なし（または `--max-warnings 0` で合格） | PASS |
| ESLint エラー / 警告超過 | FAIL → `pnpm --filter @ubm-hyogo/api lint --fix` で自動修正してから再実行 |

---

### Step 4: Unit テスト（security-headers.spec.ts）

```bash
mise exec -- pnpm exec vitest run apps/api src/middleware/__tests__/security-headers.spec.ts
```

判定基準:

| 結果 | 判定 |
|------|------|
| TC-01〜TC-10 全件 PASS（10 tests passed） | PASS |
| 1 件でも FAIL | FAIL → 実装またはテストを修正して再実行 |

---

### Step 5: 回帰テスト（D1 lane – public Cache-Control 保持確認）

```bash
mise exec -- pnpm exec vitest run apps/api \
  --config vitest.d1.config.ts \
  src/routes/public/index.contract.spec.ts
```

判定基準:

| 結果 | 判定 |
|------|------|
| public contract spec 全件 PASS | PASS |
| `Cache-Control: public, max-age=60` が消えている / `no-store` に書き換わっている | FAIL → `securityHeaders` middleware の上書き禁止ロジックを修正 |

> **重要**: `form-preview` / `stats` の `Cache-Control: public, max-age=60` と public `/members` の `Cache-Control: no-store` を middleware が破壊していないことをこのステップで確認する。

---

## 9-2. grep gate

実装の物理的存在と最低限の内容を grep で確認する。

```bash
# nosniff が security-headers.ts に 1 件以上存在すること
grep -rn "nosniff" apps/api/src/middleware/security-headers.ts
```

期待: `1 行以上`がマッチ。0 件は FAIL。

```bash
# HSTS ヘッダが security-headers.ts に存在すること
grep -rn "Strict-Transport-Security" apps/api/src/middleware/security-headers.ts
```

期待: `1 行以上`がマッチ。

```bash
# Referrer-Policy が security-headers.ts に存在すること
grep -rn "Referrer-Policy" apps/api/src/middleware/security-headers.ts
```

期待: `1 行以上`がマッチ。

```bash
# index.ts に corsFromEnv と securityHeaders の app.use 登録が存在すること
grep -n "corsFromEnv\|securityHeaders" apps/api/src/index.ts
```

期待: 2 件以上マッチ（`app.use("*", securityHeaders())` と `app.use("*", corsFromEnv())`）。

```bash
# ALLOWED_ORIGINS が env.ts に追加されていること
grep -n "ALLOWED_ORIGINS" apps/api/src/env.ts
```

期待: 1 件以上マッチ。

---

## 9-3. 非該当 gate の明記

以下の grep gate は本タスクでは**適用しない**（非該当）。

| Gate | 非該当理由 |
|------|-----------|
| `apps/web/src` への `127.0.0.1` 焼き込み禁止 grep | 本タスクは `apps/api` のみを変更する。`apps/web/src` には一切手を加えない |
| CSP ヘッダの付与確認 | JSON API 用途のため CSP は本タスクの対象外（スコープ外・index.md §スコープ外 参照） |

---

## 9-4. 一括判定フロー

```
Step 1 install → Step 2 typecheck → Step 3 lint → Step 4 unit test → Step 5 回帰 → grep gate
       ↓                ↓                ↓               ↓                 ↓             ↓
      OK?              OK?              OK?             OK?               OK?           OK?
       ↓ YES            ↓ YES            ↓ YES           ↓ YES             ↓ YES         ↓ YES
                                                                                     → Phase 10 へ
       ↓ NO             ↓ NO             ↓ NO            ↓ NO              ↓ NO         ↓ NO
   deps 再確認     実装修正         lint --fix        実装修正          上書き禁止      実装修正
                  Phase 5 差戻し                    Phase 5 差戻し      ロジック修正
```

---

## 9-5. DoD（Definition of Done）

- [ ] `pnpm --filter @ubm-hyogo/api typecheck`: exit 0 / 0 errors
- [ ] `pnpm --filter @ubm-hyogo/api lint`: exit 0
- [ ] TC-01〜TC-10 全件 PASS（10 tests passed）
- [ ] D1 lane public contract spec: PASS（Cache-Control 保持確認）
- [ ] grep gate: nosniff / HSTS / Referrer-Policy が security-headers.ts に各 1 件以上
- [ ] grep gate: index.ts に corsFromEnv / securityHeaders 登録が各 1 件以上
- [ ] grep gate: env.ts に ALLOWED_ORIGINS が 1 件以上
- [ ] `apps/web/src` への変更 0 件（`git diff --name-only` で確認）
