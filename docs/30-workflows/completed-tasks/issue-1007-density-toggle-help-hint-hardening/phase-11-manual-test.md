# Phase 11: 手動テスト（VISUAL）

`[実装区分: 実装仕様書]`

## 11.1 タスク種別宣言

- **VISUAL タスク**: `/members` の HelpHint 開閉・help icon 表示に視覚差分があるため screenshot 必須。
- `screenshot-plan.json` の `mode` は `VISUAL`、`taskId` は `issue-1007-density-toggle-help-hint-hardening`。

## 11.2 screenshot 計画（canonical 名 = `<component>-<state>.png`）

| ファイル名 | 状態 | 確認点 |
|------------|------|--------|
| `density-toggle-help-closed.png` | HelpHint closed | summary に help icon（`?` 平文でない）が円内中央に表示 |
| `density-toggle-help-open.png` | HelpHint open | dl popover が右寄せで表示、3 density の dt/dd |
| `density-toggle-segmented.png` | 3 radio + sublabel | comfy=選択状態、sublabel 表示 |

配置: `outputs/phase-11/screenshots/`。`phase11-capture-metadata.json` の `tc` フィールドで TC-4/TC-5/TC-8 と紐付け。

## 画面カバレッジマトリクス

| テストケース | 画面状態 | 証跡 |
| --- | --- | --- |
| TC-4 | HelpHint open / Escape close 対象 | `outputs/phase-11/screenshots/density-toggle-help-open.png` |
| TC-5 | HelpHint open / outside pointer close 対象 | `outputs/phase-11/screenshots/density-toggle-help-open.png` |
| TC-7 | summary native toggle 対象 | `outputs/phase-11/screenshots/density-toggle-help-closed.png` |
| TC-8 | help icon / segmented 表示 | `outputs/phase-11/screenshots/density-toggle-help-closed.png`, `outputs/phase-11/screenshots/density-toggle-segmented.png` |

## 11.3 3 層評価

| 層 | 確認 |
|----|------|
| Semantic | radiogroup / radio / aria-describedby / summary aria-label が正しい a11y tree を構成 |
| Visual | icon が token 色を継承、popover の影/角丸が既存 token（`--ubm-shadow-md` / `--ubm-radius-md`）と一致 |
| AI UX | Escape / click-outside で閉じる操作が直感に合致、focus 戻しが自然 |

## 11.4 手動操作手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# /members を開く
# 1) ? アイコン click → popover 開く（screenshot: help-open）
# 2) popover 外を click → 閉じる
# 3) 再度開いて Escape → 閉じる + focus が ? に戻る
```

> 環境の D1/dev サーバ起動が困難な場合は、focused vitest（TC-4/TC-5/TC-7）+ Playwright smoke を代替主証跡とし、screenshot は dev 起動可能時に取得する旨を `manual-test-result.md` メタに明記する。

## 11.5 フィードバックループ

- HIGH 問題があれば `docs/30-workflows/unassigned-task/` に自動起票。なければ 0 件と明記。

## 完了条件
- 3 screenshot（または代替主証跡 + 取得保留理由）と 3 層評価結果を `outputs/phase-11/manual-test-result.md` に記録。
