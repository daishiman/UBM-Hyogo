# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

AC-1〜AC-6 の充足を「実装時に満たすべき判定基準」として定義し、blocker / MINOR を判定する。
今回の #1068（admin member drawer の tag inline-create UI）サイクル内で完了すべき項目は未タスクへ逃がさない（CONST_007）。MINOR 指摘がある場合は Phase 12 の未タスク検出で分類する。

> 本 spec は未実装の `spec_created` 段階のため、本 Phase は「実装時に各 AC を満たすために満たすべき判定基準」を記述する。テスト ID は task-B（unit）/ task-C（visual）で実装時に確定する想定の論理識別子を記載する。

## AC 充足判定（実装時の判定基準）

| AC | 内容 | 判定基準（test ID 想定） |
| --- | --- | --- |
| AC-1 | drawer から新規 tag を作成できる | B-T1（inline-create form の表示 / 送信 → `createTag` 呼び出し）/ C-form（visual 展開） |
| AC-2 | 作成後 member 付与 pill が反映される | B-T2（作成成功 → 既存 selected pill 集合へ追加され pill が selected 表示）/ C-form |
| AC-3 | 409 conflict を既存選択へ回収する | B-T3（409 応答時、既存同名 tag を解決し selected へ反映 / 重複作成しない）/ C-conflict |
| AC-4 | validation error を表示する | B-T4（空名 / 不正名 → form 内に error message 表示・送信抑止） |
| AC-5 | 既存付与解除・/admin/tags 管理画面に regression なし | B-T5（既存 pill toggle/unassign が従来通り動作）/ C-form（既存 pill 表示維持）/ 手動: /admin/tags master 画面の表示・編集 regression 0 |
| AC-6 | desktop/mobile で操作部品と pill が重ならない | C-form-mobile（mobile viewport で form 入力欄と既存 tag pill の overlap が無いこと）/ B-T（layout role 構造の assertion） |

## blocker 判定（実装時）

| 項目 | 状態 |
| --- | --- |
| 機能 blocker | なし想定（全 AC を unit + visual テストで担保する計画） |
| API 依存 | **apps/api 変更なし**。既存 tag create / member tag assign endpoint surface のみ利用。新 endpoint 追加禁止 |
| runtime 依存 | staging visual baseline（Phase 11 / task-C）は user-gated。機能 blocker ではない |

## 既存 issue-982 編集 UI regression 0 の確認方法

- #982 で実装済みの drawer tag **pill 編集**（selected/unselected toggle・楽観更新・rollback）が inline-create 追加後も従来通り動作することを確認する。
  - `MemberDrawer.tsx` の `MemberTagsEditor` 既存 pill 描画・toggle ハンドラを破壊しないこと（B-T5）。
  - 既存 visual baseline `member-drawer-tag-edit.png`（task-C 同ディレクトリ）に差分が出ないこと（inline-create UI は既存 pill 領域の外側に追加配置）。
  - `git diff --stat apps/api` が 0 件であること（API surface 不変）。

## scope 外候補（Phase 12 未タスク検出へ渡す）

- tag master の inline-create からの色 / 説明など拡張属性編集 — 本タスクは name 作成のみで MVP 充足。
- bulk inline-create（複数 tag 一括作成）— scope 外。
- /admin/tags master 画面側への inline-create 導線追加 — 本タスクは drawer 内のみが scope。

> 上記は #1068 の AC 充足には不要な scope 外候補。Phase 12 では「今回サイクル内で完了すべき未タスク 0 件」と「将来検討候補（baseline）」を分離し、未タスク化が必要な場合だけ理由・実施場所・時期を明記する。

## 4 条件評価

| 条件 | 評価 |
| --- | --- |
| 価値性 | drawer 内で tag 作成 → 即付与が完結し、/admin/tags への画面遷移往復を排除。管理者の付与作業を短縮 |
| 実現性 | 既存 endpoint surface + 既存 `MemberTagsEditor` への追加のみ。apps/api 不変で実装容易 |
| 整合性 | 409 を既存選択へ回収する設計で tag master の一意性と矛盾しない。既存 #982 編集 UI と pill モデルを共有 |
| 運用性 | apps/api 変更なし・D1 schema 不変。visual baseline は user-gated だが機能は unit テストで担保 |

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 最終レビュー結果（AC 充足判定基準 / blocker なし / MINOR 候補の有無）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests（task-B）と Phase 11 evidence ledger（task-C）に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- AC-1〜AC-6 が判定基準（test ID 想定）で裏付けられている
- blocker なし判定（apps/api 変更 0 を含む）
- 既存 issue-982 編集 UI regression 0 の確認方法が明記されている
- 4 条件評価が記録され、scope 外候補を Phase 12 へ引き継ぐ
