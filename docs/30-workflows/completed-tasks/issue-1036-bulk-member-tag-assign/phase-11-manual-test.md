# Phase 11: 手動テスト（VISUAL_ON_EXECUTION）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| workflow_state | `implemented_local_runtime_pending`（実装済み・staging 認証付き実機確認のみ user-gated） |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| 前提 | Phase 1-10 完了 |

## 目的

VISUAL_ON_EXECUTION の Phase 11 境界と、実装済み **BulkActionBar tag セクション** の
visual evidence を記録する。ローカル Playwright fixture で canonical 4 状態の screenshot を
取得済み。staging 認証付き `/admin/members` 実機 baseline は user-gated として残す。

## タスク種別判定

- **VISUAL_ON_EXECUTION**: task-B（`BulkActionBar` 拡張）は admin members 一覧の見た目・操作
  （tag picker + assign/unassign 切替 + 部分失敗結果表示）を変更するため screenshot 必須。
  ローカル fixture で UI 状態 screenshot を取得済み。staging 認証付き実機 screenshot は
  **user-gated**。
- **NON_VISUAL（API）**: task-A（bulk endpoint / repository / audit / type gate）は UI を持たず、
  contract / repository / type gate test が主証跡。

## screenshot canonical 名

capture で使う canonical 名を spec / capture metadata / implementation-guide / ledger の 4 か所で一致させる。

| 画面状態 | baseline 名 | 取得状態 |
| --- | --- | --- |
| tag picker（assign モード・tag 複数選択中） | `bulk-tag-picker-assign-mode.png` | present（local fixture） |
| tag picker（unassign モードへ切替） | `bulk-tag-picker-unassign-mode.png` | present（local fixture） |
| 実行結果（全件成功の集計表示） | `bulk-tag-result-all-success.png` | present（local fixture） |
| 実行結果（部分失敗＝skipped_deleted / tag_not_found 混在） | `bulk-tag-result-partial-failure.png` | present（local fixture） |

> local fixture screenshot は `apps/web/playwright/tests/issue1036-bulk-member-tags.spec.ts` で取得。
> staging 認証セッションの `/admin/members` 実機 baseline は user 承認後に同名または
> `*-staging.png` suffix で追加取得する。

## 3 層評価

### Semantic（コード/契約）

- task-A: bulk endpoint contract spec（`members-tags-bulk.contract.spec.ts`）/ repository spec
  （`memberTags.bulk.repository.spec.ts`）/ type-level gate（`memberTags.readonly.test-d.ts`）が全 GREEN。
  - AC-1（assign/unassign 一括）, AC-2（part-failure shape）, AC-3（audit parity）,
    AC-4（skipped_deleted）, AC-5（再送冪等で audit 増えない）を contract で固定。
- task-B: BulkActionBar component spec（`BulkActionBar.spec.tsx`）が GREEN。
  - tag picker 描画 / op 切替 / 実行ボタン disabled 条件 / 部分失敗集計表示を assert。
- 自動テスト件数サマリーは Phase 9 / Phase 12 実装ガイドに記録済み。

### Visual（screenshot）

| 画面 | baseline 名 | 状態 |
| --- | --- | --- |
| tag picker（assign） | `bulk-tag-picker-assign-mode.png` | present（local fixture） |
| tag picker（unassign） | `bulk-tag-picker-unassign-mode.png` | present（local fixture） |
| 全件成功結果 | `bulk-tag-result-all-success.png` | present（local fixture） |
| 部分失敗結果 | `bulk-tag-result-partial-failure.png` | present（local fixture） |

- ローカル取得手順: `PLAYWRIGHT_SKIP_WEB_SERVER=1 pnpm exec playwright test playwright/tests/issue1036-bulk-member-tags.spec.ts --project=desktop-chromium`。
- staging 取得手順（user-gated）: admin 認証セッションで `/admin/members` を開き、下記「実地操作手順」を
  実施した各状態を Playwright visual spec または手動キャプチャで取得する。
- canonical 名は spec / capture metadata / implementation-guide / ledger の 4 か所で一致させる。

### AI UX

- 複数 member checkbox 選択 → BulkActionBar 表示 → tag picker で tag 複数選択 → assign 実行 →
  結果集計が即時表示される UX を手動確認（user-gated）。
- アクセシビリティ: tag picker の `TagPill` が button role / `aria-pressed` で選択状態を伝えるか、
  op 切替が keyboard 操作可能かを確認。
- 部分失敗時（削除済み member 混在）に「skip された member×tag」が明示され、成功分と区別できるか確認。

## 実地操作手順（staging / user-gated）

1. admin 認証で `/admin/members` を開く。
2. 複数の member（うち 1 件は削除済み member を含める）を checkbox で選択する。
3. BulkActionBar 下段の tag セクションで tag を複数選択する（→ `bulk-tag-picker-assign-mode.png`）。
4. op を unassign に切り替える（→ `bulk-tag-picker-unassign-mode.png`）。op を assign に戻す。
5. 「{N}人 × {M}タグ を付与」を実行する。
   - 全件成功ケース: 集計表示を取得（→ `bulk-tag-result-all-success.png`）。
   - 削除済み member 混在ケース: `skipped_deleted` を含む部分失敗集計を取得
     （→ `bulk-tag-result-partial-failure.png`）。
6. 同一 bulk を再送し、既成功分が `noop` に落ち audit が増えないこと（AC-5）を確認する。
7. 既存 publish/hide/soft-delete アクションに regression が無いこと（AC-6）を確認する。

## 証跡メタ（Feedback 4）

- 主証跡ソース: 自動テスト（API contract + repository + type gate + web component）。
- screenshot: local fixture 4 点は present。staging 認証付き実機 screenshot のみ user-gated。
  機能担保は自動テストが主・visual は補助。

## 実行タスク

- local fixture screenshot 4 点を取得する。
- staging 認証付き実機 screenshot は user 承認後に追加する。

## 成果物（execution 時）

- `outputs/phase-11/screenshots/bulk-tag-*.png`（4 baseline・local fixture present）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/index.md
- docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/phase-2-design.md（A-2 endpoint / B-2 UI 契約）
- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/phase-11-manual-test.md（親 VISUAL_ON_EXECUTION 先例）
- .claude/skills/task-specification-creator/SKILL.md

## 完了条件

- [x] screenshot canonical 名 4 件を記述
- [x] 3 層評価（Semantic / Visual / AI UX）を記述
- [x] 実地操作手順を記述
- [x] local fixture screenshot 4 点を保存
- [x] staging 認証付き実機 screenshot は user-gated と明記
