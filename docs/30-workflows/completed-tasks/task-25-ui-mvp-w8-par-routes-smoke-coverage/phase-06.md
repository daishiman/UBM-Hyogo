# Phase 6: テスト拡充（matrix 完全性確認）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 6 / テスト拡充 |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 6 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 6 の判断結果を `outputs/phase-06/test-extension.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-06/test-extension.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 6 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 統合テスト連携

- docs-only / NON_VISUAL のため、この Phase では新規自動テストを追加しない。
- 実行可能な正本は `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts`、証跡は `outputs/phase-06/test-extension.md` に集約する。

## 詳細

## 1. 追加 check（Phase 4 の T1〜T7 を拡充）

| ID | 観点 | 手段 |
|----|------|------|
| T8 | matrix の `interaction` 列が空欄でない（19 surface 行すべて action 1 件以上記載） | `awk` で列抽出 + 空欄カウント |
| T9 | a11y 列の rule profile が全行で統一（`wcag2a+wcag2aa, exclude:color-contrast`） | grep で一致確認 |
| T10 | `data-testid` 名が `apps/web/src/app/**/*.tsx` に存在する | matrix の testid を抽出 → source に grep |
| T11 | future task 候補（visual baseline 拡張 / error 観測戦略 / loading 観測戦略）の 3 件が Phase 12 unassigned-task-detection に登録できる形で matrix section 8 に記載 | 目視 |

## 2. fail path 設計

- F1: matrix の testid が source に存在しない → `MINOR / 修正対象` として Phase 8 で修正
- F2: 既存 spec が path 変更されている → `MAJOR / SSOT 更新必要` として task-18 仕様改訂を future task 化
- F3: visual baseline が 4 件以外存在する → matrix を最新化

## 3. 実行（Phase 6 で 1 回 + Phase 10 で再実行）

```bash
# T1
grep -E '^\| [0-9]+ ' docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md | wc -l

# T2
ls apps/web/playwright/tests/visual/*.spec.ts | wc -l

# T8: interaction 列空欄チェック（pipe 区切り 9 列目を抽出する仮想）
# matrix 形式に従って awk で実装

# T10: testid 存在確認
grep -RhoE 'data-testid="[a-z0-9-]+"' apps/web/src/app | sort -u > .tmp/source-testids.txt
grep -oE 'data-testid="[a-z0-9-]+"' docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md | sort -u > .tmp/matrix-testids.txt
diff .tmp/matrix-testids.txt .tmp/source-testids.txt
```

## 4. 期待

すべて PASS。F1〜F3 検出時は Phase 8（refactor）または Phase 12（future task）で吸収。
