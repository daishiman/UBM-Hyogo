# Phase 7: テスト計画（unit / integration / regression / 7 日観測）

## 目的

Phase 6 で実装した変更の検証戦略を確定する。本タスクはコード追加が最小（observation 2 ファイル + workflow yml 編集 + leakage grep のフラグ追加）であり、テストの主軸は「既存 unit test の再走 + staging workflow_dispatch の dry-run + 7 日 observation の telemetry 検証」となる。新規 focused test は observation 2 件のみ追加する。

## 完了条件

- [ ] unit test レイヤ（既存 + 新規）がすべて pass
- [ ] integration test として staging workflow_dispatch の dry-run が成功する
- [ ] regression test として 7 日 hourly run の 4 観測軸（Issue 起票数 / fallback rate / p95 latency / leakage grep）がすべて within
- [ ] DoD（7 日観測完了 / fallback rate 安定 / leakage 0 件 / rollback runbook approve 済み）を満たす
- [ ] ローカル実行コマンド一覧が確定し、CI と整合する

## 前 Phase 依存

- Phase 5: 関数シグネチャ / I/O 契約
- Phase 6: 実装手順 / 各ステップの期待出力

## 7-1. テスト分類と責務

| レイヤ | 対象 | 範囲 | 実行場所 |
| --- | --- | --- | --- |
| unit | classifier interface / threshold-ml fallback（親 #515 既存） | 既存テストの再走 | local + CI |
| unit | `post-switch-monitor.ts`（新規） | hourly snapshot の集計ロジック / D1 query mock | local + CI |
| unit | `fallback-rate-alert.ts`（新規） | 閾値判定（3 hour 連続 / 0.05）/ Issue 起票 mock | local + CI |
| unit | `secret-leakage-grep.ts` の `--exit-on-detect`（既存拡張） | hit 0 件で exit 0 / 1 件以上で exit 1 | local + CI |
| integration | staging workflow_dispatch dry-run | hourly run 1 回・Issue 起票なし・artifact 出力 | GitHub Actions (staging) |
| regression | hourly run 7 日観測 | 4 観測軸 telemetry / fallback rate alert 非発火 / leakage 0 件 | GitHub Actions (production, 7 日間) |

新規追加するテストは下表に集約する。

| パス | 主要 case |
| --- | --- |
| `scripts/cf-audit-log/observation/__tests__/post-switch-monitor.test.ts` | (1) D1 mock の hourly query → snapshot fields 8 個 / (2) leakage grep result の env 取り込み / (3) `--out` 指定で fs write・未指定で stdout |
| `scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts` | (1) 3 hour 連続超で trigger=true / (2) 2 hour 連続のみで trigger=false / (3) Issue 起票 body が leakage grep で redacted / (4) GitHub API 5xx 3 回 retry |
| `scripts/cf-audit-log/evaluation/__tests__/secret-leakage-grep.test.ts` (既存拡張) | `--exit-on-detect` フラグで hit 1 件以上時 exit 1 / hit 0 件時 exit 0 |

## 7-2. unit test 詳細（focused）

### 7-2-1. `post-switch-monitor.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest';
import { collectHourlySnapshot } from '../post-switch-monitor';

describe('collectHourlySnapshot', () => {
  it('returns 8-field HourlySnapshot from D1 mock', async () => {
    const mock = vi.fn().mockResolvedValue(/* fixture */);
    const s = await collectHourlySnapshot({ /* opts */ });
    expect(s).toMatchObject({
      hour: expect.any(String),
      classifierUsed: expect.stringMatching(/^(threshold|ml)$/),
      classifierVersion: expect.any(String),
      totalEvents: expect.any(Number),
      issuesOpenedThisHour: expect.any(Number),
      fallbackRate: expect.any(Number),
      p95LatencyMs: expect.any(Number),
      leakageGrepResult: expect.stringMatching(/^(clean|dirty)$/),
    });
  });

  it('writes JSON to --out path when given', async () => { /* ... */ });
  it('writes to stdout when --out is omitted', async () => { /* ... */ });
});
```

### 7-2-2. `fallback-rate-alert.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest';
import { evaluateAndAlert } from '../fallback-rate-alert';

describe('evaluateAndAlert', () => {
  it('triggers when fallbackRate > 0.05 for 3 consecutive hours', async () => {
    // 3 件すべて 0.06
    const r = await evaluateAndAlert({ /* opts with fixtures */ });
    expect(r.triggered).toBe(true);
    expect(r.issueUrl).toMatch(/issues\/\d+$/);
  });

  it('does not trigger for only 2 consecutive hours', async () => {
    const r = await evaluateAndAlert({ /* ... */ });
    expect(r.triggered).toBe(false);
  });

  it('redacts secrets in issue body via leakage grep', async () => { /* ... */ });
  it('retries on GitHub API 5xx (3 attempts)', async () => { /* ... */ });
});
```

## 7-3. integration test（staging workflow_dispatch）

```bash
gh workflow run cf-audit-log-monitor.yml \
  --ref dev -f dry_run=true -f environment=staging
gh run list --workflow cf-audit-log-monitor.yml --limit 1 --json databaseId,conclusion
gh run view <run-id> --log
```

合格条件:

- conclusion = success
- post-step `secret-leakage-grep` が exit 0
- post-step `post-switch-monitor` が JSON artifact を 1 件アップロード
- post-step `fallback-rate-alert` が trigger=false
- staging hourly run で Issue が 1 件も起票されないこと（`--dry-run` 経路）

## 7-4. regression test（7 日 hourly run 観測）

production merge 後 7 日間、hourly run を観測する。観測ログは `outputs/phase-11/observation/{day-1..7}.md` に日次集計し、`summary-7day.md` で終端集計する。

| 軸 | 計測方法 | 合格条件 |
| --- | --- | --- |
| Issue 起票数 | `gh issue list --label cf-audit --search "created:>=$(date -u -v-7d +%Y-%m-%d)" \| wc -l` | threshold 期 baseline ± 50% 以内 |
| fallback rate | hourly snapshot の `fallbackRate` 平均 | mean ≤ 0.05 / 3 hour 連続超なし |
| p95 latency | hourly snapshot の `p95LatencyMs` | threshold 期 +20% 以内 |
| leakage grep | hourly post-step の exit code | 7 日間 0 dirty |

NG 時はステップ 8（rollback）へ即移行。

## 7-5. ローカル実行コマンド（CONST_005）

```bash
# 静的検査（PR 作成前必須）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# focused unit test（新規 2 + 拡張 1）
mise exec -- pnpm --filter @repo/scripts test \
  scripts/cf-audit-log/observation/__tests__/post-switch-monitor.test.ts \
  scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts \
  scripts/cf-audit-log/evaluation/__tests__/secret-leakage-grep.test.ts

# 既存 classifier test の re-run（regression 担保）
mise exec -- pnpm --filter @repo/scripts test scripts/cf-audit-log/classifier
```

すべて exit 0 を確認してから PR を作成する。

## 7-6. CI gate との整合

- `verify-design-tokens` / `verify-indexes` 等は本タスクの変更範囲外（影響しないことを CI で確認）
- 新規 workflow step（leakage grep / monitor / alert）はそれぞれ独立 step で fail を分離
- 7 日観測の hourly artifact は `actions/upload-artifact@v4` で保管期間 30 日

## 7-7. DoD（Definition of Done）

- [ ] 新規 focused unit test 2 + 拡張 test 1 がすべて pass
- [ ] staging workflow_dispatch dry-run が success（post-step 3 種すべて期待挙動）
- [ ] production merge 後 7 日観測が 4 観測軸すべて within
- [ ] hourly post-step の `secret-leakage-grep` が 7 日間 0 件 dirty
- [ ] `fallback-rate-alert` が 3 hour 連続発火していない（発火していれば rollback 完了）
- [ ] rollback runbook が CODEOWNERS approve 済みで `15-infrastructure-runbook.md` に反映
- [ ] SSOT 3 ファイル（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）が更新
- [ ] PR 本文に `Refs #549` を含み、`Closes` を使わない

## Handoff（Phase 8 以降へ渡す入力）

- 新規 / 拡張テストファイルの場所と主要 case 一覧
- staging dry-run の合格条件と実行コマンド
- 7 日 regression observation の合格条件と日次集計テンプレ
- CONST_005 を満たすローカル実行コマンド一式
- DoD checklist（Phase 11 evidence / Phase 12 outputs と接続）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 参照資料

- `index.md` ・ `phase-03.md` ・ `phase-05.md` ・ `phase-06.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/phase-07.md`（親タスクの整合性検証）
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`

## 実行タスク

| Task | 内容 |
| --- | --- |
| 07-1 | 親 #515 / FU-03-C #548 / Issue #518 HOLD との依存関係を確認する |
| 07-2 | SSOT 3 ファイルとの narrative drift を確認する |

## 成果物/実行手順

本 Phase の成果物は `phase-07.md`。依存関係の確認結果は Phase 12 compliance check に反映する。

## 統合テスト連携

integration evidence は実装サイクルで取得し、本 Phase は依存関係 contract のみを固定する。
