# Phase 6: テスト拡充（fail path / 回帰 guard）

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL**

## 1. 目的

Phase 4/5 の正常系 5 ケースに、`resolveAuthView` の境界正規化（trim / 真偽値の厳格比較）を pin する
fail-path / 回帰 guard ケースを追加する。これにより `auth.ts` の正規化と `resolveAuthView` の判定が
将来ズレた場合の検出力を高める。**追加先は同一 spec ファイル**（`authViewSessionContract.integration.spec.ts`）。

## 2. 追加テストケース

| TC | 入力 | 期待 produced / 判定根拠 | 期待 AuthView |
| --- | --- | --- | --- |
| TC-AVSC-06 | token `{ memberId: "  " }`（空白のみ） | `resolveAuthView` は `memberId?.trim()` で空文字化 → falsy | `{ kind:"guest" }` |
| TC-AVSC-07 | token `{ memberId:"m_1", isAdmin: null }` | `auth.ts` の `isAdmin: t.isAdmin === true` で `false` 正規化 → admin 条件不成立 | `{ kind:"member", profileHref:"/profile" }` |
| TC-AVSC-08 | token `{ memberId:"m_1" }`（isAdmin 欠落=undefined） | 同上で `false` 正規化 | `{ kind:"member", profileHref:"/profile" }` |
| TC-AVSC-09 | token `{ memberId:"m_1", isAdmin: "true" }`（string） | `=== true` 厳格比較で `false` 扱い（string は不一致） | `{ kind:"member", profileHref:"/profile" }` |

> 補足: TC-AVSC-06 は「`auth.ts` callback が `memberId` をそのまま透過 → `resolveAuthView` の trim で guest」を確認する。
> auth.ts の session callback は `memberId: (t.memberId as string) ?? ""` のため、空白文字列はそのまま透過し
> `resolveAuthView` 側 trim で falsy 化される点を pin する。

## 3. 追加 it() 雛形

```ts
  // TC-AVSC-06: whitespace-only memberId → guest（resolveAuthView の trim）
  it("TC-AVSC-06: whitespace-only memberId resolves to guest", async () => {
    const user = await produceSessionUser({ memberId: "  " });
    const view = resolveAuthView({ user } as SessionLike);
    expect(view).toEqual({ kind: "guest" });
  });

  // TC-AVSC-07: isAdmin null → member（=== true 厳格比較で false 正規化）
  it("TC-AVSC-07: isAdmin null normalizes to member", async () => {
    const user = await produceSessionUser({ memberId: "m_1", isAdmin: null });
    expect(user?.isAdmin).toBe(false);
    const view = resolveAuthView({ user } as SessionLike);
    expect(view).toEqual({ kind: "member", profileHref: "/profile" });
  });

  // TC-AVSC-08: isAdmin undefined（欠落）→ member
  it("TC-AVSC-08: missing isAdmin normalizes to member", async () => {
    const user = await produceSessionUser({ memberId: "m_1" });
    expect(user?.isAdmin).toBe(false);
    const view = resolveAuthView({ user } as SessionLike);
    expect(view).toEqual({ kind: "member", profileHref: "/profile" });
  });

  // TC-AVSC-09: isAdmin "true"(string) → member（=== true で false 扱い）
  it("TC-AVSC-09: string isAdmin is not treated as admin", async () => {
    const user = await produceSessionUser({ memberId: "m_1", isAdmin: "true" });
    expect(user?.isAdmin).toBe(false);
    const view = resolveAuthView({ user } as SessionLike);
    expect(view).toEqual({ kind: "member", profileHref: "/profile" });
  });
```

## 4. 回帰確認手順（既存テストを壊さない）

1. 追加ケースを同一 spec ファイル末尾の `describe` ブロック内に挿入する（新規ファイルは作らない）。
2. focused vitest（Phase 5 §5 のコマンド）を再実行し、既存の `isAdmin` 欠落ケースを含む計 8 ケースが全 pass することを確認する。
3. 既存 `getAuthView.spec.ts`（mock-only）/ `resolveAuthView.spec.ts`（pure 9 ケース）/ `auth.spec.ts`（callbacks.session 直接テスト）が
   引き続き全 pass であることを同一コマンドで確認する。
4. typecheck / lint を再実行し 0 を維持する。
5. `git status --porcelain apps/` で spec 1 ファイル以外の差分がないことを確認する。

## 5. 注意点

| 注意点 | 内容 |
| --- | --- |
| 正規化の所有権 | `isAdmin` の `=== true` 厳格化は `auth.ts` callback の責務。`resolveAuthView` は `=== true` を再判定するが、本 spec は **callback 出力時点で既に boolean 化されている**ことを `expect(user?.isAdmin).toBe(false)` で先に pin する。 |
| trim の所有権 | `memberId` の trim は `resolveAuthView` の責務（auth.ts は透過）。TC-AVSC-06 はその境界を pin する。 |
| 過剰ケース回避 | OAuth runtime / D1 等へ拡張しない（Phase 3 リスク表の out of scope を維持）。 |

## 完了条件（Phase 6）

- [x] fail-path / 回帰 guard ケース（空白 `memberId`、`isAdmin` null / undefined / string）を設計した
- [x] 空白 memberId → guest / `isAdmin` null・undefined・string → member の境界を pin した
- [x] 追加 it() 雛形を提示し、実 spec に反映した
- [x] 既存 spec（getAuthView / resolveAuthView / auth）を壊さない回帰確認手順を記載した
