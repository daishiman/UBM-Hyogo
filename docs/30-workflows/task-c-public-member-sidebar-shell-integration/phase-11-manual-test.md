# Phase 11: 手動テスト

## VISUAL 宣言

本タスクは **VISUAL（UI task）** である。公開層（公開 6 route）と会員層（`/profile`）の shell が
旧 `PublicHeader` / `MemberHeader`（横並びヘッダー）から共通 `SidebarShell`（左サイドバー）へ
切り替わるため、見た目の差分が発生する。よって Phase 11 は screenshot 取得対象とする。

> 本サイクルで依存 Task A/B/E の shell primitive と Task C の layout 統合はローカル実装済み。
> focused vitest / typecheck / lint による source-level evidence は取得済みである。
> 実 pixel screenshot capture と staging visual baseline は、認証済みセッション・API Worker・D1 を含む
> production-equivalent running stack 依存のため user-gated（Gate-C）として残す。

## 3 層評価の観点（Semantic / Visual / AI UX）

| 層 | 観点 | 合否基準 |
| --- | --- | --- |
| Semantic | 7 route が同一 shell DOM 契約（`data-shell-mode="sidebar"` / `data-testid="public-shell"` または `"member-shell"`）を共有する | DOM 属性が 7 route で一致（AC-C1） |
| Semantic | `PublicFooter` が shell children 末尾で描画され続ける | footer landmark が DOM に存在（AC-C4） |
| Visual | 公開 → /profile → /admin 遷移で header → sidebar の切替が一貫し、sidebar が継続表示される | sidebar が遷移前後で同一位置に保持（公開・会員側のみ。admin 側は Task D） |
| Visual | `/` `/privacy` `/terms` `/login` の route group 集約後も既存レイアウトが崩れない（profile の MemberHeader 2 箇所剥がし後の段組含む） | screenshot で段組崩れなし |
| AI UX | 遷移時に shell が一度も組み替わらない（visual flash なし） | route group 構造により mount 点が単一であることを目視確認 |

## capture 対象マトリクス（route × 状態）

公開・会員 shell の見え方を、ロール × route × shell 状態の組合せで網羅する。
TC 番号は metadata（後述 `phase11-capture-metadata.json` 想定）にのみ保持し、
ファイル名には含めない（Feedback FB-LLM-MOD-05-001: `<surface>-<state>.png` 形式）。

| # | ロール | route | shell 状態 | canonical ファイル名 |
| --- | --- | --- | --- | --- |
| 1 | guest | `/` | sidebar expanded（desktop） | `public-sidebar-guest.png` |
| 2 | member | `/` | sidebar expanded（desktop） | `public-sidebar-member.png` |
| 3 | admin | `/` | sidebar expanded（ADMIN グループ表示） | `public-sidebar-admin.png` |
| 4 | guest | `/` | sidebar collapsed（desktop） | `public-sidebar-collapsed.png` |
| 5 | guest | `/` | mobile drawer open | `public-sidebar-mobile-drawer.png` |
| 6 | member | `/profile` | sidebar expanded（desktop） | `member-sidebar-logged-in.png` |
| 7 | admin | `/profile` | sidebar expanded（ADMIN グループ表示） | `profile-sidebar-admin.png` |
| 8 | member | `/profile` | mobile drawer open | `member-sidebar-mobile-drawer.png` |
| 9 | guest | `/login` | sidebar expanded（footer 描画含む） | `login-sidebar-guest.png` |

> collapsed / mobile drawer の状態遷移は Task A `useSidebarState` / Task E `SidebarMobileTrigger` の責務。
> Task C は shell mount のみのため、これらは「mount された shell が状態を保持できるか」の確認として撮る。

## screenshot canonical 命名規約

- 形式: `<surface>-<state>.png`（kebab-case）
- `<surface>`: `public-sidebar` / `member-sidebar` / `profile-sidebar` / `login-sidebar`
- `<state>`: `guest` / `member` / `admin` / `collapsed` / `mobile-drawer` / `logged-in`
- 配置先: `outputs/phase-11/screenshots/`
- TC 番号・撮影パラメータ（viewport / role / storageState）は `phase11-capture-metadata.json` に保持し、
  ファイル名には焼き込まない（rename 耐性・diff レビュー容易性のため）。

## capture script 方針（FB-MSO-003）

実 capture（Gate-C）で用いる Playwright capture script は、browser / server lifecycle を
`try { } finally { }` で必ず解放する標準パターンに従う。

```ts
// 概念例（実コードは Gate-C runtime wave で apps/web/playwright 配下に配置）
const server = await startWebServer();
const browser = await chromium.launch();
try {
  // 各 (role, route, state) について page.goto → storageState 切替 → screenshot
} finally {
  await browser.close();
  await server.close();
}
```

> finally で `browser.close()` / `server.close()` を必ず呼ぶことで、capture 失敗時も
> プロセス／ポートのリークを防ぐ（FB-MSO-003）。

## フィードバックループ

| 深刻度 | 取り扱い |
| --- | --- |
| HIGH | UI 上の重大欠陥（shell が描画されない・URL が変わる・footer 消失等）は Gate-C を保留し、CONST_008 に従って同サイクル修正を優先する |
| MEDIUM | active state の SSR fallback 不足など。Phase 12 `unassigned-task-detection.md` の current/baseline 分離で再評価（M-1 参照） |
| LOW | 段組の軽微なズレ。実装 wave 内で吸収 |

## 本サイクルの evidence 境界

- 本サイクルでは **focused vitest（source-level 証跡）が主ソース**。実 pixel screenshot は Gate-C で取得する。
- targeted test（Phase 1 列挙）: `(public)/layout.spec.tsx` / `(member)/layout.spec.tsx` /
  `(public)/page.spec.tsx` / `(member)/profile/page.spec.tsx` / `(public)/login/page.spec.tsx`。
- 実行結果テンプレートは `outputs/phase-11/manual-test-result.md` に固定する。

## 完了条件

capture 対象マトリクス・canonical ファイル名・3 層評価観点・capture script 方針が確定し、
`outputs/phase-11/manual-test-result.md` に source-level evidence と runtime screenshot 境界が記録されている。
