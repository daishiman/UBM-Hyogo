# Phase 4: コントラクト

[実装区分: 実装仕様書]

## メタ情報

| 項目     | 内容                                                         |
| -------- | ------------------------------------------------------------ |
| タスクID | issue-883-adapter-dev-warn-unknown-kind                      |
| 対象機能 | adapter API 拡張契約 / page.tsx 注入契約 / Vitest mock 契約  |
| Issue    | #883                                                         |

## 型定義

```ts
// apps/web/src/lib/adapters/member-detail.ts (追加 export)
import type { z } from "zod";
import {
  FieldKindZ,
  type PublicMemberProfileZ,
} from "@ubm-hyogo/shared";

export type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;
type RawSection = PublicMemberProfile["publicSections"][number];
export type RawField = RawSection["fields"][number];           // ← 追加 export（spec / page.tsx の callback 型参照用）
export type FieldKind = z.infer<typeof FieldKindZ>;

/**
 * toMemberDetailProps 第2引数。後方互換のため optional。
 * 副作用注入は呼出側責務（adapter は pure を維持）。
 */
export interface ToMemberDetailPropsOptions {
  /**
   * FieldKindZ.safeParse が失敗した（unknown kind）field を観測したい場合に渡す。
   * 渡さない / undefined のときは silent skip（既存挙動を完全維持）。
   * callback は throw しない前提（throw した場合の振る舞いは未定義・page.tsx 側で throw しない実装に限定）。
   */
  onUnknownKind?: (field: RawField) => void;
}
```

## 関数シグネチャ

| 関数                         | シグネチャ                                                                                                         | 純粋性                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `toMemberDetailProps` (拡張) | `(profile: PublicMemberProfile, options?: ToMemberDetailPropsOptions) => MemberDetailProps`                        | pure（callback 経由の副作用は呼出側）  |
| `normalizeField` (内部・拡張) | `(field: RawField, onUnknownKind?: (f: RawField) => void) => NormalizedField \| null`                             | pure (callback を呼ぶだけ・自身は no-throw) |
| `normalizeSection` (内部・拡張) | `(section: RawSection, onUnknownKind?: (f: RawField) => void) => NormalizedSection \| null`                       | pure                                   |

> 既存シグネチャ `toMemberDetailProps(profile)` も型上 valid（第2引数は optional + default `{}`）。

## adapter 動作契約

| 入力                                   | 出力                                       | 副作用                                                    |
| -------------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| `(profile)` のみ                       | `MemberDetailProps`（既存と完全一致）      | なし                                                      |
| `(profile, {})`                        | `MemberDetailProps`（既存と完全一致）      | なし                                                      |
| `(profile, { onUnknownKind })` + unknown kind 1 件以上 | `MemberDetailProps`（unknown 該当 field は除外） | unknown kind に該当する field 数だけ `onUnknownKind(field)` が呼ばれる |
| `(profile, { onUnknownKind })` + unknown kind 0 件 | `MemberDetailProps`（既存と完全一致）      | callback は **0 回** 呼ばれる                             |

### callback 呼出順序契約

- `normalizeField` 内で `FieldKindZ.safeParse` が失敗したブランチに限定。
- `visibility !== "public"` で skip される field では callback を呼ばない（callback は kind 観測専用・visibility 観測の責務を持たせない）。
- 呼出順序は `profile.publicSections` の DFS 順を保つ（section index 昇順 → field index 昇順）。

## page.tsx 呼出契約

```ts
// apps/web/app/(public)/members/[id]/page.tsx
const props = toMemberDetailProps(profile, {
  onUnknownKind:
    process.env.NODE_ENV === "development"
      ? (f) => console.warn("[member-detail] unknown kind", f.kind, f.stableKey)
      : undefined,
});
```

| 観点                  | 契約                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| 環境判定              | `process.env.NODE_ENV === "development"` のみ。`test` では callback を有効化せず console noise を出さない       |
| production 時の値     | `onUnknownKind: undefined`（明示的に `undefined` を渡す。プロパティ自体省略でも等価だが DCE 信頼性のため明示） |
| callback の no-throw  | `console.warn` のみ呼ぶ。throw / async / await を含めない                                                        |
| 出力プロパティ        | `kind` / `stableKey` の 2 つのみログ出力（PII を含む `value` は出さない）                                       |

## Vitest mock 契約

```ts
import { vi } from "vitest";

const onUnknownKind = vi.fn();
const tampered = structuredClone(samplePublicMemberProfile);
(tampered.publicSections[0].fields[0].kind as unknown as string) = "unknown_kind_xyz";

toMemberDetailProps(tampered, { onUnknownKind });

expect(onUnknownKind).toHaveBeenCalledTimes(1);
expect(onUnknownKind).toHaveBeenCalledWith(
  expect.objectContaining({
    kind: "unknown_kind_xyz" as unknown,
    stableKey: tampered.publicSections[0].fields[0].stableKey,
  }),
);
```

| 検証項目                                       | 期待                                  |
| ---------------------------------------------- | ------------------------------------- |
| callback 注入時 + unknown kind 1 件            | `toHaveBeenCalledTimes(1)`            |
| callback 引数の `kind`                         | tampered 値（`"unknown_kind_xyz"`）   |
| callback 引数の `stableKey`                    | tampered 対象 field の stableKey      |
| callback 未注入時（既存 silent skip ケース）   | callback 呼び出しなし（既存 8 ケース pass で担保） |

## 後方互換契約

- 既存呼出 `toMemberDetailProps(profile)` は型・実行ともに無変更で動作する。
- 既存 8 ケースは spec 改修なしで pass（既存ケースは callback を渡さないため挙動 100% 一致）。
- public API surface 追加: `ToMemberDetailPropsOptions` 型 / `RawField` 型 の 2 つを named export。削除・rename なし。

## 共通骨格補足

## 目的

本 Phase の仕様観点を固定し、issue-883 の実装・検証・文書同期が後続 Phase と矛盾しない状態にする。

## 実行タスク

- 本文に記載した対象ファイル、契約、検証、証跡を確認する。
- 漏れが見つかった場合は同一サイクル内で修正する。

## 参照資料

- `artifacts.json`
- `outputs/phase-11/`
- `outputs/phase-12/`

## 実行手順

1. 既存本文の仕様・実績を確認する。
2. 実コード、証跡、正本仕様との対応を照合する。
3. 差分があれば同一サイクル内で反映する。

## 統合テスト連携

NON_VISUAL だが実装タスクのため、adapter spec / web tests / typecheck / lint / build / DCE grep を Phase 11 evidence に接続する。

## 多角的チェック観点（AIが判断）

- 矛盾なし
- 漏れなし
- 整合性あり
- 依存関係整合

## サブタスク管理

本タスクは S1-S5 を同一 workflow 内で完了する。未タスク化は検出なし。

## 成果物

- 本 Phase ファイル
- 関連する実コード / evidence / Phase 12 outputs

## 完了条件

- [x] 本 Phase の記述が実装・証跡・正本仕様と一致している。
- [x] coverage AC は adapter spec / web test / typecheck / lint / build evidence で代替確認する。

## タスク100%実行確認【必須】

- [x] この Phase に必要な確認を実施済み。

## 次Phase

次 Phase へ進む前に、本 Phase の差分と evidence を確認する。
