# Unassigned Task Detection — coverage-80-enforcement

current / baseline 分離形式。**0 件でない**ため「該当あり」セクション必須。

## baseline（既知の派生タスク群 / 既起票済 / 本タスクで再起票しない）

| ID | 既存タスク | 関係 |
| --- | --- | --- |
| - | UT-GOV-001（GitHub branch protection apply） | PR③ で `required_status_checks.contexts` に `coverage-gate` を登録する運用の実 PUT は UT-GOV-001 側で実施 |
| - | UT-GOV-004（required_status_checks contexts 同期） | coverage-gate job 名同期の上流前提 |
| - | int-test-skill | 統合テスト coverage 寄与の互換性確認は既存 skill 範囲 |

## current（本タスク Phase 1〜11 で発見した派生課題 / formalize 候補）

| 区分 | ID | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- | --- | --- |
| current | U-1 | Turborepo / Nx 導入による coverage cache（代替案 E） | 別タスク化（規模大） | 本タスクは `--changed` flag で部分代替。将来的に Turborepo 導入時に coverage キャッシュも組み込む | unassigned-task formalize 候補（`task-turborepo-introduction`） |
| current | U-2 | E2E（Playwright）導入で Next.js page を coverage に乗せる | 別タスク化（フレームワーク追加） | 現状 page.tsx / layout.tsx は exclude。E2E で別経路 coverage を取る | unassigned-task formalize 候補（`task-e2e-playwright-coverage`） |
| current | U-3 | vitest workspace 移行（per-package config 統一） | 別タスク化（中規模リファクタ） | 現状は単一 root config + multi-include。workspace 化で per-package 設定を整理 | unassigned-task formalize 候補（`task-vitest-workspace-migration`） |
| current | U-4 | soft → hard 切替期限の cron リマインダ | 運用タスク | PR① merge 後、N 週間以内に PR③ を出さないと永遠に warning。GitHub Actions の scheduled workflow か Issue リマインダで強制化 | unassigned-task formalize 候補（`task-coverage-soft-to-hard-deadline-reminder`） |
| current | U-5 | Codecov 導入時の threshold sync lint | 仕組み化 | 現 repo に `codecov.yml` は存在しない。導入する場合は `coverage-guard.sh` / aiworkflow-requirements / Codecov 設定の 80% 一致を node スクリプトで lint | unassigned-task formalize 候補（`task-codecov-threshold-lint`） |

## 設計タスクパターン 4 種の確認

| パターン | 該当 | 説明 |
| --- | --- | --- |
| 型→実装 | 該当（U-3） | vitest workspace 型定義の整備が implementation の前提 |
| 契約→テスト | 該当（U-2） | E2E の page 契約に対するテスト追加 |
| UI仕様→コンポーネント | 非該当 | NON_VISUAL タスクのため |
| 仕様書間差異 | 該当（U-5） | Codecov 導入時の coverage threshold 乖離検出 |

## 各 U-N の優先度

| ID | 優先度 | 理由 |
| --- | --- | --- |
| U-4 | 高 | 切替忘却すると本タスクの目的（hard gate 化）が達成されない |
| U-5 | 中 | drift で CI / SaaS 表示が乖離するが、即座に block にはならない |
| U-2 | 中 | apps/web の実カバレッジが exclude のため低く見える問題 |
| U-3 | 低 | 現状でも動作するが、設定が散らかる |
| U-1 | 低 | 規模が大きく単独タスク化、現状性能で十分 |

## U-1: Turborepo / Nx coverage cache

### 苦戦箇所【記入必須】

現状の `coverage-guard.sh --changed` は git diff ベースの軽量化に閉じるため、依存 package への波及や cache hit/miss の再現性までは保証しない。

### リスクと対策

| リスク | 対策 |
| --- | --- |
| 差分実行で依存先の coverage regression を見逃す | CI は full coverage を維持し、cache 導入は Turborepo / Nx 採用時に別タスク化 |
| 本タスクに build system 導入が混入する | coverage-80-enforcement では `--changed` のみ採用し、cache はスコープ外固定 |

### 検証方法

Turborepo / Nx 導入タスク側で affected graph と `pnpm -r test:coverage` の結果差分を比較する。

### スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| affected graph と coverage 実行範囲の設計 | 本 workflow 内での Turborepo / Nx 導入 |

## U-2: E2E coverage for Next.js pages

### 苦戦箇所【記入必須】

`page.tsx` / `layout.tsx` / Edge runtime 領域は v8 unit coverage で扱いにくく、単純に include すると 0% 計上で gate を不当に落とす。

### リスクと対策

| リスク | 対策 |
| --- | --- |
| apps/web の重要導線が unit coverage から外れる | Playwright 等の E2E coverage を別タスクで設計 |
| exclude が広がりすぎる | Phase 11 baseline で除外比率を確認し、30% 超は blocker とする |

### 検証方法

E2E 導入タスクで主要 route の smoke / accessibility / server action 境界を測り、unit coverage 除外分を補完できるか確認する。

### スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| Next.js page / route の E2E coverage 方針 | 本 workflow 内での Playwright 導入 |

## U-3: Vitest workspace migration

### 苦戦箇所【記入必須】

単一 root config は導入が軽い一方、package ごとの include / exclude / setup 差分が増えると設定が肥大化する。

### リスクと対策

| リスク | 対策 |
| --- | --- |
| package 固有設定が root config に散らばる | workspace 化で per-package config に分離 |
| 移行時に coverage threshold が package ごとに drift | 一律 80% を workspace 共通設定から継承 |

### 検証方法

workspace 移行タスクで各 package の `test:coverage` と root `coverage:guard` を実行し、summary path と threshold が一致することを確認する。

### スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| vitest workspace 設計と migration 手順 | coverage-80-enforcement の PR① への混入 |

## U-4: soft → hard deadline reminder

### 苦戦箇所【記入必須】

PR① soft gate 導入後に PR③ hard gate 化が遅れると、coverage-gate が warning のまま定着し目的を達成できない。

### リスクと対策

| リスク | 対策 |
| --- | --- |
| soft gate が恒久化する | PR① merge 日から期限を切り、Issue reminder または scheduled workflow で通知 |
| 通知だけで実行されない | Phase 13 runbook に PR③ owner と期限を明記 |

### 検証方法

PR① merge 後に期限 Issue が作成され、PR③ merge または 2 段階適用合意まで open のまま残ることを確認する。

### スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| soft gate 期限管理の通知設計 | 本 workflow 内での scheduled workflow 実装 |

## U-5: codecov / vitest threshold sync lint

### 苦戦箇所【記入必須】

CodeCov を後から導入する場合、`codecov.yml`、`coverage-guard.sh`、aiworkflow-requirements の3箇所に coverage threshold が現れるため、片方だけ古い値に戻る drift が起きやすい。

### リスクと対策

| リスク | 対策 |
| --- | --- |
| SaaS 表示と CI hard gate の基準が乖離する | threshold sync lint を CI に追加 |
| 正本更新漏れが再発する | aiworkflow-requirements を正本、vitest config を実行設定として対応表を固定 |

### 検証方法

Node script で `codecov.yml` / `scripts/coverage-guard.sh` / `quality-requirements-advanced.md` の threshold を読み、全 package 一律 80% と一致しない場合に exit 1。

### スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| threshold sync lint の仕様化 | 本 workflow 内での lint script 実装 |
