# Phase 4: 実装タスク分解（SRP） — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 4 / 13 |
| wave | w5-par |
| mode | parallel |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 3 の詳細設計を SRP（単一責務原則）単位の実装サブタスクに分解し、編集対象ファイル・差分方針・順序を確定する。

## 実行タスク

1. 出典 §3 の変更対象ファイル表を SRP 単位の編集サブタスクに分解する。完了条件: 各サブタスクが「1 ファイル × 1 責務」に収まる。
2. 編集順序を確定する（型定義 → 新規 component → rebuild → 既存 component minor → page.tsx wrapper）。完了条件: 出典 §10「実装順序」と整合。
3. 各サブタスクの DoD（型 OK / lint OK / 視認 OK）を確定する。完了条件: Phase 5 実装ガイドが checklist として走らせられる。

## 参照資料

- 出典タスク §3（変更対象ファイル表）, §10（実装順序）
- Phase 3: `outputs/phase-03/main.md`

## 依存 Phase 成果物参照

- Phase 1: `outputs/phase-01/main.md`
- Phase 2: `outputs/phase-02/main.md`
- Phase 3: `outputs/phase-03/main.md`

## 実装サブタスク（順序付き）

| # | 対象 path | 区分 | 責務 | 主要差分 |
|---|----------|------|------|---------|
| 1 | `apps/web/src/lib/url/login-query.ts` | M | 型拡張 | `LoginGateState` に `"error"` を 1 値追加、zod schema 拡張 |
| 2 | `apps/web/app/login/_components/LoginCard.tsx` | C | layout 部品 | カード wrapper（Server Component）、`data-component="login-card"` `data-state` 付与 |
| 3 | `apps/web/app/login/_components/LoginStatus.tsx` | C | 状態別本文 | sent / unregistered / deleted / error / rules_declined の 5 ブロック |
| 4 | `apps/web/app/login/_components/LoginPanel.client.tsx` | M（rebuild） | dispatcher | 6 case の exhaustive switch、ui-primitive `<Banner>` 採用 |
| 5 | `apps/web/app/login/_components/MagicLinkForm.client.tsx` | M（minor） | form | tokens 適用 + `aria-busy` 追加 |
| 6 | `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` | M（minor） | OAuth button | tokens 適用 + brand SVG inline |
| 7 | `apps/web/app/login/page.tsx` | M | Server entry | `<LoginCard>` wrapper を `<main>` 直下に配置 |

## 並列・直列関係

- サブタスク 1（型拡張）は他全サブタスクの前提（直列・最初）
- サブタスク 2 / 3 は並列可
- サブタスク 4 はサブタスク 2 / 3 完了後（直列）
- サブタスク 5 / 6 はサブタスク 4 と並列可
- サブタスク 7 は最後（直列）

## 多角的チェック観点

- 各サブタスクが SRP（1 ファイル × 1 責務）
- 全サブタスクで HEX 直書きを混入させない
- `apps/web/app/api/auth/*` の git diff 0 を維持

## 統合テスト連携

- Phase 4 の DAG は Phase 6〜10 の gate 順序へそのまま接続する。
- `LoginCardProps.state` と `data-testid="login-card"` は Phase 6 unit、Phase 9 Playwright、task-18 regression smoke の共通契約として扱う。
- `rules_declined` は derived state として実装対象に含めるが、core smoke の必須 5 状態とは表で分離する。

## サブタスク管理

- [ ] サブタスク 1〜7 を outputs/phase-04/main.md に列挙
- [ ] 並列・直列 DAG を記述
- [ ] 各サブタスクの DoD（typecheck / lint / 視認）を記述
- [ ] サブタスクごとの予想差分行数を記述（≤ 200 行/サブタスク）

## 成果物

- outputs/phase-04/main.md（SRP 分解 + DAG）

## 完了条件

- [ ] サブタスク 7 件すべてが SRP 規律を満たす
- [ ] DAG が出典 §10 と整合
- [ ] 各サブタスクの DoD が定義される
- [ ] api/auth/* 不変条件が全サブタスクで明記

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5（実装）へ、SRP 分解された 7 サブタスクと DAG を渡す。
