**[実装区分: 実装仕様書]**

# Phase 1: 要件定義 / スコープ確定 / 既存実装インベントリ

## 0. メタ情報

| key | value |
|---|---|
| workflow root | `docs/30-workflows/completed-tasks/issue-911-meeting-attendance-unregister-ui-treat404-wiring/` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| implementation_mode | `extend`（既存 MeetingAttendancePanel に解除 UI + mutation を追加） |
| source issue | https://github.com/daishiman/UBM-Hyogo/issues/911 |
| parent workflow | `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/` |
| 状態 | `completed` |

## 1. 背景

issue #911 起票時の設計は「`apps/api` 側で新規 DELETE attendance route を追加し、その caller の MeetingAttendancePanel に `treat404AsSuccess` を配線する」ことを想定していた。しかし最新コード実測により、状況が変化していることが判明した。

- **`useAdminMutation` の `treat404AsSuccess` policy は issue-842 で既実装**: `apps/web/src/features/admin/hooks/useAdminMutation.ts` line 30-31（型定義 `false | "silent" | { readonly toast: string }`）、line 47-48（option 受け口）、line 240-246（404 を成功相当に倒すブランチ）が確認できる。policy 側に追加実装は要らない。
- **既存 POST `/api/admin/meetings/:id/attendances` endpoint は attended:true/false 双方を実装済み**: `apps/api/src/routes/admin/meetings.ts:200-249` で `parsed.data.attended === false` 経路が `removeAttendance(db, memberId, sessionId)` を呼び、unattended の場合 404 `attendance_not_found` を返す。audit log も `attendance.remove` で正しく append される。**新規 DELETE method route の追加は不要**。
- **MeetingAttendancePanel.tsx は解除 UI が存在しない**: line 1-101 を全読した結果、`registerMutation` 1 本のみ、UI の `<button>` も `data-testid="attendance-register"` 1 種だけで、解除導線が UI に露出していない。これが #911 の根本問題。
- production caller の DELETE / unregister 呼び出しは grep でゼロ件（spec 内のみ）。

CLAUDE.md「UI prototype alignment / MVP recovery」不変条件 1「既存 API endpoint surface のみ利用。新 endpoint 追加・D1 schema 変更禁止」に従い、本タスクの最適解は **UI 側に解除 button + 第 2 mutation を追加し、解除 mutation に `treat404AsSuccess` を配線する** ことで完結する。1 サイクル内で UI + spec + 検証まで終わるため CONST_007 にも整合する。

## 2. 現状コードインベントリ（実測）

| path | 役割 | 改修方針 |
|---|---|---|
| `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` | `/admin/meetings/[id]` の出席登録 UI。`registerMutation` 1 本、register button のみ | **解除 button (`data-testid="attendance-unregister"`) + `unregisterMutation` (`treat404AsSuccess: { toast: "既に解除済みです" }`) を追加**。register mutation / button は無改変 |
| `apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx` | 既存 A1..A8 spec | **A1..A8 は無改変**。B1..B5（解除成功 / 解除 404=成功相当 / 解除 5xx 失敗 / register と隔離確認 / registered=false 行で解除 button 非表示）を追加 |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | `treat404AsSuccess` policy 既実装 (line 30-31 / 47-48 / 240-246) | **無改変**。本タスクは consumer 側の配線のみ |
| `apps/api/src/routes/admin/meetings.ts` (line 200-249) | POST `/meetings/:id/attendances` で `attended: true|false` 双方実装済み、`attended:false` 経路で 404 `attendance_not_found` を返す | **無改変**。新 endpoint 追加禁止（CLAUDE.md UI prototype alignment 不変条件 1） |

新規作成対象: **無し**（実装は既存 2 ファイルの編集のみ。新規ファイルなし。CLAUDE.md 不変条件 8「新規 test ファイルは `*.spec.{ts,tsx}` のみ」も既存 spec を拡張するため抵触なし）。

## 3. 機能要件

| ID | 要件 |
|---|---|
| FR-1 | `MeetingAttendancePanel.tsx` に `unregisterMutation = useAdminMutation(endpoint, "POST", { treat404AsSuccess: { toast: "既に解除済みです" }, refreshOnSuccess: false })` を **register mutation と別に** 宣言する |
| FR-2 | candidate `<li>` 内に `data-testid="attendance-unregister"` button を追加。`registered.has(memberId) === true` のときのみ visible（または enabled）にする |
| FR-3 | 解除 button click は `unregisterMutation.trigger({ memberId, attended: false })` を発火する |
| FR-4 | 解除 200 OK 時、`registered` Set から該当 memberId を削除し、toast に `"出席を解除しました"` を表示する。register 側の button (`data-testid="attendance-register"`) の `data-registered` も `"false"` に反転する |
| FR-5 | 解除 404 (`attendance_not_found`) は `treat404AsSuccess.toast` の `"既に解除済みです"` が表示され、`onSuccess` 相当の路で `registered` Set からも削除する |
| FR-6 | 解除 5xx / network error は既存 register と同様 `登録に失敗 (status)` 系の toast、または `"解除に失敗 (status)"` 系の toast で失敗扱い（実装は Phase 4 で決定。本仕様では 5xx は明示的に失敗扱いとする） |
| FR-7 | register mutation は無改変。register 側 POST `attended:true` の 404 は引き続き失敗扱いで `"開催日または会員が見つかりません"` toast を保つ |
| FR-8 | `MeetingAttendancePanel.spec.tsx` に B1..B5 spec を追加し、A1..A8 は無改変で全件 pass を保つ |

## 4. 非機能要件

| ID | 要件 |
|---|---|
| NFR-1 | `apps/api/**` および D1 schema に差分を出さない（CLAUDE.md UI prototype alignment 不変条件 1） |
| NFR-2 | `apps/web` から D1 直接アクセス禁止の原則を維持（mutation は既存 endpoint を経由） |
| NFR-3 | 新規 test ファイルは作らない。既存 spec を拡張する（CLAUDE.md 不変条件 8） |
| NFR-4 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（CLAUDE.md 不変条件 10）。legacy `@/lib/useAdminMutation` を新規参照しない |
| NFR-5 | UI で OKLch token に違反する HEX 直書きを増やさない（既存 panel に色は付いていない / visual baseline 変更なしのため `NON_VISUAL`） |
| NFR-6 | 1 サイクル内完了（CONST_007）。UI 改修 + spec 追加 + typecheck + lint + vitest を 1 PR で完結 |
| NFR-7 | register / unregister mutation は **互いに独立** であり、片方の 404 policy が他方に漏れない（型・宣言レベルで隔離） |

## 5. 受け入れ基準（AC）

- AC-1: `MeetingAttendancePanel.tsx` に `data-testid="attendance-unregister"` button が registered=true の候補行に対してのみ可視化される
- AC-2: 解除 button click は `useAdminMutation(endpoint, "POST", { treat404AsSuccess: { toast: "既に解除済みです" }, refreshOnSuccess: false })` を経由する
- AC-3: 解除 200 OK で Set から削除 + `data-registered="false"` 反転 + `"出席を解除しました"` toast
- AC-4: 解除 404 (`attendance_not_found`) で **エラー toast を出さず** `"既に解除済みです"` を表示、Set からも削除して `data-registered="false"` に収束する
- AC-5: 解除 5xx / network error は失敗扱い toast
- AC-6: register mutation は無改変。register 側 404 は失敗扱い継続
- AC-7: 既存 spec A1..A8 は無改変で pass、追加 spec B1..B5 が全て pass
- AC-8: `git diff --stat apps/api/` で差分 0、`git diff --stat` の web 側差分は MeetingAttendancePanel.tsx と spec の 2 ファイルのみ
- AC-9: `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web test -- MeetingAttendancePanel` が 0 fail

## 6. スコープ確定

### 含む

- `MeetingAttendancePanel.tsx` への解除 button + `unregisterMutation` 追加
- 解除 mutation への `treat404AsSuccess: { toast: "既に解除済みです" }` 配線
- `MeetingAttendancePanel.spec.tsx` への B1..B5 追加（既存 A1..A8 は無改変で維持）
- typecheck / lint / vitest をローカルで実施

### 含まない（明示的に後回し / 別タスク）

- 新規 DELETE method route の追加（既存 POST `attended:false` で機能完備のため不要）
- D1 schema 変更 / migration
- Google Form 仕様変更
- Auth.js / session handler の変更
- visual regression baseline の追加（UI 構造変更だが本サイクルは NON_VISUAL）
- 確認 dialog（破壊操作 UX の hardening は将来 task）
- 他 admin route（members / tags / requests）への横展開

### 正本順位

1. 本仕様書および `index.md`
2. `apps/web/src/features/admin/hooks/useAdminMutation.ts`（`treat404AsSuccess` policy 既実装）
3. `apps/api/src/routes/admin/meetings.ts:200-249`（POST `attended:false` 経路の挙動仕様）
4. CLAUDE.md UI prototype alignment 不変条件 1 / 不変条件 8 / 不変条件 10

## 7. タスク分類記録

| 観点 | 判定 |
|---|---|
| UI task / docs-only task | **UI task**（panel コンポーネント拡張） |
| Phase 11 mode | **NON_VISUAL**（機能テストで担保、visual baseline 追加なし） |
| P50 チェック | 解除 UI 未実装 / `unregisterMutation` 未宣言 → `extend` |
| 命名規則 | testid kebab-case (`attendance-unregister`)、toast 文言は ja-JP 自然文（既存 `"既に出席登録済み"` と整合） |

## 8. 実装モード判定の根拠

- `MeetingAttendancePanel.tsx` は既存 (line 1-101) → 新規追加ではなく拡張 → `extend`
- 既存 `registerMutation` を**改変せず**第 2 mutation を **add only** で追加するため、既存挙動は完全互換
- spec も A1..A8 は無改変で B1..B5 を追加 → 既存契約破壊なし

## 9. リスクと初期対策

| リスク | 影響 | 対策 |
|---|---|---|
| `treat404AsSuccess` が register mutation 側にも誤って適用される | register 側 404 を成功扱いに倒し、存在しない session/member を成功と表示 | mutation を 2 本に分離して宣言、register 側 options に `treat404AsSuccess` を **書かない**（既定 false を維持）。Phase 4 で type-level 隔離を明示 |
| 解除直後 register と DOM 上で同じ candidate に対し 2 button が併存し UX 混乱 | 誤操作 | registered state に応じて register / unregister を相互排他で表示（registered=true なら unregister のみ、false なら register のみ）。Phase 3 / Phase 4 で具体的 DOM 形状を確定 |
| `refreshOnSuccess: false` で他タブの楽観表示と差分 | 並行解除後の表示乖離 | local Set 反転で UI が即時収束。`router.refresh()` は registered Set 上の真実性で十分なため不要 |
| 404 race を成功相当に倒すことで「他者が削除した事実」を operator が気づけない | 監査ログとの整合性 | API 側で `attendance.remove` audit log は 200 経路でのみ append される（404 経路では append されない）が、これは既存挙動（issue-911 起票元 #842 が許容している既知挙動）。本タスクで変更しない |
| spec mock の fetch stub が register / unregister で順序依存になる | flaky test | spec で `fetchMock.mockResolvedValueOnce` を click 直前に都度設定。Phase 4 で B1..B5 のセットアップを明示 |

## 10. Phase 1 完了条件

- [x] taskType / visualEvidence / implementation_mode を確定（implementation / NON_VISUAL / extend）
- [x] 既存ファイル 4 件のインベントリ実測と改修方針を明示（うち改修 2 ファイル / 参照のみ 2 ファイル）
- [x] FR-1〜FR-8 / NFR-1〜NFR-7 / AC-1〜AC-9 を列挙
- [x] スコープの「含む」「含まない」を明示
- [x] 正本順位を確定
- [x] タスク分類（UI task / NON_VISUAL / extend）を記録
- [x] 実装モードを `extend` と判定し根拠を記載
- [x] 初期リスク 5 件と対策を列挙
- [x] 既存 POST endpoint で機能完備のため新規 DELETE route 不要を明文化

## 11. 次 Phase への引き継ぎ

Phase 2 では本 Phase で確定したインベントリと FR/NFR/AC を入力として、(a) attendance state の用語と状態遷移（`registered=true ⇔ registered=false` の 2 状態 + 404 race を吸収する「既に解除済み（不可逆 sink）」遷移）、(b) register / unregister mutation の責務境界、(c) `treat404AsSuccess` policy の適用範囲（unregister mutation のみ）、(d) audit log との整合性（404 経路で append されない既存挙動の追認）を文書化する。
