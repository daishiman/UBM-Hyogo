# Phase 11: 手動テスト

> Phase: 11 / 13
> visual classification: VISUAL

---

## 目的

3 層評価（Semantic / Visual / AI UX）を実行し、HIGH 問題を unassigned-task に自動生成する。

---

## 11.1 起動

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# http://localhost:3000 を開く
```

---

## 11.2 確認画面と手順

| TC | 画面 | 操作 | 期待結果 |
|----|------|------|---------|
| TC-01 | `/(public)/members` | tag pill を click | 背景が `var(--ubm-color-text-primary)` で塗りつぶし、文字色が反転 |
| TC-02 | `/(public)/members` | member card に hover | border-color が `--ubm-color-border-strong`、box-shadow `--ubm-shadow-sm` に transition |
| TC-03 | `/(public)/members` | member card に Tab focus | focus-visible outline 表示 |
| TC-04 | `/(public)/members/[id]` | section 描画 | `data-visibility="public"` に対応する左ボーダー `--ubm-color-ok` + `🌍` icon |
| TC-05 | `/(public)/register`（FormPreviewSections 経由） | visibility ラベル | 値に応じた label marker |
| TC-06 | component fixture / mock route | `member` / `admin` visibility を注入 | production API 未提供値でも selector と token が再現可能 |

---

## 11.3 screenshot 取得

`outputs/phase-11/screenshots/` 配下にセマンティック canonical 名で保存:

- `tag-pill-selected.png`
- `tag-pill-default.png`
- `member-card-hover.png`
- `member-card-focus.png`
- `profile-section-public.png`
- `profile-section-member.png`（テストデータで visibility=member の section を render し撮影）
- `profile-section-admin.png`（同上）

メタデータ `outputs/phase-11/metadata.json`:

```json
{
  "tc": "TC-01",
  "file": "tag-pill-selected.png",
  "viewport": "1280x800",
  "browser": "chromium"
}
```

---

## 11.4 3 層評価

| 層 | チェック内容 |
|----|-------------|
| Semantic | `aria-pressed` / `data-selected` / `data-visibility` が正しく属性化されている |
| Visual | prototype（`docs/00-getting-started-manual/claude-design-prototype/`）との比較で差分が許容範囲内 |
| AI UX | screen reader（VoiceOver）で tag pill 選択状態が読み上げられる |

## 11.5 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
```

---

## 11.6 HIGH issue 検出時

`docs/30-workflows/unassigned-task/` 配下に follow-up task を自動生成。

---

## DoD

- [ ] 6 TC すべて `completed (runtime evidence captured)`
- [ ] screenshot 7 枚保存
- [ ] HIGH issue なし or 自動 task 化済み
