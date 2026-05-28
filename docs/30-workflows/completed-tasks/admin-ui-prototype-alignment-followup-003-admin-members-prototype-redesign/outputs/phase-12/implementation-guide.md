# /admin/members prototype redesign - 実装ガイド

## メタ情報

| 項目 | 内容 |
| --- | --- |
| 機能名 | /admin/members prototype redesign |
| 作成日 | 2026-05-27 |
| 対象読者 | 開発者・技術者・学習者 |

## Part 1

### なぜ必要か

管理画面の会員一覧は、回答データや公開状態を毎日確認する場所です。ここが試し打ち環境でうまく表示されなかったり、見た目が見本と違ったりすると、管理者はどこを見ればよいか迷います。

### 何をするか

この仕様では、会員一覧を見本の画面に近づけます。会員の名前、メール、公開状態、編集ボタン、詳細の引き出し画面を整理し、画面がデータを取りに行けないときの原因も先に切り分けます。

### 日常の例え

たとえば: 学校の出席簿で、名前の列、連絡先の列、出欠の列がばらばらだと先生は確認に時間がかかります。今回の作業は、出席簿の並びをそろえ、欠席理由の欄も決まった場所に置く作業に近いです。

### 今回作ったもの

| 日本語 | 英語 | 役割 |
| --- | --- | --- |
| 会員一覧の見本合わせ | prototype alignment | 見本画面に合わせて並びと見た目をそろえる |
| 画面内の引き出し | drawer | 1人分の詳しい情報を同じページで見る |
| 公開切替 | publish switch | 会員を公開するか非公開にするか切り替える |
| 失敗原因の切り分け | route-cause analysis | 404の原因を推測で直さず確認する |
| 試し打ち画像 | visual evidence | 画面が見本どおりか確認する画像 |

## Part 2

### アーキテクチャ設計

The implementation is an in-place rewrite of the existing admin members page.
`apps/web/app/(admin)/admin/members/page.tsx` remains the page owner, while `_members/*` components own UI state and rendering.
Shared UI additions stay under `_members/` or `_shared/` and do not introduce new API or D1 contracts.

### インターフェース定義

- List data remains `AdminMemberListView` from `@ubm-hyogo/shared`.
- Detail data remains `AdminMemberDetailView`.
- UI-only gaps such as hue, missing list tags, zone, and occupation are adapted in the web layer.
- Mutations go through `useAdminMutation`.

### 型定義

```ts
export type MemberHue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface MemberPublishSwitchProps {
  readonly memberId: string;
  readonly publishState: PublishState;
  readonly isDeleted: boolean;
  readonly onSuccess?: (next: PublishState) => void;
}
```

### APIシグネチャ

```http
GET /admin/members?filter=published|hidden|deleted&q=<query>
GET /admin/members/:memberId
PATCH /admin/members/:memberId/status
POST /admin/members/:memberId/delete
```

No new endpoint is introduced by this workflow.

### 使用例

```ts
await mutation.trigger({ publishState: "public" });
```

The UI optimistically updates the switch, rolls back on failure, and shows a toast.

### エラーハンドリング

- Unauthenticated admin requests must resolve to 401, not a route-level 404.
- Section fetch failures continue to render `AdminSectionErrorClient`.
- Drawer detail fetch failures are shown inside the drawer, not as a page crash.

### エッジケース

- Deleted members disable publish switching.
- List rows may not include tags, zone, occupation, or photo URL; the list shows placeholders and the drawer remains the detail source.
- Local visual capture is present under `outputs/phase-11/screenshots/`.
- Authenticated staging visual baseline capture remains user-gated.

### 設定項目と定数一覧

| Name | Value / Source |
| --- | --- |
| viewport matrix | 390x844, 834x1112, 1280x800, 1440x900 |
| visual states captured locally | loaded, empty, published, hidden |
| hue range | 0..7 |
| filter UI values | all, public, private, deleted |
| server filter values | empty, published, hidden, deleted |

### セキュリティ・運用上の禁止事項

- Do not add new D1 bindings from `apps/web`.
- Do not add new API endpoints or schema fields in this workflow.
- Do not use HEX literals or arbitrary color classes.
- Do not create parallel `V2` components for the in-place rewrite.

### テスト構成

- Focused Vitest component specs for primitives, filters, table, drawer, and shell.
- API regression spec for unauthenticated 401 if the H2 route-cause is confirmed.
- Focused Vitest matrix: PASS (7 files / 25 tests).
- `pnpm --filter @ubm-hyogo/web typecheck`: PASS.
- Local Chrome visual matrix: PASS (16 screenshots).

### 下流タスク連携

API list enrichment, persisted tag editing, photo-backed avatars, and list-zone chips are intentionally excluded because they require API or storage contract changes.
