# Phase 11: 手動テスト（VISUAL_ON_EXECUTION）

[実装区分: 実装仕様書]

## メタ情報

## 目的

VISUAL_ON_EXECUTION の Phase 11 境界と、実装後に取得する drawer tag editing evidence を定義する。

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## タスク種別判定

- **VISUAL_ON_EXECUTION**: MemberDrawer の tag 編集 UI 変更を含むため screenshot 必須。ただし staging 認証が必要なため **実行は user-gated**。

## 3 層評価

### Semantic（コード/契約）

- API contract spec（A-T*）/ repository spec（R-T*）/ web spec（B-T*）/ 型 gate が全 GREEN。
- 自動テスト件数サマリーを `outputs/phase-11/manual-test-result.md` に記録。

### Visual（screenshot）

| 画面 | baseline 名 | 状態 |
| --- | --- | --- |
| MemberDrawer TAGS（編集可能） | `member-drawer-tag-edit.png` | 取得待ち（user-gated） |
| pill 追加直後（selected） | `member-drawer-tag-added.png` | 取得待ち |
| pill 削除直後（unselected） | `member-drawer-tag-removed.png` | 取得待ち |

- 取得手順: `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-edit.spec.ts` を staging 認証セッションで実行。
- canonical 名は spec / capture metadata / implementation-guide / ledger の 4 か所で一致させる。

### AI UX

- pill click → 即時反映（楽観）→ 失敗時 rollback + toast の UX を手動確認（user-gated）。
- アクセシビリティ: pill が button role / `aria-pressed` で selected を伝えるか確認。

## 証跡メタ（Feedback 4）

- 主証跡ソース: 自動テスト（API contract 11 + repo 7 + web 7 + 型 gate）。
- screenshot を即時作らない理由: staging 認証が user-gated のため、機能担保は自動テストが主・visual は補助。

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物（execution 時）

- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/screenshots/member-drawer-tag-*.png`（user-gated）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- 自動テスト件数サマリー記録
- visual baseline 取得（user 承認後）または「user-gated 保留」を明記
