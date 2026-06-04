# Phase 8: リファクタリング

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 本タスク自体がリファクタリングである

本タスクの本質は、`shell-collapse-cookie.ts` に存在する **命名 2 系統（primary + dead alias）** という duplicate と、設計 doc ↔ code 間の **navigation drift（doc が alias 名/誤契約を記述）** を削ることである。すなわち Phase 6（実装）の diff そのものがリファクタリング（dead code 除去 + SSOT 一本化）であり、Phase 8 で追加するリファクタリングは存在しない。

- **duplicate（命名 2 系統）の除去**: primary 5 export と意味の重複する alias 3 件を削除し、export surface を 1 系統に収斂させる。
- **navigation drift の除去**: 設計 doc 3 本を primary 名へ整合し、`parseShellCollapsedCookie` を「値 parser」と正しく記述する（issue 前提の「ヘッダ全体 parser / 別契約」記述は誤りであり訂正する）。

## 2. 変更内容 [Feedback RT-03]

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `apps/web/src/components/shell/shell-collapse-cookie.ts` | 2 系統（primary 5 export + dead alias 3 = 計 8 export surface） | 1 系統（primary 5 export のみ） | SSOT 確立・dead alias 除去。命名 SSOT を code-primary に一本化し、duplicate を解消する。 |
| `phase-2-design.md`（設計 doc 1/3） | alias 名・誤契約記述が混在 | primary 名 + 値 parser 訂正注記へ整合 | navigation drift（doc↔code 名乖離）の除去 |
| `phase-3-design-review.md`（設計 doc 2/3） | 同上 | 同上 | 同上 |
| `outputs/phase-12/implementation-guide.md`（設計 doc 3/3） | 同上 | 同上 | 同上 |

### 削除する dead alias 3 件（再掲）

| 位置 | alias | 実体（primary） | `apps/web/src` 参照数 |
| --- | --- | --- | --- |
| L4 | `SHELL_COLLAPSE_COOKIE` | `SHELL_COLLAPSE_COOKIE_NAME` | 0 |
| L34 | `readCollapsedFromCookieString` | `parseShellCollapsedCookie` | 0 |
| L35 | `writeCollapsedCookie` | `writeShellCollapsedCookie` | 0 |

## 3. keep する primary export（不変）

`SHELL_COLLAPSE_COOKIE_NAME` / `parseShellCollapsedCookie`（値→`boolean|null` の pure）/ `serializeShellCollapsedCookie` / `writeShellCollapsedCookie` / `readCollapsedFromDocument` の 5 件は名前・シグネチャ・振る舞いとも一切変更しない。

## 4. 追加リファクタリングの要否

**不要。** consumer（`SidebarShell.server.tsx` / `useSidebarState.ts`）・focused test は既に全 primary 名を使用しており、過剰な抽象化や API 整理を追加すると CONST_007（単一サイクル）から逸脱する。diff は **3 行削除のみ**に閉じる（cookie 名/value/属性は無変更）。
