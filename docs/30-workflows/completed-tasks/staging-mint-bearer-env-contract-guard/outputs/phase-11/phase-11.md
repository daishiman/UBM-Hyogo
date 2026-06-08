# Phase 11: 手動テスト（NON_VISUAL 証跡設計）— staging-mint-bearer-env-contract-guard

> 前提: [phase-1.md](../phase-1/phase-1.md), [phase-10.md](../phase-10/phase-10.md), [manual-test-result.md](./manual-test-result.md)。

## 11.0 NON_VISUAL 宣言（WEEKGRD-03 準拠）

> **NON_VISUAL のため Phase 11 スクリーンショットは不要。**

| 項目 | 値 |
| ---- | -- |
| タスク種別 | **NON_VISUAL** |
| 非視覚的理由 | 変更対象は CI workflow（`.yml`）・Node script（`.mts`）・shell（`.sh`）のみ。レンダリングされる UI / UX 表示物の追加・変更が一切ない（mint script は CLI / CI 専用で画面描画なし） |
| 代替証跡 | (1) 自動テスト出力（vitest）、(2) GitHub Actions 構文検証（actionlint）。`outputs/phase-11/screenshots/` は作成しない（`.gitkeep` も置かない） |
| 実地操作 | 実 Cloudflare staging deploy・実 secret 投入・実 CI 実行は **実施しない**（user-gated・index.md §2 スコープ外）。代替として source-level 自動テスト + actionlint を証跡とする |
| workflow_state | `implemented_local_evidence_captured`（実コード実装 + source-level evidence 取得済み） |

## 11.1 source-level PASS と環境ブロッカーの分離記録（WEEKGRD-01）

| 層 | 検証範囲 | 本サイクルでの可否 | 根拠 |
| -- | -------- | ------------------ | ---- |
| **source-level**（自動テスト・静的検証） | pure 関数（`parseRoles` / `requiredEnvForRoles` / `findMissingEnv` / `mintStagingBearersForRoles`）・gate（`detectContractViolations`）・workflow 構文（actionlint） | 実装サイクルで実行可（real D1 / secret 不要） | env を引数注入する pure 設計（不変条件 #3）・descriptor fixture でのオフライン検証 |
| **環境ブロッカー**（実 CI 実行・実 secret・実 deploy） | 実 GitHub Actions 上での mint step 実行・1Password item 解決・staging deploy | **未実行**（user-gated / スコープ外） | 実 secret 整備が user 前提。実 deploy は index.md §2 スコープ外 |

> 環境ブロッカーは source-level PASS の妨げにならない。本タスクの AC-1〜AC-12 はすべて source-level（自動テスト + actionlint）で検証可能に設計されている。

## 11.2 Phase 11 evidence file inventory（FB-02・ファイル名固定）

> 以下は本サイクルで生成した source-level 証跡。`outputs/phase-11/evidence/` 配下に tracked artifact として配置する。

| # | evidence（ファイル名固定） | 内容 | 主ソース | 対応 AC | status |
| - | -------------------------- | ---- | -------- | ------- | ------ |
| 1 | `outputs/phase-11/evidence/mint-role-scope-test.log` | vitest 出力（`mint-staging-bearers.spec.ts` + `mint-staging-bearers-self-verify.spec.ts` + `verify-mint-env-contract.spec.ts`） | `mint-staging-bearers.spec.ts` / `verify-mint-env-contract.spec.ts` | AC-1〜AC-4, AC-6, AC-7, AC-10, AC-12 | present |
| 2 | `outputs/phase-11/evidence/verify-mint-env-contract-actionlint.log` | actionlint 出力（`runtime-smoke-staging.yml` + `verify-mint-env-contract.yml`） | actionlint | AC-5, AC-8, AC-11 | present |

> `artifacts.json` / `outputs/artifacts.json` の Gate-B は `passed` に昇格済み。

## 11.3 証跡生成コマンド（実行済み）

```bash
# evidence #1: role-scoping + drift gate の自動テスト
mise exec -- pnpm vitest run \
  scripts/smoke/__tests__/mint-staging-bearers.spec.ts \
  scripts/smoke/__tests__/verify-mint-env-contract.spec.ts \
  | tee docs/30-workflows/completed-tasks/staging-mint-bearer-env-contract-guard/outputs/phase-11/evidence/mint-role-scope-test.log

# evidence #2: workflow 構文検証
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 \
  .github/workflows/runtime-smoke-staging.yml \
  .github/workflows/verify-mint-env-contract.yml \
  | tee docs/30-workflows/completed-tasks/staging-mint-bearer-env-contract-guard/outputs/phase-11/evidence/verify-mint-env-contract-actionlint.log
```

> 期待: evidence #1 = 全ケース PASS（AC-1〜AC-4 / AC-6 / AC-7 / AC-10 / AC-12）。evidence #2 = actionlint 0 件（構文 OK）。
> secret 実値は一切出力しない（mint script は env 名のみ出力・不変条件 #1）。万一を防ぐため取得後に redaction grep（manual-test-result.md §4）で再確認する。

## 11.4 完了条件（Phase 11）

- [x] 冒頭に NON_VISUAL 宣言（WEEKGRD-03・固定フレーズ「Phase 11 スクリーンショット不要」）を記載
- [x] 実地操作不可（user-gated）を明記し、自動テスト + actionlint を代替証跡として宣言
- [x] source-level PASS と環境ブロッカーを分離記録（WEEKGRD-01）
- [x] 証跡ファイル名を固定宣言し、`present` に昇格
- [x] `outputs/phase-11/screenshots/` を作成しない（NON_VISUAL）
