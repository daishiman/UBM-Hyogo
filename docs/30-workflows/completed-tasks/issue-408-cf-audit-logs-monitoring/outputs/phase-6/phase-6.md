# Phase 6: カバレッジ確認（focused unit test）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed_local |

## 目的

Phase 5 で実装した `scripts/cf-audit-log/**` モジュールに対して focused unit test を追加する。アプリ本体（apps/api / apps/web）の coverage gate には影響させず、`scripts/cf-audit-log/**` の pure modules と D1 adapter contract を対象にローカル測定する。

## スコープ

| 含む | 含まない |
| --- | --- |
| `severity-classifier.ts` 100% 行 | apps/api / apps/web のテスト変更 |
| `cloudflare-client.ts`（fetch mock 注入） | 本番 Cloudflare API 直叩き |
| `issue-reporter.ts`（octokit mock） | GitHub Issue 実起票 |
| `d1-client.ts`（in-memory D1 fake） | production D1 接続 |
| `baseline.ts`（合成データ） | ML 検証 |

## テストファイル配置

| target module | test file path |
| --- | --- |
| `severity-classifier.ts` | `scripts/cf-audit-log/__tests__/severity-classifier.test.ts` |
| `cloudflare-client.ts` | `scripts/cf-audit-log/__tests__/cloudflare-client.test.ts` |
| `issue-reporter.ts` | `scripts/cf-audit-log/__tests__/issue-reporter.test.ts` |
| `baseline.ts` | `scripts/cf-audit-log/__tests__/baseline.test.ts` |
| `d1-client.ts` | `scripts/cf-audit-log/__tests__/d1-client.test.ts` |

## test-plan.md（テストケース）

### severity-classifier.test.ts（100% lines / 95% branches 必達）

| ID | 入力 | 期待 |
| --- | --- | --- |
| C-01 | F1 normal + baseline 学習済 | null |
| C-02 | F2 foreign-ip success（GitHub IP range 外） | `HIGH / foreign-ip success...` |
| C-03 | F3 403 burst（recentFailuresInHour=10, p95=1, multiplier=1.5） | `MEDIUM / 403 burst 10/h` |
| C-04 | F4 off-hours JST 03:00 success | `LOW / off-hours success at JST 3:00` |
| C-05 | baseline=null（learning 中） | null（HIGH 含め全て null） |
| C-06 | rotation 期間内の event | null |
| C-07 | success かつ ip 欠落 | null（HIGH 判定スキップ） |
| C-08 | 403 だが recentFailuresInHour=1（閾値未満） | null |
| C-09 | 業務時間境界（JST 09:00 / 19:00） | 09:00 は in-hours、19:00 は off-hours |
| C-10 | actor.user_agent 欠落 + foreign-ip | HIGH（UA は補助情報、欠落でも判定） |

### cloudflare-client.test.ts

| ID | mock fetch 振る舞い | 期待 |
| --- | --- | --- |
| CC-01 | 1 page result + cursor=null | 全 events yield、HTTP 1 回 |
| CC-02 | 2 pages（cursor → 次ページ → null） | 全 events 順序維持で yield、HTTP 2 回 |
| CC-03 | 401 応答 | throw `CF audit_logs 401 ...` |
| CC-04 | 5xx + retry なし（MVP は throw） | throw |
| CC-05 | 空 result | yield 0 件で正常終了 |

### issue-reporter.test.ts

| ID | 前提 | 期待 |
| --- | --- | --- |
| IR-01 | 未起票 finding + dryRun=false | `octokit.rest.issues.create` 1 回呼ばれ、`recordReported` 呼ばれる |
| IR-02 | 既起票 (`isAlreadyReported` が issueNumber 返す) | `create` 呼ばれない、`deduped: true` |
| IR-03 | dryRun=true | `create` 呼ばれない、stdout に `[DRY-RUN]` 出力 |
| IR-04 | labels が `priority:high`, `type:security` | `create` 呼び出し引数の labels が一致 |
| IR-05 | title prefix が severity 別 | TC-02/03/04 で title prefix 一致 |
| IR-06 | full IP / user_agent / raw JSON を含む event | Issue body には redacted IP と D1 参照のみを出し、raw event は出さない |

### CLI / fixture e2e

`fetch.ts` / `analyze.ts` は production credential と D1 remote state に依存するため、今回サイクルでは pure module + D1 adapter の focused unit test で境界を固定する。runtime e2e は Phase 11 の hourly run / D1 row / synthetic issue / dedup evidence で実値化する。

### baseline.test.ts

| ID | 入力 | 期待 |
| --- | --- | --- |
| B-01 | 7 日 × 24h × 1 success/h（均一） | `successPerHourP95 ≈ 1` |
| B-02 | 1 日だけ 30/h スパイク（残りは 1/h） | trimmed p95 が 1〜2 範囲内（outlier 吸収） |
| B-03 | 業務時間内 95% / 業務外 5% | `offHoursRatio ≈ 0.05 ± 0.01` |
| B-04 | events=0 | デフォルト baseline (`{0,0,0}`) を返す |

### d1-client.test.ts

| ID | 操作 | 期待 |
| --- | --- | --- |
| D-01 | `insertEvents` で同 id 2 回 | `INSERT OR IGNORE` で 1 行のみ |
| D-02 | `purgeOlderThan` cutoff 30 日 | 該当行のみ削除 |
| D-03 | `recordReported` → `isAlreadyReported` | issueNumber 返却 |

## 依存ライブラリ

- `vitest`（既存）
- GitHub Issue API は `IssueClient` interface を自前 mock する。Octokit は追加しない。
- D1 fake: `scripts/cf-audit-log/d1-client.ts` の `InMemoryD1` を使用する。Miniflare D1 の重量 setup は MVP では避ける。

## 実行コマンド

```bash
# 全 test
mise exec -- pnpm exec vitest run scripts/cf-audit-log/__tests__

# coverage 付き（Phase 7 で再利用）
mise exec -- pnpm vitest run scripts/cf-audit-log \
  --coverage \
  --coverage.reportsDirectory=coverage/cf-audit-log \
  --coverage.include='scripts/cf-audit-log/**' \
  --coverage.exclude='scripts/cf-audit-log/__tests__/**' \
  --coverage.exclude='scripts/cf-audit-log/__fixtures__/**'

pnpm exec tsx scripts/cf-audit-log/analyze.ts --window 1h --dry-run
```

## カバレッジレポート出力先

`coverage/cf-audit-log/`（lcov + html）。Phase 7 の判定で参照。

## 成果物

- `outputs/phase-6/phase-6.md`（本ファイル）
- focused unit test 実体: `scripts/cf-audit-log/__tests__/*.test.ts`（5 files / 37 tests）
- 実行ログ: `pnpm exec vitest run scripts/cf-audit-log/__tests__`（Phase 12 review cycle で 37 passed）

## DoD（完了条件）

- [x] テストファイル 5 本が `scripts/cf-audit-log/__tests__/` に存在
- [x] `pnpm exec vitest run scripts/cf-audit-log/__tests__` 全 pass
- [x] severity-classifier / cloudflare-client / issue-reporter / baseline / d1-client の focused contract を網羅
- [x] redaction regression（full IP / user_agent / raw JSON を Issue body に出さない）を追加
- [ ] production credential を使う CLI e2e は Phase 11 runtime evidence で実施
