# Phase 11: 手動テスト（VISUAL_ON_EXECUTION）

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

VISUAL_ON_EXECUTION の Phase 11 境界と、実装後に取得する drawer tag inline-create evidence を定義する。
apps/web 実装は本サイクルで完了済み。screenshot 実機取得は staging 認証を要するため user-gated とし、ローカルでは focused tests と env-gated Playwright spec を Phase 11 証跡として記録する。

## タスク種別判定

- **VISUAL_ON_EXECUTION**: `MemberDrawer` の `MemberTagsEditor` へ inline-create UI を追加し drawer の見た目が変わるため screenshot 必須。NON_VISUAL ではない。
- ただし staging 認証が必要なため **実機取得は user-gated**。実装サイクルでは Playwright capture（task-C）を主ソースとする。

## 3 層評価

### Semantic（コード/契約）

- web unit spec（B-T1〜B-T8 / C-A-T1〜C-A-T3 / C-T1〜C-T8）/ 型 gate / lint が全 GREEN であること。
- `git diff --stat apps/api` が 0 件（API surface 不変）であること。
- 自動テスト件数サマリーを `outputs/phase-11/manual-test-result.md` に記録済み。

### Visual（screenshot）

| 画面 / 状態 | canonical 名 | 担当 | 状態 |
| --- | --- | --- | --- |
| inline-create form 展開（desktop） | `member-tag-inline-create-form-desktop.png` | task-C | 取得待ち（user-gated） |
| inline-create form 展開（mobile・AC-6 overlap 確認） | `member-tag-inline-create-form-mobile.png` | task-C | 取得待ち（user-gated） |

- 取得経路: `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-inline-create.spec.ts`（task-C）を staging 認証セッションで実行。
- canonical 名は spec / implementation-guide / manual-test-result の 3 か所で一致させる。
- 409 conflict 回収は `MemberDrawer.tagInlineCreate.spec.tsx` C-T5 の component test を主証跡とする。staging visual baseline は form 展開の desktop/mobile overlap 確認に限定する。
- **AC-6 overlap**: mobile drawer 幅で inline-create form の入力欄と既存 tag pill が重ならないことを `member-tag-inline-create-form-mobile.png` で visual 確認する。

### AI UX

- inline-create form 展開 → tag 名入力 → 作成 → 即座に member 付与 pill が selected 表示される一連の UX を手動確認（user-gated）。
- 409 conflict 時に「新規作成失敗」ではなく既存 tag が selected へ回収される回復 UX を確認（AC-3）。
- validation error（空名等）が form 内で明示される（AC-4）。
- アクセシビリティ: form の input が label と紐づき、送信ボタンが button role を持つこと。

## 証跡メタ（Feedback 4）

- 主証跡ソース: 自動テスト（B-T1〜B-T8 / C-A-T1〜C-A-T3 / C-T1〜C-T8 + 型 gate）+ Playwright spec 名 + 件数。
- screenshot を即時作らない理由: staging 認証が user-gated のため。手動操作不可な環境では Playwright capture spec（desktop/mobile 2 件）を screenshot 予定証跡とし、その旨を `manual-test-result.md` のメタに記す（主ソース = focused tests + Playwright spec 名 + capture 件数）。

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物（execution 時）

- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/screenshots/member-tag-inline-create-form-desktop.png`（user-gated）
- `outputs/phase-11/screenshots/member-tag-inline-create-form-mobile.png`（user-gated）

## 統合テスト連携

- 実装時は task-B の focused tests と task-C の visual capture を Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- 自動テスト件数サマリーを記録
- visual baseline 2 件を取得（user 承認後）または「user-gated 保留」を明記
- screenshot 代替時は主ソース（Playwright spec 名 + 件数）を manual-test-result メタに記載
- AC-6 overlap が mobile screenshot で確認される計画が明記されている
