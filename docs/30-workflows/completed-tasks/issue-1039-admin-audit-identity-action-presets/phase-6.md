# Phase 6: テスト拡充

> **[実装区分: 実装仕様書]**。Phase 5 の GREEN 達成後に fail path・回帰ガード・補助ケースを追加し、仕様の網羅性と回帰耐性を高める。

---

## 1. 追加対象ファイルと追加ケース概要

| ファイルパス | 追加目的 |
|---|---|
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | producer ↔ preset 値一致 guard / 自由入力非制限 回帰 / pagination href 非退化 |
| `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | 任意 action の SSR 往復回帰 |

> 新規ファイルは作成しない。既存 spec ファイルへ追記する。

---

## 2. producer ↔ preset 値一致 guard（最重要回帰）

datalist option の値が API producer が実際に記録する action 文字列と一致していることを guard する。
producer 側（`apps/api/src/repository/identity-merge.ts:147` の `"identity.merge"` /
`apps/api/src/repository/identity-conflict.ts:250` の `"identity.dismiss"`）と datalist option が乖離すると、
プリセットを選んでも該当ログがヒットしなくなる退化を fail として検出する。

| ID | テスト名 | 検証内容 | 期待 |
|---|---|---|---|
| DATALIST-E-1 | preset option が producer action 文字列の正準セットと一致 | datalist option 値の配列と、本 spec 内に定義する期待定数 `EXPECTED_IDENTITY_ACTIONS = ["identity.merge", "identity.dismiss"]` を比較 | `Array.from(options).map(v) ).toEqual(EXPECTED_IDENTITY_ACTIONS)` |
| DATALIST-E-2 | option 値が大文字/別表記でない（producer リテラル厳密一致） | 各 option value が `/^identity\.(merge\|dismiss)$/` に一致 | 全 option が正規表現にマッチ |

> 実装メモ: API ソースを直接 import すると web→api 越境になるため、producer 文字列は本 spec 内に
> `EXPECTED_IDENTITY_ACTIONS` として明示リテラルで固定する。コメントで producer ファイル行
> （`identity-merge.ts:147` / `identity-conflict.ts:250`）を参照として残し、producer 変更時は本定数も同期する旨を記す。

```tsx
// AuditLogPanel.component.spec.tsx に追記
// producer: apps/api/src/repository/identity-merge.ts:147 ("identity.merge")
//           apps/api/src/repository/identity-conflict.ts:250 ("identity.dismiss")
// producer 側 action 文字列を変更したら本定数も同期すること（乖離時は DATALIST-E-1 が fail）。
const EXPECTED_IDENTITY_ACTIONS = ["identity.merge", "identity.dismiss"];

it("DATALIST-E-1: preset option が producer action 文字列と一致する", () => {
  render(<AuditLogPanel values={{ limit: "50" }} data={{ items: [], nextCursor: null }} />);
  const options = document.querySelectorAll("datalist#audit-action-presets > option");
  const values = Array.from(options).map((o) => (o as HTMLOptionElement).value);
  expect(values).toEqual(EXPECTED_IDENTITY_ACTIONS);
});

it("DATALIST-E-2: option 値が producer リテラルに厳密一致", () => {
  render(<AuditLogPanel values={{ limit: "50" }} data={{ items: [], nextCursor: null }} />);
  const options = document.querySelectorAll("datalist#audit-action-presets > option");
  for (const o of Array.from(options)) {
    expect((o as HTMLOptionElement).value).toMatch(/^identity\.(merge|dismiss)$/);
  }
});
```

---

## 3. 自由入力が datalist で制限されない回帰

datalist は「候補提示」のみで `<input>` の自由入力を制約しない（HTML 仕様）。任意 action を渡しても
defaultValue がそのまま保持されることを、preset 外の長い値で確認する。

| ID | テスト名 | 入力 | 期待 |
|---|---|---|---|
| DATALIST-E-3 | preset 外の任意 action `schema.alias.rollback_notification` が defaultValue 保持 | `values={{ action: "schema.alias.rollback_notification", limit: "50" }}` | `(getByLabelText("action") as HTMLInputElement).value === "schema.alias.rollback_notification"` |
| DATALIST-E-4 | preset 外でも input は単一 text・list 属性は維持（候補提示は残る） | 同上 | input が単一、`getAttribute("list") === "audit-action-presets"`（自由値でも候補提示は併存） |

```tsx
it("DATALIST-E-3: preset 外の任意 action が defaultValue 保持", () => {
  render(
    <AuditLogPanel
      values={{ action: "schema.alias.rollback_notification", limit: "50" }}
      data={{ items: [], nextCursor: null }}
    />,
  );
  expect((screen.getByLabelText("action") as HTMLInputElement).value).toBe(
    "schema.alias.rollback_notification",
  );
});
```

---

## 4. cursor pagination href が action を保持する非退化確認（`buildAuditHref` 無変更の証跡）

`buildAuditHref` を Phase 5 で変更していないことを、action を含む values から生成した href が
action を保持していることで証跡として固定する。nextCursor がある場合の next link も action を保持する。

| ID | テスト名 | 入力 | 期待 |
|---|---|---|---|
| HREF-E-1 | `buildAuditHref` が action query を保持 | `buildAuditHref({ action: "identity.dismiss", limit: "50" })` | 戻り値に `action=identity.dismiss` を含む |
| HREF-E-2 | cursor 付き href も action を保持 | `buildAuditHref({ action: "identity.merge", limit: "50" }, "CUR123")` | 戻り値に `action=identity.merge` と `cursor=CUR123` の両方を含む（AC-4） |
| HREF-E-3 | nextCursor あり panel render で「次へ」リンクが action filter を保持 | `<AuditLogPanel values={{ action: "identity.merge", limit: "50" }} data={{ items: [], nextCursor: "CUR123" }} />` | 「次へ」相当の link href（既存 pagination link）に `action=identity.merge` を含む |

```tsx
it("HREF-E-2: cursor 付き href が action を保持（buildAuditHref 無変更）", () => {
  const href = buildAuditHref({ action: "identity.merge", limit: "50" }, "CUR123");
  expect(href).toContain("action=identity.merge");
  expect(href).toContain("cursor=CUR123");
});
```

> HREF-E-3 の「次へ」リンク取得は既存 pagination テスト（L408 近傍の `getByRole("link", ...)` パターン）に
> 合わせて取得する。既存テストが別名でリンクを取得している場合はそれに準じる。

---

## 5. page 経由の任意 action SSR 往復回帰

| ID | テスト名 | 入力 | 期待 |
|---|---|---|---|
| PAGE-ACTION-E-1 | preset 外の任意 action が SSR で復元される | `await AdminAuditPage({ searchParams: Promise.resolve({ action: "member.delete" }) })` | `(getByLabelText("action") as HTMLInputElement).value === "member.delete"`（AC-3 任意値 × SSR） |

```ts
it("PAGE-ACTION-E-1: preset 外 action も SSR 復元される", async () => {
  render(await AdminAuditPage({ searchParams: Promise.resolve({ action: "member.delete" }) }));
  expect((screen.getByLabelText("action") as HTMLInputElement).value).toBe("member.delete");
});
```

---

## 6. 実行コマンド（Phase 6 全テスト）

```bash
# リポジトリルートから実行
mise exec -- pnpm exec vitest run \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/audit/page.page.spec.ts"

# 全 unit テスト（回帰確認）
mise exec -- pnpm exec vitest run
```

---

## 完了条件（Phase 6）

- [ ] DATALIST-E-1〜E-2 が GREEN（preset 値 ↔ producer action 文字列一致 guard）
- [ ] DATALIST-E-3〜E-4 が GREEN（preset 外の任意 action が datalist で制限されない）
- [ ] HREF-E-1〜E-3 が GREEN（cursor pagination href の action 保持＝`buildAuditHref` 無変更の証跡・AC-4）
- [ ] PAGE-ACTION-E-1 が GREEN（preset 外 action の SSR 往復）
- [ ] 既存 6+ テスト（filter primitives / mask / pagination / 404 hint）が非退化
- [ ] 全 unit テスト（`pnpm exec vitest run`）が PASS

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
Phase 5 の実装に対し、producer 値乖離・自由入力制限・pagination 退化の回帰耐性を上げる。

## 実行タスク
- producer action 文字列との一致 guard と自由入力非制限の回帰ケースを追加する。
- cursor pagination href の action 保持と任意 action の SSR 往復を追加検証する。

## 参照資料
- `phase-5.md`

## 成果物
- Phase 6 テスト拡充仕様

## 統合テスト連携
Phase 7 coverage の対象分岐は本 Phase の追加テストで網羅する。
