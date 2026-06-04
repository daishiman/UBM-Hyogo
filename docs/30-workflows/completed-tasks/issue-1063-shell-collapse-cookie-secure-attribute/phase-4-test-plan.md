# Phase 4: テスト計画

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 4（テスト計画 / TDD Red） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| 対象 test ファイル | `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`（既存に追記） |
| 命名規則 | `*.spec.ts`（CLAUDE.md 不変条件 #8。`*.test.ts` は禁止） |

## 目的

AC-1〜AC-6 を固定する focused test ケースを設計する。`Secure` は `document.cookie` の read 値に現れないため、**serializer の戻り値文字列を直接検証**する（read 値で検証しない）。TDD Red（実装前は新規ケースが fail）→ Phase 5 実装で Green へ遷移する。

## 実行タスク

### 4.1 テスト操作対象（props/state ではなく純粋関数の引数）

本タスクの被テスト対象は純粋関数 `serializeShellCollapsedCookie(collapsed, secure?)`。テストは引数（`collapsed` / `secure`）を明示注入し戻り値文字列を assert する。internal state / React props は無関係（VSCPKR-03 該当なし）。default-path のみ jsdom の `window.location`（`http://localhost`）に依存する。

### 4.2 追加テストケース一覧

| TC | 観点 | 入力 | 期待 | 紐づく AC |
|----|------|------|------|-----------|
| TC-1 | production 判定で `Secure` 付与 | `serializeShellCollapsedCookie(true, true)` | 戻り値に `"; Secure"` を含む | AC-1 |
| TC-2 | dev 判定で `Secure` 無し | `serializeShellCollapsedCookie(true, false)` | 戻り値に `"Secure"` を**含まない** | AC-2 |
| TC-3 | dev 判定で既存属性が回帰しない | `serializeShellCollapsedCookie(false, false)` | `ubm_shell_collapsed=false` / `Path=/` / `Max-Age=31536000` / `SameSite=Lax` を含む | AC-2 / AC-4 |
| TC-4 | default-path（jsdom http）で `Secure` 無し | `serializeShellCollapsedCookie(true)`（secure 省略） | 戻り値に `"Secure"` を含まない（jsdom の `location.protocol === "http:"`） | AC-3 / AC-5 |
| TC-5 | production 付与時も既存属性順序が不変 | `serializeShellCollapsedCookie(true, true)` | `ubm_shell_collapsed=true` / `Path=/` / `Max-Age=31536000` / `SameSite=Lax` を含み、`; Secure` が末尾 | AC-1 / AC-4 |
| TC-6 | HTTPS runtime 既定経路で `Secure` 付与 | `document.location.protocol` を `https:` として `serializeShellCollapsedCookie(true)` | `secure` 引数省略時にも `; Secure` が末尾 | AC-1 / AC-3 |

### 4.3 既存テストの後方互換（無改修で維持されること）

| 既存 TC | 内容 | 本タスクでの扱い |
|---------|------|------------------|
| `parseShellCollapsedCookie` boolean 変換 | `"true"`/`"false"`/不正値 | 無改修・維持（AC-5） |
| `serializeShellCollapsedCookie` 既存属性 | `Path`/`SameSite`/`Max-Age`/value | 無改修・維持（TC-3 が上位互換で内包） |
| `writeShellCollapsedCookie` document.cookie 書込 | jsdom で `ubm_shell_collapsed=true` 書込 | 無改修・維持（既定 secure=false なので書込文字列に Secure 付かず jsdom でも write 可能） |
| `readCollapsedFromDocument` 読取り | cookie から boolean 復元 | 無改修・維持 |

> 重要: `writeShellCollapsedCookie` の既存テストは jsdom（http）で動くため、default の `isSecureRuntimeContext()` が `false` を返し `Secure` が付かない。`Secure` 付き cookie は jsdom の `document.cookie =` でも文字列としては受理されるが、本タスクでは default が `Secure` 無しのため既存 write テストは回帰しない。

### 4.4 TDD Red 期待

Phase 5 実装前の状態:

- TC-1 / TC-5 は **fail**（現行 serializer は `Secure` を一切付与しない）。
- TC-2 / TC-3 / TC-4 は現行実装でも **pass**（現行は常に `Secure` 無し）。ただし `secure` 第2引数を渡す TC-1/TC-2/TC-5 は現行シグネチャ `(collapsed): string` では型エラー（`pnpm typecheck` fail）になるため、シグネチャ拡張（Phase 5）が必須。

> TDD Red の本質: TC-1（`secure=true` → `Secure` 付与）が現行コードで fail することが、実装の必要性を示す。

### 4.5 テストコード骨子（Phase 6 で全文確定・ここでは設計）

```ts
describe("shell-collapse-cookie / Secure attribute", () => {
  it("production 判定（secure=true）で '; Secure' を付与する", () => {
    expect(serializeShellCollapsedCookie(true, true)).toContain("; Secure");
  });

  it("dev 判定（secure=false）で Secure を付与しない", () => {
    expect(serializeShellCollapsedCookie(true, false)).not.toContain("Secure");
  });

  it("dev 判定で既存属性（Path/Max-Age/SameSite/value）が回帰しない", () => {
    const s = serializeShellCollapsedCookie(false, false);
    expect(s).toContain("ubm_shell_collapsed=false");
    expect(s).toContain("Path=/");
    expect(s).toContain("Max-Age=31536000");
    expect(s).toContain("SameSite=Lax");
  });

  it("default-path（jsdom http）で Secure を付与しない", () => {
    // jsdom の location.protocol === "http:" のため isSecureRuntimeContext() は false
    expect(serializeShellCollapsedCookie(true)).not.toContain("Secure");
  });

  it("production 付与時も既存属性が不変で Secure が末尾", () => {
    const s = serializeShellCollapsedCookie(true, true);
    expect(s).toContain("ubm_shell_collapsed=true");
    expect(s).toContain("SameSite=Lax");
    expect(s.endsWith("; Secure")).toBe(true);
  });

  it("HTTPS runtime では secure 引数省略時にも Secure 属性を付与する", () => {
    vi.stubGlobal("document", { location: { protocol: "https:" } });
    expect(serializeShellCollapsedCookie(true)).toContain("; Secure");
  });
});
```

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| 既存 test | `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` | 追記対象 |
| Phase 2 設計 | `phase-2-design.md` | serializer シグネチャ |
| vitest config | `vitest.config.ts`（リポジトリルート） | `--root=. --config=vitest.config.ts` が正経路（`apps/web/vitest.config.ts` は不在） |

## 統合テスト連携

統合テストは適用外（§Phase 2/3）。focused Vitest（serializer 文字列検証）が AC-1〜AC-6 の唯一の自動検証経路。実行コマンド: `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`。

## 成果物

- 本ファイル（`phase-4-test-plan.md`）に TC-1〜TC-6 と既存後方互換、TDD Red 期待を確定する。

## 完了条件

- TC-1〜TC-6 が AC-1〜AC-6 をトレースしている。
- TDD Red 期待（TC-1/TC-5 が実装前に fail）が明記されている。
- テスト実行コマンドが確定している。
