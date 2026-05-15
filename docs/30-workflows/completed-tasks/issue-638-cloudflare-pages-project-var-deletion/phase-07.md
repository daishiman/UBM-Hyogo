# Phase 7: 実行コマンド・検証手順

## 7.1 事前準備

```bash
cd <repo-root>
git checkout docs/issue-638-cloudflare-pages-project-var-deletion
gh auth status  # daishiman 認証 / repo scope を確認
```

## 7.2 削除実行ステップ

### Step 1: 認証 & environment scope 確認

```bash
gh auth status

gh api repos/daishiman/UBM-Hyogo/environments/staging/variables \
  | jq '.variables | map(.name) | index("CLOUDFLARE_PAGES_PROJECT")'
# → null を期待

gh api repos/daishiman/UBM-Hyogo/environments/production/variables \
  | jq '.variables | map(.name) | index("CLOUDFLARE_PAGES_PROJECT")'
# → null を期待
```

### Step 2: grep gate 再確認

```bash
OUT=docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/outputs/phase-11
mkdir -p "$OUT"
rg CLOUDFLARE_PAGES_PROJECT .github/ > "$OUT/grep-gate.txt" || true
test ! -s "$OUT/grep-gate.txt" && echo "OK: grep gate 0 hits"
```

### Step 3: 削除前 evidence

```bash
gh api repos/daishiman/UBM-Hyogo/actions/variables \
  | jq . > "$OUT/before.json"
gh api repos/daishiman/UBM-Hyogo/actions/variables/CLOUDFLARE_PAGES_PROJECT \
  | jq . > "$OUT/before-single.json"
```

### Step 4: 削除実行 ⚠️ 外部 mutation

実行前に `outputs/phase-11/evidence/user-approval-marker.md` を作成し、承認者・日時・対象コマンド・rollback コマンドを記録する。marker が無い状態では以下を実行しない。

```bash
test -s "$OUT/evidence/user-approval-marker.md"
gh api -X DELETE repos/daishiman/UBM-Hyogo/actions/variables/CLOUDFLARE_PAGES_PROJECT
# 期待: HTTP 204 (gh api は標準出力に何も出さず exit 0)
```

### Step 5: 削除後 evidence + verify

```bash
gh api repos/daishiman/UBM-Hyogo/actions/variables \
  | jq . > "$OUT/after.json"

gh api repos/daishiman/UBM-Hyogo/actions/variables/CLOUDFLARE_PAGES_PROJECT 2>&1 \
  | tee "$OUT/after-single.txt" || true
# 期待: "HTTP 404" 文字列を含む

# verify
jq -e '.variables | map(.name) | index("CLOUDFLARE_PAGES_PROJECT") == null' "$OUT/after.json"
# → true (exit 0) を期待

BEFORE_COUNT=$(jq '.total_count' "$OUT/before.json")
AFTER_COUNT=$(jq '.total_count' "$OUT/after.json")
test "$AFTER_COUNT" -eq "$((BEFORE_COUNT - 1))" && echo "OK: count -1"
```

### Step 6: 旧 spec に supersede marker 追記

```bash
# docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md
# の冒頭 (タイトル直下) に以下を追記:
#
# > [SUPERSEDED by issue-638-cloudflare-pages-project-var-deletion]
# > Date: 2026-05-14
# > 本仕様は `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/` に置換された。
# > 履歴保全のため本ファイルは削除せず残置する。
```

### Step 7: deletion-log.md 作成

`outputs/phase-11/deletion-log.md` を Phase 6.3 のフォーマットに従い手動作成。

## 7.3 ローカル検証コマンド (CONST_005)

```bash
# docs 変更のみのため、コードビルドは変更影響なしの sanity check
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# 期待: いずれも exit 0。apps/packages/scripts/.github に差分が無い場合は sanity evidence であり、既存コード起因 failure は本 task blocking としない。
```

## 7.4 検証ゴール

すべて満たすことを確認:

- [ ] `outputs/phase-11/before.json` に `CLOUDFLARE_PAGES_PROJECT` が含まれる
- [ ] `outputs/phase-11/after.json` に `CLOUDFLARE_PAGES_PROJECT` が含まれない
- [ ] `outputs/phase-11/after-single.txt` が "HTTP 404" を含む
- [ ] `outputs/phase-11/grep-gate.txt` が空ファイル
- [ ] `total_count` が削除前 - 1
- [ ] 旧 unassigned-task spec 冒頭に SUPERSEDED marker
- [ ] `pnpm typecheck` / `pnpm lint` exit 0
