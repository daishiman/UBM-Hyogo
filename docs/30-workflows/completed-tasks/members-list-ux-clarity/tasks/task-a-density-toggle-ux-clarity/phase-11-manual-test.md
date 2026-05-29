<!-- workflow: members-list-ux-clarity / task: A / phase: 11 -->

# Phase 11 — 手動テスト (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]
[visualEvidence: VISUAL]

## 1. タスク種別判定

- UI task / VISUAL: コンポーネント表示が変更されるため screenshot 必須
- screenshot は component-level の単独確認のみ (full page baseline は Task C 担当)

## 2. 検証環境

| 項目 | 値 |
| ---- | -- |
| dev server | `mise exec -- pnpm --filter @ubm/web dev` (http://localhost:3000) |
| route | `/members` |
| ブラウザ | 最新 Chrome (evergreen) を正本、Firefox / Safari は MVP 確認 |
| viewport | 1440 / 1024 / 768 / 375 (4 段階) |

## 3. 手動検証手順

### 3.1 desktop (1440)

1. `/members?density=comfy` を開く → Segmented `ゆったり` が aria-checked、下段に `カード詳細` 表示
2. `/members?density=dense` に切替 → `密` aria-checked、下段に `カード簡易` 表示
3. `/members?density=list` に切替 → `リスト` aria-checked、下段に `1行リスト` 表示
4. `?` icon をクリック → popover が開き、3 ペア (ラベル + 説明) が dl で表示される
5. もう一度 `?` クリック → popover が閉じる
6. キーボード Tab で `?` summary に focus → Space / Enter で open / close

### 3.2 mobile (375)

1. viewport 375 で `/members` を開く → Segmented の下段 sublabel が visually-hidden
2. `?` icon は引き続き visible で popover が画面内に収まる (max-width 制約)
3. Segmented の高さが desktop と同等 (主ラベル行のみ表示) で崩れない

### 3.3 a11y

1. macOS VoiceOver で `?` 部に focus → "表示密度の説明を見る、ボタン" と読み上げ
2. 各 radio に focus → 主ラベル + visually-hidden description が読み上げられる
3. radiogroup へ移動 → "表示密度、ラジオグループ" と読み上げ

### 3.4 URL preservation

1. `/members?q=山田&zone=0_to_1` で開く → dense に切替 → URL が `/members?q=山田&zone=0_to_1&density=dense` になる
2. comfy に戻す → URL が `/members?q=山田&zone=0_to_1` (density 削除のみ) になる

## 4. スクリーンショット項目 (証跡)

| ファイル名 | viewport | density | 状態 | 配置 |
| ---------- | -------- | ------- | ---- | ---- |
| `density-toggle-desktop-comfy.png` | 1440 | comfy | HelpHint closed | `outputs/phase-11/screenshots/` |
| `density-toggle-desktop-help-open.png` | 1440 | comfy | HelpHint open | 〃 |
| `density-toggle-desktop-dense.png` | 1440 | dense | HelpHint closed | 〃 |
| `density-toggle-desktop-list.png` | 1440 | list | HelpHint closed | 〃 |
| `density-toggle-mobile-comfy.png` | 375 | comfy | HelpHint closed (sublabel hidden) | 〃 |
| `density-toggle-mobile-help-open.png` | 375 | comfy | HelpHint open (popover 折り返し) | 〃 |

> 画像 6 枚を `outputs/phase-11/screenshots/` に配置し、`outputs/phase-11/phase11-capture-metadata.json` で
> taskId / canonical 名 / viewport / state を 1:1 で記録する。

## 5. 結果記録テンプレ (`outputs/phase-11/manual-test-result.md`)

```
- 実行日:
- 実行者:
- ブラウザ: Chrome xxx.x / VoiceOver
- 結果サマリー: 6 viewport-state combination 全 PASS
- 異常: (なし / 詳細)
- screenshot 一覧: 6 ファイル (上記表)
- 既知制限: 古い Safari の details 挙動差は MVP スコープ外
```

## 6. DoD

- [ ] desktop / mobile 双方で目視検証完了
- [ ] スクリーンショット 6 枚取得
- [ ] VoiceOver で 3 シナリオ確認
- [ ] URL preservation 2 シナリオ確認
- [ ] `outputs/phase-11/manual-test-result.md` 作成
- [ ] `outputs/phase-11/phase11-capture-metadata.json` 作成 (taskId=task-a-density-toggle-ux-clarity / mode=VISUAL)
