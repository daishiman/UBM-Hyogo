# safeServerFetch / SafeResult helper を member / public 層 server component へ横展開 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| タスクID     | admin-ui-prototype-alignment-followup-001-safe-server-fetch-horizontal-expansion                           |
| タスク名     | safeServerFetch / SafeResult helper を member / public 層 server component へ横展開                        |
| 分類         | 改善                                                                                                       |
| 対象機能     | `apps/web/app/(member)/profile/page.tsx` および `apps/web/app/(public)/members/page.tsx` 等の server fetch |
| 優先度       | 中                                                                                                         |
| 見積もり規模 | 小規模                                                                                                     |
| ステータス   | 未実施                                                                                                     |
| 発見元       | admin-ui-prototype-alignment Phase 10 final-review                                                         |
| 発見日       | 2026-05-23                                                                                                 |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- deferred 宣言: `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-10/final-review.md` line 22「admin 以外 (member / public) への横展開を後続 task で検討可」
- 現状実装: `apps/web/src/lib/admin/safe-server-fetch.ts` および `apps/web/src/lib/result.ts` の `SafeResult<T>` は admin 層のみで使用中
- 既存 primitive / helper 群（admin 層で先行整備済み）:
  - `apps/web/src/lib/admin/safe-server-fetch.ts`
  - `apps/web/src/lib/result.ts`（`SafeResult<T>` 型）
  - `apps/web/src/components/admin/AdminSectionError.tsx`（仮称・per-section error UI）
  - `apps/web/app/(admin)/admin/page.tsx`（per-section degrade 適用済み）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

admin-ui-prototype-alignment では admin dashboard を複数の section（members / tags / meetings / requests / audit 等）が並列に並ぶ構造へ整理した。1 endpoint 失敗時に page 全体が throw して error.tsx 直行する設計は UX を毀損するため、`apps/web/src/lib/admin/safe-server-fetch.ts` と `apps/web/src/lib/result.ts` の `SafeResult<T>` を導入し、section ごとに degrade（成功 section は通常描画、失敗 section だけ error UI 表示）を実現した。

一方、member / public 層は依然 server component 内で `fetchPublic` / `fetchMember` 系の直接呼び出しが page 全体を throw させる構造で、admin 層と非対称な fragility が残っている。

### 1.2 問題点・課題

- `apps/web/app/(member)/profile/page.tsx` で `fetchMember` が 1 endpoint でも throw すると profile 画面全体が error boundary 行きになる
- `apps/web/app/(public)/members/page.tsx` / `apps/web/app/(public)/members/[id]/page.tsx` も同様で、tag fetch 失敗で member 一覧自体が見られなくなる可能性がある
- admin 層と member / public 層で fetch エラー伝播モデルが非対称になり、観測 / 保守コストが増える
- per-section degrade を後から個別 page に手書きすると、SafeResult discriminated union の narrowing パターンが page ごとに分岐し、回帰しやすい

### 1.3 放置した場合の影響

- 1 endpoint の transient エラーで member / public 画面が全停止し、CLAUDE.md UI prototype alignment 不変条件 #1「既存 API endpoint surface のみ利用」前提下での可用性が下がる
- admin layer の知見（SafeResult / per-section error UI）が水平展開されず、後続タスクでの degrade 実装が page ごとに揺れる
- error boundary 到達経路がレイヤごとにバラバラになり、observability の grep 経路が分岐する

---

## 2. 何を達成するか（What）

### 2.1 目的

admin 層で確立した `safeServerFetch` / `SafeResult<T>` / per-section error UI のパターンを member / public 層 server component に横展開し、1 endpoint 失敗時の per-section degrade を全 server fetch 経路で統一する。

### 2.2 最終ゴール

- member / public 層で利用可能な `safeServerFetch` 共通 helper が `apps/web/src/lib/public/safe-server-fetch.ts` または `apps/web/src/lib/server-fetch/safe-fetch.ts` として整備される（共通化方向は §3.1 で 2 案併記）
- `apps/web/app/(member)/profile/page.tsx` および `apps/web/app/(public)/members/page.tsx` / `[id]/page.tsx` が `SafeResult<T>` を介して per-section degrade を行う
- `apps/web/src/components/{public,member}/SectionError.tsx` が新規追加され、既存 `AdminSectionError` と props shape が統一される
- 既存 API endpoint surface / D1 binding を一切変更しない
- 既存 spec が pass し、横展開対象 page に対応する `.spec.tsx` が追加される

### 2.3 スコープ

#### 含むもの

- `safeServerFetch` 共通化（admin 専用から共通 lib への抽出 or 並列の public/member 用 helper 追加）
- `SafeResult<T>` 型の export 経路整備（barrel export）
- `SectionError` 系 UI コンポーネントの public / member 用バリアント追加
- `(member)/profile/page.tsx` / `(public)/members/page.tsx` / `(public)/members/[id]/page.tsx` の置換
- 対応 `.spec.tsx` の新規追加 or 既存修正

#### 含まないもの

- 新規 API endpoint 追加・既存 endpoint shape 変更（CLAUDE.md UI prototype alignment 不変条件 #1）
- D1 schema / binding の変更（CLAUDE.md #5）
- 新規 primitive / 新規 visual 仕様の導入（不変条件3「プロトタイプ正本順位」）
- error boundary（`apps/web/app/error.tsx`）自体の責務変更

### 2.4 成果物

- `apps/web/src/lib/public/safe-server-fetch.ts` または `apps/web/src/lib/server-fetch/safe-fetch.ts`（共通化方向は §3.1 で 2 案併記）
- `apps/web/src/components/public/SectionError.tsx`
- `apps/web/src/components/member/SectionError.tsx`
- `apps/web/app/(member)/profile/page.tsx` の差分
- `apps/web/app/(public)/members/page.tsx` の差分
- `apps/web/app/(public)/members/[id]/page.tsx` の差分
- 対応 spec ファイル群（`.spec.tsx`）

---

## 3. どのように実装するか（How）

### 3.1 設計方針 — 共通化方向の 2 案併記

実装着手時に下記いずれかを採用する。default は **案 B**（admin 専用 helper を共通 lib に昇格）。

#### 案 A: 並列 helper 追加

- `apps/web/src/lib/admin/safe-server-fetch.ts` は触らない
- `apps/web/src/lib/public/safe-server-fetch.ts` を新規追加し、public / member 層から使用
- メリット: admin 層への影響 0
- デメリット: 同一ロジックが 2 か所に存在し drift 余地が残る

#### 案 B: 共通 lib への昇格（推奨）

- `apps/web/src/lib/server-fetch/safe-fetch.ts` を新設し、admin / public / member 共通で参照
- `apps/web/src/lib/admin/safe-server-fetch.ts` は薄い re-export として残す（既存 import path 互換）
- `apps/web/src/lib/result.ts` の `SafeResult<T>` は据え置き（既に layer 中立）
- メリット: SSOT 化、drift 防止
- デメリット: admin 層既存 import path の re-export 維持コスト

### 3.2 SafeResult<T> 型（既存・据え置き）

```ts
export type SafeResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: SafeFetchError };
```

discriminated union の narrowing は `if (result.ok)` で行う。throw を握り潰すと Next.js の error boundary がバイパスされる懸念があるため、**error.tsx 到達は section ではなく page-fatal レベルでのみ発生**させる方針を維持する（§4.2 参照）。

### 3.3 SectionError props shape 統一

```ts
type SectionErrorProps = {
  readonly title?: string;          // 既定: 「読み込みに失敗しました」
  readonly detail?: string;         // SafeFetchError.message
  readonly retryHref?: string;      // 再試行リンク（任意）
};
```

`AdminSectionError` と同じ props shape を `PublicSectionError` / `MemberSectionError` でも採用し、barrel export で `import { SectionError } from "@/components/public"` のように layer 別に取り出す。

### 3.4 変更ファイル一覧

| ファイル                                                | 種別     | 内容                                          |
| ------------------------------------------------------- | -------- | --------------------------------------------- |
| `apps/web/src/lib/server-fetch/safe-fetch.ts`           | 新規追加 | 共通 helper（案 B 採用時）                    |
| `apps/web/src/lib/admin/safe-server-fetch.ts`           | 既存変更 | 共通 lib への re-export 化（案 B 採用時）     |
| `apps/web/src/components/public/SectionError.tsx`       | 新規追加 | public 層 per-section error UI                |
| `apps/web/src/components/member/SectionError.tsx`       | 新規追加 | member 層 per-section error UI                |
| `apps/web/app/(member)/profile/page.tsx`                | 既存変更 | `safeServerFetch` + `SectionError` へ置換     |
| `apps/web/app/(public)/members/page.tsx`                | 既存変更 | `safeServerFetch` + `SectionError` へ置換     |
| `apps/web/app/(public)/members/[id]/page.tsx`           | 既存変更 | `safeServerFetch` + `SectionError` へ置換     |
| 対応 `.spec.tsx`                                        | 追加     | per-section degrade 契約検証                  |

### 3.5 置換イメージ

before（`(public)/members/page.tsx`）:

```tsx
const members = await fetchPublic("/members");
const tags = await fetchPublic("/tags");
return <MembersList members={members} tags={tags} />;
```

after:

```tsx
const membersResult = await safeServerFetch(() => fetchPublic("/members"));
const tagsResult = await safeServerFetch(() => fetchPublic("/tags"));

return (
  <>
    {membersResult.ok
      ? <MembersList members={membersResult.data} />
      : <SectionError detail={membersResult.error.message} />}
    {tagsResult.ok
      ? <TagFilter tags={tagsResult.data} />
      : <SectionError detail={tagsResult.error.message} />}
  </>
);
```

---

## 4. 苦戦箇所・将来の留意点（重要）

admin 層で実装中に observed した点を、後続が即解決できるよう詳細に残す。

### 4.1 SafeResult<T> の discriminated union 設計判断

- `{ ok: true; data } | { ok: false; error }` が narrowing 上最も素直で、`Either<L,R>` 風 `left/right` よりも TypeScript の control flow analysis と相性が良い
- `ok` を boolean リテラルで discriminate することで `if (result.ok)` だけで `data` / `error` のどちらが付くか自動絞り込みされる
- `data: T | undefined` のような optional 表現にすると narrowing が効かず、呼び出し側で `!` を多用することになるため避ける
- `readonly` を 2 prop 双方に付与し、結果オブジェクトの mutation を型レベルで禁じる

### 4.2 throw 握り潰しと Next.js error boundary バイパス問題

- `safeServerFetch` 内で `try/catch` し `{ ok: false, error }` を返す設計は、**section レベル degrade では正解**
- ただし「auth 失敗」「session 切れ」など page-fatal なエラーまで握り潰すと `apps/web/app/error.tsx` への到達経路が消える
- 解決方針: `safeServerFetch` には **page-fatal error の re-throw allowlist** を持たせるか、呼び出し側で「auth 系は素の fetch、データ系は safeServerFetch」と使い分ける
- admin 層では `getSession()` / 認可 check は素の throw を維持し、データ fetch のみ safeServerFetch を通す形にした。同じ規律を member / public 層にも適用すること

### 4.3 per-section error UI コンポーネントの抽象化方針

- `AdminSectionError` は admin theme（cool）配色を前提にしている可能性があるため、public / member layer では theme（warm / member-specific）に合わせた variant が必要
- barrel export を `@/components/{admin,public,member}/SectionError` の 3 経路で揃え、props shape は完全一致させる（§3.3）
- 共通実装に寄せたい誘惑があるが、theme / layout context が違うため **shape 統一・実装は layer ごと** のほうが OKLch token 参照が素直になる
- Storybook / 視覚回帰がある場合は 3 layer × default/with-detail/with-retry の 9 ケースを用意

### 4.4 fetch wrapper の TypeScript 型推論と Response | null narrowing

- `fetchPublic` / `fetchMember` が `Promise<T>` を返す場合は素直だが、内部で `Response` を露出する設計が混在していると `SafeResult<T>` の `T` 型が確定しない
- narrowing helper として `assertOk<T>(res: Response): asserts res is Response & { ok: true }` 風の type predicate を入れる選択肢もあるが、過剰設計になりがちなので **fetch 層は `Promise<T>` を返す既存契約を維持** し、`safeServerFetch` が `() => Promise<T>` を受け取る形にする
- ジェネリクスは call site での型推論に任せる（`safeServerFetch<MemberDto[]>(...)` を強制しない）

### 4.5 OKLch token を維持したまま error variant を表現

- `SectionError` で背景・テキストに警戒色を使いたくなるが、HEX 直書きや `bg-[#xxx]` は CLAUDE.md 不変条件 2 で禁止
- 既存 `tokens.css` の `--ubm-color-danger-*` 系（または同等のセマンティック token）を参照する
- token が未定義の場合は新規 token を生やすのではなく、既存 token の組み合わせで表現（不変条件3「プロトタイプ正本順位」遵守）
- `verify-design-tokens` CI gate（task-18）が grep で fail するため、`bg-[#`/`text-[#` を 1 か所でも書かないこと

---

## 5. テスト戦略

### 5.1 Unit (helper 単体)

`apps/web/src/lib/server-fetch/safe-fetch.spec.ts` で以下を assert:

- 成功時に `{ ok: true, data }` を返す
- throw 時に `{ ok: false, error }` を返し、error が `SafeFetchError` 形状を持つ
- page-fatal allowlist（採用時）に該当する error は re-throw する
- `Promise<T>` ジェネリクスの型推論が呼び出し側で確定する

### 5.2 Unit (SectionError primitive)

`apps/web/src/components/{public,member}/SectionError.spec.tsx` で以下を assert:

- props 省略時の既定 title が描画される
- `detail` props 注入時に detail テキストが描画される
- `retryHref` props 注入時にリンクが描画される
- OKLch token class（`var(--ubm-color-*)` 系）が root に付与され、HEX 直書きが無い

### 5.3 Integration (page)

各 page spec で以下 3 ケースを検証:

- 全 fetch 成功 → 通常描画
- 1 fetch だけ失敗 → 該当 section のみ `SectionError`、他 section は通常描画
- 全 fetch 失敗 → 全 section が `SectionError`（ただし page 自体は描画される / error.tsx には行かない）

対象 spec:

- `apps/web/app/(member)/profile/page.spec.tsx`
- `apps/web/app/(public)/members/page.spec.tsx`
- `apps/web/app/(public)/members/[id]/page.spec.tsx`

### 5.4 a11y

- `axe` critical violation 0 を維持
- `SectionError` の `role="alert"` / `aria-live="polite"` の有無を spec で assert（admin 層と統一）

### 5.5 検証コマンド

```bash
mise exec -- pnpm --dir apps/web exec vitest run src/lib/server-fetch
mise exec -- pnpm --dir apps/web exec vitest run src/components/public/SectionError.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run src/components/member/SectionError.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run app/\(member\)/profile/page.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run app/\(public\)/members/page.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run app/\(public\)/members/\[id\]/page.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 6. 受け入れ条件（DoD）

- **AC-1**: `safeServerFetch` 共通 helper が `apps/web/src/lib/server-fetch/safe-fetch.ts`（案 B）または `apps/web/src/lib/public/safe-server-fetch.ts`（案 A）に整備され、member / public 層から import 可能
- **AC-2**: `apps/web/app/(member)/profile/page.tsx` / `apps/web/app/(public)/members/page.tsx` / `apps/web/app/(public)/members/[id]/page.tsx` の server fetch がすべて `SafeResult<T>` を介する形に置換されている
- **AC-3**: `apps/web/src/components/public/SectionError.tsx` / `apps/web/src/components/member/SectionError.tsx` が新規追加され、`AdminSectionError` と props shape が一致している
- **AC-4**: 1 endpoint 失敗時に該当 section のみ `SectionError` 表示で degrade し、page 自体は描画される（spec で検証済み）
- **AC-5**: 既存 API endpoint surface / D1 binding を一切変更していない（CLAUDE.md UI prototype alignment 不変条件 #1 / #5 遵守）
- **AC-6**: 新規 primitive・新規 visual 仕様を導入していない（不変条件 3 遵守）
- **AC-7**: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入していない（不変条件 2 OKLch トークン正本化）
- **AC-8**: `*.spec.tsx` のみで test ファイルを追加（CLAUDE.md #8、`*.test.{ts,tsx}` 禁止）
- **AC-9**: `pnpm typecheck` / `pnpm lint` が 0 error / 0 warning
- **AC-10**: axe critical violation 0 を維持

---

## 7. 関連 path / refs

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- deferred 根拠: `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-10/final-review.md` line 22
- 設計詳細（admin 層先行）: `docs/30-workflows/admin-ui-prototype-alignment/phase-5-implementation.md`
- 既存 helper: `apps/web/src/lib/admin/safe-server-fetch.ts`
- 既存型: `apps/web/src/lib/result.ts`
- admin 適用 page 例: `apps/web/app/(admin)/admin/page.tsx`
- 横展開対象 page:
  - `apps/web/app/(member)/profile/page.tsx`
  - `apps/web/app/(public)/members/page.tsx`
  - `apps/web/app/(public)/members/[id]/page.tsx`
- design token 正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- CI gate: `verify-design-tokens`（task-18）
- error boundary: `apps/web/app/error.tsx`（task-05）
- CLAUDE.md「UI prototype alignment / MVP recovery」§不変条件 1「既存 API endpoint surface のみ利用」/ §不変条件 2「OKLch トークン正本化」/ §不変条件 3「プロトタイプ正本順位」/ §5「D1 直接アクセス禁止」/ §8「test ファイルは `*.spec.{ts,tsx}` のみ」
