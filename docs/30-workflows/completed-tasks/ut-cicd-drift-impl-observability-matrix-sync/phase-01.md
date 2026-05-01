# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-01 |
| 実行種別 | serial |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| カテゴリ | improvement |

## 目的

`observability-matrix.md` (SSOT) と `.github/workflows/` 実体の drift を解消するため、以下を確定させる。

1. 同期対象 workflow の正本リスト
2. 各 workflow の current facts（trigger / jobs / Discord 通知の有無）
3. 旧 path 参照の解消方針
4. 監視対象表に追加する 4 列分離スキーマ（file name / display name / job id / required status context）

## 真の論点

- 「監視マトリクスを更新する」ことではなく、「workflow ファイル名・表示名・job id・required status context という別物の識別子を同一カラムに混ぜず、observability owner がどの context を見れば良いか曖昧にしない」ことが本質。
- backend-ci.yml は "ci" ではなく **deploy 系 workflow**（`deploy-staging` / `deploy-production`）であり、命名と責務に乖離がある事実を SSOT に明記する必要がある。

## P50 前提確認チェック

| 確認項目 | 判定 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | 通常の docs sync として Phase 5 を実装 Phase とする |
| upstream（main 等）にマージ済み | No | docs-only sync 未実施 |
| 前提タスク（05a） | 完了済み (`completed-tasks/`) | 依存解消不要 |

`implementation_mode = "new"` を確定。

## 既存コードベース現況確認 (Inventory)

### `.github/workflows/` 実体（2026-05-01 時点）

| file | name (display) | trigger 概要 | jobs |
| --- | --- | --- | --- |
| `ci.yml` | `ci` | `push` / `pull_request` | `ci`, `coverage-gate` |
| `backend-ci.yml` | `backend-ci` | `push` 系 | `deploy-staging`, `deploy-production` |
| `validate-build.yml` | `Validate Build` | `push` / `pull_request` | `validate-build` |
| `verify-indexes.yml` | `verify-indexes-up-to-date` | `push` / `pull_request` | `verify-indexes-up-to-date` |
| `web-cd.yml` | `web-cd` | `push` 系 | `deploy-staging`, `deploy-production` |

> **current facts**: `grep -iE "discord|webhook|notif" .github/workflows/{ci,backend-ci,validate-build,verify-indexes,web-cd}.yml` の結果は **0 件**。本タスクの SSOT 上、5 本すべて「Discord 通知未実装」と注記する。

### スコープ外 workflow（Phase 1 で明示）

| file | 取り扱い |
| --- | --- |
| `e2e-tests.yml` | 別タスク化候補（Phase 12 で未タスク検出） |
| `pr-build-test.yml` | 別タスク化候補 |
| `pr-target-safety-gate.yml` | UT-GOV-002 関連、別タスクで管理 |

### SSOT 現状（drift 確認）

`docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` には現在以下のみが列挙されている。

- dev: `GitHub / Actions / ci.yml`
- main: `GitHub / Actions / validate-build.yml`, `GitHub / Actions / ci.yml`

→ `backend-ci.yml` / `web-cd.yml` / `verify-indexes.yml` の 3 本が欠落。

## 受入条件（再掲）

- [ ] AC-1: SSOT に 5 workflow 全件列挙
- [ ] AC-2: trigger / job 構造の記述
- [ ] AC-3: Discord 通知未実装 current facts 注記
- [ ] AC-4: documentation-changelog 同期記録
- [ ] AC-5: 4 列分離 mapping 表

## 命名規則の確認

- workflow file name: `kebab-case.yml`
- workflow display name (`name:`): フリーフォーマット（`ci` / `Validate Build` / `verify-indexes-up-to-date` 混在）
- job id: `kebab-case` または `snake_case` 混在
- required status context: GitHub branch protection API の confirmed context 値（現時点は `ci` / `Validate Build` / `verify-indexes-up-to-date`）。`<workflow display name> / <job id>` 形式は UI 表示や候補説明としてのみ扱い、confirmed context と混同しない。

→ Phase 2 で 4 列分離表に正規化する（リネームはしない、現実体を記述するのみ）。

## 制約 / 不変条件

- D1 への直接アクセス制約は影響なし（docs-only）
- GAS prototype 関連も影響なし
- workflow 自体のリネーム・構造変更は **禁止**（本タスクは docs sync のみ）

## carry-over 確認

`git log --oneline -5` で確認した直近コミットには本タスク該当変更なし。新規作業として着手する。

## 次 Phase への引き渡し

Phase 2 では以下を確定する。

1. SSOT に追加するセクション構成（dev / main 環境別表 + 4 列分離 mapping 表）
2. Discord 通知 current facts 注記の文言テンプレート
3. 旧 path 参照の置換ルール

## 成果物

- `outputs/phase-01/main.md` — 本 Phase の確定事項サマリー
