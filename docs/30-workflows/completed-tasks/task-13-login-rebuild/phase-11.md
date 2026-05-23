# Phase 11: 視覚 evidence — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 11 / 13 |
| wave | w5-par |
| mode | sequential |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

dev サーバで 5 状態 + rules_declined + gate=admin_required を巡回し、prototype `pages-member.jsx` と整合した screenshot を `outputs/phase-11/` に保存する。Phase 13 の PR 本文で参照する。

## 実行タスク

1. `mise exec -- pnpm --filter @ubm-hyogo/web dev` で dev サーバを起動。
2. 出典 §16 の URL を順に開き、各画面で screenshot を 1 枚ずつ撮る。
3. `outputs/phase-11/` に png で保存。ファイル名は `login-<state>.png`。
4. prototype `pages-member.jsx` の対応 block と並べたスクリーンショットを比較し、差分があれば Phase 5 にフィードバックする。

## 撮影 URL 一覧（出典 §16）

| ファイル名 | URL |
|-----------|-----|
| login-input.png | `http://localhost:3000/login` |
| login-sent.png | `http://localhost:3000/login?state=sent&email=user%40example.com` |
| login-unregistered.png | `http://localhost:3000/login?state=unregistered` |
| login-deleted.png | `http://localhost:3000/login?state=deleted` |
| login-error.png | `http://localhost:3000/login?state=error&error=Magic%20Link%20%E9%80%81%E4%BF%A1%E3%81%AB%E5%A4%B1%E6%95%97%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F` |
| login-rules-declined.png | `http://localhost:3000/login?state=rules_declined` |
| login-gate-admin.png | `http://localhost:3000/login?gate=admin_required` |

## 視覚チェック観点（出典 §16-3）

- カード型レイアウトが prototype と整合
- Banner 色味が tokens 由来（`oklch(...)` で computed style に出る）
- focus visible が Tab 移動で見える
- reload しても URL query 保持
- DevTools Inspector で computed background-color が `oklch(...)` 形式

## 参照資料

- 出典タスク §16（dev URL 巡回手順）
- docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx

## 依存 Phase 成果物参照

- Phase 2: `outputs/phase-02/main.md`
- Phase 5: 実装ログ
- Phase 6: 単体テスト
- Phase 7: 統合テスト
- Phase 8: a11y 結果
- Phase 9: E2E smoke
- Phase 10: token / lint gate

## 多角的チェック観点

- 全 7 URL で screenshot 取得
- ライト / ダーク両モード（プロトタイプ準拠の現状モードに合わせる）
- mobile viewport（任意）

## 統合テスト連携

- Phase 11 は Phase 10 gate が green の場合のみ実行する。
- screenshot 7 件は Phase 12 `implementation-guide.md` と Phase 13 PR body の参照元になる。
- runtime screenshot 未取得の状態では `completed` を使わず、`runtime_pending` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として記録する。

## サブタスク管理

- [ ] 7 枚の png を `outputs/phase-11/` に保存
- [ ] prototype と並べた差分メモを `outputs/phase-11/diff-notes.md` に記録
- [ ] computed style に `oklch(...)` を確認

## 成果物

- `outputs/phase-11/login-{input,sent,unregistered,deleted,error,rules-declined,gate-admin}.png`
- `outputs/phase-11/diff-notes.md`
- outputs/phase-11/main.md（手順記録）

## 完了条件

- [ ] 7 枚の screenshot 保存完了
- [ ] prototype 整合 OK（差分なし、または diff-notes に記録）
- [ ] computed style が tokens 由来

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] commit / push / PR は実行していない

## 次 Phase への引き渡し

Phase 12（実装ガイド）へ、screenshot 一式を渡し、PR 本文素材として準備する。
