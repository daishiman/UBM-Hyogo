[実装区分: 実装仕様書]

> **CONST_004 判定根拠**: sub-task 2a の最終成果物は `apps/web/playwright/tests/admin-requests.spec.ts`
> という実行可能 TypeScript ソースであり、CI で green 判定されるランタイム成果物。
> 親 workflow `taskType=docs-only` ラベルに優先し、CONST_004 に従い実装仕様書として作成する。

---

# Phase 9: 品質保証（sub-task 2a 単体スコープ）

| 項目 | 値 |
|------|-----|
| workflow_id | `task-spec-2a-admin-requests-e2e` |
| sub-task ID | `2a` |
| 起点日 | 2026-05-09 |
| Tier | standard（line >= 70% / critical smoke 100%） |
| 対象 spec | `apps/web/playwright/tests/admin-requests.spec.ts` |
| visualEvidence | NON_VISUAL（mock 駆動・スクリーンショット不要） |
| 単一スコープ | sub-task 2a 単体（2b / 2c / 2d は独立に検証） |

---

## 1. 本 Phase のスコープ宣言（独立性）

本 Phase は **sub-task 2a 単体の品質ゲート** を確定する。
2b / 2c / 2d の検証は各々の Phase 9 で行い、本 Phase の green 判定は **2a の spec 1 ファイル**に閉じる。
ただし `pnpm typecheck` / `pnpm lint` はリポジトリ全体で実行する性質上、他サブタスクの実装が並行している場合でも本 Phase は **2a spec の green と全体 typecheck/lint pass の AND 条件** で完了とする。

---

## 2. Quality Gate チェックリスト（10 項目 + grep gate 4 項目）

| # | gate | コマンド | 期待 |
|---|------|---------|------|
| 1 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| 2 | lint | `mise exec -- pnpm lint` | exit 0 |
| 3 | E2E（2a 単体） | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts` | 6 test 全 green / skip 0 |
| 4 | E2E reporter（retry log） | Playwright HTML reporter | retry 0 件（flaky 0） |
| 5 | line coverage | Stage 2 横断 Phase 7 §2 と同手順 | 2a 寄与分が line >= 70% 維持に貢献 |
| 6 | critical route smoke | `/admin/requests` が critical 集合に含まれ green | 100% |
| 7 | OKLch 直書き grep | `grep -rn 'bg-\[#\|text-\[#' apps/web/playwright/tests/admin-requests.spec.ts` | 0 件 |
| 8 | D1 binding from web | `grep -rn 'D1Database' apps/web/src apps/web/playwright/tests/admin-requests.spec.ts` | 0 件 |
| 9 | 新 fixture 追加なし | `git diff dev...HEAD -- apps/web/playwright/fixtures/auth.ts` | 既存変更なし（拡張 0） |
| 10 | `test.skip` 件数 | `grep -c "test\.skip" apps/web/playwright/tests/admin-requests.spec.ts` | 0 |

> gate 1〜2 はリポジトリ横断で実行（CLAUDE.md「PR作成の完全自律フロー」§実行順序 5 と整合）。
> gate 3 は **2a 単体** で実行可能（Playwright が指定 spec のみフィルタリング）。

---

## 3. failure rate ゲートと retry policy

### 3.1 failure rate ゲート（決定論性検証）

| 検証区分 | 手順 | 合格基準 |
|---------|------|---------|
| 単発 run | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts` を 1 回 | 6 test 全 green |
| 連続 run（手動 smoke） | 同コマンドを **連続 3 回** ローカル実行 | 失敗率 0 / 3（3 回とも green） |
| race test の決定論性 | test 4「stale approve race」を 5 回連続実行（`--repeat-each=5`） | 5 回とも 1 回目 200 / 2 回目 409 が観測される |

### 3.2 retry policy

| policy | 値 | 根拠 |
|--------|-----|------|
| Playwright `retries` | **0**（CI / local 共通） | mock 駆動・外部依存なしのため retry 不要。retry に依存した green は flaky を隠す |
| 失敗時の再実行可否 | 不可（最初の失敗を root cause として扱う） | 親仕様書 §8 / Stage 2 親 Phase 9 §2 |
| timeout | Playwright 既定（30s） | mock 応答は同期的に解決するため十分 |

> CI で `retries=2` 等が設定されていても、本 spec は **0 retry で green** であることを合格基準とする。

---

## 4. flaky 防止の確認

| 観点 | 対策 | 検証方法 |
|------|------|---------|
| 日時 | fixture の `requestedAt` を ISO8601 固定（`2026-05-01T00:00:00.000Z`） | spec 内 grep で `Date.now()` / `new Date()` 不使用を確認 |
| race | mock counter（closure）で 1 回目 / 2 回目を決定論化 | §3.1 連続 run で 0 失敗 |
| 並行 | 全 mock は `page.route()` で完結、外部 API 呼び出し 0 | gate 8 grep で `D1Database` 0 件 |
| sort | API sort 順非依存（fixture 側で `req_001` / `req_002` / `req_003` 固定順序） | spec の row index assertion が ID 直接指定 |
| network | Playwright `page.waitForResponse` を使う場合は **mock 起点の URL pattern** を直接待つ | spec 内に `waitForRequest` / `waitForResponse` 使用時は URL pattern 一致のみ |

---

## 5. 不変条件 grep gate（4 項目）

| # | 不変条件 | grep | 期待 |
|---|---------|------|------|
| 1 | HEX 直書き禁止 | `grep -rn 'bg-\[#\|text-\[#' apps/web/playwright/tests/admin-requests.spec.ts` | 0 件 |
| 2 | D1 binding from web | `grep -rn 'D1Database\|getRequestContext' apps/web/playwright/tests/admin-requests.spec.ts` | 0 件 |
| 3 | 禁止 fixture key | `grep -n 'mergedMemberId' apps/web/playwright/tests/admin-requests.spec.ts` | 0 件（親仕様書 §6 / §10 DoD 9） |
| 4 | `test.skip` 残存 | `grep -c "test\.skip" apps/web/playwright/tests/admin-requests.spec.ts` | 0 |

---

## 6. 検証コマンド（最終確認手順）

```bash
# 1. 依存セットアップ（必要時のみ）
mise exec -- pnpm install

# 2. typecheck（リポジトリ全体）
mise exec -- pnpm typecheck

# 3. lint（リポジトリ全体）
mise exec -- pnpm lint

# 4. E2E（2a 単体）
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts

# 5. 決定論性確認（手動 3 連 + race 5 連）
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts --repeat-each=5 --grep "race"

# 6. 不変条件 grep gate
grep -rn 'bg-\[#\|text-\[#' apps/web/playwright/tests/admin-requests.spec.ts
grep -rn 'D1Database\|getRequestContext' apps/web/playwright/tests/admin-requests.spec.ts
grep -n 'mergedMemberId' apps/web/playwright/tests/admin-requests.spec.ts
grep -c "test\.skip" apps/web/playwright/tests/admin-requests.spec.ts
```

> CLAUDE.md「PR作成の完全自律フロー」と整合: typecheck / lint / E2E の 3 系統 + grep gate。
> `pnpm install --force` は lockfile 不整合発生時のみ。本サブタスクは新規 dependency 追加なしで `--force` 不要。

---

## 7. CI 連動

| job | 対象 | 2a 影響 |
|-----|------|--------|
| `playwright-e2e` | apps/web e2e（全 spec） | 1 spec 追加で実行件数 +6 test |
| `verify-design-tokens` | OKLch gate（`apps/web/src` 配下） | 影響なし（spec はガード対象外だが §5 grep で手動確認） |
| `verify-indexes-up-to-date` | skill indexes | 影響なし（spec のみ追加・skill 触らず） |

---

## 8. 残課題（Stage 3 持越し候補）

| # | 残課題 | 起点 | 受け先 |
|---|-------|------|-------|
| 1 | mock helper の `helpers/admin-mocks.ts` 抽出（2a/2b/2c 横断） | Phase 8 §2 抽出候補 4 件 | Stage 2 横断 Phase 8 または Stage 3 |
| 2 | line cov 70% 未達時の追加 unit test（必要なら） | Stage 2 親 Phase 7 §2 | Stage 3 |

> 上記は **本サブタスク内では blocker ではない**。本 Phase 9 の green 判定には影響しない。

---

## 9. Phase 9 完了定義

- [x] Quality Gate 10 項目チェックリストを §2 で確定
- [x] failure rate ゲート / retry policy を §3 で確定（retry=0、3 連 run で 0 失敗）
- [x] flaky 防止策 5 観点を §4 で確定
- [x] 不変条件 grep gate 4 項目を §5 で確定
- [x] 検証コマンドを `mise exec --` 形式で §6 に整理（CLAUDE.md 準拠）
- [x] CI 連動マトリクスを §7 で確定
- [x] 残課題 2 件を Stage 3 へ申し送り（§8）

> Phase 10 へ進める。

---

## 参照（正本）

| 用途 | path |
|------|------|
| 親 sub-task 仕様書（DoD 10 項目） | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260509-172209-wt-12/docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` §10 |
| Stage 2 横断 Phase 9 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260509-172114-wt-11/docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-9.md` |
| 参照モデル（既存 admin smoke） | `apps/web/playwright/tests/admin-pages.spec.ts` |
| 検証コマンド準拠元 | `CLAUDE.md` § よく使うコマンド / § PR作成の完全自律フロー |

---

## Template Compliance Appendix

### メタ情報

- workflow: task-spec-2a-admin-requests-e2e
- phase: 9
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

### 目的

sub-task 2a 単体の品質ゲート 10 項目 + grep gate 4 項目 + retry policy + flaky 防止策を確定し、CI green 判定の根拠を明文化する。

### 実行タスク

- typecheck / lint / E2E（2a 単体）の検証コマンドを `mise exec --` 形式で確定する。
- failure rate ゲートと retry=0 policy を確定する。
- flaky 防止策 5 観点と grep gate 4 項目を確定する。

### 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 sub-task 仕様書 `2a-admin-requests.md` §10

### 実行手順

1. §2 の 10 項目 gate を順に実行する。
2. §3 の failure rate ゲートを 3 連 run + race 5 連で検証する。
3. §5 の grep gate 4 項目を実行する。
4. 失敗が観測された場合、retry に頼らず root cause 修正を行う。

### 統合テスト連携

- NON_VISUAL phase につき、screenshot 不要。
- E2E runtime 結果は Stage 2 横断 outputs/phase-11/evidence と統合（本 sub-task 単体では Phase 11 出力は親 workflow 側に集約）。

### 成果物

- 本 phase markdown
- E2E green ログ（CI または手動 run の Playwright reporter）
- grep gate の出力（0 件確認）

### 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier line >= 70% / critical smoke 100%（2a 寄与分として確認）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

### タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
- [x] retry=0 / 3 連 run / race 5 連 / grep 4 件 すべて手順化した。
