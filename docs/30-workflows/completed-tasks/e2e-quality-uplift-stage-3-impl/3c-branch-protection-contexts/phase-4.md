# Phase 4: テスト作成（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` / `phase-2.md` / `phase-3.md` |
| 出力 | dry-run コマンド集 / pre/post 差分検証スクリプト / 完全一致 assertion |

---

## 0. 前提確認（着手前 必須チェック）

| # | チェック項目 | コマンド | 期待値 |
|---|-------------|----------|--------|
| P-01 | `dev` 現契約 contexts | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \| jq -r '.required_status_checks.contexts \| sort \| .[]'` | `Validate Build` / `ci` / `coverage-gate` の 3 件のみ（drift なし） |
| P-02 | `main` 現契約 contexts | 同（`branches/main`） | 同 3 件 |
| P-03 | `gh auth` スコープ | `gh auth status` | `repo` / `admin:org`（必要なら）が含まれる |
| P-04 | `jq` / `diff` 利用可能 | `jq --version && diff --version` | exit 0 |

> P-01〜P-03 のいずれかが NG なら本 Phase 以降を着手しない。

---

## 1. 適用前 snapshot 取得テスト

| # | 内容 | コマンド |
|---|------|---------|
| T-3c-1 | `dev` 現状取得 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > outputs/phase-11/branch-protection-dev-pre.json` |
| T-3c-2 | `main` 現状取得 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-11/branch-protection-main-pre.json` |
| T-3c-1a | `dev` pre snapshot の妥当性 | `jq -e '.required_status_checks.contexts \| length == 3' outputs/phase-11/branch-protection-dev-pre.json` | exit 0 |
| T-3c-2a | `main` pre snapshot の妥当性 | 同（main） | exit 0 |

## 2. context 登録確認（**3a / 3b 適用後・3c 実行前** に必須）

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3c-3 | 直近 PR の check-runs に `lighthouse-ci` 登場 | `gh api repos/daishiman/UBM-Hyogo/commits/<head-sha>/check-runs \| jq -r '.check_runs[].name' \| sort -u \| grep -x 'lighthouse-ci'` | exit 0 |
| T-3c-4 | 同上に `e2e-tests-coverage-gate` 登場 | `... \| grep -x 'e2e-tests-coverage-gate'` | exit 0 |

> T-3c-3 / T-3c-4 が NG のまま 3c を実行すると PR 永久 pending（BLK-03）。**この 2 件を観測してから** PUT に進む。

## 3. 適用後 drift 検証（dev / main 共通）

各クエリは Phase 2 §3 の `jq` クエリ集を使用する。

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3c-5 | `dev` contexts 完全一致 5 件 | `gh api .../branches/dev/protection \| jq -r '.required_status_checks.contexts \| sort \| .[]'` | `Validate Build` / `ci` / `coverage-gate` / `e2e-tests-coverage-gate` / `lighthouse-ci` の 5 件 |
| T-3c-6 | `main` contexts 完全一致 5 件 | 同（main） | 同 5 件 |
| T-3c-7 | `required_pull_request_reviews=null` | `... \| jq '.required_pull_request_reviews'` | `null`（`{}` ではない） |
| T-3c-8 | `lock_branch.enabled=false` | `... \| jq '.lock_branch.enabled'` | `false` |
| T-3c-9 | `enforce_admins.enabled` 既存維持 | `... \| jq '.enforce_admins.enabled'` | pre-snapshot と同値 |
| T-3c-10 | `required_conversation_resolution.enabled=true` 維持 | `... \| jq '.required_conversation_resolution.enabled'` | `true` |
| T-3c-11 | `required_status_checks.strict=false` 維持 | `... \| jq '.required_status_checks.strict'` | `false` |

## 4. pre/post 差分検証

```bash
# contexts 配列のみ差分（追加 2 件のみであることを assertion）
diff \
  <(jq -r '.required_status_checks.contexts | sort | .[]' outputs/phase-11/branch-protection-dev-pre.json) \
  <(jq -r '.required_status_checks.contexts | sort | .[]' outputs/phase-11/branch-protection-dev-post.json) \
  > outputs/phase-11/dev-contexts.diff

# 期待: pre には無く post にのみ存在する 2 件 = lighthouse-ci / e2e-tests-coverage-gate
grep -E '^> (lighthouse-ci|e2e-tests-coverage-gate)$' outputs/phase-11/dev-contexts.diff | wc -l
# 期待値: 2
```

main も同形で実施。

## 5. rollback リハーサル（実 dev では行わない）

| # | 内容 | コマンド |
|---|------|---------|
| T-3c-12 | pre snapshot を再 PUT して原状復帰可能か確認（**drift シミュレーション環境** で確認） | `gh api -X PUT ... --input outputs/phase-11/branch-protection-dev-pre.json` |

## 6. テスト実行順序

```
P-01..P-04（前提）
   ↓
T-3c-1 / T-3c-2（pre snapshot）
   ↓
T-3c-3 / T-3c-4（context 登録確認）
   ↓
（gh api PUT — Phase 5 で実施）
   ↓
T-3c-5..T-3c-11（drift 検証）
   ↓
§4 pre/post diff 検証
```

## 7. exit criteria（Phase 4 完了条件）

| # | 条件 |
|---|------|
| E-01 | T-3c-1..T-3c-11 が Phase 5 実装後に実 API で再現可能であること |
| E-02 | §4 の `diff` 結果が「追加 2 件のみ」を示すこと |
| E-03 | rollback リハーサル手順 T-3c-12 が文書化されていること |

## 8. 引き継ぎ（Phase 5 へ）

| 項目 | 内容 |
|------|------|
| 実装すべき payload | Phase 5 §3.2 / §3.3 の `dev` / `main` 両方の `gh api -X PUT` heredoc |
| evidence 命名 | Phase 11 §3.4 の 5 ファイル |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 4
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3c の `gh api PUT` 適用前後を機械的に検証するためのコマンド集と完全一致 assertion を確定する。

## 実行タスク

- pre snapshot 取得手順を確定する。
- context 登録確認のための grep 完全一致を定義する。
- post drift 検証クエリ 7 件を定義する。
- pre/post diff スクリプトを定義する。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-4.md
- 本サブタスク phase-2.md §3

## 実行手順

1. 前提チェック P-01..P-04 を実行する。
2. T-3c-1..T-3c-11 を Phase 5 実装後に再現する。
3. §4 の diff コマンドで追加 contexts のみであることを確認する。

## 統合テスト連携

- `gh api` の read-only 経路 (`GET`) と `jq` の組合せで E2E 代替検証とする。

## 成果物

- 本 phase markdown
- 検証コマンド集

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
