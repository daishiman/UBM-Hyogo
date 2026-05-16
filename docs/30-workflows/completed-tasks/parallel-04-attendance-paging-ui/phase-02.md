# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

Phase 1 で確定した論点採用案を、コンポーネント構造・型定義・状態遷移・I/O 契約まで落とし込む。

## 2.1 ファイル変更計画

| パス | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/app/profile/_components/AttendanceList.tsx` | 新規 | Client Component / paging UI |
| `apps/web/app/profile/page.tsx` | 編集 | 初回 attendance fetch、props 受け渡し |
| `apps/web/src/lib/api/me-types.ts` | 編集 | `MeAttendancePageResponse` 型追加 |
| `apps/web/app/profile/_components/AttendanceList.spec.tsx` | 新規 | Vitest unit test |

## 2.2 型定義

```ts
// apps/web/src/lib/api/me-types.ts
export interface MeAttendanceRecord {
  readonly sessionId: string;
  readonly title: string;
  readonly heldOn: string; // ISO date (YYYY-MM-DD)
}

export interface MeAttendanceMeta {
  readonly hasMore: boolean;
  readonly nextCursor: string | null; // opaque base64url
}

export interface MeAttendancePageResponse {
  readonly records: ReadonlyArray<MeAttendanceRecord>;
  readonly hasMore: boolean;
  readonly nextCursor: string | null;
}
```

## 2.3 関数シグネチャ

```tsx
// apps/web/app/profile/_components/AttendanceList.tsx
"use client";

export interface AttendanceListProps {
  readonly attendance: MemberProfile["attendance"];
  readonly attendanceMeta?: MemberProfile["attendanceMeta"];
}

export function AttendanceList(props: AttendanceListProps): JSX.Element;
```

## 2.4 状態遷移

```
initial(props) ──> idle ──click──> loading ──ok──> idle (items appended)
                              │                    │
                              └──err──> error ────retry──┘
loading ──ok(nextCursor=null)──> done(button hidden)
```

State shape:
```ts
const [items, setItems] = useState<Item[]>(() => [...attendance]);
const [cursor, setCursor] = useState<string | null>(attendanceMeta?.nextCursor ?? null);
const [hasMore, setHasMore] = useState<boolean>(attendanceMeta?.hasMore ?? false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

## 2.5 I/O 契約

| トリガー | 入力 | 副作用 | 出力 |
| --- | --- | --- | --- |
| 初期 render | `attendance`, `attendanceMeta` props | state 初期化 | items / button 表示 |
| button click | `cursor` state | `fetch(/api/me/attendance?cursor=encodeURIComponent(cursor))` | items append / state 更新 |
| fetch 200 | `MeAttendancePageResponse` body | setItems(prev=>[...prev,...records]) / setCursor / setHasMore | DOM 更新 |
| fetch !200 / network err | — | setError(message) | role="alert" 表示 |

## 2.6 Server Component 連携

```tsx
// apps/web/app/profile/page.tsx
const profileRes = await fetchAuthed<MeProfileResponse>("/me/profile");
return (
  <AttendanceList
    attendance={profileRes.profile.attendance}
    attendanceMeta={profileRes.profile.attendanceMeta}
  />
);
```

## 2.7 OKLch token 利用

- button: `bg-[var(--ubm-color-accent)] text-[var(--ubm-color-surface-panel)] hover:opacity-90`
- error: `text-[var(--ubm-color-danger)]`
- empty / muted: `text-[var(--ubm-color-text-muted)]`
- spacing: `space-y-2`, `mt-4`
- HEX 直書きは禁止。任意値 class は `var(--ubm-*)` token 参照のみ許可

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/component-design.md | 設計主成果物 |

## 完了条件

- [x] ファイル変更計画が確定
- [x] 型定義が確定
- [x] 関数シグネチャが確定
- [x] 状態遷移が図示
- [x] I/O 契約が表形式で確定

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: 4 つの設計事項（型・シグネチャ・状態・I/O）をレビュー対象に固定
