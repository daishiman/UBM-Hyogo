# Phase 11: 手動受入 / Evidence 収集（task-01）

| 項目 | 値 |
|------|----|
| 入力 | `phase-10.md` 完了（GO 判定） |
| 出力 | `outputs/phase-11/evidence/` 配下の artifact 一式 |
| visualEvidence | NON_VISUAL（CI 実 run のログ抜粋を evidence とする） |

---

## 1. NON_VISUAL 判定の根拠

本 task は `.github/workflows/web-cd.yml` の YAML 編集のみで、UI / 画面遷移に影響しない。Playwright スクリーンショットは取得対象外。代わりに CI 実 run のログ・grep gate 結果を evidence とする。

`task-specification-creator/references/quality-gates.md` の NON_VISUAL カテゴリに準拠。

---

## 2. evidence ファイル一覧（想定 artifact）

`outputs/phase-11/evidence/` 配下に以下を保存する。

| ファイル | 取得元 | 目的 |
|---|---|---|
| `typecheck.log` | `mise exec -- pnpm typecheck > outputs/phase-11/evidence/typecheck.log 2>&1` | G-08 PASS 証跡 |
| `lint.log` | `mise exec -- pnpm lint > outputs/phase-11/evidence/lint.log 2>&1` | G-09 PASS 証跡 |
| `yaml-syntax.log` | `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/web-cd.yml'))" > outputs/phase-11/evidence/yaml-syntax.log 2>&1` | G-01 PASS 証跡 |
| `actionlint.log`（任意） | `mise exec -- pnpm dlx actionlint .github/workflows/web-cd.yml > outputs/phase-11/evidence/actionlint.log 2>&1` | G-02 PASS 証跡 |
| `grep-gate.log` | §3 のスクリプトを実行 | G-04 / G-05 / G-06 PASS 証跡 |
| `secret-residue.log` | G-07 の grep を実行 | G-07 PASS 証跡 |
| `runtime-ci-pending.md` | user approval boundary 記録 | G-10 / AC-04 / AC-05 が runtime_pending である根拠 |

---

## 3. grep-gate.log 生成スクリプト

```bash
{
  echo "=== AC-01: CF_TOKEN_WORKERS removed ==="
  grep -n "CF_TOKEN_WORKERS" .github/workflows/web-cd.yml || echo "(no match)"

  echo
  echo "=== AC-02: secrets.CLOUDFLARE_API_TOKEN count ==="
  grep -c 'secrets.CLOUDFLARE_API_TOKEN' .github/workflows/web-cd.yml

  echo
  echo "=== AC-03: Verify CF token is present count ==="
  grep -c 'Verify CF token is present' .github/workflows/web-cd.yml
} > outputs/phase-11/evidence/grep-gate.log 2>&1
```

期待出力:

```
=== AC-01: CF_TOKEN_WORKERS removed ===
(no match)

=== AC-02: secrets.CLOUDFLARE_API_TOKEN count ===
2

=== AC-03: Verify CF token is present count ===
2
```

---

## 4. dev-run-watch.log の必須 grep 抜粋

ユーザー承認後に取得する `dev-run-watch.log` 内に以下が含まれていることを Phase 11 追加 evidence として確認:

| pattern | 期待 |
|---|---|
| `Verify CF token is present` | step 行が出現（exit 0） |
| `1Password CLI (op) が見つかりません` | **出現しない** |
| `Successfully deployed` または同等の wrangler 成功メッセージ | 出現 |

---

## 5. evidence index の記述

`outputs/phase-11/evidence-index.md` を作成し、上記 §2 の各ファイルへのリンクと PASS / FAIL 判定を表形式で記録する。

```markdown
# task-01 evidence index

| AC / gate | evidence file | 結果 |
|---|---|---|
| G-01 | yaml-syntax.log | PASS |
| G-04 / AC-01 | grep-gate.log §AC-01 | PASS (no match) |
| G-05 / AC-02 | grep-gate.log §AC-02 | PASS (count=2) |
| G-06 / AC-03 | grep-gate.log §AC-03 | PASS (count=2) |
| G-07 / AC-06 | secret-residue.log | PASS (0 hit) |
| G-08 | typecheck.log | PASS |
| G-09 | lint.log | PASS |
| G-10 / AC-04 / AC-05 | runtime-ci-pending.md | runtime_pending (user-approved dev push 後に取得) |
```

---

## 6. exit criteria

| # | 条件 |
|---|------|
| EX-01 | §2 の local evidence ファイルと `runtime-ci-pending.md` が `outputs/phase-11/evidence/` に揃っている |
| EX-02 | `evidence-index.md` が local PASS / runtime_pending を分けて記録している |
| EX-03 | NON_VISUAL 判定の根拠が明示されている |
