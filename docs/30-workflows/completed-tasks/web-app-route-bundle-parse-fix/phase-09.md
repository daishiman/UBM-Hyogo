# Phase 9: テスト計画

## 目的

本タスクは設定 1 行変更でありユニットテストでは検出不能。代替として **runtime smoke + tail observation** をテストの正本とし、ローカル pre-flight で型 / lint / build を gate にする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented-local |

## テスト層

| 層 | コマンド / 手順 | 期待 | DoD 紐付け |
| --- | --- | --- | --- |
| L-1 type | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 | DoD-T01-3 / DoD-4 |
| L-2 lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 | DoD-T01-4 / DoD-4 |
| L-3 build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0、`.open-next/worker.js` 生成、`OpenNext build complete.` | DoD-T01-2 |
| R-1 staging smoke | 5 URL を `node -e "fetch('<URL>').then(r=>console.log(r.status))"` で叩く | 仕様書 §5.2 表のとおり | FR-1 / FR-2 / DoD-T01-6 / DoD-3 |
| R-2 staging tail grep | `scripts/cf.sh tail` 起動 → URL 叩き → `grep -c "Could not parse module" /tmp/tail-fix-verify.log` | 0 | DoD-2 / DoD-T01-7 |
| R-3 production smoke | staging PASS を gate に production URL で R-1 を再実行 | FR-3 達成 | DoD-T01-8 |

## カバレッジ AC 適用外宣言

本タスクはビルド設定変更 1 行のみであり、`apps/web/src` / `apps/api/src` の実装ロジックを 0 行も変更しない。`bash scripts/coverage-guard.sh` は変更行 0 のため自然に PASS する想定だが、coverage 数値そのものは本タスクの達成基準としては適用しない（**coverage AC 適用外**）。

> 根拠: `phase-template-core.md` §「テストカバレッジ AC は全タスク必須」の例外条項（pure-docs / migration-only に準じる、設定 1 行変更）。

## テストケース詳細

### R-1 staging smoke 5 URL

| # | URL | 期待 status | 備考 |
| --- | --- | --- | --- |
| TC-1 | `/` | 200 | Server Component 回帰なし確認 |
| TC-2 | `/members` | 200 | 同上 |
| TC-3 | `/login` | 200 | 同上 |
| TC-4 | `/register` | 200 | 同上 |
| TC-5 | `/api/auth/error` | 200 or 302（**500 でないこと**が合格条件） | App Route Handler 復旧確認 |

### R-2 staging tail grep

```bash
nohup bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging --format json </dev/null >/tmp/tail-fix-verify.log 2>&1 &
sleep 10
# TC-1〜TC-5 を順に叩く
sleep 10
grep -c "Could not parse module" /tmp/tail-fix-verify.log   # 期待: 0
pkill -f "wrangler tail" || true
```

### R-3 production smoke

R-1 と同一手順、URL を `ubm-hyogo-web-production.daishimanju.workers.dev` に置換。

## 完了条件

- [x] L-1/L-2/L-3 + R-1/R-2/R-3 の 6 層を表で固定
- [x] coverage AC 適用外宣言と根拠を明示
- [x] TC-1〜TC-5 の期待 status を確定

## 出力

- `phase-09.md`

## 参照資料

- `outputs/phase-04/task-01-switch-next-build-to-webpack.md` §5
