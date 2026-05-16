# Phase 11: エビデンス収集

## メタ情報

- **タスク**: parallel-08-shared-foundation-admin-ui-foundation
- **Phase**: 11 / 13
- **[実装区分: 実装仕様書]**
- **判定根拠**: 実コードを伴う差分を持つため、typecheck/lint/test/build/grep-gate の 5 点セットを canonical path に収集する必要がある。
- **エビデンス様式**: NON_VISUAL 縮約テンプレ（screenshot 不要）。

---

## 目的

`outputs/phase-11/evidence/` を canonical path として、5 種の log を確定保存する。
`outputs/phase-11/main.md` に PASS 5 点セットを記録し、Phase 12 のドキュメント生成にエビデンスとして連結する。
admin page load smoke の Playwright run log もここに集約する。

---

## 実行タスク

1. `outputs/phase-11/evidence/` を作成し、以下 5 ファイルを生成
   - `typecheck.log`
   - `lint.log`
   - `test.log`
   - `build.log`
   - `grep-gate.log`
2. Playwright `@admin-smoke` の run log を `evidence/test.log` に統合（または `evidence/playwright-admin-smoke.log` として併置）
3. `outputs/phase-11/main.md` に PASS 5 点セット（各 log の exit code、要約、行数）を記録
4. NON_VISUAL のため screenshot は取得しない（取得しない旨を main.md に明記）

---

## 参照資料

- Phase 9 quality-report.md / type-probe.md
- Phase 10 final-review.md
- `scripts/coverage-guard.sh`
- CLAUDE.md「Phase 11 evidence canonical path」規約

---

## 実行手順

### Step 1: ディレクトリ準備

```bash
WORKFLOW_DIR="docs/30-workflows/parallel-08-shared-foundation-admin-ui-foundation"
mkdir -p "$WORKFLOW_DIR/outputs/phase-11/evidence"
```

### Step 2: log 取得（リポジトリ root に戻って実行）

```bash
mise exec -- pnpm tsc --noEmit \
  2>&1 | tee "$WORKFLOW_DIR/outputs/phase-11/evidence/typecheck.log"

mise exec -- pnpm lint \
  2>&1 | tee "$WORKFLOW_DIR/outputs/phase-11/evidence/lint.log"

mise exec -- pnpm -F "@ubm-hyogo/web" test \
  2>&1 | tee "$WORKFLOW_DIR/outputs/phase-11/evidence/test.log"

mise exec -- pnpm -F "@ubm-hyogo/web" build \
  2>&1 | tee "$WORKFLOW_DIR/outputs/phase-11/evidence/build.log"

mise exec -- pnpm -F "@ubm-hyogo/web" exec playwright test --grep @admin-smoke \
  2>&1 | tee -a "$WORKFLOW_DIR/outputs/phase-11/evidence/test.log"
```

### Step 3: grep-gate.log 取得

Phase 10 で実行した不変条件 grep を結合して保存:

```bash
{
  echo "## hex literal";
  grep -RInE '#[0-9a-fA-F]{3,8}' apps/web/src apps/web/app 2>/dev/null \
    | grep -vE '\.(svg|png|md)$' | grep -v 'tokens.css' || echo "(none)";
  echo "## arbitrary tailwind color";
  grep -RInE 'bg-\[#|text-\[#' apps/web/src apps/web/app || echo "(none)";
  echo "## process.env direct";
  grep -RIn 'process\.env\.' apps/web/src apps/web/app | grep -v 'src/lib/env.ts' || echo "(none)";
  echo "## D1 binding direct";
  grep -RIn 'env\.DB\|getDb(' apps/web/src apps/web/app || echo "(none)";
  echo "## *.test.ts forbidden";
  find apps/web -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) || echo "(none)";
} > "$WORKFLOW_DIR/outputs/phase-11/evidence/grep-gate.log"
```

### Step 4: PASS 5 点セット記録

`outputs/phase-11/main.md` に以下を記録:

| evidence | path | exit | summary |
|----------|------|------|---------|
| typecheck | evidence/typecheck.log | 0 | error 0 |
| lint | evidence/lint.log | 0 | warning 0 |
| test | evidence/test.log | 0 | unit + admin-smoke pass |
| build | evidence/build.log | 0 | webpack build OK |
| grep-gate | evidence/grep-gate.log | - | 全 5 ルール (none) |

screenshot: 取得しない（NON_VISUAL）。

---

## 統合テスト連携

- Phase 9 で取得した `@admin-smoke` の run log を本 Phase に正本として集約。
- serial-05/step-01 が本タスクのエビデンスを前提として実装に着手することを `main.md` に明記。

---

## 多角的チェック観点（AI が判断）

- **canonical path**: `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` 5 件すべて存在
- **再現性**: log 末尾に exit code が残ること
- **NON_VISUAL**: screenshot を作らないことの明示
- **drift**: Phase 10 grep 結果と grep-gate.log が一致

---

## サブタスク管理

| No | サブタスク | 完了条件 |
|----|-----------|---------|
| 11-1 | evidence dir 作成 | path 存在 |
| 11-2 | 5 log 取得 | 5 ファイル存在 + exit 0 |
| 11-3 | admin-smoke log 統合 | test.log に admin-smoke 記録 |
| 11-4 | main.md PASS 5 点セット | テーブル記録 |

---

## 成果物

- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/test.log`
- `outputs/phase-11/evidence/build.log`
- `outputs/phase-11/evidence/grep-gate.log`
- `outputs/phase-11/main.md`

---

## 完了条件

- [ ] canonical path 5 log すべて存在
- [ ] main.md に PASS 5 点セット記録
- [ ] NON_VISUAL 明示
- [ ] admin-smoke run log 統合済み

---

## タスク 100% 実行確認【必須】

- [ ] 上記 4 タスクすべて完遂
- [ ] 未完項目があれば再着手
- [ ] CONST_007 遵守

---

## 次 Phase

Phase 12: ドキュメント・未タスク（Phase 12 strict 7 + Phase 11 evidence reference gate）。
