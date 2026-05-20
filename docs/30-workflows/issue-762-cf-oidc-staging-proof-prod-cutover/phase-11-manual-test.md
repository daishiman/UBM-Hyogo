# Phase 11: 手動テスト（NON_VISUAL）

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> 実装区分: **条件付き実装仕様書** (CONST_005 / CONST_007)

---

## NON_VISUAL 宣言

| 項目 | 内容 |
|---|---|
| タスク種別 | CI/CD security surface 改修（OIDC 切替準備 周辺強化） |
| 非視覚的理由 | UI/UX 変更なし。対象は shell script / GitHub Actions workflow YAML / reference markdown のみ |
| 代替証跡 | `outputs/phase-11/` 配下に primary-source revalidation + 周辺強化 dry-run evidence |
| screenshot 不要根拠 | Web UI / DOM / CSS / 画面遷移に一切差分が発生しない（`apps/web` / `apps/api` 配下を変更しない） |

## 1. 証跡の主ソース

| 主ソース | 役割 | 状態 |
|---|---|---|
| `outputs/phase-11/cloudflare-oidc-support-revalidation-2026-05-17.md` | Cloudflare Workers GitHub Actions docs / `wrangler-action#402` の 2026-05-17 時点一次情報再検証 | required |
| `outputs/phase-11/verify-claim-pin-dry-run.log` | `scripts/oidc/verify-claim-pin.sh` の PASS / mismatch / 引数エラー 各 exit path ログ | required |
| `outputs/phase-11/redaction-check-extension.log` | `scripts/redaction-check.sh` 拡張の JWT / `cloudflare-aud` 検出 evidence | required |
| `outputs/phase-11/local-verification-summary.md` | tracked canonical evidence（shell spec / shellcheck / actionlint / grep / artifacts parity / indexes rebuild） | required |
| `outputs/phase-11/observation-window-dispatch.md` | `oidc-observation-window.yml` の user-gated dispatch 境界と local static verification 記録 | required |
| `outputs/phase-11/web-cd-comment-diff.md` | `web-cd.yml` のコメント追加が deploy 挙動を変えていないことの diff evidence | required |
| `.github/workflows/web-cd.yml` | deploy 挙動不変（コメント追加のみ） | no semantic diff |

## 2. 今回作成しない証跡

| 予約成果物 | 今回作成しない理由 |
|---|---|
| `outputs/phase-11/staging-oidc-deploy.log` | Cloudflare 公式 OIDC deploy support 未確認のため実走しない |
| `outputs/phase-11/production-oidc-deploy.log` | 後続サイクル（公式 support 確認後） |
| `outputs/phase-11/legacy-token-revocation.log` | `docs/30-workflows/issue-718-legacy-cf-token-revocation` 所有・observation 完了まで blocked |
| 実 OIDC token サンプル / `cloudflare-aud` 実値 | 不変条件により成果物に残さない |

## 3. 手動検証項目

### 3.1 `scripts/oidc/verify-claim-pin.sh` 各 exit path

| ケース | コマンド | 期待 exit code | 期待 stdout/stderr |
|---|---|---|---|
| C1 PASS (production) | `bash scripts/oidc/verify-claim-pin.sh --repository daishiman/UBM-Hyogo --ref refs/heads/main --environment production --event-name push` | 0 | stdout に `PASS: subject claim pin verified` |
| C2 PASS (staging) | `bash scripts/oidc/verify-claim-pin.sh --repository daishiman/UBM-Hyogo --ref refs/heads/dev --environment staging --event-name push` | 0 | stdout に `PASS: subject claim pin verified` |
| C3 repository mismatch | `bash scripts/oidc/verify-claim-pin.sh --repository attacker/evil --ref refs/heads/main --environment production --event-name push` | 1 | stderr に `MISMATCH repository: expected=daishiman/UBM-Hyogo, got=attacker/evil` |
| C4 ref mismatch | `bash scripts/oidc/verify-claim-pin.sh --repository daishiman/UBM-Hyogo --ref refs/heads/feature/foo --environment production --event-name push` | 1 | stderr に `MISMATCH ref: ...` |
| C5 environment mismatch | `bash scripts/oidc/verify-claim-pin.sh --repository daishiman/UBM-Hyogo --ref refs/heads/main --environment development --event-name push` | 1 | stderr に `MISMATCH environment: ...` |
| C6 event_name mismatch | `bash scripts/oidc/verify-claim-pin.sh --repository daishiman/UBM-Hyogo --ref refs/heads/main --environment production --event-name pull_request` | 1 | stderr に `MISMATCH event_name: ...` |
| C7 引数欠落 | `bash scripts/oidc/verify-claim-pin.sh --repository daishiman/UBM-Hyogo` | 2 | stderr に usage 文 |
| C8 ref/environment 整合性 NG | `bash scripts/oidc/verify-claim-pin.sh --repository daishiman/UBM-Hyogo --ref refs/heads/dev --environment production --event-name push` | 1 | stderr に `MISMATCH ref/environment pair: ...` |

各ケースの実行結果を `outputs/phase-11/verify-claim-pin-dry-run.log` に保存する（実 OIDC token 値は発生しない）。

失敗時の対処:
- exit code が期待と異なる → script 内 `EXPECTED_*` / parse ロジックを Phase 5 で見直す。
- stdout/stderr 文言不一致 → message 文字列を script と Phase 12 `claim-pin-verifier-spec.md` で 1:1 同期する。

### 3.2 `scripts/redaction-check.sh` 拡張パターン適用

| ケース | 入力 fixture | 期待挙動 |
|---|---|---|
| R1 JWT 検出 | `printf 'auth: Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ4In0.signature_part\n'` | 非ゼロ exit + `::error::JWT-like token detected in log` + masked 出力 |
| R2 cloudflare-aud 検出 | `printf 'claim: cloudflare-aud=foo\n'` | 非ゼロ exit + `::error::cloudflare-aud claim detected in log` + masked 出力 |
| R3 クリーンログ | `printf 'Deploying to staging...\nSuccess\n'` | exit 0、leak 検出なし |
| R4 既存 ACCOUNT_ID regression | 既存テスト fixture（ACCOUNT_ID leak 含む） | 非ゼロ exit（既存挙動維持） |
| R5 pnpm-lock integrity hash 誤検出回避 | `printf 'integrity sha512-abc...\n'` | exit 0（JWT regex は `eyJ.*\..*\..*` で限定済のため引っかからない） |

各ケースの実行結果を `outputs/phase-11/redaction-check-extension.log` に保存する。実 deploy log の代替として、上記 fixture を最小再現サンプルとする。

失敗時の対処:
- false negative（leak が検出されない） → regex / literal match を Phase 5 で再点検。
- false positive（クリーンログを leak 判定） → pattern を絞り込み、`outputs/phase-12/redaction-pattern-update.md` の例外条件に追記。

### 3.3 `.github/workflows/oidc-observation-window.yml` の manual dispatch 境界

| 手順 | コマンド / 操作 | 期待結果 |
|---|---|---|
| O1 actionlint 適用 | `actionlint .github/workflows/oidc-observation-window.yml` | exit 0、警告なし |
| O2 user-gated workflow_dispatch | GitHub Actions → `oidc-observation-window` → Run workflow → `window_label=<observation-label>` | commit / push 後、ユーザー明示承認がある場合のみ実行。未実行時は `observation-window-dispatch.md` に local static verification only と記録 |
| O3 push trigger 不在確認 | `grep -E '^on:' -A 20 .github/workflows/oidc-observation-window.yml` で `push:` / `schedule:` が存在しないこと | match なし |
| O4 `permissions` 確認 | `grep -E 'id-token' .github/workflows/oidc-observation-window.yml` | match なし（`contents: read` のみ） |

実行記録（未実行の場合は user-gated 理由 + local static verification、実行済みの場合は dispatch URL / run ID / 結果サマリ）を `outputs/phase-11/observation-window-dispatch.md` に保存する。

失敗時の対処:
- O1 失敗 → YAML syntax を Phase 5 で修正、`name` / `on` / `jobs` 各 key を再点検。
- O2 失敗 → job step の echo 文言が input 参照 (`${{ inputs.window_label }}`) を正しく展開しているか確認。

### 3.4 `.github/workflows/web-cd.yml` コメント追加が deploy 挙動に影響しないこと

| 手順 | コマンド | 期待結果 |
|---|---|---|
| W1 actionlint | `actionlint .github/workflows/web-cd.yml` | exit 0 |
| W2 コメント追加箇所のカウント | `grep -c "NOTE(issue-762)" .github/workflows/web-cd.yml` | `2`（staging / production 両 job に同一文言） |
| W3 deploy step 不変確認 | `git diff origin/dev -- .github/workflows/web-cd.yml` | 差分が **コメント行のみ**。`secrets.CLOUDFLARE_API_TOKEN` step-scoped 構造が不変 |
| W4 permissions 不変確認 | `grep -E 'permissions:' -A 3 .github/workflows/web-cd.yml` | `contents: read` のみ（`id-token: write` 未付与） |
| W5 次回 staging deploy 挙動確認（PR merge 後 dev push 時） | GitHub Actions の `web-cd` run | green、既存 deploy 経路と同等 |

W3 の diff を `outputs/phase-11/web-cd-comment-diff.md` に保存する。

失敗時の対処:
- W2 が `2` 以外 → コメント文言を staging / production で完全一致させる修正を行う。
- W3 でコメント以外の diff → Phase 5 修正を取り消し、最小 diff に戻す。

## 4. 一次情報再検証（Cloudflare 公式 support 状態）

| 検証対象 | URL / 一次情報 | 期待状態（2026-05-17 時点） |
|---|---|---|
| Cloudflare Workers GitHub Actions docs | `https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/` | API Token 方式のみ案内 / OIDC exchange endpoint 未明示 |
| `cloudflare/wrangler-action` Issue #402 | `https://github.com/cloudflare/wrangler-action/issues/402` | OPEN（OIDC support 未リリース） |
| `cloudflare/wrangler-action` README | `https://github.com/cloudflare/wrangler-action#readme` | `apiToken` input のみ documented |

再検証日 + URL + 取得時状態のみを `outputs/phase-11/cloudflare-oidc-support-revalidation-2026-05-17.md` に記録する（token 値・JWT 実値・Account ID は記録しない）。

## 5. なぜスクリーンショットを作らないか

- 変更ファイルは `scripts/` / `.github/workflows/` / `.claude/skills/.../references/` / `docs/` のみで、`apps/web` / `apps/api` 配下を触らない。
- Web UI / DOM / CSS / ルーティング / 状態管理に差分なし。
- 検証対象は exit code / actionlint 適合 / grep カウント / primary-source URL であり、すべてテキスト evidence で代替可能。

## 6. DoD

- [x] §3.1 C1-C8 + unknown option の全 exit path が tracked summary に記録され期待値と一致
- [x] §3.2 R1-R5 の全パターンがログに記録され期待値と一致
- [x] §3.3 O1/O3/O4 を local static verification で確認し、remote dispatch は commit / push 後の user-gated 操作として未実行で記録
- [x] §3.4 W2-W4 を満たし、`web-cd-comment-diff.md` の diff がコメント行のみで構成されている
- [x] §4 の 3 一次情報の 2026-05-17 時点状態が `cloudflare-oidc-support-revalidation-2026-05-17.md` に記録されている
- [x] OIDC token / JWT 実値 / `cloudflare-aud` 実値 / Cloudflare Account ID が成果物・log・コミットに含まれない
