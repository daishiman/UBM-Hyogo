# Phase 7: エビデンス収集

[実装区分: 実装仕様書]

## 1. 収集対象

### Evidence path（親 workflow 正本）

```
docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/
├── evidence/
│   ├── typecheck.log
│   ├── lint.log
│   ├── test.log
│   ├── build.log
│   ├── grep-gate.log
│   └── playwright.log            # 本タスクで追加
├── screenshots/
│   ├── admin-schema-diff-list.placeholder.txt # legacy 非 PNG placeholder。PASS inventory 対象外
│   ├── admin-schema-diff-added-desktop.png   # 新規
│   ├── admin-schema-diff-added-mobile.png    # 新規
│   ├── admin-schema-diff-changed-desktop.png # 新規
│   ├── admin-schema-diff-changed-mobile.png  # 新規
│   ├── admin-schema-diff-removed-desktop.png # 新規
│   ├── admin-schema-diff-removed-mobile.png  # 新規
│   ├── admin-schema-diff-unresolved-desktop.png # 新規
│   ├── admin-schema-diff-unresolved-mobile.png  # 新規
│   ├── admin-schema-diff-resolve-success.png    # 新規
│   ├── admin-schema-diff-resolve-409.png        # 新規
│   └── admin-schema-diff-resolve-422.png        # 新規
└── manifest.json                  # 更新: pass=true / captured 配列
```

## 2. ログ収集コマンド

```bash
ROOT=docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence
mkdir -p "$ROOT"

mise exec -- pnpm typecheck 2>&1 | tee "$ROOT/typecheck.log"; echo "EXIT_CODE=$?" >> "$ROOT/typecheck.log"
mise exec -- pnpm lint      2>&1 | tee "$ROOT/lint.log";      echo "EXIT_CODE=$?" >> "$ROOT/lint.log"
mise exec -- pnpm test apps/web --run -- SchemaDiffPanel 2>&1 | tee "$ROOT/test.log"; echo "EXIT_CODE=$?" >> "$ROOT/test.log"
mise exec -- pnpm build     2>&1 | tee "$ROOT/build.log";     echo "EXIT_CODE=$?" >> "$ROOT/build.log"
```

Playwright ログ:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --config=playwright.admin-schema-diff.config.ts --reporter=line \
  2>&1 | tee "$ROOT/playwright.log"
echo "EXIT_CODE=$?" >> "$ROOT/playwright.log"
```

## 3. manifest.json 更新内容

`docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/manifest.json`:

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
    "grep_gate": "evidence/grep-gate.log",
    "playwright": "evidence/playwright.log"
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
    "pending": [],
    "completion_workflow": "docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/"
  },
  "captured_at": "<ISO8601>",
  "pass": true,
  "verdict": "PASS"
}
```

## 4. evidence.md 追記

親 workflow の `outputs/phase-11/evidence.md` 末尾に「§5 Runtime evidence completion (Refs #775)」セクションを追加し、本 workflow root へのリンクと取得日時 / 取得手順サマリ / spec パス を記録する（本文中の既存 §1-4 設計は不変）。

## 5. 提出基準

- 11 valid runtime PNG が `screenshots/` に揃う。legacy `admin-schema-diff-list.placeholder.txt` は履歴保持のみで PASS screenshot inventory には含めない
- 5 log + playwright.log の 6 ファイルが `evidence/` に揃い全 `EXIT_CODE=0`
- manifest.json `pass: true` / `verdict: PASS`
- Phase 6 ゲート G1-G9 全 PASS
