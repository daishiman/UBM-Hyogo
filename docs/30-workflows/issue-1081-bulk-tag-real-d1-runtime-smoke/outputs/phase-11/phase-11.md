# Phase 11: 手動テスト（API smoke evidence・runtime ledger） — issue-1081-bulk-tag-real-d1-runtime-smoke

## 目的

`POST /admin/members/tags/bulk` を Cloudflare Workers staging + `ubm-hyogo-db-staging` real D1 で実走させ、bulk assign / 再送 no-op / unassign / audit count parity / cleanup の runtime 証跡を自動取得する基盤（runner / seed・cleanup SQL / CI job / local test）の **手動テスト計画と evidence ledger** を固定する。

本タスクは **API-only**（`artifacts.json.ui_routes` 空配列・`visualEvidence=NON_VISUAL`）のため screenshot は不要。代替証跡として API smoke evidence（local shell test / runtime smoke log / audit count query / summary.json）を `outputs/phase-11/evidence/` 配下に配置する。

## タスク種別とテスト方式

| 項目 | 値 |
| ---- | -- |
| タスク種別 | API-only（runtime smoke / CI gate。`ui_routes` 空） |
| visualEvidence | NON_VISUAL（UI 表示物の変更なし。screenshot 不要・生成禁止＝false green 防止） |
| テスト方式 | API smoke evidence（local shell test の主証跡 + staging real D1 runtime smoke log） |
| 状態語彙 | **`implemented_local_evidence_captured / staging_runtime_pending_user_gate`**（local runner/test/CI job は完了 / staging real D1 runtime evidence は user 承認後に取得） |

> **状態語彙の根拠**: runner / seed・cleanup SQL / CI job / local test は本サイクルで実装済み。local shell test と actionlint は実行済みで present。staging real D1 への実走だけは user-gated のため、AC-1〜AC-5 の runtime evidence は pending のまま維持する。`PASS` 単独表記は禁止し、local と staging の境界を分離する。

## Phase 11 evidence file inventory

| # | evidence 名 | file path | status | notes |
| - | ----------- | --------- | ------ | ----- |
| 1 | local shell test 実行ログ（runner 関数の引数 parse / production guard / redaction / contract assertion 検証） | `outputs/phase-11/evidence/runtime-tag-bulk-test.log` | **present** | `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` 実行済み。real D1 接続なし（curl / cf.sh stub）。AC-6/AC-7 の主証跡 |
| 2 | runtime smoke log（seed→assign→retry noop→unassign→audit→cleanup の orchestration ログ・redact 済み） | `outputs/phase-11/evidence/runtime-tag-bulk-smoke.log` | **pending** | user-gated staging 実走後に取得。`runtime-tag-bulk.sh staging --out-dir <dir>` の `runtime-smoke.log`。AC-1/2/3/5 の runtime 証跡 |
| 3 | audit count query 結果（assign retry 前後の `admin.member.tag_assigned` count 不変 / `admin.member.tag_unassigned` count 増分） | `outputs/phase-11/evidence/runtime-tag-bulk-audit-count.log` | **pending** | user-gated staging 実走後に取得。`cf.sh d1 execute ... SELECT count(*) ... WHERE target_id LIKE 'e2e_test_issue1081_%'` の出力。AC-2/AC-3 の冪等性・parity 証跡 |
| 4 | smoke summary（status / checks[] の構造化サマリ・redact 済み） | `outputs/phase-11/evidence/summary.json` | **pending** | user-gated staging 実走後に取得。`runtime-tag-bulk.sh staging --ci-summary` の `summary.json`。AC-5 の監査可能性証跡 |
| 5 | cleanup 残件 0 検証ログ（`member_tags` / `member_status` / `member_identities` / `member_responses` / `tag_definitions` / `audit_log` の `e2e_test_issue1081_%` 残件 count = 0） | `outputs/phase-11/evidence/runtime-tag-bulk-cleanup.log` | **pending** | user-gated staging 実走後に取得。cleanup SQL 適用後の残件 count assert 出力。AC-4 の scope 限定・残骸 0 証跡 |
| 6 | actionlint 検証ログ（`runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke` job 構文検証） | `outputs/phase-11/evidence/runtime-tag-bulk-actionlint.log` | **present** | `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml` 実行済み（出力なし = violation 0）。CI job 構文の主証跡 |

> evidence ディレクトリ `outputs/phase-11/evidence/` は本サイクルで作成済。local evidence #1/#6 は tracked file として配置済み。runtime evidence #2〜#5 は staging 実走後に追加する。

## AC ごとの検証設計（どの evidence でどう検証するか / 現状 pending 理由）

| AC | 内容 | 検証 evidence | 検証方法 | 現状 status / pending 理由 |
| -- | ---- | ------------- | -------- | -------------------------- |
| AC-1 | bulk **assign** が `200` + 全 `results[].status === "assigned"`（assigned 件数 == memberIds×tagIds = 4） | #2 runtime smoke log（local stub では #1 test log） | runner が `assert_status "assign" ... "assigned" 4` を実行し response を jq 集計して assert。local test では assign stub で同関数を PASS 確認 | **local present / staging pending**: local stub 検証は present。staging real D1 実走は Gate-B |
| AC-2 | 同一 payload の**再送（assign）**が `200` + 全 `results[].status === "noop"`、かつ `admin.member.tag_assigned` の audit count 不変（冪等性） | #2 runtime smoke log + #3 audit count query | retry 前後で `audit_count admin.member.tag_assigned` を 2 回取得し差分 0 を assert。`assert_status "assign-retry" ... "noop" 4` で noop 集計 | **pending**: 同上。audit count drift detection は local test の audit-count drift stub でも検証 |
| AC-3 | bulk **unassign** が `200` + 全 `results[].status === "unassigned"`、かつ `admin.member.tag_unassigned` audit が増分（action parity 保持） | #2 runtime smoke log + #3 audit count query | `assert_status "unassign" ... "unassigned" 4` + `unassigned_after > unassigned_before` を assert | **pending**: 同上 |
| AC-4 | smoke 前後の cleanup が `e2e_test_issue1081_%` データだけに限定され、cleanup 後の残件 count = 0（他データを巻き込まない） | #5 cleanup 残件 0 検証ログ（local stub では #1 test log） | cleanup SQL（全 WHERE が `LIKE 'e2e_test_issue1081_%'`）適用後、6 テーブルの該当 prefix 残件 count を各々取得し全て 0 を assert。trap で smoke 失敗時も必ず実行 | **local present / staging pending**: cleanup SQL / runner trap は実装済み。staging real D1 実走は Gate-B |
| AC-5 | command log に endpoint URL / request body の redaction / response summary / audit count query が残る（監査可能） | #2 runtime smoke log + #4 summary.json（local stub では #1 test log） | `runtime-smoke.log` / `summary.json` に endpoint path（query/secret 無し）・redact 済み body・status summary・audit query が記録されること。redaction grep gate を通過 | **local present / staging pending**: redaction ログ・summary 生成は local stub で検証済み。staging real D1 実走は Gate-B |
| AC-6 | production 誤実行 guard：`--env staging` 固定。production URL / production env 値検出時 `exit 2` | #1 local shell test 実行ログ | local test で production marker（`STAGING_API_BASE=https://...-production...` / D1 名不一致 / allow-regex 不一致）を渡すと `exit 2` を assert | **present**: `runtime-tag-bulk.test.sh` で real D1 接続なしに検証済み |
| AC-7 | local test（引数 parse / production guard / redaction / contract assertion 関数）が PASS（real D1 接続なし） | #1 local shell test 実行ログ | `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` を実行し全ケース PASS。curl / cf.sh は PATH stub で差し替え | **present**: runner / test 実装済み。`outputs/phase-11/evidence/runtime-tag-bulk-test.log` に GREEN 証跡を配置 |

> AC-6 / AC-7 は real D1 接続なしで検証済み（local stub）で、evidence #1 を `present` へ昇格済み。AC-1〜AC-5 は local stub で runner contract を検証済みだが、staging real D1 への実走（user-gated）が必須のため、Gate-B 承認後に evidence #2〜#5 を `present` へ昇格する。

## runtime evidence 取得手順（runbook 概要・G1〜G4）

> 詳細な実行コマンドと redaction 注意・production guard は `manual-test-result.md` を正本とする。本節は gate 単位の概要のみ示す。実行は **全て user 明示承認後**（Gate-B）。

| Gate | 内容 | 取得 evidence | 承認境界 |
| ---- | ---- | ------------- | -------- |
| G0（local・本 cycle で完了） | `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` GREEN / `actionlint` GREEN / `pnpm typecheck` / `pnpm lint` | #1 test log / #6 actionlint log | 完了（real D1 接続なし。AC-6/AC-7） |
| G1: deploy | `dev` push → 既存 web/api CD で staging deploy。`bulk-tag-runtime-smoke` job が deploy 後に発火可能な状態にする | （deploy log） | **user-gated** |
| G2: seed | `cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote --file bulk-tag-staging-seed.sql` で synthetic 前提投入 | （seed 適用ログ・#2 smoke log の seed section） | **user-gated** |
| G3: bulk smoke | `runtime-tag-bulk.sh staging --out-dir <dir> --ci-summary` で assign→retry noop→unassign→audit count を実走 | #2 smoke log / #3 audit count / #4 summary.json | **user-gated** |
| G4: cleanup | runner trap + `bulk-tag-staging-cleanup.sql` で `e2e_test_issue1081_%` を削除、残件 0 を検証 | #5 cleanup 残件 0 log | **user-gated**（smoke 失敗時も always 実行） |
| G5: commit/PR | evidence を `outputs/phase-11/evidence/` に tracked 配置 → commit → push → PR（Phase 13） | （全 evidence の昇格 + PR URL） | **user-gated**（Gate-C / Phase 13） |

## 3層評価

| 層 | 適用 | 内容 |
| -- | ---- | ---- |
| Semantic | ✅ | runner の contract assertion（`results[].status` 集計）と reason 分類（status-mismatch / audit-count-drift / audit-parity-missing / seed-failed）が意味的に正しい |
| Visual | N/A | UI 変更なし（NON_VISUAL）。screenshot 不要 |
| AI UX | ✅ | gate 失敗時の `summary.json` / artifact / Slack summary が運用者に十分な復旧情報（どの AC が・どの reason で fail したか）を与えるか |

## Phase 11 で発見した HIGH 問題のフィードバックループ

現時点で HIGH 問題なし（local 実装・stub 検証済み）。staging 実走 wave で発見された scope 外問題は `outputs/phase-12/unassigned-task-detection.md` 経由で `docs/30-workflows/unassigned-task/` へ formalize する。

## 完了判定

- [x] API-only（`ui_routes` 空 / NON_VISUAL）と判定し screenshot 不要を宣言（生成禁止）
- [x] Phase 11 evidence file inventory（6 行）を `evidence 名 / file path / status / notes` で固定し、local evidence present / staging evidence pending と明記
- [x] AC-1〜AC-7 ごとに検証 evidence・検証方法・pending 理由を記録
- [x] runtime evidence 取得手順を G0〜G5 runbook 概要として明記（詳細は `manual-test-result.md`）
- [x] 状態語彙 `implemented_local_evidence_captured / staging_runtime_pending_user_gate` を採用し `PASS` 単独表記を回避
- [x] evidence 取得後に `pending → present` へ昇格する旨を宣言
