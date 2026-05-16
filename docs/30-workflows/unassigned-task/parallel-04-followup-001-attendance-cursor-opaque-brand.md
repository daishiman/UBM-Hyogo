# attendance cursor を OpaqueCursor brand 型化 - タスク指示書

## メタ情報

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| タスクID     | parallel-04-followup-001-attendance-cursor-opaque-brand    |
| タスク名     | attendance cursor を OpaqueCursor brand 型でフロント/API 共通化 |
| 分類         | 改善                                                       |
| 対象機能     | `/api/me/attendance` cursor paging API + AttendanceList UI |
| 優先度       | 低                                                         |
| 見積もり規模 | 小規模                                                     |
| ステータス   | 未実施                                                     |
| 発見元       | parallel-04 Phase 12 lessons-learned L-P04-002 / L-P04-004 |
| 発見日       | 2026-05-15                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

parallel-04 で `apps/web/app/profile/_components/AttendanceList.tsx` を実装した際、cursor は API 側で `encodeAttendanceCursor` / `decodeAttendanceCursor` の helper を持つ opaque base64url string として扱う契約（`docs/00-getting-started-manual/specs/01-api-schema.md` §Attendance pagination）になっている。フロント側は `string | null` で受け取り、`encodeURIComponent` 経由で URL に流す前提だが、型レベルで「parse 禁止」を強制する仕組みがない。

### 1.2 問題点・課題

- `string` 型のままだとフロントで誤って `cursor.split(":")` 等の parse を書いてしまうリスクが残る。
- API 側が encoding を変更した瞬間、parse 依存のフロントコードが silent に壊れる。
- `lessons-learned-parallel-04-attendance-paging-ui-2026-05.md` L-P04-002 で「将来 brand 型化推奨」と記録済。

### 1.3 放置した場合の影響

- 後続の admin attendance UI / member detail attendance UI で同様の opaque cursor を扱う際、parse 禁止ルールが暗黙知のままになる。
- API encoding 変更時の影響範囲を grep で機械的に検出できない。

---

## 2. 何を達成するか（What）

- `packages/shared` 等の共有モジュールに `type OpaqueCursor = string & { readonly __brand: "OpaqueCursor" }` を追加。
- `apps/api/src/routes/me/schemas.ts` の `nextCursor: z.string().nullable()` が返す型を `OpaqueCursor | null` に narrow。
- `apps/web/src/lib/api/me-types.ts` の `MeAttendancePageResponse.nextCursor` を `OpaqueCursor | null` 型に切替。
- AttendanceList.tsx の `cursor` state も `OpaqueCursor | null` 型に統一。

## 3. 受け入れ条件（Acceptance Criteria）

- TypeScript build で cursor を `split` / `parseInt` / `JSON.parse` するコードが存在しないこと（型エラー化）。
- API → UI の round-trip で cursor 値が変化しないこと（既存 `AttendanceList.spec.tsx` の `cursor?x=1&y=2` fixture が継続 PASS）。
- 既存の `decodeAttendanceCursor` helper のみ `OpaqueCursor` を解釈できる責務を持つこと。

## 4. スコープ外

- `hasMore` / `nextCursor` の discriminated union 化（→ `parallel-04-followup-002-attendance-meta-required-discriminated-union.md` で別途扱う）。
- D1 schema 変更、API endpoint 変更。
