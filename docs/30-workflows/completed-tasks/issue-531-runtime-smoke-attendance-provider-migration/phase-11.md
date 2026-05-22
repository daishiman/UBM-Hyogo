# Phase 11: contract evidence + runtime smoke evidence (NON_VISUAL)

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `PASS_RUNTIME_VERIFIED` に状態遷移するための fresh evidence を取得する。現時点では local PASS 5 点と shellcheck は取得済みで、staging runtime smoke は user credentials 提供待ち。

## evidence canonical path

```
outputs/phase-11/evidence/
├── typecheck.log         # Phase 7 で生成
├── lint.log              # Phase 7 で生成
├── test.log              # Phase 8 で生成（throw assertion PASS を含む）
├── build.log             # `pnpm --filter @ubm-hyogo/api build`
├── grep-gate.log         # secret / PII leak 検査
└── runtime-smoke.log     # summary-only staging curl 結果
```

これは local PASS 5 点セット (typecheck/lint/test/build/grep-gate) + runtime smoke 1 点 = 計 6 点の NON_VISUAL evidence。

## 実行手順

```bash
# Step 1: local PASS 5 点
EVIDENCE_DIR="docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence"
mkdir -p "$EVIDENCE_DIR"
mise exec -- pnpm typecheck 2>&1 | tee "$EVIDENCE_DIR/typecheck.log"
mise exec -- pnpm lint      2>&1 | tee "$EVIDENCE_DIR/lint.log"
mise exec -- pnpm --filter @ubm-hyogo/api test  2>&1 | tee "$EVIDENCE_DIR/test.log"
mise exec -- pnpm --filter @ubm-hyogo/api build 2>&1 | tee "$EVIDENCE_DIR/build.log"

# Step 2: staging deploy 状態確認（既に親タスクで deploy 済みである前提）
bash scripts/cf.sh whoami | tee "$EVIDENCE_DIR/cf-whoami.log"

# Step 3: staging runtime smoke
op run --env-file=.env -- bash scripts/smoke/runtime-attendance-provider.sh staging
# runtime-attendance-provider.sh は raw body を mktemp 配下にのみ置き、
# persistent evidence には status / contract / count summary だけを書く。

# Step 4: secret / PII leak gate
{
  grep -R -E '(Set-Cookie:|^[Aa]uthorization:|Bearer [A-Za-z0-9]|cf-_session=[A-Za-z0-9]|__Secure-authjs.*=[A-Za-z0-9])' "$EVIDENCE_DIR"/*.log || true
  grep -E '(responseEmail|fullName|editResponseUrl|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+)' "$EVIDENCE_DIR/runtime-smoke.log" || true
} > "$EVIDENCE_DIR/grep-gate.log"
```

## PASS 条件（全て満たすこと）

| ID | 条件 |
| --- | --- |
| PASS-1 | typecheck.log に `error TS` が含まれない |
| PASS-2 | lint.log に `error` が含まれない |
| PASS-3 | test.log に throw assertion PASS 2 件 + `Tests: ... passed` summary・fail 0 |
| PASS-4 | build.log に build error が含まれない |
| PASS-5 | grep-gate.log が secret / PII 実値を含まない（non-match 空ファイル、または `PASS: no secret/cookie/token/PII leakage detected` marker） |
| PASS-6 | runtime-smoke.log の admin-list / admin-detail / admin-attendance / me-root / me-profile / me-attendance ラベルで route contract PASS が出現 |

## 状態語彙

- 全 PASS 取得時: 親タスクを `PASS_RUNTIME_VERIFIED` へ遷移可能（runtime PASS 後の別 wave で実反映）
- runtime のみ失敗: 本タスクは `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持し、原因を `outputs/phase-11/evidence/runtime-smoke-failure.md` に記録した上で再実行

## 完了条件

- local evidence 5 点と shellcheck が生成され、runtime credentials 提供後に PASS-1〜PASS-6 が全て満たされる
- `outputs/phase-11/main.md`（任意の summary）に PASS チェック結果を表形式で記録
