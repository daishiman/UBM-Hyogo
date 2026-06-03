# Phase 11 UI Sanity / Visual Review — sidebar footer 固定 + account popover UX

> タスク: sidebar-footer-pinning-and-account-popover-ux / 種別=**VISUAL** / implemented_local_evidence_captured / 2026-06-02

## タスク種別宣言

本タスクは **VISUAL**（sidebar / footer の見た目・レイアウト・開閉挙動を変更）。NON_VISUAL ではない。実 screenshot は staging 認証 + 実装着手後に取得する **user-gated** 証跡であり、implemented_local_evidence_captured 段階では `screenshot-plan.json` / `phase11-capture-metadata.json` の plan を正本とする。

## Visual / HIG レビュー観点（実装済みとして判定）

| 観点 | 期待 | concern |
|------|------|---------|
| 固定フッターの視覚境界 | nav スクロール領域と footer 固定領域の間に `border-top`。スクロール時にフッターが動かない | C1 |
| 内部スクロールの自然さ | nav 領域のみがスクロールし、ページ全体はスクロールしない（デスクトップ）| C1 |
| collapsed の balance | アイコンが 4rem 幅で中央寄せ。テキスト/矢印は非表示。badge はドット | C2 |
| はみ出しゼロ | collapsed で水平スクロールバー・要素の食み出しが発生しない | C2 |
| popover dismiss の直感性 | 外側タップ / Escape で閉じる。一般的なメンタルモデルに一致 | C3 |
| popover の重なり | popover が footer / 隣接要素に正しく重なる（z-index 維持）| C3 |
| footer の余白 | 短コンテンツで最下部、長コンテンツで末尾 + 上 padding 維持 | C4 |

## アクセシビリティ観点

- focus-visible outline が nav スクロール領域内でクリップされない（aside overflow-hidden の影響確認）。
- Escape で popover を閉じた後、フォーカスが summary に戻る。
- badge ドット化後も件数を `sr-only` で読み上げ可能（TECH-M-01）。

## 判定

implemented_local_evidence_captured のため最終 visual 判定は保留。設計（Phase 2-3）上は全観点 PASS 見込み。実装済みの Phase 11 実走 + user 承認 screenshot で確定する。
