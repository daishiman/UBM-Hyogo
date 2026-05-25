# Phase 2: アーキテクチャ

[実装区分: 実装仕様書]

## メタ情報

| 項目     | 内容                                              |
| -------- | ------------------------------------------------- |
| タスクID | issue-883-adapter-dev-warn-unknown-kind           |
| 対象機能 | adapter callback 注入 + page.tsx 環境別 callback  |
| Issue    | #883                                              |

## レイヤ構成

```
apps/web/app/(public)/members/[id]/page.tsx        ← Server Component
        │ ─ options.onUnknownKind を環境別に組立て注入
        ▼
apps/web/src/lib/adapters/member-detail.ts         ← pure adapter（拡張対象）
        │ ─ normalizeField 内で options.onUnknownKind?.(field) を呼ぶ
        ▼
（adapter 出力は MemberDetail primitives へそのまま伝播・shape 不変）
```

## 採用方式: callback 注入（pure 性維持）

| 設計判断           | 内容                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 副作用の境界       | 副作用（`console.warn`）は呼出側（page.tsx）に置き、adapter は callback を受け取り呼ぶだけ                           |
| 環境分岐の場所     | page.tsx の `process.env.NODE_ENV === "development"` ガードのみ。adapter 内に環境分岐を書かない                       |
| 後方互換           | `options` は optional 第2引数。default は `{}`。`onUnknownKind` も optional でデフォルト未定義 → 既存呼出は無改修可  |
| 観測責務の範囲     | unknown kind のみ。visibility ミスマッチ等の他の skip 経路には callback を**当てない**（スコープ最小化）             |

## adapter 拡張仕様

```ts
type ToMemberDetailPropsOptions = {
  /**
   * FieldKindZ.safeParse が失敗した（= unknown kind）field を観測したいときに渡す。
   * adapter は pure 性を保つため、副作用は callback として外から注入する設計とする。
   * production では呼出側で undefined を渡し、bundle から DCE されることを期待する。
   */
  onUnknownKind?: (field: RawField) => void;
};

export function toMemberDetailProps(
  profile: PublicMemberProfile,
  options: ToMemberDetailPropsOptions = {},
): MemberDetailProps;
```

`normalizeField` 内挿入位置:

```ts
function normalizeField(field: RawField, onUnknownKind?: (f: RawField) => void): NormalizedField | null {
  if (field.visibility !== "public") return null;
  const parsed = FieldKindZ.safeParse(field.kind);
  if (!parsed.success) {
    onUnknownKind?.(field);   // ← 追加: callback がなければ no-op、silent skip 維持
    return null;
  }
  return { /* ... */ };
}
```

## page.tsx 注入仕様

```ts
const props = toMemberDetailProps(profile, {
  onUnknownKind:
    process.env.NODE_ENV === "development"
      ? (f) => console.warn("[member-detail] unknown kind", f.kind, f.stableKey)
      : undefined,
});
```

| 観点                 | 説明                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| DCE 信頼根拠         | `next build --webpack` 経路では `process.env.NODE_ENV` は静的置換され、`!== "production"` ブランチは dead code として除去される（CLAUDE.md 不変条件「production build は `next build --webpack` を正本とする」と整合） |
| Turbopack 注意       | Turbopack 経路は DCE 信頼度が落ちるため local dev 限定。production deploy には影響しない                          |
| Server Component 評価| `process.env.NODE_ENV` は build time に解決される。runtime 評価ではないため Cloudflare Workers ランタイムでも安定 |

## データフロー不変条件

- adapter は pure: 同一 `profile` 入力 → 同一 `MemberDetailProps` 出力（`options` の有無は出力に影響しない）。
- adapter は throw しない: callback も throw しない前提（page.tsx の callback は `console.warn` のみ・throw なし）。
- adapter は入力 mutate 禁止: spec「入力を mutate しない」が継続 green。

## 代替案と却下理由

| 案                                     | 内容                                                                                  | 却下理由                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| (A) adapter 内で `process.env.NODE_ENV` 分岐 | adapter 内に直接 `if (NODE_ENV === "development") console.warn(...)` を書く            | adapter の pure 性を破壊。test の case 爆発（環境変数 mock 必須）。Phase 9 で silent 統一を選んだ理由と整合しない |
| (B) logger DI（logger interface 注入） | `Logger` interface を定義し、page.tsx で実装を注入                                    | 1 観点（unknown kind）に対して interface は過剰設計。callback 1 つで足りる。YAGNI                                 |
| (C) 別 wrapper 関数（`toMemberDetailPropsDev`） | dev 専用 wrapper を作る                                                               | wrapper の二重定義で DRY 違反。呼出側が環境分岐するなら callback 注入 1 関数で十分                                |

採用案: callback 注入。pure 性 / 後方互換 / 最小差分 / DCE 互換性すべてを満たす。

## 関連 module 依存図

```
member-detail.ts          (adapter: シグネチャ拡張)
   ├─ imported by → page.tsx  (callback 注入)
   └─ tested by   → __tests__/member-detail.spec.ts  (case 9 追加)
```

3 ファイル閉路。他の primitive / route / API への波及なし。

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

