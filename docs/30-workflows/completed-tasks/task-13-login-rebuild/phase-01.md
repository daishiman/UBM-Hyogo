# Phase 1: 要件定義 — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 1 / 13 |
| wave | w5-par |
| mode | parallel |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`/login` 画面を Auth.js デフォルト UI から prototype 準拠のカード型ログインへリビルドする際の、対象範囲・5 状態・DoD・不変条件を確定する。

## 実行タスク

1. 出典 `task-13-w5-par-login-rebuild.md` を読み、5 状態（input / sent / unregistered / deleted / error）+ rules_declined 派生を要件として確定する。完了条件: 状態一覧と URL query 仕様が記録される。
2. 既存 API surface（`/api/auth/magic-link` / `[...nextauth]` / `gate-state`）が不変であることを確認する。完了条件: 既存 endpoint 一覧と参照範囲が記録される。
3. DoD（G-13-1〜8）と非ゴールを切り分ける。完了条件: AC が verifiable な検証手段（Playwright / Vitest / verify-design-tokens / 手動）に紐づく。

## 参照資料

- docs/30-workflows/ui-prototype-alignment-mvp-recovery/06-screens-member/task-13-w5-par-login-rebuild.md（出典・§1〜2, §6）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md（API マッピング）

## 依存 Phase 成果物参照

- Phase 1〜13: `outputs/phase-NN/main.md`
- Phase 12: `outputs/phase-12/implementation-guide.md`
- Phase 11: `outputs/phase-11/*.png`（視覚 evidence）

## 実行手順

- 対象 directory: `docs/30-workflows/task-13-login-rebuild/`
- 本 Phase ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 5 状態 + rules_declined のレイアウト責務は §0.9（出典）と一致させる。

## 統合テスト連携

- 上流: task-09（OKLch tokens 正本）, task-10（ui-primitives `<Banner>` `<Card>` `<Button>` `<Input>`）
- 下流: task-18（Playwright smoke + verify-design-tokens gate）

## 多角的チェック観点

- #5 D1 直接アクセス禁止（apps/web は apps/api への proxy のみ）
- #6 HEX 直書き禁止（OKLch tokens 経由）
- #7 open redirect 防止（同一オリジン path のみ許可）
- #8 URL query が gate state の正本
- /no-access 復活禁止
- session storage / localStorage に state を保存しない

## サブタスク管理

- [ ] 5 状態 + rules_declined の役割と Banner role を確定する
- [ ] 既存 API endpoint 3 本の参照範囲（read のみ）を明記する
- [ ] DoD G-13-1〜8 を AC として記録する
- [ ] 非ゴール（新 endpoint / Auth.js config 変更 / `/no-access` 復活）を切り出す
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md（要件定義書）

## 完了条件

- [ ] 5 状態の URL query 仕様が確定（`state` / `redirect` / `email` / `error` / `gate`）
- [ ] DoD 表が verification（手段・コマンド）に紐づく
- [ ] 既存 API surface が read のみで参照される範囲が確定
- [ ] 不変条件 8 項目が列挙される
- [ ] 非ゴールが明文化される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] 出典タスク仕様 §0〜§2 と齟齬がない

## 次 Phase への引き渡し

Phase 2 へ、5 状態定義・DoD・既存 API surface・不変条件を渡す。
