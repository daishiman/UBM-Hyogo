# Phase 10: 最終レビュー — staging-mint-bearer-env-contract-guard

> 前提: [phase-1.md](../phase-1/phase-1.md), [phase-2.md](../phase-2/phase-2.md), [phase-3.md](../phase-3/phase-3.md)。
> 本サイクルは **implemented_local_evidence_captured**（実装仕様書の作成 + コード実装 + source-level evidence 完了 / staging 実走・commit/push/PR は user-gated）。
> 本 phase は AC-1〜AC-12 を「実装後に検証する受入基準」として判定設計し、blocker / MINOR / 残課題候補を確定する。

## 10.1 区分

| 項目 | 値 |
| ---- | -- |
| タスク種別 | **NON_VISUAL**（CI workflow / Node script / shell のみ。UI/UX 変更なし） |
| 実装区分 | 実装仕様書（コード変更必須・CONST_004） |
| workflow_state | `implemented_local_evidence_captured`（Phase 1-12 仕様作成 + 実装 + local evidence 完了 / Phase 13 = PR は user-gated） |
| AC 判定の意味 | 各 AC は「実装後に満たすべき受入基準」。判定列は spec が当該 AC を検証可能な粒度で確定済みかを示す（`spec 完備`） |

## 10.2 DoD チェックリスト（成果物・gate）

| 項目 | 状態 | 根拠 |
| ---- | ---- | ---- |
| 4 対策（A role-scoping / B drift gate / C provision 整合 / D degrade）の実装手順を仕様化 | [x] | Phase 2（role モデル / `ROLE_REQUIRED_ENV` 単一真実 / gate アルゴリズム / degrade 条件）/ Phase 5（変更ファイル一覧・シグネチャ） |
| pure 関数シグネチャを確定（`parseRoles` / `requiredEnvForRoles` / `findMissingEnv` / `mintStagingBearersForRoles`） | [x] | Phase 2 §2.2.2 |
| env 契約の単一真実化（`ROLE_REQUIRED_ENV` / `COMMON_REQUIRED_ENV` を mint script と gate で共有） | [x] | Phase 2 §2.2.1 / §2.3 |
| 既存テスト後方互換の方針確定（AC-12） | [x] | Phase 4/6（既定 `admin,me` 維持・既存 spec 無改修 PASS） |
| local test PASS（設計上） | [x]（実行は実装 wave） | Phase 6 TC/FP + Phase 9 検証コマンド |
| actionlint PASS（設計上） | [x]（実行は実装 wave） | Phase 9（`runtime-smoke-staging.yml` / `verify-mint-env-contract.yml`） |
| JWT / secret 非露出（不変条件 #1） | [x] | Phase 2（env 名のみ出力・値非参照）/ Phase 6 redaction guard |
| `.claude` 正本 / `.agents` mirror parity | [x]（Phase 12 で最終確保） | 不変条件 #4 |
| commit / push / PR | pending（Gate-C / user-gated） | Phase 13 |
| required status check への gate 登録 | pending（user 明示承認必須） | §10.5 残課題候補（gating） |

## 10.3 AC 判定（implemented local・3-state verdict）

| AC | 内容 | 対策 | 判定根拠（spec 段階） | 検証手段（実装後） |
| -- | ---- | ---- | -------------------- | ------------------ |
| AC-1 | `--roles admin` 時に ME 系 env を要求せず admin bearer のみ mint・`GITHUB_OUTPUT` へ `admin_bearer` / `member_id` のみ書く | A | spec 完備（Phase 2 `parseRoles` / `mintStagingBearersForRoles` / `requiredEnvForRoles`） | `mint-staging-bearers.spec.ts` 新規ケース（admin-only） |
| AC-2 | `--roles me` は ME のみ・`--roles admin,me`（既定）は両方 mint（後方互換） | A | spec 完備（`parseRoles` の既定 `["admin","me"]`） | 同 spec の me / admin,me ケース |
| AC-3 | `--roles admin` 実行時に ME 系 env 未設定でも exit 0（RC-1/RC-2 回帰防止） | A | spec 完備（`requiredEnvForRoles(["admin"])` に ME env を含めない） | CLI 実行テスト（ME env unset 下で exit 0） |
| AC-4 | 要求 role の env 欠落時のみ `missing env:` を出し env 名のみ（値・JWT 非露出） | A | spec 完備（`findMissingEnv` は存在判定のみ・出力は env 名のみ） | 既存不変条件維持テスト + redaction grep |
| AC-5 | `bulk-tag-runtime-smoke` job の mint step が `--roles admin` を渡し ME 系 secret 参照を含まない | A | spec 完備（Phase 5 workflow 差分で `--roles admin` 配線・ME secret 行削除） | actionlint + `verify-mint-env-contract.mts` |
| AC-6 | gate が「step の渡す env が `--roles` 要求 env を満たすか」を検証し不足を drift として exit 1 | B | spec 完備（Phase 2 §2.3 `detectContractViolations` + descriptor 抽出） | `verify-mint-env-contract.spec.ts`（drift fixture → exit 1） |
| AC-7 | gate が provision script カバー secret 集合と mint 要求 env 集合の整合を検証 | B | spec 完備（provision カバー集合と `requiredEnvForRoles` の差分検出） | 同 spec（provision 不足 fixture → violation） |
| AC-8 | `verify-mint-env-contract.yml` が PR / push で gate を実行し drift で fail | B | spec 完備（Phase 5 workflow 新規・`verify-hook-integrity.yml` 構造踏襲） | actionlint + workflow 構造確認 |
| AC-9 | `provision-staging-secrets.sh` が JWT-mint secret 集合を 1Password 参照で provision・live inventory が必須集合を含むことを確認 | C | spec 完備（Phase 8 `SECRETS` 配列を JWT-mint 集合へ整合・旧 static-bearer は fallback 明示分離） | `bash -n` + dry-run + verify gate（AC-7） |
| AC-10 | degrade: `RUNTIME_SMOKE_MINT_DEGRADE=1`（staging 既定）時に必須 env 不足を warn 扱いし job を static fallback / skip へ degrade・CI 全体を fail させない | D | spec 完備（Phase 2 degrade 条件 + workflow `if` step） | mint script テスト（degrade フラグ）+ workflow 条件確認 |
| AC-11 | production runtime smoke には degrade を適用しない（`RUNTIME_SMOKE_MINT_DEGRADE` 未設定 = hard-fail 維持） | D | spec 完備（production workflow に degrade env を設定しない差分確認） | workflow 差分確認（production に env 不在） |
| AC-12 | 既存テスト（`mint-staging-bearers.spec.ts` 既存 / `mint-staging-bearers-self-verify.spec.ts`）が全 PASS（後方互換） | 回帰 | spec 完備（既定 `admin,me` で現行挙動維持・既存 pure 関数シグネチャ不変） | vitest（既存 spec 無改修 PASS） |

> 全 AC は仕様として検証可能な粒度に確定済み（`spec 完備`）。実値での PASS 判定は実装サイクル（Phase 4-9 の RED/GREEN + Phase 11 証跡）で行う。

## 10.4 blocker 判定

| 項目 | blocker か | 備考 |
| ---- | ---------- | ---- |
| role-scoping ロジック新規実装 | NO | Phase 5 で新規（`implementation_mode: new`）。設計確定済み |
| drift gate script / workflow 新規 | NO | Phase 2 §2.3 アルゴリズム確定・`verify-hook-integrity.yml` 構造を踏襲 |
| js-yaml 依存有無（YAML descriptor 抽出） | NO（Phase 5 着手時に解決可） | js-yaml 優先 / 不在時は正規表現 fallback。設計骨格を揺るがさない（Phase 3 §3.2） |
| 1Password item 未実在（provision 実行時） | NO（user 前提・Phase 13 runbook） | 仕様書は参照キーのみ。実 item 整備は user-gated |
| 実 Cloudflare staging deploy / 実 secret 投入 | NO（user-gated・スコープ外） | index.md §2 スコープ外。Phase 13 以降 |
| commit / push / PR | YES（user-gated） | Phase 13（Gate-C） |

> **blocker（実装を阻む技術課題）なし。** 唯一の必須ゲートは commit/push/PR の user 承認（Gate-C）。

## 10.5 Phase 12 へ引き継ぐ MINOR / 残課題候補（検出一覧）

> **Feedback: Phase 10 の MINOR は必ず Phase 12 unassigned-task-detection の未タスク化対象**とする（silent drop 禁止・2 回検証一致を取る）。

| ID | 内容 | 区分 | 引き継ぎ先 |
| -- | ---- | ---- | ---------- |
| M-1 | **required status check への `verify-mint-env-contract` 登録は CLAUDE.md ブランチ戦略上 user 明示承認必須**（`gh api -X PUT` は user-gated）。gate workflow は存在するが `dev` / `main` の required check に未登録だと PR をブロックできない | governance / gating | Phase 12 unassigned/gating 候補（§10.6 と重複明記） |
| M-2 | gate の YAML 静的解析は js-yaml 不在時に正規表現 fallback となるため、将来 workflow 記法（matrix 内 mint step・複数行 `run` での `--roles` 指定等）が増えると抽出漏れリスク。descriptor 抽出の網羅性は 2 本目以降の mint step 追加時に再点検 | improvement / 将来候補 | Phase 12 detection（baseline 候補） |
| M-3 | degrade（D）は staging 過渡期の安全網。secret 整備完了後は `RUNTIME_SMOKE_MINT_DEGRADE` を撤去し staging も hard-fail へ戻す運用判断が将来発生しうる（恒久 degrade を既定化しない） | operations / 将来候補 | Phase 12 detection |
| M-4 | provision の旧 static-bearer 集合（`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `STAGING_MEMBER_ID`）は degrade fallback 用に明示分離して残すが、degrade 撤去（M-3）と同時に廃止できる。dead secret 化の追跡 | operations / 将来候補 | Phase 12 detection |

> M-1 は **gating（user 明示承認待ち）**であり先送り（別 Issue 化）ではない。M-2/M-3/M-4 は本タスク AC 射程外の将来候補。いずれも Phase 12 detection で 2 回検証一致を取り、必要なら Issue 化（user-gated）。

## 10.6 残課題候補（gating・明示）

- **required status check 登録**: `verify-mint-env-contract / verify` を `dev` / `main` の `required_status_checks` に追加する操作は、CLAUDE.md「ブランチ戦略」記載のとおり `gh api -X PUT` / PUT payload / commit / push / PR と同様に **user 明示承認後のみ実行**する。read-only の before JSON（`gh api repos/daishiman/UBM-Hyogo/branches/dev/protection`）取得は事前 evidence として可。本タスクでは承認待ち境界として記録し、実 PUT は行わない（CONST_007 の先送りではなく gating）。

## 10.7 最終判定

**implemented_local_evidence_captured として完成。** A（role-scoping）/ B（drift gate）/ C（provision 整合）/ D（degrade）の 4 対策を、pure 関数・gate・workflow・provision script へ実装した。
staging 実走・commit/push/PR・required status check 登録は user-gated。Gate-A/B passed / Gate-C pending。

## 10.8 4 条件最終評価

| 条件 | 判定 | 根拠 |
| ---- | ---- | ---- |
| 価値性 | PASS | 開発者の「毎 staging deploy で bulk-tag job が他責 env 欠落で fail し CI 全体が止まる」コストを 0 にし、B gate で再発を機械的に封じる |
| 実現性 | PASS | 既存 mint script に pure 関数追加・新規 gate script 1・workflow 1 新規 + 1 編集・provision 1 編集。1 サイクルで実装可能な厚み |
| 整合性 | PASS | role→env 契約を `ROLE_REQUIRED_ENV` 単一定数に集約し mint script と gate が共有（二重定義なし）。既存 pure 関数シグネチャ不変で後方互換。不変条件 #1〜#5 遵守 |
| 運用性 | PASS | gate が PR/push で drift を継続検出。degrade は staging 過渡期の安全網で production は hard-fail 維持。secret 管理面積を最小化 |

## 10.9 完了条件（Phase 10）

- [x] AC-1〜AC-12 の達成判定表（各 AC / 判定根拠 / 検証手段）を implemented local 前提で記録
- [x] blocker 判定（実装を阻む技術 blocker なし・user-gated の Gate-C のみ）を記録
- [x] MINOR（M-1〜M-4）を Phase 12 未タスク化対象として明記
- [x] required status check 登録を gating 残課題候補として記録
- [x] 4 条件最終評価（全 PASS）
