# Codecov / vitest / aiworkflow-requirements threshold 同期 lint - タスク指示書

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | task-codecov-threshold-sync-lint-001                                  |
| タスク名     | coverage threshold 3点同期 lint（codecov / coverage-guard / 仕様書）  |
| 分類         | CI/CD / 仕様書間整合性                                                |
| 対象機能     | `scripts/coverage-threshold-lint.ts`（新規）                          |
| 優先度       | 中                                                                    |
| 見積もり規模 | 小規模                                                                |
| ステータス   | 未実施 (proposed)                                                     |
| 親タスク     | coverage-80-enforcement                                               |
| 発見元       | coverage-80-enforcement Phase 12 unassigned-task-detection (U-5)      |
| 発見日       | 2026-04-29                                                            |
| 起動条件     | Codecov 導入時（現 repo に `codecov.yml` 未配置のため未着手）         |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

coverage 80% 閾値は次の 3 箇所に登場する候補がある:
1. `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md`（正本）
2. `scripts/coverage-guard.sh`（実行設定）
3. `codecov.yml`（SaaS 表示・PR コメント / 任意導入）

片方だけ古い値に戻る drift が発生すると、aiworkflow-requirements 正本と実 gate / SaaS 表示が乖離する。

### 1.2 問題点・課題

- 3 箇所の手動同期は誤りやすく、PR レビューでも見落とされる
- 現状 `codecov.yml` は repo に未配置だが、将来導入時に lint がないと drift 検知不能
- coverage-80-enforcement は閾値を一律 80% に揃えるが、その後の値変更（70% に緩和等）時に正本と実装の整合 lint が存在しない

### 1.3 放置した場合の影響

- SaaS 表示と CI hard gate の基準が乖離（Codecov は pass / coverage-guard は fail 等）
- aiworkflow-requirements 正本更新が `coverage-guard.sh` に反映されないまま放置される

---

## 2. 何を達成するか（What）

### 2.1 目的

coverage threshold が登場する全箇所の値を node スクリプトで読み、不一致時に CI で exit 1 する lint を導入する。

### 2.2 最終ゴール（想定 AC）

1. `scripts/coverage-threshold-lint.ts` が以下を読み比較する:
   - `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` の閾値表記
   - `scripts/coverage-guard.sh` の `THRESHOLD` 値
   - `codecov.yml`（存在時のみ）の `coverage.status.project.target` / `patch.target`
2. 全箇所が一致しない場合 exit 1 / stderr に差分を出力
3. CI workflow に `coverage-threshold-lint` job が追加される
4. `aiworkflow-requirements` を **正本**、他を **実行設定** とする対応表が runbook に明記される

### 2.3 スコープ

#### 含むもの

- threshold lint スクリプトの実装仕様
- CI job 追加仕様
- 正本 / 実行設定の対応表

#### 含まないもの

- Codecov の SaaS 課金プラン判断
- threshold 値そのものの変更（80% 維持）

### 2.4 成果物

- `scripts/coverage-threshold-lint.ts`
- `scripts/coverage-threshold-lint.test.ts`
- CI workflow 追記（`.github/workflows/ci.yml`）
- runbook 対応表（`docs/30-workflows/coverage-80-enforcement/outputs/phase-13/` または別 runbook）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- coverage-80-enforcement PR③ が merge 済み（hard gate 化済み）
- もしくは Codecov 導入の意思決定が確定した時点

### 3.2 依存タスク

- 親: coverage-80-enforcement
- 並列可: U-2, U-3

### 3.3 推奨アプローチ

Codecov 導入トリガーで起動。Codecov 未導入なら 2 点同期（aiworkflow-requirements / coverage-guard.sh）のみで開始し、`codecov.yml` 出現時に 3 点に拡張する設計とする。

---

## 4. 苦戦箇所【記入必須】

正本値が aiworkflow-requirements の Markdown テキスト中に埋め込まれているため、機械可読でない。値の抽出は正規表現に依存し、Markdown の表現変更で誤検出する可能性が高い。フロントマター YAML キー（例 `coverage_threshold: 80`）を導入して機械可読化するか、Markdown 内に固定形式の Anchor `<!-- coverage-threshold: 80 -->` を埋める等、正本側の構造化が前提となる。

---

## 5. 影響範囲

- `scripts/coverage-threshold-lint.ts`（新規）
- `.github/workflows/ci.yml`（job 追加）
- `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md`（機械可読化）

---

## 6. 推奨タスクタイプ

implementation / NON_VISUAL

---

## 7. 参照情報

- 検出ログ: `docs/30-workflows/coverage-80-enforcement/outputs/phase-12/unassigned-task-detection.md` の U-5
- 親 index: `docs/30-workflows/coverage-80-enforcement/index.md`（苦戦想定 #6）
- Codecov docs: https://docs.codecov.com/docs

---

## 8. 備考

Codecov 導入意思決定が無い間は 2 点同期 lint で運用し、`codecov.yml` 出現を CI 側で検知して動的に 3 点モードへ昇格させる構成にすると、起動条件依存を回避できる。
