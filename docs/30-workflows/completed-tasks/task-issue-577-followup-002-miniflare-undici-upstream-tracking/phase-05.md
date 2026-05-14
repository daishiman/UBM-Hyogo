# Phase 5: 実装ランブック

## 全体フロー

```
Step 1: 上流 release 取得（gh api）
Step 2: triage 表記入
Step 3: 改善判定
  ├─ なし → Step 4a（維持 evidence）→ 完了
  └─ あり → Step 4b（A/B 実行）→ Step 5（package.json 編集案記載）
```

## Step 1: release 取得

```bash
# 直近 10 release を取得
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

注: `gh` は `GH_TOKEN` を環境変数経由で読む。値を `cat` / log 出力しない。

## Step 2: triage 表記入

```bash
# キーワード grep（複数キーワード一括）
for f in outputs/phase-11/evidence/*-releases.json; do
  echo "=== $f ==="
  grep -iE "socket|EADDRNOTAVAIL|keep-?alive|agent pool|\\bport\\b|TIME_WAIT" "$f" \
    | head -50
done > outputs/phase-11/evidence/triage-grep-raw.log
```

結果を `outputs/phase-11/evidence/triage-table.md` に Phase 8 テンプレで記入する。

## Step 3: 改善判定

各 hit について以下を確認:
- description に「socket reuse 改善」「pool sizing fix」「port exhaustion 緩和」等の挙動変化記述があるか
- 該当 PR / commit URL を triage 表に記録
- judgment 列に `あり` / `なし` / `保留` を記入

## Step 4a: 改善なし時（維持 evidence 保存）

```bash
git status apps/api/package.json > outputs/phase-11/evidence/pkg-unchanged.log
git diff apps/api/package.json    >> outputs/phase-11/evidence/pkg-unchanged.log
echo "RESULT: 上流改善検知なし。--maxWorkers=1 --minWorkers=1 を維持する。" \
  >> outputs/phase-11/evidence/pkg-unchanged.log
```

→ AC-3 充足。Phase 12 へ進む。

## Step 4b: 改善あり時（A/B 実行）

```bash
for N in 2 4 auto; do
  for R in 1 2 3; do
    mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage --maxWorkers=$N \
      2>&1 | tee outputs/phase-11/evidence/ab-$N-run-$R.log
    sleep 5
  done
  # 3 回すべて PASS / 0 EADDRNOTAVAIL を確認
  PASS_COUNT=$(grep -c "133 passed" outputs/phase-11/evidence/ab-$N-run-*.log)
  EAD_COUNT=$(grep -c "EADDRNOTAVAIL" outputs/phase-11/evidence/ab-$N-run-*.log)
  echo "N=$N: PASS_RUNS=$PASS_COUNT (need 3) / EADDRNOTAVAIL=$EAD_COUNT (need 0)"
  if [ "$PASS_COUNT" -lt 3 ] || [ "$EAD_COUNT" -gt 0 ]; then
    echo "N=$N 不採用。次候補なし or 一つ前を採用。"
    break
  fi
done
```

採用値を `outputs/phase-11/evidence/ab-summary.md` に記録。

## Step 5: package.json 編集案（A/B 採用時のみ）

採用 N に応じた編集案を Phase 12 implementation-guide.md に記載する。**本仕様書段階では編集しない**。

```diff
- "test:coverage": "vitest run --coverage --maxWorkers=1 --minWorkers=1",
+ "test:coverage": "vitest run --coverage --maxWorkers={N}",
```

注: 採用時は `--minWorkers` を削除し、`--maxWorkers=<採用N>` だけを正本とする。

## secret hygiene

- `GH_TOKEN` / `CLOUDFLARE_API_TOKEN` を `echo` / `cat` で出力しない
- evidence ファイル保存後に `grep -E "ghp_|cf_|CLOUDFLARE_API_TOKEN" outputs/phase-11/evidence/` で 0 件確認

## 次フェーズへの引き継ぎ事項

Phase 6 で A/B 異常系（flaky / major breaking / macOS↔Linux 差分）への対処を整理する。
