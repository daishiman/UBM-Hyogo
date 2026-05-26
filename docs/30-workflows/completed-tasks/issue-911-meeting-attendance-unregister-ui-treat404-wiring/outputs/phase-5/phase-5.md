**[実装区分: 実装仕様書]**

# Phase 5: テスト方針 / Test pyramid

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `implemented_local_evidence_captured` |
| 入力 | Phase 1-4 |
| 対象 spec | `apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx` |
| 回帰対象 spec | `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` |

## 1. Test pyramid 配置

| 層 | 範囲 | 採用 | 根拠 |
|---|---|---|---|
| unit (hook) | `useAdminMutation` の `treat404AsSuccess` 分岐 | **既存維持** | 既存 spec で網羅済み。本 task では新規 unit test 追加なし |
| component (RTL) | `MeetingAttendancePanel.spec.tsx` に **register / unregister 双方** の AC 反映 | **拡充** | 本 task の振る舞い変更面はここに閉じる |
| integration (D1) | `apps/api/src/routes/admin/meetings.ts` POST `attended:false` の 404 fallthrough | **既存維持** | API 側は無改変（CLAUDE.md UI prototype alignment 不変条件 1） |
| e2e | admin meeting 出欠 flow | **追加なし** | NON_VISUAL task / Playwright 対象外 |

## 2. spec ファイル粒度（命名強制）

- 追加・改修ファイルは **`MeetingAttendancePanel.spec.tsx`** のみ。
- 新規 `*.test.tsx` 禁止（CLAUDE.md 不変条件 8 / lefthook `block-test-suffix` / GitHub Actions `verify-test-suffix`）。
- `__tests__` 配置は既存方針を踏襲。

## 3. 追加テストケース一覧（`MeetingAttendancePanel.spec.tsx`）

| ID | シナリオ | mock setup | assertion |
|---|---|---|---|
| B1 | 出席解除 button 表示条件 | registered=true の候補あり | registered=true の候補だけ `attendance-unregister` が表示される |
| B2 | 解除 payload | `fetch` を `Response 200 { ok: true }` で resolve | `POST /api/admin/meetings/:id/attendances` body が `{ memberId, attended:false }` |
| B3 | 解除成功 (HTTP 200) | `fetch` を `Response 200 { ok: true }` で resolve | 「出席を解除しました」toast、`data-registered=false`、解除 button 消滅 |
| B4 | 解除 race=success 相当 (HTTP 404) | `fetch` を `Response 404 attendance_not_found` で resolve | 「既に解除済みです」toast、`data-registered=false`、解除 button 消滅 |
| B5 | 解除失敗 (HTTP 500) | `fetch` を `Response 500` で resolve | 「解除に失敗 (500)」toast、`data-registered=true`、解除 button 維持 |

## 4. 既存 `useAdminMutation.spec.ts` の無回帰

| ID | シナリオ | 期待 |
|---|---|---|
| RG-UAM-01 | `treat404AsSuccess` 既存 case が green | exit 0 / 既存 assertion 全て pass |
| RG-UAM-02 | `treat404AsSuccess` 未指定時の 404 が error 分岐に落ちる | 既存 spec の error toast assertion green |
| RG-UAM-03 | `refreshOnSuccess` の既定 true / 明示 false の双方分岐が回帰せず | 既存 assertion green |

## 5. 実行コマンド（spec 確定後 / 実装時に通す）

```bash
# 本 task のメイン spec
pnpm exec vitest run "apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx"
# 期待: exit 0 / A1..A8 + B1..B5 全 pass

# 既存 hook spec の無回帰
pnpm exec vitest run apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts
# 期待: exit 0 / 既存 case 全 pass

# 同種 DELETE-race caller 棚卸し
rg -n 'useAdminMutation\([^)]*"DELETE"' apps/web/app apps/web/src -g '*.ts' -g '*.tsx' -g '!**/__tests__/**' -g '!**/*.spec.ts' -g '!**/*.spec.tsx'
# 期待: production caller 0 件
```

## 6. 実装範囲外（明示）

- API endpoint 追加（DELETE route）
- D1 schema 変更
- Google Form schema 変更
- e2e Playwright 追加
- `@/lib/useAdminMutation` legacy への新規参照（不変条件 10）

## 7. Phase 5 完了条件

- [x] Test pyramid 配置を確定（component 層に閉じる）
- [x] spec ファイル粒度を `.spec.tsx` に強制
- [x] 追加テストケース B1..B5 を確定
- [x] 既存 `useAdminMutation.spec.ts` 無回帰 3 件を確定
- [x] 実行コマンドと期待値を提示

## 8. 次 Phase への引き継ぎ

Phase 6 では本 Phase の B4 / B5 を踏まえ、FetchAuthedError の status 別 UI 扱いと register/unregister mutation の責任分離設計を確定する。
