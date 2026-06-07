# Phase 9: 品質保証（Lane-3 / 対策C QA + degrade 後続整合の最終決着）

> 前提: [index.md](../../index.md)（§3 AC-1〜AC-12）, [phase-2.md](../phase-2/phase-2.md)（§2.5 degrade）, [phase-5.md](../phase-5/phase-5.md)（§5.5.1 注: degrade 時 `STAGING_ADMIN_BEARER` 空 → 後続 verify step fail の残課題）, [phase-6.md](../phase-6/phase-6.md)（drift gate test）, [phase-8.md](../phase-8/phase-8.md)（provision 整合）。
> 本 phase は **Lane-3** の担当で、(1) Lane-1 が指摘した degrade ↔ "verify required staging secrets" の相互作用の残課題を確定し、(2) 一括品質ゲートと全 AC の QA チェックリストを定める。
> 区分: 実装仕様書（CONST_004）/ NON_VISUAL / ci-gate。証跡は自動テスト + actionlint + bash -n + shellcheck（Phase 11）。

---

## 9.1 Lane-1 残課題の最終決着（degrade 発火 → 後続 verify step fail 問題）

### 9.1.1 問題の正確な再掲（phase-5 §5.5.1 注）

`bulk-tag-runtime-smoke` job の mint step に `RUNTIME_SMOKE_MINT_DEGRADE: '1'` を設定する設計（phase-2 §2.2.5 / phase-5 §5.5.1）の下で:

1. mint step が必須 env 欠落を検出 → degrade 発火 → `mint_degraded=1` を出力 + `admin_bearer=` を**出力しない** + exit 0。
2. このとき `STAGING_ADMIN_BEARER=$admin`（`$admin` は空）が `GITHUB_ENV` に書かれ、`STAGING_ADMIN_BEARER` が空になる。
3. 後続 "verify required staging secrets" step（runtime-smoke-staging.yml L170-185）が `STAGING_ADMIN_BEARER` の空を検出し `exit 1` → **job 全体が fail**。

→ degrade（CI を止めない目的・AC-10）が、後続 verify step によって**無効化される**。これが Lane-1 の指摘した未決課題。

### 9.1.2 案の比較と採用（FB-UI-02-1 の PASS 基準考慮）

| 案 | 内容 | 長所 | 短所 | 判定 |
|----|------|------|------|------|
| **案1** | degrade marker（`mint_degraded=1`）を mint step が `GITHUB_ENV` に伝播し、後続の "verify required staging secrets" step・実 smoke step を degrade 時 `if` で **skip**。static fallback bearer が provision されていれば mint step が空書きせず fallback を温存し、無ければ job を degraded 扱いで早期成功させる | degrade の本来目的（CI を止めない）を後続まで一貫させる。AC-10 を job スコープで完全充足 | mint step / 後続 step に degrade 伝播配線が必要（差分やや増） | **採用** |
| 案2 | bulk-tag job では degrade を付けず（対策B gate が drift を PR で止めるので degrade 不要）、`smoke` job のみ degrade | 差分最小 | index.md §2 / phase-2 §2.2.5 / phase-5 §5.5.1 が **bulk-tag step に `RUNTIME_SMOKE_MINT_DEGRADE: '1'` を配線する設計を既に確定済み**。本案はその確定設計を覆す（spec 後退）。さらに secret 未配備の過渡期に bulk-tag job が hard-fail する余地が残る | **不採用** |

> **採用根拠**: index.md §3 AC-10 は「degrade 時に該当 **job** を static fallback / skip へ degrade して CI 全体を fail させない」と job スコープで規定する。後続 verify step が degrade を無視して fail すると AC-10 を満たさない。案2 は確定済み設計（bulk-tag step の degrade 配線）を後退させるため、確定設計を維持しつつ後続を degrade 整合させる **案1 を採用**する。

### 9.1.3 採用案の workflow 差分（どの step に `if` / 配線を足すか）

対象: `.github/workflows/runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke` job。**この workflow 差分は Lane-1（Phase 5）の workflow 編集と同一ファイルに対するため、Phase 5 §5.5.1 の「Lane-3 と協調して Phase 9 で最終調整」の確定値として本 phase で固定する**（実コード編集は実装工程）。

| # | step / 場所 | 変更 | 理由 |
|---|------------|------|------|
| D-1 | `mint staging admin bearer` step の `run` 末尾 | mint 出力に `mint_degraded=1` がある場合のみ `RUNTIME_SMOKE_MINT_DEGRADED=1` を `GITHUB_ENV` へ書く。`admin_bearer=` が空のときは `STAGING_ADMIN_BEARER` を**上書きしない**（既存 secret 由来の静的 fallback 値を温存する） | degrade marker を後続 step が参照できるよう job env へ昇格。空文字での上書きを避け fallback を保つ |
| D-2 | `verify required staging secrets` step | step に `if: env.RUNTIME_SMOKE_MINT_DEGRADED != '1'` を付与（degrade 時は skip） | degrade 時に空 bearer での hard-fail を回避（AC-10）。非 degrade 時は従来通り必須検証を実施（回帰なし） |
| D-3 | `mask staging credentials` step | 同 `if: env.RUNTIME_SMOKE_MINT_DEGRADED != '1'`（skip） | bearer 不在で mask する意味がないため degrade 時 skip |
| D-4 | `run bulk tag runtime smoke` step | 同 `if: env.RUNTIME_SMOKE_MINT_DEGRADED != '1'`（skip） | bearer 不在で実 smoke を走らせない。degrade 時は job を **green（実行なし）** で終える（AC-10「CI 全体を fail させない」） |
| D-5 | `redaction grep gate` / `upload evidence artifact`（`if: always()`） | `RUNTIME_SMOKE_MINT_DEGRADED` の有無に依存しないが、`ci-evidence-bulk-tag/` が空でも `grep -rEl ... || true` で安全（既存実装が `|| true` で空ディレクトリ許容）。変更不要 | degrade 時に evidence が無くても fail しない既存挙動を維持 |

#### D-1 の `run` 実装指示（degrade marker 伝播 + 空上書き回避）

```bash
        run: |
          mint_out="$(mktemp)"
          GITHUB_OUTPUT="$mint_out" pnpm exec tsx scripts/smoke/mint-staging-bearers.mts --roles admin
          if grep -q '^mint_degraded=1$' "$mint_out"; then
            rm -f "$mint_out"
            echo "::notice::mint degraded (missing env); bulk-tag runtime smoke will be skipped"
            echo "RUNTIME_SMOKE_MINT_DEGRADED=1" >> "$GITHUB_ENV"
          else
            admin="$(grep '^admin_bearer=' "$mint_out" | tail -n1 | cut -d= -f2-)"
            rm -f "$mint_out"
            echo "::add-mask::$admin"
            echo "STAGING_ADMIN_BEARER=$admin" >> "$GITHUB_ENV"
          fi
```

> - degrade 時は `STAGING_ADMIN_BEARER` を上書きしない → job env の `STAGING_ADMIN_BEARER`（secret 由来 = static fallback 値、または未配備なら空）はそのまま。後続 verify step は D-2 の `if` で skip されるため、空でも fail しない。
> - 非 degrade 時は従来通り `admin_bearer` を mask して `GITHUB_ENV` へ。
> - `mint_degraded=1` 検出は完全一致（`^mint_degraded=1$`）。mint script は degrade 時にこの行のみを出力する（phase-5 §5.2.6 step 4b）。

> **状態所有権（phase-2 §2.7 整合）**: degrade の**判定**は mint script（`RUNTIME_SMOKE_MINT_DEGRADE` 読取・marker 出力）。job skip の**最終判定**は workflow（`RUNTIME_SMOKE_MINT_DEGRADED` env を読む `if`）。所有権を混在させない。`RUNTIME_SMOKE_MINT_DEGRADE`（入力フラグ）と `RUNTIME_SMOKE_MINT_DEGRADED`（marker 結果）は名前を分け、入力と結果を取り違えない。

### 9.1.4 production 非適用の維持（AC-11）

- production runtime smoke（別 workflow / 別 job）は `RUNTIME_SMOKE_MINT_DEGRADE` を設定しない → mint step は degrade せず hard-fail（exit 2）を維持。`RUNTIME_SMOKE_MINT_DEGRADED` marker も出ないため D-2〜D-4 の skip 条件は常に false（従来通り全 step 実行）。degrade 整合は staging 限定で production を侵さない。

---

## 9.2 一括品質ゲートコマンド（CONST_005: 実行コマンド）

本タスクの全変更（対策A/B/C/D）を一括検証するコマンド群。**実 secret 投入・実 staging deploy・実 D1 mutation は含まない**（user-gated）。

```bash
# 1. 型チェック（mint script の新 export 型 / drift gate の型）
pnpm typecheck

# 2. lint
pnpm lint

# 3. workflow 静的検証（編集 runtime-smoke-staging.yml + 新規 verify-mint-env-contract.yml）
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 \
  .github/workflows/runtime-smoke-staging.yml \
  .github/workflows/verify-mint-env-contract.yml

# 4. provision script 構文 dry 検証（副作用なし）
bash -n scripts/smoke/provision-staging-secrets.sh

# 5. provision script shell lint（副作用なし）
shellcheck scripts/smoke/provision-staging-secrets.sh

# 6. mint role-scoping + drift gate のユニットテスト
pnpm exec vitest run \
  scripts/smoke/__tests__/mint-staging-bearers.spec.ts \
  scripts/smoke/__tests__/verify-mint-env-contract.spec.ts
```

> 6 の vitest には Lane-1 の `mint-staging-bearers.spec.ts`（role-scoping + degrade）と Lane-2 の `verify-mint-env-contract.spec.ts`（drift gate）を含める。既存後方互換は `mint-staging-bearers-self-verify.spec.ts`（AC-12）を別途実行して確認する（§9.4 AC-12 行）。

---

## 9.3 mirror parity（.claude / .agents）の扱い

- 本タスクは `scripts/smoke/*` / `.github/workflows/*` / 仕様書のみを変更し、**skill 本体（`.claude/skills/**`）を変更しない**ため、`.claude` 正本 / `.agents` mirror の parity 検証は本 phase では **N/A**。
- ただし **Phase 12 で aiworkflow skill 台帳同期は実施する**（task-workflow-active / inventory / topic-map / keywords / SKILL.md / SKILL-changelog / LOGS）。skill 本体ファイルを増減しないため mirror symlink は自明にクリーン（差分なし）。Phase 12 の indexes:rebuild が冪等であることを確認する。

---

## 9.4 全 AC の QA チェックリスト（AC-1〜AC-12 / CONST_005: テスト方針 + PASS 基準）

| AC | 受入条件（要約） | 検証コマンド | PASS 基準 |
|----|------------------|--------------|-----------|
| AC-1 | `--roles admin` で ME 系 env 不要・admin bearer のみ mint・`admin_bearer`/`member_id` のみ出力 | `pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts`（T-CLI-01/02/03） | 該当ケース PASS。出力に `me_bearer=` を含まない |
| AC-2 | `--roles me` は ME のみ・`admin,me`（既定）は両方（後方互換） | 同上（T-CLI-05/06 + T-RS-01/02） | 既定で `admin_bearer`/`me_bearer`/`member_id` の3つ、`me` で `me_bearer` のみ |
| AC-3 | `--roles admin` で ME 系 env 未設定でも exit 0（RC-1/RC-2 回帰防止） | 同上（T-CLI-01 / `execFileSync` exit code 検証） | ME 系 env 未設定で exit code 0 |
| AC-4 | env 欠落時のみ `missing env:` を env 名のみで出力（値・JWT 非露出） | 同上（T-CLI-07/08） | stderr が env 名のみ。JWT/secret 値文字列を含まない |
| AC-5 | bulk-tag job mint step が `--roles admin` を渡し ME 系 secret 参照を含まない | `actionlint .github/workflows/runtime-smoke-staging.yml` + `pnpm exec vitest run scripts/smoke/__tests__/verify-mint-env-contract.spec.ts`（provision_gap/excess なし）+ 目視（step env に `STAGING_ME_*` 無し） | actionlint PASS + gate violation 0 + ME 系参照 0 |
| AC-6 | gate が「step の渡す env が `--roles` 要求 env を満たすか」を検証し不足を exit 1 | `pnpm exec vitest run scripts/smoke/__tests__/verify-mint-env-contract.spec.ts`（V-1 / missing_env） | missing_env ケースで `exitCodeForViolations` が 1 |
| AC-7 | gate が provision カバー集合と mint 要求 env の整合（provision_gap）を検証 | 同上（V-3 / provision_gap） | provision 不足ケースで provision_gap violation + exit 1 |
| AC-8 | `verify-mint-env-contract.yml` が PR/push で gate を実行し drift で fail | `actionlint .github/workflows/verify-mint-env-contract.yml` + workflow 構造目視（on.pull_request.paths / push branches / run: tsx ...mts） | actionlint PASS + 構造一致 |
| AC-9 | provision script が JWT-mint 集合を 1Password 参照で provision し inventory が必須集合を含む | `bash -n scripts/smoke/provision-staging-secrets.sh` + `shellcheck ...` + gate V-3（provision_gap 0） | 構文 OK + shellcheck 新規 warning 0 + `SECRETS` が JWT-mint 5 件を含む（gate で provision_gap が出ない） |
| AC-10 | degrade 時に必須 env 不足を warn 扱い・該当 job を fallback/skip して CI 全体 fail させない | `pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts`（T-CLI-09: degrade → exit 0 + `mint_degraded=1`）+ §9.1.3 D-2〜D-4 の `if` 配線目視 + actionlint | mint degrade ケースで exit 0・`mint_degraded=1` 出力。bulk-tag 後続 step に `if: env.RUNTIME_SMOKE_MINT_DEGRADED != '1'` が付与され degrade 時 job が fail しない |
| AC-11 | production には degrade 非適用（`RUNTIME_SMOKE_MINT_DEGRADE` 未設定 = hard-fail 維持） | `pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts`（T-CLI-10/12: degrade 未設定で exit 2）+ §9.1.4 目視 | degrade 未設定（または `'0'`）で env 欠落時 exit 2。production workflow に `RUNTIME_SMOKE_MINT_DEGRADE` 無し |
| AC-12 | 既存テスト（`mint-staging-bearers.spec.ts` 既存ケース・`-self-verify.spec.ts`）全 PASS（後方互換） | `pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts`（T-A1〜T-A8） | 既存ケース全 PASS。`smoke` job 無改修で既定 admin,me 動作維持 |

> **FB-UI-02-1（PASS 基準の明示）遵守**: 各 AC 行は「曖昧語」を避け、exit code / 出力キーの有無 / violation 件数 / actionlint PASS など機械判定可能な基準で記述した。

---

## 9.5 QA 実行順序（推奨）

1. `pnpm typecheck` → 型不整合（新 export 型・gate 型）を最初に潰す。
2. `pnpm lint` → 静的違反。
3. `actionlint`（2 workflow）→ YAML/式構文。
4. `bash -n` + `shellcheck`（provision）→ shell 構文/lint。
5. vitest（mint + gate + self-verify）→ 振る舞い。
6. §9.4 チェックリストを上から PASS 基準で照合し、未達があれば該当 Phase（4/5=A・6/7=B・8=C）へ差し戻す。

---

## 9.6 入力・出力・副作用（CONST_005）

| 区分 | 内容 |
|------|------|
| 入力 | 変更済みソース（`mint-staging-bearers.mts` / `verify-mint-env-contract.mts` / `provision-staging-secrets.sh` / `runtime-smoke-staging.yml` / `verify-mint-env-contract.yml`）+ 既存テスト spec |
| 出力 | typecheck/lint/actionlint/shellcheck/vitest の PASS/FAIL 判定とログ（Phase 11 証跡へ転記） |
| 副作用 | **なし**（全コマンドが read-only 静的検証 + ローカルテスト）。実 secret 投入・実 deploy・実 D1 mutation は含まない（user-gated / Phase 13 以降） |
| 非露出保証 | テスト・lint・actionlint いずれも実 secret 値を扱わない。mint テストはダミー env で JWT を生成し、出力に値が漏れないことを T-CLI-08 が能動検証 |

---

## 9.7 DoD（完了条件 / Phase 9）

- [ ] §9.1 で Lane-1 残課題（degrade → 後続 verify fail）を **案1 採用**として確定し、D-1〜D-5 の workflow 差分（どの step に `if` を足すか・degrade marker 伝播）を固定した
- [ ] §9.1.4 で production 非適用（AC-11）が degrade 整合後も維持されることを確認した
- [ ] §9.2 の一括品質ゲート 6 コマンドが全て副作用なしで定義され、実 secret/deploy を含まない
- [ ] §9.3 で mirror parity が本タスクで N/A（skill 本体非変更）であり、Phase 12 で台帳同期 + indexes:rebuild 冪等を行う旨を確定した
- [ ] §9.4 で AC-1〜AC-12 全件に検証コマンドと機械判定可能な PASS 基準を割り当てた（FB-UI-02-1）
- [ ] degrade 整合の状態所有権（判定=mint script / skip 判定=workflow）が phase-2 §2.7 と矛盾しない

---

## 9.8 不変条件（既存維持）

1. JWT 文字列・secret 値を console/stdout/log/エラーメッセージに出さない（env 名のみ）。
2. QA は全て read-only 静的検証 + ローカルテスト。実 secret 投入・実 deploy・実 D1 mutation は user-gated（Phase 13 以降）で本 phase は行わない。
3. degrade は staging 限定。production には適用しない（AC-11）。
4. `RUNTIME_SMOKE_MINT_DEGRADE`（入力フラグ）と `RUNTIME_SMOKE_MINT_DEGRADED`（marker 結果 env）を名前で分離し、入力と結果を取り違えない。
5. 本タスクは CI/script のみ。`apps/*` のランタイムコードは変更しない（CLAUDE.md 不変条件 #5）。
