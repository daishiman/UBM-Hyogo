# Phase 11: 手動テスト検証 (NON_VISUAL)

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト検証 |
| 前 Phase | 10 (CI 緑化 / 自動検証完了) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク種別 | docs-only / NON_VISUAL / 小規模 |
| カテゴリ | improvement |

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | docs-only |
| 非視覚的理由 | SSOT (`observability-matrix.md`) の Markdown 内容更新のみ。アプリケーション UI / UX / public route / member route / admin route いずれにも影響しない |
| 代替証跡 | bash (`rg` / `grep` / `gh api`) コマンドの実行結果ログ |
| スクリーンショット | **作成しない**。`outputs/phase-11/screenshots/.gitkeep` も作成しない（docs-only タスクで UI 変更ゼロのため） |

> NON_VISUAL タスクの取り扱い: `task-specification-creator` の規約に従い、視覚証跡を要求せず bash 実行結果をもって AC 達成証跡とする。Phase 12 の implementation-guide でも視覚証跡セクションに「UI/UX 変更なしのため Phase 11 スクリーンショット不要」と明記する。

## 目的

Phase 5 で更新した SSOT (`docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md`) が、`.github/workflows/` 実体 5 本（`ci.yml` / `backend-ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `web-cd.yml`）と整合していることを bash コマンド suite で最終検証する。

## 検証手順

### 手順 1: SSOT 5 workflow 全件列挙の確認 (AC-1)

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-061526-wt-2
rg -n "ci\.yml|backend-ci\.yml|validate-build\.yml|verify-indexes\.yml|web-cd\.yml" \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md \
  | wc -l
```

期待値: 5 件以上（5 workflow 名がそれぞれ最低 1 行で出現）。各 workflow 名が `rg` 結果に存在することを目視で確認する。

### 手順 2: Discord 通知未実装の current facts 整合 (AC-3)

```bash
grep -iE "discord|webhook|notif" \
  .github/workflows/ci.yml \
  .github/workflows/backend-ci.yml \
  .github/workflows/validate-build.yml \
  .github/workflows/verify-indexes.yml \
  .github/workflows/web-cd.yml
```

期待値: **0 件**。SSOT に「Discord/Slack 通知は未実装。失敗時は GitHub Actions UI / email 通知に依存」と current facts として記載されており、grep 0 件と整合することをもって AC-3 達成とする。

### 手順 3: UT-GOV-001 整合 (`required_status_checks.contexts`)

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts'
```

期待動作:
- 上記 2 コマンドが返す context 配列の各値（confirmed context）が、SSOT の `required status context` 列に同名で出現すること。`workflow / job` 形式の候補表示とは照合しない。
- diff が 0 件であること

### 手順 4: 旧 path 参照 0 件確認 (AC-2 補強)

```bash
rg "docs/05a-" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails
```

期待値: **0 件**。Phase 5 patch で旧 path (`docs/05a-...`) が完全に置換され、新 path (`docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/`) のみが SSOT に残ることを確認する。

### 手順 5: 4 列分離 mapping 表の存在確認 (AC-5)

```bash
rg -n "workflow file|display name|job id|required status context" \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
```

期待値: 4 列ヘッダがすべて 1 つの mapping 表内で同一行に出現すること。

## 環境ブロッカー記録欄

以下の場合は `outputs/phase-11/manual-test-result.md` に Blocker セクションを設けて記録する。

| ブロッカー | 代替手順 |
| --- | --- |
| `gh` CLI 認証未設定で手順 3 が実行不能 | GitHub Web UI から Settings → Branches → Branch protection rules を開き、`main` / `dev` の Required status checks を目視転記。SSOT との手動 diff 結果を Markdown に貼付 |
| 1Password / `op run` 未設定 | 手順 1, 2, 4, 5 のみ実行し、手順 3 を `deferred-to-phase-12` として記録（Phase 12 の未タスク候補に「UT-GOV-001 整合自動化」を追加） |

## 受入条件 (AC) との対応

| AC | 検証手順 | 判定方法 |
| --- | --- | --- |
| AC-1: 5 workflow 全件列挙 | 手順 1 | rg 出力に 5 workflow 名が全て出現 |
| AC-2: trigger / job 構造記述 | 手順 4, 5 | 旧 path 0 件 & 4 列分離表の存在 |
| AC-3: Discord 通知 current facts 注記 | 手順 2 | grep 0 件 & SSOT に注記あり |
| AC-4: documentation-changelog 同期 | Phase 12 で扱う | Phase 11 では対象外（後段 gate） |
| AC-5: 4 列分離 mapping 表 | 手順 5 | 4 列ヘッダが同一表内に揃う |

## 成果物

- `outputs/phase-11/manual-test-result.md` — 手順 1〜5 の実行ログと判定結果。Blocker 発生時は同ファイル内 Blocker セクションに記録

## 完了条件

- 手順 1〜5 の全コマンドが期待値どおりの出力を返す
- AC-1 / AC-2 / AC-3 / AC-5 が「達成」と判定される（AC-4 は Phase 12 で達成）
- `manual-test-result.md` に各手順の実行コマンドと出力サマリが記録されている
