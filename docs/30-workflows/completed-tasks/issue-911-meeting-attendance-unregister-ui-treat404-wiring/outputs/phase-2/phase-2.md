**[実装区分: 実装仕様書]**

# Phase 2: ドメイン定義 / 用語集 / 状態遷移

## 0. 入力

- Phase 1 の FR-1〜FR-8 / NFR-1〜NFR-7 / AC-1〜AC-9
- `apps/api/src/routes/admin/meetings.ts:200-249` の attendance endpoint 挙動仕様
- `apps/web/src/features/admin/hooks/useAdminMutation.ts` の `treat404AsSuccess` policy 仕様

## 1. ドメイン用語集

| 用語 | 定義 | 出典 |
|---|---|---|
| Attendance | 「ある meeting (`sessionId`) に対する、ある member (`memberId`) の出席記録」を表すドメインエンティティ | `apps/api/src/routes/admin/meetings.ts` の `addAttendance` / `removeAttendance` |
| Attendance Candidate | meeting 詳細画面において、その meeting に対し出席登録が可能な member 候補のリスト要素。`detail.candidates` 配列の各要素 | `MeetingAttendancePanel.tsx` `Candidate` 型 |
| Registered State | UI 上で「ある candidate が attendance を持っている」と表現する状態。`registered: Set<memberId>` で管理 | `MeetingAttendancePanel.tsx` `registered` state |
| Register Mutation | `attended: true` を payload に持つ POST mutation。出席を新規に追加する責務 | 本タスク・既存実装 |
| Unregister Mutation | `attended: false` を payload に持つ POST mutation。既存出席を解除する責務 | 本タスク・新規 |
| DELETE-race | 複数管理者が同一 attendance を並行で解除した際、後発リクエストが 404 `attendance_not_found` を受ける状況 | 親 workflow issue-842 |
| `treat404AsSuccess` policy | `useAdminMutation` の option。404 を「成功相当」に倒し、`onSuccess` 相当の路（toast / `router.refresh()`）を辿らせる挙動 | `useAdminMutation.ts:30-31, 47-48, 240-246` |
| Idempotent Sink | 「解除済み」という状態が冪等な終端である性質。register は冪等でない（duplicate→409）、unregister は冪等（404 を成功相当に倒せば常に「解除済み」に収束） | 本仕様書（issue-842 を踏襲） |
| `attendance_not_found` | API 側で `removeAttendance` が unattended な (member, session) ペアに対し返す 404 エラーコード | `apps/api/src/routes/admin/meetings.ts:240` |

## 2. UI 上の Attendance 状態モデル

UI が管理する **client-side state** は、各 candidate `memberId` に対し以下 2 値の boolean である。

```
RegisteredState(memberId) ∈ { true, false }
```

サーバー側の真実は D1 の `meeting_attendances` テーブルにあるが、UI は楽観 set `registered: Set<memberId>` で表現する。初期値は `detail.attendees` から生成する（既存実装と互換）。

## 3. 状態遷移図

```
                       click "出席登録"
       ┌────────────────────────────────────────┐
       │  POST attended:true                    │
       ▼                                        │
  [registered=false] ────────────────────► [registered=true]
       ▲                                        │
       │                          click "出席解除"
       │                                        │
       │              POST attended:false        │
       │           ┌────────────────────────────┘
       │           ▼
       │     200 OK / 404 (既に解除済み)
       └──────────┘ (treat404AsSuccess で吸収)
```

- `registered=false → true`: `register mutation` の 200 OK で発火。409（duplicate）は楽観的に `true` へ収束させる（既存実装 A4）。422（deleted member）/ 5xx は false のまま fail toast。
- `registered=true → false`: `unregister mutation` の 200 OK で発火。**404 (`attendance_not_found`) は `treat404AsSuccess` により 200 と同じ路を辿り false へ収束**。5xx / network error は true のまま fail toast。

## 4. Mutation 責務分割

| mutation | endpoint | method | payload | `treat404AsSuccess` | `refreshOnSuccess` | 成功 toast |
|---|---|---|---|---|---|---|
| `registerMutation` (既存) | `/api/admin/meetings/:id/attendances` | POST | `{ memberId, attended: true }` | **未指定（既定 false）** | `false` | `"出席を登録しました"`（UI 側 setToast） |
| `unregisterMutation` (新規) | 同上 | POST | `{ memberId, attended: false }` | `{ toast: "既に解除済みです" }` | `false` | `"出席を解除しました"`（UI 側 setToast） |

**重要な隔離原則:**

1. mutation を 2 本に分離して宣言する。同一 endpoint を共有するが option が異なるため共有不可。
2. `treat404AsSuccess` は **unregister 側にのみ**設定。register 側には書かない（既定 false を維持）。これにより register 側 404（session/member not found）は引き続き失敗扱いで `"開催日または会員が見つかりません"` toast を出す（既存挙動 A6b）。
3. 共通の endpoint URL を `const endpoint = ...` で抽出しても良いが、option object は別物として扱う。

## 5. API 側挙動の追認（変更しない）

`apps/api/src/routes/admin/meetings.ts:200-249` の現状挙動を仕様として固定する。

| condition | response status | response body |
|---|---|---|
| `attended:true` 成功 | 200 | `{ ok: true, attended: true }` |
| `attended:true` & session_not_found | 404 | `{ ok: false, error: "session_not_found" }` |
| `attended:true` & member_not_found | 404 | `{ ok: false, error: "member_not_found" }` |
| `attended:true` & deleted_member | 422 | `{ ok: false, error: "member_is_deleted" }` |
| `attended:true` & duplicate | 409 | `{ ok: false, error: "attendance_already_recorded" }` |
| `attended:false` 成功 | 200 | `{ ok: true, attended: false }` |
| `attended:false` & attendance_not_found | 404 | `{ ok: false, error: "attendance_not_found" }` |

UI 側は status を見て branch する。`useAdminMutation` の `treat404AsSuccess` は status === 404 でのみ発火するため、`attendance_not_found` / `member_not_found` / `session_not_found` を error code レベルで識別する必要はない（unregister mutation は `attended:false` 経路でしか呼ばれないため、404 は実質 `attendance_not_found` のみ）。

## 6. Audit log との整合

| 経路 | audit append される？ |
|---|---|
| `attended:true` 200 | `attendance.add` を append |
| `attended:true` 4xx / 5xx | append なし |
| `attended:false` 200 | `attendance.remove` を append |
| `attended:false` 404 (`attendance_not_found`) | **append なし**（line 240 で early return） |

**含意:** unregister 404 を UI 側で「成功相当」に倒すが、audit log は append されない。これは「他者が既に append 済み」という前提が成立しているため重複 append を避ける既存挙動として正しい（親 workflow issue-842 が許容済み）。本タスクで変更しない。

## 7. Idempotent Sink 性質の根拠

unregister mutation は冪等である:

- 初回 click: 200 OK → registered=false へ反転
- 直後の 2 回目 click (同一 memberId): API 側で `attendance_not_found` → 404 → `treat404AsSuccess` で UI は registered=false を維持
- 任意回数の重複 click: 常に registered=false に収束

これにより DELETE-race（A 管理者が解除直後 B 管理者が解除を試みる）も B 側 UI で error toast が出ず `"既に解除済みです"` の status toast に倒れる。

## 8. UI DOM 形状（contract）

```
<li data-testid="attendance-candidate" data-member="m1">
  山田 (m1)
  <button data-testid="attendance-register"  data-member="m1" data-registered="false|true">出席登録 | 登録済</button>
  <button data-testid="attendance-unregister" data-member="m1" data-registered="false|true" hidden={!registered}>出席解除</button>
</li>
```

代替案（Phase 3 で確定）:

- 案 A: 同一 `<li>` 内で register / unregister button を相互排他表示（registered=true なら register hidden / unregister visible）。
- 案 B: 同一 `<li>` 内で両 button を常時 visible、registered=true なら register を disabled、registered=false なら unregister を disabled。
- 案 C: 既存 register button のみで textContent を切り替え（解除導線が click 同一 button になる）— 既存 A2 spec が `textContent === "登録済"` を断定しており、click 動作も差分が出るため**不採用**。

Phase 3 で **案 A を採用**する（spec の DOM 検査がもっとも明快、既存 A2 spec を破壊しない）。

## 9. Phase 2 完了条件

- [x] ドメイン用語 10 件を定義
- [x] UI 状態モデル（`registered: Set<memberId>`）を明示
- [x] 状態遷移図（register / unregister / 404 race 吸収）を記述
- [x] mutation 責務分割表（endpoint / method / payload / option）を確定
- [x] API 側挙動 7 ケースを追認（変更しない）
- [x] Audit log との整合（404 経路で append なし）を確認
- [x] Idempotent Sink 性質の論証
- [x] UI DOM 形状の 3 案を提示し Phase 3 で確定すべき選択を明示

## 10. 次 Phase への引き継ぎ

Phase 3 では (a) 案 A の DOM 形状確定、(b) AC-1..AC-9 の具体的 spec ケース番号への割り当て、(c) Gate-A 提示（spec_review）に必要な diff サマリ、(d) typecheck / lint / vitest の検証順序、を文書化する。
