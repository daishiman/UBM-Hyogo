<!-- workflow: members-list-ux-clarity / task: A / phase: 3 -->

# Phase 3 — 設計レビュー (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

## 1. 真の論点

「`DensityToggle` の各モードが何のためのものかを、主ラベルを変えずに伝える」ことを、
**Segmented primitive を壊さず**かつ**新 primitive を増やさず**に達成する。

## 2. 代替案比較

### 2.1 sublabel 描画位置: Segmented 内 `<button>` (採用) vs 外部 caption 行

| 観点 | A: button 内 sublabel (採用) | B: Segmented 下に caption 行 |
| ---- | ---------------------------- | ----------------------------- |
| 視覚的近接性 | 主ラベルと sublabel が同列 → 意味の結合が直感的 | 視線移動が必要で結びつきが弱い |
| a11y | `<button>` テキストの一部として `aria-label`/`accessible name` に統合可能 | 外部 caption は別途 `aria-describedby` 必須 |
| 実装コスト | Segmented option 型 +1 prop (optional) | Segmented 外側に追加コンポーネント要 |
| 後方互換 | sublabel undefined のとき既存挙動完全維持 | 既存呼び出しに影響なし |

**採用根拠**: A 採用。Segmented option shape の加法拡張は INV-3 (新 primitive 禁止) と整合し、視覚的近接性も勝る。

### 2.2 description 提供方法: visually-hidden span + aria-describedby (採用) vs title 属性

| 観点 | A: visually-hidden span + `aria-describedby` (採用) | B: `title` 属性 |
| ---- | ---------------------------------------------------- | --------------- |
| SR 読み上げ | 確実に description が読み上げられる | title は SR が読まないブラウザあり |
| キーボード | focus 時に SR が description を announce | title は hover 限定 (キーボード non-friendly) |
| WCAG 準拠 | `aria-describedby` は WAI-ARIA 標準 | title は anti-pattern (避けるべき) |

**採用根拠**: A 採用。a11y 観点で title 属性は不適切。

### 2.3 HelpHint 実装: `<details>` ベース (採用) vs `useState` + button + section

| 観点 | A: `<details><summary>` (採用) | B: `useState` + button |
| ---- | ------------------------------ | ---------------------- |
| focus 管理 | native (ESC で閉じる挙動なし、ただし Tab は通常通り) | 自前で `useEffect` + ESC handler 実装 |
| バンドル増 | 0 (native HTML) | hook + handler 分の差分 |
| a11y | `<summary>` は native button + expanded 状態管理 | 自前で `aria-expanded` / `aria-controls` |
| 制限 | 古い Safari で挙動差・click-outside 自動 close なし | 任意挙動を実装可能 |

**採用根拠**: A 採用。MVP 対応ブラウザは evergreen で問題なく、実装コストが圧倒的に低い。click-outside 自動 close は MVP スコープ外として明記。

### 2.4 description 配置: option ごとの visually-hidden span (採用) vs HelpHint 本文のみ

| 観点 | A: 個別 span (採用) | B: HelpHint 本文のみ |
| ---- | ------------------ | -------------------- |
| 各 button focus 時 SR announce | `aria-describedby` で確実に対応 description が読まれる | HelpHint を開かないと description にアクセスできない |
| 視覚 | visually-hidden で UI 影響 0 | UI 影響 0 (HelpHint 内のみ) |
| 冗長性 | description が 2 箇所 (span + HelpHint) | 1 箇所 |

**採用根拠**: A 採用。冗長性は受容可能で、a11y (button focus 時即時 announce) の方が価値が大きい。
description テキストは OPTIONS 配列 1 箇所で管理し、span と HelpHint が同じソースを参照する形で DRY 維持。

## 3. 価値とコスト

| 項目 | 値 |
| ---- | -- |
| 期待効果 | density 試行錯誤回数 ~3 → 0 / SR ユーザーへ意味伝達 |
| 推定 LOC | +120 / -10 |
| 推定工数 | 半日 (TDD RED → GREEN → refactor → manual visual) |
| 影響範囲 | `/members` のみ。`Segmented` を他で呼ぶ箇所には optional prop 追加のみで影響 0 |
| API/Schema/Token 変更 | 0 |
| 新 primitive | 0 |

## 4. 4 条件評価

| 条件 | 評価 |
| ---- | ---- |
| 整合 (CLAUDE.md / プロトタイプ / 既存 API / tokens) | ◎ 主ラベル不変・URL query 不変・OKLch tokens のみ |
| 価値 (UX 課題解消 / a11y 強化) | ◎ 観察課題 1 件直接解消 + SR 改善 |
| コスト (LOC / primitive 追加 / API 変更) | ◎ 新 primitive 0、API 変更 0、LOC < 150 |
| 副作用 (他 route 影響 / 既存 test 破壊) | ◎ Segmented optional prop のみで他 route 影響なし。既存 spec 3 ケースは AC-A5/A6 で保護 |

## 5. risks (Phase 4 以降の監視対象)

| ID | リスク | 対策 |
| -- | ------ | ---- |
| RA-1 | sublabel 追加で Segmented 高さが変わり既存 visual baseline drift | Task C で baseline 再撮影 (user-gated) |
| RA-2 | 古い Safari `<details>` 挙動差 | MVP 対応 evergreen 前提を AC-A7 で固定 |
| RA-3 | mobile sublabel visually-hidden 化で意味伝達後退 | HelpHint icon は常時表示で補完 (Phase 2 § 5) |
| RA-4 | 同一ページ内に複数 DensityToggle が並ぶ将来要件で `density-{value}-desc` id 重複 | 現状 1 個のみ。複数化要件出現時に `useId()` 移行を未タスク化 |

## 6. open questions の解消

| Q (phase-2 § 9) | A |
| --------------- | -- |
| visually-hidden description を span 3 個 vs `<dl>` 1 個 | **span 3 個**採用。`aria-describedby` の id 解決を 1:1 にし、HelpHint 内の `<dl>` とは別途レンダする (DRY は OPTIONS 配列で担保) |
| `?` を SVG icon vs 文字グリフ | **文字グリフ** (`?` U+003F or `？` U+FF1F の半角を採用)。SVG icon 追加は新規依存になるため避ける |
| HelpHint 表示位置 | desktop は `position: absolute` で Segmented 右下、mobile は同 position だが `max-width: calc(100vw - 32px)` で折返し許容 |

## 7. 改善優先順位

1. Segmented option 型拡張 (後方互換確認: 既存 spec PASS)
2. DensityToggle OPTIONS 拡張 + visually-hidden span 配置
3. HelpHint コンポーネント新規作成
4. CSS (sublabel / help-hint / mobile media)
5. テスト追加 (AC-A1〜A4)

## 8. 承認可否

| 項目 | 結果 |
| ---- | ---- |
| Phase 1 AC との整合 | ○ |
| 親 workflow 不変条件 (INV-1..6) | ○ |
| 既存 spec 3 ケース互換 (AC-A5/A6) | ○ |
| 新 primitive 0 | ○ |
| URL query / API / tokens 変更 | 0 |

**結論**: Phase 4 (test plan) へ進行可。

## DoD

- [x] 代替案比較が論点ごとに記録されている
- [x] 採用根拠が明示されている
- [x] risks が ID 付きで列挙されている
- [x] open questions に解答が付されている
- [x] 4 条件評価が表で示されている
