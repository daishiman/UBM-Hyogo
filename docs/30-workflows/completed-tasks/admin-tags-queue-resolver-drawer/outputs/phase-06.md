# Phase 6 — テスト計画

## 追加 spec ファイル

| file | 責務 |
| --- | --- |
| `apps/web/src/components/admin/__tests__/TagsQueueResolveDrawer.spec.tsx` | drawer 単体: a11y, validation, mutation, ESC, focus |
| `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx` | 既存（drawer モック化、list 表示 / filter / 選択遷移） |
| `apps/web/src/components/admin/__tests__/_tagQueueStatus.spec.ts` | status mapping helper の純粋関数テスト |

`*.test.*` は禁止。`todo` / `skip` 禁止。

## test case 一覧

### TagsQueueResolveDrawer.spec.tsx

| ID | case 名 | assertion |
| --- | --- | --- |
| TC-D-01 | `open={true}` で `role="dialog"` + `aria-modal="true"` が出る | `screen.getByRole("dialog")` |
| TC-D-02 | initial focus が最初の focusable に当たる | `expect(document.activeElement)` |
| TC-D-03 | ESC 押下で `onClose` が呼ばれる | `fireEvent.keyDown(... { key: "Escape" })` |
| TC-D-04 | confirmed: suggestedTags が全選択初期化される | checkbox checked 状態 |
| TC-D-05 | confirmed: 全 checkbox を外して submit すると inline error + trigger 未呼び出し | `expect(triggerMock).not.toHaveBeenCalled()` |
| TC-D-06 | confirmed: 通常 submit で `{ action: "confirmed", tagCodes }` が trigger に渡る | `triggerMock.toHaveBeenCalledWith(...)` |
| TC-D-07 | rejected: reason が空白のみだと inline error + trigger 未呼び出し | 同上 |
| TC-D-08 | rejected: trim 済 reason で `{ action: "rejected", reason }` が trigger に渡る | 同上 |
| TC-D-09 | terminal status (`resolved`/`rejected`/`dlq`) で submit button が disabled | `toHaveAttribute("aria-disabled", "true")` |
| TC-D-10 | mutation 成功 → `onResolved(queueId)` + `onClose` が順に呼ばれる | spy assertion |
| TC-D-11 | `tagQueueResolveBodySchema.safeParse` が fail する payload は trigger に行かない | safeParse の負パスを確認 |

### _tagQueueStatus.spec.ts

| ID | case 名 |
| --- | --- |
| TC-S-01 | 全 5 status に label/token が存在 |
| TC-S-02 | token 値が `var(--...)` 文字列で HEX を含まない |

### TagQueuePanel.component.spec.tsx（差分のみ）

| ID | case 名 |
| --- | --- |
| TC-P-01 | list item の「Resolve」button click で drawer が `open=true` で render される（drawer mock の props 受け取り検証） |
| TC-P-02 | 既存「filter ボタン押下 → router.push」テストは維持 |

## 期待 assertion パターン

- `userEvent` を優先（`fireEvent` は keyDown 等限定）
- async assertion は `await screen.findBy*` を使う
- mock: `vi.mock("../../features/admin/hooks/useAdminMutation", ...)` で `trigger` を spy

## E2E coverage

`apps/web/tests/e2e/admin-tags.spec.ts`（既存 or 新規）に 1 シナリオ追加: list → drawer open → confirmed submit → toast → drawer close。
