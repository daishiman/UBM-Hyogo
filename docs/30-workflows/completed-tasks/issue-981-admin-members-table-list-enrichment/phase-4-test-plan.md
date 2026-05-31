# Phase 4: テスト計画（TDD RED）

> workflow: `issue-981-admin-members-table-list-enrichment`

## 1. 方針

- 既存 `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` に **TC-MT-06 以降を追加**する（TDD RED）。
- 既存 `TC-MT-01〜05` + `a11y violations 0` は**維持**（回帰 guard）。削除・改変しない。
- 本変更で操作する値（occupation / ubmZone / ubmMembershipType / tags）は **すべて external props（`items` 経由）**であり、internal state ではない（[VSCPKR-03]）。テストは props 注入のみで RED→GREEN を回せる。`useState` を追加するテストは書かない。
- テストファイルは `*.spec.tsx` のみ（`*.test.*` 禁止）。
- chip の検証は `Chip` の DOM 契約（`<span data-tone={tone} data-dot className="ui-chip">`、dot 時は `data-testid="chip-dot"`）に依拠する。

## 2. `mkMember` ファクトリ拡張方針

既存 `mkMember(id, name)` は enrichment フィールドを返していない。enrichment を**オプション引数で注入可能**にする（既存呼び出し互換のため第3引数を optional な `Partial` 上書きにする）。

```tsx
const mkMember = (
  id: string,
  name: string,
  extra: Partial<Member> = {},
): Member => ({
  memberId: asMemberId(id),
  responseEmail: asResponseEmail(`${id}@example.com`),
  fullName: name,
  publicConsent: "consented",
  rulesConsent: "consented",
  publishState: "public",
  isDeleted: false,
  lastSubmittedAt: "2026-05-01T00:00:00.000Z",
  ...extra,
});
```

- 既存 `TC-MT-01〜05` は第3引数なしで呼び続けるため非破壊（enrichment フィールドは undefined のまま）。
- enrichment 検証ケースは `mkMember("a", "山田", { occupation: "会社員", ubmZone: "0_to_1", ubmMembershipType: "member", tags: [...] })` の形で注入する。

## 3. 追加テストケース一覧（TC-MT-06〜13）

### TC-MT-06: occupation 描画

| 項目 | 内容 |
| --- | --- |
| 入力 | `mkMember("a", "山田", { occupation: "会社員" })` 1 件 |
| 操作 | render のみ |
| 期待値 | `screen.getByText("会社員")` が存在する（氏名 button 下の small text）。`screen.getByRole("button", { name: "山田" })` も並存。 |

### TC-MT-07: occupation 非存在時に描画しない

| 項目 | 内容 |
| --- | --- |
| 入力 | `mkMember("a", "山田")`（occupation 未指定 = undefined）1 件 |
| 操作 | render のみ |
| 期待値 | occupation 用 small text が描画されない。氏名 button 下に余計な text node が出ないこと。`screen.queryByText("会社員")` 等が `null`（汎用には「氏名以外の text を increase させない」確認。具体的には occupation を持つ別 fixture と比較せず、`queryByText` で当該文字列の不在を assert）。 |

### TC-MT-08: zone chip 描画（text + data-tone）

| 項目 | 内容 |
| --- | --- |
| 入力 | `mkMember("a", "山田", { ubmZone: "0_to_1" })` 1 件 |
| 操作 | render のみ |
| 期待値 | `screen.getByText("0_to_1")` が存在する。その chip 要素が `[data-tone="cool"]`（`zoneTone("0_to_1") === "cool"`）かつ `[data-dot="true"]`。`container.querySelector('.ui-chip[data-tone="cool"][data-dot="true"]')` で取得し `textContent` に `0_to_1` を含む、で検証。 |

### TC-MT-09: type chip 描画

| 項目 | 内容 |
| --- | --- |
| 入力 | `mkMember("a", "山田", { ubmMembershipType: "member" })` 1 件 |
| 操作 | render のみ |
| 期待値 | `screen.getByText("member")` が存在する。chip 要素が `[data-tone="green"]`（`statusTone("member") === "green"`）。dot は付かない（`data-dot` 属性なし）。 |

### TC-MT-10: tag pill 2 件以内描画

| 項目 | 内容 |
| --- | --- |
| 入力 | `mkMember("a", "山田", { tags: [{ code: "t1", label: "営業" }, { code: "t2", label: "技術" }] })` 1 件 |
| 操作 | render のみ |
| 期待値 | `screen.getByText("営業")` / `screen.getByText("技術")` が存在する。`+N` chip は描画されない（`screen.queryByText(/^\+\d+$/)` が `null`）。 |

### TC-MT-11: tags 3 件以上で `+N` chip

| 項目 | 内容 |
| --- | --- |
| 入力 | `mkMember("a", "山田", { tags: [{code:"t1",label:"営業"},{code:"t2",label:"技術"},{code:"t3",label:"広報"}] })` 1 件 |
| 操作 | render のみ |
| 期待値 | 先頭 2 件 `screen.getByText("営業")` / `screen.getByText("技術")` が存在。3 件目 label「広報」は **描画されない**（`screen.queryByText("広報")` が `null`）。`screen.getByText("+1")` が存在する（`m.tags.length - 2 === 1`）。 |

### TC-MT-12: tags 空で「未タグ」warn chip

| 項目 | 内容 |
| --- | --- |
| 入力 | `mkMember("a", "山田", { tags: [] })` と、別途 `mkMember("b", "鈴木")`（tags undefined）の 2 ケース（個別 it 内で render 切替 or 1 it 内で 2 行） |
| 操作 | render のみ |
| 期待値 | 各行で `screen.getAllByText("未タグ")` が存在。その chip が `[data-tone="warning"][data-dot="true"]`（`container.querySelector('.ui-chip[data-tone="warning"][data-dot="true"]')` の `textContent` に `未タグ` を含む）。placeholder「—」が消えていること（`screen.queryByText("—")` が `null`）。 |

### TC-MT-13: a11y violations 0（enrichment 行）

| 項目 | 内容 |
| --- | --- |
| 入力 | occupation / ubmZone / ubmMembershipType / tags（3 件）をすべて持つ `mkMember("a", "山田", {...full})` 1 件 |
| 操作 | `await axe(container)` |
| 期待値 | `results.violations` の length が 0。既存 a11y test（enrichment なし行）も維持し、enrichment 込み行でも違反 0 を保証する。 |

## 4. targeted 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx
```

- 全件 `pnpm test` は重いため避ける（[FB-UI-02-2]）。
- RED 段階では TC-MT-06〜13 が fail し、TC-MT-01〜05 + 既存 a11y は PASS のままであることを確認する。

## 完了条件

- [ ] `mkMember` の enrichment 拡張方針（第3引数 `Partial<Member>` 上書き）が固定された
- [ ] TC-MT-06〜13 の入力 / 操作 / 期待値（query 方法）が列挙された
- [ ] 既存 TC-MT-01〜05 + a11y を維持する旨が明記された
- [ ] 操作対象が external props であり internal state ではないことが明記された（[VSCPKR-03]）
- [ ] targeted 実行コマンドが記載された
