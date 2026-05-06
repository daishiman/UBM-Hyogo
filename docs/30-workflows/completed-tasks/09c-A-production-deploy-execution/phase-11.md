# Phase 11: 手動 smoke / 実測 evidence — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-A-production-deploy-execution |
| phase | 11 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 状態 | spec_created（未実測 evidence は `PENDING_IMPLEMENTATION_FOLLOW_UP` で placeholder 配置） |
| 承認 | **user approval 必須**（migration apply / api deploy / web deploy / release tag push / rollback） |

## 目的

Phase 1〜10 で確定した 13 ステップの production deploy / smoke / 24h verification runbook を、実 production 上で実行する際の **evidence 取得仕様** を固定する。本仕様書作成タスク（spec_created）の責務は、実測 evidence の保存先・形式・取得タイミング・redaction ルールを宣言することまでであり、production への mutation 操作（D1 migration apply / api deploy / web deploy / release tag push）は Phase 11 user approval 取得後の別 operation として実行する。

`visualEvidence: VISUAL_ON_EXECUTION` のため、本仕様書作成時点では実測 screenshot / log は未取得。すべて `outputs/phase-11/` 配下に **placeholder ファイル** として実体配置し、判定行に `PENDING_IMPLEMENTATION_FOLLOW_UP` を明記する。実測時は同一パスへ実値で上書きし、placeholder と実測の差分を git diff で追跡可能にする。

## サマリ（outputs/phase-11/main.md の構成）

`outputs/phase-11/main.md` には以下 7 セクションを必須配置:

1. evidence manifest（カテゴリ別ファイル一覧 / VISUAL / NON_VISUAL / 24h metrics の 3 群）
2. VISUAL evidence: screenshot ファイル名 → 取得対象画面 mapping（public 4 画面 / member 3 画面 / admin 4 画面）
3. NON_VISUAL evidence: command log / version id / D1 migration list / metrics
4. 取得コマンド例（すべて `bash scripts/cf.sh` 経由 / `wrangler` 直接実行禁止）
5. redaction ルール（secret / OAuth token / session cookie / user identifier 部分マスク）
6. 24h verification 取得タイミングテーブル（T+0 / T+1h / T+6h / T+24h × 取得項目）
7. 異常時の incident runbook（09b）への ハンドオフ手順

## 必読参照

- 本タスク `outputs/phase-01/main.md` § 3 AC × evidence path mapping
- 本タスク `outputs/phase-02/main.md` § 3 evidence path 設計
- 本タスク `outputs/phase-03/main.md` § 3 GO / NO-GO 条件
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md` § production-smoke-runbook
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md` § Cloudflare deploy-verification subtemplate
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 実行タスク（サブタスク）

| # | サブタスク | 完了条件 | 種別 |
| --- | --- | --- | --- |
| T1 | `outputs/phase-11/main.md` に evidence manifest（VISUAL / NON_VISUAL / 24h metrics）を完全列挙する | 17 evidence ファイル + SQL dump placeholder + screenshot directory README が mapping 表に登場 | 仕様書作成 |
| T2 | placeholder evidence を `outputs/phase-11/` 配下へ実体配置する（後続 follow-up で上書き） | 各 placeholder の冒頭に `PENDING_IMPLEMENTATION_FOLLOW_UP` 判定行 | 仕様書作成 |
| T3 | screenshot ファイル名 → 画面 mapping 表を `outputs/phase-11/main.md` に固定する | public / member / admin × 各画面の screenshot 名が決定論的に導出可能 | 仕様書作成 |
| T4 | redaction ルール（secret / token / user identifier）を `outputs/phase-11/main.md` に明文化 | mask 対象 5 種、mask 後の表記規約が一意 | 仕様書作成 |
| T5 | 24h verification 取得タイミングテーブル（T+0 / T+1h / T+6h / T+24h）を mapping する | 各タイミングで取得する metric / SQL / screenshot が一覧化 | 仕様書作成 |
| T6 | incident hand-off 手順（09b incident runbook 経路）を記述 | エスカレーション先 / 通知経路 / runbook 参照 path が明記 | 仕様書作成 |
| T7 | execution 用 user approval template（4 mutation 単位）を `outputs/phase-11/user-approval-log.md` placeholder に配置 | apply / api deploy / web deploy / tag push の 4 セクション分 | 仕様書作成 |
| FU-1 | 【execution-time】上流 09a-A / 09b-A / 09b-B の green を引用し `upstream-green-evidence.md` を上書き | citation 3 件揃う | execution（本タスク外） |
| FU-2 | 【execution-time】13 ステップ runbook を実行し各 evidence を実値で上書き | 全 PASS / FAIL 判定が記録 | execution（本タスク外） |
| FU-3 | 【execution-time】24h 経過後に metrics screenshot と SQL 結果を取得 | T+0 / T+1h / T+6h / T+24h の 4 時点が揃う | execution（本タスク外） |

## 完了条件（spec_created 段階）

- [ ] `outputs/phase-11/main.md` が 7 セクション（manifest / VISUAL / NON_VISUAL / コマンド / redaction / 24h タイミング / incident handoff）を網羅
- [ ] placeholder ファイルの命名と配置が `outputs/phase-02/main.md` § 3 と完全一致
- [ ] 各 placeholder の冒頭に `PENDING_IMPLEMENTATION_FOLLOW_UP` または `blocked_until_user_approval` の判定行
- [ ] secret 値が evidence template に直書きされていないこと（mask 表記のみ）
- [ ] `bash scripts/cf.sh` 以外の Cloudflare CLI 直叩きコマンドが evidence template に登場しないこと
- [ ] user approval gate（migration apply / api deploy / web deploy / release tag push / rollback の 5 操作）が明示列挙されていること

## 100% 実行確認

- [ ] 必須セクションがすべて埋まっている（テンプレ表現を含まない具体内容）
- [ ] 完了済み本体タスク（09c serial）の復活ではなく follow-up gate の仕様であること
- [ ] アプリケーションコード変更・実 deploy・実 commit / push・実 PR 作成を行っていないこと
- [ ] placeholder と実測 evidence の境界が `outputs/phase-11/main.md` 冒頭に明記されている

## 次 Phase への引き渡し

Phase 12 へ次を渡す:

- evidence manifest（実測差し替え対象一覧）
- redaction ルール（system-spec-update-summary に反映候補）
- 24h verification タイミングテーブル（spec 15 への反映候補）
- placeholder と実測の境界（compliance check で `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 判定の根拠になる）
