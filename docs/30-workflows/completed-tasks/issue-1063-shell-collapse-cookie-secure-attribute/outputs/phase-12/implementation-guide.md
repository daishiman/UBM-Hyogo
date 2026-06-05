---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 12
作成日: 2026-06-03
task_id: issue-1063-shell-collapse-cookie-secure-attribute
issue: 1063
issue_state: CLOSED
---

# 実装ガイド — shell collapse cookie の `Secure` 属性 production hardening

## Part 1: 中学生にもわかる説明

### なぜ必要か（先に理由）

ウェブサイトは「クッキー」という小さなメモをあなたのブラウザに渡して、「サイドバーを畳んでいたか・開いていたか」を覚えておきます。次に来たときに同じ見た目で表示するためです。

このメモは、ふつうの郵便（HTTP）で届くこともあれば、封をした書留郵便（HTTPS = 鍵マークが付く安全な通信）で届くこともあります。封をしていない郵便だと、途中で誰かにこっそり中身を見られるかもしれません。

### 何をするか

メモに「**封がされた郵便（HTTPS）のときだけ渡してね**」という札（これを `Secure` と呼びます）を付けます。

- 本番サイト（鍵マーク付き = HTTPS）では、メモに `Secure` の札を付ける。→ 安全な通信のときだけメモが運ばれる。
- 開発中の自分のパソコン（鍵マークなし = `http://localhost`）では、札を付けない。→ もし付けてしまうと、開発中はメモが運ばれなくなり「サイドバーの状態を覚えてくれない」不具合に見えてしまうから。

たとえば、宅配ボックスに「雨の日（HTTPS）だけ荷物を入れてOK」という札を付けるイメージです。晴れの日（開発中の http）は今までどおり普通に荷物を受け取れます。

### このタスクの大事なところ

メモの中身（畳んでいたか）も、名前も、有効期限も**一切変えません**。変えるのは「`Secure` の札を付けるか付けないか」だけです。だから今までの動きは壊れません。

### 今回作ったもの

- HTTPS かどうかを見て、クッキーに `Secure` の札を付ける小さな判定。
- `http://localhost` では今までどおり `Secure` を付けない安全な分岐。
- 上の 2 つが壊れないか確認するテスト。

## Part 2: 技術者向け詳細

### current contract（現行コードの起点）

`apps/web/src/components/shell/shell-collapse-cookie.ts`（現行 HEAD `ca3fb9336`）の `serializeShellCollapsedCookie` は `Secure` を付与していない:

```ts
export function serializeShellCollapsedCookie(collapsed: boolean): string {
  const value = collapsed ? "true" : "false";
  return `${SHELL_COLLAPSE_COOKIE_NAME}=${value}; Path=/; Max-Age=${SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
```

### 変更後のインターフェース / 型定義

```ts
type ShellCollapseCookieSecureOption = boolean | undefined;

/** private: client runtime が HTTPS か（process.env 非参照） */
function isSecureRuntimeContext(): boolean {
  return browserDocument()?.location.protocol === "https:";
}

/**
 * @param collapsed sidebar が collapsed か
 * @param secure `Secure` 付与可否。省略時は client runtime（HTTPS か）で判定
 */
export function serializeShellCollapsedCookie(
  collapsed: boolean,
  secure?: boolean,           // 実装上の既定値 = isSecureRuntimeContext()
): string;
```

### APIシグネチャ

```ts
serializeShellCollapsedCookie(
  collapsed: boolean,
  secure?: ShellCollapseCookieSecureOption,
): string;
```

| 識別子 | 種別 | シグネチャ / 値 |
|--------|------|----------------|
| `isSecureRuntimeContext` | private function | `(): boolean`（`browserDocument()?.location.protocol === "https:"`） |
| `serializeShellCollapsedCookie` | exported function | `(collapsed: boolean, secure: boolean = isSecureRuntimeContext()) => string` |
| `writeShellCollapsedCookie` | exported function | `(collapsed: boolean) => void`（**無改修**。既定 secure 経由で runtime 判定を取得） |
| `parseShellCollapsedCookie` / `readCollapsedFromDocument` | exported function | **無改修**（read 経路は `Secure` に非依存） |

### データフロー

```
toggleCollapsed() → writeShellCollapsedCookie(collapsed)
  → serializeShellCollapsedCookie(collapsed)         // secure 省略
      → isSecureRuntimeContext()                     // https? → true/false
      → base (+ "; Secure" if secure)
  → document.cookie = <serialized>
```

### 使用例

```ts
serializeShellCollapsedCookie(true, true);
// "ubm_shell_collapsed=true; Path=/; Max-Age=31536000; SameSite=Lax; Secure"

serializeShellCollapsedCookie(false, false);
// "ubm_shell_collapsed=false; Path=/; Max-Age=31536000; SameSite=Lax"

serializeShellCollapsedCookie(true);
// HTTPS runtime では Secure 付き、http/SSR では Secure 無し
```

### cookie 属性（不変 / 可変）

| 属性 | 値 | 本タスクでの扱い |
|------|-----|------------------|
| name | `ubm_shell_collapsed` | 不変 |
| value | `true` / `false` | 不変 |
| `Path` | `/` | 不変 |
| `Max-Age` | `31536000`（1 年） | 不変 |
| `SameSite` | `Lax` | 不変 |
| `HttpOnly` | （無し） | 不変（client 読み書きのため付けない） |
| `Secure` | （無し） → **HTTPS 時のみ付与** | **本タスクの差分** |

### エラーハンドリング

`browserDocument()` が `undefined` を返す SSR / Workers では `isSecureRuntimeContext()` が `false` になり、例外を投げずに `Secure` 無しの文字列を返す。`process.env.*` は参照しない。

### エッジケース

| ケース | 挙動 |
|--------|------|
| SSR / Workers（`browserDocument()` が undefined） | `isSecureRuntimeContext()` → `false`（throw しない・dev 安全側） |
| `location.protocol !== "https:"`（`http:` / `file:`） | `false` → `Secure` 無し |
| `secure` 引数を明示 | runtime 判定を無視し引数優先（テスト決定論性） |

### 設定項目と定数一覧

| 定数 | 値 | 出所 |
|------|-----|------|
| `SHELL_COLLAPSE_COOKIE_NAME` | `"ubm_shell_collapsed"` | 既存（無改修） |
| `SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS` | `60 * 60 * 24 * 365` | 既存（無改修） |
| HTTPS 判定基準 | `location.protocol === "https:"` | 本タスク新規（`isSecureRuntimeContext` 内） |

### テスト構成

| テスト | 対象 |
|--------|------|
| focused Vitest 10 tests | 明示 `secure=true/false`、jsdom http 既定、HTTPS runtime 既定、既存 parser / writer / reader 後方互換 |
| typecheck | `secure` 第2引数と `document.location.protocol` 参照の型整合 |
| lint | `process.env.*` 直接参照なし、lint-boundaries 遵守 |
| grep gate | `apps/web/src/components/shell/` 配下の `process.env` / Web Storage 直接参照 0 件 |

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts
if grep -rn "process.env" apps/web/src/components/shell/; then exit 1; fi
```

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。`Secure` は cookie 送信制御属性でレンダリング結果・`document.cookie` read 値に現れない。代替証跡は `outputs/phase-11/manual-test-result.md`（focused Vitest 計画 + serializer 文字列検証 + user-gated DevTools smoke 手順）を参照。
