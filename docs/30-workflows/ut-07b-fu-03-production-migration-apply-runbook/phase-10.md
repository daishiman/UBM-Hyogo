# Phase 10: 最終レビュー（GO / NO-GO ゲート — 実装仕様書版）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 10 |
| 状態 | spec_created |
| taskType | implementation / operations / runbook + scripts |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |
| スコープ | runbook 文書 + production migration apply orchestrator scripts (F1-F9) + bats unit tests + CI gate |

## スコープ拡張サマリ

本 Phase は当初「runbook 文書のみ」だった成果物境界を、実装仕様書スコープ（下記 F1-F9 + bats + CI gate）に拡張した上で再評価する。実装本体（コード）は Phase 11 evidence で実走する別タスク扱いで、本 Phase ではあくまで「実装仕様 + 文書」が PR 投入可能な状態にあるかを判断する。

| ID | 実装ファイル | 役割 |
| --- | --- | --- |
| F1 | `scripts/d1/preflight.sh` | `migrations list` + 対象 DB 名固定 + introspection 実行 |
| F2 | `scripts/d1/postcheck.sh` | 5 オブジェクト存在確認（read-only SQL） |
| F3 | `scripts/d1/evidence.sh` | 実行ログから Token / Account ID を redact し evidence ファイルへ追記 |
| F4 | `scripts/d1/apply-prod.sh` | F1 → confirm → apply → F2 → F3 を直列 orchestrate（`DRY_RUN=1` 対応） |
| F5 | `scripts/cf.sh`（編集） | `d1:apply-prod` サブコマンド追加（F4 への薄い委譲） |
| F6 | `.github/workflows/d1-migration-verify.yml` | PR 上で F1（list 構文）と bats を CI gate として走らせる |
| F7 | `scripts/d1/__tests__/preflight.bats` 他 | F1-F4 の bats unit tests |
| F8 | `package.json`（編集） | `test:scripts` script 追加（bats runner） |
| F9 | `outputs/phase-05/main.md` | F1-F4 を呼び出す runbook 本体（手順書） |

## 実行タスク

1. Phase 1〜9 の成果物・AC マトリクス・QA 結果を統合レビューする（実装仕様書スコープに更新済み前提）。
2. automation-30 の 3 系統思考法（システム系 / 戦略系 / 問題解決系）で最終エレガンス検証を行う。
3. blocking 事項を 3 軸（文書 / 実装仕様 / CI gate）で確認する。
4. Phase 11（bats + staging dry-run + CI gate evidence）/ Phase 12（ドキュメント更新）/ Phase 13（PR 作成）への進行判断を確定する。
5. 「production 実 apply は本タスク外」境界を再確認する。
6. 4 条件評価を実施し、完了判定を記録する。

## 目的

Phase 11 の bats / staging dry-run / CI gate evidence 取得可否を「GO 判定」として確定するためのゲート。
本 Phase 終了時点では仕様書 + 実装仕様（コード変更点）が確定した状態（`spec_created` 維持）であり、PR 作成は Phase 13 のユーザー承認後に限る。
production apply の実運用は本タスク外で、本タスク内では `DRY_RUN=1` の staging 模擬実行のみを許可する。

## 参照資料

- `index.md`
- `artifacts.json`
- `phase-01.md` 〜 `phase-09.md`
- `.claude/skills/automation-30/references/elegant-review-prompt.md`
- `.claude/skills/automation-30/references/pattern-catalog.md`
- 上流: `../completed-tasks/ut-07b-schema-alias-hardening/`
- 上流: `../u-fix-cf-acct-01-cloudflare-api-token-scope-audit/`

## 入力

- Phase 7 成果物（AC マトリクス AC-1〜AC-20）
- Phase 8 成果物（DRY 判定 — F1-F4 の責務分離 + 共通化）
- Phase 9 成果物（QA 結果 / 4 条件評価 / CONST_005 充足）

## automation-30 3 系統思考法による最終レビュー

### システム系（System Thinking）

- production D1 は単一の状態保有点であり、`migrations apply` は idempotent（D1 内部 `_cf_KV` で適用済 migration を管理）。F1（preflight.sh）の `migrations list` はこの idempotency を境界制御として確認する。
- 承認ゲート（commit / PR / merge / ユーザー明示承認 / `DRY_RUN=0` 明示）を多段に挟むことで、F4 apply-prod.sh が誤実行されない構造を確立。
- F5（cf.sh への薄い委譲）により wrangler 直叩きと d1 操作の単一窓口が強化される。
- F6 CI gate は F1 と bats を必ず PR 単位で走らせ、runbook と実装の drift を構造的に防ぐ。

### 戦略系（Strategic Thinking）

- 短期戦略（runbook + scripts + bats + CI gate）と長期戦略（実 production apply は別運用タスク）を分離する設計。本タスクは「PR merge 可能な実装仕様 + 文書品質の verified」で cut。
- UT-07B（CLOSED）と本タスクの責務は「実装期 / 運用 orchestrator 実装期 / 運用実行期」で 3 段に分離。Phase 8 で参照継承方式が確定。
- Phase 13（PR 作成）はユーザー明示承認後にのみ実行する制約を維持し、自律実行による誤デプロイを防ぐ。

### 問題解決系（Problem Solving）

- 「DB 取り違え」リスクに対し、F1 内の対象 DB 名 allow-list（`ubm-hyogo-db-prod` のみ）+ `--env production` 必須化 + preflight `migrations list` で 3 重防御。
- 「二重適用」リスクに対し、F1 の `migrations list` 未適用判定 + F2 の introspection 結果との 2 段照合。
- 「UNIQUE index 作成失敗」に対し、F4 が apply 失敗時に即興 SQL を実行せず `EXIT_FAILURE_NEED_HUMAN` で停止する分岐を実装仕様化（Phase 6）。
- 「evidence への機密混入」に対し、F3 の redaction 関数（API Token / Account ID / 40+ 文字英数字パターンの mask）+ bats でのユニット保証 + grep verification の三重防御。

## 全 Phase 成果物 review 結果テーブル

| Phase | 成果物 | review 結果 | 根拠 |
| --- | --- | --- | --- |
| Phase 1 | 要件定義（真の論点 / AC-1〜AC-20） | DOC_PASS | 実装仕様スコープに拡張済み |
| Phase 2 | 設計（runbook + scripts + bats + CI gate のアーキテクチャ） | DOC_PASS | F1-F9 の責務 / 入出力 / 失敗分岐定義済み |
| Phase 3 | 設計レビュー（3 案比較）| DOC_PASS | scripts 化 + bats + CI gate を採用、純 runbook のみ案を NO-GO |
| Phase 4 | 検証戦略（bats / staging dry-run / CI gate / grep） | DOC_PASS | 4 系統の検証経路が確定 |
| Phase 5 | runbook 本体（F1-F4 を呼び出す手順書）| DOC_PASS | UT-07B Phase 5 と責務分離 |
| Phase 6 | 異常系（4 + 4 シナリオ + scripts の exit code 設計） | DOC_PASS | 二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 衝突 + script-level failure |
| Phase 7 | AC マトリクス AC-1〜AC-20 | DOC_PASS | scripts / bats / CI gate を含めて全トレース |
| Phase 8 | DRY 化判定 | DOC_PASS | F3 redact 関数を共通化、ほか参照継承 |
| Phase 9 | 品質保証 / 4 条件評価 / CONST_005 充足 | DOC_PASS | 文書品質 + 実装仕様品質 PASS（MINOR 3 / MAJOR 0） |
| Phase 10 | 本 Phase | DOC_PASS（本書で確定） | automation-30 3 系統で major blocker なし |
| Phase 11 | bats / staging dry-run / CI gate evidence 計画 | RUNTIME_EVIDENCE_GATED | bats green + staging dry-run green + CI green が PR merge 前提 |
| Phase 12 | ドキュメント更新計画 | PASS_WITH_OPEN_SYNC | implementation-guide 2 部構成、Issue #363 再 open 判断含む |

## レビュー観点（AC × Phase トレース — AC-1〜AC-20 抜粋）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| AC-1（runbook 作成） | DOC_PASS | Phase 5 |
| AC-2（commit/PR/merge + 承認後の境界明記） | DOC_PASS | Phase 5 / index |
| AC-3（対象オブジェクト 5 種特定） | DOC_PASS | F2 SQL に固定 |
| AC-4（preflight 手順 = F1 仕様） | DOC_PASS | scripts/d1/preflight.sh 仕様化 |
| AC-5（apply 手順 = F4 / F5） | DOC_PASS | scripts/d1/apply-prod.sh + cf.sh d1:apply-prod |
| AC-6（post-check 手順 = F2） | DOC_PASS | scripts/d1/postcheck.sh 仕様化 |
| AC-7（evidence 保存項目 = F3） | DOC_PASS | scripts/d1/evidence.sh redact 仕様化 |
| AC-8（failure handling — exit code 設計） | DOC_PASS | Phase 6 で 4+4 シナリオと exit code 表 |
| AC-9（本タスク内で production apply 実行しない） | DOC_PASS | `DRY_RUN=1` 強制、index / Phase 5 / Phase 11 で一貫 |
| AC-10（post-check smoke の read/dryRun 限定） | DOC_PASS | F2 が SELECT のみ、destructive 禁止 |
| AC-11（skill 検証 4 条件） | DOC_PASS | Phase 9 |
| AC-12（機密情報非含有） | RUNTIME_EVIDENCE_GATED | Phase 11 grep + F3 redact bats で確定 |
| AC-13（bats unit tests 整備） | DOC_PASS | F7 仕様化、`pnpm test:scripts` |
| AC-14（CI gate 整備） | DOC_PASS | F6 `.github/workflows/d1-migration-verify.yml` |
| AC-15（cf.sh d1:apply-prod 委譲） | DOC_PASS | F5 仕様化 |
| AC-16（DRY_RUN=1 staging 模擬実行） | DOC_PASS | F4 内 dry-run 分岐 |
| AC-17（bats green が PR merge 前提） | DOC_PASS | Phase 11 evidence 計画 |
| AC-18（CI gate green が PR merge 前提） | DOC_PASS | Phase 11 evidence 計画 |
| AC-19（production 実 apply 非実行） | DOC_PASS | Phase 5 / 6 / 11 / 13 |
| AC-20（CONST_007 1 サイクル完了） | DOC_PASS | Phase 9 で確認 |

## blocking 事項の有無

| 種別 | 内容 | 判定 |
| --- | --- | --- |
| MAJOR blocker | なし | - |
| MINOR blocker | なし | Phase 9 サマリー記載の MINOR 3 件はいずれも Phase 12 / 下流タスクへ移管可能 |
| 技術的依存切れ | なし | UT-07B（CLOSED）と U-FIX-CF-ACCT-01 が確定 |
| 運用境界違反 | なし | 本タスクは production 実 apply を実行しない（`DRY_RUN=1` 強制） |
| CI gate 整備 | DOC_PASS | F6 仕様化済み。green は Phase 11 evidence で実走確認 |
| bats 整備 | DOC_PASS | F7 仕様化済み。green は Phase 11 evidence で実走確認 |

> blocking 判定: **bats green / CI gate green / staging dry-run green が PR merge の前提条件**。本 Phase はこれらが Phase 11 で取得可能な状態にあるかをゲート判定する。

## MINOR / MAJOR 指摘

| Severity | 内容 | 対応 |
| --- | --- | --- |
| MINOR | GitHub Issue #363 が CLOSED 状態 | Phase 12 で再 open / 新規 Issue 起票判断 |
| MINOR | 共通 SQL スニペット集（collision / introspection）の集約は将来候補 | Phase 12 unassigned-task-detection に記録 |
| MINOR | 実 production apply の運用実行は本タスク外（FU-04 として候補化） | Phase 12 unassigned-task-detection に記録 |
| MAJOR | なし | - |

## DOC_PASS / RUNTIME_EVIDENCE_GATED / NO-GO 判定

**RUNTIME_EVIDENCE_GATED**: Phase 11 evidence は、ユーザー明示承認と operator credential（staging 用）が揃った後に取得可能。ただし以下の制約を厳守する。

- Phase 11 は **bats（local）/ staging `DRY_RUN=1` / CI gate** の 3 系統に閉じる。production 接続は禁止。
- production 実 apply 完了までは `artifacts.json` の `status` を `spec_created` のまま維持する。
- Phase 13（PR 作成）は **ユーザー明示承認後** にのみ実行する。
- 実 production migration apply は本タスク完了後の **別運用タスク（FU-04 候補）** で実施する。

### NO-GO となる条件

| 条件 | 差戻し先 |
| --- | --- |
| F1〜F4 の入出力 / exit code 仕様が未確定 | Phase 2 / Phase 5 |
| F6 CI gate の job 構成（bats + F1 list）が未確定 | Phase 2 / Phase 5 |
| F7 bats が F1〜F4 の正常系・異常系（DB 取り違え / Token 不在 / 二重適用）を網羅していない | Phase 4 / Phase 11 |
| AC-3 の対象オブジェクトに漏れがある | Phase 1 / Phase 5 |
| Phase 6 異常系に二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 衝突のいずれかが欠落 | Phase 6 |
| Phase 8 で UT-07B Phase 5 とのコピペが残っている | Phase 5 / Phase 8 |
| Phase 9 の skill 検証 4 条件 / CONST_005 / CONST_007 に FAIL がある | Phase 1 / Phase 5 |
| Phase 11 evidence 計画で Token 値・Account ID 漏えいリスクがある | Phase 9 / Phase 11 |
| 不変条件 #5 の侵害が新たに判明した | Phase 1 |
| 本タスク内で production 実 apply を実行しようとする手順が混入している | Phase 5 / Phase 6 |

## skill 検証 4 条件 / CONST 充足

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | runbook / scripts / bats / CI gate の責務 / 入出力 / 失敗分岐が一貫 |
| 漏れなし | PASS | AC-1〜AC-20 を全 Phase でトレース、F1-F9 全実装ファイルが Phase 5 で言及 |
| 整合性 | PASS | UT-07B / U-FIX-CF-ACCT-01 / `scripts/cf.sh` / aiworkflow-requirements と整合 |
| 依存関係整合 | PASS | 上流 / 下流 / 並列依存が破綻しない |
| CONST_004（実装区分判定） | PASS | implementation_mode = new、F1-F9 全項目で具体実装ファイルパスを明示 |
| CONST_005（必須項目充足） | PASS | AC / Phase / 成果物 / scripts / bats / CI gate / runbook 全て揃い |
| CONST_007（1 サイクル完了） | PASS | requirements → design → implement-spec → test-spec → review → docs の 1 サイクルが Phase 1〜12 で完了 |

## 残課題（下流に存在することの明示）

| 項目 | 担当先 | 補足 |
| --- | --- | --- |
| 実 production migration apply の運用実行 | UT-07B-FU-04（候補） | 本 PR merge 後、ユーザー承認のうえ別タスクで実施 |
| GitHub Issue #363 の再 open / 新規起票判断 | Phase 12 | evidence と判断根拠を記録 |
| 共通 SQL スニペット集の集約 | 将来 unassigned-task | 同種 production runbook が 3 件目到達時に再評価 |
| OIDC 移行による Token 廃止 | 別タスク | U-FIX-CF-ACCT-01 ADR で言及済み |

## Phase 11 / 12 / 13 への進行判断

| Phase | 判定 | 前提条件 |
| --- | --- | --- |
| Phase 11（bats / staging dry-run / CI gate evidence） | RUNTIME_EVIDENCE_GATED | bats green + staging `DRY_RUN=1` exit=0 + CI gate green |
| Phase 12（ドキュメント更新） | PASS_WITH_OPEN_SYNC | implementation-guide.md（Part 1 + Part 2）/ unassigned-task-detection / skill-feedback / system-spec-update / compliance-check |
| Phase 13（PR 作成） | blocked_until_user_approval | ユーザー明示承認後にのみ実行 |

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | DOC_PASS | automation-30 3 系統で文書 / 実装仕様 / CI gate 設計の衝突なし |
| 漏れなし | PASS_WITH_OPEN_SYNC | AC-1〜AC-20 / blocking / NO-GO / 残課題は列挙済み。global index/log sync と Phase 11 実走 evidence は open |
| 整合性 | PASS | UT-07B / U-FIX-CF-ACCT-01 / `scripts/cf.sh` / aiworkflow-requirements と整合 |
| 依存関係整合 | PASS | 上流 / 下流 / 並列依存が破綻しない |

## 責任者・承認

| 役割 | 担当 |
| --- | --- |
| Phase 10 ゲート判定 | 仕様書作成エージェント |
| Phase 11 実施承認 | ユーザー（明示承認待ち） |
| Phase 13 PR 作成承認 | ユーザー（明示承認待ち） |
| 実 production migration 実行 | ユーザー（別タスク FU-04 候補で実施） |

## 完了条件

- [ ] 全 Phase（1〜12）の成果物 review が DOC_PASS / RUNTIME_EVIDENCE_GATED で判定されている
- [ ] automation-30 の 3 系統思考法が適用されている
- [ ] blocking 事項が 0 件であることが確認されている（bats / CI gate / staging dry-run の green は PR merge 前提として明記）
- [ ] MINOR 指摘 3 件が Phase 12 / 下流タスクへの移管経路と紐付いている
- [ ] MAJOR 指摘がない
- [ ] NO-GO 条件が明文化されている
- [ ] 残課題（実 production apply は下流運用 FU-04 候補）が明示されている
- [ ] Phase 11 / 12 / 13 への進行判断が記録されている
- [ ] 4 条件評価 / CONST_004 / CONST_005 / CONST_007 が PASS で記録されている
- [ ] `spec_created` 維持・PR 作成禁止が確認されている

## 完了判定

**RUNTIME_EVIDENCE_GATED**（Phase 11 evidence は PR/credential 実施待ち・実 production apply は本タスク外）。

## 苦戦想定

**1. 実装仕様化スコープへの拡張**

「runbook 文書のみ」スコープから「scripts + bats + CI gate を含む実装仕様」へ拡張したため、Phase 7 AC を AC-1〜AC-12 から AC-1〜AC-20 に拡張する必要がある。本 Phase は拡張後の AC を前提に判定。

**2. bats / CI gate green が PR merge 前提という解釈ぶれ**

bats と CI gate の green は「Phase 11 evidence 取得時に確認」+「PR 上で実走」の 2 重で担保。Phase 11 の bats local 実行は spec_created の文書段階では実走 evidence を持たないため、CI gate 上の実走を merge 前提として明記。

**3. production 実 apply 境界の周知**

`DRY_RUN=1` を F4 のデフォルトとし、`DRY_RUN=0` は production 用ユーザー承認時のみ。本仕様書では `DRY_RUN=0` の手順を Phase 5 末尾に「本タスク外、参考」として配置するに留める。

## 関連リンク

- 上位 index: `./index.md`
- AC マトリクス: `./phase-07.md`
- DRY 判定: `./phase-08.md`
- 品質保証: `./phase-09.md`
- evidence 計画: `./phase-11.md`
- ドキュメント更新: `./phase-12.md`
- PR 作成: `./phase-13.md`

## 成果物

- `outputs/phase-10/main.md`
