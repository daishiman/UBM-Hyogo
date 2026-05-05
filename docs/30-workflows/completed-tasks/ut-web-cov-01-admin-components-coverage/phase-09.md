# Phase 9: 品質保証 — ut-web-cov-01-admin-components-coverage

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 9 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 更新日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 5〜8 で実装した admin component test に対して、typecheck・lint・カバレッジ閾値の 3 段検証を行い、PASS を確定させる。失敗時の最小修復方針を定義する。

## 変更対象ファイルと変更種別

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `apps/web/coverage/coverage-summary.json` | 自動生成 | Vitest coverage 出力（commit しない） |
| `apps/web/vitest.config.ts` | 必要時改修 | 7 対象ファイルの threshold を `coverage.thresholds.perFile` または明示的 include で担保 |

> production code および test code への追加変更は行わない。失敗時のみ Phase 5〜8 の差し戻しで対応。

## 関数・型・モジュール構造

新規モジュールなし。`vitest.config.ts` の `coverage` セクションのみ調整候補:

```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'json-summary'],
  include: ['src/components/admin/**'],
  thresholds: {
    lines: 85, statements: 85, functions: 85, branches: 80,
  },
}
```

## 入出力・副作用

- 入力: `apps/web/src/components/admin/**/*.tsx`、`apps/web/src/components/admin/__tests__/**`、`apps/web/src/components/layout/__tests__/AdminSidebar.test.tsx`
- 出力: `apps/web/coverage/coverage-summary.json`、`coverage/index.html`
- 副作用: なし（読み取り＋ローカル成果物生成のみ）

## テスト方針 / 検証コマンド

| # | 目的 | コマンド | PASS 条件 |
| --- | --- | --- | --- |
| 1 | 型 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| 2 | Lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0、warning 0 |
| 3 | Unit + coverage | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` | 全 spec PASS、対象 7 ファイル各々 Stmts/Lines/Funcs ≥85% かつ Branches ≥80% |
| 4 | regression 確認 | `mise exec -- pnpm --filter @ubm-hyogo/web test` | 既存 web spec が全 PASS |

### 対象 7 ファイル baseline → 目標

| ファイル | baseline (lines/branches) | 目標 |
| --- | --- | --- |
| `MembersClient.tsx` | 0 / 0 | 100 / 100 |
| `TagQueuePanel.tsx` | 0 / 0 | 100 / 96.15 |
| `AdminSidebar.tsx` | 0 / 0 | 100 / 100 |
| `SchemaDiffPanel.tsx` | 58.62 / 38.46 | 100 / 95.65 |
| `MemberDrawer.tsx` | 63.68 / 50 | 96.64 / 84.61 |
| `MeetingPanel.tsx` | 66.44 / 33.33 | 98.02 / 84.44 |
| `AuditLogPanel.tsx` | 98.5 / 74.19 | 100 / 98.73 |

## 失敗時の最小修復方針

| 失敗種別 | 一次対応 |
| --- | --- |
| typecheck | unused import / 型注釈漏れを最小差分で修正 |
| lint | `pnpm --filter @ubm-hyogo/web lint --fix` → 残違反を手動修正 |
| coverage 不足 | 不足分岐を Phase 5〜7 のテスト追補で補完（Phase 8 共通ヘルパ拡張で対応可能なら優先） |
| 既存 spec regression | DRY 化での mock 共有が原因か切り分け、ヘルパ側で吸収 |

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
mise exec -- pnpm --filter @ubm-hyogo/web test
```

## 完了条件 (DoD)

- [ ] typecheck PASS
- [ ] lint PASS（warning 0）
- [ ] test:coverage PASS かつ対象 7 ファイル全てが threshold 達成
- [ ] 既存 web spec の regression なし
- [ ] `outputs/phase-09/main.md` に 4 コマンドの結果サマリと coverage 表を記録

## 参照資料

- `apps/web/vitest.config.ts`
- `apps/web/package.json`（`test`, `test:coverage`, `lint`, `typecheck` スクリプト）
- Phase 8 outputs/phase-08/main.md

## サブタスク管理

- [ ] typecheck 実行
- [ ] lint 実行
- [ ] test:coverage 実行＋対象 7 ファイル抽出
- [ ] 既存 spec regression 確認
- [ ] outputs/phase-09/main.md に結果記録

## 成果物

- `outputs/phase-09/main.md`（4 コマンド結果と coverage 表）

## タスク100%実行確認

- [ ] 必須セクション充足
- [ ] threshold 失敗を「PASS」と扱っていない
- [ ] commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ AC ↔ コード ↔ テスト ↔ evidence の最終突合とチェックリストを引き継ぐ。

## Template Compliance Addendum

## 実行タスク

- 既存本文の目的、変更対象、テスト方針、ローカル実行コマンド、完了条件に従って本 Phase の作業を実行する。
- Phase completion は `artifacts.json` と `outputs/artifacts.json` の status、および該当 `outputs/phase-XX/main.md` で記録する。

## 統合テスト連携

- 本タスクは apps/web component unit coverage hardening であり、外部 integration test は追加しない。
- 回帰確認は `pnpm --filter @ubm-hyogo/web test:coverage` の同一実行で担保する。
