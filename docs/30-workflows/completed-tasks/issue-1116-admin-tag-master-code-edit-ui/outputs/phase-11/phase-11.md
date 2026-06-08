# Phase 11: 手動テスト（issue-1116 admin tag master code edit UI）

> local implementation evidence captured。本ファイルは手動テスト手順と user-gated staging visual boundary を記録する。

## 11.1 visualEvidence 区分

`VISUAL`（admin 新規ページ）。local fixture visual evidence は `outputs/phase-11/screenshots/` に取得済み。authenticated staging visual は staging deploy 後の user 承認で追加取得する（現状 `pending_user_gate`）。

## 11.2 DoD（Definition of Done）

| # | 完了条件 | 検証手段 | 現状 |
| --- | --- | --- | --- |
| D1 | `pnpm --filter @ubm-hyogo/web typecheck` がパス | typecheck | PASS |
| D2 | `pnpm --filter @ubm-hyogo/web lint` がパス | lint | PASS |
| D3 | focused web test（`tags.update.spec.ts` / `TagMasterPanel.spec.tsx` / shell config）全 PASS | vitest | PASS（3 files / 19 tests） |
| D4 | nav regression（`shell-config.spec.ts`）で tag-master 追加・active 衝突なし | vitest | PASS |
| D5 | `pnpm verify:tokens` / `pnpm verify:no-inline-style` がパス | design-token / inline-style gate | PASS |
| D6 | local fixture で 一覧→編集→409 分離表示 のスクリーンショットを取得する | Playwright desktop-chromium | PASS |
| D7 | authenticated staging で 一覧→編集→保存→409 分離表示 が手動再現できる | manual smoke | pending_user_gate |

## 11.3 手動 smoke 手順（staging・user-gated）

1. admin でログインし sidebar「タグ管理」→ `/admin/tag-master` へ遷移。一覧が表示される（AC-1）。
2. 行を選択し編集フォームを開く。`label` のみ変更して保存 → 200・行反映（AC-4）。
3. `code` を別 tag と重複する値に変更して保存 → 409 `tag_code_conflict` の文言が表示される（AC-3）。
4. 別タブで同 tag の `code` を変更した後、古い編集フォームから `code` を保存 → 409 `tag_stale_conflict` の文言が表示され、画面更新を促す（AC-2/AC-3）。
5. nav: `/admin/tag-master` 表示時に「タグキュー」が active にならないこと（衝突なし）。

## テストケース

| TC-ID | 画面状態 | 期待結果 |
| --- | --- | --- |
| TC-01 | tag master 一覧 | `/admin/tag-master` で一覧と sidebar 導線が表示される |
| TC-02 | 編集フォーム | 一覧行選択で code / label / category 編集フォームに到達できる |
| TC-03 | code conflict | 409 `tag_code_conflict` を「同じコード」文言で表示する |
| TC-04 | stale conflict | 409 `tag_stale_conflict` を「別の変更」文言で表示する |

## 画面カバレッジマトリクス

| TC-ID | 画面 | スクリーンショット証跡 |
| --- | --- | --- |
| TC-01 | 一覧 | `screenshots/tag-master-list.png` |
| TC-02 | 編集フォーム | `screenshots/tag-master-edit-form.png` |
| TC-03 | `tag_code_conflict` 表示 | `screenshots/tag-master-code-conflict.png` |
| TC-04 | `tag_stale_conflict` 表示 | `screenshots/tag-master-stale-conflict.png` |

## 11.4 capture 済みスクリーンショット

- `outputs/phase-11/screenshots/tag-master-list.png` — 一覧
- `outputs/phase-11/screenshots/tag-master-edit-form.png` — 編集フォーム
- `outputs/phase-11/screenshots/tag-master-code-conflict.png` — `tag_code_conflict` 表示
- `outputs/phase-11/screenshots/tag-master-stale-conflict.png` — `tag_stale_conflict` 表示

> 上記は local fixture screenshot。authenticated staging screenshot は staging deploy 後に user-gated で追加取得する。
