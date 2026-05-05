# task-issue-347-cloudflare-analytics-export-automation-001

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-347-cloudflare-analytics-export-automation-001 |
| タスク名 | Cloudflare Analytics monthly export automation |
| 分類 | implementation / operations / NON_VISUAL |
| 発生元 | `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-12/unassigned-task-detection.md` |
| 優先度 | 中 |
| 規模 | 小〜中 |
| 状態 | unassigned |

## Why

Issue #347 decision workflow fixed the canonical export method, retention, redaction rules, and evidence path. Monthly manual export is acceptable for the decision, but automation reduces missed monthly evidence after the contract is stable.

## What

Implement a scheduled export path:

- `scripts/fetch-cloudflare-analytics.ts`
- GitHub Actions cron or release ops command
- `op run --env-file=.env` / Cloudflare API token injection
- JSON output matching `analytics-export-YYYYMMDD-HHmm-UTC.json`
- redaction check generation

## Acceptance Criteria

- Uses only aggregate fields defined by issue-347 storage policy.
- Writes to `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/`.
- Does not store URL query, request body, IP address, User-Agent, email, member ID, or session token.
- Handles Cloudflare GraphQL rate limit failure without committing partial output.
- Does not use Logpush or Free plan external features.

## Boundary

This is an independent follow-up after the decision workflow. It requires code, secret handling, and runtime Cloudflare validation, so it is intentionally not folded into the docs-only decision task.

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-11/long-term-evidence/`
- 症状: docs-only decision cycle では runtime Cloudflare API token / dashboard session が無いため、aggregate-only schema sample と redaction-check のみを配置できた。runtime 値で置換するための field set / grep command を仕様書側で固定する必要があった。
- 知見: aggregate field 集合 (`requests` / `totalRequests` / `errors5xx` / `readQueries` / `writeQueries` / `invocations`) と redaction grep pattern を spec で先に固定すれば、runtime 取得時の検証を機械的に行える。
- 参照: `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-12/unassigned-task-detection.md`、`docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| Cloudflare GraphQL rate limit による途中失敗で部分 JSON が commit される | 高 | `scripts/fetch-cloudflare-analytics.ts` 内で全 query 成功時のみ tmp → 最終パスへ rename。失敗時は exit code 非ゼロで commit step をスキップ |
| API token が repo / log に流出する | 高 | `op run --env-file=.env` 経由で Cloudflare API token を注入。GitHub Actions 側は OIDC + 1Password Service Account のみを使用し、token を `secrets.*` 直書きしない |
| Logpush / Free plan 外機能を誤って利用する | 高 | Phase 9 `free-plan-constraints.md` に列挙された使用可能 API のみを参照。fetcher 側で endpoint allowlist を定数化 |
| aggregate 以外のフィールド（IP / UA / URL query / email / member ID / session token）を取得して storage policy を破る | 高 | Phase 5 `storage-policy.md` が許可する aggregate field set のみを GraphQL query に含める。出力後 `phase-06/redaction-rules.md` の redaction grep を実行し非ゼロヒットで abort |
| 月次 cron がタイムゾーン差で月をまたぎ評価対象月がずれる | 中 | UTC 基準で `analytics-export-YYYYMMDD-HHmm-UTC.json` を生成し、cron schedule も UTC 1 日 00:30 に固定 |
| OpenNext Workers の binding 変更で fetcher の前提が壊れる | 低 | `deployment-cloudflare-opennext-workers.md` §14 を参照点とし、変更検知時は本タスクを再 plan |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- node scripts/fetch-cloudflare-analytics.ts --dry-run --month 2026-04
```

期待:
- typecheck / lint が PASS
- `--dry-run` モードで GraphQL query のみ実行され、出力ファイルは生成されない
- exit code 0、stdout に対象 aggregate フィールド一覧が出力される

### 統合検証

```bash
op run --env-file=.env -- node scripts/fetch-cloudflare-analytics.ts --month 2026-04
grep -E "(email|member_id|session|ip_address|user_agent|url_query)" \
  docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/analytics-export-*.json
```

期待:
- 出力 JSON が `analytics-export-YYYYMMDD-HHmm-UTC.json` 形式で生成される
- redaction grep のヒット件数が **0**（aggregate-only である証跡）
- JSON schema が `outputs/phase-11/evidence/sample-export/analytics-export-schema-sample.json` と一致

## スコープ

### 含む

- `scripts/fetch-cloudflare-analytics.ts` の新規実装（aggregate field 取得・redaction check 含む）
- GitHub Actions monthly cron workflow（UTC 月初 00:30 実行）
- `op run` 経由の Cloudflare API token 注入経路
- 出力ファイルの長期エビデンスディレクトリへの commit 自動化
- redaction grep を CI に組み込み非ゼロヒットで fail

### 含まない

- Issue #347 decision workflow 内の Phase 11 sample 差し替え（→ 本タスクの runtime cycle で実測値が出た時点で別 PR にて差し替え）
- Logpush / R2 / Workers Analytics Engine など Free plan 外機能の利用検討（→ Free plan 制約により恒久的にスコープ外）
- 管理画面からの手動エクスポート UI（→ MVP では cron 自動化のみで十分。UI 化は需要が出てから別未タスクとして登録）
- 過去月の遡及エクスポート（→ Cloudflare GraphQL の retention 制約により本タスクでは保証しない）

## 参照情報

- `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-05/storage-policy.md`
- `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-06/redaction-rules.md`
- `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-09/free-plan-constraints.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`

