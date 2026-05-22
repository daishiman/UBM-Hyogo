# Phase 8: staging 検証

[実装区分: 実装仕様書]

## 1. デプロイ（ユーザー承認後）
```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```
> 不可逆 mutation を含むため AI 単独実行禁止。ユーザー明示承認 evidence を `outputs/phase-08/user-approval-deploy.txt` に保存。

## 2. smoke 再実行
```bash
bash scripts/with-env.sh -- bash -c '
  mkdir -p outputs/phase-08/evidence
  bash scripts/smoke/runtime-attendance-provider.sh staging \
    --out-dir outputs/phase-08/evidence \
    --ci-summary
'
```
- 期待:
  - exit 0
  - `outputs/phase-08/evidence/summary.json` で `status:"PASS"`、`routes[].status` 全 PASS
  - `runtime-smoke.log` 末尾 `runtime attendance provider smoke PASS`

## 3. backend-ci 再 trigger
- 修正 PR 上で `runtime smoke staging / smoke` が PASS することを確認
- 失敗時は Phase 2 step A から再実行

## 4. evidence
```
outputs/phase-08/
  ├── user-approval-deploy.txt
  ├── deploy.log
  └── evidence/
      ├── runtime-smoke.log
      └── summary.json
```

## 5. Phase 8 DoD
- staging smoke 6 route 全 PASS
- backend-ci job が green
