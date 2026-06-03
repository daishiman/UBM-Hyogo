# Phase 4: テスト作成（TDD Red）

> **[実装区分: 実装仕様書]**。Phase 5 実装前に全テストを RED 状態で作成し、期待ふるまいを仕様として固定する。

---

## 事前チェック

Phase 4 着手前に以下を確認すること。

```bash
# 1. 依存解決（pnpm workspace 全体）
mise exec -- pnpm install --force

# 2. typecheck が事前に PASS していることを確認
mise exec -- pnpm typecheck
```

---

## 1. 追加・追記する spec ファイル一覧

| ファイルパス | 実行 config | 区分 | 対応テスト |
|---|---|---|---|
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | `vitest.config.ts`（jsdom unit） | 既存に追記 | datalist 存在・list 属性・自由入力非退化・任意値 defaultValue |
| `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | `vitest.config.ts`（jsdom unit） | 既存に追記 | SSR searchParams → action defaultValue 復元 |

> 命名規約: invariant #8 に従い `*.spec.{ts,tsx}` のみ。`*.test.*` は禁止。
> いずれも新規ファイル作成はせず、既存 spec ファイルへ `it(...)` ケースを追記する。

---

## 2. 命名規則整合の事前確認（Phase 1-3 正本）

Phase 3 ゲートで確定した設計定数とテストの文字列リテラルが一致していることを RED 前に確認する。

| 設計定数 | 値（Phase 1-3 正本） | テスト側で固定するリテラル |
|---|---|---|
| datalist 要素 id | `audit-action-presets` | `#audit-action-presets` / `list="audit-action-presets"` |
| option 値 1 | `identity.merge` | producer `apps/api/src/repository/identity-merge.ts:147` と一致 |
| option 値 2 | `identity.dismiss` | producer `apps/api/src/repository/identity-conflict.ts:250` と一致 |
| 入力フィールド name | `action`（不変） | URL query key 契約と一致 |
| placeholder | `attendance.add`（不変・identity 以外を維持） | 過剰提示回避（Phase 3 §3 バランスループ） |

> datalist id とテストの `getByText` / `querySelector` セレクタが食い違うと GREEN にできないため、本表を Phase 4 完了時の整合チェック対象とする。

---

## 3. private method テスト方針

本タスクは純 UI（native datalist の付与）であり、ロジック分岐・private method を追加しない。
したがって **private method テストは本タスク非該当**。検証は DOM 構造（datalist / option / list 属性）と
defaultValue 復元（SSR 契約）に限定する。`buildAuditHref` のロジックは無変更のため既存テストの非退化確認のみで足りる。

---

## 4. component test 追加ケース（`AuditLogPanel.component.spec.tsx`）

### 目的
action フィルタへの datalist 付与（AC-1）、自由入力の維持（AC-3）、任意値 defaultValue 復元（AC-3）を
RED テストとして固定する。`getByLabelText("action")` は datalist に label 紐付けが無いため引き続き
単一の text input を返す（複数マッチしない）ことを保証する。

### テストケース

| ID | テスト名 | 入力 / 操作 | 期待結果 | 対応 AC |
|---|---|---|---|---|
| DATALIST-1 | datalist `#audit-action-presets` が DOM に存在する | `<AuditLogPanel values={{ limit: "50" }} data={{ items: [], nextCursor: null }} />` を render | `document.querySelector("datalist#audit-action-presets")` が non-null | AC-1 |
| DATALIST-2 | datalist の option に `identity.merge` を含む | 同上 | `#audit-action-presets` 配下に `option[value="identity.merge"]` が存在 | AC-1 |
| DATALIST-3 | datalist の option に `identity.dismiss` を含む | 同上 | `#audit-action-presets` 配下に `option[value="identity.dismiss"]` が存在 | AC-1 |
| DATALIST-4 | option は 2 値のみ（過剰提示回避） | 同上 | `#audit-action-presets > option` の length が `2` | AC-1 |
| DATALIST-5 | action `<Input>` に `list="audit-action-presets"` 属性が付く | 同上、`getByLabelText("action")` を取得 | 取得した input の `getAttribute("list") === "audit-action-presets"` | AC-1 |
| DATALIST-6 | 自由入力（text input）が維持される | 同上、`getByLabelText("action")` を取得 | 取得要素が `HTMLInputElement`、`type` が `text`（または未指定＝text 既定）、`name === "action"`、placeholder が `attendance.add` | AC-3 |
| DATALIST-7 | `getByLabelText("action")` が依然 1 個の input を返す（複数マッチ非退化） | 同上 | `getByLabelText("action")` が throw せず単一要素を返す。`screen.queryAllByLabelText("action").length === 1` | AC-3 |
| DATALIST-8 | 任意 action 値の defaultValue 復元 | `values={{ action: "member.delete", limit: "50" }}` で render | `(getByLabelText("action") as HTMLInputElement).value === "member.delete"`（datalist に無い任意値も保持） | AC-3 |

### 実装方針（追記ケース骨格）

```tsx
// 既存 AuditLogPanel.component.spec.tsx の describe("AuditLogPanel", () => { ... }) 内に追記

it("DATALIST-1: datalist #audit-action-presets が存在する", () => {
  render(<AuditLogPanel values={{ limit: "50" }} data={{ items: [], nextCursor: null }} />);
  expect(document.querySelector("datalist#audit-action-presets")).not.toBeNull();
});

it("DATALIST-2/3/4: option が identity.merge / identity.dismiss の 2 値", () => {
  render(<AuditLogPanel values={{ limit: "50" }} data={{ items: [], nextCursor: null }} />);
  const options = document.querySelectorAll("datalist#audit-action-presets > option");
  const values = Array.from(options).map((o) => (o as HTMLOptionElement).value);
  expect(values).toEqual(["identity.merge", "identity.dismiss"]);
});

it("DATALIST-5: action Input に list 属性が付く", () => {
  render(<AuditLogPanel values={{ limit: "50" }} data={{ items: [], nextCursor: null }} />);
  const input = screen.getByLabelText("action") as HTMLInputElement;
  expect(input.getAttribute("list")).toBe("audit-action-presets");
});

it("DATALIST-7: getByLabelText('action') は単一 input のまま", () => {
  render(<AuditLogPanel values={{ limit: "50" }} data={{ items: [], nextCursor: null }} />);
  expect(screen.queryAllByLabelText("action")).toHaveLength(1);
});

it("DATALIST-8: 任意値 member.delete が defaultValue 復元される", () => {
  render(<AuditLogPanel values={{ action: "member.delete", limit: "50" }} data={{ items: [], nextCursor: null }} />);
  expect((screen.getByLabelText("action") as HTMLInputElement).value).toBe("member.delete");
});
```

### RED 時に fail する理由

- DATALIST-1〜4: 現状の `AuditLogPanel.tsx:181-183` には `<datalist>` が存在しないため `querySelector` が `null` を返し fail。
- DATALIST-5: 現状の action `<Input>` に `list` 属性が無いため `getAttribute("list")` が `null` で fail。
- DATALIST-6/7/8: 現状でも text input は存在するため**最初は通る可能性がある**が、DATALIST-5/list 属性付与の差分と同居して回帰 guard として機能する（実装後に list 属性付与しても単一マッチ・自由入力が崩れないことを保証）。

---

## 5. page test 追加ケース（`page.page.spec.ts`）

### 目的
SSR の `searchParams` から `action` クエリが `AuditLogPanel` の action Input `defaultValue` に復元される（AC-2）ことを
`AdminAuditPage` の async render で確認する。`safeServerFetch` は既存どおり `vi.mock` 済み。

### テストケース

| ID | テスト名 | 入力 | 期待結果 | 対応 AC |
|---|---|---|---|---|
| PAGE-ACTION-1 | `action=identity.dismiss` が action Input に復元される | `await AdminAuditPage({ searchParams: Promise.resolve({ action: "identity.dismiss" }) })` を render | `(screen.getByLabelText("action") as HTMLInputElement).value === "identity.dismiss"` | AC-2 |
| PAGE-ACTION-2 | `action=identity.merge` でも復元される（preset 値の往復） | `searchParams: Promise.resolve({ action: "identity.merge" })` | action Input の value が `identity.merge` | AC-2 |
| PAGE-ACTION-3 | datalist が page 経由 render でも存在する | `searchParams: Promise.resolve({})` | `document.querySelector("datalist#audit-action-presets")` が non-null | AC-1 / AC-2 |

### 実装方針（追記ケース骨格）

```ts
// 既存 page.page.spec.ts の describe 内に追記

it("PAGE-ACTION-1: action=identity.dismiss が SSR で復元される", async () => {
  render(await AdminAuditPage({ searchParams: Promise.resolve({ action: "identity.dismiss" }) }));
  expect((screen.getByLabelText("action") as HTMLInputElement).value).toBe("identity.dismiss");
});

it("PAGE-ACTION-3: page 経由でも datalist が存在する", async () => {
  render(await AdminAuditPage({ searchParams: Promise.resolve({}) }));
  expect(document.querySelector("datalist#audit-action-presets")).not.toBeNull();
});
```

### RED 時に fail する理由

- PAGE-ACTION-1/2: `defaultValue` 復元自体は既存配線（`values.action`）で成立するが、datalist 付与の差分と同居させ、
  list 属性付与により URL query 復元契約（AC-2）が退化しないことの回帰 guard とする。
- PAGE-ACTION-3: 現状 datalist が無いため `querySelector` が `null` で fail。

---

## 6. RED 実行コマンド

```bash
# リポジトリルートから実行
mise exec -- pnpm exec vitest run \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/audit/page.page.spec.ts"
# → DATALIST-1〜5 / PAGE-ACTION-3 が fail（datalist / list 属性 未実装）することを確認
```

---

## 7. 命名規約・整合確認チェックリスト

- [ ] 追記した全ケースが `*.spec.{ts,tsx}`（`*.test.*` 不使用）— invariant #8
- [ ] datalist id を `audit-action-presets` のリテラルで固定している（Phase 1-3 正本と一致）
- [ ] option 値 `identity.merge` / `identity.dismiss` を producer 側文字列と同一リテラルで固定している
- [ ] `getByLabelText("action")` が単一マッチであるテスト（DATALIST-7）を含む（M-1 指摘対応）
- [ ] page test が `AdminAuditPage({ searchParams: Promise.resolve({...}) })` の既存パターンに従っている

---

## 完了条件（Phase 4）

- [ ] component spec に DATALIST-1〜8 が追記されている
- [ ] page spec に PAGE-ACTION-1〜3 が追記されている
- [ ] DATALIST-1〜5 / PAGE-ACTION-3 が RED（datalist / list 属性 未実装で fail）であることを確認した
- [ ] 既存 6+ テスト（filter form primitives / mask / pagination 等）が引き続き PASS している
- [ ] `pnpm typecheck` が事前 PASS している

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
実装前に RED テストとして datalist 付与・自由入力維持・SSR 復元の期待動作を固定する。

## 実行タスク
- component spec に datalist / list 属性 / 自由入力非退化ケースを追記する。
- page spec に SSR searchParams → action defaultValue 復元ケースを追記する。

## 参照資料
- `phase-2.md`
- `phase-3.md`

## 成果物
- Phase 4 TDD Red 仕様

## 統合テスト連携
Phase 5 実装は本 Phase の RED テストを GREEN にすることを完了条件にする。
