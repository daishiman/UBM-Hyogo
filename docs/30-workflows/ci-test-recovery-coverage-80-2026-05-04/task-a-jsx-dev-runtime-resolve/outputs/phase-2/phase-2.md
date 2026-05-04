# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 作成日 | 2026-05-04 |
| 依存 Phase | Phase 1 |

## 目的

AC-A1〜AC-A6 を満たすための解決方針を最終確定し、案 1（root devDep 追加）採用を文書化する。Fallback（案 2: vitest deps optimizer / inline）の不採用理由を Phase 1 の AC とリンクして残す。Task C / D / E への影響と owner / co-owner を固定する。

## 実行タスク

- タスク 1: 解決方針 3 案の評価結果（親 wave Phase 2 を参照）を再掲し、案 1 採用を明記
- タスク 2: 案 2（vitest config 経路）の不採用理由を本タスク用に明記
- タスク 3: validation matrix を本タスク粒度で作成
- タスク 4: dependency matrix（owner / co-owner）の確定
- タスク 5: 影響を受ける後続タスク（Task C / D / E）への impact note

## 参照資料

| 参照資料 | パス |
| --- | --- |
| 親 wave Phase 2 | `../../../outputs/phase-2/phase-2-design.md` |
| Phase 1 | `../phase-1/phase-1.md` |
| coverage-standards | `.claude/skills/task-specification-creator/references/coverage-standards.md` |

## 実行手順

### ステップ 1: 案 1 採用の最終確認

- 親 wave Phase 2 で確定済みの推奨案を本 Task で踏襲する。
- 追加 dep の version は **apps/web と完全一致** に固定する。

| dep | version |
| --- | --- |
| react | 19.2.5 |
| react-dom | 19.2.5 |
| @types/react | 19.2.7 |
| @types/react-dom | 19.2.3 |

### ステップ 2: 案 2 の不採用理由

| 観点 | 不採用理由 |
| --- | --- |
| 表面的解決にとどまる | optimizer pre-bundle 完了前の resolve エラーが残る可能性 |
| vitest 2 → 3 の API 差分リスク | `test.deps.optimizer.web` は vitest 2 系の API。将来 upgrade 時に脆弱 |
| 根本原因への対応にならない | root の依存宣言不在という構造的問題が残る |
| Fallback としては保持 | 案 1 単独で CI が通らなかった場合に併用検討（Phase 8 / Phase 9 で判断） |

### ステップ 3: validation matrix

| Validation | Command | 期待結果 |
| --- | --- | --- |
| 失敗 grep 0 件 | `pnpm --filter @ubm-hyogo/web test 2>&1 \| grep -c "jsx-dev-runtime"` | `0` |
| version 一致 | `node -e "const r=require('./package.json').devDependencies, w=require('./apps/web/package.json'); console.log(r.react===w.dependencies.react && r['react-dom']===w.dependencies['react-dom'] && r['@types/react']===w.devDependencies['@types/react'] && r['@types/react-dom']===w.devDependencies['@types/react-dom'])"` | `true` |
| frozen-lockfile install | `pnpm install --frozen-lockfile` | exit 0 |
| build regression | `pnpm --filter @ubm-hyogo/web build` | exit 0 |
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| coverage 集計到達 | `bash scripts/coverage-guard.sh --package apps/web` | coverage-summary.json 生成（threshold 判定不問） |

## 統合テスト連携

本 Task は環境修復のため、既存統合テストの regression が無いことを Phase 6 で確認。

## 多角的チェック観点（AI が判断）

- 戦略系: monorepo の dep 二重宣言コスト vs CI 安定性のトレードオフ → CI 安定性を優先。
- システム系: peer dep 警告が消える副次効果（`@testing-library/react` / `@vitejs/plugin-react` の peer = react）。
- 問題解決系: 案 3（apps/web vitest config 分離）は scope 過大で wave-1 1 PR に収まらないため不採用。

## dependency matrix（owner / co-owner）

| 共有モジュール | 用途 | owner | co-owner | 同期タイミング |
| --- | --- | --- | --- | --- |
| `package.json` (root) | dependencies 管理 | Task A | Task B / C / D | wave-1 Task A 先行完了時 |
| `pnpm-lock.yaml` | lock | Task A | 全 task | wave 末尾 sync |
| `vitest.config.ts` (root) | 全 package test 設定 | Task A（Fallback 時のみ編集） | Task C, D | Task A wave-1 完了時 |

## サブタスク管理

| サブタスク | owner | 完了条件 |
| --- | --- | --- |
| 案採否文書化 | Task A | 本セクション |
| validation matrix | Task A | 本セクション |
| dep matrix | Task A | 本セクション |

## 成果物

- `outputs/phase-2/phase-2.md`（本ファイル）

## 完了条件

- [ ] 案 1 採用の最終決定が記載されている
- [ ] 案 2 の不採用理由が記載されている
- [ ] validation matrix が記載されている
- [ ] dependency matrix の owner/co-owner が記載されている
- [ ] coverage Statements/Branches/Functions/Lines >=80%（apps/api / apps/web / packages/* 全パッケージ）を AC として明記
- [ ] `bash scripts/coverage-guard.sh` exit 0 を検証経路として明記

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（タスク 1-5）完了
- [ ] 設計選択肢の根拠が文書化されている

## 次 Phase

Phase 3（アーキテクチャ確認）— 戻り先（PASS/MINOR/MAJOR）と Phase 4 開始条件 / Phase 13 blocked 条件を確定。
