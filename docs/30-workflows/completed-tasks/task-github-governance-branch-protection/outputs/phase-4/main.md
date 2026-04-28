# Phase 4 — 検証計画（サマリ）

## Status
done

> 本タスクは docs-only（spec_created）であり、本 Phase は **コード実装の検証ではなく、Phase 2 草案（branch protection JSON / auto-rebase workflow / pull_request_target safety gate）の "仕様としての検証手順"** を定義する。
> 実装と本物の GitHub Repository への適用は別タスクで行う（Phase 1 §1 / Phase 2 冒頭注記）。

---

## 1. 検証対象（Phase 2 アーティファクト）

| # | 対象 draft | 検証主眼 |
| - | --- | --- |
| 1 | `branch-protection.main.json.draft` | 必須 8 contexts / approving=2 / linear history / enforce_admins |
| 2 | `branch-protection.dev.json.draft` | 必須 8 contexts / approving=1 / CODEOWNERS 任意 |
| 3 | `merge-policy.draft` (repo setting) | squash-only / merge_commit=false / rebase_merge=false |
| 4 | `auto-rebase.workflow.yml.draft` | trigger / concurrency / permissions / 失敗時 bot 停止 |
| 5 | `pr-target-safety-gate.workflow.yml.draft` | workflow `permissions: {}` / SHA 固定 checkout / job 分離 |

詳細な検証マトリクス・PASS/FAIL 基準は `test-matrix.md` を参照。

---

## 2. 検証アプローチ（4 段）

| 段 | 手段 | 産物 |
| --- | --- | --- |
| L1 静的レビュー | `jq` / `yq` による JSON/YAML schema 検査・`actionlint` | spec_lint レポート |
| L2 dry-run | `gh api -X GET repos/:owner/:repo/branches/:branch/protection` で **既存設定との diff** | 適用前 diff |
| L3 ローカル実行 | `act` により `auto-rebase.yml` / `pr-target-safety-gate.yml` を pull_request イベントで起動 | act ワークフロー実行ログ |
| L4 policy lint | OPA / Conftest による rego policy 検査（任意） | policy レポート |

> いずれも **本物の repo 設定は変更しない**。L2 は GET のみ、L3 はローカル Docker、L4 は静的 rego 評価。

---

## 3. PASS/FAIL の総合基準（docs-only）

- **PASS**: `test-matrix.md` の全項目で PASS、かつ Phase 1 受入条件 AC-1〜AC-7 が docs 上で再確認可能。
- **CONDITIONAL PASS**: `act` 実行環境が用意できないなど検証手段の不足はあるが、JSON/YAML schema lint と gh api dry-run が通過した場合。Phase 5 ランブックに「実適用直後に再検証」と申し送る。
- **FAIL**: schema lint で必須キー欠落、または `permissions: {}` が抜けるなど安全性に直結する欠陥が発見された場合。Phase 2 へ差し戻し。

---

## 4. Phase 3 MINOR 申し送りの取り込み

| MINOR | 取り込み |
| --- | --- |
| MINOR-1 lock_branch 運用条件 | Phase 5 ランブックの「凍結時運用」節で記述。本 Phase では検証項目として "lock_branch=false が default" を確認するに留める |
| MINOR-2 rebase conflict 通知 | 本タスク責務外。test-matrix では「conflict 時に exit 1 で停止する」ことのみ確認 |
| MINOR-3 OSS 化時の triage 権限 | 将来タスクへ申し送り。本 Phase では private repo 前提で検証 |

---

## 5. Phase 5 への申し送り

- 本 Phase で固めた「適用前 dry-run 手順」「適用後の `gh api` 再取得 diff」を、Phase 5 ランブックの **検証コマンド** セクションへそのまま転記する。
- `act` での YAML 実行可否を確認しておくと、Phase 5 の workflow 配置タスクの所要時間が短縮される。

---

## 6. 完了判定

- `test-matrix.md` が 5 アーティファクト × 4 検証手段ぶんの行を持ち、各行に PASS/FAIL 基準が記載されていること。
- Phase 1 AC-1〜AC-7 と本 Phase 検証項目の対応が表で再確認できること（test-matrix.md 末尾）。
