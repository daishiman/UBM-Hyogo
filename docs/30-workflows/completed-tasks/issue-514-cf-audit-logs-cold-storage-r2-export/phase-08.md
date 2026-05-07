# Phase 8: 統合テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 目的 | fixture-based exporter / dry-run workflow contract / redaction integration / restore drill integration の 4 シナリオを単一正本 YAML として駆動 |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| irreversibleOperation | true（R2 production 書き込みは Phase 13 G1-G3 で別承認） |

## 目的

Phase 5 で実装する exporter / restore-drill / redaction-guard / workflow を、production R2 / production D1 に触れずに end-to-end で検証する統合テストを設計する。観点は次の 4 つ。

1. **fixture-based exporter integration test**: D1 in-memory (`better-sqlite3` あるいは `@cloudflare/vitest-pool-workers` の D1 emulation) に Issue #408 fetcher と同等の `cf_audit_log` schema を再現し、合成 N 行を流し込み、仮想 R2 client (in-memory Map) を inject して `exportToR2()` を回す。manifest 2-phase commit / object key UTC 固定 / sha256・row_count・gzip サイズの整合を assert する。
2. **dry-run workflow contract test**: `.github/workflows/cf-audit-log-cold-storage.yml` を `js-yaml` で parse し、`schedule.cron='0 2 * * *'` / `concurrency.group='cf-audit-log-cold-storage'` / `permissions.issues='write'` / `secrets: CF_AUDIT_R2_TOKEN_PROD` 参照 / job 名 `export` / `restore-drill` / `--dry-run --manifest-only` フラグの存在を contract として固定。manifest 出力モードでの stdout JSON が `ExportToR2Result` 型と互換であることまで確認する。
3. **redaction integration test**: 合成 audit log 行に Phase 2 redaction rules 表の 5 pattern（API Token prefix `v1.0-...` / 完全 IPv4 / 完全 IPv6 / 平文 User-Agent / 平文 email local-part）を意図的に埋め込み、`exportToR2()` が `RedactionViolationError` で fail-closed しかつ R2 仮想 store に object が PUT されていないこと（`mockClient.putObject` が `not.toHaveBeenCalled()`）を assert する。
4. **restore drill integration test**: 仮想 R2 へ `exportToR2()` で書き出した object をそのまま入力に `restoreDrill({ randomPick: 1, verify: true })` を回し、(a) 一時テーブル `cf_audit_log_restore_tmp_<runId>` が CREATE → INSERT → DROP の順で扱われること、(b) `expectedRowCount === actualRowCount`、(c) `sha256Match=true` を assert する。row_count を 1 行削った corrupt fixture では `ok=false` で Issue 起票関数 (`reportIssue` mock) が `priority:high / type:security` で呼ばれることを確認する。

## NON_VISUAL 単一正本 YAML パターン

`lessons-learned/non-visual-governance-pattern.md` に従い、上記 4 シナリオを **単一の YAML 仕様** で表現し、テストコードと artifacts は YAML を正本に派生させる。

```yaml
# scripts/cf-audit-log/__tests__/integration/scenarios.yaml （Phase 5 で配置）
version: 1
scenarios:
  - id: exporter-fixture-happy-path
    type: exporter
    given:
      d1_rows: 120                 # 4 日分 x 30 行
      window:
        from_offset_days: -29
        to_offset_days: -26
      redaction_violations: []
    when:
      action: exportToR2
      dry_run: false
    then:
      manifests_completed: 4       # 4 partition (yyyy/mm/dd)
      manifests_pending_residual: 0
      r2_put_calls: 4
      total_row_count: 120
      object_keys_pattern: '^audit/v1/yyyy=\d{4}/mm=\d{2}/dd=\d{2}/cf-audit-log-\d{8}\.jsonl\.gz$'
      sha256_matches_jsonl_plain: true

  - id: exporter-idempotent-rerun
    type: exporter
    given:
      d1_rows: 30
      preexisting_manifest_status: completed
    when:
      action: exportToR2
    then:
      r2_put_calls: 0              # UNIQUE 制約で skip
      manifest_inserts: 0

  - id: workflow-contract
    type: workflow
    given:
      file: .github/workflows/cf-audit-log-cold-storage.yml
    then:
      schedule_cron: '0 2 * * *'
      concurrency_group: cf-audit-log-cold-storage
      permissions_issues: write
      jobs:
        - name: export
          uses_secret: CF_AUDIT_R2_TOKEN_PROD
          dry_run_flag_supported: true
        - name: restore-drill
          random_pick_flag: true

  - id: redaction-fail-closed
    type: redaction
    given:
      injected_patterns:
        - api-token
        - ipv4-full
        - ipv6-full
        - user-agent-plain
        - email-plain
    when:
      action: exportToR2
    then:
      throws: RedactionViolationError
      r2_put_calls: 0
      manifest_status_final: failed
      issue_reporter_called_with:
        priority: high
        type: security

  - id: restore-drill-happy-path
    type: restore
    given:
      r2_object_from_scenario: exporter-fixture-happy-path
    when:
      action: restoreDrill
      random_pick: 1
      verify: true
    then:
      ok: true
      sha256_match: true
      row_count_match: true
      tmp_table_dropped: true

  - id: restore-drill-corrupt-row-count
    type: restore
    given:
      r2_object_corruption: drop_one_line
    when:
      action: restoreDrill
      verify: true
    then:
      ok: false
      issue_reporter_called_with:
        priority: high
        type: security
```

テストファイルはこの YAML を `describe.each` で読み、各 `id` に対し `given → when → then` を実行する `runScenario(yaml)` driver を共通化する。drift は YAML を変更すれば全テストに伝播する設計。

## 統合テスト連携

NON_VISUAL implementation。Phase 11 の runtime evidence は本 Phase の YAML scenario id と 1:1 で対応させる:

| Phase 8 scenario id | Phase 11 evidence |
| --- | --- |
| `exporter-fixture-happy-path` | 初回 production export の R2 PutObject 成功ログ + manifest `status='completed'` 行 |
| `redaction-fail-closed` | （runtime では発火しない想定。発火時は GitHub Issue が evidence） |
| `restore-drill-happy-path` | 半期 restore drill の row count / sha256 一致ログ |

## 変更対象ファイル一覧

| パス | 種別 | 内容 |
| --- | --- | --- |
| `scripts/cf-audit-log/__tests__/integration/scenarios.yaml` | 新規 | NON_VISUAL 単一正本 YAML（上掲） |
| `scripts/cf-audit-log/__tests__/integration/run-scenario.ts` | 新規 | YAML を読んで `describe.each` を駆動する driver |
| `scripts/cf-audit-log/__tests__/integration/exporter.int.spec.ts` | 新規 | `type: exporter` シナリオを実行 |
| `scripts/cf-audit-log/__tests__/integration/workflow-contract.int.spec.ts` | 新規 | `type: workflow` シナリオを実行 |
| `scripts/cf-audit-log/__tests__/integration/redaction.int.spec.ts` | 新規 | `type: redaction` シナリオを実行 |
| `scripts/cf-audit-log/__tests__/integration/restore-drill.int.spec.ts` | 新規 | `type: restore` シナリオを実行 |
| `scripts/cf-audit-log/__tests__/integration/fixtures/cf-audit-log-rows.json` | 新規 | 合成 audit log fixture（redacted な正常行 + 5 violation 注入版） |
| `scripts/cf-audit-log/__tests__/integration/mocks/r2-client.ts` | 新規 | in-memory Map で `R2Client` interface を満たす mock |
| `scripts/cf-audit-log/__tests__/integration/mocks/d1-client.ts` | 新規 | better-sqlite3 ベースの D1 emulation（`cf_audit_log` + manifest schema を bootstrap） |

## 関数・型・モジュールのシグネチャ

```typescript
// scripts/cf-audit-log/__tests__/integration/run-scenario.ts
import type { ExportToR2Options, ExportToR2Result } from "../../export-to-r2";
import type { RestoreDrillOptions, RestoreDrillResult } from "../../restore-drill";

export type ScenarioYaml = {
  version: 1;
  scenarios: Scenario[];
};

export type Scenario =
  | ExporterScenario
  | WorkflowScenario
  | RedactionScenario
  | RestoreScenario;

export type ExporterScenario = {
  id: string;
  type: "exporter";
  given: { d1_rows: number; window?: WindowSpec; preexisting_manifest_status?: "completed" | "failed" };
  when: { action: "exportToR2"; dry_run?: boolean };
  then: Partial<{
    manifests_completed: number;
    manifests_pending_residual: number;
    r2_put_calls: number;
    total_row_count: number;
    object_keys_pattern: string;
    sha256_matches_jsonl_plain: boolean;
    manifest_inserts: number;
  }>;
};

export function runScenario(scenario: Scenario, ctx: ScenarioContext): Promise<void>;

export type ScenarioContext = {
  d1: D1EmulatorHandle;
  r2: InMemoryR2Mock;
  issueReporter: ReturnType<typeof vi.fn>;
  fixedNow: Date;
};
```

## 入力・出力・副作用

- 入力: YAML scenarios + JSON fixtures（合成 audit log 行）
- 出力: vitest pass/fail（CI green / failed）
- 副作用: in-memory のみ。production D1 / R2 / Cloudflare API への接続なし。GitHub Actions secrets 不要。

## テスト方針

- vitest `describe.each(scenarios)` で YAML 駆動。各 scenario の `id` を test name にする。
- D1 emulation は `better-sqlite3` を採用（`@cloudflare/vitest-pool-workers` を入れると monorepo build 時間が伸びるため）。`cf_audit_log` / `cf_audit_log_export_manifest` の DDL は migration ファイルから直接読み込む。
- `vi.useFakeTimers()` で `now = 2026-05-15T00:00:00Z` 固定。export window は `from = -29d` / `to = -26d` 固定で再現性確保。
- redaction grep は実装の正規表現を import で共有し、テスト側で重複定義しない（policy drift 防止）。
- Issue 起票は `vi.fn()` mock で副作用を遮断。
- `pnpm vitest run scripts/cf-audit-log/__tests__/integration` で 4 spec すべて green を完了条件とする。

## ローカル実行・検証コマンド

```bash
# 4 統合テスト spec 一括実行
mise exec -- pnpm vitest run scripts/cf-audit-log/__tests__/integration

# シナリオ単体（exporter のみ）
mise exec -- pnpm vitest run scripts/cf-audit-log/__tests__/integration/exporter.int.spec.ts

# YAML schema 構文チェック（typo 検出）
mise exec -- node -e "const y=require('js-yaml');const fs=require('fs');console.log(y.load(fs.readFileSync('scripts/cf-audit-log/__tests__/integration/scenarios.yaml','utf8')).scenarios.length+' scenarios')"

# workflow YAML の実在性（Phase 9 の path existence gate と整合）
test -f .github/workflows/cf-audit-log-cold-storage.yml && echo OK
```

## DoD（Phase 8 完了条件）

- [ ] `scenarios.yaml` が 6 scenario 以上（exporter happy / idempotent / workflow / redaction / restore happy / restore corrupt）を含む
- [ ] `run-scenario.ts` driver で `type: exporter | workflow | redaction | restore` の 4 種を分岐実行できる
- [ ] in-memory R2 mock と D1 emulator が Phase 3 の `R2Client` interface / `cf_audit_log` schema を満たす
- [ ] redaction integration test が 5 pattern 全件で fail-closed + R2 PUT 0 回を assert
- [ ] restore drill integration test が happy / corrupt の双方を網羅し、corrupt 時に Issue 起票 mock が `priority:high / type:security` で呼ばれる
- [ ] workflow contract test が `cron / concurrency / permissions / secrets / jobs` の 5 観点を assert
- [ ] `pnpm vitest run scripts/cf-audit-log/__tests__/integration` が green
- [ ] Phase 11 runtime evidence と scenario id が 1:1 対応表で接続されている
