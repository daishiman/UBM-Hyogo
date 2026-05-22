# Implementation Guide

## Part 1: 中学生レベル

### なぜ必要か

学校の生徒会で、先生（管理者）が使う部屋には3つの道具がある。「タグの棚」（生徒の特徴メモ）、「行事予定表」（次の集まりの日）、「お願い箱」（生徒からの非公開依頼）。これまで、案内図では「ここに新しく作る」と書かれていたが、実は道具はもうそこに置いてあった。誰かがまた同じ道具を新しく作ってしまうと、棚が二つになり、どちらが本物か分からなくなる。だから今回は「もう置いてある場所」を正しい名前で書き直し、不要になった出口（会議の CSV を持ち帰るリンク）だけを片付ける。

### 日常の例え

冷蔵庫の中の調味料を別の場所に新しく買って並べ直すのではなく、すでにある棚の位置を地図に正しく書く作業に近い。地図が間違っていると、家族（次の開発者）は同じ調味料を二つ買ってきてしまう。

### 今回作ったもの（何をしたか）

- 管理画面の「行事予定表」（`MeetingPanel`）から、現状サーバーで未提供の「CSV を持ち帰るリンク」を一つ取り除いた
- このリンクが消えたことを確認する小さなテストを更新した
- 案内図（`docs/00-getting-started-manual/specs/09-ui-ux.md` と `09g-screen-blueprints-admin.md`）のパス表記を、実物がある場所（`apps/web/app/(admin)/admin/...`、`apps/web/src/components/admin/...`、`apps/web/src/lib/admin/...`）に揃えた
- スキル側（`aiworkflow-requirements`）の正本仕様を、現行の API 契約（`POST /admin/requests/:noteId/resolve` ボディ `{ resolution, resolutionNote? }`）に合わせて直した

## Part 2: 技術者レベル

### TypeScript 型定義

実装は既存ファイルに閉じている。task-16 で参照する公開 contract は以下:

```ts
// apps/web/src/components/admin/MeetingPanel.tsx
export interface MeetingItem {
  sessionId: string;
  title: string;
  heldOn: string; // ISO date (YYYY-MM-DD)
  note: string | null;
  createdAt: string;
  attendance?: Array<{ memberId: string; assignedAt?: string; assignedBy?: string }>;
}
export interface MeetingsListView { total: number; items: MeetingItem[]; }
export interface MemberCandidate { memberId: string; fullName: string; }

// admin request resolve (apps/api 側)
type AdminRequestResolveBody = {
  resolution: "approved" | "rejected" | "needs_more_info";
  resolutionNote?: string;
};
```

### APIシグネチャ

```http
POST /admin/requests/:noteId/resolve
Content-Type: application/json
Authorization: <admin session cookie>

{ "resolution": "approved", "resolutionNote": "本人確認完了" }
```

旧仕様 `POST /admin/requests/:noteId/decision` および `decision: "approved" | ...` は採用しない。

### 使用例

```tsx
// apps/web/src/components/admin/MeetingPanel.tsx 内の出席追加
await addAttendance(m.sessionId, selectedMemberId);
// 422 を受け取った場合は Toast でエラーを通知（不変条件 #15）
```

### エラーハンドリング

| 状況 | 期待挙動 |
| --- | --- |
| `addAttendance` が 422 を返す | UI 側で Toast エラーを表示し、入力フォーカスを保持する |
| `removeAttendance` が 404 を返す | 楽観的 UI 反映を取り消し、行を再取得する |
| `createMeeting` の `heldOn` が不正 | サーバーが 422、UI は inline error |
| `/admin/requests/:noteId/resolve` が 409 | 同時編集競合として再取得を促す |
| 認証切れ (`401`) | `/login` へリダイレクト |

### エッジケース

- 既に出席登録済みの会員: 候補に表示はするが `disabled` で再追加できない
- `isDeleted=true` の会員: server で除外済。UI 側 `filterCandidates` で二重防御
- CSV エクスポート導線: API 未提供のため UI から除去（task-16 スコープ）。将来サーバー実装が入った際に再導入する
- 管理者 session が member session に切り替わっている場合: 401→/login redirect で終了

### 設定項目と定数一覧

実装でハードコードしている定数は無い。参照する environment / contract:

- `INTERNAL_API_BASE_URL`: `apps/web` から `apps/api` 呼び出しの内部ベース URL
- `apps/web/src/lib/admin/api.ts`: `createMeeting` / `updateMeeting` / `addAttendance` / `removeAttendance` を集約

### テスト構成

```bash
mise exec -- pnpm --filter web test apps/web/src/components/admin/__tests__/MeetingPanel.test.tsx
```

- 対象: `MeetingPanel.test.tsx` 内の CSV link 非表示 regression 1 件 + 出席追加・削除・更新の既存 spec
- 期待: PASS、CSV link を含む `<a>` が DOM に存在しないこと

### 視覚証跡

UI を含むタスクのため canonical screenshot は VISUAL_ON_EXECUTION 区分で以下のパスに出力される（runtime 取得は user-gated のため本サイクルでは pending）:

- `outputs/phase-11/screenshots/admin-tags-queue.png`
- `outputs/phase-11/screenshots/admin-meetings-table.png`
- `outputs/phase-11/screenshots/admin-meetings-edit.png`
- `outputs/phase-11/screenshots/admin-requests-visibility.png`
- `outputs/phase-11/screenshots/admin-requests-delete.png`

現状: `IMPLEMENTED_LOCAL_RUNTIME_PENDING`。runtime screenshot / staging smoke / commit / push / PR は user 明示承認後のみ実行する。
