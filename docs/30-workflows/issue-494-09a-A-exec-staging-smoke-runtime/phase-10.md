# Phase 10: 最終レビュー — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: 本 Phase は実 staging 環境で取得した 13 evidence・G1〜G4 独立承認証跡・09c blocker 更新差分が、不変条件・secret 漏洩・production 副作用なし・approval 順序遵守・parity 観点で完備しているかを最終判定する。実 staging 副作用結果に対するレビューであり commit/push を伴うため CONST_004 区分で実装仕様書扱い。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| phase | 10 / 13 |
| wave | 9a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #494 |

## 目的

Phase 9 の品質ゲートを通過した evidence 一式 + ドキュメント更新差分を、reviewer checklist（独立承認証跡 / G1-G4 順序遵守 / production 拡張なし / 09c blocker 更新整合）の観点で self-review し、Phase 11 evidence 取得結果の最終合否と Phase 13 PR 作成可否を判定する。

> **reviewer scope**: solo dev のため必須レビュアー数 0（CLAUDE.md「solo 運用ポリシー」）。本 Phase は **self-review チェックリスト**として機能する。GitHub branch protection の `required_pull_request_reviews=null` を前提とし、reviewer 観点を Claude Code 自身が機械的に判定する。

## reviewer self-review チェックリスト

### A. 独立承認証跡

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| A1 | G1 deploy 承認 timestamp 記録 | `outputs/phase-13/main.md` の G1 行 | user 発言 timestamp + 承認テキスト転写あり |
| A2 | G2 D1 migration 承認 timestamp 記録 | 同 G2 行 | 同上 |
| A3 | G3 Forms sync 承認 timestamp 記録 | 同 G3 行 | 同上 |
| A4 | G4 commit/push/PR 承認 timestamp 記録 | 同 G4 行 | 同上 |
| A5 | 包括承認解釈の不在 | 4 件の timestamp が **異なる** 時刻になっている（同一秒で並列承認になっていない） | 4 件の timestamp が strictly increasing |
| A6 | 各 gate の対象操作 / 影響範囲 / rollback 手段の事前提示 | `outputs/phase-13/main.md` 各 gate 直前の提示テキスト | G1〜G4 各 gate に提示記録あり |

### B. G1-G4 順序遵守

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| B1 | G1 → G2 → G3 → G4 の順序 | A1〜A4 timestamp の昇順 | strictly increasing |
| B2 | 逆順実行不在 | git log の commit 時刻と承認 timestamp の整合 | G4 commit が G3 evidence 取得後 |
| B3 | 各 gate 完了後に次 gate を開始 | evidence ファイル mtime と承認 timestamp の整合 | 各 evidence mtime が対応 gate 承認後 |

### C. production 拡張なし

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| C1 | production への mutation 系コマンド不在 | コマンド履歴 / evidence log の grep（`--env production` の使用が `migrations list` / `PRAGMA` / `SELECT` のみ） | mutation（`apply` / `INSERT` / `UPDATE` / `DELETE` / `import` / `deploy` / `tail`）の `--env production` 0 件 |
| C2 | production deploy / D1 apply / Forms sync を実行していない | evidence root に `deploy-*-prod.log` / `migrations-apply-prod.log` / `forms-*-prod.*` が **存在しない** | 0 件 |
| C3 | production 拡張時の追加承認要否確認 | 本タスク scope 内で production 拡張を行っていない宣言 | 宣言記録あり |

### D. 09c blocker 更新整合

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| D1 | `task-09c-production-deploy-execution-001.md` 更新差分 | git diff `completed-tasks/task-09c-production-deploy-execution-001.md` | 「09a-A 実測完了済 / 残課題: ...」セクション追加 |
| D2 | 残課題リストの 09a-A evidence 参照 | D1 セクション内 | evidence path / hash / 取得 timestamp を引用 |
| D3 | parity follow-up 起票（必要時） | `unassigned-task/` 配下の追加 file | Q9 / Q10 で follow-up 必要時のみ存在 |
| D4 | Phase 9 の Q16 と同期 | `outputs/phase-09/main.md` の Q16 判定 | PASS |

### E. evidence 完備（Phase 9 結果との整合）

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| E1 | 13 evidence path 全埋め | Phase 9 Q3 結果 | PASS |
| E2 | placeholder `NOT_EXECUTED` 0 hit | Phase 9 Q4 結果 | PASS |
| E3 | secret / PII redaction 0 hit | Phase 9 Q5 / Q6 結果 | PASS |
| E4 | reproducibility（コマンド全文記録） | Phase 9 Q7 結果 | PASS |
| E5 | artifacts.json parity | Phase 9 Q8 結果 | PASS |
| E6 | screenshot 4 枚 | Phase 9 Q14 結果 | PASS |
| E7 | wrangler tail 取得 OR 取得不能理由 | Phase 9 Q13 結果 | PASS / SOFT-PASS |

### F. 不変条件遵守

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| F1 | 不変条件 #5（apps/web → D1 直アクセス禁止） | smoke 中の Workers ログで web→api 経由のみ観測 | 直接 D1 binding 利用 0 件 |
| F2 | 不変条件 #6（GAS prototype を本番昇格させない） | 本タスクで GAS prototype 参照 0 件 | 0 件 |
| F3 | 不変条件 #14（Cloudflare free-tier） | `qa-free-tier.md` の Workers req / D1 read / Forms quota | 上限 80% 未満。超過時は 09c blocker に追記済 |
| F4 | solo-dev branch protection | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` で `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` | drift 0 |

### G. governance / naming

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| G1 | branch / PR タイトル命名規約 | branch 名が `feat/` / `fix/` / `refactor/` / `docs/` のいずれかで始まる、PR タイトル < 70 字 | 規約一致 |
| G2 | CODEOWNERS governance path | `.github/CODEOWNERS` の `docs/30-workflows/**` owner 表記が維持されている | 維持 |
| G3 | sync-merge hook 動作 | merge commit 時に staged-task-dir-guard / coverage-guard が自動 skip | CLAUDE.md「sync-merge」セクション挙動と整合 |

## レビュー実施手順

### Step 1: self-review（1 周目）

1. `outputs/phase-11/evidence/` を一覧し、Phase 9 の判定結果（Q1〜Q16）を再確認する。
2. 上表 A1〜G3 を順に判定。各観点で PASS / FAIL / N/A のいずれかに分類。
3. PASS の根拠は evidence ファイル名 + 行番号 / hash / git diff 範囲で示す。
4. FAIL は blocker として一覧化する。

### Step 2: blocker 仕分け

| blocker 種別 | 分岐先 |
| --- | --- |
| evidence 不足 / placeholder 残存 | 該当 G ゲート（G1〜G3）に戻して再取得 |
| redaction 漏れ | Phase 9 Q5 / Q6 に戻して再 redact + 上書き保存 |
| 本タスク scope 外（schema drift / boundary 違反） | `unassigned-task/` 起票で 09c blocker に移譲 |
| approval 未取得 / 順序違反 | G1〜G4 の該当ゲートで再承認取得（順序違反は再実行不可のため follow-up 起票で記録） |
| 09c blocker 更新漏れ | 本 Phase 内で `task-09c-production-deploy-execution-001.md` を更新 |

CONST_007: 「Phase 11 で対応」「Phase 12 で記録」型の先送り禁止。本 Phase で blocker をいずれかの分岐先に必ず割り当てる。

### Step 3: GO / NO-GO 判定

- A1〜A6 / B1〜B3 / C1〜C3 / D1〜D4 / E1〜E6 / F1〜F2 / F4 / G1〜G2 すべて PASS → **GO**
- soft 観点（E7 wrangler tail / F3 free-tier / G3 hook 動作）の FAIL は理由記録のうえ続行可
- 1 つでも hard FAIL → **NO-GO**（Step 2 で分岐先を確定し、本 Phase を再実施）

### Step 4: レビュー記録の保存

| ファイル | 内容 |
| --- | --- |
| `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-10/main.md` | reviewer checklist A〜G の判定結果、blocker 一覧、GO/NO-GO 判定、Phase 13 PR 作成可否 |
| `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-13/main.md`（user timestamp 列） | G1〜G4 の独立承認証跡（user 発言 timestamp + 承認テキスト転写）。本 Phase が approval evidence の最終保存先 |
| `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/qa-final-review.log` | A1〜G3 の判定結果（grep 可能なフラットテキスト） |
| `docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md` | 09c blocker 更新（D1 / D2 と同期） |

> **approval evidence の保存先正本**: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-13/main.md` の user timestamp 列。本タスク内に複製を作らない（DRY）。

## 多角的チェック観点

- 独立承認証跡が A1〜A6 で機械検証されている（包括承認の不在を A5 で timestamp の strictly increasing で確認）
- G1-G4 順序遵守が B1〜B3 で timestamp / mtime / git log の整合により担保
- production 拡張なしが C1〜C3 で grep + evidence file 不在で確認
- 09c blocker 更新整合が D1〜D4 で git diff + Phase 9 Q16 と二重確認
- evidence 完備が E1〜E7 で Phase 9 結果と直接整合
- 不変条件 #5 / #6 / #14 が F1 / F2 / F3 で確認
- branch protection drift 0 が F4 で確認
- governance（CODEOWNERS / sync-merge hook）が G2 / G3 で確認
- CONST_007: blocker は必ず本 Phase 内で分岐先確定（先送り禁止）

## サブタスク管理

- [ ] A1〜G3 を順に判定
- [ ] blocker を「該当 G ゲート再実行 / Phase 9 戻し / unassigned-task 起票 / 09c blocker 更新」のいずれかに分岐
- [ ] GO / NO-GO 判定を確定
- [ ] `outputs/phase-10/main.md` を作成
- [ ] `qa-final-review.log` を spec タスク側 evidence root に生成
- [ ] G1〜G4 timestamp が `outputs/phase-13/main.md` に記録されていることを確認

## 成果物

- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-10/main.md`
- spec タスク側 `outputs/phase-11/evidence/qa-final-review.log`（副次）

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- reviewer checklist A1〜G3 すべてに PASS / FAIL / N/A の判定が付いている
- すべての FAIL に分岐先（該当 G ゲート / Phase 9 / unassigned-task / 09c blocker 更新）が割当済
- GO / NO-GO 判定が記録されている
- Phase 13 PR 作成可否が明記されている
- approval evidence が `outputs/phase-13/main.md` の user timestamp 列に記録されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR を実行していない
- [ ] CONST_007 違反（「Phase XX で対応」型の先送り）が無い
- [ ] solo-dev branch protection 不変条件（F4）を侵していない
- [ ] secret / PII の plaintext を本仕様書に書いていない

## 次 Phase への引き渡し

Phase 11 へ:

- GO 判定された evidence 一式とその hash 記録
- NO-GO の場合の分岐指示（戻し先 G ゲート / Phase 9 / 起票する unassigned-task）
- Phase 13 PR 作成可否
- 09c へ移譲する残課題（`task-09c-production-deploy-execution-001.md` 更新差分）
- approval evidence の保存先（`outputs/phase-13/main.md` の user timestamp 列）

## 参照資料

- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-10.md`（spec 正本 reviewer 観点）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-13.md`（approval evidence 保存先）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-08.md` / `phase-09.md`
- `docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md`
- `CLAUDE.md`（solo 運用ポリシー / branch protection / sync-merge）
- `.github/CODEOWNERS`
- GitHub Issue #494「G1-G4 multi-stage approval gate 制約」セクション

## 実行タスク

- [ ] phase-10 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 統合テスト連携

Phase 10 は実行直前レビューであり、統合テスト本体は実行しない。Phase 11 の統合 smoke が参照する `phase-07.md` AC matrix、`phase-09.md` quality gate、`outputs/phase-11/main.md` evidence table が一致していることを確認する。
