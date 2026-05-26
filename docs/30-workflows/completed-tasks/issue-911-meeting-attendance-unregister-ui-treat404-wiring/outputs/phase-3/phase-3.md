**[実装区分: 実装仕様書]**

# Phase 3: 設計方針 / Gate-A 提示 / AC 具体化

## 0. 入力

- Phase 1 の FR/NFR/AC、Phase 2 の状態遷移 + DOM 案 A 採用方針

## 1. 設計決定（confirmed）

| ID | 決定 | 根拠 |
|---|---|---|
| D-1 | 新規 DELETE endpoint を追加しない。POST `attended:false` の既存 endpoint を再利用する | `apps/api/src/routes/admin/meetings.ts:200-249` が既に attended:true/false 双方を完全実装。CLAUDE.md UI prototype alignment 不変条件 1 |
| D-2 | `treat404AsSuccess` policy は **unregister mutation のみ** に設定する | register 側 404 を成功扱いに倒すと session/member not found が UX 上隠蔽されるため不可。Phase 2 §4 隔離原則 |
| D-3 | mutation は 2 本（`registerMutation` / `unregisterMutation`）を別宣言する | option 差分が `treat404AsSuccess` / 成功 toast 文言の 2 軸あるため共有不可 |
| D-4 | UI DOM は **案 A（相互排他表示）** を採用 | spec の DOM 検査がもっとも明快、既存 A2 (`m2btn.textContent === "登録済"`) を破壊しない |
| D-5 | 解除成功 toast 文言は `"出席を解除しました"`、404 toast は `treat404AsSuccess.toast` の `"既に解除済みです"` | 既存 register 側の `"出席を登録しました"` / `"既に出席登録済み"` と並列構文 |
| D-6 | `refreshOnSuccess: false` を両 mutation で維持 | local Set 反転で UI が即時収束。`router.refresh()` 不要 |
| D-7 | unregister 5xx / network error は `"解除に失敗 (${status})"` toast | register 側の `"登録に失敗 (${status})"` と並列構文。FetchAuthedError 経路で実装 |
| D-8 | 解除 button は registered=true の行にのみ表示。registered=false の行では register button のみ表示 | 案 A の意義（DOM 単純化） |
| D-9 | 確認 dialog は出さない | 親 workflow と同様、UX hardening は将来 task に分離 |
| D-10 | visual baseline 更新は **行わない**（`NON_VISUAL`） | 解除 button の出現は機能テストで担保。baseline 更新は別 followup 化 |

## 2. UI DOM 仕様（案 A 確定）

```tsx
<li data-testid="attendance-candidate" data-member={c.memberId}>
  {c.fullName} ({c.memberId})
  {registered.has(c.memberId) ? (
    <button
      type="button"
      data-testid="attendance-unregister"
      data-member={c.memberId}
      data-registered="true"
      onClick={() => onUnregister(c.memberId)}
    >
      出席解除
    </button>
  ) : (
    <button
      type="button"
      data-testid="attendance-register"
      data-member={c.memberId}
      data-registered="false"
      onClick={() => onRegister(c.memberId)}
    >
      出席登録
    </button>
  )}
</li>
```

**注意**: 既存 spec A2 は registered=true の m2 button が `textContent === "登録済"` を断定している。案 A 確定により m2 行は register button が消え unregister button に置き換わる。**A2 を更新する必要がある** — 既存 spec を破壊しない原則と矛盾するため、Phase 3 で再検討する必要がある。

### A2 互換の再検討

代替案 A': registered=true でも register button を残し `"登録済"` textContent を維持、隣に unregister button を **追加表示**する（両 button visible）。

- メリット: 既存 A2 / A7（既登録 button 再押下 early return）を完全に維持できる
- デメリット: 同一 candidate 行に 2 button が並ぶが、片方は `"登録済"`（disabled UX）、もう片方は `"出席解除"`（active）。可読性は若干落ちる
- 結論: **案 A' を採用**（既存 spec 互換を優先）

### 案 A' 確定 DOM

```tsx
<li data-testid="attendance-candidate" data-member={c.memberId}>
  {c.fullName} ({c.memberId})
  <button
    type="button"
    data-testid="attendance-register"
    data-member={c.memberId}
    data-registered={registered.has(c.memberId) ? "true" : "false"}
    onClick={() => onRegister(c.memberId)}
  >
    {registered.has(c.memberId) ? "登録済" : "出席登録"}
  </button>
  {registered.has(c.memberId) && (
    <button
      type="button"
      data-testid="attendance-unregister"
      data-member={c.memberId}
      onClick={() => onUnregister(c.memberId)}
    >
      出席解除
    </button>
  )}
</li>
```

これにより既存 A1..A8 は **無改変で pass** する（unregister button は m2 行にだけ追加で現れるが、A1..A8 はいずれも attendance-register testid と textContent のみを参照しているため）。

## 3. AC を spec ケース番号へマッピング

| AC | 既存/新規 spec | 内容 |
|---|---|---|
| AC-1 | B5（新規） | registered=false 行に unregister button が **存在しない** ことを assert |
| AC-2 | B1（新規） | unregister click が POST `attended: false` を呼ぶことを fetch mock の引数で assert |
| AC-3 | B1（新規） | 200 OK で Set から削除 + register button の `data-registered="false"` 反転 + `"出席を解除しました"` toast |
| AC-4 | B2（新規） | 404 (`attendance_not_found`) で **エラー toast を出さず** `"既に解除済みです"` toast、Set からも削除 |
| AC-5 | B3（新規） | 500 で `"解除に失敗 (500)"` toast、Set 不変 |
| AC-6 | A4 / A6b（既存・無改変） | register 409 は楽観 Set 追加、register 404 は `"開催日または会員が見つかりません"` |
| AC-7 | A1..A8（既存・無改変） + B1..B5（新規） | 全 13 ケース pass |
| AC-8 | 検証コマンド | `git diff --stat apps/api/` が空、`git diff --stat apps/web/` が 2 ファイル |
| AC-9 | 検証コマンド | `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web test -- MeetingAttendancePanel` 0 fail |

追加: B4（mutation 隔離契約）— register mutation の option に `treat404AsSuccess` が含まれないことを宣言レベルで担保するため、**fetchMock で `attended:true` 経路の 404 を出した場合に既存 A6b 通り fail toast が出ること** を再確認する spec を追加する。これは既存 A6b と重複するため B4 は AC-2 / AC-4 を補完する **隔離 sanity** として位置付ける。

## 4. Gate-A 提示（spec_review）

| 項目 | 結果 |
|---|---|
| 設計差分の範囲 | UI 2 ファイル（panel + spec）のみ。`apps/api/**` / D1 / hooks / 他 admin 画面に波及なし |
| 既存契約破壊 | なし（案 A' により A1..A8 無改変で維持） |
| API surface | 既存 POST endpoint のみ。新 endpoint 追加なし |
| 不変条件遵守 | UI alignment 不変条件 1（既存 API のみ）/ 8（spec.tsx のみ）/ 10（features 経由 mutation）すべて満たす |
| 影響範囲リスク | 低（add-only な 2 ファイル変更） |
| Gate-A 推奨 | **PASS 候補**（user 承認待ち） |

## 5. 検証順序（Gate-B 用）

1. `pnpm install` (lockfile 不整合がないことを確認)
2. `pnpm typecheck` — useAdminMutation の `treat404AsSuccess` 型が match することを型レベルで担保
3. `pnpm lint` — Prettier / ESLint
4. `pnpm --filter @ubm-hyogo/web test -- MeetingAttendancePanel` — A1..A8 + B1..B5 が all green
5. `git diff --stat apps/api/` で 0 差分を確認
6. `git diff --stat apps/web/app/(admin)/admin/meetings/[id]/` で 2 ファイル差分を確認

## 6. Phase 3 完了条件

- [x] 設計決定 D-1..D-10 を確定
- [x] UI DOM 案 A' を採用し既存 A1..A8 互換を担保
- [x] AC-1..AC-9 を spec ケース B1..B5 / A1..A8 / 検証コマンド へマッピング
- [x] Gate-A 提示資料（差分範囲・契約破壊・不変条件遵守）を整理
- [x] Gate-B 検証順序 6 ステップを確定

## 7. 次 Phase への引き継ぎ

Phase 4 では Phase 3 確定の案 A' DOM を入力として、(a) `MeetingAttendancePanel.tsx` の before/after コード差分、(b) `unregisterMutation` 宣言の正確な型シグネチャ、(c) `onUnregister` ハンドラ実装、(d) spec B1..B5 の完全なテストコード骨子、(e) DoD と実行コマンド一覧、を CONST_005 必須項目に従って網羅する。
