# Phase 3: 設計レビュー — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: Phase 2 で設計した「実 staging 環境への副作用を伴う runtime acquisition 計画」について、不変条件 / G1-G4 独立承認制 / リスク / canonical root 整合差分を検証して GO/NO-GO を決める。設計対象が docs-only ではないため本 Phase も実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| phase | 3 / 13 |
| wave | 9a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation / runtime-evidence-acquisition |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1-2 の設計が (a) 不変条件 #5 / #6 / #14 と整合し、(b) G1-G4 独立承認制（合算承認禁止 / 逆順実行禁止 / 包括承認禁止 / production 拡張時追加承認必須）が運用面で正しく成立し、(c) リスクが軽減され、(d) canonical root 整合差分が「runtime 専用」スコープに限定されていることを検証して GO/NO-GO を判定する。

## 不変条件チェック

| 条件 | チェック内容 | 判定 |
| --- | --- | --- |
| **#5 public/member/admin boundary** | curl smoke で未認証 `/me` / `/admin` が 401 / 403、ロール不一致でも 403 を取得し、Playwright で role 別画面を確認する設計になっている。staging で boundary 違反が見つかった場合は `unassigned-task/` 起票で 09c blocker に渡す（本タスクで修正しない） | GO |
| **#6 apps/web は D1 直アクセス禁止** | smoke は `apps/api` 経由のみ。Playwright で web→api 経由のレスポンスを観測。D1 dump は `apps/api` Workers 経由の `bash scripts/cf.sh d1 execute` で取得し、apps/web 側に新規 D1 binding を導入しない | GO |
| **#14 Cloudflare free-tier** | deploy / D1 read / Forms sync 1 サイクル / wrangler tail 30 分相当の総量が free-tier 内。Forms quota 観測を Phase 11 で記録 | GO |
| 09a-A 固有 #1: evidence と placeholder の物理パス分離 | 実測 evidence は `outputs/phase-11/evidence/` 配下、placeholder（`NOT_EXECUTED`）は `outputs/phase-11/main.md` などの本文中にのみ存在。実 evidence 取得後に本文 `NOT_EXECUTED` を相対参照で置換する | GO |
| 09a-A 固有 #2: `NOT_EXECUTED` を PASS と扱わない | `phase-07.md` AC マトリクスで `grep -r 'NOT_EXECUTED' outputs/phase-11/` が 0 件であることを確認するゲートが存在 | GO |
| 09a-A 固有 #3: production への副作用 read-only 限定 | 本タスク Phase 2 の rollback / D1 / parity 設計で `--env production` は `migrations list` / `PRAGMA` / `SELECT` のみに限定。`apply` / mutation 系は scope out で `unassigned-task/` に切り出す | GO |
| 09a-A 固有 #4: secret / PII の evidence 混入禁止 | redaction policy（Phase 2）で対象 / 手段 / 検証コマンドが定義済 | GO |
| **本タスク固有 #5: G1-G4 独立承認制** | 包括承認禁止 / 逆順実行禁止 / production 拡張時追加承認必須が Phase 2 G1-G4 表と「独立承認の運用ルール」節で文面化、`outputs/phase-13/main.md` に gate 別 timestamp 記録フォーマットが規定されている | GO |
| **本タスク固有 #6: spec 改訂と runtime acquisition の境界** | current canonical workflow 本体（`phase-01.md`〜`phase-10.md` / `phase-12.md`）の再設計は scope out。本タスクは runtime evidence の取得・への反映・PR 作成のみに限定 | GO |

## G1-G4 独立承認制の正しさ確認

| 項目 | 確認内容 | 判定 |
| --- | --- | --- |
| 合算承認禁止 | Phase 2 G1-G4 表が gate ごとに行を分け、`outputs/phase-13/main.md` フォーマットも gate 別 timestamp 行を要求 | GO |
| 逆順実行禁止 | G4（commit/push/PR）は前段 G1-G3 evidence が揃っていないと実行不可。本タスク AC に「G1 完了 / G2 完了 / G3 完了 / G4 完了」の順序記載 | GO |
| 包括承認解釈禁止 | Phase 1 制約条件 #6・Phase 2「独立承認の運用ルール」節で「進めて」「全部 OK」発言での全 gate 一括実行が spec 違反であることを明示 | GO |
| production 拡張時追加承認必須 | Phase 2「production 拡張時は追加承認必須」段落で、read-only を超える操作が必要になった場合は scope out → `unassigned-task/` 起票で別 task 化することを明示 | GO |
| 承認証跡の記録形式 | `outputs/phase-13/main.md` に「Gate / approval received at / user 発言原文 / 対象操作の要約」の表フォーマットが Phase 2 で規定済 | GO |
| 承認単位の粒度 | G1 は API / Web で個別承認、G3 は schema sync / responses sync で個別承認を推奨することが Phase 2 の G1-G4 表に記載 | GO |

## canonical root 整合差分

| 観点 | current canonical workflow | 本タスク（runtime acquisition） | 差分の妥当性 |
| --- | --- | --- | --- |
| Phase 1-10 / 12 contract | 確定済（PR #493） | 内包（再設計しない） | 本タスクは spec 改訂タスクではないため重複定義を避ける |
| Phase 11 evidence path | `phase-02.md` で確定済 | の path に厳密準拠（`outputs/phase-11/evidence/` 配下にカテゴリ別 subdirectory: `preflight/` `d1/` `deploy/` `forms/` `playwright/` `screenshots/` `wrangler-tail/`） | Issue #494「必須証跡パス」と一致 |
| approval gate | `phase-01.md` で G1-G4 概略 | 本タスク `phase-02.md` で commands / artifact path / approval timing / rollback plan を表で精緻化 | 実行サイクル固有の運用層追加であり spec とは矛盾しない |
| redaction policy | は概念のみ | 本タスクで「対象 / 手段 / 検証コマンド」を表で確定 | 運用層の精緻化。検証コマンド（`grep -E ...`）を G4 commit 前 / 後に実行する点が新規 |
| G1-G4 timestamp 記録 | は `outputs/phase-13/main.md` に記録するとだけ規定 | 本タスクで表フォーマット（Gate / received at / 発言原文 / 操作要約）を確定 | 独立承認の文書監査性を強化 |
| spec 改訂 | は contract 完成済 | 本タスクで scope out 明示 | 本タスク内で spec 改訂が混入することを防止 |
| 09c blocker 更新 | は概念 | 本タスクで G4 完了条件として明示 | 09c production deploy gate との接続を明確化 |
| カテゴリ別 evidence subdirectory（`preflight/` 等） | `phase-02.md` は flat path を例示する箇所もある | 本タスクで `preflight/` `d1/` `deploy/` `forms/` `playwright/` `screenshots/` `wrangler-tail/` の subdirectory 構造を Issue #494 の必須証跡パスに合わせて固定 | Issue #494 が subdirectory を明示しているため、本タスクではそちらを正本とし `phase-11.md` 実行時に揃える |

> 上表のうち、subdirectory 構造の扱いは Issue #494 を正本とする。`phase-02.md` 例示が flat な場合でも、Issue #494 が subdirectory を明示している以上、実 evidence 配置は subdirectory 構造に従う。spec の表記揺れに対する整合作業は本タスクでは行わず（spec 改訂に該当）、必要なら `unassigned-task/` で起票する。

## リスクマトリクス

| # | リスク | likelihood | impact | mitigation |
| --- | --- | --- | --- | --- |
| R1 | secret 値（API token / OAuth refresh / D1 PII）が log / artifact / コミットに混入 | 中 | 致命 | redaction policy（対象 / 手段 / 検証コマンド）を Phase 2 で確定。G4 commit 直前に `grep` 検証を実行し 0 件確認 |
| R2 | D1 schema drift（staging vs production）が見つかった際に放置 | 中 | 高 | `d1-schema-parity.json` の `diffCount > 0` で必ず `unassigned-task/` に follow-up task を起票（CONST_007 先送り禁止） |
| R3 | 包括承認解釈で全 gate 一括実行 | 中 | 高 | Phase 1 制約条件 #6 / Phase 2 運用ルール節で禁止文面、`outputs/phase-13/main.md` の gate 別 timestamp 記録要求 |
| R4 | wrangler tail 取得不能 | 中 | 中 | 不能理由を `wrangler-tail/api-30min.log` に明記することを AC で許容（CONST_007 例外条件として扱う） |
| R5 | Forms quota 枯渇（429） | 中 | 中 | sync を 1 サイクルに限定。429 取得時は翌日リトライ TODO を `outputs/phase-11/main.md` に記録、本サイクル内で完了不能なら `unassigned-task/` 起票 |
| R6 | production D1 への mutation 誤発行 | 低 | 致命 | 全 D1 コマンドで `--env staging` を明記、`--env production` は `migrations list` / `PRAGMA` / `SELECT` のみ。`apply` / `INSERT` / `UPDATE` / `DELETE` を `--env production` で発行しないことを Phase 2 で固定 |
| R7 | screenshot / D1 dump に PII 混入 | 中 | 高 | テスト fixture アカウント（admin: `manjumoto.daishi@senpai-lab.com` / 一般: `manju.manju.03.28@gmail.com`）に限定、実会員データが映る場合は blur or 列除外 |
| R8 | placeholder（`NOT_EXECUTED`）と実測 evidence の混在で完了誤判定 | 中 | 高 | `phase-07.md` AC マトリクスで `grep -r 'NOT_EXECUTED' outputs/phase-11/` が 0 件をゲート化 |
| R9 | spec 改訂が runtime task に混入し、本サイクルが肥大化 | 中 | 中 | Phase 1 制約 / Phase 2 整合差分節 / 本 Phase 不変条件 #6 で scope out 明示、必要な spec 改訂は `unassigned-task/` 起票で分離 |
| R10 | rollback 用 旧 version id の取得漏れ | 中 | 高 | G1 直前に `bash scripts/cf.sh deployments list` で旧 version id を控え、`outputs/phase-13/main.md` に記録することを Phase 2 で必須化 |

## aiworkflow-requirements との整合確認

- 不変条件 #5 / #6 / #14: 上記不変条件チェック表で全て GO 判定済
- `sync_jobs` / `audit_log`: Phase 2 で D1 query による dump を G3 evidence に組み込み済
- `task-workflow-active`: G4 で 09a-A 行を `runtime_evidence_captured` に昇格させる更新を必須化
- `aiworkflow-requirements/indexes`: 本タスクは仕様書追加のみで indexes 再生成は不要だが、G4 PR 作成時に `pnpm indexes:rebuild` 実行可否を最終チェックする

## 設計の盲点レビュー（Phase 2 への補強指示）

| 観点 | 指摘 | 反映先 |
| --- | --- | --- |
| 旧 version id の取得タイミング | G1 直前に `cf.sh deployments list` を runbook に明記 | `phase-11.md` 実行時に該当 step を挿入する運用申し送り |
| Playwright staging config | `playwright.staging.config.ts` の存在確認、なければ scope out として `unassigned-task/` 起票 | `phase-11.md` 実行時 fallback として運用 |
| `scripts/lib/redact.sh` の有無 | 未存在の場合は inline `sed -E` で代替（Phase 2 redaction policy に明記済） | Phase 2 redaction policy で確定 |
| production D1 read scope の token 確認 | `cf.sh whoami` で `D1:Read` 相当が出ることを preflight で確認 | preflight gate（cf-whoami.log）で確認 |
| `member_responses` 旧名の table 名 drift | parity 検証で table 名 drift 検出時に既存 `task-ut-09-member-responses-table-name-drift.md` と関連付け | G2 evidence で発見した場合の関連付け運用を申し送り |
| カテゴリ別 subdirectory への配置 | Issue #494 の必須証跡パスに従い `preflight/` `d1/` `deploy/` `forms/` `playwright/` `screenshots/` `wrangler-tail/` の subdirectory を作成 | Phase 2 evidence path tree で確定済 |

## GO/NO-GO 判定

- 不変条件: 全 9 項目 GO
- G1-G4 独立承認制: 6 項目すべて GO
- リスク R1〜R10: 全て mitigation 設定済
- aiworkflow-requirements 整合: 確認済
- canonical root 整合差分: 「runtime acquisition 専用」スコープに限定されており、spec 改訂が混入していない
- 設計盲点 6 項目: Phase 2 で確定済 / 運用申し送り化済

判定: **GO**（Phase 1-13 を本 root に内包し、outputs / evidence / artifact parity も同 root で完結させる）

## 参照資料

- 本タスク `phase-01.md` / `phase-02.md` / `index.md`
- spec: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-01.md`〜`phase-13.md`
- artifacts: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/artifacts.json`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- GitHub Issue #494
- spec 確定 PR #493
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 統合テスト連携

- 上流: 08a / 08a-B / 08b 完了 evidence
- 下流: 09c production deploy execution（本 Phase の GO 判定が 09c 実行可能化の前提）

## 多角的チェック観点

- 不変条件 #5 / #6 / #14 の判定根拠が明文化されている
- G1-G4 独立承認制の運用ルール（合算 / 逆順 / 包括 / production 拡張）が Phase 1-2 の文面と一致して GO 判定可能
- 既存 current canonical workflow との差分が「runtime 専用 / 運用層 / Issue #494 整合」の 3 軸で整理されている
- リスク mitigation が「先送り」になっていない（CONST_007）
- production への mutation 経路が一切残っていない
- spec 改訂と runtime acquisition の境界が判定上検証可能
- GO 判定の根拠が不変条件・独立承認制・リスク・整合差分の 4 軸で揃っている

## サブタスク管理

- [ ] 不変条件 9 項目を判定
- [ ] G1-G4 独立承認制 6 項目を判定
- [ ] canonical root 整合差分 8 項目を比較
- [ ] リスク 10 件にすべて mitigation を割当
- [ ] aiworkflow-requirements 整合確認
- [ ] 設計盲点 6 項目を Phase 2 / 運用申し送り化
- [ ] `outputs/phase-03/main.md` を作成

## 成果物

- `outputs/phase-03/main.md`

## 完了条件

- [ ] 不変条件 / G1-G4 独立承認制 / リスク / 整合差分 のすべてに判定が記載されている
- [ ] GO/NO-GO 判定の根拠が明文化されている
- [ ] Phase 4 以降も本 root の同番号 phase を参照する
- [ ] spec 改訂混入が無いこと（scope 境界）が判定上検証可能

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 設計レビューで NO-GO 要素が残っていない
- [ ] 本 Phase で deploy / commit / push / PR を実行していない
- [ ] CONST_007: 「Phase XX で対応」「将来タスク」「別 PR」等の先送り表現が無い

## 次 Phase への引き渡し

Phase 4 以降も本 root の同番号 phase を参照する。本タスク側で必要な引き渡しは以下:

- evidence path 一覧（15 件 / Issue #494 必須証跡パスに準拠）と subdirectory 構造
- approval gate 4 件（G1: deploy / G2: D1 migration apply / G3: Forms sync / G4: commit/push/PR/blocker 更新）
- redaction policy（対象 / 手段 / 検証コマンド）と G4 commit 前 grep 検証手順
- 09c blocker 更新先（unassigned-task/ 配下の 09c task spec）
- `task-workflow-active.md` 09a-A 行の昇格目標値（`runtime_evidence_captured`）
- リスク mitigation のうち実行時に再確認が必要な項目（R1 redact / R5 Forms quota / R7 PII / R8 NOT_EXECUTED grep ゲート / R10 rollback version id）

## 実行タスク

- [ ] phase-03 の各セクションに記載した手順・検証・成果物作成を実行する
