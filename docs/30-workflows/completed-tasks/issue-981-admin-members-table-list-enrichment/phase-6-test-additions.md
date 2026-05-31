# Phase 6: テスト拡充（fail path / 境界 / 回帰 guard）

> workflow: `issue-981-admin-members-table-list-enrichment`

## 1. 方針

Phase 4 の TC-MT-06〜13（基本描画 happy path）に対し、本 Phase では **境界値・部分欠損・並存・回帰 guard** を TC-MT-14 以降で追加する。すべて external props（`items` 経由）注入で検証し、internal state は触れない。`mkMember(id, name, extra)` の第3引数で enrichment を注入する（Phase 4 で拡張済）。

## 2. 追加テストケース一覧（TC-MT-14〜19）

### TC-MT-14: zone のみ存在 / membershipType 欠如（部分欠損）

| 項目 | 内容 |
| --- | --- |
| 入力 | `mkMember("a", "山田", { ubmZone: "1_to_10" })`（`ubmMembershipType` undefined） |
| 操作 | render のみ |
| 期待値 | zone chip `screen.getByText("1_to_10")` が存在し `[data-tone="warm"]`（`zoneTone("1_to_10") === "warm"`）。type chip は描画されない（`container.querySelector('.ui-chip[data-tone="green"]')` 等が無い、または membership 文字列が `queryByText` で `null`）。既存 `MemberStateChipRow` は常時描画される。 |

### TC-MT-15: membershipType のみ存在 / zone 欠如（逆方向の部分欠損）

| 項目 | 内容 |
| --- | --- |
| 入力 | `mkMember("a", "山田", { ubmMembershipType: "academy" })`（`ubmZone` undefined / null） |
| 操作 | render のみ |
| 期待値 | type chip `screen.getByText("academy")` が `[data-tone="cool"]`（`statusTone("academy") === "cool"`）。dot 付き zone chip（`[data-dot="true"]`）が「区画 / ステータス」列に存在しないこと。 |

### TC-MT-16: tags ちょうど 2 件（`+N` 出ない境界）

| 項目 | 内容 |
| --- | --- |
| 入力 | `mkMember("a", "山田", { tags: [{code:"t1",label:"営業"},{code:"t2",label:"技術"}] })` |
| 操作 | render のみ |
| 期待値 | `screen.getByText("営業")` / `screen.getByText("技術")` 存在。`screen.queryByText(/^\+\d+$/)` が `null`（`+0` 等を出さない＝`length > 2` 判定の下限境界）。 |

### TC-MT-17: tags ちょうど 3 件（`+1` 出る境界）

| 項目 | 内容 |
| --- | --- |
| 入力 | `mkMember("a", "山田", { tags: [{code:"t1",label:"営業"},{code:"t2",label:"技術"},{code:"t3",label:"広報"}] })` |
| 操作 | render のみ |
| 期待値 | 先頭 2 件のみ label 描画（`screen.getByText("営業")` / `screen.getByText("技術")`）、3 件目「広報」は `screen.queryByText("広報")` が `null`。`screen.getByText("+1")` 存在。 |

### TC-MT-18: occupation 空文字 vs undefined（falsy 境界）

| 項目 | 内容 |
| --- | --- |
| 入力 | (a) `mkMember("a", "山田", { occupation: "" })` / (b) `mkMember("b", "鈴木")`（undefined） |
| 操作 | render のみ |
| 期待値 | いずれも occupation small text を**描画しない**（`m.occupation ?` の truthy 判定で空文字も省略される）。空 `<span>` を残さないこと（`container` 内に占有列の空 text node が生じない確認。具体的には氏名以外の muted small text が当該行に出ない）。 |

### TC-MT-19: publishState 各値 × zone chip 共存（回帰 guard）

| 項目 | 内容 |
| --- | --- |
| 入力 | 3 行: `mkMember("a", "山田", { publishState: "public", ubmZone: "0_to_1" })` / `mkMember("b", "鈴木", { publishState: "member_only", ubmZone: "10_to_100" })` / `mkMember("c", "佐藤", { publishState: "hidden", ubmZone: "1_to_10" })` |
| 操作 | render のみ |
| 期待値 | 各行の `MemberStateChipRow`（`data-testid="member-state-chip-row"`）が引き続き描画され、publishState 3 値（public / member_only / hidden）の区別が失われていない（Phase 2 Option A の info parity 維持）。同時に各行 zone chip（`0_to_1`→cool / `10_to_100`→amber / `1_to_10`→warm）が並存描画される。`document.querySelectorAll('[data-testid="member-state-chip-row"]').length === 3`。 |

## 3. a11y 再評価（enrichment 込み行）

### TC-MT-20: a11y violations 0（全 enrichment + 部分欠損混在）

| 項目 | 内容 |
| --- | --- |
| 入力 | 複数行: full enrichment 行（occupation/zone/type/tags 3 件）+ 未タグ行（tags []）+ zone のみ行 を混在させた `items` |
| 操作 | `await axe(container)` |
| 期待値 | `results.violations` の length が 0。enrichment 描画追加（chip / small text）が a11y 違反（コントラスト・role・名前不足等）を導入していないことを保証する。既存 `a11y violations 0`（enrichment なし）も維持。 |

## 4. targeted run の対象ファイル（[FB-UI-02-2]）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx
```

- 全件 `pnpm test` は実行しない。追加ケースは上記 1 ファイルに集約する。
- TC-MT-01〜20 が全 GREEN であることを最終確認とする。

## 完了条件

- [ ] zone/type の部分欠損ケース（TC-MT-14 / 15）が追加された
- [ ] tags 2 件（`+N` なし）/ 3 件（`+1` あり）の境界ケース（TC-MT-16 / 17）が追加された
- [ ] occupation 空文字 vs undefined の falsy 境界（TC-MT-18）が追加された
- [ ] publishState 各値 × zone chip 共存の回帰 guard（TC-MT-19）が追加された
- [ ] enrichment 込み行の a11y 再評価（TC-MT-20）が追加された
- [ ] targeted run の対象ファイルが明記された（[FB-UI-02-2]）
