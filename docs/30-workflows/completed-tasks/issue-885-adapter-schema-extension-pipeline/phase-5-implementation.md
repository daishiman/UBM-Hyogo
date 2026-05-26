# Phase 5: 実装手順

## 1. 作業順序

1. ブランチ作成（`feat/issue-885-adapter-schema-extension-pipeline` 推奨。base = `dev`）
2. `apps/web/src/lib/adapters/README.md` 新規作成（後述テンプレ）
3. `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` 末尾に EXTENSION TEMPLATE コメントブロック追記
4. `docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md` を削除
5. 現 workflow 配下を除外した `rg` で stale 参照を洗い出し、本仕様 index に向け直す
6. `pnpm typecheck` / `pnpm lint` / spec 実行 / `bash scripts/verify-pr-ready.sh` を順次実行
7. 失敗時は最大 3 回まで自動修復（最も多いのは markdown lint・stale 参照漏れ）

## 2. `apps/web/src/lib/adapters/README.md` テンプレ

> 以下を一字一句そのままコピペするのではなく、Phase 2 設計と合わせて確定する。マイクロ修正は実装者判断で可。

```markdown
# adapters/

API shape を primitive props に正規化するための pure function 層。
visibility filter / unknown kind silent skip / 入力 mutate 禁止 の 3 つを不変条件として持つ。

## 現在の adapter

| Adapter | 入力 | 出力 | spec |
| --- | --- | --- | --- |
| `member-detail.ts` (`toMemberDetailProps`) | `PublicMemberProfile` (zod 推論) | `MemberDetailProps` | `__tests__/member-detail.spec.ts` |

## schema 拡張時の 5 ステップ checklist

`PublicMemberProfileZ` を拡張する場合、次の順で触る。順序を変えると spec ケース 1 の fixture self-validation が即落ちるので注意。

1. **zod 拡張** — `packages/shared/src/zod/viewmodel.ts` の `PublicMemberProfileZ` を `.extend()` / `discriminatedUnion` で拡張
2. **fixture 追加** — `apps/web/src/fixtures/public-member-profile.ts` に新 field / 新 kind を含む sample を追加（fixture は spec ケース 1 で `PublicMemberProfileZ.parse` される）
3. **spec 追加（red）** — `__tests__/member-detail.spec.ts` 末尾の `EXTENSION TEMPLATE` をコピペし `describe` 内末尾に追加
4. **adapter 拡張（green）** — `member-detail.ts` の `normalizeField` / sanitize を最小差分で拡張。`visibility !== "public"` 除外と出力からの `visibility` / `source` 除外を維持
5. **primitive 拡張（別 PR）** — `MemberDetail` primitive の描画変更が必要なら **別 PR** で分割し、adapter と primitive の breaking change を時系列で分離

## 責務 mapping 表（既存 8 ケース）

| # | spec ケース | fixture | zod | adapter | primitive |
| --- | --- | --- | --- | --- | --- |
| 1 | fixture が schema 整合 | sample 自体 | `PublicMemberProfileZ.parse` | — | — |
| 2 | 既存 8 ケース統括 | sample | — | `toMemberDetailProps` 全体 | props 変換 |
| 3 | `visibility=member` 除外 | `responseEmail` | — | `normalizeField` visibility filter | — |
| 4 | `consent` section 丸ごと除外 | consent section | — | `normalizeSection` 空 section drop | — |
| 5 | unknown kind silent skip | kind 書換 | `FieldKindZ.safeParse` | `normalizeField` kind safeParse | — |
| 6 | 入力 mutate 禁止 | snapshot diff | — | pure function | — |
| 7 | `publicSections: []` → `sections: []` | publicSections 空 | — | early return | — |
| 8 | 出力 field に visibility / source 無し | — | — | literal 除外 | `toLegacySections` で literal 復元 |

## 落とし穴

### sanitize literal 復元（DoD-13）

adapter は出力 field から `visibility` / `source` を除外する。一方 `MemberDetail` primitive は strict zod `Section`（`visibility` / `source` 必須）を要求する。橋渡しは `MemberDetail` 内の `toLegacySections` で literal 復元（`visibility: "public" / source: "forms"`）して行う。新 field 追加時にこの literal 復元を忘れると strict zod parse で fail する。

### fixture self-validation

spec ケース 1 で fixture 自体を `PublicMemberProfileZ.parse` している。fixture に新 field を足したら schema 側も同期しないとケース 1 が即落ちる。初見では「なぜケース 1 が落ちるか」分かりにくいが、これは安全網として意図的に置いている。

## 参考

- 親 spec: `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/`
- Phase 12 implementation-guide: `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/implementation-guide.md`
- 本 README の元 issue: [#885](https://github.com/daishiman/UBM-Hyogo/issues/885)
```

## 3. EXTENSION TEMPLATE 追記（spec ファイル末尾）

`apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` の最終 `});` の **後ろ** に次を追記する:

```typescript

// === EXTENSION TEMPLATE ===
// schema を拡張して新しい field kind / field を追加した場合、
// 以下をコピペして describe("toMemberDetailProps", ...) 内の末尾に挿入する。
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
// 拡張時の注意:
// - 先に packages/shared/src/zod/viewmodel.ts の PublicMemberProfileZ を拡張する
//   （ケース 1 で fixture self-validation が走るため）
// - 出力 field には visibility / source が含まれない不変条件を維持する
// - primitive 描画変更が必要なら別 PR で分割する
// 詳細手順: apps/web/src/lib/adapters/README.md
// === END EXTENSION TEMPLATE ===
```

## 4. unassigned-task one-pager 削除

```bash
rm docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md
```

削除後、参照箇所がないか:

```bash
rg -n "serial-06-followup-004-adapter-schema-extension-pipeline" docs/ .claude/ apps/ packages/ \
  --glob '!docs/30-workflows/completed-tasks/issue-885-adapter-schema-extension-pipeline/**'
```

参照が残っていれば本仕様 index.md (`docs/30-workflows/completed-tasks/issue-885-adapter-schema-extension-pipeline/index.md`) に向け直す。

## 5. DoD（Definition of Done）

- [x] `apps/web/src/lib/adapters/README.md` が新規作成され、5 ステップ checklist / 責務 mapping 表 / 落とし穴 2 トピックを含む
- [x] `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` 末尾に `// === EXTENSION TEMPLATE ===` ブロック追加
- [x] `docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md` 削除
- [x] stale 参照 0 件（grep 確認）
- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm --filter @ubm-hyogo/web test -- member-detail.spec.ts` 既存 8 ケース PASS
- [x] `bash scripts/verify-pr-ready.sh` PASS
