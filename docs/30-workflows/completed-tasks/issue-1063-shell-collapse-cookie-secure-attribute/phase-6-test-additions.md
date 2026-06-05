# Phase 6: テスト追加（fail path / 回帰 guard）

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 6（テスト追加 / 異常系 + 回帰 guard） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| 追記対象 | `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` |
| 追加ケース | 既存 `describe("shell-collapse-cookie", ...)` 内に TC-1〜TC-6 相当を追記 |
| 命名規則 | `*.spec.ts`（CLAUDE.md 不変条件 #8。`*.test.ts` は禁止） |

## 目的

Phase 4 の TC-1〜TC-6 を確定実装し、Phase 5 Green 後の `serializeShellCollapsedCookie` に対する fail path（`secure` 既定経路 = jsdom http で `Secure` が付かない）と HTTPS runtime 既定経路、回帰 guard（既存 parser / writer / reader の無改修維持）を固定する。`Secure` 属性は `document.cookie` の read 値に現れないため、serializer の戻り値文字列を直接 assert する。

## 実行タスク

### 6.1 追記するテストコード全文

既存 `shell-collapse-cookie.spec.ts` の `describe("shell-collapse-cookie", ...)` ブロック内に以下の観点を追記する。HTTPS runtime 既定経路を決定論的に検証するため、`vitest` import は `afterEach` と `vi` を追加し、`afterEach(() => vi.unstubAllGlobals())` で global stub を必ず戻す。

```ts
describe("shell-collapse-cookie / Secure attribute", () => {
  // TC-1: production 判定（secure=true）で末尾に "; Secure" を付与する（AC-1）
  it("production 判定（secure=true）で '; Secure' を付与する", () => {
    expect(serializeShellCollapsedCookie(true, true)).toContain("; Secure");
  });

  // TC-2: dev 判定（secure=false）で Secure を一切付与しない（AC-2）
  it("dev 判定（secure=false）で Secure を付与しない", () => {
    expect(serializeShellCollapsedCookie(true, false)).not.toContain("Secure");
  });

  // TC-3: dev 判定で既存属性（value/Path/Max-Age/SameSite）が回帰しない（AC-2 / AC-4）
  it("dev 判定で既存属性（value/Path/Max-Age/SameSite）が回帰しない", () => {
    const serialized = serializeShellCollapsedCookie(false, false);
    expect(serialized).toContain("ubm_shell_collapsed=false");
    expect(serialized).toContain("Path=/");
    expect(serialized).toContain("Max-Age=31536000");
    expect(serialized).toContain("SameSite=Lax");
    expect(serialized).not.toContain("Secure");
  });

  // TC-4: default-path（secure 省略・jsdom http）で Secure を付与しない（AC-3 / AC-5）
  it("default-path（jsdom http）で Secure を付与しない", () => {
    // jsdom の location.protocol === "http:" のため isSecureRuntimeContext() は false を返す
    expect(serializeShellCollapsedCookie(true)).not.toContain("Secure");
  });

  // TC-5: production 付与時も既存属性が不変で "; Secure" が末尾に来る（AC-1 / AC-4）
  it("production 付与時も既存属性が不変で Secure が末尾に来る", () => {
    const serialized = serializeShellCollapsedCookie(true, true);
    expect(serialized).toContain("ubm_shell_collapsed=true");
    expect(serialized).toContain("Path=/");
    expect(serialized).toContain("Max-Age=31536000");
    expect(serialized).toContain("SameSite=Lax");
    expect(serialized.endsWith("; Secure")).toBe(true);
  });
});
```

追加の HTTPS runtime 既定経路:

```ts
afterEach(() => {
  vi.unstubAllGlobals();
});

it("HTTPS runtime では secure 引数省略時にも Secure 属性を付与する", () => {
  vi.stubGlobal("document", { location: { protocol: "https:" } });

  expect(serializeShellCollapsedCookie(true)).toBe(
    "ubm_shell_collapsed=true; Path=/; Max-Age=31536000; SameSite=Lax; Secure",
  );
});
```

### 6.2 fail path（secure 既定経路）の観点

| 観点 | TC | 検証内容 |
|------|----|----------|
| 既定値が runtime 判定にフォールバックする（http） | TC-4 | `secure` を省略した `serializeShellCollapsedCookie(true)` は `isSecureRuntimeContext()` を呼び、jsdom の `location.protocol === "http:"` で `false` を返すため `Secure` が付かない。SSR/Workers（`browserDocument()` が `undefined`）でも `?.` で `false` となり throw しない契約をこの経路が代表する。 |
| 既定値が runtime 判定にフォールバックする（https） | TC-6 | `document.location.protocol` を `https:` に stub し、`secure` 引数省略時にも `; Secure` が付くことを確認する。 |
| 明示 false が runtime 判定を上書きする | TC-2 / TC-3 | `secure=false` を明示注入すると runtime（jsdom http でも https でも）に依存せず `Secure` を付けない。決定論的に dev 文字列を固定する。 |

> `isSecureRuntimeContext()` の https 分岐（戻り値 true）は private ヘルパのまま、TC-6 で `document.location.protocol` を `https:` に stub して serializer の既定引数経路から検証する。これにより明示 `secure=true` だけでなく、実運用の省略呼び出しも回帰 guard になる。

### 6.3 回帰 guard（既存テストが無改修で維持されること）

| guard ID | 守る不変条件 | 検証内容 | 維持手段 |
|----------|-------------|---------|----------|
| RG-1 | I-5 parser 無改修 | 既存 `parseShellCollapsedCookie("true"/"false"/不正/null)` ケースが pass | 既存テスト無改修 |
| RG-2 | I-2 既存属性不変 | 既存 `serializeShellCollapsedCookie(true)` の `value/Path/SameSite/Max-Age` ケースが pass（既定 secure=false 相当で `Secure` が付かないため `toContain` 検証は不変） | 既存テスト無改修 |
| RG-3 | writer 副作用不変 | 既存 `writeShellCollapsedCookie(true)` → `document.cookie` に `ubm_shell_collapsed=true` を書込むケースが pass | 既存テスト無改修（jsdom http のため書込文字列に `Secure` が付かず write が受理される） |
| RG-4 | reader 不変 | 既存 `readCollapsedFromDocument()` ケースが pass | 既存テスト無改修 |

> 既存 `serializeShellCollapsedCookie(true)`（引数 1 個）ケースは Phase 5 でシグネチャが `(collapsed, secure?)` に拡張されても、`secure` が省略可（既定 `isSecureRuntimeContext()` = jsdom http で false）のため呼出しが型・実行ともに維持される。既存ケースの編集は不要。

### 6.4 TDD Red → Green の確認

- Phase 5 実装前: TC-1 / TC-5 は fail（現行 serializer は `Secure` を付与しない）。さらに TC-1 / TC-2 / TC-5 は第2引数 `secure` を渡すため現行シグネチャ `(collapsed): string` で型エラー（`pnpm typecheck` fail）。
- Phase 5 実装後: TC-1〜TC-6 + 既存 4 ケースが全 Green（10 tests）。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| Phase 4 テスト計画 | `phase-4-test-plan.md` | TC-1〜TC-6 / TDD Red 期待 |
| Phase 5 実装手順 | `phase-5-implementation.md` | serializer After / `isSecureRuntimeContext` |
| 既存 spec | `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` | 追記先・既存 4 ケース |
| vitest config | `vitest.config.ts`（リポジトリルート） | `--root=. --config=vitest.config.ts` が正経路 |

## 統合テスト連携

本タスクの自動検証は serializer focused Vitest に閉じる。`Secure` は cookie value に現れず統合テスト（Playwright / SSR HTML 検査）では捕捉できないため適用外。既存 shell 系 focused suite（`useSidebarState.spec.tsx` / `SidebarShell.server.spec.tsx`）が回帰しないことは Phase 9 で確認する。

## 成果物

- 本ファイル（`phase-6-test-additions.md`）に TC-1〜TC-6 の追記テストコード、fail path 観点、HTTPS runtime 既定経路、回帰 guard を確定する。

## 完了条件

- §6.1 の追記内容が確定し、既存 describe への追記位置が明示されている。
- fail path（secure 既定経路）と回帰 guard（既存 4 ケース無改修）が表で固定されている。
- TC-1〜TC-6 が AC-1〜AC-6 をトレースし、TDD Red→Green が明記されている。
