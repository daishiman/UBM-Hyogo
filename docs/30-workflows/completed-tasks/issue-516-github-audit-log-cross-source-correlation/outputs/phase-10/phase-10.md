# Phase 10 出力: ローカル / staging 検証 / dry-run

## 検証マトリクス

| シナリオ | 入力 | 期待 | 実測 |
| --- | --- | --- | --- |
| HIGH alert | github-org-update-member + cloudflare-login-fail | severity HIGH, 2 events | ✓ HIGH, 2 events |
| MEDIUM single source | github-org-update-member + edge-empty | severity MEDIUM, 1 event | ✓ MEDIUM |
| MEDIUM cross-source perm change (perm 1 + token-rotate) | workflow-success + token-rotate | MEDIUM (cloudflare token_rotate は perm-change 扱い) | ✓ MEDIUM + LOW (workflow 単独 group は LOW) |
| empty | edge-empty + edge-empty | `[]` | ✓ |
| rate-limit | edge-rate-limit (msw stub via vitest) | backoff success | ✓ vitest TC-RED-10 pass |

## 実行確認

### vitest
```
$ mise exec -- pnpm --filter @ubm-hyogo/api test src/audit-correlation
Test Files  123 passed (123)
Tests       834 passed (834)
```

### bats
```
$ bats scripts/audit-correlation/__tests__/grep-gate.bats
ok 1..5 (5/5)
$ bats scripts/audit-correlation/__tests__/runner-determinism.bats
ok 1..3 (3/3)
```

### shellcheck
```
$ shellcheck scripts/audit-correlation/*.sh
EXIT=0 (clean)
```

### grep gate (HIGH dry-run)
```
$ bash scripts/audit-correlation/grep-gate.sh /tmp/h.json
grep-gate clean: no PII / secret detected in /tmp/h.json
EXIT=0
```

## HIGH alert dry-run 出力サンプル
```json
[
  {
    "correlationKey": {
      "fingerprintHash": "<64hex>",
      "fingerprintVersion": 1
    },
    "events": [
      { "source": "github", "eventType": "org.update_member", "ipPrefix": "203.0.113.0/24", ... },
      { "source": "cloudflare", "eventType": "login_fail", "ipPrefix": "198.51.100.0/24", ... }
    ],
    "severity": "HIGH",
    "reason": "cross-source permission change with IP prefix change within 5 minutes"
  }
]
```

## runbook dry-run
6 ステップを fixture 入力で通し、ステップ間の引き継ぎ（finding ファイル → correlation → grep gate）が破綻なく繋がることを確認済。実 GitHub audit log 取得 (Step 2 live) のみ live wiring follow-up に残置。

## actionlint
local 検証は `pnpm dlx @rhysd/actionlint-runner@latest` を Phase 11 で試みる。CI 側で 1 度目の run 時に gate 確認。
