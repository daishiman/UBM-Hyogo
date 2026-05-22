# Phase 6: 実装方針（実行スクリプトと evidence ログ）

## 6.1 変更対象ファイル一覧 (CONST_005)

| 種別 | パス | 内容 |
| --- | --- | --- |
| 新規 | `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/index.md` | 本仕様の入口 |
| 新規 | `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/phase-01.md` 〜 `phase-13.md` | Phase 1-13 spec |
| 新規 | `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/outputs/phase-11/before.json` | 削除前 evidence |
| 新規 | `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/outputs/phase-11/after.json` | 削除後 evidence |
| 新規 | `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/outputs/phase-11/grep-gate.txt` | grep 結果 (空) |
| 新規 | `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/outputs/phase-11/deletion-log.md` | 実行サマリ |
| 編集 | `docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md` | 冒頭に `> [SUPERSEDED by issue-638]` marker 追記 |
| 外部mutation | GitHub Actions Variables (`CLOUDFLARE_PAGES_PROJECT`) | user approval marker 保存後に DELETE 実行 |

リポジトリ内コード (`apps/` / `packages/` / `scripts/` / `.github/`) への変更は **なし**。

## 6.2 削除実行の最小スクリプト (再現可能性のため inline 記述)

```bash
#!/usr/bin/env bash
set -euo pipefail

OWNER=daishiman
REPO=UBM-Hyogo
VAR=CLOUDFLARE_PAGES_PROJECT
OUT=docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/outputs/phase-11

mkdir -p "$OUT"

# Gate G2: 認証
gh auth status >/dev/null

# Gate G1: grep gate
rg "$VAR" .github/ > "$OUT/grep-gate.txt" || true
test ! -s "$OUT/grep-gate.txt" || { echo "FAIL: grep gate hit non-zero"; exit 1; }

# Gate G3: environment scope 不在確認
for env in staging production; do
  if gh api "repos/$OWNER/$REPO/environments/$env/variables" 2>/dev/null | \
       jq -e --arg n "$VAR" '.variables[]?|select(.name==$n)' >/dev/null; then
    echo "FAIL: $VAR exists in environment $env — abort"; exit 1
  fi
done

# Step 3: 削除前 evidence
gh api "repos/$OWNER/$REPO/actions/variables" > "$OUT/before.json"
if gh api "repos/$OWNER/$REPO/actions/variables/$VAR" > "$OUT/before-single.json" 2>"$OUT/before-single.err"; then
  echo "OK: $VAR exists before deletion"
else
  echo "ALREADY_DELETED: $VAR is absent before deletion" | tee "$OUT/already-deleted.txt"
  exit 0
fi

# Gate G6: user approval marker
test -s "$OUT/evidence/user-approval-marker.md" || {
  echo "FAIL: user approval marker missing. Do not run DELETE."; exit 1;
}

# Step 5: 削除実行
gh api -X DELETE "repos/$OWNER/$REPO/actions/variables/$VAR"

# Step 6: 削除後 evidence
gh api "repos/$OWNER/$REPO/actions/variables" > "$OUT/after.json"
gh api "repos/$OWNER/$REPO/actions/variables/$VAR" 2>&1 | tee "$OUT/after-single.txt" || true

# Step 7: verify
jq -e --arg n "$VAR" '.variables|map(.name)|index($n)==null' "$OUT/after.json" \
  || { echo "FAIL: variable still present"; exit 1; }

echo "OK: $VAR deleted"
```

注: このスクリプトは Phase 7 の手動 step として実行する。`.scripts/` には commit しない（一回切りの操作のため）。

## 6.3 evidence ログのフォーマット

`outputs/phase-11/deletion-log.md`:

```markdown
# 削除実行ログ

- 実行日時: <ISO-8601>
- 実行者: <gh auth status の login>
- 削除前 total_count: 4
- 削除後 total_count: 3
- 削除前 single GET: HTTP 200, value="ubm-hyogo-web"
- 削除後 single GET: HTTP 404 Not Found
- grep gate: 0 hits in .github/
- 実行 commit (PR base): <sha>
```

## 6.4 入出力・副作用の最終定義

| 観点 | 定義 |
| --- | --- |
| 入力 | なし (定数: OWNER=daishiman, REPO=UBM-Hyogo, VAR=CLOUDFLARE_PAGES_PROJECT) |
| 出力 | `outputs/phase-11/` 配下 6 ファイル + repo state diff |
| 副作用 | user approval marker 保存後、GitHub Actions Variables から `CLOUDFLARE_PAGES_PROJECT` を 1 件削除 |
| エラーハンドリング | Gate G1-G5 failure / API HTTP 4xx (404 除く) / 5xx で中断 |
| ログ出力先 | stdout (人間確認用) + `outputs/phase-11/` (audit 用) |
