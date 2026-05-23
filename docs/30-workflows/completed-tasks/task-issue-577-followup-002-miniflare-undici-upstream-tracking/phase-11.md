# Phase 11: 手動評価実行

## 目的

Phase 5 runbook に従って実 release triage を行い、改善検知時は A/B 評価を実行する。evidence をすべて `outputs/phase-11/evidence/` 配下に保存する。

## 実行手順（再掲）

### Step 1: release 取得

```bash
gh api repos/cloudflare/workers-sdk/releases --paginate \
  -q '.[0:10] | .[] | {tag: .tag_name, published: .published_at, body: .body}' \
  > outputs/phase-11/evidence/workers-sdk-releases.json

gh api repos/nodejs/undici/releases --paginate \
  -q '.[0:10] | .[] | {tag: .tag_name, published: .published_at, body: .body}' \
  > outputs/phase-11/evidence/undici-releases.json

gh api repos/cloudflare/workerd/releases --paginate \
  -q '.[0:10] | .[] | {tag: .tag_name, published: .published_at, body: .body}' \
  > outputs/phase-11/evidence/workerd-releases.json
```

### Step 2: triage キーワード grep

```bash
for f in outputs/phase-11/evidence/*-releases.json; do
  echo "=== $f ==="
  grep -iE "socket|EADDRNOTAVAIL|keep-?alive|agent pool|\\bport\\b|TIME_WAIT" "$f" | head -50
done > outputs/phase-11/evidence/triage-grep-raw.log
```

### Step 3: triage-table.md 記入

Phase 8 テンプレに従って `outputs/phase-11/evidence/triage-table.md` を作成。

### Step 4a / 4b: 分岐実行

- 改善なし → Phase 5 Step 4a（`pkg-unchanged.log` 保存）
- 改善あり → Phase 5 Step 4b（A/B 実行）

### Step 5: secret hygiene grep

```bash
grep -rE "ghp_[A-Za-z0-9]{36,}|cf_[A-Za-z0-9]+|CLOUDFLARE_API_TOKEN=" \
  outputs/phase-11/evidence/ \
  > outputs/phase-11/evidence/secret-hygiene-grep.log || true
wc -l outputs/phase-11/evidence/secret-hygiene-grep.log  # 期待 0
```

### Step 6: apps/api untouched 確認

```bash
git diff --stat apps/api/src apps/api/migrations apps/api/wrangler.toml \
  > outputs/phase-11/evidence/apps-api-untouched.log
# 期待: 出力空（差分 0）
```

## 完了条件

- [ ] `triage-table.md` 存在
- [ ] 改善なしルート: `pkg-unchanged.log` 存在 / 改善ありルート: `ab-{N}-run-{1,2,3}.log` + `ab-summary.md` 存在
- [ ] `secret-hygiene-grep.log` 0 行
- [ ] `apps-api-untouched.log` 差分 0

## user 承認境界

- read-only release 取得（Step 1-2）と必要な local vitest A/B は本実行サイクル内で実施可
- user 承認必須は `apps/api/package.json` 編集、commit、push、PR、GitHub Issue 操作に限定

## evidence 一覧（実行時生成）

```
outputs/phase-11/evidence/
├── workers-sdk-releases.json
├── undici-releases.json
├── workerd-releases.json
├── triage-grep-raw.log
├── triage-table.md
├── pkg-unchanged.log              # 改善なし時
├── ab-2-run-{1,2,3}.log           # 改善あり時
├── ab-4-run-{1,2,3}.log           # 同上 & ab-2 green 時
├── ab-auto-run-{1,2,3}.log        # 同上 & ab-4 green 時
├── ab-summary.md                   # 改善あり時
├── secret-hygiene-grep.log
└── apps-api-untouched.log
```

## 次フェーズへの引き継ぎ事項

Phase 12 で結論をドキュメントに反映し、unassigned placeholder を consumed trace 化する。
