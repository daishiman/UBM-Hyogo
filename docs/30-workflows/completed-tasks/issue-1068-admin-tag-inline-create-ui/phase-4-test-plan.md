# Phase 4: テスト作成（TDD Red）

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

実装前に test ケースと expected を確定し、RED 状態を作る。命名規則（`*.spec.{ts,tsx}`）と props/state 区別、モック方針（happy-dom + `Object.defineProperty`、`vi.stubGlobal("window",...)` 禁止）を遵守する。

## テストファイル一覧（新規）

| パス | 対象 | harness |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx` | inline-create UI（状態機械 / create→attach / conflict / validation / 部分成功 / a11y / regression） | Vitest + Testing Library（happy-dom） |
| `apps/web/src/features/admin/api/__tests__/members.tagCreate.spec.ts`（task-A） | `createTag` / `parseTagErrorCode` | Vitest（`fetch` を `vi.fn()` で stub） |

> task-A の client unit（C-A-T1〜C-A-T3）は [tasks/task-A-tag-create-web-client.md](tasks/task-A-tag-create-web-client.md#テスト方針c-a-t1c-a-t3) を正本とする。

## モック方針（共通）

- harness は **happy-dom**。`window` の差し替えが必要な場合は `Object.defineProperty(window, ...)` を用いる。`vi.stubGlobal("window", ...)` は **禁止**。
- `useAdminMutation` の内部 fetch は `vi.fn()` で stub し、成功（201）/ 409 / 400 / network error を切り替える。`FetchAuthedError` は `.status` / `.bodyText` を持つオブジェクトとして mock の reject 値に与える（`bodyText` は `{"ok":false,"error":"tag_code_conflict"}` 等の JSON 文字列）。
- `fetchMemberTags`（conflict 後 refetch）と親 `assign` mutation も `vi.fn()` で stub し、戻り値 `{ assigned, available }` を制御する。
- props/state 区別: `createPhase` と form fields は `MemberTagInlineCreate` のローカル state、`assigned` / `available` / `createdPendingAttach` / `pendingTagId` は親 `MemberTagsEditor` の state。テストは fetch mock 解決後に DOM 操作する。

## web component ケース（C-T1〜C-T8）

| ID | ケース | expected |
| --- | --- | --- |
| C-T1 | 「+ 新規タグ」ボタン → form 表示 / キャンセル → idle | 初期は form 非表示（ボタンのみ）。ボタン click で code/label/category の `FormField` × 3 が出現。キャンセル click で form が消えボタンのみに戻り、入力値・error がクリアされる |
| C-T2 | create 成功（201）→ attach → 反映 | 有効値入力で送信 → create mutation が `{ code, label, category }` で発火（trigger 引数 assert）→ 201 で `onTagCreated(tag)` → 親 `assign` mutation 発火（`tagId` assert）→ stub 戻り値の `{ assigned, available }` 反映で新 tag が assigned + available の両方に出現。form は idle に復帰 |
| C-T3 | client validation で送信ブロック | code 空 / label 空 / category 空 / code が regex（`/^[a-z0-9][a-z0-9_]*$/`）不一致 / code 65 文字 / label 121 文字 / category 65 文字 の各ケースで、送信しても create mutation の trigger が **呼ばれない**（`vi.fn()` 未 call assert）+ 対応 `FormField` の error が表示される（`role="alert"`） |
| C-T4 | server 400 invalid_body フォールバック | client validation を通過する値で、create mutation stub が `FetchAuthedError{status:400, bodyText:'{"ok":false,"error":"invalid_body"}'}` を reject → form 上部に包括 error が表示され、`createPhase` が form に戻る（ロック解放） |
| C-T5 | 409 tag_code_conflict 回収 | create mutation stub が `{status:409, bodyText:'{"ok":false,"error":"tag_code_conflict"}'}` を reject → `parseTagErrorCode` が `tag_code_conflict` を返す → `conflict` 表示 → `fetchMemberTags` 再取得 stub の `available` に同 code 既存 tag が出現 → 既存 tag を選択して attach（親 `assign` 発火）。**再送信時に create mutation が 2 回目発火しない**ことを assert |
| C-T6 | 部分成功（201 後 attach 失敗）→ リトライ | create 201 で `onTagCreated` → 親 `assign` mutation stub が 1 回目 reject → `createdPendingAttach` が保持され「作成済み tag を付与」リトライ導線（ボタン）が表示。**create mutation は再発火しない**。リトライ click で `assign` のみ再発火 → 2 回目 resolve で `createdPendingAttach` が null になり tag が assigned に出現 |
| C-T7 | 既存 assign/unassign/pill の regression 無し | issue-982 の `MemberDrawer.tags.spec.tsx` 相当（B-T1〜B-T8）が green を維持。本 spec では inline-create 追加後も既存 pill の付与/解除 click が従来通り動くことを最小 1 ケースで再確認（assign/unassign mutation が従来経路で発火） |
| C-T8 | a11y | code/label/category の入力が `FormField` の `label` と紐付く（`getByLabelText` で取得可能）。validation error / 包括 error が `role="alert"` を持つ |

## task-A client unit ケース（C-A-T1〜C-A-T3）

| ID | ケース | expected |
| --- | --- | --- |
| C-A-T1 | `createTag` 201 | `fetch` stub が 201 + `{ tagId, code, label, category, active }` → `AdminTagRef`（`{ tagId, code, label, category }`）を返す |
| C-A-T2 | `createTag` 409 | `fetch` stub が 409 + `{"ok":false,"error":"tag_code_conflict"}` → `parseTagErrorCode` で `tag_code_conflict` を載せた `Error` を throw（`.code` 等で検出可能） |
| C-A-T3 | `parseTagErrorCode` | `'{"ok":false,"error":"invalid_body"}'` → `"invalid_body"` / `'{"ok":false,"error":"unknown_x"}'` → `null`（既知 code 以外）/ 不正 JSON（`"{not json"`）→ `null` |

## RED 確認コマンド

```bash
# 実装前は赤（component / client unit とも未実装）
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tagInlineCreate
mise exec -- pnpm --filter @ubm-hyogo/web test -- members
# 代替経路（filter が動かない環境）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx
```

## 実行タスク

- 本 Phase の記載内容を実装時の RED gate として使用する。

## 成果物

- 2 テストファイルの RED（実装フェーズで GREEN 化）

## 統合テスト連携

- 実装時は本 Phase の focused tests と Phase 11 evidence ledger（desktop/mobile screenshot）に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/phase-2-design.md
- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/tasks/task-A-tag-create-web-client.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- C-T1〜C-T8 / C-A-T1〜C-A-T3 が expected 付きで列挙されている
- `*.spec.{ts,tsx}` 命名を遵守している
- props/state 区別（子ローカル vs 親）が明記されている
- モック方針（happy-dom + `Object.defineProperty`、`vi.stubGlobal("window",...)` 禁止、fetch は `vi.fn()` stub）が明記されている
- RED 確認コマンドが代替経路込みで記載されている
