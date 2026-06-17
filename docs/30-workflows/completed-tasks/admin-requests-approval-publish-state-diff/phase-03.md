# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL） |
| 上流 | Phase 2（設計） |
| 下流 | Phase 4（テスト作成） |
| 状態 | completed |

## 目的

Phase 2 の設計を 4 条件（価値性 / 実現性 / 整合性 / 運用性）でレビューし、代替案を検討して最終設計を確定する。特に「ダイアログへの diff 表示範囲」「申請内容 dd と diff 行の関係」という Phase 2 で残した判断事項を決着させる。

## 実行タスク

1. **4 条件レビュー**: 価値性 / 実現性 / 整合性 / 運用性で Phase 2 設計を評価する。
2. **代替案検討（ダイアログ diff 表示）**: AC-8（ダイアログで具体遷移提示）を満たす方法を 2 案比較し決定する。
3. **代替案検討（申請内容 dd）**: 既存の `申請内容`（70-73 行 `summarizePayload`）を残すか diff 行へ統合するかを決定する。
4. **a11y レビュー**: 矢印 `aria-hidden` + テキスト意味担保で screen reader 読み上げが自然か検証する。
5. **invariant レビュー**: 3 値限定 / projection 不拡張 / 新規 primitive ゼロ / HEX ゼロが守られているか確認する。
6. **最終設計確定**: 上記を反映した最終設計を `outputs/phase-03/main.md` に記録する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/_shared-context.md | §1 真の論点・§6 AC |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/phase-02.md | レビュー対象の設計（DOM/シグネチャ/CSS/文言） |
| 必須 | apps/web/src/components/admin/RequestConfirmDialog.tsx | 92-94 行表示条件・`RequestConfirmDialogProps`（9-17 行） |
| 必須 | apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx | ダイアログ追従テスト影響範囲 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX 設計指針 | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | a11y / 階層 / トーンの設計指針 |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界 |

### プロジェクト spec 正本

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | primitive catalog（新規 primitive 禁止の確認） |
| 必須 | docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md | admin 画面 contract |

## 4 条件レビュー

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | ◯ | 承認時の before→after 可視化で誤承認リスク・確認コストを低減。Issue #1188 の課題に直結 |
| 実現性 | ◯ | 既存 API response の 3 値 + 既存トークン + `data-diff-side` 属性で 1 サイクル完了可能。新 endpoint / primitive / token 不要 |
| 整合性 | ◯ | 責務は `apps/web/src/components/admin/` に閉じ、`apps/api` diff 0。invariant #5 / ui-prototype #1/#2/#3 を遵守 |
| 運用性 | ◯ | focused vitest（note_type 別 diff）+ verify-design-tokens で回帰保護。VISUAL は staging capture（user-gated）で確認 |

## 代替案検討（ダイアログ diff 表示・AC-8）

| 案 | 内容 | 採否 |
| --- | --- | --- |
| 案 A（採用） | `RequestQueuePanel.tsx` の `destructiveMessage` 生成箇所で具体遷移文言（`公開状態を「公開」から「非公開」へ変更します`）を組み立てる。`RequestConfirmDialog` の props は追加しない | **採用**。既存テスト破壊リスク最小・最小スコープで AC-8 を満たす |
| 案 B（不採用） | `RequestConfirmDialog` に `before`/`after` props を追加し、ダイアログ内に詳細パネルと同じ diff DOM を描画 | 不採用。props 追加で `RequestConfirmDialogProps`（9-17 行）の readonly 契約変更 + 既存テスト追従増。視覚 diff はダイアログでは過剰 |

> **決定**: 案 A。ただし `RequestConfirmDialog`（92-94 行）の表示条件は現状 `isDestructive && destructiveMessage` のため、`visibility_request`（`isDestructive=false`）では destructiveMessage が表示されない。AC-8（visibility でも具体遷移提示）を満たすには、**92 行の表示条件を `destructiveMessage`（中身があれば表示）単独へ緩める**。`isDestructive` は `<p role="alert">` の警告トーン制御に使い、文言表示自体は `destructiveMessage` の有無で判定する。これにより delete=警告トーン + 退会文言、visibility=通常トーン + 遷移文言を出し分ける。`RequestConfirmDialog.spec.tsx` の該当 assertion を追従更新する（AC-10）。

## 代替案検討（申請内容 dd）

| 案 | 内容 | 採否 |
| --- | --- | --- |
| 案 A（採用） | `visibility_request` のとき `申請内容`（`desiredState: hidden` の生表示）を diff 行へ統合し、生の `desiredState:` 文字列を画面から除去。`delete_request` は申請内容 dd を残す（payload 空のため理由等のみ） | **採用**。AC-3（英語値露出なし）と整合 |
| 案 B（不採用） | 申請内容 dd を全 note_type で残し diff 行を別途追加 | 不採用。`desiredState: hidden` の生英語が残り AC-3 に反する |

> **決定**: 案 A。`summarizePayload`（12-20 行）は `delete_request` の理由表示等に役割を限定するか、`visibility_request` では diff 行に置換する。

## a11y レビュー

- 矢印 `<span aria-hidden="true"> → </span>` は装飾扱い。before/after span はテキスト（`公開` / `非公開`）で意味を担保。
- `dt`（`公開状態の変更`）+ `dd`（`公開 → 非公開`）の dl 構造で、screen reader は「公開状態の変更、公開 矢印（読み飛ばし）非公開」と読み上げる。意味は伝わる。
- 既存 `aria-label="申請詳細"`（45 行）/ `aria-labelledby`（46 行）は不変。

## invariant レビュー

| invariant | 状態 |
| --- | --- |
| 3 値限定（publishState/isDeleted/desiredState） | ◯ buildPublishStateDiff は 3 値のみ参照 |
| projection 不拡張 | ◯ API 変更なし |
| 新規 primitive ゼロ | ◯ `data-diff-side` 属性 + globals.css のみ |
| HEX ゼロ | ◯ `var(--ubm-color-*)` のみ |

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-03/main.md | 4 条件レビュー結果 + 最終設計確定 |
| outputs/phase-03/alternatives.md | 代替案比較（ダイアログ diff / 申請内容 dd）の詳細 |

## 統合テスト連携

- ダイアログ表示条件の決定（92 行緩和）が Phase 4 の `RequestConfirmDialog.spec.tsx` 追従テストに反映される。
- 申請内容 dd の統合決定が Phase 4 の `RequestQueueDetail.spec.tsx` assertion に反映される。

## 完了条件

- [ ] 4 条件レビューで全条件 ◯ を確認した。
- [ ] ダイアログ diff 表示は案 A（destructiveMessage 文言生成 + 92 行表示条件緩和）に決定した。
- [ ] 申請内容 dd は案 A（visibility は diff 行へ統合）に決定した。
- [ ] a11y（矢印 aria-hidden + テキスト意味担保）を検証した。
- [ ] invariant（3 値 / projection / primitive / HEX）の遵守を確認した。
- [ ] 最終設計を main.md に確定した。
