# Phase 1: 要件定義

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> task classification: code task (shell script + workflow YAML + reference doc)
> visual classification: NON_VISUAL
> 実装区分: **条件付き実装仕様書** (CONST_005 必須項目すべて含む / CONST_007 1サイクル完了スコープ)

---

## 1. 真の論点

- 現象: 親 Issue #717 で OIDC 完全移行は formalize されたが、Cloudflare 公式 OIDC deploy support が unsupported のため `.github/workflows/web-cd.yml` 本体は未変更で long-lived API Token に依存し続けている。
- 主問題: 「公式 support 待ち」を理由に周辺強化（subject claim pin の事前検証手段、OIDC token redaction の防御線、observation window の CI gate 雛形、正本 reference 同期）まで止めると、公式 support 確認直後に staging proof / production cutover を安全に開始できない。
- why now: Issue #717 が verified_current_no_code_change で closed されたタイミングで、公式 support 確認 → staging proof → production cutover の道筋を未だ unassigned-task 1 ファイル分しか持っていない。本サイクルで周辺強化と一次情報再検証を formalize しておくと、Cloudflare 側 unblock 時のリードタイムが最小化される。
- why this way: 実 OIDC 切替は trust boundary 不明 / rollback path 不全 / observation 不能のため speculative 実装を禁止する。一方、周辺強化 5 件は公式 support 状況に依存せず単独で価値を持ち、後続実切替時に Phase 11 evidence の収集テンプレートとしても機能する。

## 2. P50 チェック結果

| 項目 | 結果 |
|---|---|
| current branch に実装が存在する | No（周辺強化 5 件は未実装） |
| upstream（dev / main）にマージ済み | No |
| 前提タスク完了 | Yes（Issue #717 verified_current_no_code_change で closed） |
| Cloudflare 公式 OIDC deploy support | No（2026-05-17 時点で unsupported / `cloudflare/wrangler-action#402` OPEN） |

→ `implementation_mode: "conditional_implementation_with_peripheral_hardening"` / `implementationCategory: "conditional"`

## 3. 背景

### 3.1 Issue #717 完了時点との差分

Issue #717 (`issue-717-oidc-cf-full-migration`) は公式 support 未確認のまま `verified_current_no_code_change_pending_pr` で closed。`.github/workflows/web-cd.yml` は line 44 / 89 で `secrets.CLOUDFLARE_API_TOKEN` を step-scoped に使う構造を維持し、`permissions: id-token: write` は未付与（`permissions: contents: read` のみ）。`scripts/redaction-check.sh` は API Token / Account ID redaction を gate 化済みだが、JWT 形式 (`eyJ...`) や `cloudflare-aud` claim 文字列はパターン未対応。

### 3.2 周辺強化を今サイクルで実装する根拠

- subject claim pin（`repository` / `ref` / `environment` / `event_name`）の正しさは Cloudflare 側 unblock 前にも `gh api` / `act` / 静的検証で確認可能。dry-run helper script があれば後続実切替 PR で実値検証の前段ガードとして再利用できる。
- 後続 OIDC 切替後の deploy log には JWT token と `cloudflare-aud` claim が混入し得るため、redaction 検出パターンを **切替前** に拡張しておくと「初回 staging proof で leak 発覚 → 緊急対応」を回避できる。
- observation window の fallback 起動 0 件確認は manual gate として運用するが、workflow_dispatch only の雛形を先に置いておくと、staging proof 後の確認手順が標準化される。
- 正本 reference (`deployment-secrets-management.md`) に future supported path gate を明文化すると、後続実装エージェントが Phase 1 で参照すべき正本が確定する。

### 3.3 後続サイクル送りの根拠

- 実 `id-token: write` 付与 + exchange step 実装は公式 docs / `wrangler-action#402` closed-as-released を一次情報で確認した後に着手しないと、undocumented endpoint 依存になる。
- 実 staging proof は支援が必要（公式 input 名 / audience / endpoint）。
- 実 production cutover は staging proof + observation 完了を待つ。
- legacy token 物理失効は `docs/30-workflows/issue-718-legacy-cf-token-revocation` が所有し、observation 完了まで blocked 維持。

## 4. 機能要件

- F-1: `scripts/oidc/verify-claim-pin.sh` を新規作成し、subject claim 4 軸（`repository` / `ref` / `environment` / `event_name`）の期待値を引数で受け取り、固定値（`daishiman/UBM-Hyogo` / `refs/heads/main` or `refs/heads/dev` / `production` or `staging` / `push`）と一致しなければ非ゼロ exit する。実 OIDC token 発行・外部呼び出しは行わない。
- F-2: `scripts/redaction-check.sh` を編集し、(a) `eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}` で始まる JWT 形式パターン、(b) 文字列 `cloudflare-aud` を含む行、の 2 件を leak として検出する。既存 exit semantics（leak あり=非ゼロ）を破壊しない。
- F-3: `.github/workflows/oidc-observation-window.yml` を新規作成し、`workflow_dispatch` only / `push` `schedule` trigger なし / no-op verifier step（`echo "observation window manual gate (no-op)"` 相当）として配置する。後続実切替 PR で fallback 起動 0 件を確認する正規 gate となる雛形。
- F-4: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` に future supported path gate（G1: 公式 input 名 / audience / exchange endpoint 明示、G2: staging proof 取得、G3: production cutover、G4: observation 完了後 legacy revocation）を追記し、本サイクルで実切替を行わない根拠と周辺強化の位置付けを正本反映する。
- F-5: `.github/workflows/web-cd.yml` に「step-scoped `secrets.CLOUDFLARE_API_TOKEN` が current safe baseline である根拠」をコメントで追加する（deploy step `env:` 直前など）。コード挙動は不変。
- F-6: 既存 step-scoped `secrets.CLOUDFLARE_API_TOKEN` 経路を current runtime contract として維持し、rollback path を壊さない。

## 5. 非機能要件

| 観点 | 要件 |
|---|---|
| セキュリティ | speculative OIDC exchange を実装しない。redaction 拡張は false negative を増やさない（false positive は許容） |
| 運用 | `verify-claim-pin.sh` は dry-run only、副作用なし。`oidc-observation-window.yml` は `workflow_dispatch` only で自動起動しない |
| CI 実行時間 | 既存 `web-cd` の deploy 時間は不変。新規 `oidc-observation-window.yml` は manual のみ。`actionlint` 対象 +1 ファイル |
| 互換性 | `scripts/cf.sh` の `CLOUDFLARE_API_TOKEN` env var 名と `redaction-check.sh` の CLI 互換性を維持 |
| 観測性 | OIDC token 値・JWT 実値・Cloudflare Account ID を成果物に残さない。`outputs/phase-11/` の一次情報サマリは 2026-05-17 時点の URL + 取得タイムスタンプのみ |
| trust boundary 明示 | `id-token: write` は本サイクルで付与しない |

## 6. スコープ確定（CONST_007）

### 含む（in-scope）

- `scripts/oidc/verify-claim-pin.sh` 新規（subject claim 4 軸 dry-run 検証）
- `scripts/redaction-check.sh` 編集（JWT パターン + `cloudflare-aud` claim 検出）
- `.github/workflows/oidc-observation-window.yml` 新規（manual dispatch only / no-op verifier）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` 編集（future supported path gate 追記）
- `.github/workflows/web-cd.yml` 編集（根拠コメント追加のみ、挙動不変）
- Phase 1-13 成果物・`outputs/phase-{11,12,13}/` の実体化

### 含まない（out-of-scope / CONST_007 例外）

- `.github/workflows/web-cd.yml` の `permissions: id-token: write` 付与
- OIDC exchange step 追加 / `wrangler-action` の OIDC 切替
- 実 staging OIDC proof run
- 実 production OIDC cutover
- legacy `CLOUDFLARE_API_TOKEN` 物理失効（`docs/30-workflows/issue-718-legacy-cf-token-revocation` 所有）
- 1Password 構造変更（`issue-717-followup-003` 所有）
- `apps/api` D1 token cutover（`issue-717-followup-002` 所有）

## 7. 変更対象ファイル一覧（CONST_005 必須）

| パス | 種別 | 概要 |
|---|---|---|
| `scripts/oidc/verify-claim-pin.sh` | 新規（shell） | subject claim 4 軸の dry-run 検証 helper |
| `scripts/redaction-check.sh` | 編集 | JWT パターン + `cloudflare-aud` claim 検出を追加 |
| `.github/workflows/oidc-observation-window.yml` | 新規（YAML） | manual dispatch only / no-op verifier 雛形 |
| `.github/workflows/web-cd.yml` | 編集（コメントのみ） | step-scoped token が current safe baseline である根拠コメント |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | future supported path gate G1-G4 と周辺強化の正本反映 |
| `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/outputs/phase-11/` | 新規 | 公式 support 一次情報再検証（2026-05-17 時点）+ 周辺強化 dry-run evidence |
| `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/outputs/phase-12/` | 新規 | strict 7 outputs（spec 同期 / unassigned 検出 等） |
| `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/outputs/phase-13/` | 新規 | PR body 草稿 |
| `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md` | 編集（参照更新） | 本サイクルで周辺強化を実装した旨を追記 |

## 8. 主要関数・型・スクリプトのシグネチャ

### 8.1 `scripts/oidc/verify-claim-pin.sh`

```
usage: scripts/oidc/verify-claim-pin.sh \
  --repository <owner/repo> \
  --ref <refs/heads/main | refs/heads/dev> \
  --environment <production | staging> \
  --event-name <push>

exit:
  0  → 全 4 claim が固定値と一致
  1  → claim mismatch（mismatch 内容を stderr に出力）
  2  → 引数エラー
```

入力: CLI 引数 4 件。
出力: 検証結果サマリ（stdout）+ mismatch 詳細（stderr）。
副作用: なし（read-only / 外部呼び出しなし / token 発行なし）。

### 8.2 `scripts/redaction-check.sh` 追加パターン

| pattern id | regex / literal | 検出時の挙動 |
|---|---|---|
| jwt | `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` | `::error::JWT-like token detected in log` + masked 出力 + 非ゼロ exit |
| cf-aud | 文字列 `cloudflare-aud` を含む行 | `::error::cloudflare-aud claim detected in log` + masked 出力 + 非ゼロ exit |

既存 ACCOUNT_ID / token-like long string 検出と OR で合算。1 件でも検出時 `LEAK_FOUND=1`。

### 8.3 `.github/workflows/oidc-observation-window.yml`

```yaml
name: oidc-observation-window
on:
  workflow_dispatch:
    inputs:
      window_label:
        description: 'observation label (e.g., 2026-06-staging-proof)'
        required: true
        type: string
permissions:
  contents: read
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: No-op observation gate (manual)
        run: |
          echo "observation window manual gate: ${{ inputs.window_label }}"
          echo "TODO(後続サイクル): fallback 起動回数 0 件確認 / deploy version 突合"
```

副作用: なし。後続実切替 PR で実 verifier に差し替える前提の雛形。

## 9. 入力・出力・副作用の定義

| 対象 | 入力 | 出力 | 副作用 |
|---|---|---|---|
| `verify-claim-pin.sh` | CLI 引数 4 件 | stdout: PASS サマリ / stderr: mismatch | なし |
| `redaction-check.sh`（拡張後） | `--log <path>` / `--account-id` / `--token-value-for-test` / stdin | leak 検出時 `::error::` + masked 行 | `mktemp` 一時ファイル（trap で削除） |
| `oidc-observation-window.yml` | `workflow_dispatch.inputs.window_label` | echo のみ | なし |
| `web-cd.yml` コメント追加 | — | — | なし（YAML semantics 不変） |
| `deployment-secrets-management.md` 編集 | — | — | なし |

## 10. テスト方針（CONST_005 必須）

| 対象 | 追加テスト | ケース |
|---|---|---|
| `verify-claim-pin.sh` | `scripts/oidc/__tests__/verify-claim-pin.spec.sh`（plain bash spec / shellspec / plain bash いずれでも可。リポジトリ既存スタイルに準拠） | (1) 4 軸完全一致 → exit 0 / (2) repository mismatch → exit 1 / (3) ref mismatch → exit 1 / (4) environment mismatch → exit 1 / (5) event_name mismatch → exit 1 / (6) 引数欠落 → exit 2 |
| `redaction-check.sh` 拡張 | 既存テスト（存在する場合は同居）+ 新規 fixture | (a) JWT 含む log → 非ゼロ exit / (b) `cloudflare-aud` 文字列含む log → 非ゼロ exit / (c) クリーン log → exit 0 / (d) 既存 ACCOUNT_ID leak ケース regression PASS |
| `oidc-observation-window.yml` | `actionlint` | YAML syntax + GitHub Actions schema 適合 |
| `web-cd.yml` | `actionlint` | コメント追加後も既存 schema 適合 |
| reference doc | markdown lint（lefthook 既存設定） | 構造崩れなし |

## 11. ローカル実行・検証コマンド

```bash
# claim pin dry-run（PASS 例）
bash scripts/oidc/verify-claim-pin.sh \
  --repository daishiman/UBM-Hyogo \
  --ref refs/heads/main \
  --environment production \
  --event-name push

# claim pin dry-run（FAIL 例: ref mismatch）
bash scripts/oidc/verify-claim-pin.sh \
  --repository daishiman/UBM-Hyogo \
  --ref refs/heads/feature/foo \
  --environment production \
  --event-name push
# → exit 1, stderr に mismatch 内容

# redaction-check 拡張（JWT 検出）
printf 'auth: Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ4In0.signature_part\n' | bash scripts/redaction-check.sh
# → 非ゼロ exit

# redaction-check 拡張（cloudflare-aud 検出）
printf 'claim: cloudflare-aud=foo\n' | bash scripts/redaction-check.sh
# → 非ゼロ exit

# actionlint（CI 等価）
actionlint .github/workflows/oidc-observation-window.yml .github/workflows/web-cd.yml

# observation window workflow の manual dispatch（後続サイクル）
gh workflow run oidc-observation-window.yml -f window_label=2026-06-staging-proof
```

## 12. 受入条件（DoD 抜粋）

### 機能 DoD

- [ ] `scripts/oidc/verify-claim-pin.sh` が PASS / mismatch / 引数エラーで規定 exit code を返す
- [ ] `scripts/redaction-check.sh` が JWT 形式・`cloudflare-aud` claim を検出し非ゼロ exit する
- [ ] `.github/workflows/oidc-observation-window.yml` が `workflow_dispatch` only で `actionlint` PASS
- [ ] `.github/workflows/web-cd.yml` の deploy 挙動が不変（diff はコメント追加のみ）
- [ ] `deployment-secrets-management.md` に future supported path gate G1-G4 が追記されている

### 品質 DoD

- [ ] OIDC token / JWT 実値 / Account ID / Secret 値が成果物・log・コミットに含まれない
- [ ] `pnpm typecheck` / `pnpm lint` / `actionlint` 全 PASS
- [ ] `redaction-check.sh` の既存 ACCOUNT_ID leak 検出ケースが regression なし
- [ ] `verify-claim-pin.sh` の追加テストが PASS

### ドキュメント DoD

- [ ] `outputs/phase-11/cloudflare-oidc-support-revalidation-2026-05-17.md` に Cloudflare docs / `wrangler-action#402` の 2026-05-17 時点状態が一次情報として記録されている
- [ ] `outputs/phase-12/` strict 7 outputs が揃っている
- [ ] `outputs/phase-12/unassigned-task-detection.md` で実 OIDC 切替・実 staging proof・実 production cutover・legacy token revocation の実行順制約が明示
- [ ] `outputs/phase-12/system-spec-update-summary.md` に正本同期対象（`deployment-secrets-management.md`）が列挙
- [ ] `outputs/phase-13/pr-body-draft.md` が `index.md` / `phase-1` / `phase-12` の主要見出しを反映

## 13. 既存命名規則

- shell script: kebab-case + `.sh`（`verify-claim-pin.sh`）。配置は `scripts/oidc/` 配下
- workflow file: kebab-case + `.yml`（`oidc-observation-window.yml`）
- workflow job 名: kebab-case（`verify`）
- secret 名: SCREAMING_SNAKE_CASE
- subject claim キー: 小文字（`repository` / `ref` / `environment` / `event_name`）

## 14. カテゴリ別 task 分類記録

- task classification: conditional code task（公式 support 確認までは `web-cd.yml` の deploy 挙動を変更しないが、周辺強化 5 件は実コード変更）
- visual classification: NON_VISUAL（CI/CD security surface 改修のみ）
- Phase 11 → 一次情報再検証（2026-05-17 時点）+ 周辺強化 dry-run evidence で代替
