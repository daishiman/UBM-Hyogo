# Phase 11: VISUAL Evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 11 / 13 |
| Phase 名称 | VISUAL Evidence |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (正本同期) |
| 状態 | pending |
| artifacts.json.metadata.visualEvidence | VISUAL |
| 証跡の主ソース | `outputs/phase-11/main.md` + screenshot 6 枚 + axe report + test report |

## 判定

本タスクは MemberDrawer 内の notes section / NoteForm を新規追加する **UI 変更を伴う実装**。
visual evidence は必須。

## 取得 screenshot 一覧

| ID | 画面 / 状態 | 配置先 |
| --- | --- | --- |
| SS-01 | drawer notes section 初期表示（既存 notes 一覧 + 「メモを追加」ボタン） | `outputs/phase-11/ss-01-notes-initial.png` |
| SS-02 | NoteForm 新規モード（textarea 空 + 追加/キャンセル） | `outputs/phase-11/ss-02-noteform-new.png` |
| SS-03 | NoteForm 編集モード（initialBody 反映） | `outputs/phase-11/ss-03-noteform-edit.png` |
| SS-04 | submit 成功時の toast 表示 | `outputs/phase-11/ss-04-toast-success.png` |
| SS-05 | submit 失敗時の toast 表示（409 想定） | `outputs/phase-11/ss-05-toast-error.png` |
| SS-06 | validation error 表示（空文字 submit） | `outputs/phase-11/ss-06-validation-error.png` |

## canonical evidence entry

`outputs/phase-11/main.md` に以下を集約する。

- visualEvidence = VISUAL
- SS-01..SS-06 のファイル実体、撮影日時、viewport、対象 route
- `outputs/phase-11/axe-report.md` の新規 violation 0
- `outputs/phase-11/test-report.md` の実行コマンド / exit code
- runtime / staging / CI が未実行の場合の境界語彙 `runtime_pending`

## 取得手順

```bash
mise exec -- pnpm dev
# Chrome / Firefox の DevTools で:
# - viewport 1280x800（admin 標準）
# - admin login (manjumoto.daishi@senpai-lab.com)
# - /admin/members → member row click → drawer 開く → notes section へスクロール
# - 各シナリオで screenshot 取得
```

a11y 補足: 各 screenshot 取得時に DevTools の axe-core を 1 回実行し、新規 violation 0 を `outputs/phase-11/axe-report.md` に記録。

## test report

`outputs/phase-11/test-report.md` に以下を集約:
- unit test 結果（Phase 6 / 7）
- integration test 結果（Phase 8）
- coverage 数値（Phase 9 G-4）

## 完了条件

- [ ] SS-01..SS-06 取得済（6 枚）
- [ ] `outputs/phase-11/main.md` 作成
- [ ] `outputs/phase-11/axe-report.md` 新規 violation 0
- [ ] `outputs/phase-11/test-report.md` 作成
- [ ] design token 違反が screenshot 上で確認できない（HEX っぽい色がない）

## タスク100%実行確認【必須】

- [ ] screenshot 6 枚
- [ ] a11y report 1 件
- [ ] test report 1 件

## 次Phase

Phase 12 (正本同期): hook surface を後続 step-02..08 が import するための index.md / docs 同期。
