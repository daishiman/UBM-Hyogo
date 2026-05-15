# Phase 10: ローカル検証

## 検証手順

### 1. 依存・型・lint

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: 全 exit 0。

### 2. group 別実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage   # unit + d1 + merge
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage:web
```

期待: 全 exit 0、coverage 出力レイアウトが Phase 3 と一致。

### 3. coverage-guard group モード

```bash
bash scripts/coverage-guard.sh --group web
bash scripts/coverage-guard.sh --group api-unit
bash scripts/coverage-guard.sh --group api-d1
bash scripts/coverage-guard.sh --group packages
bash scripts/coverage-guard.sh --no-run
```

期待: 全 exit 0、80% 閾値が PASS。

### 4. port exhaustion 非再発確認

`apps/api` d1 group 実行ログを確認:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1 2>&1 | grep -iE "EADDRNOTAVAIL|EADDRINUSE" || echo "OK: no port exhaustion"
```

期待: `OK: no port exhaustion`。

### 5. coverage-merge 単体 test

```bash
mise exec -- node --test scripts/__tests__/coverage-merge.test.mjs
```

期待: 全 case PASS。

## 完了条件

- 上記 1〜5 が全て PASS
- 失敗時は Phase 4〜8 に戻って修正
