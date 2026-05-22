# Phase 9: テスト補強 / lint / typecheck

[実装区分: 実装仕様書]

## 1. 目的

Phase 7-8 で残った gap を埋める。特に regression / 既存 5 policy への影響なしを最終確認する。

## 2. 検証項目

| カテゴリ | コマンド | 期待 |
| --- | --- | --- |
| TypeScript | `mise exec -- pnpm typecheck` | exit 0 |
| Lint | `mise exec -- pnpm lint` | exit 0 |
| Unit test | `mise exec -- pnpm test:alerts` | exit 0、新ケース PASS |
| Schema validation | `pnpm test:alerts -- load.spec` | exit 0、6→7(8) entries |
| Coverage（任意） | `pnpm test:alerts -- --coverage` | `infra/cloudflare-alerts/lib/` の lines coverage ≥ 80% |

## 3. 追加検証

- 既存 `*.spec.ts` の expectation を変更していないこと（regression なし）
- 新 fixture の `name` が schema pattern `^[a-z0-9-]+$` を満たすこと
- `quota-base.json` の `$schema` が壊れていないこと

## 4. CI 互換確認

`.github/workflows/cloudflare-alerts-drift.yml` で `cf:alerts:diff --ci` が読まれる。新 policy が CI 側でも認識されることを以下で確認:

```bash
CLOUDFLARE_ALERTS_TOKEN_READ=$(op read 'op://UBM-Hyogo/UBM-Hyogo Alerts Read Token/credential') \
CLOUDFLARE_ALERT_RELAY_URL=$(op read 'op://UBM-Hyogo/UT-17 Alert Relay/url') \
  bash scripts/cf.sh alerts diff --ci
```

## 5. 成果物

| パス | 種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-09/typecheck.log` | 新規 | `pnpm typecheck` 出力 |
| `outputs/phase-09/lint.log` | 新規 | `pnpm lint` 出力 |
| `outputs/phase-09/test-alerts.log` | 新規 | `pnpm test:alerts` 出力 |
| `outputs/phase-09/diff-ci.log` | 新規 | `--ci` モード diff 出力 |

## 6. 完了条件 (DoD)

- [ ] typecheck / lint / test:alerts すべて exit 0
- [ ] `--ci` モード diff が期待通り（missing 1+ 件）
- [ ] regression なし
