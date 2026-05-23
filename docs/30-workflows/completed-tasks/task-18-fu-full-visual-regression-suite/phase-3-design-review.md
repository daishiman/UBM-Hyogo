[実装区分: 実装仕様書]

# Phase 3: 設計レビュー

## 目的

Phase 2 設計のゲート判定。flaky リスク・CI 時間・required check 候補可否を定量評価する。

---

## 入力

- `outputs/phase-2/design.md`
- W7 visual job の過去 fail rate（参考値）

---

## 1. CI 時間試算

| 項目 | 値 |
|------|-----|
| 1 baseline screenshot 取得時間 | 約 3 sec（goto + networkidle + waitForFonts + addStyleTag + screenshot） |
| viewport 当たり baseline 数 | 17 |
| viewport 当たり実行時間 | 17 × 3s ≒ 51 sec + setup overhead 30 sec ≒ 1.5 min |
| 3 viewport matrix 並列実行 | 並列実行のため約 1.5 min / job |
| ジョブ起動オーバーヘッド | install + build + playwright install で ~4 min |
| **合計（matrix 並列）** | **約 5.5〜6 min** |
| nightly（順次実行も想定） | 約 7〜8 min |

→ PR path-filter trigger でも許容範囲。

---

## 2. flaky 対策評価

| 項目 | 対策 | 効果 |
|------|------|------|
| アニメーション | `addStyleTag({content:'*{animation:none!important;transition:none!important;}'})` + `animations:'disabled'` | 高 |
| フォント | `document.fonts.ready` await | 高 |
| caret | `caret-color: transparent` + `caret:'hide'` | 中 |
| 動的時刻 | `<time>` 要素を mask | 高 |
| 動的画像 | `[data-visual-mask]` 属性で個別 mask | 中 |
| OS フォントレンダリング差 | ubuntu-latest 固定 | 高 |
| 認証 cookie 期限 | 既存 `adminLogin(context)` / `memberLogin(context)` helper で都度注入 | 高 |

→ 残リスク: ハンバーガーメニュー等の hover state、SSR vs CSR の hydration timing。Phase 6 で `data-testid` 安定性確認時に対応。

---

## 3. required check 候補可否

| ブランチ | 評価 |
|----------|------|
| dev | **可**: PR path-filter で発火、5〜6 min 程度なら許容 |
| main | **可だが要 nightly green 連続実績**: 1 週間 nightly green を確認後に required 昇格を推奨 |

→ 本タスクでは required 昇格は行わず、Phase 13 PR マージ後に別タスク（branch protection 更新）で実施する。

---

## 4. baseline サイズ試算

| viewport | 1 png サイズ目安 | 17 png |
|----------|------------------|--------|
| desktop (1280x800, fullPage) | ~150〜400 KB | ~3〜7 MB |
| tablet | ~100〜300 KB | ~2〜5 MB |
| mobile | ~80〜250 KB | ~1.5〜4 MB |
| **合計** | — | **~6〜16 MB** |

リポジトリサイズ増加として許容範囲（git LFS 不要）。

---

## 5. 受入条件（DoD）

1. CI 時間試算が PR 許容範囲（10 min 以内）に収まる見込みであることを記述
2. flaky 対策 7 項目が Phase 2 設計に反映されていることを確認
3. required check 候補昇格は本タスク範囲外であることを明示
4. baseline サイズが git LFS 不要範囲であることを記述

---

## 6. 判定

| ゲート | 判定 |
|--------|------|
| CI 時間 | `spec_created` |
| flaky 対策 | `spec_created` |
| baseline サイズ | `spec_created` |
| required check 昇格 | DEFERRED（後続タスク） |

→ Phase 4 へ進む。

---

## 7. 成果物

- `outputs/phase-3/design-review.md`
