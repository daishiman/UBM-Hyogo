# Phase 2: 設計（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` / 親 `phase-2.md` §3 / 親 `phase-5.md` §3 |
| 出力 | payload 構造設計 / pre/post snapshot 戦略 / `jq` 検証クエリ集 |

---

## 1. payload 構造（PUT 必須 field 全列挙）

GitHub `PUT /repos/{owner}/{repo}/branches/{branch}/protection` は **既存値を merge せず置換** するため、現行値を保持したい field も全て payload に含める必要がある。

| field | 値 | 由来 |
|-------|----|------|
| `required_status_checks.strict` | `false` | NFR-3c-4 |
| `required_status_checks.contexts` | `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]` | FR-3c-1..4 |
| `enforce_admins` | `false`（`dev` の現行） / `false`（`main` の現行） | pre-snapshot から再 PUT |
| `required_pull_request_reviews` | `null` | NFR-3c-1 |
| `restrictions` | `null` | 現状維持 |
| `required_linear_history` | `false`（現行を維持） | NFR-3c-6 |
| `allow_force_pushes` | `false` | NFR-3c-7 |
| `allow_deletions` | `false` | NFR-3c-7 |
| `block_creations` | `false` | 現状維持 |
| `required_conversation_resolution` | `true` | NFR-3c-5 |
| `lock_branch` | `false` | NFR-3c-2 |
| `allow_fork_syncing` | `false` | 現状維持 |

> `enforce_admins` の真値は CLAUDE.md governance では `true` 期待だが、GitHub branch protection の REST API では historical default に応じ `false` の場合がある。本仕様書では **pre-snapshot 値をそのまま再 PUT**（drift 防止）する方針とし、CLAUDE.md governance の `enforce_admins=true` 期待との突合は Phase 12 で別途実施する。

## 2. pre / post snapshot 戦略

### 2.1 取得タイミング

| step | 内容 | 出力ファイル |
|------|------|------------|
| S1 | 適用前（3a / 3b context 登録確認後・PUT 直前） | `outputs/phase-11/branch-protection-{dev,main}-pre.json` |
| S2 | 適用後（PUT 直後） | `outputs/phase-11/branch-protection-{dev,main}-post.json` |

### 2.2 取得コマンド

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-11/branch-protection-dev-pre.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-11/branch-protection-main-pre.json
```

post も同コマンド形式で `-post.json` に保存する。

## 3. `jq` 検証クエリ集

| ID | 用途 | クエリ |
|----|------|--------|
| Q-3c-A | contexts 配列を sort して列挙 | `jq -r '.required_status_checks.contexts \| sort \| .[]'` |
| Q-3c-B | contexts 件数 | `jq '.required_status_checks.contexts \| length'` |
| Q-3c-C | strict | `jq '.required_status_checks.strict'` |
| Q-3c-D | required_pull_request_reviews が null | `jq '.required_pull_request_reviews'` → `null` |
| Q-3c-E | lock_branch.enabled | `jq '.lock_branch.enabled'` |
| Q-3c-F | enforce_admins.enabled | `jq '.enforce_admins.enabled'` |
| Q-3c-G | required_conversation_resolution.enabled | `jq '.required_conversation_resolution.enabled'` |
| Q-3c-H | pre/post diff（contexts のみ） | `diff <(jq -r '.required_status_checks.contexts \| sort \| .[]' pre.json) <(jq -r '.required_status_checks.contexts \| sort \| .[]' post.json)` |

## 4. payload 配信方式の選択肢

| 方式 | pros | cons | 採用判断 |
|------|------|------|----------|
| A: bash heredoc inline（`--input -`） | 単一スクリプトで自己完結 / 値が仕様書内で可視 | shell escape 注意 / 再利用性低 | **採用**（Phase 5 / Phase 8 で再評価） |
| B: JSON file（`--input outputs/phase-5/payload-dev.json`） | 再利用 / git 履歴 | ファイル増 / 環境固有値が混入しやすい | Phase 8 で必要時に切替 |

→ Phase 5 では heredoc 方式を採用、Phase 8 でリファクタリング判断する。

## 5. rollback 設計

| 想定 | 手順 |
|------|------|
| post-PUT で drift 発覚（`enforce_admins` が想定外） | pre-snapshot を `--input` で再 PUT |
| context 名 typo で `gh api` 200 OK だが check 永久 pending | 該当 context を contexts 配列から除外して再 PUT |
| `dev` で問題発生（main 未着手） | `dev` のみ rollback、`main` は未変更なので影響なし |

## 6. 引き継ぎ（Phase 3 へ）

| 項目 | 内容 |
|------|------|
| レビュー観点 | dependency gate（3a / 3b context 登録確認）/ payload 全 field 網羅性 / rollback 手順の実効性 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 2
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3c 適用に必要な payload 構造・snapshot 戦略・検証クエリ・rollback 手順を確定する。

## 実行タスク

- payload の全 field を列挙し drift 防止の根拠を表で示す。
- pre/post snapshot 取得コマンドを Phase 11 evidence に伝搬する。
- `jq` 検証クエリ集を Phase 4 / Phase 9 へ伝搬する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-2.md
- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-5.md

## 実行手順

1. 親 phase-2 §3 と phase-5 §3 から 3c 該当部分を抽出する。
2. payload 全 field 表を作成する。
3. `jq` クエリ集を作成し Phase 4 で利用可能にする。

## 統合テスト連携

- NON_VISUAL phase は `gh api` read-only と `jq` パイプラインで代替する。

## 成果物

- 本 phase markdown
- payload 表 / `jq` クエリ集

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
