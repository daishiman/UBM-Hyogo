# [#866] [issue-55-followup-001] miniflare D1 full suite ephemeral port 枯渇 (EADDRNOTAVAIL) の構造的解消

## メタ情報

```yaml
issue_number: 866
title: [issue-55-followup-001] miniflare D1 full suite ephemeral port 枯渇 (EADDRNOTAVAIL) の構造的解消
state: OPEN
priority: 中
scale: 中規模
category: 改善
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/866
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

`apps/api` の D1 full suite (`vitest.d1.config.ts`) を実行すると、miniflare の ephemeral port 枯渇により 100+ 件の `EADDRNOTAVAIL` failure が発生する。failing file を個別に再実行すると pass するため Issue #55 由来の regression ではないが、D1 full suite が CI / Phase 9・Phase 11 で正確な regression シグナルを取れない状態が常態化している。

## 発見元

- `docs/30-workflows/issue-55-notification-channel-and-optout/outputs/phase-11/phase-11-manual-test.md`
  - 109 failures は全件 EADDRNOTAVAIL (miniflare ephemeral port 枯渇) を明記

## 仕様書

- `docs/30-workflows/unassigned-task/issue-55-followup-001-miniflare-d1-ephemeral-port-exhaustion.md`

## 完了条件

- [ ] `pnpm -F @ubm-hyogo/api test -- --config vitest.d1.config.ts` 1 コマンドで green
- [ ] 連続 3 回実行で `EADDRNOTAVAIL` 0 件
- [ ] macOS / Linux CI の双方で安定確認
- [ ] vitest pool / miniflare lifecycle の選定理由が lessons-learned に記録
- [ ] CI workflow が config 単位の 1 コマンド実行に統合

## 関連

- 関連 unassigned-task: `02b-followup-003-miniflare-d1-integration-test`、`task-04a-followup-001-miniflare-contract-leak-suite`、`task-issue-577-followup-003-test-grouping-by-d1-usage`
- 親 issue: #55
