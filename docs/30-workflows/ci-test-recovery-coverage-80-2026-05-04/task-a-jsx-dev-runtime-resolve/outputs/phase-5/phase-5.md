# Phase 5: 実装（package.json 編集 + lockfile 再生成）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 作成日 | 2026-05-04 |
| 依存 Phase | Phase 1-4 |

## 目的

Phase 2 で確定した案 1（root devDep 追加）を実装し、`pnpm-lock.yaml` を再生成する。Fallback（vitest config 編集）はこの Phase では実施せず、Phase 6 / Phase 9 の検証で必要性を判断する。

## 実行タスク

- タスク 1: root `package.json#devDependencies` に react / react-dom / 型 4 dep を追加
- タスク 2: `mise exec -- pnpm install` で `pnpm-lock.yaml` を再生成
- タスク 3: 追加 dep の version が apps/web と一致していることの確認
- タスク 4: 最初の smoke test（vitest が test を 1 件以上 collect できるか）
- タスク 5: 既存テスト回帰確認の先行実行（Phase 5 追加チェック項目）

## 参照資料

| 参照資料 | パス |
| --- | --- |
| Phase 2 採用方針 | `../phase-2/phase-2.md` |
| root package.json | `package.json` |
| apps/web package.json | `apps/web/package.json` |
| coverage-standards | `.claude/skills/task-specification-creator/references/coverage-standards.md` |

## 実行手順

### ステップ 1: root `package.json` 編集

`package.json#devDependencies` に以下を追加する（既存 entry はアルファベット順に並んでいない既存 layout を維持）:

```json
{
  "devDependencies": {
    "react": "19.2.5",
    "react-dom": "19.2.5",
    "@types/react": "19.2.7",
    "@types/react-dom": "19.2.3"
  }
}
```

> 注: Edit tool で正確な diff を取り、他 devDep の version を変更しないこと。

### ステップ 2: lockfile 再生成

```bash
mise exec -- pnpm install 2>&1 | tee outputs/phase-5/pnpm-install.log
```

`pnpm-lock.yaml` の diff サイズが想定外に大きい（500 行超）場合は、他 dep の不要 update が混入していないか確認し、必要に応じて `pnpm install --frozen-lockfile=false --no-strict-peer-dependencies` などで再現性を担保する。

### ステップ 3: version 整合確認

```bash
node -e "
const r = require('./package.json').devDependencies;
const w = require('./apps/web/package.json');
const ok = r.react === w.dependencies.react
  && r['react-dom'] === w.dependencies['react-dom']
  && r['@types/react'] === w.devDependencies['@types/react']
  && r['@types/react-dom'] === w.devDependencies['@types/react-dom'];
console.log(JSON.stringify({ ok, root: r, web: { ...w.dependencies, ...w.devDependencies } }, null, 2));
process.exit(ok ? 0 : 1);
" | tee outputs/phase-5/version-check.json
```

### ステップ 4: smoke test

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run 2>&1 | head -50 | tee outputs/phase-5/smoke.log
```

- `Failed to resolve import "react/jsx-dev-runtime"` が表示されないこと
- vitest が collect を試みていること

### ステップ 5: 既存テスト回帰確認の先行実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run 2>&1 | tail -20 | tee outputs/phase-5/api-regression-check.log
mise exec -- pnpm -r typecheck 2>&1 | tail -20 | tee outputs/phase-5/typecheck-all.log
```

apps/api / packages/* 側で新規 regression が出ていないことを baseline と比較する。

## 統合テスト連携

apps/web が test collect できるようになることが、後続 Task C の前提となる統合テスト連携の代替成果物。

## 多角的チェック観点（AI が判断）

- システム系: pnpm `peerDependencies` 警告が変動した場合は記録（解消が期待されるが、新規発生は MAJOR 候補）
- 戦略系: lockfile diff の最小化（react 系のみ追加が理想、他 dep の minor / patch update は避ける）
- 問題解決系: smoke で fail が出ても Task A スコープでは追わない（Task C で対応）

## サブタスク管理

| サブタスク | owner | 完了条件 |
| --- | --- | --- |
| package.json 編集 | Task A | diff 4 行以内（dep 追加 4 行） |
| lockfile 再生成 | Task A | `pnpm-lock.yaml` updated |
| version 整合確認 | Task A | `version-check.json.ok === true` |
| smoke 取得 | Task A | `smoke.log` 配置 |

## 成果物

- `outputs/phase-5/phase-5.md`（本ファイル）
- `outputs/phase-5/pnpm-install.log`
- `outputs/phase-5/version-check.json`
- `outputs/phase-5/smoke.log`
- `outputs/phase-5/api-regression-check.log`
- `outputs/phase-5/typecheck-all.log`
- 変更ファイル: `package.json`, `pnpm-lock.yaml`

## 完了条件

- [ ] `package.json#devDependencies` に react / react-dom / 型 4 dep が追加されている
- [ ] `pnpm-lock.yaml` が再生成されている
- [ ] `version-check.json.ok` が `true`
- [ ] smoke で `jsx-dev-runtime` 解決エラーが出ていない
- [ ] coverage Statements/Branches/Functions/Lines >=80%（apps/api / apps/web / packages/* 全パッケージ）を AC として明記
- [ ] `bash scripts/coverage-guard.sh` exit 0 を検証経路として明記

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（タスク 1-5）完了
- [ ] 全成果物実体配置

## 次 Phase

Phase 6（テスト実行・カバレッジ確認）— 全 test の unblock 検証 + coverage-guard 集計到達確認。
