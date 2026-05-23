# Phase 13: PR・振り返り

[実装区分: 実装仕様書]

## 1. 目的

Phase 1-12 の成果を 1 つの PR にまとめ、`dev` ブランチへマージするまでの commit / push / PR 発行と振り返りを行う。

> **user-gated**: commit / push / PR は CLAUDE.md「PR作成の完全自律フロー」とユーザー明示承認に従う。

## 2. 事前確認

- Phase 11 で取得した runtime evidence（Slack 着信 + 各種 log）が `outputs/phase-11/evidence/` に揃っている
- `git status` で `apps/` / `packages/` に意図しない diff がない
- `git diff dev...HEAD --stat` で変更が `infra/cloudflare-alerts/` / `docs/30-workflows/ut-17-followup-006-*/` / `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` / 旧 unassigned-task 参照 に閉じている

## 3. PR 作成手順（CLAUDE.md 準拠）

### Step 1: dev 同期

```bash
git fetch origin dev
git checkout dev && git pull --ff-only origin dev
git checkout feat/ut-17-followup-006-alert-dedup-kv-dashboard-monitoring
git merge dev   # conflict は CLAUDE.md 方針に従う
```

### Step 2: 品質検証

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test:alerts
```

### Step 3: commit

`infra/` 変更 / `docs/` 変更 / runbook 更新を意味的に 1-3 コミットに整理（branch protection 要件に従い、線形履歴）。

### Step 4: push + PR

```bash
git push -u origin HEAD
gh pr create --base dev --title "feat(ut-17-followup-006): ALERT_DEDUP_KV usage / latency monitoring via cloudflare-alerts IaC" --body "$(cat <<'EOF'
## Summary
- `infra/cloudflare-alerts/policies/workers-kv-*.json` を追加し、`ALERT_DEDUP_KV` の writes / storage 観測を IaC 化
- 既設 `scripts/cf.sh alerts apply/diff` 経路に組み込み、cf-webhook → `/internal/alert-relay` → Slack の経路を再利用
- runbook `ut-17-alert-relay-monthly-healthcheck.md` に新 policy を反映、四半期見直し手順を追記

Refs #702

## Test plan
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test:alerts`
- [ ] `pnpm cf:alerts:diff` 適用前後の evidence を `outputs/phase-11/` に保存
- [ ] staging で擬似発火 → Slack staging チャネル着信を確認

EOF
)"
```

## 4. 振り返り（retrospective）

`outputs/phase-13/retrospective.md` に以下を記録:

| 項目 | 内容 |
| --- | --- |
| 計画 vs 実績 | Phase 別の所要時間・差分 |
| 苦戦点 | Cloudflare API の KV alert_type 確認 / namespace filter 仕様 / staging baseline 取得 |
| 副次成果 | IaC schema 拡張 / quota-base.json への KV エントリ追加 |
| 次回 follow-up 候補 | KV operation error metrics 構造化（followup-005）/ production apply 別 wave |
| skill feedback | task-specification-creator / aiworkflow-requirements への提案 |

## 5. 成果物

| パス | 種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-13/pr-url.md` | 新規 | 作成された PR URL と base / head |
| `outputs/phase-13/retrospective.md` | 新規 | 振り返り |

## 6. 完了条件 (DoD)

- [ ] PR が `dev` 宛で作成される。Cloudflare apply / Slack runtime smoke 未取得なら `Refs #702` を使い、close keyword は使わない
- [ ] CI（typecheck / lint / test / cloudflare-alerts-drift）が GREEN
- [ ] retrospective が記録済
- [ ] production apply / `enabled:true` rollout は user-gated とすることが明示されている
