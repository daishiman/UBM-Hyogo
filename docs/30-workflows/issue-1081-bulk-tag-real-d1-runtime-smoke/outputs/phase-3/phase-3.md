# Phase 3: 設計レビュー — issue-1081-bulk-tag-real-d1-runtime-smoke

## 目的

Phase 4（テスト作成）へ進めるかを判定する。設計の矛盾・依存・責務境界・正本整合・リスクを検証する。

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| ---- | ---- | ---- |
| 責務境界 | PASS | CI orchestration（job）/ smoke orchestration（runner）/ fixture 投入（seed SQL）/ fixture 削除（cleanup SQL）/ token mint（既存 mts）が分離 |
| 依存関係 | PASS | runner は landed endpoint（`POST /admin/members/tags/bulk`）と `cf.sh` のみに依存。新 endpoint / schema 変更なし |
| 状態所有権 | PASS | fixture 行は seed/cleanup SQL、smoke 結果は runner、job 成否は CI job に閉じる |
| 既存 API surface 不変 | PASS | 既存 endpoint のみ叩く。endpoint 実装は不変（I-5） |
| env 不変条件 | PASS | wrangler 直叩きなし（cf.sh 経由 I-3）。bearer 値は GITHUB_OUTPUT / add-mask / redact のみ（I-2） |
| 再利用優先 | PASS | runtime-attendance-provider.sh / redact.sh / cf.sh / seed-issue-399.sh / runtime-smoke-staging.yml を雛形化 |
| D1 直接アクセス | PASS | apps/web から D1 を叩かない。seed/cleanup/count は cf.sh（apps/api binding 経由ではないが運用 CLI でありコード層の D1 直接アクセス禁止に抵触しない。mutation 自体は HTTP endpoint = apps/api 経由）（I-1） |

## リスク表と対策

| ID | リスク | 深刻度 | 対策 |
| -- | ------ | ------ | ---- |
| R1 | **production 誤実行**（runner / seed / cleanup が production D1 に当たる） | 高 | 多層 guard: (1) runner `assert_not_production(env)` = staging 以外 exit 2 / (2) `assert_not_production_url` = URL に production marker 検出で exit 2 / (3) `CLOUDFLARE_ENV=staging` 必須 / (4) cf.sh `--env staging` 固定。AC-6 + local test TC で回帰 guard |
| R2 | **残データ**（smoke 失敗時に test fixture / member_tags / audit が staging D1 に残留） | 中 | cleanup は `always()` 相当で実行する設計を Phase 5 で runner の trap に組み込む。`assert_cleanup_zero()` で 5 テーブル残件 0 を強制。CI job は cleanup 完了を最終 step で確認。手動復旧用に cleanup SQL を runbook に明記 |
| R3 | **token 漏洩**（bearer が log / artifact / summary に出る） | 高 | redact.sh を全 log 出力に適用 + CI redaction grep gate（runner / job 二重）。bearer は mint step で add-mask、GITHUB_ENV 経由のみ。request body は synthetic id のみで PII なし |
| R4 | **audit query 過剰**（count query が staging D1 を重く叩く / full scan） | 低 | query は `WHERE action=... AND target_id LIKE 'e2e_test_issue1081_%'` で限定。`idx_audit_log_target(target_type, target_id, created_at)` が存在し prefix LIKE が index prefix を活かす。実行は smoke 1 回あたり assign 後 / retry 後 / unassign 後の最大 3 回に限定 |
| R5 | **既存 GET smoke との関心混在**（mutation smoke と read-only smoke を同 job に入れると失敗切り分け困難 / GET smoke が D1 書き込み副作用に巻き込まれる） | 中 | 別 job（`bulk-tag-runtime-smoke`）として独立。既存 `smoke` job は不変。失敗時の retry / cleanup 戦略を分離 |
| R6 | **冪等性誤判定**（seed が member_tags を残したまま → 初回 assign が noop になり AC-1 が誤って fail/pass） | 中 | seed 末尾で `DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_issue1081_%'` を実行し初期状態を空に固定（state 遷移 assigned→noop→unassigned を決定論化） |
| R7 | **mint step skip 時の bearer 寿命切れ**（STAGING_AUTH_SECRET 未設定で静的 bearer が expired） | 低 | 既存 smoke と同じく mint step を STAGING_AUTH_SECRET 設定時のみ実行。未設定時は静的 STAGING_ADMIN_BEARER fallback。expired 時は HTTP 401 で runner が明示 fail（誤検知でなく実態） |

## 代替案比較（新規 standalone runner vs 既存 runner 拡張）

| 案 | 内容 | 採否 | 理由 |
| -- | ---- | ---- | ---- |
| 案 A（採用） | **新規 standalone `runtime-tag-bulk.sh`** + 別 CI job | 採用 | (1) mutation（seed/cleanup/POST）は read-only GET smoke と責務が根本的に異なる（R5）/ (2) 失敗時の cleanup・retry 戦略が独立 / (3) GET smoke の安定性に mutation 副作用を持ち込まない / (4) job 単位で artifact / 失敗通知を分離でき監査性が高い |
| 案 B | 既存 `runtime-attendance-provider.sh` を拡張し bulk tag step を追加 | 不採用 | GET 専用に最適化された `request_json`（jq contract + auth reason 分類）に mutation/seed/cleanup の異質ロジックを混ぜると単一責務を崩す。失敗時 1 job 全体が落ち read-only smoke の信頼性も巻き込む。env / guard も attendance 用 prefix と衝突 |

> 案 A でも `assert_target` / `fail_and_exit` / redact / jq contract は案 B の関数を**コピー雛形**として再利用するため、設計言語の一貫性は保たれる（新規 primitive は生やさない）。

## 正本整合

| 正本 | 整合 |
| ---- | ---- |
| endpoint contract（`apps/api/src/routes/admin/members.ts:726`） | runner は `{batchId, results:[{memberId,tagId,status}]}` と status 5 値 / audit parity（assigned→tag_assigned / unassigned→tag_unassigned）を実コードから引いて検証。乖離なし |
| CLAUDE.md 不変条件 #5（D1 直接アクセスは apps/api 経由） | mutation は HTTP endpoint 経由。seed/cleanup/count は運用 CLI（cf.sh）= apps/web からの D1 binding 直アクセスではない。抵触なし（I-1） |
| CLAUDE.md（wrangler は cf.sh 経由・I-3） | seed/cleanup/count は全て cf.sh d1 execute 経由。直叩きなし |
| CLAUDE.md（平文 secret 禁止・I-2） | redact + add-mask + redaction grep gate |
| issue-1081 最適化（@ubm-hyogo/api / results[].status / e2e_test_issue1081_ prefix） | Phase 1/2 で反映済み |

## MINOR 判定（Phase 12 追跡候補）

| ID | 内容 | 判定 |
| -- | ---- | ---- |
| M-1 | production bulk tag mutation smoke は本タスク対象外（staging 固定）。production 検証は別 Issue 候補 | MINOR。Phase 12 unassigned-task-detection で追跡候補として記録（本サイクルでは作らない） |
| M-2 | server-side idempotency store（#913）と本タスクの noop ベース冪等性証跡は別関心。store 導入時は runner の AC-2 assertion を強化する余地 | MINOR。#913 へリンクのみ。本タスクでは store を実装しない |

## 判定

**Phase 4 へ進行可**。R1（production 誤実行）/ R2（残データ）/ R3（token 漏洩）は Phase 2 設計の多層 guard で対策済み。Phase 4 では production guard / redaction / contract assert を real D1 なしで local 検証するテストを設計する。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| ---- | ---- | ---- |
| 価値性 | PASS | deploy ごとの bulk tag mutation regression を自動検出。in-memory test では捕捉できない real D1 挙動 + audit parity + 冪等性を証跡化 |
| 実現性 | PASS | 既存テンプレート（runner / cf.sh / seed-issue-399 / runtime-smoke-staging.yml）の再利用で 1 サイクルに収まる |
| 整合性 | PASS | cf.sh 経由 / redaction / env 不変条件 / endpoint contract と矛盾なし |
| 運用性 | PASS | artifact + summary.json + redaction gate + cleanup 残件 0 検証で監査可能。staging 固定 + 多層 production guard で安全 |
