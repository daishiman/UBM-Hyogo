# Phase 13: PR作成（user-gated） — staging-mint-bearer-env-contract-guard

> 前提: [index.md](../../index.md)（§3 AC-1〜AC-12 / §8 ステータス）, [phase-9.md](../phase-9/phase-9.md)（§9.2 一括品質ゲート 6 コマンド / §9.4 QA チェックリスト）, [phase-12/main.md](../phase-12/main.md)（実装対象 8 ファイル / 状態）, [phase-12/implementation-guide.md](../phase-12/implementation-guide.md)（差分方針）。
> 区分: 実装仕様書（CONST_004）/ **NON_VISUAL**（CI workflow / Node script / shell のみ・UI 変更なし）/ ci-gate。

---

## 13.0 絶対原則（user-gated）

> **commit / push / PR は user の明示承認後のみ実施する（user-gated）。**
> task-specification-creator 不変条件および CLAUDE.md「commit / push / PR は user 明示承認後のみ」に従い、本 phase（および本タスクの仕様作成セッション）では **commit / push / PR / `gh api -X PUT`（branch protection 変更）を一切実行しない**。本 phase は「承認後に実行する手順・PR 本文テンプレート・提案事項」を確定するのみ。

| 項目 | 値 |
| ---- | -- |
| Phase 13 status | `pending_user_approval` |
| Gate-C | **pending**（commit / push / PR 作成・user-gated） |
| PR base ブランチ | **`dev`**（CLAUDE.md PR フロー既定。production リリース時のみ `dev → main`） |
| visualEvidence | NON_VISUAL（スクリーンショット専用セクションを作らない） |
| related issue | なし（backend-ci の bulk-tag-runtime-smoke job failure 起点） |

---

## 13.1 ブランチ方針

| 段階 | branch | 用途 |
| ---- | ------ | ---- |
| spec 作成段階（本サイクル） | `docs/staging-mint-bearer-env-contract-guard-spec` | 仕様書 13 phase + strict 7 outputs のみ（コード差分なし） |
| 実装サイクル | 同 `docs/staging-mint-bearer-env-contract-guard-spec` または `feat/staging-mint-bearer-env-contract-guard` | phase-12 の実装対象 8 ファイル（対策 A/B/C/D）の実装差分を扱う |

> - spec 作成段階の PR には仕様書のみが含まれる。実装差分（mint script TS 改修 / 新規 verify script / workflow 2 本 / provision shell / test 2 本）は実装サイクルで同 branch に追加コミットするか、`feat/*` を新規作成して扱う。
> - いずれの branch でも PR base は **`dev`**。`main` への PR は production リリース時（`dev → main`）に限定する。
> - 実装差分を `feat/*` に分離する場合、PR タイトル prefix は `feat(` を用いる（CONST_004 = コード変更を伴うため `docs(` は不可）。

---

## 13.2 PR 作成手順（承認後のみ）

CLAUDE.md「PR作成の完全自律フロー」§実行順序に準拠する。

1. 現在ブランチと変更状況を確認する（`git status --porcelain` / `git branch --show-current`）。`dev` 直上の場合は §13.1 の branch を作成する。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期 → 作業ブランチへ `git merge dev`。
3. conflict は CLAUDE.md「コンフリクト解消の既定方針」で自律解消し `git add` + `git commit` まで行う（skill 台帳 / 30-workflows ログ系は `.gitattributes merge=union` / `pnpm sync:resolve` を活用）。
4. 品質検証（§13.3）を実行し、失敗時は最大 3 回まで自動修復してコミットする。
5. `git status --porcelain` が空であることを確認し、残変更は `git add -A` で全件含めてコミットする。
6. `git diff dev...HEAD --name-only` で PR 対象ファイル一覧を取得し、漏れなし確認に用いる（§13.5 と照合）。
7. PR 本文を §13.6 テンプレート + `outputs/phase-12/implementation-guide.md` から作成し、`gh pr create --base dev` で作成する。
8. NON_VISUAL のためスクリーンショット専用セクションは作らない（`outputs/phase-11/` に画像なし）。

---

## 13.3 PR 前チェックリスト（CLAUDE.md PR フロー準拠 + 本タスク固有）

承認後の PR 作成前に、以下を上から順に実行し全て green であることを確認する。実 secret 投入・実 staging deploy・実 D1 mutation は一切含まない（user-gated）。

| # | コマンド | 種別 | PASS 基準 |
| - | -------- | ---- | --------- |
| 1 | `pnpm install --force` | CLAUDE.md 共通 | 依存解決成功・lockfile 整合 |
| 2 | `pnpm typecheck` | CLAUDE.md 共通 | 型エラー 0（mint script の新 export 型 / drift gate 型を含む） |
| 3 | `pnpm lint` | CLAUDE.md 共通 | lint 違反 0（`--fix` で残った違反は手修正） |
| 4 | `bash scripts/verify-pr-ready.sh` | CLAUDE.md 共通（docs-only gate pre-flight） | exit 0（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を一括検証） |
| 5 | `pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` | **本タスク固有**（role-scoping + degrade + drift gate） | 全ケース PASS（AC-1〜AC-10 / phase-9 §9.4） |
| 6 | `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml .github/workflows/verify-mint-env-contract.yml` | **本タスク固有**（actionlint・workflow 2 本） | actionlint PASS（YAML/式構文 / AC-5 / AC-8） |
| 7 | `bash -n scripts/smoke/provision-staging-secrets.sh` | 本タスク固有（provision 構文） | 構文 OK（AC-9） |
| 8 | `shellcheck scripts/smoke/provision-staging-secrets.sh` | 本タスク固有（provision lint） | 新規 warning 0（AC-9） |
| 9 | `pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` | 後方互換（AC-12） | 既存ケース全 PASS |

> - チェック 5〜9 は phase-9 §9.2 の一括品質ゲート 6 コマンド + 後方互換確認を本タスク固有として PR 前必須にしたもの。
> - spec 作成段階の PR（コード差分なし）では 5〜9 の対象ソースが未変更のため、`bash scripts/verify-pr-ready.sh`（チェック 4）の docs-only gate を必須とし、5〜9 は実装サイクルの PR で必須化する。
> - テストコード実行は本 PR 作成フローではチェック 5・9（mint / drift gate / self-verify）に限定し、それ以外の全体テストは user 明示がない限り行わない（CLAUDE.md）。

---

## 13.4 PR 前チェック失敗時の自動修復（CLAUDE.md 準拠）

| 失敗コマンド | 修復方針 |
| ------------ | -------- |
| `pnpm install --force` | 依存状態と lockfile の不整合を疑い最小限の再生成で復旧 |
| `pnpm typecheck` | unused import / null 許容 / 型注釈漏れ / export-import 不整合を最小差分で修正 |
| `pnpm lint` | まず `pnpm lint --fix`、残違反のみ手修正 |
| `bash scripts/verify-pr-ready.sh` | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照し、`gate-metadata:validate` → `verify:phase12-compliance` → `indexes:rebuild` drift の順で切り分け |
| vitest（5 / 9） | 失敗 spec を確認し、role-scoping / degrade / drift gate の実装と spec 期待値の不一致を最小差分で修正（AC との整合を優先） |
| actionlint（6） | YAML/式構文・step 参照 env を修正（AC-5 = ME 系 secret 参照削除 / AC-8 = on.pull_request.paths 構造） |
| `bash -n` / `shellcheck`（7 / 8） | provision shell の構文 / quoting を修正（AC-9） |

最大 3 回まで自動修復し、修復差分をコミットする。

---

## 13.5 PR に含めるファイル一覧

### 実装成果物（実装サイクル完了後・8 点 / phase-12 main.md §実装対象）

| 区分 | パス | 対策 |
| ---- | ---- | ---- |
| EDIT | `scripts/smoke/mint-staging-bearers.mts` | A / D（role-scoping + degrade） |
| NEW | `scripts/smoke/verify-mint-env-contract.mts` | B（drift gate） |
| EDIT | `.github/workflows/runtime-smoke-staging.yml` | A / D（`--roles admin` + degrade marker 伝播 + ME 系 secret 参照削除） |
| NEW | `.github/workflows/verify-mint-env-contract.yml` | B（gate を PR / push 実行） |
| EDIT | `scripts/smoke/provision-staging-secrets.sh` | C（JWT-mint secret 集合へ整合） |
| EDIT | `scripts/smoke/README.md` | A/B/C/D の使い方 doc |
| EDIT | `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | A / D テスト追加 |
| NEW | `scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` | B テスト（新規） |

### 仕様書群

- 本仕様書 root 一式（`docs/30-workflows/completed-tasks/staging-mint-bearer-env-contract-guard/`）: `index.md` / `artifacts.json` / `outputs/phase-1..13/phase-N.md` / Phase 12 strict 7 outputs
- Phase 11 NON_VISUAL 証跡（`outputs/phase-11/phase-11.md` / `manual-test-result.md` / `outputs/phase-11/evidence/`・focused test/actionlint PASS）

> 確認: `git diff dev...HEAD --name-only` の出力が上記一覧（実装 8 点 + 仕様書群）を漏れなく含むこと。spec 作成段階の PR では仕様書群のみが対象になる。

---

## 13.6 PR 本文テンプレート（実装完了後に使用）

### 想定タイトル

```
fix(ci): staging runtime smoke の mint env 契約 drift 再発防止（role-scoping + 静的 drift gate + provision 整合 + degrade）
```

> spec 作成段階の PR は `docs(ci): staging-mint-bearer-env-contract-guard 実装仕様書（Phase 1-13）` とする。実装差分を含む PR は CONST_004 によりコード変更を伴うため `fix(` / `feat(` prefix を用いる。

### 本文骨格

```markdown
## 背景（CI 失敗ログ）
backend-ci → deploy-staging → runtime-smoke-staging.yml（workflow_call）→ bulk-tag-runtime-smoke
job の "mint staging admin bearer" step で以下が発生し CI 全体が停止していた:

    runtime smoke staging / bulk-tag-runtime-smoke   failed
    mint-staging-bearers: missing env: STAGING_ME_MEMBER_ID, STAGING_ME_EMAIL
    Error: Process completed with exit code 2.

admin bearer のみ必要な job が、mint script の env 契約都合で ME 系 env を強制され原理的に落ちる。
さらにこの drift が PR 時点で機械検出されず本番 CI job で初めて顕在化していた。

## 根本原因
- RC-1: mint-staging-bearers.mts の main() が role に関わらず常に 5 env
  （STAGING_AUTH_SECRET / STAGING_ADMIN_MEMBER_ID / STAGING_ADMIN_EMAIL /
   STAGING_ME_MEMBER_ID / STAGING_ME_EMAIL）を必須化。
- RC-2: bulk-tag-runtime-smoke job は admin bearer のみ必要だが mint step に ME 系 env を渡さず、
  RC-1 と組み合わさり env 欠落で exit 2。
- RC-3（副因）: provision-staging-secrets.sh が旧 static-bearer 集合のみ provision し、
  JWT-mint 系 secret を provision しないため secret inventory と mint script 要求が drift。

## 対策（A+B+C+D / ユーザー承認済みスコープ）
- A role-scoping: mint script に --roles admin | me | admin,me（既定 admin,me で後方互換）。
  要求 role の env だけ必須化し、存在する role の bearer のみ GITHUB_OUTPUT へ書く。（RC-1 / RC-2）
- B 静的 drift gate: 新規 verify-mint-env-contract.mts + verify-mint-env-contract.yml。
  workflow step の渡す env / --roles 指定 / script 要求 env / provision カバー集合の整合を
  PR 時点で fail-fast 検出。（再発防止 / 全 RC）
- C provision 整合: provision-staging-secrets.sh を JWT-mint secret 集合へ整合（旧 static-bearer は
  fallback 用に明示分離）。（RC-3）
- D degrade（staging 限定）: 必須 env 不足時に hard-fail でなく warn + degrade（mint step skip /
  static fallback）。production には適用しない（hard-fail 維持）。（再発時の自動回復）

## 変更ファイル
- EDIT scripts/smoke/mint-staging-bearers.mts（role-scoping + degrade / 既存 mintStagingBearers 無改変）
- NEW  scripts/smoke/verify-mint-env-contract.mts（静的 drift gate）
- EDIT .github/workflows/runtime-smoke-staging.yml（--roles admin + degrade marker 伝播 + ME 系参照削除）
- NEW  .github/workflows/verify-mint-env-contract.yml（gate を PR / push 実行）
- EDIT scripts/smoke/provision-staging-secrets.sh（JWT-mint 集合へ整合）
- EDIT scripts/smoke/README.md（A/B/C/D の使い方）
- EDIT scripts/smoke/__tests__/mint-staging-bearers.spec.ts（role-scoping + degrade ケース）
- NEW  scripts/smoke/__tests__/verify-mint-env-contract.spec.ts（drift gate ケース）

## 受入条件
AC-1〜AC-12（index.md §3）。role-scoping（AC-1〜AC-4）/ workflow 配線（AC-5）/ drift gate（AC-6〜AC-8）/
provision 整合（AC-9）/ degrade staging 限定（AC-10〜AC-11）/ 後方互換（AC-12）。

## 検証結果（ローカル / 副作用なし）
- pnpm typecheck / pnpm lint / bash scripts/verify-pr-ready.sh
- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts \
    scripts/smoke/__tests__/verify-mint-env-contract.spec.ts
- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts（AC-12 後方互換）
- actionlint runtime-smoke-staging.yml + verify-mint-env-contract.yml
- bash -n / shellcheck provision-staging-secrets.sh
※ 実 secret 投入・実 staging deploy・実 D1 mutation・実 runtime smoke 実走は本 PR に含まず、別途 user-gated。

## 不変条件
- JWT 文字列 / secret 値を console / stdout / log / エラーに出さない（env 名のみ）。
- 本タスクは CI / script のみ。apps/* のランタイムコードは変更しない（CLAUDE.md 不変条件 #5）。
- degrade は staging 限定。production は hard-fail 維持（AC-11）。

## 状態
implemented_local_evidence_captured。staging 実走は staging_runtime_pending_user_gate。
```

> - NON_VISUAL のため本文に **スクリーンショット専用セクションを作らない**（CLAUDE.md PR フロー準拠・`outputs/phase-11/` に画像なし）。
> - `outputs/phase-12/implementation-guide.md` の主要見出し・差分方針を本文に漏れなく反映する（CLAUDE.md PR 前チェック）。

---

## 13.7 提案事項（user 承認待ち・gating）

### 13.7.1 `verify-mint-env-contract` を required status check へ登録する提案

対策 B の drift gate（`verify-mint-env-contract.yml`）を `dev` / `main` の **required status check** に登録すると、env 契約 drift が本番 CI job で顕在化する前に PR ブロックできる（再発防止が gate 化される）。

> **CLAUDE.md ブランチ戦略の制約**: branch protection 実値（`gh api -X PUT repos/{owner}/{repo}/branches/{dev,main}/protection`）の変更は **user 明示承認後のみ**実行する。PUT payload・commit・push・PR と同様に本 phase では実行しない。

**事前に取得可能（read-only / 副作用なし・承認不要）**:

```bash
# before evidence（現行 required status check 一覧の取得・read-only）
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts'
```

**承認後にのみ実行（user 明示承認が前提）**: 上記 before の contexts へ `verify-mint-env-contract / verify`（実 job 名は `verify-mint-env-contract.yml` の job id に整合させる）を追加した PUT payload を作成し、`gh api -X PUT .../branches/dev/protection` / `.../branches/main/protection` を個別実行する。実行後は CLAUDE.md UT-GOV-001 に従い `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` の drift がないことを再確認する。

### 13.7.2 staging 実走（user-gated）

対策 A/D の実効性確認（admin-only mint が ME 系 env なしで成功し bulk-tag runtime smoke が green になること）は、実 secret 投入 + 実 staging deploy + 実 runtime smoke 実走を伴うため **user-gated**。本 PR には含めず、承認後に別途実行し evidence を `outputs/phase-11/evidence/` に tracked file として追加する。

---

## 13.8 DoD（完了条件 / Phase 13）

- [ ] user 承認まで commit / push / PR / branch protection PUT を実行しない（Gate-C pending）
- [x] 冒頭に user-gated 原則を明記し、PR base = `dev`（production リリース時のみ `main`）を固定した
- [x] branch 方針（spec 段階 = `docs/staging-mint-bearer-env-contract-guard-spec` / 実装 = 同 branch または `feat/*`）を確定した
- [x] PR 前チェックリストを CLAUDE.md 4 コマンド + 本タスク固有（mint / drift gate vitest・actionlint・bash -n・shellcheck・self-verify）で固定した
- [x] PR 本文テンプレート（背景 / RC-1〜RC-3 / 対策 A-D / 変更 8 ファイル / 検証結果 / staging 実走別 user-gated）を確定した
- [x] `verify-mint-env-contract` の required status check 登録提案を user 承認待ち（PUT は承認後・before JSON は read-only 取得可）として明記した
- [x] NON_VISUAL のためスクリーンショット専用セクションを作らない旨を明記した
- [ ] 承認後 PR 作成完了時に PR URL / 採用ブランチ / 自動修復 / 解消コンフリクト / 残課題を 1 回だけ報告する（CLAUDE.md「最終レポート」）
