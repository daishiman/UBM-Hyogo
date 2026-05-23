# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 3 / 設計レビュー |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 3 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 3 の判断結果を `outputs/phase-03/design-review.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-03/design-review.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 3 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 統合テスト連携

- docs-only / NON_VISUAL のため、この Phase では新規自動テストを追加しない。
- 実行可能な正本は `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts`、証跡は `outputs/phase-03/design-review.md` に集約する。

## 詳細

## 1. 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | ◯ | task-18 で実装した CI gate が守る 17 URL smoke と、まだ runtime 観測外の 2 component surfaces を分離して可視化することで、後続タスクが矛盾なく test を追加できる |
| 実現性 | ◯ | 既存 spec / 既存 baseline / 既存 selector を整理する文書化のみ。code 変更ゼロ |
| 整合性 | ◯ | matrix の SSOT は `full-smoke.spec.ts` の `ROUTES[]` に固定。token は 09b JSON に委譲 |
| 運用性 | ◯ | matrix は spec 追加時に行を増やすだけで保守できる。CI gate job 名は task-18 と整合 |

## 2. 因果ループ（強化）

```
CI gate（task-18）が成功すれば 17 URL smoke entries が守られ、2 component surfaces は runtime 未観測の coverage gap として可視化される
        ↓
matrix が現状の覆い範囲を可視化
        ↓
覆い不足（残り 15 non-baseline surfaces の visual / error・loading の observability 等）が顕在化
        ↓
future task として明示的に切り出される
        ↓
徐々に coverage が広がる
```

## 3. 因果ループ（バランス）

```
matrix が肥大化しすぎると保守コスト増
        ↓ (これに対する制動)
本タスクでは 17 URL smoke + 2 component surfaces × 5 軸の単一表で抑え、軸別詳細は最小化する
```

## 4. レビュー結果

### MAJOR

なし。

### MINOR

- M1: `error.tsx` / `loading.tsx` の observability が脆い（既存 fixture 不在の可能性）。
  対応: Phase 6 で既存 spec を grep し、observability が確立できない場合は matrix 行を `N/A + future task` で埋め、Phase 12 で unassigned-task 候補化する。
- M2: token 軸の runtime 観測は `getComputedStyle` 経由で flaky になりやすい。
  対応: matrix の token 列は「verify-design-tokens に委譲」を基本ルールとし、smoke spec での runtime 観測は副次扱い。

### NOTE

- N1: 19 surface 行に統一するため、`/login?state=sent` / `/login?state=unregistered` の query state variant は `/login` 行内の sub-row として扱う（行数は 19 を保つ）。
- N2: `(public)` / `(admin)` の route group 表記は URL ではなく source group 列のみで使用。

## 5. Phase 4 進行可否

**Go**: 設計上の致命欠陥なし。MINOR は Phase 6/12 で吸収可能。
