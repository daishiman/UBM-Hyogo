# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| GitHub Issue | #517（CLOSED 維持 / 再 OPEN しない / PR 文面は `Refs #517, Refs #497, Refs #351`） |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-05-07 |
| 前 Phase | 8（DRY 化 / 仕様間整合） |
| 次 Phase | 10（最終レビューゲート） |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **実装仕様書（CONST_004 / コード変更を伴う）** |

---

## 目的

Phase 1〜8 で確定した workflow YAML / shell script 7 関数 / Secrets 契約 / DRY 整合に対し、Phase 11 手動検証 / Phase 13 PR 作成に進む前の **品質ゲート 6 種**（shellcheck / actionlint / shfmt / unit test / redaction audit / dry-run）を機械検証可能な手順として確定する。

本 Phase は次の 5 軸を出力する:

1. 品質ゲート 6 種の合否基準とローカル実行コマンド
2. CI gate 整合（既存 `.github/workflows/ci.yml` への追加要否判断）
3. 観測性（workflow log 構造化 / failure context dump）
4. セキュリティチェックリスト（secret 露出 / redaction / 最終 grep audit）
5. DoD（Definition of Done）13 項目

---

## 軸 1: 品質ゲート 6 種

### 1-1. ゲート定義表

| # | ゲート | 対象ファイル | 判定コマンド | PASS 条件 |
| --- | --- | --- | --- | --- |
| QG-1 | shellcheck | `scripts/post-release-dashboard/30day-summary.sh` / `lib/aggregate.sh` / `__tests__/30day-summary.test.sh` | `shellcheck scripts/post-release-dashboard/30day-summary.sh scripts/post-release-dashboard/lib/aggregate.sh scripts/post-release-dashboard/__tests__/30day-summary.test.sh` | warnings 0 件 / `set -euo pipefail` 適用済 |
| QG-2 | actionlint | `.github/workflows/post-release-30day-auto-summary.yml` | `actionlint .github/workflows/post-release-30day-auto-summary.yml` | エラー 0 件 |
| QG-3 | shfmt | 上記 shell スクリプト 3 件 | `shfmt -d -i 2 -ci scripts/post-release-dashboard/30day-summary.sh ...` | diff 0 件（フォーマット統一） |
| QG-4 | unit test | `__tests__/30day-summary.test.sh` + `__tests__/run-all.sh` | `bash scripts/post-release-dashboard/__tests__/run-all.sh` | TC-01〜TC-07 全 PASS |
| QG-5 | redaction audit | dry-run 出力 / PR body draft / Slack payload draft | `bash scripts/post-release-dashboard/30day-summary.sh --dry-run \| rg -i 'token\|bearer\|secret\|Authorization'` | hits 0 件（redaction 後出力に機微 token を含む行が混入しない） |
| QG-6 | dry-run 成功 | `30day-summary.sh --dry-run` | `bash scripts/post-release-dashboard/30day-summary.sh --dry-run; echo $?` | exit 0 / stdout に集計結果 + `[dry-run] would post` 出力 / git push / gh pr create / curl 副作用なし |

### 1-2. ローカル実行コマンド一覧（順序）

```bash
# (a) Node 影響なし確認（実装にはコード以外の typecheck 影響はないが念のため）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# (b) shell 静的解析
shellcheck scripts/post-release-dashboard/30day-summary.sh \
  scripts/post-release-dashboard/lib/aggregate.sh \
  scripts/post-release-dashboard/__tests__/30day-summary.test.sh

# (c) GHA workflow 静的解析
actionlint .github/workflows/post-release-30day-auto-summary.yml

# (d) フォーマット統一
shfmt -d -i 2 -ci \
  scripts/post-release-dashboard/30day-summary.sh \
  scripts/post-release-dashboard/lib/aggregate.sh \
  scripts/post-release-dashboard/__tests__/30day-summary.test.sh

# (e) unit test 実行
bash scripts/post-release-dashboard/__tests__/run-all.sh

# (f) dry-run 実行
bash scripts/post-release-dashboard/30day-summary.sh --dry-run

# (g) redaction audit（dry-run 出力に機微 token が混入していないか）
bash scripts/post-release-dashboard/30day-summary.sh --dry-run \
  | rg -i 'token|bearer|secret|Authorization' && echo 'FAIL' || echo 'PASS'

# (h) DRY 違反検出 grep（Phase 8 軸 1-4 から再実行）
rg -n "token|bearer|secret|Authorization" \
  scripts/post-release-dashboard/30day-summary.sh \
  scripts/post-release-dashboard/lib/aggregate.sh
rg -n "gh run list" scripts/post-release-dashboard/

# (i) Refs 表記統一確認
rg -n "Closes #517|Fixes #517" docs/30-workflows/issue-517-followup-auto-summary-foundation/
```

期待される結果:

- (a)〜(d): exit 0 / warnings 0
- (e): TC-01〜TC-07 全 PASS（Phase 4 で確定する fixture を使用）
- (f): exit 0 / stdout に集計結果
- (g): `PASS` 出力
- (h): redaction patterns は `lib/redaction-check.sh` のみ / `gh run list` は `30day-summary.sh::fetch_runs()` 1 件のみ
- (i): hits 0 件

---

## 軸 2: CI gate 整合

### 2-1. 既存 `.github/workflows/ci.yml` の現状

- issue-497 / issue-351 の Scope Extension で `pnpm post-release-dashboard:test` または `bash scripts/post-release-dashboard/__tests__/run-all.sh` 相当が CI に組込済の可能性がある。
- 本 Phase では **追加の CI step 導入は行わず、既存 CI test step が `__tests__/run-all.sh` を呼出している場合は、本タスクで `run-all.sh` に追加する `30day-summary.test.sh` が自動的に CI で実行される**ことを期待。

### 2-2. CI gate 追加要否判断

| 既存 CI 状態 | 本タスクでの追加実装 |
| --- | --- |
| `ci.yml` が `__tests__/run-all.sh` を呼出 | **追加実装不要**（run-all.sh への 1 行追加のみで CI に乗る） |
| `ci.yml` が `__tests__/run-all.sh` を呼出していない | Phase 12 ドキュメントに「CI gate 追加検討」を unassigned task として起票（本タスクスコープ外） |

### 2-3. 確認手順（Phase 11 で実施）

```bash
rg -n "post-release-dashboard.*run-all|run-all\\.sh" .github/workflows/
```

hits があれば既存 CI に乗る前提で OK。0 件なら Phase 12 で unassigned task として記録。

---

## 軸 3: 観測性（workflow log 構造化）

### 3-1. log 構造化方針

- `30day-summary.sh` の各主要 step に `echo "::group::<step name>"` / `echo "::endgroup::"` を挿入し、GHA log の折畳み単位を明確化する。
- silent skip 経路（gate 不成立 / 重複 PR）も skip 理由を `echo` で残す（NFR-2）。
- failure 時は最低限の context dump を stderr に出力する:

```bash
trap 'echo "::error::30day-summary failed at line $LINENO (exit=$?)" >&2' ERR
```

### 3-2. log 出力例

```text
::group::fetch_runs
fetched 80 runs (schedule=42, workflow_dispatch=3, push=35)
::endgroup::
::group::aggregate_runs
conclusion_dist={success:38, failure:4}, failure_rate=0.095, longest_failure_streak=1
::endgroup::
::group::gate_check
oldest_schedule_created_at=2026-04-07T00:03:21Z, threshold=2026-04-07T01:00:00Z
gate satisfied
::endgroup::
::group::idempotency_check
no existing PR for 202605
::endgroup::
::group::pr_create
draft PR created: https://github.com/daishiman/UBM-Hyogo/pull/542
::endgroup::
::group::slack_post
posted to Slack (5 lines)
::endgroup::
```

### 3-3. failure 時 context dump 項目

- 失敗した step 名 / 行番号 / exit code
- `gh --version` / `jq --version` / `date --version`（環境差異検出）
- runs.json のサイズ / summary.json の有無
- DRY_RUN env の値

---

## 軸 4: セキュリティチェックリスト

| # | 項目 | 確認方法 | 期待 |
| --- | --- | --- | --- |
| SC-1 | `SLACK_WEBHOOK_URL` が GitHub Secrets 経由のみ流入 | YAML 目視 (`env.SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}`) | `secrets.` 以外からの流入 0 件 |
| SC-2 | script 内で `echo "$SLACK_WEBHOOK_URL"` / `set -x` 配下での参照禁止 | `rg -n 'SLACK_WEBHOOK_URL' scripts/post-release-dashboard/30day-summary.sh` | post_slack 内 curl の data binary 引数 1 箇所のみ |
| SC-3 | redaction patterns (`token` / `bearer` / `secret` / `Authorization`) を含む行が PR body / Slack payload に混入しない | `rg -i 'token\|bearer\|secret\|Authorization'` を dry-run 出力に適用 | hits 0 件 |
| SC-4 | PR body / Slack payload 投稿前の最終 grep audit | `30day-summary.sh::render_pr_body()` / `render_slack_payload()` 内で redact_log を最終通過 | redact_log 通過後のテキストのみが POST される |
| SC-5 | log / dry-run stdout / commit / README に webhook URL 実値が含まれない | `rg -n 'hooks\\.slack\\.com'` を repo 全体に適用 | hits 0 件 |
| SC-6 | permissions が least-privilege（`contents: write` / `pull-requests: write` / `actions: read`） | YAML 目視 | 上記 3 つのみ。`secrets: read` / `id-token: write` 等の追加なし |
| SC-7 | `.env` / 1Password 経由でローカル実値を保持しない | dry-run 仕様（軸 1 QG-6） | dry-run は `SLACK_WEBHOOK_URL` 未設定でも成功 |
| SC-8 | `wrangler` / Cloudflare 系 CLI を利用していない | `rg -n 'wrangler\|cf\\.sh' .github/workflows/post-release-30day-auto-summary.yml` | hits 0 件（本タスクは Cloudflare 非対象） |

---

## 軸 5: DoD（Definition of Done）

Phase 13 PR 作成に進むためには、次のすべてが満たされている必要がある:

- [ ] DoD-1: `scripts/post-release-dashboard/30day-summary.sh` が新規作成済
- [ ] DoD-2: `scripts/post-release-dashboard/lib/aggregate.sh` が新規作成済
- [ ] DoD-3: `.github/workflows/post-release-30day-auto-summary.yml` が新規作成済
- [ ] DoD-4: `__tests__/30day-summary.test.sh` + `__tests__/fixtures/30day-summary/` が作成済
- [ ] DoD-5: `__tests__/run-all.sh` に新規 test 呼出が追加済
- [ ] DoD-6: shellcheck / shfmt / actionlint が warnings 0
- [ ] DoD-7: TC-01〜TC-07 全 PASS（Phase 4 で確定する fixture）
- [ ] DoD-8: `bash 30day-summary.sh --dry-run` が exit 0 / stdout に集計結果
- [ ] DoD-9: redaction audit grep が hits 0 件
- [ ] DoD-10: GitHub Secrets `SLACK_WEBHOOK_URL` 登録済（運用者操作 / Phase 11 確認）
- [ ] DoD-11: `scripts/post-release-dashboard/README.md` が更新済（実値 webhook URL 記載なし）
- [ ] DoD-12: `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` に `## 30day auto-summary` 章が追加済
- [ ] DoD-13: `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md` 新規作成済

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | （`index.md` 記載の不変条件すべて） | 影響なし | 本タスクは GHA workflow + bash script + Slack Webhook + skill references 追記のみで完結。フォーム / consent / D1 / GAS 非対象 |

---

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 6 ゲートと DoD 13 項目で機械検証可能な品質基準が確定。後続 Phase 11 / 13 が手戻りなく進行可能 |
| 実現性 | PASS | shellcheck / actionlint / shfmt / bash / rg のみで完結。新規ツール導入なし |
| 整合性 | PASS | 不変条件 1〜7 影響なし。Phase 8 DRY 違反検出 grep を再利用 |
| 運用性 | PASS | log 構造化 + failure context dump で運用時の障害切り分けが可能。secret チェックリスト 8 項目で露出経路を網羅 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（6 ゲート合否 / 観測性 / セキュリティ 8 項目 / DoD 13 項目） |
| ドキュメント | outputs/phase-09/qg-results.md | QG-1〜QG-6 各実行ログ（dry-run stdout / shellcheck output 等） |
| メタ | artifacts.json | Phase 9 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] 軸 1 の 6 ゲート定義表 + ローカル実行コマンド (a)〜(i) が記述済
- [ ] 軸 2 の CI gate 整合判断（追加要否 + 確認手順）が記述済
- [ ] 軸 3 の log 構造化方針（`::group::` / trap） + 出力例 + failure context 項目が記述済
- [ ] 軸 4 のセキュリティ 8 項目（SC-1〜SC-8）が記述済
- [ ] 軸 5 の DoD 13 項目が記述済
- [ ] 4 条件評価が全 PASS

---

## 変更対象ファイル / 関数シグネチャ / unit / integration / e2e tests

本 Phase は **品質基準 / DoD の文書化** に閉じる。Phase 1 / Phase 2 / Phase 4 で確定した変更対象ファイルおよび関数 7 件の契約への変更はない。テスト戦略の詳細は Phase 4（検証戦略）を参照。

---

## 次 Phase への引き渡し

- 次 Phase: 10（最終レビューゲート）
- 引き継ぎ事項:
  - 6 ゲート合否（Phase 11 で実測）
  - DoD 13 項目（Phase 13 PR 作成前に全充足必須）
  - セキュリティチェックリスト 8 項目（Phase 10 / 11 で再確認）
  - log 構造化方針（Phase 5 実装 runbook で適用）
- ブロック条件:
  - 6 ゲートのいずれかが FAIL
  - DoD 13 項目のいずれかが未充足
  - SC-1〜SC-8 のいずれかが違反

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/index.md` | AC / scope 正本 |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/phase-02.md` | 関数 7 件契約 / exit code semantics |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/phase-08.md` | DRY 違反検出 grep（再利用） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 追記先 references |
| 参照 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-09.md` | テンプレ参照 |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] CONST_004 / CONST_007 / Issue #517 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている
