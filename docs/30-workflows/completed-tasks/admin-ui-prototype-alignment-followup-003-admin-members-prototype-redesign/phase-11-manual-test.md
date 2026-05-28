# Phase 11 — 手動テスト + 視覚 evidence

[実装区分: 実装仕様書]

## 1. 視覚 evidence マトリクス（16 PNG）

| viewport | state | path |
| --- | --- | --- |
| mobile 390×844 | loaded | `outputs/phase-11/screenshots/admin-members-loaded-mobile.png` |
| mobile 390×844 | empty | `outputs/phase-11/screenshots/admin-members-empty-mobile.png` |
| mobile 390×844 | published | `outputs/phase-11/screenshots/admin-members-published-mobile.png` |
| mobile 390×844 | hidden | `outputs/phase-11/screenshots/admin-members-hidden-mobile.png` |
| tablet 834×1112 | loaded / empty / published / hidden | (同上 4 枚) |
| laptop 1280×800 | loaded / empty / published / hidden | (同上 4 枚) |
| desktop 1440×900 | loaded / empty / published / hidden | (同上 4 枚) |

2026-05-27 の実行サイクルで上記 16 PNG を `outputs/phase-11/screenshots/` に生成済み。スクリーンショット一覧は `outputs/phase-11/screenshot-inventory.json` に保存する。

## 2. 手動 smoke

```text
[ ] dev server で /admin/members を開き、page-head が prototype と一致
[ ] PillNav の "公開中" を選択し URL に ?filter=published 同期
[ ] 検索 box に "テスト" 入力 → blur で ?q=テスト 同期
[ ] 行クリックで Drawer が開く
[ ] Drawer 内 VISIBILITY Switch を切替 → 楽観更新 + toast
[ ] Drawer 内 "退会処理" 押下 → confirm キャンセル → mutation 呼ばれない
[ ] Drawer 内 "退会処理" → confirm OK → 行が "退会" chip 表示に切替
[ ] Tab キーで focus 遷移、Esc で Drawer close
```

実行結果は `outputs/phase-11/manual-smoke-log.md` に記録。

## 3. Phase 11 evidence file inventory

`outputs/phase-12/phase12-task-spec-compliance-check.md` 内に下記表で記載すること:

```markdown
## Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| screenshot | outputs/phase-11/screenshots/admin-members-loaded-mobile.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-loaded-tablet.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-loaded-laptop.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-loaded-desktop.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-empty-mobile.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-empty-tablet.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-empty-laptop.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-empty-desktop.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-published-mobile.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-published-tablet.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-published-laptop.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-published-desktop.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-hidden-mobile.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-hidden-tablet.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-hidden-laptop.png | present |
| screenshot | outputs/phase-11/screenshots/admin-members-hidden-desktop.png | present |
| manual test result | outputs/phase-11/manual-smoke-log.md | present |
| phase 11 main | outputs/phase-11/main.md | present |
| route-cause analysis | outputs/phase-11/lane-a-route-cause.md | present |
| axe report | outputs/phase-11/axe-result.md | present |
| coverage | outputs/phase-11/coverage-changed.txt | present |
| local qa | outputs/phase-11/local-qa.md | present |
```

Status は実生成後の実体確認結果として `present` を記録する。
