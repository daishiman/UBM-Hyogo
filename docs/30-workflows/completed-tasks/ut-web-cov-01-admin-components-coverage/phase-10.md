# Phase 10: 最終レビュー — ut-web-cov-01-admin-components-coverage

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 10 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 更新日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

7 component すべてについて AC ↔ コード ↔ テスト ↔ evidence の最終突合を行い、Phase 11 実測 evidence 取得前のレビューゲートを通過させる。

## 変更対象ファイルと変更種別

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-10/main.md` | 新規 | 最終レビュー結果（チェックリスト・AC matrix） |

> production code / test の変更は原則行わない。レビューで欠落が見つかった場合のみ Phase 5〜8 へ差し戻し。

## 関数・型・モジュール構造

レビュー成果物のみ。新規モジュールなし。

## 入出力・副作用

- 入力: Phase 5〜9 の outputs と該当 component 実装/テスト
- 出力: `outputs/phase-10/main.md`
- 副作用: なし

## 7 component 別チェックリスト

各 component について以下 6 項目を満たすこと:

| # | チェック項目 |
| --- | --- |
| 1 | AC（happy / authz-fail / empty / mutation の最低 4 ケース）に対応する `it()` が存在 |
| 2 | テストが snapshot ではなく明示 assertion (`expect(...).toBe/toHaveTextContent/...`) を使用 |
| 3 | Phase 8 共通ヘルパ（router/fetch/api-mock/fixtures）を経由 |
| 4 | Phase 9 coverage 実測で Stmts/Lines/Funcs ≥85 かつ Branches ≥80 |
| 5 | `apps/web/src/components/admin/<Component>.tsx` の admin/auth boundary を侵犯していない |
| 6 | D1 / `apps/api` への直接アクセスを test から行っていない |

### AC matrix（最終）

| Component | happy | authz-fail | empty | mutation | coverage 達成 |
| --- | --- | --- | --- | --- | --- |
| MembersClient | ☐ | ☐ | ☐ | ☐ | ☐ |
| TagQueuePanel | ☐ | ☐ | ☐ | ☐ | ☐ |
| AdminSidebar | ☐ | ☐ | ☐ | ☐ | ☐ |
| SchemaDiffPanel | ☐ | ☐ | ☐ | ☐ | ☐ |
| MemberDrawer | ☐ | ☐ | ☐ | ☐ | ☐ |
| MeetingPanel | ☐ | ☐ | ☐ | ☐ | ☐ |
| AuditLogPanel | ☐ | ☐ | ☐ | ☐ | ☐ |

## テスト方針

実行は Phase 9 で完了済み。本 Phase は再実行不要。outputs/phase-09/main.md の coverage 表を参照して合否判定する。

## ローカル実行コマンド

```bash
# レビュー補助のみ（任意）
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/admin/__tests__ --reporter=verbose
```

## 完了条件 (DoD)

- [ ] 7 component × 6 チェック項目すべて済
- [ ] AC matrix 全セルが ✓
- [ ] 残 blocker なし、または blocker と対応 issue を outputs に記録
- [ ] outputs/phase-10/main.md 作成

## 参照資料

- outputs/phase-05/main.md, outputs/phase-06/main.md, outputs/phase-07/main.md
- outputs/phase-08/main.md, outputs/phase-09/main.md
- `docs/00-getting-started-manual/specs/02-auth.md`

## サブタスク管理

- [ ] 7 component 個別チェック実施
- [ ] AC matrix 埋め込み
- [ ] blocker 一覧記録
- [ ] outputs/phase-10/main.md 完成

## 成果物

- `outputs/phase-10/main.md`

## タスク100%実行確認

- [ ] 必須セクション充足
- [ ] レビューのみ。実装・deploy・PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ Vitest 実測ログと coverage-summary 抽出（NON_VISUAL evidence）を引き継ぐ。

## Template Compliance Addendum

## 実行タスク

- 既存本文の目的、変更対象、テスト方針、ローカル実行コマンド、完了条件に従って本 Phase の作業を実行する。
- Phase completion は `artifacts.json` と `outputs/artifacts.json` の status、および該当 `outputs/phase-XX/main.md` で記録する。

## 統合テスト連携

- 本タスクは apps/web component unit coverage hardening であり、外部 integration test は追加しない。
- 回帰確認は `pnpm --filter @ubm-hyogo/web test:coverage` の同一実行で担保する。
