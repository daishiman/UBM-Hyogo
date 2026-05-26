# Phase 2: 設計

## 1. 5 ステップ拡張パイプラインの確定順序

schema 拡張時の標準手順を、依存関係（破壊範囲が広い順）に基づき次のように確定する。

1. **`packages/shared/src/zod/viewmodel.ts`** で `PublicMemberProfileZ` を `.extend()` または `discriminatedUnion` で拡張する
2. **`apps/web/src/fixtures/public-member-profile.ts`**（または対応 fixture）に新 field / 新 kind を含む sample を追加する（spec ケース 1 の `PublicMemberProfileZ.parse(samplePublicMemberProfile)` で fixture self-validation が走る）
3. **`apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`** の `EXTENSION TEMPLATE` コメントブロックをコピペし、新 field / 新 kind 用のケースを 1 件追加する（先に test を書く＝red phase）
4. **`apps/web/src/lib/adapters/member-detail.ts`** の `normalizeField` / sanitize 箇所を最小差分で拡張（green phase）。新 field を出力に含めるが `visibility` / `source` を除外する不変条件を維持する
5. **`MemberDetail` primitive**（`apps/web/src/components/...` 配下）で新 field の描画が必要な場合は、**別 PR** として primitive 拡張を分割する。adapter PR と primitive PR を分けることで、type / props 境界の breaking change を最小化する

## 2. README 構成

`apps/web/src/lib/adapters/README.md` を以下構成で新規作成する:

```
# adapters/

## 概要
（adapter 全体の責務 = API shape → primitive props の橋渡し。visibility / unknown kind の二重防御。pure function。）

## 現在の adapter
- member-detail.ts: PublicMemberProfile → MemberDetailProps

## schema 拡張時の 5 ステップ checklist
1. zod schema 拡張（packages/shared/src/zod/viewmodel.ts）
2. fixture 拡張（apps/web/src/fixtures/public-member-profile.ts）
3. spec に EXTENSION TEMPLATE をコピペして 1 ケース追加（red）
4. member-detail.ts の normalizeField / sanitize を最小拡張（green）
5. primitive 描画変更が必要なら別 PR として分割

## 責務 mapping 表
| ケース | fixture | zod | adapter | primitive | spec |
| --- | --- | --- | --- | --- | --- |
| ...（8 ケース） | ... | ... | ... | ... | ... |

## 落とし穴
### sanitize literal 復元
（MemberDetail primitive 側は strict zod Section（visibility / source 必須）。toLegacySections で literal 復元している前提。新 field 追加時にこの literal 復元を忘れると strict zod parse で fail。）

### fixture self-validation
（spec ケース 1 で PublicMemberProfileZ.parse(samplePublicMemberProfile) を実行している。fixture に新 field を足したら schema 側も同期しないとケース 1 が即落ちる。）

## 参考
- 親 spec: docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/
- Phase 12 implementation-guide: docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/implementation-guide.md
- 本 README の元 issue: #885
```

## 3. spec EXTENSION TEMPLATE 設計

spec ファイル末尾（`describe(...)` ブロックの **外**）に、以下のコメントブロックを追加する。実コードとしては評価されず、コピペで `it(...)` を増やせる雛形として機能する。

```typescript
// === EXTENSION TEMPLATE ===
// schema を拡張して新しい field kind を追加した場合、以下をコピペして
// describe("toMemberDetailProps", ...) 内の末尾に挿入する。
//
//   it("<新 kind> を正しく normalize する", () => {
//     const tampered = structuredClone(samplePublicMemberProfile);
//     // tampered.publicSections[<idx>].fields.push({
//     //   stableKey: "<key>",
//     //   label: "<label>",
//     //   kind: "<new_kind>",
//     //   value: "<value>",
//     //   visibility: "public",
//     //   source: "forms",
//     // });
//     const result = toMemberDetailProps(tampered);
//     const target = result.sections
//       .flatMap((s) => s.fields)
//       .find((f) => f.stableKey === "<key>");
//     expect(target).toBeDefined();
//     expect(target?.kind).toBe("<new_kind>");
//   });
//
// 注意:
// - fixture に新 field を足したら packages/shared/src/zod/viewmodel.ts の
//   PublicMemberProfileZ も同期する（ケース 1 で fixture self-validation あり）
// - 出力 field には visibility / source が含まれない不変条件を維持する
// === END EXTENSION TEMPLATE ===
```

## 4. 責務 mapping 表（既存 8 ケース）

README に貼り込む表の確定形:

| # | spec ケース | fixture | zod | adapter | primitive |
|---|---|---|---|---|---|
| 1 | fixture が schema 整合 | sample 自体 | `PublicMemberProfileZ.parse` | — | — |
| 2 | 既存 8 ケース内訳 | sample | — | `toMemberDetailProps` 全体 | props 変換 |
| 3 | `visibility=member` 除外 | `responseEmail` field | — | `normalizeField`（visibility filter） | — |
| 4 | `consent` section が `visibility=admin` のみ → section 丸ごと除外 | consent section | — | `normalizeSection`（fields.length===0 で除外） | — |
| 5 | unknown kind silent skip | `kind` を `unknown_kind_xyz` に書き換え | `FieldKindZ.safeParse` | `normalizeField` の kind safeParse | — |
| 6 | 入力 mutate 禁止 | snapshot diff | — | pure function 不変条件 | — |
| 7 | `publicSections: []` → `sections: []` | publicSections 空 | — | `toMemberDetailProps` 早期 return | — |
| 8 | 出力 field に `visibility` / `source` キー無し | — | — | `normalizeField` の literal 除外 | `toLegacySections` で literal 復元（橋渡し） |

> 番号 1-8 は spec の `it(...)` 出現順と一致させる。Phase 5 で README 作成時に最終確認する。

## 5. 削除対象（昇格に伴う重複排除）

- `docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md`: 本仕様書ディレクトリに昇格したため削除。grep で参照元を確認し、参照があれば本ディレクトリ index.md に向け直す。
