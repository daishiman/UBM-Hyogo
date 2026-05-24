# [#864] [fix-admin-scr-err-stg-FU-003] Phase 11 staging runtime smoke の GitHub Actions post-deploy gate 化

## メタ情報

```yaml
issue_number: 864
title: [fix-admin-scr-err-stg-FU-003] Phase 11 staging runtime smoke の GitHub Actions post-deploy gate 化
state: OPEN
priority: 高
scale: 中規模
category: 改善
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/864
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 高 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

Cloudflare Workers staging deploy 直後の `/admin` 到達確認を CI gate 化し、Server Components render error 同型 regression を自動検出する。`admin-runtime-smoke / post-deploy-staging` を新規 required status check 候補として追加する。

## 親タスク / PR

- 親 task: `TASK-FIX-ADMIN-SCR-ERR-STG-001`
- 親 PR: #849 (branch `fix/admin-server-components-render-error`)
- 親 workflow: `docs/30-workflows/fix-admin-server-components-render-error-stg/`

## 背景

親 task の Phase 11 は staging `/admin` 到達確認を user-gated `runtime_pending` として残した。build/type/lint/unit test を通過し runtime のみで発火する Server Components render error クラスは、CI gate でしか deploy 前検知できない。`runtime_pending` 慢性化により workflow gate 品質が形骸化。

## スコープ

- `.github/workflows/admin-runtime-smoke.yml` 新規 (または既存 deploy workflow に job 追加)
- staging deploy 完了を `needs:` / `workflow_run` で依存
- authenticated session 込み `/admin` HTTP 200 probe
- `wrangler tail` (`scripts/cf.sh tail` 経由) で 60 秒 log capture → `error.boundary.caught` (scope=admin) 不発火 grep gate
- test admin (`manjumoto.daishi@senpai-lab.com`) session を GitHub Secrets 経由で確立
- `dev` / `main` required status check 候補として登録準備 (実 PUT は user 明示承認後)

## 受け入れ条件 (DoD 抜粋)

- AC-1: admin runtime smoke job 定義済み
- AC-2: staging deploy 完了で自動 trigger
- AC-3: `/admin` HTTP 200 probe pass
- AC-4: `error.boundary.caught` (scope=admin) 不発火検証 pass
- AC-5: 意図的 regression PR で gate fail を 1 回 evidence 取得
- AC-7: `scripts/cf.sh` 経由のみ (直接 `wrangler` 呼出無)

## 仕様書

`docs/30-workflows/unassigned-task/fix-admin-scr-err-stg-followup-003-staging-runtime-smoke-ci-gate.md`

## 関連

- CLAUDE.md「ブランチ戦略」「Cloudflare 系 CLI 実行ルール」
- task-18 `playwright-smoke` / `verify-design-tokens` と同列の required status check 設計
- followup-001 (auth env 統一) / followup-002 (alert policy) と連携
