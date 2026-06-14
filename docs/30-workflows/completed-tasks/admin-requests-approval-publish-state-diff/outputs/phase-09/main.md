# Phase 9 出力: 品質保証 一括判定方針

> 状態: `completed`（仕様書作成のみ。コマンド実行・commit・PR は後続サイクル / user-gated）。下記コマンドは実装者向け手順であり、実行済み・PASS 済みを主張するものではない。

## 1. 型 / lint / focused vitest 一括判定

```bash
# 1) 型チェック
mise exec -- pnpm typecheck
# 2) lint
mise exec -- pnpm lint
# 3) focused vitest（repo ルート基準・3 spec 限定。helper 追加時は requestPublishStateDiff.spec.ts も追加）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx
```

| ゲート | コマンド | PASS 条件 | 担保 AC |
| --- | --- | --- | --- |
| 型 | `pnpm typecheck` | exit 0・`PublishStateDiff` / helper の型が解決 | — |
| lint | `pnpm lint` | exit 0・inline style / boundary 違反 0 | #9 |
| focused vitest | 上記 3 spec（+ helper spec） | exit 0・全 spec green・note_type 別 diff assertion PASS | AC-10 |

> focused vitest は repo ルートが root のため `--root=.` + `--config=vitest.config.ts` + フルパス指定が必須（メモリ既知の罠: `--filter web exec` や直指定は include glob が monorepo root 基準のため "No test files found" になる）。

## 2. line budget / link / mirror parity

- 本タスクは docs 配下の仕様書作成のため、line budget（各 phase-NN.md / outputs の行数）は過大化しないことを目視確認する。
- index.md の Phase 一覧リンク（phase-08/09/10 と outputs）が全て解決することを確認する。
- `.claude` skill の mirror parity は本タスクで触れない（skill 同期は別サイクル）。

## 3. a11y 確認（AC-9）

```bash
# 矢印 span に aria-hidden が付く
grep -n 'aria-hidden="true"' apps/web/src/components/admin/RequestQueueDetail.tsx
# 既存の aria-label が不変
grep -n 'aria-label="申請詳細"' apps/web/src/components/admin/RequestQueueDetail.tsx
```

- focused vitest（`RequestQueueDetail.spec.tsx`）で、矢印 span が `aria-hidden="true"` を持ち、before/after の意味がテキスト（`公開`/`非公開`）で担保され、`dt`（`公開状態の変更`）+ `dd` の dl 構造が保たれることを assertion する。
- screen reader が「公開状態の変更、公開（矢印読み飛ばし）非公開」相当を連続読み上げできることを構造で担保（jsdom は CSS を評価しないため構造検証に限定）。

## 4. 各ゲートの戻り先

| FAIL したゲート | 戻り先 Phase |
| --- | --- |
| typecheck / lint | Phase 5（実装） |
| focused vitest | Phase 5（実装）/ Phase 6（テスト拡充） |
| token-audit（HEX 検出） | Phase 5（実装）/ Phase 8（リファクタ・CSS） |
| diff ゼロ違反（apps/api 混入） | Phase 5（実装・スコープ逸脱の是正） |
