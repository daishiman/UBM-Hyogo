# Phase 11: 手動テスト（NON_VISUAL 宣言）

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | テスト追加（integration-level 契約テスト 1 ファイル） |
| visual_evidence | **NON_VISUAL** |
| 非視覚的理由 | 本タスクの成果物は `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts` の追加のみ。UI レイアウト・スタイル・DOM 構造に変更を加えず、レンダリング結果が変わらないため視覚証跡（スクリーンショット）に意味がない。 |
| 代替証跡 | focused Vitest（新規 integration spec + 既存 getAuthView / resolveAuthView / auth.spec の同時実行）。証跡の主ソースは `manual-test-result.md` に記録する。 |
| workflow_state | `implemented_local_evidence_captured` |

## 実地操作不可の明記

本タスクは NON_VISUAL のテスト追加であり、以下の実地操作は本フェーズの対象外:

- staging / production 環境での実 Google OAuth ログイン smoke（user-gated・本タスクスコープ外）
- ブラウザでの公開ヘッダー表示確認（UI 変更がないため検証対象が存在しない）

新規 integration spec の focused Vitest は本サイクルで実行済み。証跡は `manual-test-result.md` に記録する。

## スクリーンショット不要の理由

1. UI/UX に一切の変更がない（テストコード追加のみ）。
2. 検証対象は「実 session callback 出力 → `resolveAuthView()` / `getAuthView()` の契約一致」という型・shape レベルの不変条件であり、画面表示には現れない。
3. 公開ヘッダーの guest / member / admin 表示自体は親 workflow `public-header-session-aware-auth-view-base` の Phase 11 で既にスクリーンショット取得済み。本タスクはその表示が壊れないことを契約テストで早期検知する裏側の補強であり、新規の視覚差分を生まない。

よって本タスクの Phase 11 evidence は **focused Vitest 結果（NON_VISUAL 代替証跡）** に一本化する。詳細は `manual-test-result.md` を参照。

## 検証ケース概要

本サイクルで取得した focused Vitest ケース内訳は `manual-test-result.md` の表に記載する。
中核は「実 `buildAuthConfig().callbacks.session({ token })` の出力 shape が `resolveAuthView()` の読む field（`memberId` / `isAdmin`）と一致する」契約の検証である。
