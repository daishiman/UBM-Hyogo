# Phase 9: QA — line budget / link / 検証コマンド・完了基準

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- 前提: [phase-5-implementation.md](phase-5-implementation.md)/ [phase-8-refactor.md](phase-8-refactor.md)/ [shared-context.md](shared-context.md) §7（検証コマンド）
- 注記: 本 Phase は QA チェックリストの設計（仕様）。削除確認は stub 化許容（Feedback FB-UI-02-1）。

## 目的

実装完了時に満たすべき品質ゲート（typecheck/lint/tokens・visual・apps/api 非変更）を完了基準として確定し、典型チェック・line budget・link 健全性を列挙する。

## 実行タスク

1. 完了基準コマンドを確定する。
2. 典型チェック（HEX 混入・横スクロール・apps/api diff）を列挙する。
3. line budget / link / 削除確認方針を示す。

## 完了基準コマンド（[shared-context.md](shared-context.md) §7）

```bash
mise exec -- pnpm typecheck       # 型エラー 0
mise exec -- pnpm lint            # lint 違反 0
mise exec -- pnpm verify:tokens   # HEX 直書き 0・tokens 正本（AC-9）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx   # 構造 spec Green（AC-8）
mise exec -- pnpm exec playwright test \
  apps/web/playwright/tests/visual-full/full-visual.spec.ts   # visual Green（AC-10）
git diff --name-only -- apps/api  # 空（AC-9 / 不変条件 #1 #5）
```

## 典型チェック（grep / 目視）

| チェック | 方法 | 合格条件 |
| --- | --- | --- |
| HEX 直書きなし | `grep -rnE '#[0-9a-fA-F]{3,6}' apps/web/src/styles/{globals,legacy-public,auth,tokens}.css` の差分行 | 新規 HEX 0（既存は対象外）。`verify:tokens` PASS |
| 非標準境界排除 | `grep -nE 'max-width: (720|900)px' apps/web/src/styles/globals.css` | 0 件（768/1024 へ集約済み） |
| 横スクロール 0 | Playwright TC-4-* / TC-6-* | 全ルート × viewport で `scrollWidth-clientWidth <= 1` |
| drawer 幅 | `grep -n 'w-\[min(17rem,88vw)\]' apps/web/src/components/shell/SidebarDrawer.tsx` | 1 件・旧 `max-w-[85vw]` 0 件 |
| apps/api 非変更 | `git diff --name-only -- apps/api` | 空 |
| ローカル endpoint 焼き込みなし | `grep -rn '127.0.0.1:8888' apps/web/src apps/web/app` | 0（不変条件 #6） |

## line budget

- 本タスクは CSS 差分中心。変更行は 5 ファイル × 数十行 + TSX 少量。各 phase 仕様書は 1 ファイル 200 行未満を目安とし、重複は SSOT（shared-context.md）リンクで回避する。
- CSS の新規追加は「境界統一の差し替え」「grid 流体化」「テーブル可視性」「オーバーレイ収納」の 4 ブロックに限定し、無関係な行追加をしない。

## link 健全性

- 各 phase 仕様書の相対リンク（`phase-N.md` / `shared-context.md`）が解決すること。
- 参照する実コードパス（`apps/web/app/error.tsx` 等）が実在すること（`apps/web/app/` ではなく `apps/web/app/` が正）。

## 削除確認（stub 許容）

- 旧 className `max-w-[85vw]` の削除確認・非標準境界の削除確認は、実装後の grep（上表）で 0 件をもって担保する。削除前後の詳細な before/after スナップショットは stub 化（grep 結果で代替）を許容する。

## 参照資料

### システム仕様（aiworkflow-requirements）

- `int-test-*.md`（QA ゲート）, `architecture-*.md`（完了基準）。
- プロジェクト: `package.json`（typecheck/lint/verify:tokens script）, `scripts/`。

## 成果物

- 本ファイル（QA）。完了基準コマンド・典型チェック表・line budget・link 健全性・削除確認方針。

## 統合テスト連携

- 上流: Phase 8 リファクタ後の状態。
- 下流: Phase 10 最終レビューが AC-1..AC-10 の充足判定に本 QA 結果を用いる。

## 完了条件

完了基準コマンド・典型チェック・apps/api 非変更確認が確定し、削除確認の stub 許容が明記されていること。
