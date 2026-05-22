# Phase 11 — 手動テスト (VISUAL)

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| 名前 | 手動テスト (VISUAL) |
| 状態 | completed |
| 依存 | Phase 10 (Gate-B passed) |
| 入力 | Phase 5 実装 + 起動済 localhost |
| 出力 | outputs/phase-11/manual-test-result.md, screenshot-plan.json, phase11-capture-metadata.json, screenshots/ |

## 目的

admin UI 3 ステップ wizard の VISUAL evidence を取得し、Gate-C (manual_test) 通過 evidence を作る。

## タスク

- [x] `screenshot-plan.json` を作成（mode=VISUAL）
- [x] `phase11-capture-metadata.json` を作成（taskId=UT-07C-FU-001）
- [x] local Playwright admin fixture → meeting 詳細画面遷移
- [x] 4 シナリオの screenshot を取得
- [x] `manual-test-result.md` に結果を記録

## 取得 screenshot canonical 名

| ファイル名 | シナリオ |
| --- | --- |
| `S1-upload.png` | upload 待機状態 |
| `S2-preview.png` | dry-run preview 表示（ok 行 + duplicate 1 件） |
| `S3-confirm-done.png` | commit 完了画面（summary 表示） |
| `S4-error-deleted-member.png` | deleted_member を含む CSV で preview 時のエラー表示 |

すべて `outputs/phase-11/screenshots/` 配下に配置。

## `screenshot-plan.json` スキーマ

```json
{
  "mode": "VISUAL",
  "taskId": "UT-07C-FU-001",
  "screenshots": [
    { "name": "S1-upload.png", "scenario": "upload 待機" },
    { "name": "S2-preview.png", "scenario": "dry-run preview" },
    { "name": "S3-confirm-done.png", "scenario": "commit 完了" },
    { "name": "S4-error-deleted-member.png", "scenario": "deleted_member エラー" }
  ]
}
```

## `phase11-capture-metadata.json` スキーマ

```json
{
  "taskId": "UT-07C-FU-001",
  "capturedAt": "<ISO8601>",
  "environment": "localhost",
  "browser": "Chromium",
  "viewport": "1440x900",
  "screenshots": [
    { "file": "screenshots/S1-upload.png", "sha256": "<>" }
  ]
}
```

## 成果物

- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/screenshot-plan.json`
- `outputs/phase-11/phase11-capture-metadata.json`
- `outputs/phase-11/screenshots/{4 ファイル}`

## Phase 11 evidence file inventory

Phase 12 compliance checker が parse できるよう、実行時は `Path` / `Status` 列を持つ以下の表を
`outputs/phase-12/phase12-task-spec-compliance-check.md` に同値転記する。

| Path | Status | Evidence type | Notes |
| --- | --- | --- | --- |
| `outputs/phase-11/manual-test-result.md` | `present` | manual result | local Playwright fixture result recorded |
| `outputs/phase-11/screenshot-plan.json` | `present` | plan | S1-S4 canonical names |
| `outputs/phase-11/phase11-capture-metadata.json` | `present` | metadata | sha256 recorded |
| `outputs/phase-11/screenshots/S1-upload.png` | `present` | screenshot | upload state |
| `outputs/phase-11/screenshots/S2-preview.png` | `present` | screenshot | preview state |
| `outputs/phase-11/screenshots/S3-confirm-done.png` | `present` | screenshot | done state |
| `outputs/phase-11/screenshots/S4-error-deleted-member.png` | `present` | screenshot | deleted member preview |

## 完了条件

- 4 screenshot が canonical 名で配置されている
- `phase11-capture-metadata.json` に sha256 が記録されている
- `manual-test-result.md` に 4 シナリオの実行結果（PASS/FAIL）が記録されている

## 注意点 / リスク / 既知制限

- localhost のみ手動。staging deploy 後の検証は本タスクの **Phase 13 範囲外**
- screenshot に実会員の氏名・メールアドレスが映り込まないようテストデータを使用する
- Phase 11 evidence existence validator (`verify-phase11-evidence`) が CI で path 検証を行うため、canonical 名から逸脱しないこと
