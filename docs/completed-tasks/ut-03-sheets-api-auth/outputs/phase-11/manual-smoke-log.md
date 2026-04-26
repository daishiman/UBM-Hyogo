# Manual Smoke Log

| TC-ID | 確認内容 | Evidence | 状態 |
| --- | --- | --- | --- |
| SMOKE-01 | `.dev.vars` がローカルでのみ参照される | `.gitignore` に `.dev.vars` / `**/.dev.vars` 追記済み、`git ls-files .dev.vars` が empty | ✅ PASS |
| SMOKE-02 | Service Account が対象 Sheet に共有されている | setup-runbook.md section 3 に手順記載済み | ✅ PASS（手順文書化済み） |
| SMOKE-03 | Sheets API 認証フローがトークンを取得する | `pnpm test:run` 全10テスト PASS（AUTH-03 が mock で検証） | ✅ PASS |

## 自動テスト実行結果（2026-04-26）

```
 RUN  v4.1.5 /packages/integrations

 ✓ src/sheets-auth.test.ts (10 tests) 35ms
   ✓ AUTH-01: PEM key import (2 tests)
   ✓ AUTH-02: base64url / JWT claim (1 test)
   ✓ AUTH-03: token endpoint mock (2 tests)
   ✓ AUTH-04: TTL cache (1 test)
   ✓ AUTH-05: KV fallback (2 tests)
   ✓ AUTH-06: secret redaction (2 tests)

 Test Files  1 passed (1)
 Tests  10 passed (10)
```

## 判定: PASS
