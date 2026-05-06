# Phase 1: 要件定義 — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: 本タスクは Cloudflare staging 環境への deploy command 実行（`bash scripts/cf.sh deploy --env staging`）、UI/API smoke、Forms sync 実行（Forms quota 消費を伴う）、`wrangler tail` 取得、D1 migration apply、生成 evidence のリポジトリへの commit / push / PR を伴う。CONST_004 に従い「実環境への副作用 + repo へのコミット成果物が発生する」ため docs-only ではなく実装仕様書として扱う。

> 本タスクは「実行サイクル（runtime evidence acquisition）」専用であり、09a-A spec 本体（contract）の改訂タスクではない。spec 改訂が必要になった場合は本タスクで実施せず、`unassigned-task/` に切り出す。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| task_id | UT-09A-A-EXEC-STAGING-SMOKE-001 |
| issue | #494 |
| spec | docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/ |
| spec PR | #493 |
| phase | 1 / 13 |
| wave | 9a-fu |
| mode | sequential（G1→G2→G3→G4） |
| 作成日 | 2026-05-06 |
| taskType | implementation / runtime-evidence-acquisition |
| visualEvidence | VISUAL_ON_EXECUTION |
| 想定実行者 | 人間オペレーター + Claude Code（user approval gate 併用） |
| priority | HIGH |

## 目的

09a-A spec の Phase 11 evidence root に**実 staging runtime evidence** を保存し、Phase 12 status を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `runtime_evidence_captured` 相当へ昇格させる。

ビジネス価値: 09c production deploy の前提（公開 / 会員 / 管理境界の実機検証 / Forms sync 健全性 / D1 migration 整合性）を文書ではなく実測 evidence で担保する。本番直前 / 直後にしか露呈しないインシデント（authz boundary 漏れ / Forms quota 枯渇 / D1 schema drift / Workers binding 不整合）を staging で先取りする。

## 入力

| 種別 | 値 |
| --- | --- |
| spec | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/`（Phase 1-10 / 12 contract 完了済） |
| phase-11 contract | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-11.md` |
| phase-12 implementation guide | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/implementation-guide.md` |
| Cloudflare staging secrets | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` ほか（1Password vault → `.env` op:// 参照経由のみ。値は記録しない） |
| staging targets | `ubm-hyogo-api-staging` / `ubm-hyogo-web-staging` / D1: `ubm-hyogo-db-staging` (id `990e5d6c-51eb-4826-9c13-c0ae007d5f46`) |
| テストアカウント | admin: `manjumoto.daishi@senpai-lab.com` / 一般会員: `manju.manju.03.28@gmail.com`（op secret 注入） |
| 仕様正本 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`、`docs/00-getting-started-manual/specs/08-free-database.md` |
| Cloudflare auth 状態 | 解消済（2026-05-06 時点）。`bash scripts/cf.sh whoami` で Account ID 取得確認済 |

## 出力（成果物 evidence 種別）

本サイクルでは 09a-A spec の `outputs/phase-11/evidence/` 配下に runtime evidence を保存する（仕様書側で確定済の path に厳密準拠）。本ディレクトリ側の `outputs/` には phase-01〜03 設計成果と phase-13 承認証跡のみを保存する。

| # | 種別 | 保存先 |
| --- | --- | --- |
| 1 | Cloudflare auth preflight | `issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/preflight/cf-whoami.log` |
| 2 | D1 migration list (staging) | `.../evidence/d1/d1-migrations-staging.log` |
| 3 | D1 migration list (prod) | `.../evidence/d1/d1-migrations-prod.log` |
| 4 | D1 schema parity diff | `.../evidence/d1/d1-schema-parity.json` |
| 5 | API deploy log + version id | `.../evidence/deploy/deploy-api-staging.log` |
| 6 | Web deploy log + version id | `.../evidence/deploy/deploy-web-staging.log` |
| 7 | Forms schema sync log | `.../evidence/forms/forms-schema-sync.log` |
| 8 | Forms responses sync log | `.../evidence/forms/forms-responses-sync.log` |
| 9 | sync_jobs dump | `.../evidence/forms/sync-jobs-staging.json` |
| 10 | audit_log dump | `.../evidence/forms/audit-log-staging.json` |
| 11 | Playwright report / trace | `.../evidence/playwright/` |
| 12 | Visual smoke screenshots ×4 | `.../evidence/screenshots/{public-members,login,me,admin}-staging.png` |
| 13 | wrangler tail (30min relevant or 取得不能理由) | `.../evidence/wrangler-tail/api-30min.log` |
| 14 | G1-G4 承認 timestamp | `.../outputs/phase-13/main.md` |
| 15 | artifacts parity | `.../artifacts.json` ↔ `.../outputs/artifacts.json` |

更新対象ドキュメント:

- `outputs/phase-11/main.md`: `NOT_EXECUTED` を実 evidence への参照に置換
- `outputs/phase-11/manual-smoke-log.md`: 実測サマリへ更新
- `outputs/phase-11/link-checklist.md`: 実測 URL / status code 結果へ更新
- `outputs/phase-12/implementation-guide.md`: runtime status を `runtime_evidence_captured` 系に更新
- `outputs/phase-12/phase12-task-spec-compliance-check.md`: AC 実測結果を反映
- `outputs/phase-12/documentation-changelog.md`: changelog 追記
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`: 09a-A 行を `runtime_evidence_captured` に昇格
- 09c production deploy execution task spec の blocker 状態行を実測結果で更新

## 機能要件

1. **G1 (deploy)**: `bash scripts/cf.sh deploy --config apps/{api,web}/wrangler.toml --env staging` が成功し、deploy log に Workers version id が記録される。
2. **G2 (D1 migration)**: `migrations list --env staging` が `Applied` のみで `pending=0`、または pending がある場合は user 承認後に apply し、その理由 evidence が残る。production 側は read-only `list` のみ。
3. **G3 (Forms sync)**: schema sync / responses sync が staging で 1 サイクル成功し、`sync_jobs` / `audit_log` 行増分を dump として保存。
4. **D1 schema parity**: staging vs production の table list / `PRAGMA table_info` / index 比較で差分 0、または差分時に production 側 migration TODO を `unassigned-task/` に起票。
5. **Visual smoke**: 公開 `/members` / login / `/me` / `/admin` の Playwright screenshot 4 種を取得。
6. **Authz smoke**: 未認証 `/me` / `/admin` が 401 / 403、ロール不一致でも 403 を返すことを curl で検証。
7. **wrangler tail**: 30 分相当の redacted log を取得、または取得不能理由を `wrangler-tail/api-30min.log` に明記。
8. **G4 (commit/PR)**: 取得 evidence を反映した PR を作成し、09c blocker 状態を更新。

## 非機能要件

| 観点 | 要求 |
| --- | --- |
| 安全性 | secret 値（API token / OAuth refresh / D1 PII）を log / artifact / コミットに残さない。`wrangler tail` / curl レスポンス / D1 dump は redact してから保存 |
| 再現性 | 全 Cloudflare コマンドは `bash scripts/cf.sh ...` 経由で実行し、`wrangler` を直接呼ばない（CLAUDE.md ルール） |
| Free-tier 遵守 | invariants #14。Workers requests / D1 reads / Forms quota が free-tier 内に収まることを記録 |
| 監査性 | `sync_jobs` / `audit_log` の append-only 性を確認し、行 ID / created_at を evidence に残す |
| 操作の明示性 | deploy / D1 migration apply / sync 実行 / commit / push / PR は user approval gate で停止する（自走禁止） |
| 独立承認制 | G1-G4 を「合算承認」「逆順実行」として処理しない。各 gate 直前で対象操作・影響範囲・rollback 手段を提示し独立承認を取得 |

## 制約条件

1. **production deploy 禁止**（09c の専用タスク）。production への副作用は read-only `PRAGMA` / `SELECT` のみ許容。
2. **新規 UI / API 機能追加・bugfix 禁止**。staging で発覚したバグは `unassigned-task/` に切り出して 09c の blocker として扱う。
3. **`.env` への実値書き込み禁止**（op:// 参照のみ）。`wrangler login` の OAuth トークン保持禁止。
4. **apps/web から D1 への直接アクセス導入禁止**（invariants #6）。smoke 観測中に既存の boundary 違反が見つかった場合は `unassigned-task/` で起票し、本タスクでは修正しない。
5. **CONST_007**: 本タスク内で発見した課題は「Phase XX で対応」「将来タスク」「別 PR」と先送りせず、Phase 11 evidence もしくは `unassigned-task/` 起票のいずれかで必ず処理を完結させる。
6. **包括承認禁止**: 「進めて」「全部 OK」のような発言で全 gate を一気に実行することは spec 違反。各 gate 直前で個別承認を取り直す。
7. **secret 値・トークン値・実 PII を仕様書中に書かない**（op:// 参照表記まで）。

## 関係者・承認ゲート

| ゲート | 承認者 | タイミング | 対象操作 | rollback |
| --- | --- | --- | --- | --- |
| G1: staging deploy | user | `bash scripts/cf.sh deploy --config apps/{api,web}/wrangler.toml --env staging` 直前 | API/Web Worker deploy | `cf.sh rollback <PREVIOUS_VERSION_ID> --env staging` |
| G2: D1 migration apply | user | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` 直前（pending がある場合のみ） | staging D1 schema 変更 | D1 export snapshot → 再 migration TODO 起票 |
| G3: Forms sync 実行 | user | staging Forms quota 消費を伴う sync 実行直前 | Forms API 呼び出し / `sync_jobs` 行追加 | quota 復帰待機（翌日リトライ） |
| G4: commit / push / PR | user | Phase 13 PR 直前 | repo への evidence commit + 09c blocker 更新 + PR 作成 | revert commit / PR close |

各ゲートで Claude Code は実行コマンドと予測影響を提示して停止する。承認証跡（user 発言の timestamp）は `outputs/phase-13/main.md` に記録する。

## DoD（Phase 1 チェックリスト展開）

- [ ] G1-G4 各 gate のコマンド・evidence path・rollback 手段が表として確定している
- [ ] 15 evidence path が 09a-A spec の path 命名規則に一致している
- [ ] redaction policy（対象キー / 手段 / 検証コマンド）が Phase 2 への引き渡し条件として明記されている
- [ ] CONST_007 に従い、本サイクル内で完結する設計範囲のみで構成されている
- [ ] 09a-A spec 本体の改訂が scope out として明示されている

## 参照資料

- spec: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/index.md` / `phase-11.md` / `phase-13.md`
- phase-12 implementation-guide: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/implementation-guide.md`
- GitHub Issue #494
- spec 確定 PR #493
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `apps/api/wrangler.toml` / `apps/web/wrangler.toml`
- `scripts/cf.sh`
- `CLAUDE.md`（cf.sh ラッパー必須・branch 戦略・solo 運用ポリシー）
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 多角的チェック観点

- 不変条件 #5: 公開 / 会員 / 管理境界が staging 実測で破綻していないこと
- 不変条件 #6: apps/web から D1 直アクセスが入っていないこと（smoke 中に確認）
- 不変条件 #14: Cloudflare free-tier の境界に踏み込んでいないこと
- placeholder と実測 evidence を物理パスで分離する（`NOT_EXECUTED` 文字列の混在禁止 / Phase 7 で grep ゲート）
- 未実装 / 未実測を PASS と扱わない（AC マトリクスで突き合わせる）
- G1-G4 の独立承認が文書上検証可能（`outputs/phase-13/main.md` に timestamp + 個別承認文言）
- spec 改訂と runtime acquisition の境界が混入していないこと

## サブタスク管理

- [ ] spec phase-11 / phase-12 の現状 placeholder を抽出し本 Phase 1 outputs に列挙
- [ ] 15 evidence path が の `outputs/phase-11/evidence/` 配下で命名規則どおりに確保されることを確認
- [ ] G1-G4 の approval gate が Phase 2 設計 / Phase 11 runbook に貫通することを確認
- [ ] 09c blocker 更新先（task spec 行）を Phase 2 で確定する
- [ ] `outputs/phase-01/main.md` を作成

## 成果物

- `outputs/phase-01/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み
- [ ] DoD 全項目に対する取得手段（コマンド / 保存先）が Phase 1 内で確定している
- [ ] approval gate G1-G4 の場所と実行コマンドが文書化されている
- [ ] 15 evidence path の命名規則が Phase 2 設計に渡せる粒度で揃っている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本タスクが「runtime acquisition 専用」であり 09a-A spec 本体改訂を含まないことが冒頭で明示されている
- [ ] 本 Phase では deploy / commit / push / PR を実行していない
- [ ] CONST_007: 「Phase XX で対応」「将来タスク」「別 PR」等の先送り表現が無い

## 次 Phase への引き渡し

Phase 2 へ:

- 15 evidence の保存パス命名規則
- 8 件の DoD（実行手段が紐付いた状態）
- 4 件の approval gate（G1: deploy / G2: D1 migration apply / G3: Forms sync / G4: commit/push/PR）
- redaction policy 草案（対象 / 手段 / 検証）
- 09c blocker 更新先（unassigned-task/ 配下の 09c task spec）

## 実行タスク

- [ ] phase-01 の各セクションに記載した手順・検証・成果物作成を実行する

## 統合テスト連携

- 上流: 08a coverage gate / 08a-B `/members` search/filter contract / 08b Playwright E2E evidence
- 下流: 09c production deploy execution（本タスクの evidence path をそのまま参照源とする）
