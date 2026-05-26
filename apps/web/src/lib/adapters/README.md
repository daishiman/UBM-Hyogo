# adapters/

API shape を UI primitive props に正規化する pure function 層。
adapter は D1 / API / browser I/O を持たず、同じ入力には同じ出力を返す。

## 現在の adapter

| Adapter | 入力 | 出力 | Spec |
| --- | --- | --- | --- |
| `member-detail.ts` (`toMemberDetailProps`) | `PublicMemberProfile` (`PublicMemberProfileZ` inferred type) | `MemberDetailProps` | `__tests__/member-detail.spec.ts` |

## 不変条件

- `visibility !== "public"` の field は除外する。公開判定の正本は API 側だが、adapter 側でも二重防御する。
- `FieldKindZ.safeParse` に失敗する unknown kind は silent skip し、production console を汚さない。
- 入力 object は mutate しない。
- 出力 field から `visibility` / `source` を除外する。

## Schema 拡張時の 5 ステップ checklist

`PublicMemberProfileZ` を拡張する場合は次の順で触る。順序を変えると spec ケース 1 の fixture self-validation が先に落ち、原因の切り分けが難しくなる。

1. **zod 拡張**: `packages/shared/src/zod/viewmodel.ts` の `PublicMemberProfileZ` と必要な shared 型を拡張する。
2. **fixture 追加**: `apps/web/src/fixtures/public-member-profile.ts` に新 field / 新 kind を含む sample を追加する。fixture は spec ケース 1 で `PublicMemberProfileZ.parse` される。
3. **spec 追加 (red)**: `__tests__/member-detail.spec.ts` 末尾の `EXTENSION TEMPLATE` を `describe("toMemberDetailProps", ...)` 内へコピーし、期待値を先に固定する。
4. **adapter 拡張 (green)**: `member-detail.ts` の `normalizeField` / sanitize を最小差分で拡張する。visibility filter、unknown kind silent skip、`visibility` / `source` 除外は維持する。
5. **primitive 拡張 (別 PR)**: `MemberDetail` primitive の描画変更が必要な場合は adapter PR と分ける。props 互換性と visual regression の責務を混ぜない。

## 責務 mapping 表

| # | Spec ケース | Fixture | Zod | Adapter | Primitive |
| --- | --- | --- | --- | --- | --- |
| 1 | fixture は `PublicMemberProfileZ.parse` を通過する | sample 全体 | `PublicMemberProfileZ.parse` | - | - |
| 2 | happy path: summary / attendance / tags を伝播する | top-level fields | - | `toMemberDetailProps` 全体 | props 受け取り |
| 3 | `visibility=member` field を除外する | `responseEmail` | - | `normalizeField` visibility filter | - |
| 4 | `visibility=admin` のみの section を除外する | `consent` section | - | `normalizeSection` empty section drop | - |
| 5 | unknown kind を silent skip する | tampered kind | `FieldKindZ.safeParse` | `normalizeField` kind guard | - |
| 6 | 入力を mutate しない | snapshot diff | - | pure function | - |
| 7 | `publicSections: []` を `sections: []` にする | empty sections | - | map/filter result | empty render |
| 8 | 出力 field に `visibility` / `source` が無い | - | - | sanitize literal 除外 | `toLegacySections` で literal 復元 |

## 落とし穴

### sanitize literal 復元

adapter は出力 field から `visibility` / `source` を除外する。一方で既存 `MemberDetail` primitive は strict zod `Section` と整合させるため、primitive 側の `toLegacySections` で `visibility: "public"` / `source: "forms"` を literal 復元している。新 field を追加して primitive 描画まで触る場合、この橋渡しを壊さない。

### fixture self-validation

spec ケース 1 は fixture 自体を `PublicMemberProfileZ.parse` する。fixture に新 field を足したのに zod を同期していない場合、adapter 本体に入る前に落ちる。これは drift 検知の安全網なので、落ちたら先に schema と fixture の対応を確認する。

## 参考

- 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/`
- 親 Phase 12 guide: `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/implementation-guide.md`
- 本 workflow: `docs/30-workflows/issue-885-adapter-schema-extension-pipeline/`
- 元 issue: `Refs #885`
