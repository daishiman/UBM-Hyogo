# Phase 12: 実装ガイド（implementation-guide）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |

---

## Part 1: 中学生レベルの概念説明（なぜ → 何を）

### なぜこの修正が必要か（日常の例え話）

学校の名簿係を思い浮かべてください。名簿には「入った理由」を書く欄があり、ルールでは「クラブ推薦」「先生の推薦」「自分で希望」の 3 種類だけを書くことになっています。ところが昔の名簿（テスト用データ）には「見学から（seed）」という、ルールに無い 4 つ目の言葉が書かれている人がいました。

ここに、書かれた言葉が 3 種類のどれかでないと「この名簿は壊れている！」と言って受付ごと閉めてしまう、とても厳しいチェック係がいます。管理画面で「TEST-MEM-09 さんの詳細を見せて」とお願いすると、この人の欄に「見学から」と書いてあるため、チェック係が「壊れている」と判断し、画面ぜんぶが「読み込み失敗（500）」になってしまいます。本当はその人の情報はちゃんとあるのに、入った理由の言葉がルール外なだけで全部見られなくなるのが今回の不具合です。

おもしろいことに、同じデータでも「会員一覧」のページは平気で表示できます。一覧は「入った理由」の欄を見ないからです。詳細だけが厳しくチェックして倒れる、この**ちぐはぐさ**が本当の問題です。

さらにもう一つ。詳細を開くドロワー（横から出てくる引き出し画面）は、一度「読み込み失敗」になると、**もう一度試す方法が無くて**そのまま行き止まりになっていました。迷子になったのに「戻る道」が無い状態です。

### 何をするか

2 つのことをします。

1. **入った理由の言葉を、表示する直前にやさしく直してあげる係を作ります。** ルールにある 3 種類はそのまま、「見学から」のようなルール外の言葉や空っぽの場合は、無難な「自分で希望（manual）」に読み替えます。元のデータ（名簿そのもの）は書き換えません。表示するときだけ、こっそり整えてあげるイメージです。さらに念のため、厳しいチェック係にも「知らない言葉が来たら倒れずに manual とみなしてね」という保険を 1 枚かけます。
2. **ドロワーが「読み込み失敗」になったとき、「再試行」ボタンを出します。** ボタンを押すともう一度だけお願いをやり直し、今度は成功すれば詳細が表示されます。迷子になっても「もう一回行ってみよう」のボタンを置くイメージです。

この 2 つを 1 回の修正でまとめてやることで、根本（言葉の食い違いで倒れる）も、見え方（失敗からの立ち直り）も、両方きれいになります。

### 今回実装したもの

- ルール外のタグ source を表示直前に安全な値へ読み替える純関数 `normalizeTagSource`
- 万一未読み替えの値が来ても倒れない保険 `TagSourceZ` の `.catch("manual")`
- `builder.ts` の 2 か所の「無理やり 3 種類とみなす」キャストを `normalizeTagSource()` に置き換え
- `MemberDrawer` の失敗表示に「再試行」ボタンを追加し、`reloadKey` で再 fetch する仕組み
- Lane A / Lane B それぞれの focused Vitest

---

## Part 2: 技術者向け実装ガイド

### 背景

管理画面メンバー詳細 `GET /api/admin/members/:id` が、`member_tags.source` の値ドメイン不一致で 500 を返す。

- DB は `member_tags.source TEXT NOT NULL`（migration `0002_admin_managed.sql:46`、**CHECK 制約なし**）で任意文字列を許容する。seed（`test-accounts-seed.sql:91-121`）は `source='seed'` を投入し、実運用は `'rule'`（tag candidate enqueue）/ `'manual'`（bulk tag・drawer assign）が入る。
- view 層の `TagSourceZ = z.enum(["rule", "ai", "manual"])`（`packages/shared/src/zod/primitives.ts:29`）は 3 値固定。
- `buildAdminMemberDetailView`（`apps/api/src/repository/_shared/builder.ts:429`）と `buildMemberProfile`（同 `:357`）が `source: t.source as "rule" | "ai" | "manual"` で実 DB 値を無視してキャストし、`AdminMemberDetailViewZ.safeParse(view)`（`apps/api/src/routes/admin/members.ts:506-508`）が seed source で失敗 → 500。
- 一覧 `GET /api/admin/members` は `parseTagsJson`（`members.ts:130-149`）が source を参照せず fail-soft に握るため同データでも 500 にならない。この**非対称**が真の論点。
- 加えて `MemberDrawer`（`apps/web/src/features/admin/components/_members/MemberDrawer.tsx:41-57`）は fetch 失敗時に `setError` で文言を出すだけで、依存配列が `[memberId]` のみのため再試行導線が無く回復不能。

### 要約

Lane A（`packages/shared` + `apps/api`）で値ドメインを fail-soft 正規化（純関数 `normalizeTagSource` + `TagSourceZ` の `.catch("manual")` + builder の `as` キャスト 2 箇所置換）し、Lane B（`apps/web`）で `MemberDrawer` の fetch 失敗に `reloadKey` ベースの再試行導線を追加する。根本（値ドメイン）と表示（防御的 UX）を同一サイクルで閉じる。endpoint surface / response shape / D1 schema / migration / seed / Google Form は不変（AC-6）。`TagSource` union（3 値）は拡張しない（AC-7）。

### APIシグネチャ

- `normalizeTagSource(raw: string | null | undefined): TagSource` — `packages/shared/src/types/common.ts` に新設・export。
- `TagSourceZ` — `.catch("manual")` 付与後も出力型は `"rule" | "ai" | "manual"` のまま（union 不変）。
- `buildMemberProfile` / `buildAdminMemberDetailView` — 公開シグネチャ不変。内部の `source` 値構築のみ変更。
- `MemberDrawer({ memberId, onClose }: MemberDrawerProps)` — props 不変。内部に `reloadKey` state を追加。

#### Lane A-1: `packages/shared/src/types/common.ts`（純関数 `normalizeTagSource` 追加）

既存の `export type TagSource = "rule" | "ai" | "manual";` は不変。下記を追加する。

```ts
export type TagSource = "rule" | "ai" | "manual"; // 既存・拡張しない

const KNOWN_TAG_SOURCES: readonly TagSource[] = ["rule", "ai", "manual"];

/**
 * DB の member_tags.source（CHECK 制約なし＝任意文字列）を view 層の TagSource へ
 * fail-soft 正規化する。既知値はそのまま、'seed' を含む未知値・空文字・null・undefined は 'manual' へ。
 * 例外は投げない（WEEKGRD-02: 純粋関数ガードは例外なし・防御的返却）。
 */
export function normalizeTagSource(raw: string | null | undefined): TagSource {
  return KNOWN_TAG_SOURCES.includes(raw as TagSource) ? (raw as TagSource) : "manual";
}
```

- `packages/shared/src/index.ts` は `export * from "./types/common";` のため barrel から自動公開される（追加の export 配線は不要だが Phase で確認する）。

#### Lane A-2: `packages/shared/src/zod/primitives.ts`（`TagSourceZ` 最終防壁）

```ts
// 現行
export const TagSourceZ = z.enum(["rule", "ai", "manual"]);
// 修正後
export const TagSourceZ = z.enum(["rule", "ai", "manual"]).catch("manual");
```

- `.catch("manual")` は parse 失敗時にフォールバック値を返すだけで union 型は不変。`viewmodel.ts:71`（`MemberProfileZ.profile.tags[].source`）/ `identity.ts:68` の利用は型互換。`TagSource` TS 型・`identity.ts`（IdentityResolution 等）の意味は不変。

#### Lane A-3: `apps/api/src/repository/_shared/builder.ts`（`as` キャスト 2 箇所置換）

- `:357`（`buildMemberProfile`）と `:429`（`buildAdminMemberDetailView`）の `source: t.source as "rule" | "ai" | "manual"` を `source: normalizeTagSource(t.source)` に置換する。
- import: `import { normalizeTagSource } from "@ubm-hyogo/shared";`（builder.ts が既に shared から import している行へ追記。実 import 名は実装時に確認）。

```ts
// 現行（buildMemberProfile / buildAdminMemberDetailView の tags.map 内）
tags: tags.map((t) => ({
  code: t.code,
  label: t.label,
  category: t.category,
  source: t.source as "rule" | "ai" | "manual",
})),
// 修正後
tags: tags.map((t) => ({
  code: t.code,
  label: t.label,
  category: t.category,
  source: normalizeTagSource(t.source),
})),
```

#### Lane B: `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（再試行導線）

- `MemberDrawer` に `reloadKey` state を追加: `const [reloadKey, setReloadKey] = useState(0);`。
- `useEffect` 依存配列を `[memberId]` → `[memberId, reloadKey]` に変更（再駆動で再 fetch）。
- error 分岐（現行 61-64 行）を「文言 + 既存 `Button`（`variant="danger"`・既に import 済み・line 23）の『再試行』ボタン」へ拡張。押下で `setError(null); setData(null); setReloadKey((k) => k + 1);`。
- `role="alert"` を保持し、再試行ボタンに `data-testid="member-detail-retry"` を付与。OKLch トークン正本に従い HEX 直書きしない。新規 primitive を生やさない（`Button` を再利用）。

```tsx
{error ? (
  <div role="alert" className="flex flex-col gap-2 text-sm text-[var(--ubm-color-danger)]">
    <span>読み込み失敗: {error}</span>
    <div>
      <Button
        type="button"
        variant="danger"
        size="sm"
        data-testid="member-detail-retry"
        onClick={() => {
          setError(null);
          setData(null);
          setReloadKey((k) => k + 1);
        }}
      >
        再試行
      </Button>
    </div>
  </div>
) : ...}
```

### 使用例

```bash
pnpm exec vitest run packages/shared/src/zod/viewmodel.spec.ts
pnpm exec vitest run apps/api/src/repository/__tests__/builder.repository.spec.ts
pnpm exec vitest run apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx
```

> vitest config の root は repo root のため、ファイル指定時はフルパス指定＋必要に応じ `--root` を付ける（前例: `cd apps/web && vitest run src/... --root ../..`）。

### エラーハンドリング

- `normalizeTagSource` は例外を投げない。未知値・空文字・`null`・`undefined` は `'manual'` を返す（防御的返却）。入力バリデーションは呼び出し元（DB 層）に委ねない設計（コード側 fail-soft 吸収を正本）。
- `TagSourceZ.safeParse` は `.catch("manual")` により未知値でも `success: true`（`data: "manual"`）を返し、`AdminMemberDetailViewZ.safeParse(view)` を 500 にしない。
- `MemberDrawer` の詳細 fetch 失敗は error 分岐へ倒し、再試行ボタンで `reloadKey` を進めて再 fetch する。`MemberTagsEditor`（子）の tags fetch は成功時のみマウントされ、本不具合の経路ではない（個別回復強化はスコープ外・MINOR 候補）。

### エッジケース

- `normalizeTagSource('rule' | 'ai' | 'manual')` は恒等。
- `normalizeTagSource('seed')` / 未知文字列 / `''` / `null` / `undefined` → `'manual'`。
- `TagSourceZ.safeParse('seed')` → `{ success: true, data: 'manual' }`。正規値 `'rule'` 等は恒等。
- `buildAdminMemberDetailView` / `buildMemberProfile` は seed source タグを含むメンバーで `AdminMemberDetailViewZ.safeParse` を通る（200 相当・回帰）。
- `MemberDrawer` 初回 fetch 500 → error + 再試行ボタン。押下で 2 回目 fetch（200）成功 → 詳細表示へ回復。

### 設定項目と定数一覧

| 識別子 | 値 / 役割 |
| --- | --- |
| `normalizeTagSource` | DB の任意文字列 source を view 層 `TagSource` へ fail-soft 正規化する純関数 |
| `KNOWN_TAG_SOURCES` | `["rule", "ai", "manual"]`（既知 source 集合・union 非拡張） |
| `TagSourceZ` | `.catch("manual")` 付き enum（最終防壁・union 不変） |
| `buildAdminMemberDetailView` | 管理画面詳細 view builder（`:429` で `normalizeTagSource` 適用） |
| `buildMemberProfile` | マイページ profile builder（`:357` で `normalizeTagSource` 適用） |
| `reloadKey` | `MemberDrawer` の再 fetch トリガ state（押下で +1） |
| `member-detail-retry` | 再試行ボタンの `data-testid` |

### テスト構成

| 領域 | ファイル | 観点 |
| --- | --- | --- |
| shared 純関数 + zod | `packages/shared/src/zod/viewmodel.spec.ts` | `normalizeTagSource` 恒等 / フォールバック / 例外なし、`TagSourceZ.safeParse('seed')` success+manual |
| API builder 回帰 | `apps/api/src/repository/__tests__/builder.repository.spec.ts` | seed source で `buildAdminMemberDetailView` / `buildMemberProfile` が `safeParse` を通る |
| web UI 回復 | `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | 初回 500 → error + 再試行ボタン、押下 → 2 回目 200 → 回復。HEX 直書きなし |

### 検証コマンド

```bash
pnpm typecheck
pnpm lint
pnpm exec vitest run packages/shared/src/zod/viewmodel.spec.ts
pnpm exec vitest run apps/api/src/repository/__tests__/builder.repository.spec.ts
pnpm exec vitest run apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx
```

### 既知制限

- `member_tags.source` への DB CHECK 制約追加・migration・seed 書き換え・endpoint surface・response shape・D1 schema・Google Form 仕様は一切変更しない（AC-6 / AC-7）。値の正本是正はコード層（`normalizeTagSource`）で吸収する。
- `MemberTagsEditor` 子コンポーネントの個別エラー回復強化は本経路外（成功時のみマウント）。MINOR 候補として `unassigned-task-detection.md` の baseline に記録（起票しない）。
- 本 wave は `implemented_local_evidence_captured`。local code implementation・focused Vitest・typecheck は完了。staging screenshot・commit・PR は user-gated。

---

## 視覚証跡

VISUAL。Lane B の `MemberDrawer` error 分岐に再試行ボタンを追加する。本 wave は `implemented_local_evidence_captured` のため staging runtime screenshot は**未取得**（PNG 0 件・status=`staging_visual_pending_user_gate`）。実装後の一次証跡は jsdom render（`MemberDrawer.spec.tsx`）、二次証跡は staging runtime screenshot（認証必須・user-gated）。

| 証跡 | パス | 状況 |
| --- | --- | --- |
| jsdom render（MemberDrawer 回復） | `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | PASS（一次証跡） |
| error + retry screenshot | `outputs/phase-11/screenshots/member-detail-error-retry.png`（SC-01） | staging_visual_pending_user_gate（staging 認証必須・user-gated） |
| 回復ドロワー screenshot | `outputs/phase-11/screenshots/member-detail-recovered.png`（SC-02） | staging_visual_pending_user_gate（user-gated） |
| 詳細 API 200 network | `outputs/phase-11/screenshots/member-detail-api-200.png`（SC-03） | staging_visual_pending_user_gate（user-gated） |
| screenshot metadata | `outputs/phase-11/screenshots/screenshot-plan.json` / `phase11-capture-metadata.json` / `outputs/phase-11/screenshot-coverage.md` | present（status=staging_visual_pending_user_gate） |

## 完了条件

- [x] Part 1（中学生レベル・例え話・なぜ→何を）を本文 3 行以上で記述
- [x] Part 2（型/シグネチャ/エラーハンドリング/設定値）を背景・要約・実装ステップ・検証コマンド・既知制限の key section つきで記述
- [x] `## 視覚証跡` で VISUAL の screenshot status=staging_visual_pending_user_gate（implemented_local_evidence_captured）と user-gated を明記
- [x] 識別子（`normalizeTagSource` / `TagSourceZ` / `buildAdminMemberDetailView` / `buildMemberProfile` / `reloadKey` / `member-detail-retry`）を実コードと一致

## 成果物

- `outputs/phase-12/implementation-guide.md`（本ファイル）

## 参照資料

- `_shared-context.md` §2（Lane A / Lane B 修正方針）
- `packages/shared/src/types/common.ts`（`TagSource` 既存定義）
- `packages/shared/src/zod/primitives.ts:29`（`TagSourceZ`）
- `apps/api/src/repository/_shared/builder.ts:357,429`（`as` キャスト適用点）
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx:37-64`（error 分岐・useEffect 依存）
