# 実装ガイド — /admin/requests 承認時の before→after 公開状態 diff 表示

> ステータス: `implemented_local_runtime_pending`。本ガイドは実装済み内容の説明として更新済み。Part 1（中学生レベル）+ Part 2（開発者レベル）+ Part 3〜（CONST_005 補足）+ 視覚証跡で構成する。3 canonical PNG は staging visual pending。

---

## Part 1 — 中学生レベルの説明（専門用語なし・例え話）

### なぜ必要か

管理者が見る「会員からの申請」という画面（`/admin/requests`）があります。ここには「この会員を公開→非公開にしてほしい」「退会したい」といった申請が並びます。管理者はそれを承認するかどうかを決めます。

今の画面は、**今の状態**（例: 「公開状態: public」）と、**申請された希望**（例: 「desiredState: hidden」）が、**別々の場所にバラバラに書いてあります**。これは、健康診断で「今の身長」と「目標の身長」が別のページに書いてあって、結局「何センチ伸ばすの?」が一目で分からないようなものです。しかも「public」「hidden」のような英語のままなので、ぱっと意味が読み取れません。だから管理者は目で照らし合わせて「あ、公開から非公開にするのね」と頭の中で計算する必要があり、間違って承認してしまうリスクがあります。

### 何をするか（例え話）

「今 → これから」を **1 本の矢印でつなげて見せる**ようにします。たとえば「公開 → 非公開」と矢印で並べれば、何がどう変わるか一目で分かります。英語の「public」も「公開」という日本語に直します。

- 公開状態を変える申請のときは「公開 → 非公開」のように見せます。
- 退会の申請のときは公開状態ではなく「在籍 → 退会（論理削除）」のように、別の意味の矢印で見せます（公開状態の話と混ざらないようにするため）。
- 承認ボタンを押す前の確認ダイアログにも「公開 → 非公開 に変更します」という具体的な言葉を出します。

### 大事な約束（変えないこと）

- データを取ってくる仕組み（サーバ側）は **一切変えません**。見せ方だけ変えます。サーバが返している 3 つの値（今の公開状態・退会済みか・希望の状態）だけを使います。
- 色は決められた「色のパレット」からだけ使います（自分で勝手な色コードを書きません）。
- もともと出来ていたこと（申請の承認・却下・既存の文言・読み上げ）は全部そのまま動きます。新しい部品も新しい色も作りません。

---

## Part 2 — 開発者レベルの説明

### 概要

`/admin/requests`（会員からの申請キュー）の承認導線で、`memberSummary.publishState`（変更前）→ `requestedPayload.desiredState`（変更後）を `公開 → 非公開` の遷移として 1 箇所に強調表示する。`apps/web` の表現層（`apps/web/src/components/admin/`）+ `globals.css` のみを変更し、`apps/api` / `packages/shared` / projection / D1 / Google Form は不変（AC-7）。GET `/admin/requests` が既に返す 3 値（`publishState` / `isDeleted` / `desiredState`）だけで完結させる。

### 変更ファイル一覧（CONST_005: 変更対象ファイル一覧・パス + 種別）

| 区分 | パス | 種別 | 内容 |
| --- | --- | --- | --- |
| 修正 | `apps/web/src/components/admin/RequestQueueDetail.tsx` | tsx（表現層・主役） | `formatPublishStateLabel` / `buildPublishStateDiff` 純関数を追加し、dl に `変更前 → 変更後` diff 行を新設。`NOTE_TYPE_LABEL` / `summarizePayload` を diff 構築用に拡張 |
| 修正 | `apps/web/src/components/admin/RequestQueuePanel.tsx` | tsx（表現層・統括） | `destructiveMessage`（143-148 行）生成箇所で具体遷移文言（`公開 → 非公開 に変更します`）を組み立てる。`RequestQueueItem` type は既存 props 範囲で完結 |
| 修正 | `apps/web/src/components/admin/RequestConfirmDialog.tsx` | tsx（表現層・ダイアログ） | 既存 `destructiveMessage` props 経由で具体文言を表示。**新規 props 追加なし**（既存テスト破壊回避） |
| 修正 | `apps/web/src/styles/globals.css` | css | `[data-diff-side="before"]` / `[data-diff-side="after"]` の diff 強調クラス（既存 OKLch トークンのみ） |
| 修正 | `apps/web/src/lib/admin/server-fetch.ts` | ts（Playwright SSR fixture） | `PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1` の `publishState` を実 API 値域に補正し、`visibility_request` / `delete_request` の local visual fixture を AC と整合 |
| 修正（追従） | `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` | tsx（test） | note_type 別 diff 行 assertion を追加 |
| 修正（追従） | `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx` | tsx（test） | diff サマリ文言 assertion を追加 |
| 修正（追従） | `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | tsx（test） | `destructiveMessage` 具体化 assertion を追加 |
| 修正（追従） | `apps/web/playwright/tests/admin-requests.spec.ts` | ts（E2E） | stale layout class assertion を role-based assertion へ更新し、before/after diff DOM と現行 member redirect 境界を固定 |
| **変更なし** | `apps/api/**` / `packages/shared/**` | — | AC-7 / 不変条件 #5・ui-prototype #1。`git diff --name-only -- apps/api packages/shared` が空 |

### 関数・型シグネチャ（CONST_005: 関数・型シグネチャ）

#### `formatPublishStateLabel`（純粋関数・fail-soft）

```ts
// apps/web/src/components/admin/RequestQueueDetail.tsx 内 or 同階層 helper
// public/member_only/hidden/unknown → 日本語ラベル。未知値は「不明」へ fail-soft（throw しない）。
export function formatPublishStateLabel(state: string): string {
  switch (state) {
    case "public": return "公開";
    case "member_only": return "会員限定";
    case "hidden": return "非公開";
    default: return "不明"; // unknown / 想定外値は fail-soft
  }
}
```

#### `buildPublishStateDiff`（純粋関数・note_type 意味軸分岐）

```ts
export type PublishStateDiffKind = "visibility" | "delete";

export interface PublishStateDiff {
  readonly kind: PublishStateDiffKind;
  readonly before: string; // 表示用ラベル（visibility=公開状態ラベル / delete=「在籍」）
  readonly after: string;  // 表示用ラベル（visibility=desiredState ラベル / delete=「退会（論理削除）」）
}

// visibility_request: publishState → desiredState の公開状態遷移
// delete_request: 在籍 → 退会（論理削除）のレコード状態遷移
// 対象外 note_type / desiredState 欠落時は null（diff 行を描画しない）
export function buildPublishStateDiff(item: RequestQueueItem): PublishStateDiff | null {
  // visibility_request: before = formatPublishStateLabel(memberSummary.publishState),
  //                     after  = formatPublishStateLabel(requestedPayload.desiredState)
  // delete_request:     before = "在籍", after = "退会（論理削除）"
  // それ以外:           return null
}
```

### 入出力・副作用（CONST_005: 入出力・副作用）

- 両関数とも**純粋関数**（副作用なし・throw しない）。入力は表示済み client type（`RequestQueueItem` / `state: string`）のみ。出力は表示用文字列 / `PublishStateDiff | null`。
- `formatPublishStateLabel` は未知入力で「不明」を返す（例外を投げない）。
- `buildPublishStateDiff` は対象外 note_type / `desiredState` 欠落で `null` を返し、呼び出し側は diff 行を描画しない（fail-soft）。
- DOM 副作用は `RequestQueueDetail` の dl に diff 行 1 つを追加するのみ。既存の `aria-label="申請詳細"` 等は不変。

### globals.css `[data-diff-side]` クラス（CONST_005: スタイル）

| クラス | 役割 | 主トークン |
| --- | --- | --- |
| `[data-diff-side="before"]` | 変更前（中立トーン） | `var(--ubm-color-text-secondary)` |
| `[data-diff-side="after"]` | 変更後（強調トーン） | `var(--ubm-color-accent)` / 文字 `var(--ubm-color-accent-ink)` |
| 矢印 span（`aria-hidden`） | 区切り装飾 | `var(--ubm-color-text-muted)` |

> 色は全て `var(--ubm-color-*)` 経由。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（AC-5）。新規 token は追加しない（既存 token のみ）。強調は `[data-diff-side]` 属性セレクタに閉じ込め、共有 primitive（`card` / `ui-badge`）本体スタイルは変更しない（AC-6）。

### テスト方針（CONST_005: テスト方針）

| テスト | 観点 | AC |
| --- | --- | --- |
| `RequestQueueDetail.spec.tsx`（追従） | V01: `公開 → 非公開` / V02: `非公開 → 公開` の before/after span が描画される | AC-1 / AC-3 |
| `RequestQueueDetail.spec.tsx`（追従） | D01: `在籍 → 退会（論理削除）` が描画され、公開状態 diff 文言が出ない | AC-2 |
| `RequestQueueDetail.spec.tsx`（追従） | `formatPublishStateLabel` が `public/member_only/hidden/unknown` を正しい日本語ラベルへ写像し、未知値で「不明」へ fail-soft | AC-3 |
| `RequestQueueDetail.spec.tsx`（追従） | 矢印 span に `aria-hidden="true"` が付く | AC-9 |
| `RequestConfirmDialog.spec.tsx`（追従） | `destructiveMessage` が `visibility_request` で具体遷移文言を表示 | AC-8 |
| `RequestQueuePanel.component.spec.tsx`（追従） | `destructiveMessage` が `visibility_request` で具体遷移、`delete_request` で既存退会文言を返す | AC-8 |

### 実行コマンド（CONST_005: ローカル実行コマンド）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# focused vitest（repo ルート基準・3 spec 限定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx
# design token gate（HEX 直書き検出）
grep -rnE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" \
  apps/web/src/components/admin/RequestQueueDetail.tsx \
  apps/web/src/components/admin/RequestConfirmDialog.tsx \
  apps/web/src/components/admin/RequestQueuePanel.tsx && echo "FAIL" || echo "PASS"
# admin requests E2E（fixture + auth secret）
AUTH_SECRET=playwright-auth-secret-playwright-auth-secret \
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1 \
pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/admin-requests.spec.ts --project=desktop-chromium
# apps/api 非変更確認
git diff --name-only -- apps/api packages/shared   # 空であること
```

> パッケージ名は `@ubm-hyogo/web`（`apps/web/package.json` で実確認済み）。focused vitest は repo ルートが root のため `--root=. --config=vitest.config.ts` + フルパス指定（package.json test script 準拠）。

### エッジケース（CONST_005: エッジケース）

| ケース | 期待挙動 |
| --- | --- |
| `desiredState` が未知値（enum 外） | `formatPublishStateLabel` が「不明」を返し、diff は `公開 → 不明` のように崩れず描画 |
| `delete_request`（`desiredState` なし・`payload: {}`） | 公開状態 diff ではなく「在籍 → 退会（論理削除）」を描画。公開状態 diff 文言を出さない |
| `publishState` が `unknown`（fallback） | before が「不明」になる。診断可能で崩れない |
| 対象外 note_type | `buildPublishStateDiff` が `null` を返し、diff 行を描画しない（既存表示を維持） |
| screen reader | 「変更前 公開、変更後 非公開」相当を連続読み上げ。矢印は `aria-hidden="true"` で読み上げない |

### DoD（CONST_005: 完了定義）

- AC-1〜AC-10 がすべて充足（Phase 7 AC マトリクスでトレース）。
- 既存 3 spec が green を維持し、note_type 別 diff assertion が PASS。
- admin requests Playwright E2E が green を維持し、local fixture 上で `公開 → 非公開` diff assertion が PASS。
- `verify-design-tokens` が PASS（対象 3 ファイルに HEX 0 件）。
- `git diff --name-only -- apps/api packages/shared` が空（AC-7）。
- 新規 primitive 0 件・新規 token 0 件。

---

## Part 3 — 設計判断の根拠（note_type 意味軸分岐）

`visibility_request` と `delete_request` を同じ「公開状態 diff」で表現すると誤解を生むため、意味軸を分離する。

- `visibility_request` は公開状態の遷移（`publishState` → `desiredState`）として描画する。
- `delete_request` は `desiredState` を持たずレコード状態の遷移（在籍 → 退会（論理削除））として別 `dt` ラベルで描画する。
- これにより「退会申請なのに公開状態が変わると誤読される」リスクを排除する。

`buildPublishStateDiff` の `kind` フィールドがこの分岐を担い、`null` の場合は diff 行自体を描画しない fail-soft 設計にする。この設計判断は AC-2（混同回避）と AC-1（公開状態遷移）を同時に満たすための中核である。

## Part 4 — 承認確認ダイアログの文言生成

`RequestConfirmDialog` は最小 props（`kind` / `isDestructive` / `destructiveMessage`）しか受け取らない。

- diff サマリは props 追加ではなく `RequestQueuePanel.tsx:143-148` の `destructiveMessage` 生成箇所で文言として組み立てる。
- これにより既存ダイアログのテスト・型を破壊せず、`visibility_request` 承認時に「公開 → 非公開 に変更します」を提示する。
- `delete_request` 承認時は既存の退会・論理削除文言を維持する（AC-8）。

props を増やさないことが既存 3 spec の green 維持（AC-10）に直結する。文言生成は `formatPublishStateLabel` を再利用し、詳細パネルとダイアログでラベル表記を一致させる。

---

## 視覚証跡（Phase 11 screenshot canonical 名）

VISUAL タスクのため、下記 3 canonical screenshot を `outputs/phase-11/screenshots/` に取得する（`outputs/phase-11/phase11-capture-metadata.json` と一致）。現時点では staging deploy + admin bearer mint が user-gated のため PNG 実体は未取得。

| # | canonical 名 | TC | 検証 AC |
| --- | --- | --- | --- |
| ① | `request-approve-visibility-public-to-hidden.png` | TC-V-01 | AC-1 / AC-3（V01: 公開 → 非公開） |
| ② | `request-approve-visibility-hidden-to-public.png` | TC-V-02 | AC-1 / AC-8（V02: 非公開 → 公開 + ダイアログ文言） |
| ③ | `request-approve-delete-enroll-to-withdraw.png` | TC-V-03 | AC-2（D01: 在籍 → 退会（論理削除）） |

> 実 capture は実装完了 + staging deploy + admin bearer mint 後、user 承認のもと取得する（user-gated）。staging runtime artifact / PNG を擬似生成しない。
