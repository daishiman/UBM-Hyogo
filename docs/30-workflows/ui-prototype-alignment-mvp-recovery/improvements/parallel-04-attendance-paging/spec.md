# parallel-04-attendance-paging 実装仕様書

**実装区分**: 実装仕様書  
**対象改善**: G4-1: AttendanceList の cursor paging UI  
**ステータス**: ✅ 実装完了  

> **2026-05-15 supersession note**: Issue #372 の API 正本同期後、初期 attendance page は default 50 件、追加取得は `GET /api/me/attendance?cursor=<opaque>` が現行契約。旧記述の「20 件」および `POST` は撤回し、`docs/30-workflows/completed-tasks/parallel-04-attendance-paging-ui/` を Phase 1-13 形式の実装 close-out 正本とする。

## 1. 目的

`GET /api/me/attendance?cursor=xxx` の cursor paging API に対応する UI を実装し、ユーザーが初期 default 50 件表示後に「もっと見る」ボタンで追加読込を可能にする。

## 2. スコープ (G4-1)

- AttendanceList（参加履歴一覧）の paging UI 実装
- 初回 default 50 件表示（profile page の Server Component で fetch）
- 「もっと見る」ボタンでの追加読込
- hasMore フラグによるボタン制御
- 読込中・エラー状態の表示

## 3. 変更対象ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/app/profile/_components/AttendanceList.tsx` | Client Component | cursor paging UI 実装 |
| `apps/web/app/profile/page.tsx` | Server Component | 初回 attendance fetch、props 受け渡し |
| `apps/web/src/lib/api/me-types.ts` | 型定義 | MeAttendancePageResponse 型定義 |

## 4. 設計

### 4.1 Server/Client 境界

- **Server (profile/page.tsx)**
  - `fetchAuthed("/me/profile")` で初回 default 50 件を取得
  - `profile.attendance` と `profile.attendanceMeta` を AttendanceList へ props 受け渡し

- **Client (AttendanceList.tsx)**
  - `"use client"` directive で Client Component 化
  - 初期状態に attendance と attendanceMeta を受け取る
  - 「もっと見る」click で client-side fetch で次ページ取得
  - append 形式で items state に追加

### 4.2 状態管理

```tsx
const [items, setItems] = useState<Item[]>(() => [...attendance]);
const [cursor, setCursor] = useState<string | null>(
  attendanceMeta?.nextCursor ?? null
);
const [hasMore, setHasMore] = useState<boolean>(
  attendanceMeta?.hasMore ?? false
);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### 4.3 API response shape

**cursor 形式 (API 確認済 2026-05-15)**:
- `apps/api/src/routes/me/schemas.ts:123` で `nextCursor: z.string().nullable()` と定義
- 実体は `(heldOn, sessionId)` のタプルを base64url encode した opaque string
- API 側に `encodeAttendanceCursor / decodeAttendanceCursor` helper あり (test ファイル `apps/api/src/routes/me/index.contract.spec.ts:352` で `decodeAttendanceCursor` 利用例)
- **フロント側は opaque として扱う** — encode/decode せず、サーバから返ってきた string をそのまま次回 query に流す

```typescript
// GET /api/me/attendance?cursor=xxx
interface MeAttendancePageResponse {
  readonly records: ReadonlyArray<MeAttendanceRecord>;
  readonly hasMore: boolean;
  readonly nextCursor: string | null; // opaque base64url, frontend では値の中身を解釈しない
}

interface MeAttendanceRecord {
  readonly sessionId: string;
  readonly title: string;
  readonly heldOn: string;
}
```

### 4.4 エラー処理

- fetch 失敗時は error state に message を保持
- UI に `role="alert"` で error 表示
- button は loading 中のみ disabled（error 後は再試行可能）

## 5. 関数シグネチャ

```tsx
"use client";

export interface AttendanceListProps {
  readonly attendance: MemberProfile["attendance"];
  readonly attendanceMeta?: MemberProfile["attendanceMeta"];
}

type Item = MemberProfile["attendance"][number];

export function AttendanceList({ attendance, attendanceMeta }: AttendanceListProps): JSX.Element
```

## 6. 入出力・副作用

| 項目 | 仕様 |
|------|------|
| **初期レンダリング** | attendance props を state にコピー |
| **loadMore button click** | GET `/api/me/attendance?cursor=xxx` を call |
| **fetch 成功** | records を items に append、cursor・hasMore を更新 |
| **fetch 失敗** | error state を設定、button は操作可能に戻す |
| **hasMore === false** | button を DOM から削除 |
| **loading 中** | button disabled、テキスト「読み込み中…」に変更 |

## 7. テスト方針

- **Unit (Vitest)**
  - 初期 props で render → items, cursor, hasMore の state が正しく初期化される
  - ボタン click → fetch mock が URL に cursor 含んで call される
  - fetch 成功 → records が items に append される
  - nextCursor = null → hasMore = false でボタン非表示
  - fetch 失敗 → error message 表示、button 再度 enabled
  
- **Integration**
  - profile smoke test で AttendanceList が render される
  - ボタン動作が e2e で確認される

## 8. ローカル実行コマンド

```bash
# type check
mise exec -- pnpm typecheck

# unit tests
mise exec -- pnpm --filter @ubm-hyogo/web test -- AttendanceList

# profile page smoke test
mise exec -- pnpm --filter @ubm-hyogo/web test -- profile
```

## 9. DoD (Definition of Done)

- [x] 初回表示で default 50 件の attendance items が DOM に render
- [x] 「もっと見る」ボタンが hasMore=true の時に表示
- [x] button click で `/api/me/attendance?cursor=xxx` を fetch
- [x] fetch 成功 → items に append (前の state + new records)
- [x] nextCursor=null または hasMore=false でボタン非表示
- [x] fetch 失敗時に error message を alert role で表示
- [x] loading 中は button disabled、テキスト「読み込み中…」
- [x] AttendanceList の JSDoc に issue-372 参照を明記
- [x] 既存 profile smoke test が PASS
- [x] edge case: items.length === 0 時は「まだ参加履歴がありません」

## 10. リスク & 対応

| リスク | 対応 |
|--------|------|
| Client Component 化による hydration mismatch | `"use client"` directive を先頭に配置、useState の初期化を props 経由で行う |
| profile page cache 戦略との競合 | `export const dynamic = "force-dynamic"` を page.tsx で明示（変更なし） |
| cursor URL encode 不足 | fetch URL で `encodeURIComponent(cursor)` を使用 |
| items append 時の key 重複 | sessionId を key にするため重複なし |

## 11. 実装概要

AttendanceList.tsx は既に issue-372 対応で実装完了：

1. **初期化**: attendance / attendanceMeta を props から受け取り state 初期化
2. **loadMore 関数**: cursor ありで `/api/me/attendance?cursor=...` を fetch
3. **state 更新**: setItems で prev + new records を append
4. **button UI**: hasMore && ボタン表示、loading 中は disabled
5. **error handling**: catch で error state 設定、alert role で表示
6. **edge case**: items.length === 0 時に empty message

## 12. 補足

- **コンポーネント位置**: `/apps/web/app/profile/_components/AttendanceList.tsx`
- **型定義同期**: `/apps/web/src/lib/api/me-types.ts` と API パッケージ `/me/schemas.ts` の drift 検出は phase-09 typecheck で実施
- **呼び出し元**: `/apps/web/app/profile/page.tsx` の Server Component から props 受け渡し
