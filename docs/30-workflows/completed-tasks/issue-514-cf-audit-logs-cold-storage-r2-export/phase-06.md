# Phase 6: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 目的 | exporter / restore-drill / redaction-guard の focused unit test を実装し、Phase 4 で確定した 25 ケースを充足する |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 4 で確定した 25 テストケースを vitest で実装し、Phase 5 の実装に対する focused coverage を確保する。

1. `export-to-r2.spec.ts`（8 ケース）
2. `restore-drill.spec.ts`（6 ケース）
3. `redaction-guard.spec.ts`（10 ケース）
4. `redaction-guard.integration.spec.ts`（1 ケース。preview env、Phase 8 で再使用）

> 親タスク (`coverage AC=適用外`) のため app 全体の coverage gate は適用しないが、本タスクで追加する exporter / restore-drill / redaction-guard の **focused coverage 80%** は Phase 7 で判定する。

## 統合テスト連携

NON_VISUAL implementation。本 Phase の単体テストは in-memory R2 mock / D1 mock を使う。preview env を伴う integration spec は 1 ケースのみ（Phase 8 / 11 で再利用）。

## 変更対象ファイル一覧

| パス | 種別 | 内容 |
| --- | --- | --- |
| `scripts/cf-audit-log/__fixtures__/audit-rows.ts` | 新規 | window 境界 fixture（Phase 4 F-1 / F-2） |
| `scripts/cf-audit-log/__fixtures__/redaction-violations.ts` | 新規 | 5 pattern violation サンプル（Phase 4 F-3） |
| `scripts/cf-audit-log/__fixtures__/r2-mock.ts` | 新規 | R2Client interface の in-memory 実装 |
| `scripts/cf-audit-log/__fixtures__/d1-mock.ts` | 新規 | D1Database / ManifestStore の in-memory 実装 |
| `scripts/cf-audit-log/__tests__/export-to-r2.spec.ts` | 新規 | exporter focused test |
| `scripts/cf-audit-log/__tests__/restore-drill.spec.ts` | 新規 | restore drill focused test |
| `scripts/cf-audit-log/__tests__/redaction-guard.spec.ts` | 新規 | redaction grep test |
| `scripts/cf-audit-log/__tests__/redaction-guard.integration.spec.ts` | 新規 | preview env round-trip（skip default、`pnpm test:integration` で実行） |
| `vitest.config.ts` | 編集 | `scripts/cf-audit-log/__tests__/**` を test target に追加（既に root config に含まれていれば no-op） |

## テストケース一覧

### `__tests__/export-to-r2.spec.ts`（8 ケース）

| # | ケース名 | 入力 fixture | 期待アサーション |
| --- | --- | --- | --- |
| 1 | window 内 3 partition × 100 rows / day を full export する | F-1 区分 A、F-2 typical | `result.manifests.length === 3`、各 `status === 'completed'`、`r2.putObject` を 3 回呼ぶ、`totalRowCount === 300` |
| 2 | window 直前の行は export しない | F-1 区分 B | `result.manifests.length === 0`、`r2.putObject` 呼び出し 0 回 |
| 3 | window 直後の行は export しない | F-1 区分 C | 同上 |
| 4 | dry-run は R2 PUT も manifest INSERT も呼ばない | F-1 区分 A、`dryRun: true` | `r2.putObject` 0 回、`manifest.insertPending` 0 回、`result.manifests` の status は `pending` 相当（実際は manifest 行未挿入なので戻り値配列に row builder の値が入る） |
| 5 | 重複実行は `(yyyy, mm, dd)` UNIQUE で skip | manifest mock に completed 行を pre-insert | `r2.putObject` 0 回、`failedPartitions` 0 件、`manifests` は既存行をそのまま返す |
| 6 | R2 PUT 失敗時に manifest を failed にして Issue 起票 | r2-mock の `putObject` を throw | `manifest.markFailed` 呼び出し 1 回、`reportIssue` 呼び出し 1 回、process は throw（exit 非 0 相当） |
| 7 | redaction violation 検出時は manifest INSERT 前に throw | F-3 のうち `api-token` 1 行混入 | `RedactionViolationError` throw、`manifest.insertPending` 0 回、`r2.putObject` 0 回 |
| 8 | row count 0 の partition も監査済みとして記録 | window 内に該当行 0（D1 mock 空） | `manifests.length === 1`、`rowCount === 0`、R2 PUT 1 回（空 JSONL.gz）、exit 0 |

### `__tests__/restore-drill.spec.ts`（6 ケース）

| # | ケース名 | 入力 | 期待 |
| --- | --- | --- | --- |
| 1 | 半期外実行は no-op | `now()` を 3 月固定、`forceRun: false` | `result.skipped === 'non-semiannual'`、`r2.getObject` 0 回 |
| 2 | 1 月実行 / random-pick 1 / row count + sha256 一致 | 1 月固定、manifest に completed 1 行、r2-mock に対応 object | `drilled.length === 1`、`sha256Match === true`、`ok === true` |
| 3 | row count 不一致で fail + Issue 起票 | object body の行数を意図的に削減 | `ok === false`、`reportIssue` 呼び出し（`priority:high / type:security`） |
| 4 | sha256 不一致で fail + Issue 起票 | object body を 1 byte 改竄 | `ok === false`、`reportIssue` 呼び出し |
| 5 | R2 GetObject 404 で fail + Issue 起票 | r2-mock の getObject が `Not Found` を throw | `ok === false`、`reportIssue` 呼び出し（`type:operations`） |
| 6 | completed manifest 0 件なら no-op success | manifest mock 空 | `ok === true`、`drilled.length === 0`、Issue 起票なし |

### `__tests__/redaction-guard.spec.ts`（10 ケース）

5 pattern それぞれ:

| # | pattern | hit / non-hit | 期待 |
| --- | --- | --- | --- |
| 1 | api-token | hit | `RedactionViolationError`、`violations[0].pattern === 'api-token'` |
| 2 | api-token | non-hit（cf_pat 風だが短すぎる） | return 正常 |
| 3 | ipv4-full | hit (`203.0.113.42`) | throw |
| 4 | ipv4-full | non-hit (`203.0.113.0/24` truncated) | return 正常 |
| 5 | ipv6-full | hit (`2001:db8::1234:5678:9abc:def0:1`) | throw |
| 6 | ipv6-full | non-hit (`2001:db8::/48`) | return 正常 |
| 7 | user-agent-plain | hit | throw |
| 8 | user-agent-plain | non-hit (UA hash hex) | return 正常 |
| 9 | email-plain | hit (`actor@example.com`) | throw |
| 10 | email-plain | non-hit (local-part hash + `@example.com` の hash 形 `a1b2c3d4@example.com` は仕様上 hash として除外、もしくは hash 形は別 redaction policy で扱うため non-hit fixture として `[redacted]@example.com` を使う) | return 正常 |

> `violations[].sample` が **先頭 32 文字 + `...redacted`** に切り詰められていること、log redaction も検証する（追加 assertion をケース 1 / 3 に組み込む）。

### `__tests__/redaction-guard.integration.spec.ts`（1 ケース）

| # | ケース名 | 期待 |
| --- | --- | --- |
| 1 | preview env で実 R2 PUT → GetObject → gunzip → 5 pattern 不在検証 | `pnpm test:integration` でのみ実行（CI 環境変数で skip 切替）。`expect(violations.length).toBe(0)` |

> このテストは Phase 8 で再使用する。default は `describe.skipIf(!process.env.CF_AUDIT_INTEGRATION)` で skip。

## fixture / mock 実装方針

### `audit-rows.ts`

```typescript
export type AuditRowFixtureOptions = {
  now: Date;
  partitions: Array<{ daysAgo: number; rowCount: number }>;
  injectViolation?: { pattern: RedactionViolation["pattern"]; rowIndex: number };
};

export function generateAuditRows(opts: AuditRowFixtureOptions): CfAuditLogRow[];
```

### `r2-mock.ts`

```typescript
export function createR2Mock(): R2Client & {
  store: Map<string, { body: Uint8Array; metadata: Record<string, string>; etag: string }>;
  failNextPut?: () => Error;
  failNextGet?: () => Error;
};
```

### `d1-mock.ts`

```typescript
export function createD1Mock(): {
  db: D1Database;
  manifest: ManifestStore;
  rows: CfAuditLogRow[];
  manifestRows: ExportManifestRow[];
};
```

## 入力・出力・副作用

- 入力: fixture audit rows、mock R2 store、mock manifest store
- 出力: vitest 実行結果（25 ケース pass）、coverage report（exporter / restore-drill / redaction-guard に focused）
- 副作用: なし（`integration.spec.ts` のみ preview R2 / D1 を触る）

## テスト方針

| 観点 | 採用 |
| --- | --- |
| Test runner | vitest |
| Mock 方式 | DI 経由（`exportToR2(deps, opts)` / `restoreDrill(deps, opts)` の `deps` に in-memory mock を注入） |
| Time freeze | `vi.useFakeTimers()` + `vi.setSystemTime(now)` |
| Random freeze | `deps.random = () => 0.5` で `randomPick` を deterministic 化 |
| Integration spec | `describe.skipIf(!process.env.CF_AUDIT_INTEGRATION)` で default skip |

## ローカル実行・検証コマンド

```bash
# 1. focused unit test (25 - 1 = 24 ケース)
mise exec -- pnpm vitest run scripts/cf-audit-log/__tests__/

# 2. coverage 取得（exporter / restore-drill / redaction-guard に focus）
mise exec -- pnpm vitest run --coverage \
  scripts/cf-audit-log/__tests__/export-to-r2.spec.ts \
  scripts/cf-audit-log/__tests__/restore-drill.spec.ts \
  scripts/cf-audit-log/__tests__/redaction-guard.spec.ts

# 3. integration spec（preview R2 + D1。CI / 手動のみ）
CF_AUDIT_INTEGRATION=1 mise exec -- pnpm vitest run \
  scripts/cf-audit-log/__tests__/redaction-guard.integration.spec.ts

# 4. typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## DoD（Phase 6 完了条件）

- [ ] `__fixtures__/audit-rows.ts` / `redaction-violations.ts` / `r2-mock.ts` / `d1-mock.ts` の 4 ファイルが Phase 4 / 5 のシグネチャに整合する形で実装されている
- [ ] `__tests__/export-to-r2.spec.ts` の 8 ケースが pass する
- [ ] `__tests__/restore-drill.spec.ts` の 6 ケースが pass する
- [ ] `__tests__/redaction-guard.spec.ts` の 10 ケースが pass する
- [ ] `__tests__/redaction-guard.integration.spec.ts` が `CF_AUDIT_INTEGRATION=1` 時のみ実行され、default では skip される
- [ ] `violations[].sample` の 32 文字 truncation が ケース 1 / 3 で assertion されている
- [ ] vitest coverage report で exporter / restore-drill / redaction-guard の statements coverage がそれぞれ 80% 以上
- [ ] `pnpm typecheck` / `pnpm lint` green
