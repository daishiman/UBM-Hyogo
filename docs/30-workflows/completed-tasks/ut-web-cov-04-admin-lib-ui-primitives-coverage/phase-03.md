# Phase 3: 設計レビュー — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 2 で確定した test 設計に対し、aiworkflow-requirements / 不変条件 / 重複排除 / coverage 達成性のレビューを行い、Phase 4-13 の実装着手可能性を担保する。テスト追加（実装行為）が後続するため。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 3 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | Phase 2 設計を凍結し、Phase 5/6 で着手するテスト実装の俯瞰図 / リスクを確定するため。 |

## 目的

Phase 2 で固めた test 設計の妥当性をレビューし、不変条件適合・aiworkflow-requirements 整合・既存テストとの重複排除・coverage 達成見込み・リスクを評価する。Phase 4 (テスト戦略) / Phase 5 (実装ランブック) / Phase 6 (異常系) が CONST_005 を埋められるよう、対象モジュール群と想定変更ファイルの俯瞰を残す。

## 実行タスク

1. Phase 2 設計の不変条件適合をレビューする。完了条件: #5 / #6 違反箇所が無い。
2. aiworkflow-requirements の test 規約（`apps/web` テスト配置 / vitest setup / coverage exclude 不使用）と整合確認。完了条件: 規約逸脱が無い。
3. 既存テストとの重複排除方針が regression を生まないか確認。完了条件: 既存 13 ケースが移植先で同等以上に保護される。
4. coverage exclude を新規追加していないことを確認。完了条件: `vitest.config.ts` 改変計画が無い。
5. リスク・代替案を整理する。完了条件: 下記リスク表を作成する。
6. Phase 4-13 が参照できるよう、対象モジュール / 想定変更ファイル群の俯瞰表を残す。完了条件: 下記俯瞰表を作成する。

## 想定変更ファイル俯瞰（Phase 5/6 入力）

### 新規追加（11 件）

| 追加ファイル | 対象 production module | 主目的 |
| --- | --- | --- |
| `apps/web/src/lib/admin/__tests__/server-fetch.test.ts` | `lib/admin/server-fetch.ts` | authed fetch 契約 / env fallback / error mapping |
| `apps/web/src/lib/admin/__tests__/types.test.ts` | `lib/admin/types.ts` | 型 import smoke + satisfies |
| `apps/web/src/components/ui/__tests__/Toast.test.tsx` | `components/ui/Toast.tsx` | Provider / fake timer / useToast guard |
| `apps/web/src/components/ui/__tests__/Modal.test.tsx` | `components/ui/Modal.tsx` | open/close / focus trap forward+backward / restore focus |
| `apps/web/src/components/ui/__tests__/Drawer.test.tsx` | `components/ui/Drawer.tsx` | Modal と同形 |
| `apps/web/src/components/ui/__tests__/Field.test.tsx` | `components/ui/Field.tsx` | hint branch |
| `apps/web/src/components/ui/__tests__/Segmented.test.tsx` | `components/ui/Segmented.tsx` | aria-checked / onChange |
| `apps/web/src/components/ui/__tests__/Switch.test.tsx` | `components/ui/Switch.tsx` | disabled / toggle |
| `apps/web/src/components/ui/__tests__/Search.test.tsx` | `components/ui/Search.tsx` | clear button / placeholder |
| `apps/web/src/components/ui/__tests__/icons.test.ts` | `components/ui/icons.ts` | type list import smoke |
| `apps/web/src/components/ui/__tests__/index.test.ts` | `components/ui/index.ts` | barrel import smoke |

### 既存拡張（2 件）

| 編集ファイル | 拡張内容 |
| --- | --- |
| `apps/web/src/lib/admin/__tests__/api.test.ts` | mutation 8 種の URL/method/body と error mapping / network error / 非 JSON body / status=0 ケース追加 |
| `apps/web/src/lib/url/login-state.test.ts` | error / gate / SSR no-op / historyImpl 注入優先の 4 ケース追加 |

### 既存縮小（1 件・任意）

| 編集ファイル | 縮小内容 |
| --- | --- |
| `apps/web/src/components/ui/__tests__/primitives.test.tsx` | Toast/Modal/Drawer/Field/Segmented/Switch/Search の describe を個別ファイルへ移植後に削除可。Chip/Avatar/Button/Input/Textarea/Select/KVList/LinkPills の describe は保持（本タスクの scope 外） |

### production code 変更

- なし（CONST_005 上の「変更対象ファイル」は production code 0 件、テストファイル 13 件の追加 / 編集として明示する）

## 不変条件チェック

| 不変条件 | 適合確認 |
| --- | --- |
| #5 public/member/admin boundary | admin lib テストは admin 文脈の cookie / `x-internal-auth` / mutation only。member 文脈混在なし。 |
| #6 apps/web → D1 直接アクセス禁止 | `server-fetch.ts` テストで `fetch` mock のみ。D1 binding / Hono backend を import しない。 |
| #11 profile 本文編集 mutation 不在 | 既存 api.test.ts 1 ケースを保持。新規ケースで `profileBody` を扱わない。 |
| #13 tag 直接更新 mutation 不在 | 既存 api.test.ts 1 ケースを保持。`resolveTagQueue` のみを mutation テストに含める。 |

## aiworkflow-requirements 整合

- テスト配置: `apps/web/src/**/__tests__/*.test.{ts,tsx}` または `apps/web/src/**/*.test.{ts,tsx}`。Phase 2 設計はこの規約を遵守。
- jsdom 環境: `vitest.config.ts` で `environment: "jsdom"` 既定なので React コンポーネントテストはそのまま動作。
- coverage provider=v8: import smoke 行が実行されれば計上される。
- testTimeout / hookTimeout 30000ms: fake timer + advanceTimersByTime はこの時間枠内で完結。

## リスク・代替案

| リスク | 影響 | 緩和策 / 代替案 |
| --- | --- | --- |
| `crypto.randomUUID` が jsdom で undefined | Toast テスト失敗 | `vi.spyOn(globalThis.crypto, "randomUUID")` あるいは `vi.stubGlobal("crypto", { randomUUID: () => "uuid-1" })` |
| focus trap テストで `previousFocus` 復元検証が flaky | Modal/Drawer ケース失敗 | 復元先 button を render 前に `document.body` に append し、unmount 後に `document.activeElement` を assert |
| `next/headers` の `cookies()` が server-only ガード付き | server-fetch.test 失敗 | `vi.mock("next/headers", () => ({ cookies: vi.fn() }))` で完全 stub |
| barrel `ui/index.ts` の re-export が tree-shake 結果と異なる | coverage 計上 0% のまま | import smoke では `import * as UI` で全 re-export を実体参照する |
| 既存 `primitives.test.tsx` 縮小で他テストが import 経路に依存 | regression | `pnpm vitest run` で全件 PASS を Phase 9 で確認、不要なら縮小スキップ可（個別ファイル追加だけでも coverage 達成可能） |
| `types.ts` / `icons.ts` が型 only で v8 coverage に乗らない | AC 未達 | 値 expression を 1 行入れる（`const _filters: AdminAuditFilters = {} satisfies AdminAuditFilters; void _filters;`）|
| `INTERNAL_AUTH_SECRET` を test fixture に書く事故 | 実値混入 | `vi.stubEnv("INTERNAL_AUTH_SECRET", "test-secret")` でダミー固定。実値は使わない |

## レビュー結果サマリ

- Phase 2 設計は不変条件 #5 / #6 / #11 / #13 と aiworkflow-requirements に整合する。
- 11 新規 + 2 既存拡張 = 13 ファイル変更で AC（Stmts/Lines/Funcs ≥85%, Branches ≥80%）達成可能。
- production code 改変なし、coverage exclude 改変なしで成立する。
- リスクは jsdom crypto / focus trap / barrel coverage の 3 点に集約され、いずれも Phase 2 mock 戦略で緩和可能。

## 実行手順

- 本フェーズはレビュー記述のみ（ファイル新規作成なし）。
- Phase 4 で「テスト戦略 (test pyramid 上の位置 / data builder / fixture 共有)」、Phase 5 で「実装ランブック (新規 11 ファイル作成順 / 既存 2 ファイル diff)」、Phase 6 で「異常系検証 (network error / non-JSON body / SSR no-op)」を確定する。

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- 不変条件 #5 / #6 / #11 / #13 適合
- aiworkflow-requirements の test 配置・命名・vitest 設定整合
- 未実装 / 未実測を PASS と扱わない（Phase 11 実測 evidence 必須）
- coverage exclude による数値合わせをしない
- 既存 13 ケースの保護（移植先で同等以上）

## サブタスク管理

- [ ] 不変条件チェック表を確定する
- [ ] 想定変更ファイル俯瞰表を確定する
- [ ] リスク・代替案表を確定する
- [ ] outputs/phase-03/main.md を作成する

## 成果物

- `outputs/phase-03/main.md`: 設計レビュー結論サマリ

## 完了条件

- Phase 2 設計に対するレビュー結果が記録されている
- 想定変更ファイル 13 件の俯瞰表が Phase 5/6 入力として整っている
- リスク 7 件と緩和策が表で記録されている
- 不変条件 #5 / #6 / #11 / #13 適合が確認されている

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] 想定変更ファイル俯瞰が Phase 4-13 の入力として参照可能な粒度になっている
- [ ] 不変条件 / aiworkflow-requirements 整合がチェックされている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ次を渡す: 11 新規 + 2 既存拡張 = 13 ファイルの想定変更俯瞰表、mock 戦略表、リスク 7 件と緩和策、不変条件 #5/#6/#11/#13 適合根拠、coverage 達成見込み（barrel/型ファイルは import smoke、UI primitives は最低 3 ケース、admin lib は 7-8 ケース）。
