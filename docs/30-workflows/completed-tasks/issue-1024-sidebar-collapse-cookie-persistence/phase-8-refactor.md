# Phase 8: リファクタリング

> issue-1024 — sidebar collapse 状態の cookie 永続化

## 8.1 リファクタ対象一覧（[Feedback RT-03] 対象/Before/After/理由）

本タスクは「localStorage 永続化を cookie + SSR seed へ置換」する設計変更そのものが主リファクタ。
以下に対象ごとの Before/After/理由を表で固定する。

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| 永続化先 | `localStorage`（key `ubm:shell:collapsed`） | cookie（`ubm_shell_collapsed`） | SSR で読めずちらつき残存・lint-boundaries 回避 hack 依存だったため。cookie は server seed 可能 |
| `STORAGE_KEY` 定数（`useSidebarState.ts`） | `const STORAGE_KEY = "ubm:shell:collapsed"` | 削除 | cookie 移管で不要。localStorage 残骸ゼロ化 |
| `STORAGE_NAME` 定数（lint 回避 hack） | `const STORAGE_NAME = "local" + "Storage"` | 削除 | 禁止トークンを文字列連結で隠す hack。設計の根本悪。撤廃が本タスクの核 |
| `getShellStorage()` | `win?.[STORAGE_NAME ...] as Storage` | 削除 | cookie I/O は `shell-collapse-cookie.ts` へ集約。重複アクセサ排除 |
| `readPersistedCollapsed()` | localStorage 読取り（try/catch + JSON.parse） | 削除 | 読取りは server seed（`cookies()`）＋ pure parser へ移管 |
| toggle の書込 | `storage?.setItem(STORAGE_KEY, JSON.stringify(...))` | `writeShellCollapsedCookie(next === "collapsed")` | 書込を単一 source（cookie module）へ集約 |
| `useSidebarState` signature | `useSidebarState(): SidebarState` | `useSidebarState(initialCollapsed: boolean \| null = null): SidebarState` | SSR seed を hook へ橋渡し。既定引数で後方互換維持 |
| cookie I/O の所在 | hook 内に散在（読 + 書） | `shell-collapse-cookie.ts` に集約（pure parser + client read/write） | 単一責務・DOM 非依存テスト可能化（duplicate / navigation drift 削減） |
| ファイル冒頭コメント（`useSidebarState.ts`） | `副作用は browser storage key 'ubm:shell:collapsed' の読み書きのみ` | cookie 書込のみへ更新 | 実装と一致させる（陳腐化コメント除去） |

## 8.2 設計レビュー MINOR の本サイクル結論: `readCollapsedFromDocument` over-export 判定

Phase 3（D-2 / MINOR）で挙げた `readCollapsedFromDocument` の over-export を本サイクル内で結論する
（未タスク化しない）。

| 判断軸 | 内容 |
|--------|------|
| 現状の利用 | hook では未使用（SSR seed を `useState` 初期値に反映済みで client 再読取りは hydration race を生むため意図的に呼ばない） |
| 残す案（保険） | 将来 seed が渡らない client-only mount 経路の保険として export 保持 |
| 削除案 | YAGNI。利用箇所ゼロの export は dead surface でテスト負債になる |

### Before/After 判断

| 項目 | Before（Phase 2 設計時） | After（本サイクル結論） |
|------|--------------------------|--------------------------|
| `readCollapsedFromDocument` の export | 「将来の保険として残す」と仮置き | **export を保持する。ただし dead surface にしないため Phase 6/7 で line/branch 100% のテストを必須化する** |
| 根拠 | 未確定（Phase 8 へ先送り） | parser（`parseShellCollapsedCookie`）と対になる client read が同一 module にあることで cookie I/O の単一 source という責務が完結する。read/write 非対称（write だけ export）は API の見通しを悪くする。テストで全分岐を踏むため dead code 化しない |

> 結論: **`readCollapsedFromDocument` は残す**。判断条件は「テストでカバーされ dead surface でないこと」。
> Phase 7 のカバレッジ表に当該関数の全分岐（SSR null / 不一致 null / true / false）を既に固定済み。
> もし Phase 6 で 100% テストを付与できない事情が生じた場合に限り削除へ倒すが、現設計では到達可能なため
> 削除は不要。

## 8.3 localStorage 残骸ゼロの確認（duplicate / navigation drift 削減）

撤廃完了を機械的に保証する grep を Phase 9 / DoD と共有する:

```bash
grep -rn "localStorage\|STORAGE_NAME\|getShellStorage\|readPersistedCollapsed" \
  apps/web/src/components/shell/
# 期待: 0 件
```

- `useSidebarState.ts` から localStorage 系の定数・関数・コメントが完全に消えていること。
- `shell-collapse-cookie.ts` は cookie のみを扱い、`localStorage`/`sessionStorage` トークンを含まないこと。
- 既存 spec（`useSidebarState.spec.tsx`）に残る localStorage アサーションは cookie アサーションへ
  置換済みで、grep が spec も含めて 0 件であること（Phase 6 の責務だが Phase 8 で残骸の最終確認をする）。

## 8.4 リファクタ後の責務分離（最終形）

| レイヤ | 責務 | I/O |
|--------|------|-----|
| `SidebarShell.server.tsx` | request 時に cookie を読み seed 算出 | read（`cookies()` + pure parser） |
| `SidebarShell.tsx` | seed を hook へ橋渡し | なし |
| `useSidebarState.ts` | state owner。toggle で cookie 書込 | write 委譲のみ |
| `shell-collapse-cookie.ts` | cookie の read/parse/write 単一 source | parser(pure) + client read/write |

重複アクセサ（旧 `getShellStorage`）と隠蔽 hack（`STORAGE_NAME`）を除去し、I/O が 1 module に収束する。
