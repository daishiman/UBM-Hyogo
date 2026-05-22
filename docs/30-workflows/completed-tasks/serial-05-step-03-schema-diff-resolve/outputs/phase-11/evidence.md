**[実装区分: 実装仕様書]**

# Phase 11 — エビデンス取得計画 (VISUAL タスク)

## 1. Canonical evidence path

```
outputs/phase-11/
├── evidence/
│   ├── typecheck.log
│   ├── lint.log
│   ├── test.log
│   ├── build.log
│   ├── grep-gate.log
│   ├── e2e.log              # 任意（smoke 取得時）
│   └── playwright.log       # Issue #775 runtime evidence completion
├── screenshots/
│   ├── admin-schema-diff-list.placeholder.txt # legacy placeholder; not PASS screenshot evidence
│   ├── admin-schema-diff-added-desktop.png
│   ├── admin-schema-diff-added-mobile.png
│   ├── admin-schema-diff-changed-desktop.png
│   ├── admin-schema-diff-changed-mobile.png
│   ├── admin-schema-diff-removed-desktop.png
│   ├── admin-schema-diff-removed-mobile.png
│   ├── admin-schema-diff-unresolved-desktop.png
│   ├── admin-schema-diff-unresolved-mobile.png
│   ├── admin-schema-diff-resolve-success.png
│   ├── admin-schema-diff-resolve-409.png
│   └── admin-schema-diff-resolve-422.png
└── manifest.json
```

## 2. PASS 5 点セット取得手順

各 step は exit code を `evidence/<name>.log` 末尾に `EXIT_CODE=<n>` で記録する。

```bash
ROOT=docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence
mkdir -p "$ROOT"

mise exec -- pnpm typecheck 2>&1 | tee "$ROOT/typecheck.log"; echo "EXIT_CODE=$?" >> "$ROOT/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$ROOT/lint.log"; echo "EXIT_CODE=$?" >> "$ROOT/lint.log"
mise exec -- pnpm test apps/web --run -- SchemaDiffPanel.component.spec.tsx 2>&1 | tee "$ROOT/test.log"; echo "EXIT_CODE=$?" >> "$ROOT/test.log"
mise exec -- pnpm build 2>&1 | tee "$ROOT/build.log"; echo "EXIT_CODE=$?" >> "$ROOT/build.log"
( grep -rnE 'bg-\[#|text-\[#|process\.env\.' \
    apps/web/app/\(admin\)/admin/schema \
    apps/web/src/lib/admin/server-fetch.ts || true ) 2>&1 | tee "$ROOT/grep-gate.log"
echo "EXIT_CODE=0  # match=0 が PASS" >> "$ROOT/grep-gate.log"
```

PASS 判定:
- `typecheck.log`, `lint.log`, `test.log`, `build.log` → `EXIT_CODE=0`
- `grep-gate.log` → match 行 0 件

## 3. VISUAL screenshot 取得手順

### 3.1 server fetch 経路の mock

`INTERNAL_API_BASE_URL` を local API（`http://127.0.0.1:8787`）に向け、`apps/api` を別ターミナルで起動した上で `apps/web` dev server を立てる。

```bash
# terminal A: API
mise exec -- pnpm --filter @ubm/api dev

# terminal B: WEB (env は op run 経由)
bash scripts/with-env.sh mise exec -- pnpm --filter @ubm/web dev
```

`apps/web/src/lib/env.ts` の `getEnv()` を経由する。`process.env.*` 直接参照は禁止。

### 3.2 fixture / 縮退ケース

| 状態 | 取得方法 |
| --- | --- |
| 通常 (diff > 0) | API mock or staging seed の diff 既存データを使用 |
| 縮退 (diff = 0 / API 未到達) | existing fixture / error boundary 経路を確認する |
| resolve form open | list の resolve button クリック後にキャプチャ |
| 422 collision | 既存登録済 `stableKey` を submit し toast 表示状態をキャプチャ |

### 3.3 キャプチャ

Playwright もしくは手動でフルページスクリーンショットを取得し `outputs/phase-11/screenshots/*.png` に保存。

```bash
# Issue #775 実行コマンド
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --config=playwright.admin-schema-diff.config.ts
```

## 4. Canonical evidence manifest

`outputs/phase-11/manifest.json` に下記 shape で記録する。

```json
{
  "task": "serial-05-step-03-schema-diff-resolve",
  "taskType": "implementation",
  "visualEvidence": "VISUAL",
  "evidence": {
    "typecheck": "evidence/typecheck.log",
    "lint": "evidence/lint.log",
    "test": "evidence/test.log",
    "build": "evidence/build.log",
    "grep_gate": "evidence/grep-gate.log"
  },
  "screenshots": {
    "status": "completed",
    "captured": [
      "screenshots/admin-schema-diff-added-desktop.png",
      "screenshots/admin-schema-diff-added-mobile.png",
      "screenshots/admin-schema-diff-changed-desktop.png",
      "screenshots/admin-schema-diff-changed-mobile.png",
      "screenshots/admin-schema-diff-removed-desktop.png",
      "screenshots/admin-schema-diff-removed-mobile.png",
      "screenshots/admin-schema-diff-unresolved-desktop.png",
      "screenshots/admin-schema-diff-unresolved-mobile.png",
      "screenshots/admin-schema-diff-resolve-success.png",
      "screenshots/admin-schema-diff-resolve-409.png",
      "screenshots/admin-schema-diff-resolve-422.png"
    ],
    "legacy_placeholder": "screenshots/admin-schema-diff-list.placeholder.txt",
    "pending": []
  },
  "captured_at": "2026-05-18T15:38:00+09:00",
  "pass": true,
  "verdict": "PASS"
}
```

## 5. PR 本文反映

Phase 13 PR 本文の Test plan に上記 5 点セット + 11 valid PNG screenshot 参照を埋め込む（`outputs/phase-11/screenshots/` 相対 path）。legacy placeholder text は screenshot 証跡として扱わない。
