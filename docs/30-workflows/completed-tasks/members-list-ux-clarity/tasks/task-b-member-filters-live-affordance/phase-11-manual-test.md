<!-- workflow: members-list-ux-clarity / task: B / phase: 11 -->

[実装区分: 実装仕様書]

# Phase 11 — 手動テスト (Task B)

> 前提: Phase 10 完了 / visualEvidence=VISUAL
> 撮影モード: 本 task は **VISUAL** だが、visual baseline 一式の撮影は親 workflow Task C で実施する。
> 本 task の Phase 11 は component spec 結果 + 簡易 visual smoke (任意 1〜3 枚) に閉じる。

## 1. 3 層評価

### 1.1 Semantic (component spec 結果)

```bash
mise exec -- pnpm --filter @ubm/web vitest run \
  src/components/public/__tests__/MemberFilters.client.spec.tsx \
  src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx
```

期待: 既存 7 ケース + 新規 TC-B-MF-01..07 / TC-B-SFB-01..08 全 PASS。
結果は `outputs/phase-11/manual-test-result.md` の Semantic セクションに貼る。

### 1.2 Visual smoke (任意・本 task の責務分担)

- 親 Task C で `members-ux-clarity.spec.ts` を 4 viewport × 3 density × 2 state で撮影する
- 本 task では desktop (1024px) × `q=山田&zone=0_to_1` 状態の screenshot を 1〜2 枚 `outputs/phase-11/screenshots/` に置くだけで十分
- 撮影は user-gated (staging deploy 後)

### 1.3 AI UX

- chip 列が「キーワード: 山田」「ゾーン: 0→1」順に並ぶか
- clear-all button が右端に強調表示されるか
- "入力すると自動で絞り込まれます" が Search 直下に表示されるか
- 結果件数が `<output>` に表示されているか
- 0 件状態で `該当者なし` が表示されるか

## 2. 証跡ファイル

| パス | 内容 |
| ---- | ---- |
| `outputs/phase-11/manual-test-result.md` | Semantic 結果 / AI UX チェックリスト / 既知制限 |
| `outputs/phase-11/screenshots/member-filters-with-chips-1024.png` | (任意) chip 列が見える状態の screenshot |
| `outputs/phase-11/screenshots/member-filters-empty-1024.png` | (任意) `hasFilters=false` 状態の screenshot |

## 3. NON_VISUAL 宣言: 該当なし

本 task は VISUAL カテゴリ (UI 構造変更あり)。NON_VISUAL 宣言は行わない。
ただし visual baseline 一式は Task C へ委譲。

## 4. 既知制限

- chip 個別解除後の focus は document.body に戻る (現状仕様)
- mobile (375px) で chip があふれた際は flex-wrap で縦に伸びる
- `<output role="status">` の announce 頻度は React の自然再 render に委ねる (debounce 無し)

## 5. DoD

- [ ] component spec 全 PASS のログを `manual-test-result.md` に記録
- [ ] AI UX チェックリストの各項目に判定
- [ ] (任意) screenshot 1〜2 枚を `screenshots/` に配置
- [ ] 既知制限を明記
