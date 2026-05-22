# Phase 2: アーキテクチャ設計 / モジュール配置 / CI Workflow / Dependency Matrix

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| Source | `outputs/phase-2/phase-2.md` |
| 区分 | 設計（実装なし。schema 配置・validator orchestration・CI workflow trigger を確定） |
| 想定所要 | 0.25 人日 |

## 目的

Phase 1 で確定した SSOT を、(a) `packages/shared/src/gate-metadata/` と `scripts/gate-metadata/` のモジュール配置、(b) zod schema → CLI validator → CI workflow のデータフロー、(c) dependency matrix（owner/co-owner 列付き）、(d) validation matrix（typecheck / vitest / actionlint）として固定する。

## 実行タスク

1. **モジュール配置（concern 数 = 2、`phase-template-core.md §concern 数による設計書分割基準` に従い単一 phase-02.md 内に記述）**

   | concern | 配置 | 役割 |
   | --- | --- | --- |
   | schema | `packages/shared/src/gate-metadata/schema.ts` | zod schema + TypeScript 型 export |
   | validator | `scripts/gate-metadata/validate.ts` | CLI: glob 走査 + schema parse + evidence 確認 + exit 0/1 |

2. **データフロー**

   ```
   PR commit (artifacts.json or schema.ts 変更)
      ↓
   .github/workflows/verify-gate-metadata.yml が trigger
      ↓
   pnpm install → shared typecheck → focused vitest → pnpm gate-metadata:validate --require-gates-for-changed
      ↓
   scripts/gate-metadata/validate.ts:
     1. Node fs.readdir recursion under docs/30-workflows
     2. for each file: JSON.parse → metadata.gates 取得
     3. GatesArraySchema.parse(metadata.gates)（historical scan の不在は WARN/skip、changed artifacts mode は ERROR）
     4. for each gate: evidence_path repo-root relative / traversal なしを検証
     5. for each gate where status==='passed':
          fs.existsSync(path.resolve(repoRoot, evidence_path))
     6. ERROR/WARN/OK 集計 → stdout
     7. exit (errors > 0 ? 1 : 0)
      ↓
   CI status check (required)
   ```

3. **schema 配置の DI 境界判断（phase-template-core.md §DI 境界の型配置判断フロー）**
   - `GateEntrySchema` は CLI validator（`scripts/`）と将来の Phase 12 compliance task（別 task）の両方で消費される → `packages/shared/src/gate-metadata/` に配置（複数の具象で共有）。
   - `apps/web` / `apps/api` ランタイムからは参照しない（artifacts.json は build 成果物ではない）→ ただし zod schema を `packages/shared` 配下に置くことで将来の admin UI 化（含まないスコープ）にも転用可能。

4. **dependency matrix（owner / co-owner 列必須）**

   | 共有モジュール | 用途 | owner（canonical 編集権） | co-owner（参照のみ） | 同期タイミング |
   | --- | --- | --- | --- | --- |
   | `packages/shared/src/gate-metadata/schema.ts` | gate ledger schema 正本 | task-589（本タスク） | task-549（参照のみ・backfill 時にレビュー） | implemented-local 完了時 |
   | `scripts/gate-metadata/validate.ts` | CLI validator | task-589 | CI owners（github-workflows） | wave 末尾 |
   | `packages/shared/package.json` | subpath export | task-589 | package owners | Phase 5 |
   | `.github/workflows/verify-gate-metadata.yml` | CI gate | task-589 | github-workflows | wave 末尾 |
   | `docs/30-workflows/completed-tasks/issue-549-.../artifacts.json` | backfill 対象 | task-589（本 PR 内 backfill） | task-549 owner（変更承認） | Phase 6 ローカル検証時 |

5. **CI workflow 設計（`.github/workflows/verify-gate-metadata.yml`）**

   | 項目 | 値 |
   | --- | --- |
   | name | `verify-gate-metadata` |
   | on | `pull_request` with `paths: ['**/artifacts.json', 'package.json', 'pnpm-lock.yaml', 'packages/shared/package.json', 'packages/shared/src/index.ts', 'packages/shared/src/gate-metadata/**', 'scripts/gate-metadata/**', '.github/workflows/verify-gate-metadata.yml']` |
   | runs-on | `ubuntu-latest` |
   | jobs.validate.steps | 1) `actions/checkout@v4`、2) `pnpm/action-setup@v4`、3) `actions/setup-node@v4`、4) `pnpm install --frozen-lockfile`、5) `pnpm --filter @ubm-hyogo/shared typecheck`、6) `pnpm --filter @ubm-hyogo/shared test -- gate-metadata`、7) `pnpm gate-metadata:validate --require-gates-for-changed <changed-artifacts>` |
   | required status check | `dev` / `main` の branch protection 追加は user approval 後の別操作。本 PR は workflow 追加と validation 実行まで |

   **CI workflow 実在確認ゲート（phase-template-core.md §Phase 2 CI workflow 実在確認ゲート）**: 既存 `verify-indexes.yml` を参照モデルとし、新規 `verify-gate-metadata.yml` は同パターンで作成。`pr-build.yml` 等の generic placeholder は使わず、新規 owner workflow を 1 file に固定する。

6. **validation matrix（command 単位 / `phase-template-core.md §validation matrix`）**

   | コマンド | 対象 | 期待結果 | 実行 phase |
   | --- | --- | --- | --- |
   | `mise exec -- pnpm typecheck` | `packages/shared` 含む workspace 全体 | exit 0 | Phase 6 / 9 |
   | `mise exec -- pnpm lint` | 同上 | exit 0 | Phase 6 / 9 |
   | `mise exec -- pnpm --filter @ubm-hyogo/shared test` | `packages/shared/src/gate-metadata/__tests__/*.test.ts` | green / coverage >= 80% | Phase 6 / 9 |
   | `mise exec -- pnpm gate-metadata:validate` | `docs/30-workflows/**/artifacts.json` | exit 0 | Phase 6 / 8 / 9 |
   | `actionlint .github/workflows/verify-gate-metadata.yml` | 新規 workflow file | exit 0 | Phase 8 |
   | `bash scripts/coverage-guard.sh` | 全 workspace coverage AC | exit 0 | Phase 6 / 9 / 11 |

7. **既存 enum / 型 drift 対応（phase-template-core.md §Phase 2 既存 enum / status を拡張・alias する場合）**
   - `gate_id` 命名は親 #549 の自由文 `Gate-A` ... `Gate-D` を保持。本タスクで `Gate-A-RUNTIME` 等の派生命名は導入しない。
   - `status` enum 4 値（pending/passed/failed/waived）は新規に確定する正本。既存自由文の表現（"approved" / "blocked" 等）は backfill 時に直訳マッピング（"approved" → `passed`、"blocked" → `pending`）。

8. **依存境界（Phase 1 から再掲）**
   - 追加依存なし。既存 `zod` / `tsx` を利用し、artifact walk は Node 標準ライブラリで実装する。

## 変更対象ファイル

本 Phase は設計のみで実装ファイル変更なし。次フェーズ以降の前提を `outputs/phase-2/phase-2.md` に記録する。

## 入出力・副作用

- 入力: Phase 1 SSOT / 既存 `verify-indexes.yml` / `apps/web/src/lib/env.ts` zod パターン。
- 出力: `outputs/phase-2/phase-2.md`（モジュール配置 / データフロー / dependency matrix / CI workflow / validation matrix）。
- 副作用: なし。

## テスト方針

本 Phase はテストコード追加なし。validation matrix に記載した 6 コマンドが Phase 6 / 8 / 9 / 11 で実行されることが本 Phase の責務。

## ローカル実行・検証コマンド

```bash
# 既存 verify-indexes.yml を参照モデルとして読み込み
test -f .github/workflows/verify-indexes.yml && echo OK

# packages/shared の既存 export 構造確認
test -f packages/shared/src/index.ts && echo OK

# validator は Node fs.readdir recursion で実装し、追加 glob 依存を持たない
node -e "require('fs').readdirSync('docs/30-workflows').length; console.log('fs recursion input OK')"
```

## 統合テスト連携

- Phase 4 は本 Phase の validation matrix を vitest テストケースに展開。
- Phase 8 は本 Phase の CI workflow 設計をそのまま `.github/workflows/verify-gate-metadata.yml` として実装。
- Phase 9 は validation matrix 全 6 コマンドの green を確認。

## 多角的チェック観点（AIが判断）

- **owner/co-owner 明示**: dependency matrix の owner が空欄だと Phase 3 で MAJOR ブロックされる。本 Phase ですべて埋めた。
- **CI workflow 重複**: 既存 `verify-indexes.yml` と paths が一部重なる可能性（artifacts.json は indexes 対象外なので OK）。
- **後方互換**: validator は `gates[]` 不在 = WARN/skip 設計のため、historical artifacts.json を破壊しない。

## サブタスク管理

- ST-1: モジュール配置確定
- ST-2: データフロー図化
- ST-3: dependency matrix（owner/co-owner 含む）作成
- ST-4: CI workflow 設計
- ST-5: validation matrix 確定

## 成果物

- `outputs/phase-2/phase-2.md` に Phase 2 全 8 セクションを記録。

## 完了条件（DoD）

- [ ] モジュール配置 2 concern が確定している。
- [ ] データフロー図（PR → workflow → CLI → exit code）が記述されている。
- [ ] dependency matrix が owner / co-owner 列込みで全 4 行記載されている。
- [ ] CI workflow `verify-gate-metadata.yml` の trigger / steps / required status 仕様が確定している。
- [ ] validation matrix が command 単位で 6 行確定している。
- [ ] 追加依存なしの実装境界が Phase 2 / Phase 5 / Phase 7 に明記されている。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-5 すべて完了
- [ ] `outputs/phase-2/phase-2.md` 生成済み
- [ ] Phase 3 着手 GO 判定済み

## 次Phase

[Phase 3: 詳細レビュー / PASS·MINOR·MAJOR 判定](phase-03.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
