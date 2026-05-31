# Phase 6: テスト拡充（fail-path / 回帰 guard） — AdminFetchError typed class

**[実装区分: 実装仕様書]**

> EMB-005-FB により小規模 NON_VISUAL では Phase 6 は軽量。Phase 4 の TC-AFE-01〜11 / TC-SF-STATUS を基盤に、
> fail-path（異常系）と回帰 guard を最小限追加する。

## 1. 追加 fail-path TC（`admin-fetch-error.spec.ts` へ追記）

| TC | 観点 | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-AFE-12 | `res.text()` reject 相当（rawBody=null）の message / snippet | `AdminFetchError({ path, status: 502 })`（responseBody 省略 = null 経路と同値） | `message="admin api /admin/x failed: 502"`（suffix なし） / `responseBodySnippet=null` |
| TC-SF-INT | `statusFromError` の status 非整数防御（`Number.isInteger`） | `status` フィールドが非整数（`3.14` / `NaN`）の Error を reject | 構造化 status は採用されず正規表現 fallback へ。message に数値が無ければ `ADMIN_FETCH_FAILED` |

```ts
// admin-fetch-error.spec.ts に追記
it("TC-AFE-12: responseBody 未指定（res.text reject 相当）は suffix なし・snippet=null", () => {
  const e = new AdminFetchError({ path: "/admin/x", status: 502 });
  expect(e.message).toBe("admin api /admin/x failed: 502");
  expect(e.responseBodySnippet).toBeNull();
});
```

```ts
// safe-fetch.spec.ts に追記
it("TC-SF-INT: 非整数 status フィールドは採用せず正規表現 fallback へ落ちる", async () => {
  // status=3.14（非整数）。message にも数値なし → status 抽出不能
  const err = Object.assign(new Error("opaque"), { status: 3.14, name: "AdminFetchError" });
  const r = await safeServerFetch(() => Promise.reject(err), { codePrefix: "ADMIN_FETCH" });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.code).toBe("ADMIN_FETCH_FAILED");
});

it("TC-SF-INT2: NaN status フィールドも採用しない", async () => {
  const err = Object.assign(new Error("opaque"), { status: Number.NaN, name: "AdminFetchError" });
  const r = await safeServerFetch(() => Promise.reject(err), { codePrefix: "ADMIN_FETCH" });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.code).toBe("ADMIN_FETCH_FAILED");
});
```

> `Number.isInteger(NaN) === false`・`Number.isInteger(3.14) === false` のため、いずれも構造化 status を不採用とし
> 正規表現 fallback（message に status 数値が無ければ `_FAILED`）へ落ちることを検証する。

## 2. 回帰 guard（既存スペックをそのまま活用）

| 既存スペック | assertion | 本サイクルでの扱い |
| --- | --- | --- |
| `server-fetch.binding.spec.ts:89` | body 短文の message が `... failed: 404 body=error code: 1042` 等で byte-identical | **回帰テストとして既存スペックをそのまま活用**（追記・改変しない）。実装後に green のままであることが byte-identical 維持の証拠 |
| `server-fetch.binding.spec.ts:101` | body 256+ 文字で `body=${text.slice(0,256)}` に切られる message | 同上。既存 assertion を回帰 guard として再利用 |
| `safe-server-fetch.spec.ts` | `ADMIN_FETCH_404` / 401 等の code 解決 | 同上。`AdminFetchError` 経由でも status 一致で同一 code を返すため不変であることを green で確認 |
| `safe-server-fetch-404-vs-401.spec.ts` | 404/401 の切り分け | 同上 |
| `server-fetch.env.spec.ts` | env / base 解決 | 同上（error path 改修と無関係に不変） |

> **方針**: message byte-identical の回帰検証は新規 assertion を足さず、既存 `binding.spec.ts:89/101` を一切変更せずに残し、
> 実装後 green であることをもって担保する。新規スペックは class フィールド / guard / status 抽出という「新規挙動」のみを対象とする。

## 3. fallback 経路の非退行 TC（正規表現 fallback の維持確認）

`safe-fetch.ts` の `STATUS_FROM_MESSAGE` 正規表現 fallback が、`AdminFetchError` 非適用ケース
（構造化 `status` を持たない message-only な mock Error）でも従来通り動くことを確認する。

```ts
// safe-fetch.spec.ts に追記
it("TC-SF-FALLBACK: status フィールドを持たない message-only Error は正規表現で status を抽出する", async () => {
  // 構造化 status なし。message からのみ 404 を読む（従来経路）
  const err = new Error("admin api /admin/x failed: 404");
  const r = await safeServerFetch(() => Promise.reject(err), { codePrefix: "ADMIN_FETCH" });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.code).toBe("ADMIN_FETCH_404");
});
```

> これにより「構造化 status 優先（TC-SF-STATUS）」と「正規表現 fallback 維持（TC-SF-FALLBACK）」の両系統が
> 同一サイクルで保証され、後方互換性が回帰テストとして固定される。

## 4. 実行コマンド（fail-path + 回帰を一括）

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts \
  apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts \
  apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts
```

## 完了条件（Phase 6）

- [x] fail-path TC（TC-AFE-12 rawBody=null / TC-SF-INT・INT2 非整数 status 防御）を追加
- [x] 既存 `binding.spec.ts:89/101` を byte-identical 回帰 guard として「そのまま活用」する方針を明記
- [x] 正規表現 fallback の非退行 TC（TC-SF-FALLBACK）を追加
- [x] 一括実行コマンドを提示
