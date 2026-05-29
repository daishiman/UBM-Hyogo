# Phase 3 — 設計レビュー

## 1. レビュー判定

| 観点 | 判定 | 根拠 |
|------|------|------|
| 責務境界 | PASS | 純関数（resolve）/ async helper（get）/ 描画（PublicHeader）/ 配線（layout）の 4 層分離 |
| 状態所有権 | PASS | `authView` は layout 所有 → props で配信。PublicHeader 内 state 無し |
| 依存方向 | PASS | layout → getAuthView → resolveAuthView。Auth.js は getAuthView でのみ参照 |
| invariant 整合 | PASS | invariant #11 fail-closed（catch → guest）/ HEX 直書きなし |
| 命名一貫性 | PASS | `safeServerFetch.ts` / `getEnv()` 等の既存 camelCase + kebab-case ファイル名と整合 |
| 既存再利用 | PASS | `SignOutButton` 既存利用、新規 primitive 0 件 |
| 4 条件 | PASS | 価値（後続 B/C/E/G 共通基盤）/ 実現（小スコープ 8 file）/ 整合（discriminated union で網羅）/ 運用（unit test だけで担保） |

## 2. 因果・境界

- 強化ループ: `AuthView` 型確立 → 後続タスクが同じ型で member/admin CTA を描画 → 公開層全体の動線一貫性。
- バランスループ: `getAuthView()` の例外吸収 → 認証境界破壊時も guest fallback で UI を保つ。
- 状態所有: session 取得は server-only（getAuthView）。Renderer / Client component には漏らさない。

## 3. リスク

| Risk | 影響 | 緩和 |
|------|------|------|
| Auth.js の `getAuth().auth()` 戻り値型変更 | guest 誤判定 | `SessionLike` を最小契約として定義、Auth.js 型に依存しない |
| async server component 化で test 形態が変わる | 既存 test 回帰 | Phase 4 で `await PublicHeader(props)` パターンを明記 |
| memberId が 0 や "0" 等の truthy 文字列 | guest 判定漏れ | `typeof === "string" && length > 0` で判定 |

## 4. Phase 4 進行可否

**判定: PASS（進行可）**

- MINOR: なし
- BLOCKER: なし
