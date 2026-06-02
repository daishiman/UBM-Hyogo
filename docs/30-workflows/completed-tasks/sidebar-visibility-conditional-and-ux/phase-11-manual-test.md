# Phase 11: 手動テスト

## VISUAL 宣言

本タスクは **VISUAL（UI task）** である。理由:

- `/login` のサイドバー（SidebarShell）が **表示 → 非表示** へ変わる（bare 化）。見た目の差分が発生する。
- viewer（未ログイン）時の `SidebarUserMenu` が「ゲスト」表記 + ログイン CTA を持つ identity 表現へ変わる。
- 全 route で SSR 時点の active nav 表示が正確化する（admin の `/admin` ハードコード撤廃を含む）。

よって Phase 11 は screenshot 取得対象である。本サイクルでは実コード・direct focused tests・typecheck・lint・grep gate は完了済みであり、
認証不要ルートの local pixel screenshot 4 枚も取得済みである。admin 認証を要する screenshot は production-equivalent running stack /
staging 認証下に user-gated 取得する two-tier 方針を取る。

> two-tier: 本サイクルでは (1) source-level evidence を deterministic tests で取得し、(2) screenshot の
> **capture 計画・canonical 命名・3 層評価観点を確定**し、(3) 認証不要ルートの local screenshot を保存し、
> (4) admin/member 認証が必要な pixel capture は production-equivalent running stack（認証済みセッション・API Worker・D1）上で
> user-gated 取得する。`outputs/phase-11/screenshots/` には local 4 PNG を保存済みであり、残 screenshot は
> `outputs/phase-11/manual-test-result.md` の canonical 一覧に pending として固定する。

## 3 層評価の観点（Semantic / Visual / AI UX）

| 層 | 観点 | 合否基準 |
| --- | --- | --- |
| Semantic | `/login` の DOM に shell（`aside` / `data-testid="public-shell"`）が無く `data-shell-mode="bare"` を持つ | DOM 契約一致（AC-1 / AC-2） |
| Semantic | middleware が全 request に `x-pathname` を設定し、各 layout が `activePath` として渡す | middleware spec / layout の header 読込（AC-4 / AC-5） |
| Semantic | viewer 時 `SidebarUserMenu` が「ゲスト」+ ログイン CTA を描画し、active item に `aria-current="page"` が付く | DOM 属性確認（AC-6 / AC-7） |
| Visual | `/login` がサイドバー無しの bare レイアウトで描画され、認証導線が二重化しない | screenshot で shell 非表示 |
| Visual | viewer サイドバーがメンバー風に見えず「ゲスト/未ログイン」と CTA が視認できる | screenshot で identity 区別 |
| Visual | `/admin/members` で active が `/admin`（ダッシュボード）でなく `/admin/members` にハイライトされる | screenshot で SSR active 正確化（FOUC 解消） |
| AI UX | route 遷移で active 表示が SSR 時点から正しく、hydration 待ちの誤ハイライトが無い | 目視で初期 active 一致 |

## capture 対象マトリクス（route × 状態）

viewer/member/admin × route × shell 状態の組合せで網羅する。TC 番号は metadata（`manual-test-result.md`）にのみ保持し、
ファイル名には含めない（FB-LLM-MOD-05-001: `<screen>-<state>.png` 形式）。

| TC-ID | ロール | route | 状態 | canonical ファイル名 | 確認観点 |
| --- | --- | --- | --- | --- | --- |
| TC-01 | 不問 | `/login` | shell 無し（bare）| `login-bare.png` | AC-1/2: サイドバー非表示・認証導線が単一 |
| TC-02 | viewer（ゲスト）| `/` | sidebar expanded | `sidebar-viewer-guest.png` | AC-6: 「ゲスト」表記 + ログイン CTA |
| TC-03 | viewer（ゲスト）| `/` | mobile initial | `sidebar-viewer-guest-mobile.png` | AC-6: mobile viewport でも viewer identity が破綻しない |
| TC-04 | viewer | `/members/[id]` | member 公開ページ（sidebar 表示）| `sidebar-viewer-member-page.png` | 公開 member ページで viewer shell が一貫 |
| TC-05 | admin | `/admin` | active=ダッシュボード | `sidebar-admin-active-dashboard.png` | AC-5/7: `/admin` で active 正確 |
| TC-06 | admin | `/admin/members` | active=members（SSR 正確化）| `sidebar-admin-active-members.png` | AC-5/7: ハードコード撤廃で active が members |
| TC-07 | admin | `/admin` | schema badge 表示 | `sidebar-admin-badge.png` | AC-7: admin schema diff badge 視認性 |
| TC-08 | viewer | `/` | mobile drawer open | `sidebar-mobile-drawer.png` | drawer 内でも viewer identity / active が一貫 |

## screenshot canonical 命名規約

- 形式: `<screen>-<state>.png`（kebab-case）
- `<screen>`: `login` / `sidebar-viewer` / `sidebar-admin` / `sidebar-mobile`
- `<state>`: `bare` / `guest` / `guest-collapsed` / `member-page` / `active-dashboard` / `active-members` / `badge` / `drawer`
- 例: `login-bare.png` / `sidebar-viewer-guest.png` / `sidebar-admin-active-members.png`
- 配置先: `outputs/phase-11/screenshots/`（pixel capture は user-gated）
- TC 番号・撮影パラメータ（viewport / role / storageState）は metadata（`manual-test-result.md`）に保持し、
  ファイル名には焼き込まない（rename 耐性・diff レビュー容易性のため）。

## capture script 方針（FB-MSO-003）

実 capture（user-gated）で用いる Playwright capture script は、browser / server lifecycle を
`try { } finally { }` で必ず解放する標準パターンに従う。staging 認証（admin / member の storageState）が必須のため user-gated。

```ts
// 概念例（実コードは実装サイクルで apps/web/playwright 配下に配置）
const server = await startWebServer();
const browser = await chromium.launch();
try {
  // 各 (role, route, state) について page.goto → storageState 切替 → screenshot
} finally {
  await browser.close();
  await server.close();
}
```

> finally で `browser.close()` / `server.close()` を必ず呼ぶことで、capture 失敗時もプロセス／ポートのリークを防ぐ（FB-MSO-003）。
> admin/member の認証状態は storageState（事前ログイン済みセッション）で注入する。これが staging 認証必須 = user-gated の理由。

## 本サイクルの evidence 境界

- 本サイクルは **`implemented_local_evidence_captured`**。実コード・direct focused Vitest・typecheck・lint・grep gate は完了済みであり、
  local pixel screenshot 4 PNG は保存済み。admin/staging screenshot は staging 認証下に user-gated 取得する。
- targeted test evidence（Phase 1 列挙）:
  `apps/web/app/(auth)/login/__tests__/login-page.spec.tsx`（移動後 + shell 非表示）/
  `apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts`（invariant: login=shell 外）/
  middleware x-pathname spec /
  `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx`（viewer ゲスト表記）/
  `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`（active aria-current/視認性）/
  `apps/web/src/components/shell/__tests__/shell-config.spec.ts`（既存回帰）。
- 実行結果は `outputs/phase-11/manual-test-result.md` に固定する。

## フィードバックループ

| 深刻度 | 取り扱い |
| --- | --- |
| HIGH | shell が `/login` で消えない・URL が変わる・viewer identity が区別できない等は CONST_008 に従い同サイクル修正 |
| MEDIUM | SSR active fallback 不足など。Phase 12 `unassigned-task-detection.md` の current/baseline 分離で再評価 |
| LOW | collapsed 時の軽微なズレ。同サイクル内で吸収 |

## 完了条件

- [x] VISUAL 宣言と two-tier 方針（認証不要 local pixel は取得済み、admin/staging pixel は user-gated）を明記した
- [x] 3 層評価観点（Semantic / Visual / AI UX）を定義した
- [x] capture 対象マトリクス（route × 状態）と canonical ファイル名を確定した
- [x] screenshot 命名規約（`<screen>-<state>.png`）を確定した
- [x] capture script 方針（try/finally・staging 認証 user-gated）を記録した
- [x] 本サイクルの evidence 境界（implemented_local_evidence_captured: source-level evidence 完了 / pixel user-gated）を明記した
