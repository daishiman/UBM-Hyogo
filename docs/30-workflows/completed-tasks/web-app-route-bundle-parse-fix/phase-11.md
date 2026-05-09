# Phase 11: 実行 evidence

## 目的

NON_VISUAL evidence として typecheck / lint / build / staging deploy / staging smoke / staging tail grep / production deploy / production smoke の実行ログを `outputs/phase-11/` に保存する。本フェーズは **実装サイクルで生成する** ため、本仕様書時点では evidence ファイルは未生成（pending）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING（local evidence captured; runtime deploy user-gated） |

## 想定 evidence ファイル一覧（実装サイクルで生成）

| ファイル | 内容 | 期待 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | evidence index（全コマンド + exit code + リンク） | 全 PASS |
| `outputs/phase-11/evidence/typecheck.log` | `pnpm --filter @ubm-hyogo/web typecheck` 出力 | exit 0 |
| `outputs/phase-11/evidence/lint.log` | `pnpm --filter @ubm-hyogo/web lint` 出力 | exit 0 |
| `outputs/phase-11/evidence/build.log` | `pnpm --filter @ubm-hyogo/web build:cloudflare` 出力 | exit 0、`OpenNext build complete.` 含む |
| `outputs/phase-11/evidence/grep-gate.log` | `grep -E "\[project\]/" apps/web/.open-next/worker.js` の結果 | exit 1（マッチなし＝期待） |
| `outputs/phase-11/evidence/staging-deploy.log` | `bash scripts/cf.sh deploy --env staging` 出力 | `Current Version ID` 発行行 |
| `outputs/phase-11/evidence/staging-smoke.log` | TC-1〜TC-5 の `node -e fetch(...)` 結果 | TC-1〜TC-4=200, TC-5=200 or 302 |
| `outputs/phase-11/evidence/staging-tail.log` | `scripts/cf.sh tail` 30 秒分の json log | `Could not parse module` 0 件 |
| `outputs/phase-11/evidence/staging-tail-grep.log` | `grep -c "Could not parse module" tail-fix-verify.log` | `0` |
| `outputs/phase-11/evidence/production-deploy.log` | `bash scripts/cf.sh deploy --env production` 出力 | `Current Version ID` 発行行 |
| `outputs/phase-11/evidence/production-smoke.log` | TC-1〜TC-5 を production URL で実行した結果 | staging と同一 |
| `outputs/phase-11/evidence/runner-version.txt` | `node -v` / `pnpm -v` / `mise -v` | 環境固定の証跡 |

## 実行コマンド（実装サイクルで実行）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck      | tee outputs/phase-11/evidence/typecheck.log
mise exec -- pnpm --filter @ubm-hyogo/web lint           | tee outputs/phase-11/evidence/lint.log
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare | tee outputs/phase-11/evidence/build.log
grep -E "\[project\]/" apps/web/.open-next/worker.js     ; echo "exit=$?" > outputs/phase-11/evidence/grep-gate.log
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \
  | tee outputs/phase-11/evidence/staging-deploy.log
# tail + smoke を §9 R-1 / R-2 の手順で実行し、各ログ保存
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production \
  | tee outputs/phase-11/evidence/production-deploy.log
# §9 R-3 を実行し、production-smoke.log 保存
node -v && pnpm -v && mise -v > outputs/phase-11/evidence/runner-version.txt
```

## 状態境界

2026-05-09 の改善サイクルで local evidence を `outputs/phase-11/` に保存し、状態を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` へ遷移した。staging / production deploy と smoke は Cloudflare mutation を伴うため、Phase 13 G2 / G3 の user gate 後にのみ取得する。

## 完了条件（実装サイクルで判定）

- [x] `outputs/phase-11/main.md` が local evidence へリンクし PASS / pending_user_gate を分離
- [ ] `staging-tail-grep.log` が `0` を記録（user gate 後）
- [ ] `staging-smoke.log` の TC-1〜TC-4 が `200`、TC-5 が `200` or `302`（user gate 後）
- [ ] `production-smoke.log` も staging と同一（user gate 後）
- [x] `grep-gate.log` が `[project]/` 不検出を記録

## 出力

- `phase-11.md`（本仕様）
- `outputs/phase-11/`（実装サイクルで生成）

## 参照資料

- `phase-09.md`（テスト計画）
- `phase-10.md`（デプロイ手順）
