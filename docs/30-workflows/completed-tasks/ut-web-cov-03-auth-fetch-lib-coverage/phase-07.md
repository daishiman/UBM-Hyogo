# Phase 7: AC マトリクス — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

> 当タスクは当初 `docs-only` として起票されたが、目的達成に Vitest テストファイル新規作成が必須のため、CONST_004（実態優先）に従い `taskType` を `implementation` に補正している。本 Phase は AC × test ID × evidence path の対応マトリクスを確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 7 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 改訂日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

`index.md` 記載の AC（5 項目）と Phase 6 で列挙した異常系 ID を、test file × test ID 範囲 × evidence path × status の 5 軸マトリクスで対応付ける。

## 実行タスク

1. AC 一覧を抽出（index.md + 個別ファイル AC）。
2. AC × test ID × test file × evidence path × status の 5 列マトリクスを作成。
3. PARTIAL → PASS 昇格条件を明記。
4. 計測コマンド・evidence path の正規化。

## 参照資料

- index.md（タスク root）
- docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/phase-06.md
- docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/phase-05.md

## AC 一覧（index.md より抽出）

- **AC-01**: auth client は happy / token-missing / token-invalid / network-fail の 4 ケースを網羅
- **AC-02**: fetch wrapper（authed/public）は 200 / 401 / 403 / 5xx / network-fail を網羅
- **AC-03**: me-types は zod or type predicate の round-trip
- **AC-04**: 全対象ファイルで Stmts/Lines/Funcs ≥85%, Branches ≥80%
- **AC-05**: 既存 web test に regression なし
- **AC-06**: magic-link / oauth-client / session の lib も coverage 達成（追加 AC）

## test ID prefix 体系

| prefix | 対象 | test file |
|---|---|---|
| AUTH- | `auth.ts` | `apps/web/src/lib/auth.test.ts` |
| MLC- | `auth/magic-link-client.ts` | `apps/web/src/lib/auth/magic-link-client.test.ts` |
| OAC- | `auth/oauth-client.ts` | `apps/web/src/lib/auth/oauth-client.test.ts` |
| SES- | `session.ts` | `apps/web/src/lib/session.test.ts` |
| FAU- | `fetch/authed.ts` | `apps/web/src/lib/fetch/authed.test.ts` |
| FPU- | `fetch/public.ts` | `apps/web/src/lib/fetch/public.test.ts` |
| MET- | `api/me-types.ts` | `apps/web/src/lib/api/me-types.test-d.ts` |

## AC × test マトリクス

| AC ID | AC 内容 | 対象ファイル | test file | test ID 範囲 | evidence path | status |
|---|---|---|---|---|---|---|
| AC-01 | auth client 4 ケース | `auth.ts` | `auth.test.ts` | AUTH-H01, AUTH-E01, AUTH-E03, AUTH-E05 | `apps/web/coverage/coverage-summary.json#auth.ts` | planned |
| AC-02a | fetch wrapper authed 200/401/403/5xx/network | `fetch/authed.ts` | `fetch/authed.test.ts` | FAU-H01, FAU-E02, FAU-E03, FAU-E04, FAU-E05 | `apps/web/coverage/coverage-summary.json#fetch/authed.ts` | planned |
| AC-02b | fetch wrapper public 200/404/500/network | `fetch/public.ts` | `fetch/public.test.ts` | FPU-H01, FPU-E03, FPU-E04, FPU-E05 | `apps/web/coverage/coverage-summary.json#fetch/public.ts` | planned |
| AC-03 | me-types round-trip | `api/me-types.ts` | `api/me-types.test-d.ts` | MET-T01..MET-T04 | typecheck 緑 / coverage exclude 確認 | planned |
| AC-04 | coverage ≥85%/≥80% | 全 7 ファイル | (集約) | - | `apps/web/coverage/coverage-summary.json` 全 metric | planned |
| AC-05 | regression なし | 既存 test | (既存) | - | `pnpm --filter web test` 全緑 | planned |
| AC-06a | magic-link 網羅 | `magic-link-client.ts` | `magic-link-client.test.ts` | MLC-H01, MLC-E01..E05 | coverage-summary.json#magic-link-client.ts | planned |
| AC-06b | oauth-client 網羅 | `oauth-client.ts` | `oauth-client.test.ts` | OAC-H01, OAC-E01..E04 | coverage-summary.json#oauth-client.ts | planned |
| AC-06c | session 網羅 | `session.ts` | `session.test.ts` | SES-H01, SES-E01..E04 | coverage-summary.json#session.ts | planned |

## 詳細 test ID 範囲（planning レベル）

### auth.test.ts (AUTH-001..AUTH-025)

- AUTH-001..AUTH-006: fetchSessionResolve happy + AUTH-E01..E06
- AUTH-007..AUTH-008: providers factory（google / credentials の export 確認）
- AUTH-009..AUTH-014: signIn callback 6 case（AUTH-E07..E10 + happy + admin gate）
- AUTH-015..AUTH-019: jwt callback 5 case（AUTH-E11 + token 反映 happy + role 反映 + memberId 反映 + 既存保持）
- AUTH-020..AUTH-022: session callback 3 case（happy / memberId 注入 / role 注入）
- AUTH-023..AUTH-025: getAuth lazy loader（初回 / 2 回目 cache / 並列 race）

### magic-link-client.test.ts (MLC-001..MLC-008)

- MLC-001: happy 202 + state="sent"
- MLC-002..MLC-005: MLC-E01..E04
- MLC-006..MLC-008: isLoginGateState true / false / 非 string

### oauth-client.test.ts (OAC-001..OAC-005)

- OAC-001: happy "/safe" → "/safe"
- OAC-002..OAC-004: OAC-E01..E03
- OAC-005: signIn provider="google" 固定確認

### session.test.ts (SES-001..SES-005)

- SES-001: happy
- SES-002..SES-005: SES-E01..E04

### fetch/authed.test.ts (FAU-001..FAU-010)

- FAU-001: happy 200 + cookies 転送
- FAU-002..FAU-009: FAU-E01..E08
- FAU-010: cookies 複数件結合

### fetch/public.test.ts (FPU-001..FPU-010)

- FPU-001: happy via service-binding
- FPU-002: happy via fetch
- FPU-003..FPU-008: FPU-E01..E06
- FPU-009..FPU-010: query string / headers passthrough

### me-types.test-d.ts (MET-T01..MET-T04)

- MET-T01: `Me` shape
- MET-T02: `MeResponse` discriminated union
- MET-T03: 余剰プロパティ拒否（excess property check）
- MET-T04: null branch

## PARTIAL → PASS 昇格条件

- **PARTIAL**: test 実装済み・実行緑だが coverage が AC-04 閾値未達。
- **PASS**: 全 AC が implemented + coverage-summary.json で metric 達成 + 既存 test 緑。

## 計測コマンド

```bash
# 全体 coverage
mise exec -- pnpm --filter web test:coverage

# evidence 抽出
cat apps/web/coverage/coverage-summary.json | jq '.["<absolute-path>/auth.ts"]'

# regression 確認
mise exec -- pnpm --filter web test
```

## cross-check 手順

1. AC ID をすべて列挙し、各 AC が test file の 1 つ以上に mapping されているか目視。
2. 各 test file の test ID が Phase 6 の異常系マトリクス ID を包含するか確認。
3. coverage-summary.json の対象パスが AC-04 閾値を満たすか jq で確認。
4. 漏れがあれば Phase 5 の着手順序に戻り test を追加。

## 実行手順

- 対象 directory: docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時はマトリクスの status を planned → implemented → verified に更新する。

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 関連 quality gate: 06b-A-me-api-authjs-session-resolver; release readiness handoff: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] AC 一覧を index.md と整合
- [ ] test ID prefix 体系を確定
- [ ] AC × test × evidence マトリクス完成
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md（AC マトリクス本体）

## 完了条件 (DoD)

- 全 AC が test file × test ID 範囲 × evidence path × status の 4 列に mapping されている。
- Phase 6 の異常系 ID が漏れなく test ID に展開されている。
- PARTIAL → PASS 昇格条件が明記されている。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] CONST_005 必須項目を該当範囲で具体化済み
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ、test file 構成、ID 体系、helper 抽出候補（fetch mock / cloudflare context mock の重複）を渡す。
