# Phase 3: アーキテクチャ設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 目的 | exporter / R2 binding / lifecycle policy / restore drill の構成確定 |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 の契約と Phase 2 のデータモデルを所与とし、ランタイム構成を確定する。

1. exporter script (`export-to-r2.ts`) の責務分離（D1 reader / redaction guard / gzip / R2 putter / manifest writer）
2. R2 binding (`UBM_AUDIT_COLD_STORAGE`) の `wrangler.toml` 配置と権限境界
3. R2 lifecycle policy (`Standard → Infrequent Access` のみ、auto-delete 無し)
4. restore drill script (`restore-drill.ts`) の構成と半期発火条件
5. GitHub Actions workflow (`cf-audit-log-cold-storage.yml`) の job 構造と secrets 経路

## 統合テスト連携

NON_VISUAL implementation。Phase 11 の runtime evidence は (a) 初回 export object PUT 成功ログ、(b) D1 manifest `status='completed'` 行、(c) restore drill row count / sha256 一致ログ、の 3 点に集約する。

## 変更対象ファイル一覧

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/wrangler.toml` | 編集 | `[[r2_buckets]]` 追加（production / preview） |
| `scripts/cf-audit-log/export-to-r2.ts` | 新規 | exporter 本体 |
| `scripts/cf-audit-log/restore-drill.ts` | 新規 | restore 検証スクリプト |
| `scripts/cf-audit-log/r2-client.ts` | 新規 | R2 PutObject / GetObject の薄い wrapper |
| `scripts/cf-audit-log/redaction-guard.ts` | 新規 | Phase 2 redaction rules の grep 実装（export transform 後の fail-closed guard） |
| `scripts/cf-audit-log/__tests__/export-to-r2.spec.ts` | 新規 | exporter focused test |
| `scripts/cf-audit-log/__tests__/restore-drill.spec.ts` | 新規 | restore drill focused test |
| `scripts/cf-audit-log/__tests__/redaction-guard.spec.ts` | 新規 | redaction grep の fail-closed test |
| `.github/workflows/cf-audit-log-cold-storage.yml` | 新規 | 日次 + 半期 restore drill workflow |
| `scripts/cf.sh` | 編集 | `r2 export` / `r2 restore` サブコマンド追加（既存 `op run` ラップを踏襲） |

## アーキテクチャ図（テキスト）

```
┌────────────────────────────────────────────────────────────────────┐
│ GitHub Actions: cf-audit-log-cold-storage.yml                      │
│   schedule: '0 2 * * *' (UTC)                                      │
│                                                                    │
│   ┌────────────────────┐    ┌──────────────────────────────────┐   │
│   │ job: export        │    │ job: restore-drill               │   │
│   │  if: always()      │    │  if: contains([1,7], month_utc)  │   │
│   │                    │    │                                  │   │
│   │  bash scripts/     │    │  bash scripts/cf.sh r2 restore   │   │
│   │  cf.sh r2 export   │    │  --random-pick 1 --verify        │   │
│   └────────┬───────────┘    └──────────────┬───────────────────┘   │
│            │                                │                      │
└────────────┼────────────────────────────────┼──────────────────────┘
             │                                │
             ▼                                ▼
┌────────────────────────────┐   ┌────────────────────────────────┐
│ scripts/cf-audit-log/      │   │ scripts/cf-audit-log/          │
│ export-to-r2.ts            │   │ restore-drill.ts               │
│                            │   │                                │
│  1. D1 SELECT (cursor)     │   │  1. R2 GetObject               │
│  2. redact row + guard grep│   │  2. gunzip + JSON.parse 行毎   │
│  3. JSONL build + sha256   │   │  3. tmp テーブル INSERT        │
│  4. gzip                   │   │  4. row_count / sha256 照合    │
│  5. manifest INSERT pending│   │  5. drop tmp / log evidence    │
│  6. R2 PutObject           │   │                                │
│  7. manifest UPDATE done   │   │                                │
└──────────┬─────────────────┘   └──────────┬─────────────────────┘
           │                                 │
           ▼                                 ▼
   ┌─────────────────┐              ┌─────────────────┐
   │ Cloudflare R2   │              │ Cloudflare D1   │
   │ UBM_AUDIT_COLD_ │◀─────────────│ cf_audit_log    │
   │ STORAGE bucket  │              │ + export_manifest│
   └─────────────────┘              └─────────────────┘
           │
           ▼
   ┌─────────────────────────────────┐
   │ Lifecycle: Standard → IA (90d)  │
   │ Auto-delete: 無し（手動 runbook）│
   └─────────────────────────────────┘
```

## 関数・型・モジュールのシグネチャ

### `scripts/cf-audit-log/export-to-r2.ts`

```typescript
import type { ExportManifestRow, ExportWindow, R2ObjectKey } from "./types";

export type ExportToR2Options = {
  windowFromUtc: Date;        // 既定: now - 29d
  windowToUtc: Date;          // 既定: now - 26d
  exportRunId: string;        // workflow 実行 ID
  dryRun?: boolean;           // 既定 false
};

export type ExportToR2Result = {
  manifests: ExportManifestRow[];
  failedPartitions: Array<{ yyyy: number; mm: number; dd: number; error: string }>;
  totalRowCount: number;
  totalCompressedBytes: number;
};

export async function exportToR2(opts: ExportToR2Options): Promise<ExportToR2Result>;
```

副作用:

- D1: `cf_audit_log` SELECT (read-only) + `cf_audit_log_export_manifest` INSERT/UPDATE
- R2: `UBM_AUDIT_COLD_STORAGE` bucket への PutObject
- stdout: 進捗ログ（GitHub Actions log として保存）
- failure: redaction guard ヒット / R2 PUT 失敗 / D1 制約違反 → process exit code 非 0

### `scripts/cf-audit-log/restore-drill.ts`

```typescript
export type RestoreDrillOptions = {
  randomPick: number;         // 何件の object を抽出するか（既定 1）
  verify: boolean;            // sha256 + row count 照合を行うか
};

export type RestoreDrillResult = {
  drilled: Array<{
    objectKey: string;
    expectedRowCount: number;
    actualRowCount: number;
    sha256Match: boolean;
  }>;
  ok: boolean;                // 全件一致なら true
};

export async function restoreDrill(opts: RestoreDrillOptions): Promise<RestoreDrillResult>;
```

副作用:

- D1: 一時テーブル `cf_audit_log_restore_tmp_<runId>` を CREATE → INSERT → DROP
- R2: GetObject (read-only)
- failure: 不一致時 process exit code 非 0 + GitHub Issue 起票（`priority:high / type:security`）

### `scripts/cf-audit-log/r2-client.ts`

```typescript
export interface R2Client {
  putObject(key: string, body: Uint8Array, opts: {
    contentType: string;
    contentEncoding?: string;
    metadata: Record<string, string>;
    ifNoneMatch?: "*";
  }): Promise<{ etag: string }>;

  getObject(key: string): Promise<{ body: Uint8Array; metadata: Record<string, string> }>;
  listObjects(prefix: string): Promise<Array<{ key: string; size: number; etag: string }>>;
}

export function createR2Client(env: { UBM_AUDIT_COLD_STORAGE: R2Bucket }): R2Client;
```

### `scripts/cf-audit-log/redaction-guard.ts`

```typescript
export type RedactionViolation = {
  pattern: "api-token" | "ipv4-full" | "ipv6-full" | "user-agent-plain" | "email-plain";
  sample: string;             // 先頭 32 文字のみ（log にも redacted 化）
};

export function guardJsonlOrThrow(jsonl: string): void;
// ヒット 0 件で return、1 件以上で throw new RedactionViolationError(violations)
```

## R2 binding 追加（`apps/api/wrangler.toml`）

```toml
# 追加（production env）
[[env.production.r2_buckets]]
binding = "UBM_AUDIT_COLD_STORAGE"
bucket_name = "ubm-hyogo-audit-cold-storage-prod"

# 追加（preview env / fixture テスト用）
[[env.preview.r2_buckets]]
binding = "UBM_AUDIT_COLD_STORAGE"
bucket_name = "ubm-hyogo-audit-cold-storage-preview"
preview_bucket_name = "ubm-hyogo-audit-cold-storage-preview"
```

権限境界:

- `apps/api` Worker は R2 binding 経由でのみアクセス（直接 S3 互換 API 禁止）
- export script は GitHub Actions runner から `scripts/cf.sh` 経由で wrangler / Workers binding を呼ぶ
- export Token (`CF_AUDIT_R2_TOKEN_PROD`) は `Account > R2:Edit` のみ。監視 Token (`CF_AUDIT_TOKEN_PROD`) と独立 rotation。

## R2 lifecycle policy

```jsonc
// scripts/cf.sh r2 lifecycle apply で投入する想定の policy
{
  "rules": [
    {
      "id": "audit-cold-storage-tiering",
      "status": "Enabled",
      "filter": { "prefix": "audit/v1/" },
      "transitions": [
        { "days": 90, "storageClass": "InfrequentAccess" }
      ],
      "abortIncompleteMultipartUpload": { "daysAfterInitiation": 1 }
      // NOTE: expiration / auto-delete は意図的に未定義。
      //       削除は半期レビュー後に手動 runbook (15-infrastructure-runbook.md) で実施。
    }
  ]
}
```

## GitHub Actions workflow 構造

```yaml
# .github/workflows/cf-audit-log-cold-storage.yml の概形（実体は Phase 5）
name: cf-audit-log-cold-storage
on:
  schedule:
    - cron: '0 2 * * *'   # 毎日 UTC 02:00
  workflow_dispatch:

permissions:
  contents: read
  issues: write           # redaction violation / restore mismatch 時の起票

concurrency:
  group: cf-audit-log-cold-storage
  cancel-in-progress: false

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - name: Export to R2
        env:
          CF_AUDIT_R2_TOKEN_PROD: ${{ secrets.CF_AUDIT_R2_TOKEN_PROD }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bash scripts/cf.sh r2 export --env production

  restore-drill:
    needs: export
    if: ${{ contains(fromJSON('[1,7]'), fromJSON(format('{0}', github.event.schedule && '0' || '0'))) }}
    # NOTE: 半期判定は scripts 側で UTC month を取得して分岐するほうが堅牢。
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - name: Restore drill
        env:
          CF_AUDIT_R2_TOKEN_PROD: ${{ secrets.CF_AUDIT_R2_TOKEN_PROD }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bash scripts/cf.sh r2 restore --random-pick 1 --verify --env production
```

> 半期分岐は YAML 表現が脆いため、Phase 5 では `restore-drill.ts` 内で UTC 月を取得し 1 / 7 月以外は no-op で抜ける実装に倒す。

## 入力・出力・副作用（Phase 全体まとめ）

- 入力: D1 `cf_audit_log` 行（INSERT 時刻 26-29 日前）、Cloudflare R2 binding、GitHub Secrets
- 出力: R2 object（最大 30 / 月）、D1 manifest 行（最大 30 / 月）、GitHub Actions log
- 副作用: 異常時の GitHub Issue 起票（既存 `issue-reporter.ts` 経由）

## テスト方針

| ファイル | テストケース |
| --- | --- |
| `__tests__/export-to-r2.spec.ts` | (1) 正常系: window 内 N 行 → manifest pending → R2 put → manifest completed (2) 重複実行: `(yyyy, mm, dd)` UNIQUE で skip (3) R2 PUT 失敗: manifest failed + non-zero exit (4) dry-run: R2 PUT を呼ばないこと |
| `__tests__/restore-drill.spec.ts` | (1) 正常系: row count 一致 / sha256 一致で ok=true (2) row count 不一致: ok=false + Issue 起票 (3) sha256 不一致: ok=false + Issue 起票 (4) 半期外実行: no-op で exit 0 |
| `__tests__/redaction-guard.spec.ts` | 5 pattern それぞれ (a) ヒット時 throw (b) 非ヒット時 return |

実行: `mise exec -- pnpm --filter @repo/scripts test:run`（scripts package が独立していなければ root vitest で `scripts/cf-audit-log/__tests__` を target に）。

## ローカル実行・検証コマンド

```bash
# 1. wrangler.toml の R2 binding 構文チェック
mise exec -- pnpm --filter @repo/api exec wrangler types  # config 構文だけ検証
# あるいは
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env preview --dry-run

# 2. exporter dry-run（R2 PUT を行わず JSONL を stdout に流す）
bash scripts/cf.sh r2 export --env preview --dry-run

# 3. restore drill ローカル（preview bucket に対して）
bash scripts/cf.sh r2 restore --env preview --random-pick 1 --verify

# 4. redaction guard 単体テスト
mise exec -- pnpm vitest run scripts/cf-audit-log/__tests__/redaction-guard.spec.ts

# 5. typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## DoD（Phase 3 完了条件）

- [ ] exporter / restore drill / r2-client / redaction-guard のシグネチャが TypeScript で確定している
- [ ] wrangler.toml の R2 binding 追加箇所（production / preview）が明記されている
- [ ] R2 lifecycle policy が `Standard → IA` のみで、auto-delete を含まないことが policy JSON で示されている
- [ ] GitHub Actions workflow の job 構造（export / restore-drill）と secrets 経路が確定している
- [ ] export Token と監視 Token が独立 rotation 可能な権限境界として記述されている
- [ ] focused test 3 ファイル分のケース一覧が確定している
- [ ] ローカル検証コマンド 5 種が動作可能な形で列挙されている
