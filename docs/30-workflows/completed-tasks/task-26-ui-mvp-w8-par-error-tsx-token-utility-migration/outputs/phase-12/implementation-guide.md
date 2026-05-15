# Phase 12 — 実装ガイド

## 視覚証跡

実 UI surface の className を変更したため、Phase 11 で `outputs/phase-11/screenshots/not-found-desktop.png` を保存した。`error.tsx` と `loading.tsx` は component render assertion で補完する。task-18 `playwright-smoke / visual` は downstream broad regression gate であり、本 task では実測済み扱いにしない。

---

## Part 1（中学生レベル概念説明）

### この作業は何ですか？

ウェブサイトの「エラーが出たときの画面」で使われている色の **書き方** を、新しい正式な書き方に直す作業です。**色そのものは変えません**。

### 例え話

クレヨンの箱を想像してください。各色には「赤」「青」「黄色」というラベル（名札）がついています。

これまでこの error 画面では、「赤」と書く代わりに「クレヨン箱の左から 3 番目のクレヨン」と書いていました。これでも色は同じ赤ですが、

- とても長くて読みにくい
- 箱の中身が変わると（並びが変わると）困る
- 「左から 3 番目のクレヨン」というラベルが、本当はクレヨン箱に存在しなかった（命名ミス）こともありました

そこで、ちゃんとした正式なラベル（「赤」「青」など）に書き直しました。**塗ったあとの色は完全に同じです**が、書き方だけが整理されました。

### なぜ必要ですか？

- 同じ色を、開発チーム全員が同じラベルで呼べるようになる（コミュニケーションが楽）
- 新しく入った人が「このラベルは何の色？」と探さなくて済む
- ラベルがちゃんと存在することを CI（自動チェック）が確認できる

### 何をしましたか？

- `apps/web/app/error.tsx` のなかで、`text-[var(--ubm-color-text-primary)]` のような長い書き方を、`text-text` のような短い正式な書き方に変えた
- 旧互換ラベル `--ubm-color-fg-muted` を、runtime の正式 utility `text-text-3`（= `--ubm-color-text-muted`）に直した

---

## Part 2（開発者向け技術詳細）

### 契約（current facts）

| 層 | ファイル | 役割 | 本 task の操作 |
|----|---------|------|---------------|
| SSOT | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | token 正本（task-08） | 不変 |
| token CSS | `apps/web/src/styles/tokens.css` | `--ubm-color-*` 定義 | 不変 |
| bridge | `apps/web/src/styles/globals.css` `@theme inline` | Tailwind utility 名 → `--ubm-color-*` | 不変 |
| consumer | `apps/web/app/error.tsx` | error boundary UI | **置換** |

### 利用可能 utility（task-09 で確立済み）

```css
@theme inline {
  --color-text:        var(--ubm-color-text-primary);
  --color-text-2:      var(--ubm-color-text-secondary);
  --color-text-3:      var(--ubm-color-text-muted);
  --color-surface:     var(--ubm-color-surface-bg);
  --color-surface-2:   var(--ubm-color-surface-bg-2);
  --color-panel:       var(--ubm-color-surface-panel);
  --color-panel-2:     var(--ubm-color-surface-panel-2);
  --color-accent:      var(--ubm-color-accent);
  --color-accent-soft: var(--ubm-color-accent-soft);
  --color-accent-ink:  var(--ubm-color-accent-ink);
  --color-ok:          var(--ubm-color-ok);
  --color-ok-soft:     var(--ubm-color-ok-soft);
  --color-warn:        var(--ubm-color-warn);
  --color-warn-soft:   var(--ubm-color-warn-soft);
  --color-danger:      var(--ubm-color-danger);
  --color-danger-soft: var(--ubm-color-danger-soft);
  --color-info:        var(--ubm-color-info);
  --color-info-soft:   var(--ubm-color-info-soft);
  --color-border:      var(--ubm-color-border-default);
  --color-border-2:    var(--ubm-color-border-strong);
}
```

### 置換マッピング（canonical）

| Before | After | 経路 |
|--------|-------|------|
| `text-[var(--ubm-color-fg-muted)]`（旧互換 alias / runtime stale） | `text-text-3` | 命名齟齬の解消 |
| `text-[var(--ubm-color-danger)]` | `text-danger` | bridge `--color-danger` |
| `bg-[var(--ubm-color-surface-2)]`（旧互換 alias / runtime stale） | `bg-surface-2` | `--ubm-color-surface-bg-2` bridge |
| `bg-[var(--ubm-color-primary)]`（SSOT 未定義） | `bg-accent` | `--ubm-color-accent` bridge |
| `text-[var(--ubm-color-on-primary)]`（SSOT 未定義） | `text-panel` | panel surface ink substitute |
| `border-[var(--ubm-color-border)]`（旧互換 alias / runtime stale） | `border-border` | `--ubm-color-border-default` bridge |

### エラーハンドリング / エッジケース

- task-05 の error.tsx 未存在時: 本 task は blocked（unblock condition = task-05 完了）
- 副次対象（global-error / not-found / loading）にパターンが存在しない場合: 操作不要・Phase 12 changelog に「該当なし」と記録
- task-18 downstream visual baseline diff 検知: 期待外 → 設計ミスとして revert + 再評価

### CI gate

- task-18 `verify-design-tokens`: local completed
- task-18 `playwright-smoke / visual (chromium, 4 screens)`: downstream runtime gate

### 設定可能パラメータ

なし（純粋な className リテラル置換）。
