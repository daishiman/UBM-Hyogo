# Manual Ops Checklist — 手動運用チェックリスト

> パス: outputs/phase-11/manual-ops-checklist.md
> 参照元: cost-guardrail-runbook.md, observability-matrix.md

## 月次チェックリスト

実施日: __________ / 実施者: __________

### Cloudflare Pages

- [ ] CF Dashboard → Pages → ubm-hyogo-web → Deployments でビルド数を確認
  - 今月のビルド数: _______ / 500
  - 警戒ライン (400) 超えていないか
- [ ] CF Dashboard → Pages → ubm-hyogo-web-staging → Deployments でステージングビルド数を確認
  - 今月のビルド数: _______ / 500 (production + staging 合算)

### GitHub Actions

- [ ] GitHub → Settings → Billing and plans → Actions usage で使用分を確認
  - 今月の使用分: _______ min / 2000 min (private repo の場合)
  - 警戒ライン (1600 min) 超えていないか

---

## 週次チェックリスト

実施日: __________ / 実施者: __________

### Cloudflare Workers

- [ ] CF Dashboard → Workers → Analytics (直近7日) で日別リクエスト数を確認
  - 最大値/日: _______ / 100,000
  - 警戒ライン (80,000) 超えた日があるか

### Cloudflare D1

- [ ] CF Dashboard → D1 → ubm-hyogo-db-prod → Metrics で reads/日 と storage を確認
  - 最大 reads/日: _______ / 5,000,000
  - Storage: _______ / 5GB
  - 警戒ライン (reads: 4,000,000 / storage: 4GB) 超えていないか
- [ ] CF Dashboard → D1 → ubm-hyogo-db-staging → Metrics で同様に確認

---

## 異常時の対処フロー

### Workers > 95,000 req/日

1. アクセスログで bot / crawler を確認
2. 低優先 API を degrade (503 返却)
3. キャッシュ強化を検討

### Pages builds > 480/月

1. CI の冗長 run を停止
2. feature branch へのデプロイを一時停止
3. main マージ CD のみ残す

### 本番エラー率上昇時の rollback

1. CF Dashboard → Pages → ubm-hyogo-web → Deployments
2. 前のデプロイを選択 → "Rollback to this deployment"
3. 確認後 issue を作成して原因調査

---

## 参照

- [observability-matrix.md](../phase-02/observability-matrix.md)
- [cost-guardrail-runbook.md](../phase-05/cost-guardrail-runbook.md)
