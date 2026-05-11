# Phase 3: 詳細設計 — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 3 / 13 |
| wave | w5-par |
| mode | parallel |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

各コンポーネントの Props 型シグネチャ・URL query schema・Banner tone マッピング・テスト ID 契約を確定し、コード実装可能な粒度の設計図を残す。

## 実行タスク

1. `LoginGateState` 型に `"error"` を追加する 1 行差分を確定する（`apps/web/src/lib/url/login-query.ts`）。完了条件: 6 値の discriminated union が確定。
2. `LoginCardProps` / `LoginStatusProps` / `LoginPanelProps` / `MagicLinkFormProps` / `GoogleOAuthButtonProps` を確定する。完了条件: TypeScript シグネチャが出典 §4 と一致。
3. `LoginQuery` schema（zod）の入出力契約を確定する。完了条件: `state` / `redirect` / `email` / `error` / `gate` の parse 規則と open redirect fallback が明記。
4. Banner tone → CSS variable mapping を確定する（info/success/warning/danger と role）。完了条件: §4.8 と整合。
5. data-* 属性契約を確定する（`data-testid="login-card"`, `data-component="login-card"`, `data-state="<state>"`）。完了条件: task-18 Playwright が assert 可能。

## 参照資料

- 出典タスク §4（Props 型）, §5.1（URL query 一覧）, §5.2（責務境界）, §11（リスク）
- apps/web/src/lib/url/login-query.ts（既存 LoginQuery schema）
- apps/web/src/components/ui/banner.tsx（task-10 由来）

## 依存 Phase 成果物参照

- Phase 1: `outputs/phase-01/main.md`
- Phase 2: `outputs/phase-02/main.md`

## 実行手順

- すべての Props を `readonly` で固定し、出典 §4 のシグネチャを採用する。`LoginCardProps` は `readonly state: LoginGateState` を必須 prop とし、`data-state` の責務を `LoginCard` に固定する。
- `parseLoginQuery` の zod schema は未知 state を `"input"` にフォールバック、`redirect` は同一オリジン path 以外を `"/profile"` に丸める。
- `error` クエリは `String(error).slice(0, 200)` で長さ制限し、DOMText 経由のみで render（XSS 対策）。
- 本 Phase ではコード実装を行わない（型定義の差分提案まで）。

## 統合テスト連携

- 上流: Phase 2 のコンポーネントツリー / 責務境界
- 下流: Phase 5 実装、Phase 6 単体テスト、task-18 Playwright

## 多角的チェック観点

- exhaustive switch が `never` で型検査通過
- `state=error` の error メッセージ XSS 防止（slice + DOMText）
- redirect の open redirect 防止（同一オリジン only）
- Banner role（status/alert）の一意性（danger だけ alert）
- `data-testid="login-card"` と data-state 属性が task-18 と契約一致

## サブタスク管理

- [ ] `LoginGateState` 6 値の差分を outputs/phase-03/main.md に明記
- [ ] 各コンポーネントの Props 型を inline で記述（出典 §4.1〜4.8 を集約）
- [ ] `parseLoginQuery` の zod schema 仕様を記述
- [ ] Banner tone × CSS var × role の対応表を記述
- [ ] data-* 属性契約を記述（task-18 が assert する getByTestId / toHaveAttribute）

## 成果物

- outputs/phase-03/main.md（詳細設計書・型シグネチャ集）

## 完了条件

- [ ] `LoginGateState` に `"error"` が追加される 1 行差分が確定
- [ ] 5 つの Props 型シグネチャが確定
- [ ] zod schema の parse 規則と fallback が確定
- [ ] Banner tone マッピング表が確定
- [ ] `data-testid` / data-component / data-state 属性契約が確定

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] Phase 2 の責務境界と整合

## 次 Phase への引き渡し

Phase 4 へ、型シグネチャ・schema・属性契約を渡し、SRP 単位の実装タスク分解に繋ぐ。
