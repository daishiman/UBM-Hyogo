# [#524] ops: Slack #ubm-hyogo-ops への運用通知統合（post-release dashboard / analytics export）

## メタ情報

```yaml
issue_number: 524
title: ops: Slack #ubm-hyogo-ops への運用通知統合（post-release dashboard / analytics export）
state: OPEN
priority: -
scale: -
category: -
status: -
created_date: 2026-05-06
updated_date: 2026-06-10
url: https://github.com/daishiman/UBM-Hyogo/issues/524
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | - |
| 規模 | - |
| ステータス | - |

---

## 背景

> **2026-06-08 更新**: CF API Token の 90 日 rotation 運用は撤廃した。
> これに伴い旧「CF rotation reminder → Slack 投稿」は**対象外**とし、本 Issue の通知統合スコープを **2 件**（post-release dashboard / analytics export）に縮小する。
> 経緯の正本: `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/`

2026-05-06 までに以下 2 件の運用系自動化が `implemented-local` で同期されたが、いずれも GitHub Actions / Issue 起票止まりで Slack 通知導線が未整備。運用ハンドオフ性向上のため Slack 単一チャンネルへ集約する。

## 通知先

- Workspace: `w1618436027-ek2505248`
- Channel: `#ubm-hyogo-ops`（新規作成）

## 通知統合対象

| 由来 | 種別 | 現状の出力先 | Slack 統合後の期待 |
| --- | --- | --- | --- |
| Issue #351 | post-release dashboard automation（24h metrics 自動収集） | GitHub Actions artifact | dashboard.md の summary を `#ubm-hyogo-ops` に投稿（PII 非露出） |
| Issue #484 | Cloudflare Analytics monthly export | GitHub Actions artifact | export 成功 / 失敗を `#ubm-hyogo-ops` に投稿（zone/account redaction 維持） |

## スコープ

- [ ] Slack channel `#ubm-hyogo-ops` 作成と incoming webhook（または GitHub Actions Slack action）の secret 登録
- [ ] 上記 2 ワークフローからの投稿実装（post-release dashboard / analytics export）
- [ ] secret hygiene（Token 値 / Token ID / scope 値 / zone / account の redaction 継承）
- [ ] failure / success の双方を post（silent failure 防止）

## スコープ外（本 Issue では扱わない）

- タスク仕様書（`docs/30-workflows/...`）の作成 — 別途必要になった時点で起票
- 09b incident runbook Slack delivery（Issue #349 で別管理）

## 参照

- `.github/workflows/post-release-dashboard.yml`
- `.github/workflows/cloudflare-analytics-export.yml`
- 撤廃経緯: `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/`
