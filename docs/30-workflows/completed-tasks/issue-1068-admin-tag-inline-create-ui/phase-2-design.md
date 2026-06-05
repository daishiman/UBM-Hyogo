# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

inline-create の状態機械 / 責務分離（create vs attach）/ state ownership / ロック解放経路 / lane を確定し、Phase 3 設計レビューと Phase 4 テスト作成の前提を一意に固定する。

## 真の論点（要件レビュー思考法）

1. **真の論点**: 「tag 作成（master への write）」と「member への付与（junction への write）」は **別エンドポイント・別責務** であり、UI 上は 1 操作に見せつつ、**部分成功（作成だけ成功）** と **重複（conflict）** の 2 つの失敗モードを破綻なく扱えるか。本仕様書はこの状態機械を確定する。
2. **依存 / 責務境界**: create = `POST /admin/tags`（master write、`MemberTagInlineCreate` 起点）。attach = `POST /members/:memberId/tags`（junction write、**親 `MemberTagsEditor` の既存 `assign` mutation を再利用**）。付与経路を 1 本化し、issue-982 の付与ロジックと二重化しない。
3. **価値とコスト**: 価値 = drawer 内で tag キュレーションが完結し「タグ管理へ」遷移が不要になる。最大コスト部品 = 「create→attach の連結 + 2 失敗モードの回収 UI」。これを子 component のローカル状態機械 + 親の `createdPendingAttach` state で最小コスト化する。
4. **改善優先順位**: web client（task-A、error code 検出基盤）→ drawer 配線（task-B）→ visual + invariant doc（task-C）。
5. **4 条件**: 価値性 = 管理者の tag 作成→付与コスト削減 / 実現性 = 既存 `assign` mutation・`TagPill`・`FormField`・`useAdminMutation` 流用で初回完結 / 整合性 = create と attach の責務分離を状態機械で閉じる / 運用性 = client validation + 409 回収で失敗が詰まらない。

## 因果ループ

- バランスループ: create 201 → 親へ `onTagCreated(tag)` → 親 `assign` mutation 発火 → `{ assigned, available }` 更新 → 子 `idle` 復帰 → state 収束。
- 強化ループ: master read を drawer の `available` に乗せる構造（issue-982）を維持しつつ、create で作った tag が `available` にも出るため、以降の付与/解除がそのまま再利用可能になる。
- 例外ループ（conflict）: create 409 → 子 `conflict` → 親が member tags 再取得 → 同 code 既存 tag を `available` に提示 → 既存 pill 選択で attach → `idle`。重複 POST を発生させずに収束。

## 状態機械（本タスクの核心）

新規子 component `MemberTagInlineCreate.tsx` のローカル state `createPhase`:

| state | 意味 | UI | 遷移先 |
| --- | --- | --- | --- |
| `idle` | 「+ 新規タグ」ボタンのみ表示 | 1 ボタン | → `form`（ボタン click） |
| `form` | code/label/category 入力フォーム（`FormField` × 3）+ 送信 / キャンセル | フォーム | → `submitting`（送信・client validation 通過時）/ → `idle`（キャンセル） |
| `submitting` | `POST /admin/tags` 実行中。送信ボタン disabled | フォーム（無効化） | → `idle`（201：親へ tagId 委譲後）/ → `conflict`（409）/ → `form`（400：field error 付き） |
| `conflict` | 同 code の既存 tag あり。member tags を再取得し既存 tag を選択へ誘導 | 案内 + 既存 tag 選択導線 | → `idle`（既存 pill を選択して attach）/ → `form`（入力を修正して再送） |

### 遷移詳細

- `idle → form`: 「+ 新規タグ」ボタン click。form fields を空で初期化。
- `form → submitting`: 送信 click。**先に client validation** を実行し、空 / regex 不一致 / 長さ超過があれば `form` のまま FormField error をセットして送信しない。全項目合格時のみ `submitting` へ。
- `submitting → idle`（201 / 正常）: `createTag` 相当の mutation が 201 を返す。子は `onTagCreated(tag: AdminTagRef)` で親に委譲し、自身の form fields をクリアして `idle` へ復帰。
- `submitting → conflict`（409）: `FetchAuthedError.bodyText` を `parseTagErrorCode`（task-A）で判定し `tag_code_conflict` を検出。子は `conflict` へ。親に再取得を要求（`onConflict(code)` callback）し、親は member tags を refetch して `available` を更新。子は再取得結果（props 経由 `available`）から同 code 既存 tag を選択導線として提示。
- `submitting → form`（400 / その他）: `invalid_body` / `invalid_json` は包括フォールバック error を form 上部に表示し `form` へ戻す（field 粒度は client validation が主、server 400 は最後の砦）。
- `conflict → idle`: ユーザーが既存 tag を選択 → 親の `assign` mutation で attach → `idle`。
- `conflict → form`: ユーザーが入力修正を選択 → form に戻る。

## create→attach の連結（責務分離）

- create が 201 を返したら、attach は **親 `MemberTagsEditor` の既存 `assign` mutation を再利用** する（`POST /members/:memberId/tags { tagId }`）。これにより付与経路を issue-982 と一本化する。
- 子は付与そのものを実行しない。子の責務は「tag を master に作る」までで、付与は親に委譲する（`onTagCreated`）。

## 部分成功（create 201 → attach 失敗）

- 親 `MemberTagsEditor` に `createdPendingAttach: AdminTagRef | null` state を持たせる。
- create 成功で `onTagCreated(tag)` を受けたら、親は `createdPendingAttach = tag` を設定したうえで `assign` mutation を発火する。
- attach 成功 → `createdPendingAttach = null` にクリア。
- attach 失敗 → `createdPendingAttach` を保持したまま「作成済み tag を付与する」リトライ導線（ボタン）を出す。作成済み tag は **破棄しない**（master には既に存在するため、再 create は 409 になる）。リトライは同じ `assign` mutation を再発火する。

## client validation（送信前）

- `code`: 空 NG / regex `/^[a-z0-9][a-z0-9_]*$/` 不一致 NG / 1〜64 文字超過 NG。
- `label`: 空 NG / 1〜120 文字超過 NG。
- `category`: 空 NG / 1〜64 文字超過 NG。
- 各 NG は対応する `FormField` の `error` に読みやすいメッセージを出す（`role="alert"`）。1 つでも NG なら送信しない。
- server 400（`invalid_body` / `invalid_json`）は client validation を通過した後の最後のフォールバック。form 上部の包括 error として表示する。

## state ownership テーブル

| 状態 | owner | 受け渡し |
| --- | --- | --- |
| `createPhase`（idle/form/submitting/conflict） | `MemberTagInlineCreate`（子・ローカル） | — |
| form fields（code / label / category）+ field errors | `MemberTagInlineCreate`（子・ローカル） | — |
| `assigned` / `available` | `MemberTagsEditor`（親） | 子へ props で渡す（conflict 時の既存 tag 提示用 `available`） |
| `pendingTagId`（attach 中ロック） | `MemberTagsEditor`（親、issue-982 既存） | — |
| `createdPendingAttach: AdminTagRef \| null` | `MemberTagsEditor`（親） | attach リトライ導線の表示制御 |
| 子→親 callback | `onTagCreated(tag: AdminTagRef)` / `onConflict(code: string)` | 親が attach / refetch を実行 |
| 親→子 | refetch 後の `available` を props、`createPhase` を `idle` に戻す指示（`onConflictResolved` 相当の props） | 子の表示更新 |

## ロック解放経路テーブル（正常 / エラー / キャンセル）

> `submitting` は必ず `idle` / `form` / `conflict` のいずれかへ復帰し、ロックが残らないこと。

| 起点 | 経路 | 終端 state | ロック解放 |
| --- | --- | --- | --- |
| submitting | 201（正常） | `idle` | mutation `finally` 相当で送信フラグ解除、`onTagCreated` 後 fields クリア |
| submitting | 409 conflict | `conflict` | 送信フラグ解除、`onConflict(code)` で親 refetch |
| submitting | 400 / その他 server error | `form` | 送信フラグ解除、包括 error 表示 |
| submitting | network / timeout（例外） | `form` | 送信フラグ解除、包括 error 表示 |
| form | キャンセル click | `idle` | fields / errors クリア |
| conflict | 既存 tag 選択（attach 成功） | `idle` | 子は `idle` 復帰、親 `createdPendingAttach` 非関与 |
| conflict | 入力修正選択 | `form` | fields 保持 or 再入力 |
| 親 attach（create 後） | 成功 | — | `createdPendingAttach = null` |
| 親 attach（create 後） | 失敗 | — | `createdPendingAttach` 保持 + リトライ導線（ロックは pill 単位 disabled で二重発火防止） |

## mutation 配線（useAdminMutation）

- create mutation: `useAdminMutation<AdminTagRef>("/api/admin/tags", "POST", { onSuccess, onError })`。`trigger({ code, label, category })` で発火。POST は非冪等（retry 不可）。
- 失敗時は `FetchAuthedError`（`.status` / `.bodyText`）が throw される。`onError(error)` で `parseTagErrorCode(error.bodyText)`（task-A）を呼び、`tag_code_conflict` / `invalid_body` / `invalid_json` を分岐する。
- attach mutation は親 `MemberTagsEditor` の既存 `assign`（issue-982）をそのまま再利用。新規追加しない。
- raw helper `createTag`（task-A）は **非 hook なテスト / 再利用** 向け。実 mutation 発火は `useAdminMutation` 経由だが、error code 検出に `parseTagErrorCode` を共用する。

## 再利用 primitive

| primitive | 用途 |
| --- | --- |
| `FormField`（`@/components/ui/FormField`） | code / label / category 入力（invariant #9。生 `<input>` を増やさない） |
| `TagPill`（`_shared/TagPill`） | conflict 時の既存 tag 選択導線 / 既存 assigned-available pill |
| `useAdminMutation`（`@/features/admin/hooks/useAdminMutation`） | create mutation（invariant #10） |

## レイアウト（AC-6）

- inline-create の操作部品（「+ 新規タグ」ボタン → form）は既存 pill 群と **縦方向に分離** したブロックに配置し、desktop/mobile（drawer 幅）で pill と重ならないようにする。
- 既存 drawer の layout primitive（issue-982 の section 構造）を踏襲し、新規 primitive を生やさない（invariant 6）。color は OKLch token のみ（invariant 5）。

## lane（SubAgent 並列 ≤ 3）

- lane-A: `apps/web/src/features/admin/api/members.ts`（task-A：`createTag` / `parseTagErrorCode` / error code 型 + unit spec）
- lane-B: `MemberTagInlineCreate.tsx` 新規 + `MemberDrawer.tsx`（`MemberTagsEditor`）配線 + component spec（task-B、A 完了後）
- lane-C: Playwright visual（desktop/mobile）+ invariant / index doc（task-C、B 完了後）
- validation lane（直列締め）: `pnpm --filter @ubm-hyogo/web typecheck` / `lint` / focused spec

## 参照資料

| 参照資料 | パス |
| -------- | ---- |
| tag master write API | `apps/api/src/routes/admin/tags.ts:21-27,131-155` |
| member tag 付与 API | `apps/api/src/routes/admin/members.ts:731-783` |
| web client | `apps/web/src/features/admin/api/members.ts` |
| mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` |
| FormField | `apps/web/src/components/ui/FormField.tsx` |
| TagPill | `apps/web/src/features/admin/components/_shared/TagPill.tsx` |

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 本ファイル（状態機械 / 責務分離 / state ownership / ロック解放経路 / lane 設計確定）

## 統合テスト連携

- 実装時は Phase 4 の focused tests（C-T1〜C-T8 / C-A-T1〜C-A-T3）と Phase 11 evidence ledger に接続する。

## 完了条件

- `createPhase`（idle/form/submitting/conflict）の状態機械が遷移先付きで一意に確定している
- create（master write）と attach（junction write、親 `assign` 再利用）の責務分離が明示されている
- state ownership テーブル（子ローカル vs 親）が確定している
- ロック解放経路テーブル（正常 / エラー / キャンセル）が `submitting` から漏れなく閉じている
- 部分成功（`createdPendingAttach`）と conflict 回収の 2 失敗モードが UI state で定義されている
- lane（≤ 3）が明示されている
