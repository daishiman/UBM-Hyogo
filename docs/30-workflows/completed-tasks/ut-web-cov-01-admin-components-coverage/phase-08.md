# Phase 8: DRY 化 — ut-web-cov-01-admin-components-coverage

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 8 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 更新日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 5〜7 で 7 component test に展開された重複モック（`next/navigation` の `useRouter`、`vi.stubGlobal('fetch', ...)`、`vi.mock('../../../lib/admin/api', ...)`、audit/member/tag fixture builder）を点検し、今回の coverage hardening で共通化すべき重複と、個別テストに残す方が読みやすいモックを切り分ける。実装結果としては、共通 helper 新設よりも各テスト内の fixture builder / mock reset を局所化する方が差分が小さく、対象7ファイルの coverage gate も満たせるため、`apps/web/test-utils/admin/` は作成しない。

## 変更対象ファイルと変更種別

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx` | 改修 | helper関数の直接分岐テストと render 分岐テストを追加 |
| `apps/web/src/components/admin/__tests__/MeetingPanel.test.tsx` | 改修 | API mock / fixture をファイル内に局所化し、empty / mutation / authz-fail を追加 |
| `apps/web/src/components/admin/__tests__/MemberDrawer.test.tsx` | 改修 | fetch stub と admin API mock を局所化し、mutation / empty / error を追加 |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx` | 改修 | router/API mock を局所化し、alias mutation / authz-fail / empty を追加 |
| `apps/web/src/components/admin/__tests__/TagQueuePanel.test.tsx` | 改修 | parse / filter / confirm / reject / disabled 分岐を追加し、Branch gate を満たす |

## 関数・型・モジュール構造

新規モジュールなし。各 test file が対象 component の振る舞いに近い fixture / mock を持つ。共通 helper は抽象化の境界が admin component ごとに異なり、今回の局所 coverage hardening では過剰な横断 API になるため作成しない。

## 入出力・副作用

- ヘルパは Vitest コンテキスト (`vi`) 前提。副作用は `vi.stubGlobal` / `vi.mock` のみ。
- `installFetchMock` は `afterEach` で必ず `vi.unstubAllGlobals()` を呼ぶ責務をテスト側に委ねる（barrel から `restoreFetchMock` を export し setup で利用）。
- fixture builder は純関数。

## テスト方針

- 共通 helper 新設は行わず、各 component test の fixture / mock を最小局所化する。
- Phase 9 / Phase 11 の coverage threshold を満たすことで DRY 判断の妥当性を検証する。
- 重複削減よりも、対象 component ごとの明示 assertion と読みやすさを優先する。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/admin/__tests__
```

## 完了条件 (DoD)

- [x] 共通 helper 新設の要否を再判定し、今回は作成しない方針を明記
- [x] 追加 test は production code / shared type を変更せず、各 component test 内に局所化
- [x] `pnpm --filter @ubm-hyogo/web test -- apps/web/src/components/admin/__tests__/TagQueuePanel.test.tsx` が PASS（21 files / 196 tests）
- [x] `pnpm --filter @ubm-hyogo/web test:coverage` が PASS
- [x] 対象7ファイルすべて Stmts/Lines/Funcs ≥85% / Branches ≥80%

## 参照資料

- Phase 5/6/7 の実装ノート（outputs/phase-05..07/main.md）
- `apps/web/src/lib/admin/api.ts`
- `apps/web/vitest.config.ts`（`test-utils/` を resolve に含める設定が必要なら追加）

## サブタスク管理

- [x] 既存 7 テストから重複パターンを inventory 化
- [x] `test-utils/admin/` は抽象化過多として作成しない判断を記録
- [x] 追加テストを各 test file 内の局所 fixture / mock reset へ整理
- [x] coverage PASS 確認
- [x] outputs/phase-08/main.md に判断と evidence path を記録

## 成果物

- 改修済み admin component test
- `outputs/phase-08/main.md`

## タスク100%実行確認

- [x] 必須セクション充足
- [x] test code の局所整理のみ。production code への変更なし
- [x] commit / push / PR は次 Phase 以降

## 次 Phase への引き渡し

Phase 9 へ DRY 化済みテストの coverage 実測と threshold 検証を引き継ぐ。

## Template Compliance Addendum

## 実行タスク

- 既存本文の目的、変更対象、テスト方針、ローカル実行コマンド、完了条件に従って本 Phase の作業を実行する。
- Phase completion は `artifacts.json` と `outputs/artifacts.json` の status、および該当 `outputs/phase-XX/main.md` で記録する。

## 成果物/実行手順

- 成果物: `outputs/phase-08/main.md`
- 実行手順: 本 Phase の変更対象と検証コマンドを確認し、結果を outputs に記録する。

## 統合テスト連携

- 本タスクは apps/web component unit coverage hardening であり、外部 integration test は追加しない。
- 回帰確認は `pnpm --filter @ubm-hyogo/web test:coverage` の同一実行で担保する。
