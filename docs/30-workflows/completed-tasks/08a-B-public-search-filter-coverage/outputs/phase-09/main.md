# Phase 9 出力 — 品質保証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 9 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 関連 CONST | CONST_004（重複検出 follow-up）/ CONST_005（YAGNI gate） |

## 実装区分宣言

`[実装区分: 実装仕様書]`。Phase 1〜3 と同じ判定根拠。Phase 9 では Phase 5 ランブックで実施する品質ゲートの **コマンド・基準・しきい値** を仕様書として固定する。コード実改変や CI 設定変更はこの phase の出力には含めない。

## 品質基準（しきい値）

| 観点 | しきい値 | 計測対象 |
| --- | --- | --- |
| TypeScript エラー | 0 | `apps/api` / `apps/web` / `packages/shared` |
| Lint violation | 0 | 同上 |
| Unit + Integration coverage（line） | 既存 baseline 維持 + 新規追加コードに対し **80% 以上** | `apps/api/src/_shared/search-query-parser.ts` / `apps/api/src/repository/publicMembers.ts` / `apps/web/src/lib/url/members-search.ts` |
| Unit + Integration coverage（branch） | 新規分岐 70% 以上 | parser fallback / clamp / dedup の各分岐 |
| a11y（axe-core） | violations = 0 | `/members` 初期状態 / 検索 hit / 空結果 |
| 性能（API レスポンスタイム）p95 | ≤ 300ms（local D1 fixture 200 件） | `GET /public/members` 全 6 param 組合せ |
| 性能（API レスポンスタイム）p95 | ≤ 800ms（local D1 fixture 1000 件） | 同上 |
| Bundle size 増分 | +10 KB 以内（gzip） | `apps/web` |
| Cloudflare 無料枠日次 | Workers 無料枠 100k req/day を超えない試算 | `wrangler tail` での実測 |

## 静的解析手順

### typecheck

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/shared typecheck
# あるいは workspace 一括
mise exec -- pnpm typecheck
```

合格条件: 全 package で exit 0、`error TS\d+` 行が 0。

### lint

```bash
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm lint
```

合格条件: violation 0。`--fix` の自動修正は Phase 5 ランブック内で許可、本 phase の gate では `--fix` 無しで再実行し 0 を確認する。

### secret hygiene

```bash
# .env / wrangler.toml にハードコード secret が混入していないか
grep -rE 'sk_live_|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}' apps/ packages/ || echo "no secret hits"
```

合格条件: hit 0。CI 側の `gitleaks` / `truffleHog` ジョブが green。

## カバレッジ計測

### apps/api

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage
```

着目ファイル:
- `apps/api/src/_shared/search-query-parser.ts`（fallback / clamp / dedup の全分岐）
- `apps/api/src/repository/publicMembers.ts`（zone / status / tag AND / sort / pagination の各分岐）
- `apps/api/src/use-cases/public/list-public-members.ts`（バルク fields 取得後の Map 組み立て分岐）
- `apps/api/src/_shared/value-json.ts`（Phase 8 D-2 で新設）
- `apps/api/src/repository/_shared/sql.ts`（Phase 8 D-4 で `escapeLikePattern` 追加）

### apps/web

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage
```

着目ファイル:
- `apps/web/src/lib/url/members-search.ts`（parse / toApiQuery / 初期値省略の各分岐）
- `apps/web/src/components/forms/SegmentedControl.tsx`（Phase 8 D-6 で新設）

### shared

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test -- --coverage
```

`packages/shared/src/zod/public-search.ts`（Phase 8 D-1 で新設）の zod schema 全 enum 値が parse できることを確認。

### カバレッジレポート保存先

`outputs/phase-11/coverage/{api,web,shared}/coverage-summary.json` に手動 smoke 時の実測値を記録。

## 性能ベンチ手順

### local D1 fixture 準備

```bash
# 既存 seed スクリプトに 200 件 / 1000 件モードを追加（Phase 5 で実装）
mise exec -- pnpm --filter @ubm-hyogo/api d1:seed --count 200
mise exec -- pnpm --filter @ubm-hyogo/api d1:seed --count 1000
```

### ベンチコマンド

```bash
# 6 param すべての代表組合せを curl で 100 回叩いて p50/p95/p99 を出す
bash scripts/bench/public-members.sh 200    # 200 件 fixture
bash scripts/bench/public-members.sh 1000   # 1000 件 fixture
```

`scripts/bench/public-members.sh`（Phase 5 で実装）は以下を順次実行:

| ケース | URL |
| --- | --- |
| 全件 / 既定 | `/public/members` |
| q hit | `/public/members?q=ふじた` |
| zone+status | `/public/members?zone=1_to_10&status=member` |
| tag AND | `/public/members?tag=react&tag=typescript` |
| sort=name | `/public/members?sort=name` |
| 大量ページ | `/public/members?limit=100&page=10` |

### 出力先

`outputs/phase-11/bench/public-members-{200,1000}.json`。p50/p95/p99 の数値を JSON で保存し、Phase 9 のしきい値（200 件 p95 ≤ 300ms / 1000 件 p95 ≤ 800ms）と突合する。

### バルク化（Phase 8 D-3）の効果検証

`listSummaryFieldsByResponseIds` 採用前後で p95 を比較記録する。改善が `> 30%` 出ない場合は別 issue へ降格判断。

## a11y 検証

### axe-core 実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/a11y/members.spec.ts
```

検査対象 URL（Phase 11 manual smoke と同じ）:
- `/members`（既定）
- `/members?q=ふじた`
- `/members?zone=1_to_10&status=member&tag=react`
- `/members?q=zzzzz`（空結果）

合格条件:
- `axe.run()` の `violations.length === 0`
- 各 filter input が visible label または `aria-label` を持つ
- segmented control が `role="radiogroup"` + Arrow キー対応（Phase 8 D-6）
- 結果数が `role="status"` + `aria-live="polite"` でアナウンスされる

レポート保存先: `outputs/phase-11/a11y/members-axe.json`

### キーボード手動確認

| 操作 | 期待結果 |
| --- | --- |
| Tab で q input → zone → status → tag → sort → density → 結果一覧 | 全要素到達 |
| Shift+Tab で逆順到達 | 同上 |
| zone segmented で Arrow Right/Left | 値切替（focus 移動なし） |
| Enter で `絞り込みをクリア`（空結果時） | `/members` に遷移 |

## セキュリティ観点

### SQL injection

| 対象 | 防御 | 検証 |
| --- | --- | --- |
| `q` LIKE bind | prepared statement + `LIKE ? ESCAPE '\\'`（Phase 12 review で実装済み） | unit test: `q="' OR 1=1 --"` で 0 件 |
| `zone` / `status` JSON value | `JSON.stringify(input)` で文字列化 + prepared bind | unit test: `zone="all'; DROP--"` で fallback `all` |
| `tag` IN 句 | `placeholders(n)` で動的 placeholder 生成 + spread bind | unit test: `tag="')--"` を含む |

### XSS

| 対象 | 防御 | 検証 |
| --- | --- | --- |
| `q` 値の URL 反映 | Next.js の `URLSearchParams` 経由 escape | unit test: `q="<script>"` が URL escape される |
| 結果 `items[].fullName` 等表示 | React デフォルト escape | 手動 smoke: `q="<img>"` で `<img>` がそのままテキスト表示 |
| `appliedQuery` のエコー | server response、HTML 直挿入なし | viewmodel test |

### admin-only field 漏洩防止（不変条件 #6）

| 検査 | 実装 | テスト |
| --- | --- | --- |
| response strict | `PublicMemberListViewZ.strict()` | viewmodel test で extra key を持つ payload が reject される |
| SELECT 句 | `mi.member_id, mi.current_response_id, mi.last_submitted_at` のみ | repository unit test で SQL 文字列に `responseEmail` 等が含まれないこと |
| summary allowlist | `SUMMARY_KEYS` allowlist で抽出 | use-case test で `__extra__:` key が結果に含まれないこと |

## 不変条件 #4 / #5 / #6 の自動テスト化

| 不変条件 | テストファイル（Phase 5 で追加） | テスト名 |
| --- | --- | --- |
| #4 公開状態フィルタ正確性 | `apps/api/src/repository/publicMembers.invariant.test.ts` | `非公開 / 退会済み / consent 未取得 member は listPublicMembers に含まれない` / `existsPublicMember が同条件で false を返す` |
| #5 public/member/admin boundary | `apps/web/src/lib/__tests__/no-d1-import.test.ts` | `apps/web の Server Component から D1Database 型を import していない`（grep ベース） |
| #5 同上 | `apps/api/src/__tests__/public-route-isolation.test.ts` | `公開 route が auth context 無しで応答する / admin route が同 path に mount されていない` |
| #6 admin-only field 非露出 | `apps/api/src/view-models/public/public-member-list-view.test.ts` | `responseEmail / publicConsent / rulesConsent / publishState / isDeleted / internalNote を含む payload は strict reject される` |

各テストは CI（`.github/workflows/test.yml`）の `apps-api` / `apps-web` job に組み込まれる前提。

## review checklist

| 観点 | 確認項目 |
| --- | --- |
| spec 整合 | Phase 1 AC（AC-Q*/Z*/S*/T*/O*/D*/E1/V1/L1/A1/A2/INV4/5/6）すべてに対応するテストが存在する |
| 不変条件 | #4 / #5 / #6 が自動テスト化されている（上表） |
| coverage | 新規追加コードが 80% 以上 |
| typecheck / lint | exit 0 |
| a11y | axe violations 0 / keyboard 全到達 |
| 性能 | 200 件 p95 ≤ 300ms / 1000 件 p95 ≤ 800ms |
| security | SQL injection / XSS / admin-only field 漏洩の各 unit test が green |
| runtime 境界 | この Phase では deploy / runtime smoke を実行しない。AC 直結の静的実装 drift は Phase 12 review で修正済み |
| 自走禁止 | deploy / commit / push / PR を実行していない |

## DoD（Phase 9 / gate 通過条件）

| ID | 内容 | 確認方法 |
| --- | --- | --- |
| P9-DoD-1 | typecheck / lint が全 package で exit 0 | `pnpm typecheck` / `pnpm lint` |
| P9-DoD-2 | 新規追加コードの line coverage 80% 以上 | `coverage-summary.json` |
| P9-DoD-3 | 不変条件 #4 / #5 / #6 が各 1 件以上の自動テストで担保 | 上表 4 テストファイルが存在 + green |
| P9-DoD-4 | a11y violations 0（axe-core） | `outputs/phase-11/a11y/members-axe.json` |
| P9-DoD-5 | 性能ベンチ 200/1000 件で p95 しきい値内 | `outputs/phase-11/bench/*.json` |
| P9-DoD-6 | SQL injection / XSS / admin-only field の各 security テストが green | `apps/api` test 結果 |
| P9-DoD-7 | secret hygiene grep が hit 0 | `grep -rE ...` 結果 |
| P9-DoD-8 | この phase の出力でアプリコード差分・deploy・commit・push・PR を実施していない | git status 確認 |

## 次 Phase への引き渡し

Phase 10（最終レビュー）へ以下を渡す:

- 品質しきい値（typecheck/lint/coverage/a11y/性能/security）と計測コマンド
- 不変条件 #4/#5/#6 の自動テスト 4 ファイルの test 名
- evidence path: `outputs/phase-11/{coverage,bench,a11y}/`
- review checklist 9 項目
- Phase 8 D-4 の LIKE bind 切替は今回サイクル内で実装済み。Phase 10 へは focused test 実行結果を渡す
