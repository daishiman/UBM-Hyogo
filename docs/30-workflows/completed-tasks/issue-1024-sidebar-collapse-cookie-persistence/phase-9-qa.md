# Phase 9: 品質保証（QA）

> issue-1024 — sidebar collapse 状態の cookie 永続化

## 9.1 一括判定チェックリスト

実装完了後、以下を上から順に全て PASS させる。1 つでも fail なら該当 Phase（5/6/8）へ戻る。

| # | 観点 | コマンド / 判定 | 期待 |
|---|------|----------------|------|
| Q-1 | line budget | 変更ファイルの行数が肥大化していないこと（新規 module ≤ 約 90 行、hook の純減を確認） | localStorage 系削除により hook は純減・新規 module は小さい |
| Q-2 | link / 参照整合 | `shell-collapse-cookie.ts` の import（`@/lib/is-browser`）が実在、hook / shell / server からの import path が解決すること | typecheck で担保 |
| Q-3 | lint-boundaries | `pnpm lint` | localStorage / sessionStorage トークン 0 で PASS |
| Q-4 | typecheck | `pnpm typecheck` | exit 0 |
| Q-5 | focused vitest | `pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/shell` | shell 系 spec 全 PASS |
| Q-6 | grep gate | 後述 9.3 の grep | 0 件 |

## 9.2 CI gate 対応

| gate | 本タスクでの状態 | 根拠 |
|------|-----------------|------|
| `lint-boundaries`（localStorage トークン検出） | **PASS 必須** | `STORAGE_NAME = "local"+"Storage"` 連結 hack を撤廃し cookie へ移行。禁止トークン `localStorage`/`sessionStorage` が src から 0 件になる。cookie / `document.cookie` は許可トークンのため新規 boundary 違反なし |
| `verify-design-tokens` | **影響なし（明記）** | 本タスクは CSS / token / `tokens.css` を一切変更しない（cookie 永続化はロジック層のみ）。HEX 直書き・`bg-[#xxx]` 追加もなし。よって design-tokens gate は no-op |
| typecheck | **PASS 必須** | `cookies()` の `await` パターン・`initialCollapsed?: boolean \| null` の型整合を確認 |
| focused vitest（shell） | **PASS 必須** | 新規 `shell-collapse-cookie.spec.ts`、更新後 `useSidebarState.spec.tsx`、`SidebarShell.server.spec.tsx`（cookies mock 追加）を含む全 shell spec が緑 |

> 注: `verify-design-tokens` に対しては「CSS 変更なし＝影響なし」を明示的に記録する。
> CI 上は gate 自体は走るが本変更で fail する要素はない。

## 9.3 grep gate（localStorage 撤廃の機械的保証）

```bash
grep -rn "localStorage\|STORAGE_NAME\|getShellStorage\|readPersistedCollapsed" \
  apps/web/src/components/shell/
```

- **期待: 0 件**（exit 1 = ヒットなし）。
- 対象は src コードとテスト（`__tests__/`）の両方。spec の localStorage アサーションが cookie へ
  置換済みであることもこの 0 件で担保する。
- `grep ... | head` 等のパイプは exit code を誤判定するため使わない（[Feedback grep|head pitfall]）。
  生の `grep -rn` の exit code（1 = 0 件）で判定する。

### 許可トークンの確認（誤検知防止）

cookie 永続化のため以下は **許可** され、grep gate にも引っかからない:

- `document.cookie` / `cookie` / `cookies()`（`next/headers`） / `SHELL_COLLAPSE_COOKIE`
- `browserDocument`（`@/lib/is-browser` の既存 accessor）

## 9.4 受け入れ条件（AC）との対応

| AC | 検証 |
|----|------|
| AC-1 toggle で cookie 書込 | Q-5（toggle → `writeCollapsedCookie` spy が `true`/`false` で呼ばれる spec） |
| AC-2 SSR seed でちらつき排除 | Q-4 + Q-5（server が seed を渡し hook 初期値へ反映・`SidebarShell.server.spec` で cookie mock → seed 経路） |
| AC-3 cookie I/O 単一 source | Q-2 + Phase 8（read/parse/write が `shell-collapse-cookie.ts` に集約） |
| AC-4 localStorage 撤廃 + lint green + grep 0 件 | Q-3 + Q-6 |
| AC-5 hook 戻り値不変 + md heuristic 維持 + shell 系 spec 全 pass | Q-5（`SidebarState` shape 不変・seed=null 時 md viewport collapsed 維持） |

## 9.5 DoD への橋渡し（Phase 10 で最終判定）

- 本 Phase 9 の Q-1〜Q-6 が全 PASS かつ AC-1〜AC-5 が全て検証済みであることを Phase 10（最終レビュー）が
  受け取り、DoD として確定する。
- coverage 証跡（Phase 7 の `shell-collapse-cookie.ts` 100% / `useSidebarState.ts` の seed・toggle
  branch 実測）を Phase 10 / outputs へ転記する。
- 実装・コミット・PR・Issue 状態変更は本仕様書の範囲外（ユーザー承認後に実施）。
