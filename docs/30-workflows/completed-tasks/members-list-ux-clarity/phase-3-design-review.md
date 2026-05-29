<!-- workflow: members-list-ux-clarity / phase: 3 -->

# Phase 3 — 設計レビュー (members-list-ux-clarity)

> Workflow: `docs/30-workflows/completed-tasks/members-list-ux-clarity/`
> 前提: [phase-1-requirements.md](./phase-1-requirements.md), [phase-2-design.md](./phase-2-design.md)

## 1. 真の論点

「現状 UI は機能的には正しいが、ユーザーが意図を読み取れない」状態を、
**プロトタイプ正本/既存 API/既存 primitives を壊さずに**改善する。
これを満たすための論点は次の 3 点:

1. **「即発火」をどう伝えるか** — 説明テキスト + aria-live で十分か、「自動更新」ラベルや spinner が必要か
2. **適用中条件の可視化** — chip 列で十分か、サマリ文 (例: "山田 / ゾーン: 0→1 で絞り込み中") の方が読みやすいか
3. **density の伝達** — sublabel + HelpHint で足りるか、icon (PaintBucket / Grid / List 風) を主表示に変えるべきか

## 2. 代替案比較

### 2.1 density 伝達: sublabel + HelpHint (採用) vs icon-first

| 観点 | A: sublabel + HelpHint (採用) | B: icon-first (例: ▦ / ▤ / ☰) |
| ---- | ---------------------------- | ------------------------------ |
| プロトタイプ整合 | プロトタイプの "ゆったり/密/リスト" 主ラベルをそのまま維持 | プロトタイプ正本順位 (INV-5) 違反のリスク |
| 説明力 | sublabel + HelpHint で意味と用途を両方伝えられる | icon 単独では意味伝達が弱い |
| 実装コスト | Segmented option 型 +1 prop, `<details>` 軽量実装 | icon set 拡張 (`Icon.tsx` 改修) + tooltip 機構 |
| a11y | native `<details>` で focus 管理不要 | tooltip は ARIA pattern 順守が必要で実装重い |

**採用根拠**: プロトタイプ正本順位を絶対遵守する必要があるため A 採用。B は新 primitive (Tooltip) が必要で INV-3 にも違反する。

### 2.2 即発火伝達: hint テキスト + aria-live (採用) vs 自動 spinner

| 観点 | A: microcopy + aria-live (採用) | B: 入力中 spinner 表示 |
| ---- | ------------------------------- | ---------------------- |
| 明確性 | "入力すると即時反映" の文言で意図が直接伝わる | spinner は「待たされている」印象を与えるリスク |
| パフォーマンス | DOM 更新 1 行 | debounce + spinner 状態管理が必要 |
| 既存挙動互換 | URL replace は即時のまま | 即時挙動を遅延化することになる (UX 後退) |
| a11y | aria-live polite で件数差分のみ通知 | spinner ARIA は `aria-busy` で扱いが煩雑 |

**採用根拠**: A 採用。即発火の高速応答こそが本実装の価値であり、spinner は逆効果。

### 2.3 適用中条件の表現: chip 列 (採用) vs 文章サマリ

| 観点 | A: chip 列 (採用) | B: 文章サマリ ("X / Y で絞り込み中") |
| ---- | ----------------- | ------------------------------------ |
| 操作性 | × クリックで個別解除が即座に可能 | 解除には別 UI が必要 |
| スキャン性 | 一目で件数と種類が分かる | 1 行に詰まると読みにくい |
| 既存パターン | admin tag UI / SelectedTagsBar と整合 | 全画面で類似パターンなし → 学習コスト |
| mobile | 折返しで縦に伸びるだけ | 1 行で省略表示が必要 (...) |

**採用根拠**: A 採用。chip パターンは既に SelectedTagsBar で確立済みで、操作性・スキャン性とも勝る。

### 2.4 クリアボタンの配置: chip 列右端 (採用) vs 元位置維持

| 観点 | A: chip 列右端統合 (採用) | B: filter-grid 末尾維持 |
| ---- | ------------------------- | ------------------------ |
| 文脈の近接性 | 「適用中」と「解除」が隣接 → 直感的 | フォームフィールド末尾で見落とされる |
| 描画条件 | hasFilters=true のときだけ描画で押し間違いゼロ | disabled 状態が常時占有 |
| 学習コスト | chip 列の自然な延長 | "disabled でも focus される" 混乱要因 |
| 既存呼び出し互換 | `onClear` API は不変 | 不変 |

**採用根拠**: A 採用。

## 3. 価値とコスト

| 項目 | 値 |
| ---- | -- |
| 期待効果 | (1) density 選択の試行錯誤回数を 0 に近づける、(2) 「適用ボタンがない」不安を解消、(3) 適用中条件のクリア忘れを減らす、(4) SR 利用者へ件数変化を通知 |
| 推定 LOC | +600 / -90 (CSS 含む) |
| 推定工数 | 1 日 (3 タスク並列着手で半日 + 統合・visual 半日) |
| 影響範囲 | `/members` route のみ。他 route 0 件 (`SelectedTagsBar` の rename 影響は `/members` 内 import のみ — Phase 2 § 3.2 で確認済) |
| API/Schema/Token 変更 | 0 |
| 新 primitive | 0 (HelpHint は feature レベル component で実装) |

**コスト < 価値**: UX 課題の解消量に対して、コードベース侵食コストが極めて低い。

## 4. 4 条件評価 (整合 / 価値 / コスト / 副作用)

| 条件 | 評価 |
| ---- | ---- |
| 整合 (CLAUDE.md / プロトタイプ / 既存 API / tokens) | ◎ 全て不変条件を遵守 |
| 価値 (UX 課題解消 / a11y 強化) | ◎ 3 件の観察課題すべて直接的に解消 |
| コスト (LOC / primitive 追加 / API 変更) | ◎ 新 primitive 0、API 変更 0、LOC < 1000 |
| 副作用 (他 route 影響 / 既存 test 破壊) | ○ `SelectedTagsBar` rename のみ要警戒 (Phase 4 で全 import を更新) |

## 5. risks (Phase 4 へ持ち越し)

| ID | リスク | 監視・対策 |
| -- | ------ | -------- |
| R-1 | `SelectedTagsBar` を別 route が import している | Phase 4 冒頭で `git grep SelectedTagsBar` を全リポジトリで実行し、`/members` 経路以外で参照されていないことを確認。参照あれば rename ではなく新規ファイル `SelectedFiltersBar` を追加し、`SelectedTagsBar` は薄い wrapper として残す方針に切替 |
| R-2 | `<details>` ベース HelpHint が Safari 旧バージョンで不安定 | MVP 対応ブラウザ (modern evergreen) では問題なし。古い Safari は対象外と Phase 4 で明記 |
| R-3 | `aria-live` 領域の announce 頻度が高すぎて SR 利用者を煩わせる | `aria-live=polite` で busy-waiting 回避、debounce は React の自然な再 render に任せる |
| R-4 | visual baseline が CI 環境差で flaky | Linux baseline + `mask:` で時刻系を除外、failure 時の rerun policy を Phase 4 で確定 |
| R-5 | sublabel 追加で Segmented 全体の高さが変わり既存 visual baseline が drift する | `members-prototype-alignment.spec.ts` baseline を user-gated 再撮影。Phase 4 で更新リスト化 |

## 6. open questions の解消 (phase-2 § 8 に対する回答)

| Q | A (採用案) |
| - | --------- |
| HelpHint 実装方式 | `<details><summary>` ベース。`useState` は使わない (native 挙動で十分) |
| result-count 文言 | `"X 件中 Y 件を表示しています"` (敬体)。0 件時は `"該当者なし"` |
| 並び替えを SelectedFiltersBar に含めるか | **含めない**。並び替えは絞り込みではなく順序であるため。sort は SelectedFiltersBar の chip 対象から外す (sort=recent 以外でも chip 化しない) |
| mobile chip 列のあふれ | 折り返し (`flex-wrap`)。横スクロールは採用しない (見切れリスク) |

## 7. 改善優先順位 (Phase 4 タスク順)

1. **Task A (DensityToggle)** — 影響範囲が小さく単独完結、最初に着手して visual baseline drift を最小化
2. **Task B (MemberFilters + SelectedFiltersBar)** — chip 列 component の API を確定し、A と並列着手可能
3. **Task C (page 統合 + visual baseline)** — A/B 完了後の serial。`totalCount`/`displayedCount` prop を統合して visual snapshot 取得

## 8. 承認可否

| 項目 | 結果 |
| ---- | ---- |
| Phase 1 AC との整合 | ○ |
| 不変条件 (INV-1..6) との整合 | ○ |
| プロトタイプ正本順位 | ○ |
| 1 サイクル完了スコープ (CONST_007) | ○ |
| 新 primitive 追加 | 0 件 |
| API / Schema / Token 変更 | 0 件 |

**結論**: Phase 4 (タスク分割 + 実装仕様書生成) へ進行可。Task A / B 並列着手 → Task C 統合の順序で実装する。

## DoD

- [x] 代替案比較が AC ごと/論点ごとに記録されている
- [x] 採用根拠が明示されている
- [x] risks が ID 付きで列挙されている
- [x] open questions に解答が付されている
- [x] 4 条件評価が表で示されている
- [x] Phase 4 タスク順序が明示されている
