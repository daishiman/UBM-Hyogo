# 品質チェックリスト（Phase 9）

## 軸 1: 静的品質ゲート

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0
- [ ] `pnpm vitest run scripts/cf-audit-log` 全て green
- [ ] focused coverage（fetcher / analyzer）≥ 80%

### 実行ログ記録欄

```text
$ pnpm typecheck
... (exit code: ___)

$ pnpm lint
... (exit code: ___)

$ pnpm vitest run scripts/cf-audit-log
... (exit code: ___)
```

## 軸 2: 7 日 baseline 学習

- [ ] `outputs/phase-11/baseline-7day-thresholds.json` がコミット済
- [ ] 学習期間 7 日（連続失敗なし）
- [ ] shadow alerting モードでの誤検知率 ≤ 5%
- [ ] rotation 期間（DERIV-03 runbook と meta-data 連携）が学習対象から除外されている
- [ ] `outputs/phase-9/baseline-review-template.md` を埋めて commit

## 軸 3: コスト

- [ ] D1 30 日後想定行数 ≤ free tier 上限
- [ ] D1 read/write/月 ≤ free tier
- [ ] GitHub Actions 分/月 ≤ private repo の場合 2,000min（public は無制限）
- [ ] cost 試算を `phase-9.md` に転記

## 軸 4: セキュリティ

- [ ] 監視 Token scope = `Account > Audit Logs:Read` only
- [ ] deploy Token scope に変更なし（`bash scripts/cf.sh whoami` で確認）
- [ ] workflow `permissions:` が `issues: write` 最小
- [ ] secret value / token / 個人情報 を artifact / log / Issue body に出力しない
- [ ] 監視 Token と deploy Token が独立 rotation 可能

## 全体 DoD

- [ ] 軸 1 〜 4 のすべての check box が埋まっている
- [ ] 不備があった場合、対応 PR or `unassigned-task` を起票
