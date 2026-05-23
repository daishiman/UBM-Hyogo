# Phase 9: 品質ゲート（task-01）

| 項目 | 値 |
|------|----|
| 入力 | `phase-8.md` 完了 |
| 出力 | 品質 gate コマンド一覧と PASS 条件 |

---

## 1. 品質ゲート一覧

| # | gate | コマンド | PASS 条件 |
|---|------|---------|----------|
| G-01 | YAML 構文 | `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/web-cd.yml'))"` | exit 0 |
| G-02 | actionlint（任意） | `mise exec -- pnpm dlx actionlint .github/workflows/web-cd.yml` | violation 0 もしくは skip |
| G-03 | shellcheck（Verify step inline shell） | `mise exec -- pnpm dlx shellcheck -s bash <<<'if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then echo "::error::..."; exit 1; fi'` | violation 0 |
| G-04 | secret 名 grep gate (旧名除去) | `! grep -q "CF_TOKEN_WORKERS" .github/workflows/web-cd.yml` | exit 0 |
| G-05 | secret 名 grep gate (新名 2 箇所) | `[ "$(grep -c 'secrets.CLOUDFLARE_API_TOKEN' .github/workflows/web-cd.yml)" = "2" ]` | exit 0 |
| G-06 | Verify step grep gate | `[ "$(grep -c 'Verify CF token is present' .github/workflows/web-cd.yml)" = "2" ]` | exit 0 |
| G-07 | secret 値 docs 残留 gate | `! grep -rE 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' .github/workflows/web-cd.yml docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/` | exit 0 |
| G-08 | typecheck（PR 全体方針） | `mise exec -- pnpm typecheck` | exit 0 |
| G-09 | lint（PR 全体方針） | `mise exec -- pnpm lint` | exit 0 |
| G-10 | dev push 後の web-cd run | `gh run view "$RUN_ID" --json conclusion --jq '.conclusion'` が `"success"` | "success" |

G-08 / G-09 は CLAUDE.md の PR 作成フロー「品質検証は次の3コマンド」に準拠（`pnpm install --force` は依存変更がないため任意）。

---

## 2. coverage 取り扱い

本 task は YAML 編集のみで apps/web / apps/api のソースコード変更なし。**coverage gate 適用対象外（NON_VISUAL / coverageTier=n/a）**。

`docs/00-getting-started-manual/specs/` 配下の coverage 70% 規定は code 変更時のみ適用。本 task では evidence として `coverage 適用外（YAML edit only）` を Phase 11 に記録する。

---

## 3. 失敗時の自動修復方針

| gate | 失敗時の対応 |
|------|-------------|
| G-01 | YAML インデント崩れを再編集 |
| G-04 / G-05 / G-06 | 該当行を再置換 / step 再追加 |
| G-07 | 該当 commit を amend する前に user 報告（secret 漏洩の可能性） |
| G-08 / G-09 | 既存無関係エラーであれば本 PR スコープ外として skip 判断、関連していれば最小修正 |
| G-10 | Phase 7 §4 の切り分け表に従う |

---

## 4. exit criteria

| # | 条件 |
|---|------|
| EX-01 | G-01..G-10 がすべて PASS |
| EX-02 | coverage 適用外の判断が記録されている |
| EX-03 | G-07 で secret 値の混入がない |
