# Phase 11 UI Sanity / Visual Review

## VISUAL 宣言

| 項目 | 値 |
|------|------|
| タスク種別 | **VISUAL**（Lane B が `MemberDrawer` の error 分岐 UI に再試行ボタンを追加） |
| 視覚的変更 | error 分岐に既存 `Button`(`variant="danger"` `size="sm"`)の「再試行」を追加。詳細ドロワー本体・タグ表示は不変 |
| 代替証跡 | implemented_local_evidence_captured のため PNG 0 件。実装後 staging で SC-01/02/03 を撮影（user-gated）。設計段階の視覚レビューは本ファイルで宣言 |

## Apple HIG / デザイン整合レビュー（設計段階）

| 観点 | 判定 | 根拠 |
|------|------|------|
| トークン正本 | PASS | 再試行ボタン・error 文言は既存 `--ubm-color-danger` 系 OKLch トークン。HEX 直書きなし |
| primitive 再利用 | PASS | 新規 primitive を生やさず既存 `Button`（`MemberDrawer.tsx:23` で import 済み）を再利用 |
| アクセシビリティ | PASS | error は `role="alert"` 保持。再試行ボタンは `<button>`/`Button` で focusable・`data-testid="member-detail-retry"` |
| 一貫性 | PASS | 既存 drawer 内の retry 導線（`tag-attach-retry`）と同じトーン・配置思想 |

## 実装後に確認すべき視覚項目（staging）

- SC-01: error + 再試行ボタンの配置・コントラスト
- SC-02: 再試行後の詳細ドロワー正常表示（seed source タグ表示）
- フォーカスリング・danger トーンが他の drawer error と一貫しているか
