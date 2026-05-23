# Phase 2: アーキテクチャ設計 — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 2 / 13 |
| wave | w5-par |
| mode | parallel |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

5 状態を URL query 駆動の state machine として描画するためのコンポーネント階層・Server/Client 責務境界・データフロー設計を確定する。

## 実行タスク

1. コンポーネント階層を確定する。完了条件: `page.tsx → LoginCard → (LoginPanel.client | LoginStatus)` のツリーが確定し、Server/Client 区分が明記される。
2. URL query 駆動の state machine 設計を確定する。完了条件: 6 状態（input/sent/unregistered/deleted/error/rules_declined）の遷移が記述される。
3. データフロー（form submit → API → router.replace → SSR 再描画）を確定する。完了条件: Magic Link / gate-state / Google OAuth の 3 経路が図示される。
4. open redirect 防止・XSS 対策・session storage 不使用の責務を確定する。完了条件: セキュリティ要件が責務単位に紐づく。

## 参照資料

- 出典タスク §0.9（画面の概念・状態遷移）, §5（状態遷移図）, §6（データフロー）
- docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx（layout 正本）
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-2/phase-2.md
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md §4.13

## 依存 Phase 成果物参照

- Phase 1: `outputs/phase-01/main.md`（要件定義 / 5 状態 / DoD）

## 実行手順

- コンポーネント分割案: `LoginCard`（Server・layout）/ `LoginStatus`（Server hybrid・状態別本文）/ `LoginPanel.client`（Client・dispatcher）/ `MagicLinkForm.client`（既存）/ `GoogleOAuthButton.client`（既存）。
- Server / Client 責務マトリクスを §5.2（出典）に従い記述する。
- 本 Phase ではコード実装を行わず、設計図とインタフェース合意のみを得る。

## 統合テスト連携

- 上流: task-10 ui-primitives（`<Banner>` `<Card>` `<Button>` `<Input>` API）の確定
- 下流: Phase 3（詳細設計）, task-18（data-state 属性契約）

## 多角的チェック観点

- Server Component 優先（Client は MagicLinkForm / GoogleOAuthButton / LoginPanel に限定）
- exhaustive switch（`LoginGateState` 6 値で `never` 検査が通る）
- カード型 layout の prototype 整合（ロゴ / タイトル / 2 OAuth 導線）
- URL query 駆動以外の状態源を排除（localStorage / context / sessionStorage 不使用）

## サブタスク管理

- [ ] コンポーネントツリー図を作成する
- [ ] Server / Client 責務マトリクスを記述する
- [ ] 6 状態の遷移図（mermaid）を outputs/phase-02/main.md に展開する
- [ ] データフロー 3 経路（input→sent / input→unregistered|deleted|rules_declined / Google OAuth）を記述する
- [ ] data-state 属性契約（`<LoginCard data-state>`）を明記する

## 成果物

- outputs/phase-02/main.md（アーキテクチャ設計書 + mermaid 図）

## 完了条件

- [ ] コンポーネント階層と Server/Client 区分が確定
- [ ] 6 状態遷移図が出典 §5 と整合
- [ ] データフロー 3 経路が記述される
- [ ] data-state 属性が task-18 契約と整合
- [ ] open redirect / XSS / cookie scope の責務分担が確定

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] Phase 1 の DoD と整合

## 次 Phase への引き渡し

Phase 3 へ、コンポーネントツリー・状態遷移・データフロー・属性契約を渡す。
