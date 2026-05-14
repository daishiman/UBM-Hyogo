# Phase 05 outputs / main

## runbook（要約）

### Step 1: release 取得

```bash
gh api repos/cloudflare/workers-sdk/releases --paginate \
  -q '.[0:10] | .[] | {tag: .tag_name, published: .published_at, body: .body}' \
  > outputs/phase-11/evidence/workers-sdk-releases.json
# undici / workerd も同様
```

### Step 2: triage grep

```bash
for f in outputs/phase-11/evidence/*-releases.json; do
  echo "=== $f ==="
  grep -iE "socket|EADDRNOTAVAIL|keep-?alive|agent pool|\\bport\\b|TIME_WAIT" "$f" | head -50
done > outputs/phase-11/evidence/triage-grep-raw.log
```

### Step 3: triage-table.md 記入

Phase 8 テンプレ使用。

### Step 4a: 改善なし

```bash
git status apps/api/package.json > outputs/phase-11/evidence/pkg-unchanged.log
```

### Step 4b: 改善あり

```bash
for N in 2 4 auto; do
  for R in 1 2 3; do
    mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage --maxWorkers=$N \
      2>&1 | tee outputs/phase-11/evidence/ab-$N-run-$R.log
    sleep 5
  done
done
```

### Step 5: package.json 編集案（採用時のみ）

```diff
- "test:coverage": "vitest run --coverage --maxWorkers=1 --minWorkers=1",
+ "test:coverage": "vitest run --coverage --maxWorkers={N}",
```

本 spec 段階では未編集。Phase 12 implementation-guide に記載。

## secret hygiene

token 値を log に出さない。evidence 保存後 grep 0 件確認。

## 次フェーズ

Phase 6 異常系。
