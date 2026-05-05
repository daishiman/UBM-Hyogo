# UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001: production observability target diff script

> 発生元: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-12/unassigned-task-detection.md`

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001 |
| 分類 | follow-up / observability-automation |
| 対象 | `apps/web` production Worker Logs / Tail / Logpush / Analytics target |
| 優先度 | High |
| ステータス | transferred_to_workflow / implementation_complete |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 |
| 作成日 | 2026-04-30 |

## Close-out trace

- 実装 workflow: `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/`
- 実装: `scripts/observability-target-diff.sh`, `scripts/lib/redaction.sh`
- 検証: `tests/unit/redaction.test.sh`, `tests/integration/observability-target-diff.test.sh`
- 状態: Phase 1-12 completed / Phase 13 pending_user_approval

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-11/tail-sample.md`
- 症状: observability の確認が tail sample template に閉じており、Logpush / Analytics target が旧 Worker 名に固定されていないかを機械的に比較できない。
- 参照: `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-02/route-secret-observability-design.md`

## 目的

production deploy 後の障害観測漏れを防ぐため、`ubm-hyogo-web-production` と旧 Worker の observability target 差分を読み取り専用で出力する script を追加する。

## スコープ

### 含む

- Workers Logs / Tail / Logpush / Analytics Engine の対象 Worker 名を確認する script または runbook-backed checker
- 旧 Worker 名を参照する observability target の検出
- output から secret 値、token、private sink credential を除外する redaction
- `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` と整合する検証導線

### 含まない

- Logpush job の作成・削除・変更
- Analytics Engine dataset の作成・削除・変更
- external log sink の credential 発行
- production deploy 実行

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Logpush / Analytics API の plan 差により取得できない項目がある | Phase 2 で取得可能性を matrix 化し、取得不可項目は dashboard fallback として明示する |
| log sink URL や credential を出力してしまう | host / dataset / worker target 以外は redact し、token-like 文字列を出力禁止にする |
| tail 実行を実測 PASS と誤記する | script は target diff に閉じ、tail sample は deploy 後承認 operation の evidence と分離する |
| 旧 Worker を誤って削除する流れに接続される | 本タスクは read-only diff に限定し、mutation command を実装しない |

## 検証方法

### 単体検証

```bash
pnpm lint
pnpm typecheck
```

期待: 追加 script と redaction logic がエラーなく通る。

### 統合検証

```bash
bash scripts/cf.sh whoami
# observability target diff script command は実装時に確定する
```

期待: `ubm-hyogo-web-production` を target とする observability 設定と、旧 Worker 名を参照する設定の有無が redacted output で確認できる。

## 完了条件

- observability target diff の出力形式が docs に記録されている
- credential / secret / sink token が出力されないことを検証している
- UT-06-FU-A-PROD-ROUTE-SECRET-001 の runbook から script への導線が追加されている
