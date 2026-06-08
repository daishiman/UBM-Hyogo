# 実装ガイド — issue-1116 admin tag master code edit UI

> 本 workflow は `implemented_local_evidence_captured`（実コード実装済み）。本ガイドは後続本実行サイクルが
> apps/web のコード変更（新規 6 / 編集 2 + tests）を 1 サイクルで完遂するための設計詳細。

## Part 1: 初学者向け（中学生レベルの概念説明）

### なぜこれが必要なの？

たとえば、学校で生徒に貼る「ラベル（タグ）」を想像してください。ラベルには、人が見る表示名（例:「英語クラス」）と、
コンピュータが使う短い**名札（`code`、例: `english`）**の 2 つがあります。

先生がうっかり名札を `englsh`（l が抜けた）と打ち間違えて登録してしまいました。
今までは、この名札を後から書き換える**操作画面そのものがありません**でした。
（書き換える仕組み＝API は前回の工事〔issue-1069〕で作ってあるのに、それを押すボタンが画面に無い状態です。）

そこで今回は、**名札（code）を後から書き換えられる専用の管理画面を新しく作ります**。

### 何が変わるか

管理者はタグ一覧から対象を選び、code / 表示名 / カテゴリを同じ画面で確認して保存できます。

### 古い情報のまま保存しないための工夫

書き換えの最中に、別の人が同じラベルの名札をこっそり変えてしまったらどうなるでしょう。
あなたは「`englsh` を `english` に直そう」と思っていても、すでに別の人が `eng` に変えていたら、
あなたの保存は「他人の変更を上書きして消してしまう」事故になります。

これを防ぐため、**編集を始めたときの名札を覚えておいて照合する仕組み**（`expectedCode`）を使います。
「私は今 `englsh` だと思っているので `english` に直して」と一緒に伝えると、もし誰かが先に別の値へ変えていたら、
画面は「**古い情報のまま保存しようとしています**（最新の値に競合しました）」と教えてくれます。

さらに、すでに `english` という名札が別のラベルにあるなら「それはもう使われています」と別の文言で教えます。
この 2 種類のお知らせをきちんと**別々のメッセージ**で出すのが、今回の画面の大事なポイントです。

### 今回作ったもの（画面側だけ）

- 名札（code）/ 表示名（label）/ 種類（category）を一覧から選んで編集できる**新しい管理ページ**
- 編集を始めたときの名札を覚えて照合する仕組み（`expectedCode` の保持と送信）
- 「もう使われている名札」と「古い情報のまま」の 2 つを別々のメッセージで出す表示
- サイドバーに「タグ管理」という新しい入口を追加

## Part 2: 開発者向け（技術詳細）

### route 決定（sibling `/admin/tag-master` を採る根拠）

| 観点 | 内容 |
| --- | --- |
| 原典 Issue の想定 | tag master CRUD は `/admin/tags` に置けると想定（「専用ページがまだ無い」） |
| 現コード実態 | `/admin/tags` は **tag QUEUE**（タグ提案レビュー）で占有済み。nav id `tag-queue`（`shell-config.ts:82`） |
| 子ルートの問題 | `isNavItemActive`（`shell-config.ts:125-129`）は `pathname.startsWith(href + "/")` で active 判定する。`/admin/tags/master` 等の**子ルートにすると tag-queue nav が同時 active になる nav 衝突バグ**が発生する |
| 採用方針 | **sibling ルート `/admin/tag-master`** を新設。`isNavItemActive("/admin/tags", "/admin/tag-master")` は false（接頭辞一致しない）で衝突しないことを regression test で固定 |

> route は `apps/web/app/(admin)/admin/tag-master/page.tsx`（server component）。read は既存
> `safeServerFetch('/admin/tags?...')`（tag master 一覧）を再利用し、web proxy は既存 catch-all
> `apps/web/app/api/admin/[...path]/route.ts` が PATCH を転送するため新規 proxy は不要。

### TypeScript 型定義

```ts
type AdminTagsPageResponse = {
  readonly total?: number;
  readonly items?: readonly AdminTagRef[];
};

type AdminTagUpdateInput = {
  readonly code?: string;
  readonly label?: string;
  readonly category?: string;
  readonly expectedCode?: string;
};

type AdminTagUpdateErrorCode =
  | "tag_code_conflict"
  | "tag_stale_conflict"
  | "tag_not_found"
  | "no_update_fields"
  | "invalid_body"
  | "invalid_json";
```

### APIシグネチャ

```ts
updateTag(
  tagId: string,
  input: AdminTagUpdateInput,
): Promise<AdminTagRef>;

parseTagUpdateErrorCode(bodyText: string): AdminTagUpdateErrorCode | null;
```

### component / API client シグネチャ表

| 種別 | パス / 識別子 | シグネチャ（予定） | 役割 |
| --- | --- | --- | --- |
| web API client | `apps/web/src/features/admin/api/tags.ts` `updateTag` | `updateTag(tagId: string, input: AdminTagUpdateInput): Promise<AdminTagRef>` | `PATCH /api/admin/tags/:tagId` を proxy 経由で送信。UI は変更フィールドのみ同梱し、`code` 変更時のみ `expectedCode` を付与 |
| web error code 型 | `apps/web/src/features/admin/api/tags.ts` `AdminTagUpdateErrorCode` | `type AdminTagUpdateErrorCode = "tag_code_conflict" \| "tag_stale_conflict" \| "tag_not_found" \| "no_update_fields" \| "invalid_body" \| "invalid_json"` | 409/404/400 のレスポンス body の `error` を判別子に分離 |
| error parse | `apps/web/src/features/admin/api/tags.ts` `parseTagUpdateErrorCode` | `parseTagUpdateErrorCode(bodyText: string): AdminTagUpdateErrorCode \| null` | JSON body の `error` を UI 表示可能な error code へ正規化 |
| client component | `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx` | `TagMasterPanel({ initialTags }: { initialTags: TagDefinitionView[] })` | 一覧テーブル + 行選択 → 編集フォーム表示。mutation 成功後 row を optimistic 置換 or 再 fetch |
| client component | `apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx` | `TagMasterEditForm({ tag, onUpdated }: { tag: TagDefinitionView; onUpdated: (next: TagDefinitionView) => void })` | `FormField` で code/label/category 入力。行ロード時の `code` を `expectedCode` として保持。`useAdminMutation` で PATCH。409 を分離表示 |

> 識別子は Phase 1 §1.4 の命名規則分析に整合（route=kebab slug / component=PascalCase / client 関数=camelCase / error code 型=`...ErrorCode`）。

### 使用例

```ts
const payload = buildTagUpdateInput(currentTag, {
  code: codeInput,
  label: labelInput,
  category: categoryInput,
});

await updateTag(currentTag.tagId, payload);
```

```bash
pnpm exec vitest run apps/web/src/features/admin/api/__tests__/tags.update.spec.ts apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx apps/web/app/\(admin\)/admin/tag-master/page.spec.tsx apps/web/src/components/shell/__tests__/shell-config.spec.ts
```

### エラーハンドリング

API レスポンスの `error` を `parseTagUpdateErrorCode(bodyText)` で既知 code に正規化し、`TagMasterEditForm` が表示文言へ変換する。不明 code / JSON でない body / proxy 由来 5xx は汎用「保存できませんでした。」に倒す。

### error マッピング表（API レスポンス → UI 文言）

| HTTP / body.error | 意味 | UI 文言（CONFLICT_COPY） |
| --- | --- | --- |
| 409 `tag_code_conflict` | UNIQUE(code) 衝突（その code は既に別 tag が使用中） | 「この code は既に別のタグで使われています。別の code を入力してください。」 |
| 409 `tag_stale_conflict` | optimistic CAS 衝突（編集開始後に最新値が変わった） | 「保存前に別の変更が入りました。画面を更新して最新のコードを確認してください。」 |
| 404 `tag_not_found` | 対象 tagId が存在しない（削除済み等） | 「対象のタグが見つかりません。一覧を再読み込みしてください。」 |
| 400 `no_update_fields` | 変更フィールドが 1 つも無い | 「変更内容がありません。少なくとも 1 項目を編集してください。」（submit 前に UI 側でも抑止） |
| 400 `invalid_body` | CODE_RE 違反 / `code` 指定で `expectedCode` 欠落 | 「入力値を確認してください。」 |

### エッジケース

| ケース | 対応 |
| --- | --- |
| GET `/admin/tags` が `{ total, items }` を返す | `page.tsx` は `items ?? []` / `total ?? items.length` として `TagMasterPanel` へ渡す |
| label/category 単独更新 | 変更フィールドのみ送信し、`expectedCode` は送らない |
| code 変更 | `code` と `expectedCode: tag.code` を同梱する |
| ハイフン入り code | API 正本 `/^[a-z0-9][a-z0-9_]*$/` に合わせ、UI validation で送信前に止める |
| Next dev proxy が runtime visual で不安定 | Phase 11 Playwright は PATCH のみ browser route mock し、画面状態の視覚証跡を local fixture として取得 |

### nav 配線表

| ファイル | 変更 | 内容 |
| --- | --- | --- |
| `apps/web/src/components/shell/shell-config.ts` | edit | `ShellNavItemId` に `"tag-master"` を追加。admin group に `{ id: "tag-master", href: "/admin/tag-master", label: "タグ管理", icon: "tag-master" }` を追加。`tag-queue`（label「タグキュー」）とは別項目として並置 |
| `apps/web/src/components/shell/icons.tsx` | edit | nav id と同一キー `"tag-master"` の SVG path を追加 |

> nav label は tag QUEUE（「タグキュー」）と tag master（「タグ管理」）で明確に分け、member tag assignment UI との混同を避ける（DESIGN-BRIEF §6 リスク対策）。

### 設定項目と定数一覧

| 定数 | 配置（予定） | 役割 |
| --- | --- | --- |
| `conflictMessage` | `TagMasterEditForm.tsx` | error code → 表示文言の単一導出。code_conflict / stale_conflict / not_found / no_update_fields / invalid_body を 1 箇所に集約 |
| `CODE_PATTERN` | `TagMasterEditForm.tsx` | code 形式検証 `/^[a-z0-9][a-z0-9_]{0,63}$/`。API 正本と同じくハイフン不可 |
| `ShellNavItemId` `"tag-master"` | `shell-config.ts` | nav item id（kebab） |

### 不変条件遵守

- mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）。
- 入力は `FormField` 経由（不変条件 #9・`<input>` 直書き禁止）。
- 色は OKLch design token（不変条件 #2・HEX 直書き / `bg-[#xxx]` 禁止）。
- `apps/web` は D1 binding を直接触らない（不変条件 #5）。`apps/api` は一切変更しない（不変条件 #1 / #7）。

### テスト構成（予定）

| ファイル | 役割 |
| --- | --- |
| `apps/web/src/features/admin/api/__tests__/tags.update.spec.ts` | updateTag 200 / 409 code_conflict / 409 stale_conflict / 404 / no_update_fields |
| `apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx` | 一覧描画・行選択・編集到達・成功後 row 反映 |
| `apps/web/app/(admin)/admin/tag-master/page.spec.tsx` | GET `/admin/tags` の `{ total, items }` response shape を page が正しく `TagMasterPanel` へ渡す |
| `apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx` | 一覧描画・行選択・編集到達・差分 PATCH・expectedCode 保持・409 分離表示・ハイフン code validation |
| `apps/web/src/components/shell/__tests__/{SidebarNavItem,shell-config}.spec.tsx?` | tag-master nav 追加・`/admin/tags` との active 衝突なし（regression） |
| `apps/web/playwright/tests/admin-tag-master-code-edit-ui.spec.ts` | 一覧・編集フォーム・conflict 表示の local fixture visual |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-tag-master-authenticated.spec.ts` | 認証済 staging visual |

## 視覚証跡

- **VISUAL**。admin 新規ページ（一覧・編集フォーム・conflict 表示）のスクリーンショット証跡を生む対象。
- 現時点 `implemented_local_evidence_captured` のため local deterministic evidence と local fixture screenshots は取得済み、authenticated staging visual は **pending_user_gate**。
- Phase 11 screenshots:
  - `outputs/phase-11/screenshots/tag-master-list.png`
  - `outputs/phase-11/screenshots/tag-master-edit-form.png`
  - `outputs/phase-11/screenshots/tag-master-code-conflict.png`
  - `outputs/phase-11/screenshots/tag-master-stale-conflict.png`
- authenticated visual capture は staging deploy 後に user-gated で取得し、Gate-C を passed 化する。
