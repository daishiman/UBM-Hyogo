---
実装区分: 実装仕様書
状態: completed
Phase: 7
作成日: 2026-05-23
task_id: admin-ui-prototype-alignment
親: [index.md](./index.md)
前: [phase-6-test-additions.md](./phase-6-test-additions.md)
次: [phase-8-refactor.md](./phase-8-refactor.md)
---

# Phase 7: カバレッジ確認

## 1. 目的

Phase 5 で導入した新規 `_shared/` 6 component / `safeServerFetch` helper / 11 admin page の修正ブロックに対し、Phase 4 §9 で定めた目標値を **実測** し、未達セルを潰す手順を定義する。

## 2. カバレッジ目標 (再掲)

| 対象 | line | branch | function | statement |
| ---- | ---- | ---- | ---- | ---- |
| `apps/web/src/features/admin/components/_shared/**` | **90%** | **85%** | 90% | 90% |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | **95%** | **90%** | 100% | 95% |
| 修正対象 page 変更ブロック | **100%** | **90%** | 100% | 100% |
| `app/(admin)/layout.tsx` 変更ブロック | 90% | 85% | 90% | 90% |
| `app/(admin)/admin/error.tsx` 変更ブロック | 90% | 85% | 90% | 90% |

## 3. 実測コマンド

### 3.1 `_shared/` + helper の総合 coverage

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  --coverage.include='apps/web/src/features/admin/components/_shared/**' \
  --coverage.include='apps/web/src/lib/admin/safe-server-fetch.ts' \
  --coverage.reporter=text \
  --coverage.reporter=json-summary \
  apps/web/src/features/admin/components/_shared/__tests__ \
  apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts
```

### 3.2 page 変更ブロック (changed-only)

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  --coverage.include='apps/web/app/(admin)/admin/**/page.tsx' \
  --coverage.reporter=text \
  --changed origin/dev
```

> 全件指定は worker SIGKILL の原因になるため (FB-UI-02-2)、必ず `--changed` または `--coverage.include` で範囲を絞る。

## 4. 除外対象 (明示)

| Path | 理由 |
| ---- | ---- |
| `apps/web/src/components/ui/**` | 本タスクのスコープ外 (流用のみ) |
| `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` | 本タスクで変更しない既存 |
| `apps/web/app/(admin)/layout.tsx` の未変更行 | 既存実装の coverage は対象外 |
| `apps/web/app/(admin)/admin/loading.tsx` / `not-found.tsx` | 本タスクで実装変更なし |
| barrel `_shared/index.ts` | re-export のみ。line だけカウントし branch は除外可 |
| 型定義のみのファイル (`*.d.ts`) | 実行コードでないため |

`vitest.config.ts` の `coverage.exclude` に既設の glob を確認し、上記が反映されていない場合は本タスク範囲に限り `--coverage.exclude` を CLI で追加する (config 変更は最小限)。

## 5. 変更行 / branch の実測手順

1. `git diff origin/dev...HEAD --name-only -- 'apps/web/**/*.{ts,tsx}'` で変更ファイル一覧取得
2. 上記を `--coverage.include` 指定で渡す
3. `coverage/coverage-summary.json` から各ファイル `lines.pct` / `branches.pct` を抽出
4. 目標未達セルを表 (markdown) に出力し本 Phase の output に貼る

抽出スクリプト例 (Phase 7 outputs に手動添付):

```bash
mise exec -- node -e '
const s = require("./apps/web/coverage/coverage-summary.json");
for (const [k, v] of Object.entries(s)) {
  if (k === "total") continue;
  console.log(`${k}\t${v.lines.pct}\t${v.branches.pct}\t${v.functions.pct}`);
}'
```

## 6. 未達セル対応フロー

未達セルが検出された場合の順序:

1. **ガード文 / 早期 return** の test 抜けが大半 → Phase 6 の fail path TC を追加
2. polymorphic `as` prop / optional callback の test 抜け → unit spec に case を追加
3. server component の auth branch → mock cookies で auth/no-auth 両方を回す
4. それでも超えられない不可達 branch (例: TypeScript narrowing で実行されない) は `/* c8 ignore next */` で局所除外し、本 Phase の output に **理由付きで一覧化**

> 局所除外は 1 ファイルあたり 3 行以内を上限とする。それ以上は設計見直しを Phase 8 (refactor) に escalate。

## 7. 出力 (Phase 7)

`docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-7/coverage-report.md` に以下を貼る:

- 実測コマンド (3.1 / 3.2)
- `coverage-summary.json` 抽出表
- 目標と実測の差分表 (Δ)
- 除外宣言 (`/* c8 ignore */` を入れた箇所)

## 8. DoD (Phase 7)

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 7
- workflow_state: `implemented_local_runtime_pending`

## 目的

Phase 5〜6 の変更範囲に対する coverage を実測し、未達セルを今回サイクル内で解消する。

## 実行タスク

- `_shared` component と helper の coverage を測定する
- page 変更ブロックの changed-only coverage を確認する
- 未達セルの追加 test / 実装補正を判断する

## 参照資料

- `phase-4-test-plan.md`
- `phase-6-test-additions.md`

## 成果物/実行手順

- `outputs/phase-7/coverage-report.md` に実測値と未達対応を記録する

## 統合テスト連携

- coverage 未達は Phase 8 refactor 前に解消し、Phase 9 QA の入力にする

## 完了条件

- coverage 目標と変更行 branch の実測値が記録され、未達が残っていない

- [ ] `_shared/` line ≥ 90% / branch ≥ 85% を満たす
- [ ] `safeServerFetch.ts` line ≥ 95% / branch ≥ 90%
- [ ] 各 admin page の **変更ブロック** line ≥ 100% (未変更行はカウント外)
- [ ] 局所 ignore は 1 ファイル 3 行以内、各々 1 行のコメントで理由明記
- [ ] `outputs/phase-7/coverage-report.md` 提出
