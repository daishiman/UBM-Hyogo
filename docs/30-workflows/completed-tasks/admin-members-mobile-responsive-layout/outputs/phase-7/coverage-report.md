# Phase 7 成果物: 変更行限定カバレッジレポート

- task_id: `admin-members-mobile-responsive-layout`
- phase: 7 / 13
- 前提仕様: [../../phase-7-coverage.md](../../phase-7-coverage.md)
- SSOT: [../shared-context.md](../shared-context.md)
- status（spec段階）: pending（実装サイクルで実行・確定）

## 1. カバレッジ対象範囲（BEFORE-QUIT-002 / Feedback 5）

- 対象: **変更ファイル `apps/web/src/features/admin/components/_members/MembersTable.tsx`（F1）の追加属性部分に限定**。
- 非対象: 全ファイル一律のカバレッジ指定（リポジトリ全体閾値）はしない。属性追加 + CSS の限定スコープに見合った変更ファイル限定計測に留める。
- 計測コマンド:
  ```bash
  mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
    src/features/admin/components/__tests__/MembersTable.spec.tsx \
    --coverage \
    --coverage.include='src/features/admin/components/_members/MembersTable.tsx'
  ```

## 2. F1 追加行の line / branch カバレッジ目標と計測方針

| 指標 | 目標 | 根拠 |
| ---- | ---- | ---- |
| line（F1 追加属性行） | 追加属性箇所に uncovered（赤行）ゼロ | TC-MT-21〜24 の render で全属性行が実行される |
| branch（F1） | 既存と同等を維持（新規 branch 追加なし） | I-3: ロジック・条件分岐は不変。属性追加のみで if / 三項を増やさない |
| statement（F1 追加属性） | 追加属性 statement がすべて covered | render パスを TC-MT-21〜24 が通過 |

計測方針: F1 のカバレッジレポートを取得し、追加属性を含む JSX 行が uncovered として残っていないことを確認する。uncovered が残る場合は対応 TC 不足として Phase 6 へ差し戻し TC を補う。

## 3. 追加 TC が F1 新規属性を網羅する対応表

| F1 追加属性 | 網羅 TC | カバレッジ期待 |
| ----------- | ------- | -------------- |
| ラッパー `data-component="admin-members-table"` | TC-MT-21 | covered |
| `<thead>` `data-role="table-head"` | TC-MT-23 | covered |
| `<td data-label="メール">` ほか 5 項目 | TC-MT-22 | 各 data-label covered |
| `data-cell="select/member/actions"` | TC-MT-21〜24 の行 render | covered |
| 機械可読id（行 testid / aria-label） | TC-MT-24 | covered |

## 4. F2 カード化 CSS のカバレッジ対象外宣言と役割分担

| 検証層 | 対象 | カバレッジ計測 | カバー内容 |
| ------ | ---- | -------------- | ---------- |
| vitest（jsdom / unit） | F1 属性 | **対象**（line / branch / statement） | 属性存在・機械可読id 不変・DOM 不変 |
| Playwright（実ブラウザ） | F2 CSS（`@media` カード化） | **対象外**（jsdom 非適用） | 375/414/640px カード表示・横はみ出しゼロ・公開トグル可視・1280px テーブル維持 |

- F2 が unit カバレッジで 0% に見えるのは**設計通り**であり欠陥ではない（jsdom は `@media` を適用しない）。F2 の動作担保は Phase 11 の Playwright 視覚検証 / 手動 screenshot が役割を負う。

## 5. 全体閾値の誤判定回避

- リポジトリ全体のカバレッジ閾値を新規に課さない / 引き上げない。
- coverage-guard（pre-push）は feature commit では通常通り効くが、変更ファイル限定で uncovered を出さないことを目標とし、全体閾値での誤検知を持ち込まない。

## 6. 計測結果（実装サイクルで追記）

| 指標 | 目標 | 実測 | 判定 |
| ---- | ---- | ---- | ---- |
| F1 追加属性 line uncovered | 0 | pending | — |
| F1 branch | 既存同等 | pending | — |
| F2 CSS | 計測対象外（Playwright 担保） | n/a | n/a |
