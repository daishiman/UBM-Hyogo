# Phase 3: 設計レビュー（3c — Branch Protection contexts 更新）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` / `phase-2.md` |
| 出力 | dependency gate 確認手順 / rollback 手順検証 / リスク棚卸し |

---

## 1. dependency gate 確認（3a / 3b → 3c の遷移条件）

| Gate | 条件 | 確認コマンド | NG 時 |
|------|------|-------------|-------|
| G-1 | 3a PR-A が `dev` に merge 済み | `gh pr list --base dev --state merged --search 'in:title lighthouse'` | 3c 着手不可 |
| G-2 | `.github/workflows/lighthouse.yml` が `dev` に存在 | `gh api repos/daishiman/UBM-Hyogo/contents/.github/workflows/lighthouse.yml?ref=dev` | 3c 着手不可 |
| G-3 | 3a workflow 直近 run が `success` | `gh run list --workflow=lighthouse.yml --branch=dev --limit=1 --json conclusion` | 3c 着手不可 |
| G-4 | 直近 commit の check-runs に `lighthouse-ci` が登場 | `gh api repos/daishiman/UBM-Hyogo/commits/<head-sha>/check-runs \| jq -r '.check_runs[].name' \| sort -u` | 3c 着手不可（context 未登録） |
| G-5 | 3b PR-B が `dev` に merge 済み | `gh pr list --base dev --state merged --search 'in:title e2e hard gate'` | 3c 着手不可 |
| G-6 | `.github/workflows/e2e-tests.yml` が job name `e2e-tests-coverage-gate` で更新済み | `gh api .../e2e-tests.yml \| base64 -d \| grep 'e2e-tests-coverage-gate'` | 3c 着手不可 |
| G-7 | 3b workflow 直近 run が `success` | `gh run list --workflow=e2e-tests.yml --branch=dev --limit=1` | 3c 着手不可 |
| G-8 | 直近 commit の check-runs に `e2e-tests-coverage-gate` が登場 | G-4 と同（grep を変更） | 3c 着手不可 |

> G-4 / G-8 が NG のまま `gh api PUT` を行うと PR が **永久 pending** になる（BLK-03）。

## 2. rollback 手順レビュー

| ケース | 手順 | 検証 |
|--------|------|------|
| R-1: dev のみ apply 後に問題発覚 | `gh api -X PUT .../branches/dev/protection --input outputs/phase-11/branch-protection-dev-pre.json` | post snapshot を取り直し `diff` で原状復帰確認 |
| R-2: main apply 直後に問題発覚 | R-1 と同（main 版） | 同 |
| R-3: 両方 apply 後 | R-1 → R-2 の順で逆適用 | 両 snapshot で diff |

> rollback 用の pre-snapshot は **PUT 直前に取得した最新値** とする。古い snapshot を使うと意図しない field 巻き戻しが起きる。

## 3. リスク棚卸し

| ID | リスク | 緩和策 |
|----|-------|--------|
| RISK-3c-1 | context 名の typo（`Lighthouse-CI` 等の case mismatch） | Phase 4 T-3c-3 / T-3c-4 で grep 完全一致を確認 |
| RISK-3c-2 | `enforce_admins` の真値が CLAUDE.md governance と異なる | pre-snapshot を正本に再 PUT、Phase 12 で governance 期待値と突合 |
| RISK-3c-3 | `required_pull_request_reviews` が `null` ではなく `{}` で再 PUT され solo policy drift | payload heredoc を仕様書から逐語コピー、jq Q-3c-D で post 検証 |
| RISK-3c-4 | `gh api` 認証スコープ不足 | Phase 9 で `gh auth status` の `repo` / `admin:repo_hook` 確認 |
| RISK-3c-5 | dev のみ apply・main 取り残し | Phase 11 evidence に dev / main 両方の post.json 保存を必須化 |
| RISK-3c-6 | 3a / 3b の job name が後日変更され context 配列と乖離 | Phase 12 で CLAUDE.md / 親 workflow と context 名突合 |

## 4. レビュー判定

| 項目 | 結果 |
|------|------|
| FR / NFR の網羅 | OK |
| dependency gate の網羅 | OK（G-1..G-8） |
| rollback 実効性 | OK（pre-snapshot 再 PUT で原状復帰可能） |
| 残課題 | 実行時の `gh auth` スコープ / payload 配信方式の最終決定（Phase 8） |

→ **GO**（Phase 4 へ進行可）

## 5. 引き継ぎ（Phase 4 へ）

| 項目 | 内容 |
|------|------|
| 検証必須項目 | G-1..G-8 を Phase 4 のテスト前提として組み込む |
| jq クエリ伝搬 | Phase 2 §3 の Q-3c-A..H を Phase 4 のテスト本体で利用 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl-3c
- phase: 3
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3c の設計を dependency gate / rollback / リスク観点でレビューし、Phase 4 への着手可否を判定する。

## 実行タスク

- 8 件の dependency gate を確認手順付きで明示する。
- rollback シナリオを 3 件レビューする。
- リスク棚卸しを 6 件以上行い、緩和策を Phase 4 / Phase 9 / Phase 12 に伝搬する。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-3.md

## 実行手順

1. Phase 1 / Phase 2 を読み合わせる。
2. dependency gate を定義する。
3. rollback 手順を整理する。
4. GO/NO-GO 判定を下す。

## 統合テスト連携

- NON_VISUAL phase は read-only `gh api` 確認で代替する。

## 成果物

- 本 phase markdown
- dependency gate 表 / リスク表

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: NON_VISUAL のため evidence file 完備で代替する。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
