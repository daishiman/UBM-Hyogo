---
phase: 9
title: リスクと対策
workflow_id: parallel-i06-root-error-focus
status: completed
---

# Phase 9 — リスクと対策

[実装区分: 実装仕様書]

## 1. 技術リスク

| ID | リスク | 影響 | 対策 |
|----|--------|------|------|
| R-01 | `tabIndex={-1}` 付与で `:focus` outline が常時表示される | 視覚 UI の劣化 | 既存 `:focus-visible` policy で抑制（programmatic focus は `:focus-visible` を発火させない仕様）。実装後 visual 確認は不要（NON_VISUAL タスク） |
| R-02 | `logger.error` と `focus` の副作用順序が紛糾 | observability or a11y の片方が失敗 | 同一 useEffect 内で順序を `logger → focus` 固定（Phase 2 AD-01 / Phase 5 §2） |
| R-03 | `preventScroll: true` が古い browser（Safari < 14）で未サポート | scroll jump 発生 | プロダクト要件として ES2022 + 最新 Safari/Chrome を前提とする（CLAUDE.md スタック方針に合致） |
| R-04 | jsdom / happy-dom で `focus()` が機能せず TC-01 false-negative | テスト破綻 | jsdom は `focus()` をサポート済。Phase 6 §4 で setup 確認 |
| R-05 | `toHaveFocus` matcher が global 未拡張 | TC-01 が assertion error | Phase 6 §4 で `@testing-library/jest-dom` setup を確認、未設定なら同一 PR で setup 追加 |

## 2. プロセスリスク

| ID | リスク | 対策 |
|----|--------|------|
| P-01 | 編集対象が同一ファイルで T-01..T-04 を並列に進めると競合 | 直列実行を Phase 3 で明示 |
| P-02 | source spec が in-place fix 想定だったため、フル Phase 1-13 への昇格でメタ整合が崩れる | 本 workflow root の `index.md` で source spec を参照し、実装完了後は `implemented_local_evidence_captured` に同期 |

## 3. 影響範囲リスク

| ID | リスク | 対策 |
|----|--------|------|
| I-01 | `/login/error.tsx` 等別 boundary との挙動差 | スコープ外（i05 別タスクで対応） |
| I-02 | route group layout の影響 | error.tsx 単体編集のため影響なし |

## 4. ロールバック手順

万一 production deploy 後に問題発生時:

```
git revert <commit-sha>
mise exec -- pnpm -F "@ubm-hyogo/web" build
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

差分 4 行のみのため revert は安全。
