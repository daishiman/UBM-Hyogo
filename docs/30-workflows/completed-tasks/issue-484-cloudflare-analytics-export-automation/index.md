# タスク仕様書: Issue #484 — Cloudflare Analytics monthly export automation

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-484-cloudflare-analytics-export-automation |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/484 (CLOSED) |
| 起票元 unassigned-task | `docs/30-workflows/completed-tasks/task-issue-347-cloudflare-analytics-export-automation-001.md` |
| 親 decision workflow | `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/` |
| 配置先 | `docs/30-workflows/issue-484-cloudflare-analytics-export-automation/` |
| 作成日 | 2026-05-06 |
| 状態 | implemented-local / runtime Cloudflare export pending_user_approval |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: implemented-local]** — 月次 export automation 化に必要なコード変更（fetch script 新規、GitHub Actions workflow 新規、redaction CI gate 新規）は本ブランチで配置済み。Cloudflare token-backed runtime export と PR 作成はユーザー承認後の Phase 13 / runtime operation に残す。 |
| 優先度 | 中 |
| 規模 | 小〜中 |
| 想定 PR 数 | 1（script + workflow + CI gate + docs を 1 PR 内で完結） |
| coverage AC | 適用外（独立 ops script。`apps/web` / `apps/api` の coverage 対象外） |

## 1. なぜこのタスクが必要か（Why）

Issue #347 decision workflow で Cloudflare Analytics の canonical export 方式 / metric set / retention / redaction rule / evidence path が確定した。しかし decision cycle は docs-only として完了し、月次 export は手動運用のままである。手動運用は取り漏れが発生しやすく、月次 evidence の連続性（active retention 12 件）を確実に維持できない。

本タスクで GitHub Actions cron による automation を導入し、aggregate-only Cloudflare Analytics export を毎月 1 回実行・保存・redaction 検証する pipeline を確立する。

## 2. 何を達成するか（What / 成果物）

| 成果物 | 種別 | パス |
| --- | --- | --- |
| Cloudflare Analytics fetch script | 新規 | `scripts/fetch-cloudflare-analytics.ts` |
| GitHub Actions workflow | 新規 | `.github/workflows/cloudflare-analytics-export.yml` |
| Redaction check スクリプト | 新規 | `scripts/redaction-check-analytics.sh` |
| Vitest unit test | 新規 | `scripts/__tests__/fetch-cloudflare-analytics.test.ts` |
| 出力 evidence ディレクトリ | 既存 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/` |
| skill 反映 | 既存更新 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |

## 3. スコープ

### 含む
- aggregate-only Cloudflare GraphQL Analytics API による月次 export script 実装
- GitHub Actions schedule trigger（毎月 1 日 UTC）+ workflow_dispatch 手動実行 trigger
- 1Password 正本から GitHub Secrets 派生コピー `CLOUDFLARE_ANALYTICS_API_TOKEN` を注入する。repo / `.env` には実値を保存しない
- redaction grep（email / token / IP / URL query / member ID / session token）の CI gate 化
- active retention 12 件、13 件目以降を `archive/YYYY-MM/` へ自動移動するロジック
- partial output 防止（rate limit / API error 時は commit しない）
- script の Vitest unit test（aggregate-only schema 検証 / redaction logic / archive rotation）

### 含まない
- Logpush / 有料 monitoring 基盤導入
- Cloudflare API token の発行作業（別タスクで read-only analytics scope token を 1Password vault と GitHub Secrets に配置）
- 過去分の遡及 export
- production deploy 実行（自動 commit のみで PR 経由 merge は別ループ）

## 4. 重要な不変条件

1. 取得 field は **aggregate-only**（個別レコード禁止）。許容 field 集合: `requests` / `totalRequests` / `errors5xx` / `readQueries` / `writeQueries` / `invocations`
2. 出力 JSON に email / token / IP / URL query / body / UA / member ID / session token が含まれてはならない
3. Cloudflare GraphQL rate limit 失敗時は partial output を commit しない（一時ファイル経由で atomic write）
4. Logpush / Free plan 外の機能を使わない
5. Cloudflare API token は `op://` 参照のみで `.env` に保存。実値は GitHub Secrets と 1Password vault のみ
6. schedule は **月次 1 回のみ**（無料枠超過防止）。`workflow_dispatch` 本実行は同一対象月 1 回までとし、既存 export / 既存 branch 検出時は fail する
7. active retention 12 件を超えた古い export は `archive/YYYY-MM/` へ移動し削除はしない
8. fetch script は `apps/web` / `apps/api` 配下に置かない（独立 ops script として `scripts/` に配置）

## 5. 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | issue-347 decision workflow | canonical metric set / retention / redaction rule / evidence path が確定していること |
| 上流 | Cloudflare API token (read-only analytics scope) | 1Password vault item を正本、GitHub Secrets `CLOUDFLARE_ANALYTICS_API_TOKEN` を実行用コピーとして存在すること |
| 上流 | Cloudflare account tag | GitHub Secrets または environment variable `CLOUDFLARE_ACCOUNT_TAG` として存在すること |
| 下流 | 09c long-term-evidence ディレクトリ | export 出力先として存在すること |

## 6. 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| issue-347 decision 完了 | `ls docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-12/` |
| Cloudflare API token 配置 | `gh secret list \| grep CLOUDFLARE_ANALYTICS_API_TOKEN`（手動実行は不要、CI 上で参照される） |
| Cloudflare account tag 配置 | `gh secret list \| grep CLOUDFLARE_ACCOUNT_TAG` または workflow env で確認 |
| 09c evidence ディレクトリ存在 | `ls docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/` |
| Node 24 / pnpm 10 環境 | `mise install && mise exec -- node -v` |

## 7. CONST_005 必須項目サマリ

### 変更対象ファイル一覧

| パス | 種別 | 概要 |
| --- | --- | --- |
| `scripts/fetch-cloudflare-analytics.ts` | 新規 | aggregate-only GraphQL fetch + JSON 整形 + atomic write + retention rotation |
| `scripts/redaction-check-analytics.sh` | 新規 | 出力 JSON に対する禁止語句 grep（exit 1 で fail） |
| `.github/workflows/cloudflare-analytics-export.yml` | 新規 | cron schedule + workflow_dispatch + pnpm install + script 実行 + redaction check + commit |
| `scripts/__tests__/fetch-cloudflare-analytics.test.ts` | 新規 | unit test（mock Cloudflare API レスポンスで検証） |
| `package.json` | 編集 | `analytics:fetch` / `analytics:redaction-check` script 追加 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 編集 | automation 経路を applied として追記 |

### 主要関数シグネチャ

```typescript
// scripts/fetch-cloudflare-analytics.ts

export interface AnalyticsExport {
  exportedAt: string;        // ISO8601 UTC
  zoneTag: string;
  periodStart: string;       // ISO8601
  periodEnd: string;         // ISO8601
  metrics: {
    requests: number;
    totalRequests: number;
    errors5xx: number;
    readQueries: number;
    writeQueries: number;
    invocations: number;
  };
  schemaVersion: "1.0.0";
}

export async function fetchAnalytics(
  token: string,
  zoneTag: string,
  period: { start: Date; end: Date }
): Promise<AnalyticsExport>;

export function formatOutputFilename(now: Date): string;
// 形式: analytics-export-YYYYMMDD-HHmm-UTC.json

export function rotateArchive(
  outputDir: string,
  retentionCount: number
): { moved: string[]; kept: string[] };

export async function main(): Promise<void>;
```

### 入力・出力・副作用

- **入力**: 環境変数 `CLOUDFLARE_ANALYTICS_API_TOKEN` / `CLOUDFLARE_ZONE_TAG` / `CLOUDFLARE_ACCOUNT_TAG` / `ANALYTICS_OUTPUT_DIR`（後者はデフォルト値あり）
- **出力**: 1 JSON ファイル（aggregate-only metric のみ、上記 schema）
- **副作用**:
  - `outputs/long-term-evidence/analytics-export-*.json` への atomic write
  - 13 件目以降の古いファイルを `archive/YYYY-MM/` へ rename
  - 失敗時は temp file 削除のみで本体は変更しない（partial output 禁止）

### テスト方針

| テストファイル | ケース |
| --- | --- |
| `scripts/__tests__/fetch-cloudflare-analytics.test.ts` | (1) aggregate-only field のみ抽出される / (2) 余剰 field が含まれていたら drop / (3) GraphQL rate limit error で `commit` 関数が呼ばれない / (4) `formatOutputFilename` の YYYYMMDD-HHmm-UTC 整形 / (5) `rotateArchive` で 13 件目以降が `archive/YYYY-MM/` へ移動 |
| `scripts/redaction-check-analytics.sh` の手動検証 | dummy JSON に email / token / IP を埋めて exit 1 を確認 |

### ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test scripts/__tests__/fetch-cloudflare-analytics.test.ts

# dry-run（mock token で実 API を叩かない unit test 経由で代替）
DRY_RUN=1 mise exec -- pnpm analytics:fetch

# redaction check 単体
bash scripts/redaction-check-analytics.sh path/to/sample.json
```

### DoD（Definition of Done）

- [ ] `scripts/fetch-cloudflare-analytics.ts` が aggregate-only field のみ取得し JSON 出力する
- [ ] `formatOutputFilename` が `analytics-export-YYYYMMDD-HHmm-UTC.json` 形式を返す
- [ ] `rotateArchive` が 12 件超過分を `archive/YYYY-MM/` に移動する
- [ ] GraphQL error / rate limit 時に partial output が出力先に残らない
- [ ] `scripts/redaction-check-analytics.sh` が email / token / IP / URL query / member ID / session token を検出して exit 1 する
- [ ] `.github/workflows/cloudflare-analytics-export.yml` が `schedule: '0 2 1 * *'`（毎月 1 日 02:00 UTC）と `workflow_dispatch` を持つ
- [ ] workflow が `CLOUDFLARE_ANALYTICS_API_TOKEN` / `CLOUDFLARE_ACCOUNT_TAG` を GitHub Secrets から参照
- [ ] workflow が export 後に redaction check を実行し、fail なら commit せず終了
- [ ] Vitest 5 ケースすべて pass
- [ ] `pnpm typecheck` / `pnpm lint` pass
- [ ] `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に automation 経路が反映
- [ ] coverage gate は対象外（ops script）であることを spec / PR 本文に明記

## 8. リスクと対策

| リスク | 対策 |
| --- | --- |
| Cloudflare API token scope 過大 | read-only analytics scope に限定、別名 secret として配置 |
| 個人情報の混入 | aggregate-only query + redaction grep を CI gate 化、unit test でも検証 |
| 無料枠超過 | schedule は月次 1 回固定、workflow_dispatch は手動レビュー前提 |
| partial output の混入 | tmp file 経由 atomic write、失敗時は tmp 削除のみ |
| retention overflow | rotateArchive で 12 件 + archive/YYYY-MM/ |
| ブランチ運用との衝突 | workflow が `main` のみで動作、PR 化は別ループで実施（自動 push しない） |

## 9. CONST_007 スコープ確認

本タスクは 1 サイクル内で完了する。先送り項目はない。Cloudflare API token の発行作業のみは別タスク（読み取り専用 scope token を 1Password / GitHub Secrets へ配置）に切り出すが、これは「依存」であり「先送り」ではない（本仕様書の実装着手前提条件として明記）。

## 10. 参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/484
- 親 decision workflow: `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/`
- consumed unassigned-task trace: `docs/30-workflows/completed-tasks/task-issue-347-cloudflare-analytics-export-automation-001.md`
- canonical metric / redaction rule: `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-12/implementation-guide.md`
- skill: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` / `deployment-cloudflare-opennext-workers.md`

## 11. Phase 索引

| Phase | ファイル | 概要 |
| --- | --- | --- |
| 1 | [phase-01.md](phase-01.md) | 要件定義 |
| 2 | [phase-02.md](phase-02.md) | アーキテクチャ設計 |
| 3 | [phase-03.md](phase-03.md) | 詳細設計（API契約・データモデル） |
| 4 | [phase-04.md](phase-04.md) | 実装計画・タスク分解 |
| 5 | [phase-05.md](phase-05.md) | コア実装 |
| 6 | [phase-06.md](phase-06.md) | 単体テスト |
| 7 | [phase-07.md](phase-07.md) | 統合テスト |
| 8 | [phase-08.md](phase-08.md) | E2E / 受け入れ |
| 9 | [phase-09.md](phase-09.md) | パフォーマンス・セキュリティ検証 |
| 10 | [phase-10.md](phase-10.md) | ドキュメント整備 |
| 11 | [phase-11.md](phase-11.md) | 証跡・evidence |
| 12 | [phase-12.md](phase-12.md) | 実装ガイド・skill反映・コンプライアンス |
| 13 | [phase-13.md](phase-13.md) | PR 作成 |
