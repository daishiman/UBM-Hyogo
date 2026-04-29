# Vitest workspace 移行（per-package config 統一） - タスク指示書

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | task-vitest-workspace-migration-001                                   |
| タスク名     | 単一 root vitest config から workspace 構成への移行                   |
| 分類         | テスト基盤 / リファクタ                                                |
| 対象機能     | `vitest.config.ts` / `vitest.workspace.ts`                            |
| 優先度       | 低                                                                    |
| 見積もり規模 | 中規模                                                                |
| ステータス   | 未実施 (proposed)                                                     |
| 親タスク     | coverage-80-enforcement                                               |
| 発見元       | coverage-80-enforcement Phase 12 unassigned-task-detection (U-3)      |
| 発見日       | 2026-04-29                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

coverage-80-enforcement は単一 root `vitest.config.ts` + multi-include で各 package のテストを集約する設計を採用した。導入は軽いが、package ごとの include / exclude / setup 差分が増えると root config が肥大化する。

### 1.2 問題点・課題

- root config に apps/web（jsdom）/ apps/api（node）/ packages（node）の environment 差が散在
- package 固有 setup（D1 binding mock, MSW, edge runtime stub）の出し分けが煩雑
- per-package coverage threshold のオーバーライドが効きにくい（一律 80% 維持に支障はないが将来的に困難）

### 1.3 放置した場合の影響

- root config が長大化し、変更時の事故リスクが上がる
- 新 package 追加時に既存 package の include を破壊する事故が発生しやすい

---

## 2. 何を達成するか（What）

### 2.1 目的

vitest workspace 機能で各 package に config を分離し、root は workspace 集約と coverage 共通設定のみに役割を絞る。

### 2.2 最終ゴール（想定 AC）

1. `vitest.workspace.ts` が repo root に追加される
2. `apps/web/vitest.config.ts` / `apps/api/vitest.config.ts` / `packages/*/vitest.config.ts` が各 package に分離される
3. 一律 80% threshold は workspace 共通設定から継承され、package 別に drift しない
4. `pnpm -r test:coverage` と root `pnpm test:coverage` が同一の package 別 summary を生成する
5. coverage-guard.sh は移行後も I/O 互換（`coverage/coverage-summary.json` が package 単位で揃う）

### 2.3 スコープ

#### 含むもの

- workspace config 設計
- 各 package config への分離
- coverage-guard.sh との互換確認

#### 含まないもの

- Turborepo / Nx 導入（U-1 で別タスク）
- テストコード追加（PR② で別途）

### 2.4 成果物

- `vitest.workspace.ts`
- 各 package の `vitest.config.ts`
- `vitest.config.ts`（root）の役割整理 / 削減

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- coverage-80-enforcement PR③ merge 済み（hard gate 化が安定してから移行）
- `coverage-guard.sh` の I/O 仕様が確定していること

### 3.2 依存タスク

- 親: coverage-80-enforcement
- 並列可: U-1（Turborepo 導入時に統合検討）, U-5（threshold lint）

### 3.3 推奨アプローチ

PR③ 安定後に独立 PR で投入。各 package の config を移行 → workspace 集約 → coverage-guard.sh の互換テストの順で段階移行する。

---

## 4. 苦戦箇所【記入必須】

vitest workspace は package 別 config を分離できる一方、coverage の集約方法（per-package summary を root が再集計するか、root の workspace runner が単一 summary を生成するか）の挙動が version 依存で変わる。`coverage-guard.sh` は package 単位の `coverage/coverage-summary.json` を前提としているため、workspace 化で path や reporter 出力場所が変わると pipeline が破綻するリスクがある。移行 PR は coverage-guard と必ずセットで smoke テストする必要がある。

---

## 5. 影響範囲

- `vitest.workspace.ts`（新規）
- `vitest.config.ts`（root, 削減）
- `apps/web/vitest.config.ts`, `apps/api/vitest.config.ts`, `packages/*/vitest.config.ts`（新規 or 修正）
- `scripts/coverage-guard.sh`（互換確認）

---

## 6. 推奨タスクタイプ

implementation / NON_VISUAL（テスト基盤リファクタ）

---

## 7. 参照情報

- 検出ログ: `docs/30-workflows/coverage-80-enforcement/outputs/phase-12/unassigned-task-detection.md` の U-3
- 親 index: `docs/30-workflows/coverage-80-enforcement/index.md`（苦戦想定 #2）
- Vitest workspace docs: https://vitest.dev/guide/workspace

---

## 8. 備考

workspace 化のメリットは config の見通しと per-package 設定の局所化にある。一律 80% threshold を維持するためには workspace 共通 `defineWorkspace` で threshold を継承し、package 別オーバーライドを禁止する明示ガードが必要。
