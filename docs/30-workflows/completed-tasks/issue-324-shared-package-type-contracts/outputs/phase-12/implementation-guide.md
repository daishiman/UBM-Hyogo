# Implementation Guide: issue-324-shared-package-type-contracts

## Part 1: 中学生レベル

会員 ID、回答 ID、メールアドレスは、見た目はぜんぶ文字です。だから、人がうっかり別の箱に入れても、何も確認しない仕組みだと通ってしまいます。

これは、学校の下駄箱で「1 年 A 組の鍵」と「体育館の鍵」がどちらも金属だから同じものとして扱われるようなものです。鍵穴の形を先に決めておけば、違う鍵は差した瞬間に止まります。

今回の作業では、`packages/shared` に「この鍵はこの鍵穴だけ」という検査表を追加しました。会員 ID とメールアドレスを取り違えたら、プログラムを動かす前に赤くなります。

### 用語の言い換え

| 用語 | 日常語での言い換え |
| --- | --- |
| 型 | 入れ物の形 |
| brand 型 | 名前付きの専用鍵 |
| schema | データの設計図 |
| compile-time | 動かす前の確認時間 |
| `@ts-expect-error` | ここは間違いとして止まるべき、という目印 |

## Part 2: 技術者レベル

### 型定義

- `Brand<T, B>` / `MemberId` / `ResponseId` / `ResponseEmail` / `AdminId`: `packages/shared/src/branded/index.ts`
- view-model schema: `MemberProfileZ`, `PublicMemberListViewZ`, `PublicMemberProfileZ`, `AdminMemberListViewZ`, `AdminMemberDetailViewZ`, `AdminDashboardViewZ`
- admin body schema: `adminRequestResolveBodySchema`, `AdminRequestResolveBody`

### API / assertion

```ts
expectTypeOf<ResponseEmail>().not.toMatchTypeOf<ResponseId>();
expectTypeOf<z.input<typeof MemberProfileZ>>().toEqualTypeOf<
  z.output<typeof MemberProfileZ>
>();
// @ts-expect-error: memberId is required on MemberProfile.
const viewModel: z.infer<typeof MemberProfileZ> = { ... };
```

### 使用例

実装は `packages/shared/src/__tests__/type-contracts.spec.ts`。`@ubm-hyogo/shared` public barrel から import し、5 describe / 15 it で AC-1..AC-5 と公開 export 面を固定する。

### エラー処理

`@ts-expect-error` が不要になった場合、`tsc --noEmit` が `Unused @ts-expect-error directive` で失敗する。これにより、必須 field 欠落や型混入の検出力が失われた場合に CI で検知できる。

### 設定値

| 項目 | 方針 |
| --- | --- |
| test filename | `*.spec.ts` |
| runner | 既存 vitest |
| type gate | 既存 `tsc --noEmit` |
| 追加 dependency | なし |
| 不採用 | `tsd`, vitest typecheck mode |

### スクリーンショット境界

このタスクは `visualEvidence=NON_VISUAL` で、UI / route / CSS / runtime 画面を変更していない。Phase 11 の証跡は `shared-typecheck.txt`、`shared-lint.txt`、`shared-test.txt` の 3 ファイルで足りるため、スクリーンショットは不要。
