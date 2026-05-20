# Phase 12: ドキュメント更新

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> 実装区分: **条件付き実装仕様書** (CONST_005 / CONST_007)

---

## Phase 12 strict 7 成果物（task-specification-creator 規約 / issue-717 と同一規約）

`outputs/phase-12/` 配下に以下 7 ファイルを **必ず実体化** する。順序・命名厳守。

| Task | 成果物 | 概要 |
|---|---|---|
| 12-1 | `outputs/phase-12/main.md` | Phase 12 全体サマリ + 4 条件 verdict |
| 12-2 | `outputs/phase-12/implementation-guide.md` | 後続実装エージェント向けの実装手順（Phase 5 を簡潔に要約 + Part 1 中学生レベル概念説明） |
| 12-3 | `outputs/phase-12/system-spec-update-summary.md` | `deployment-secrets-management.md` / source unassigned trace の正本同期サマリ |
| 12-4 | `outputs/phase-12/documentation-changelog.md` | 本 cycle のドキュメント変更履歴 |
| 12-5 | `outputs/phase-12/unassigned-task-detection.md` | 後続 unassigned-task（実 OIDC 切替 / 実 staging proof / 実 production cutover / legacy token 物理失効） |
| 12-6 | `outputs/phase-12/skill-feedback-report.md` | skill feedback / template・workflow・docs 改善点 |
| 12-7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | task-specification-creator compliance verdict |

補助ファイルとして `secrets-boundary-current.md` / `future-oidc-supported-path.md` / `claim-pin-verifier-spec.md` / `redaction-pattern-update.md` / `observation-window-runbook.md` も同時に実体化する。

---

## Task 12-1: implementation-guide.md

### Part 1: 中学生レベル概念説明（task-specification-creator 規約必須）

1. **OIDC とは何か（入館証 vs マスターキー）** — long-lived API Token は「マスターキー」、OIDC token は「1 時間だけ有効な紙の入館証」。
2. **subject claim pin とは（入館証の発行ルール）** — 紙の入館証に「どのリポジトリの・どのブランチから発行されたか」を書き、Cloudflare 側で許可条件と完全一致するかを確認する仕組み。
3. **observation window とは（cutover 後の見張り期間）** — 切替直後に「古い経路（legacy token）が誤って起動していないか」を一定期間確認し、0 件であれば legacy 経路を物理的に消す段階に進める。

### Part 2: 技術詳細（後続実装エージェント向けの実装手順サマリ）

| Step | 対象 | 操作 |
|---|---|---|
| S1 | `scripts/oidc/verify-claim-pin.sh` 新規作成 | Phase 2 §2.1 構造に従い、`EXPECTED_REPOSITORY` / `ALLOWED_REFS` / `ALLOWED_ENVIRONMENTS` / `EXPECTED_EVENT_NAME` を固定値で実装。dry-run only |
| S2 | `scripts/redaction-check.sh` 編集 | Phase 2 §2.2 の JWT regex + `cloudflare-aud` literal を既存 `LEAK_FOUND` フローに OR 合算 |
| S3 | `.github/workflows/oidc-observation-window.yml` 新規作成 | Phase 2 §2.3 のテンプレート通り。`workflow_dispatch` only / `permissions: contents: read` のみ |
| S4 | `.github/workflows/web-cd.yml` 編集 | Phase 2 §2.4 のコメント文言を staging / production 両 job に **完全一致** で追加 |
| S5 | `deployment-secrets-management.md` 編集 | Phase 2 §2.5 の future supported path gate G1-G4 + current safe baseline セクションを追記 |
| S6 | `pnpm indexes:rebuild` | reference doc 編集を skill indexes に反映（CI `verify-indexes-up-to-date` gate） |

### 不変条件

- `.github/workflows/web-cd.yml` の deploy 挙動を変更しない。
- `permissions: id-token: write` を本サイクルで付与しない。
- OIDC token 値・JWT 実値・Account ID を成果物に記録しない。

---

## Task 12-2: secrets-boundary-current.md

### 現行 step-scoped `CLOUDFLARE_API_TOKEN` boundary

```
GitHub Repository Secrets (long-lived)
  └─ CLOUDFLARE_API_TOKEN  ← 寿命: 明示失効まで
       │
       └─ .github/workflows/web-cd.yml の deploy step (step-scoped env:)
            │
            └─ cloudflare/wrangler-action → wrangler deploy
                 │
                 └─ Cloudflare Workers (staging / production)
```

### 保持理由（2026-05-17 時点）

- Cloudflare 公式 OIDC deploy support が未確認のため、speculative な OIDC exchange を入れると trust boundary 不明 + rollback path 不全になる。
- legacy token 物理失効は observation window 完了まで blocked（rollback path 温存必須）。
- step-scoped による blast radius 限定は Issue #640 で達成済み。本サイクルはその上に redaction 拡張・claim pin dry-run helper を載せる。

### 本サイクル追加要素（既存 boundary を破壊しない）

- `scripts/oidc/verify-claim-pin.sh` — boundary 外（local / CI dry-run のみ）。実 token を発行しない。
- `scripts/redaction-check.sh` 拡張 — deploy log に対する後段防御線。boundary 内・外を問わず適用。
- `.github/workflows/oidc-observation-window.yml` — boundary に未接続（no-op verifier）。

---

## Task 12-3: future-oidc-supported-path.md

### G1-G4 ゲート（後続サイクル）

| Gate | 条件 | 担当 | evidence 候補 |
|---|---|---|---|
| G1 | Cloudflare docs / wrangler-action release notes が input 名 / audience / exchange endpoint / rollback path を明示 | 後続サイクル primary-source revalidation | 公式 URL + 取得タイムスタンプ |
| G2 | staging job で OIDC proof 取得 → `scripts/redaction-check.sh` PASS + `scripts/oidc/verify-claim-pin.sh` PASS | issue-717-followup-001 後続 | redacted deploy log + dry-run log |
| G3 | production cutover（subject claim: `repo=daishiman/UBM-Hyogo, ref=refs/heads/main, environment=production, event_name=push`） | issue-717-followup-001 後続 | production deploy run URL（redacted）|
| G4 | observation window で fallback 起動 0 件確認後、legacy token 物理失効 | `docs/30-workflows/issue-718-legacy-cf-token-revocation` | observation-window-runbook.md 判定結果 |

### exchange 経路（G1 確認後に確定する）

```
GitHub OIDC Provider
  └─ id-token (JWT, audience=cloudflare, subject=repo:daishiman/UBM-Hyogo:...)
       │
       └─ Cloudflare OIDC exchange endpoint（G1 で確定）
            │
            └─ Cloudflare short-lived credential (寿命: 数分〜1時間)
                 │
                 └─ wrangler deploy
```

### rollback path（必須）

- G2/G3 失敗時 → workflow を 1 commit revert し、step-scoped `CLOUDFLARE_API_TOKEN` 経路に即時戻す。
- G4 完了まで legacy token を残置（physical revocation は G4 後に `docs/30-workflows/issue-718-legacy-cf-token-revocation` で実施）。

---

## Task 12-4: claim-pin-verifier-spec.md

### CLI

```
scripts/oidc/verify-claim-pin.sh \
  --repository <owner/repo> \
  --ref <refs/heads/main | refs/heads/dev> \
  --environment <production | staging> \
  --event-name <push>
```

### exit code 表

| exit | 意味 | 出力先 |
|---|---|---|
| 0 | 4 軸全一致 + ref/environment 対応一致 | stdout: `PASS: subject claim pin verified (repository=..., ref=..., environment=..., event_name=...)` |
| 1 | claim mismatch（1 件以上） | stderr: `MISMATCH <field>: expected=<val>, got=<val>` を mismatch ごとに 1 行 |
| 2 | 引数欠落 / 不明オプション | stderr: usage 文 |

### ref / environment 対応表

| ref | environment | event_name | 判定 |
|---|---|---|---|
| `refs/heads/main` | `production` | `push` | PASS |
| `refs/heads/dev` | `staging` | `push` | PASS |
| 上記以外 | — | — | mismatch（後続実切替時に追加） |

### 副作用

なし（外部 API 呼び出し・OIDC token 発行・ファイル書き込みを行わない）。

### 同期ルール

- 本 spec の `EXPECTED_*` 値と script の `EXPECTED_*` 変数を 1:1 で対応させる。
- repo 移管 / ブランチ戦略変更時は本 spec + script + `deployment-secrets-management.md` を **同時** 更新する。

---

## Task 12-5: redaction-pattern-update.md

### 追加パターン

| pattern id | regex / literal | 検出時挙動 |
|---|---|---|
| jwt | `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` | `::error::JWT-like token detected in log` + masked + 非ゼロ exit |
| cf-aud | literal `cloudflare-aud` | `::error::cloudflare-aud claim detected in log` + masked + 非ゼロ exit |

### 追加根拠

- 後続 OIDC 切替後の deploy log には JWT 形式の id-token と `cloudflare-aud` claim 文字列が混入する可能性がある。切替前に検出パターンを揃えておくことで、初回 staging proof で leak 発覚 → 緊急対応を回避する。

### 適用例

- 入力: `auth: Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ4In0.signature_part` → `::error::JWT-like token detected in log` + 非ゼロ exit。
- 入力: `claim: cloudflare-aud=foo` → `::error::cloudflare-aud claim detected in log` + 非ゼロ exit。

### false positive 回避

- JWT regex は `eyJ` プレフィックス + 2 つの `.` 区切りで限定済 → `pnpm-lock.yaml` の `integrity sha512-...` を誤検出しない。
- `cloudflare-aud` は literal match のため、近似語（例: `cloudflare-audit`）を誤検出する可能性は受容。再現したら本 spec の例外条件に追記。

### 互換性

- 既存 CLI（`--log` / `--account-id` / `--token-value-for-test` / stdin）不変。
- 既存 `LEAK_FOUND` フローに OR で合算するため、既存 ACCOUNT_ID / token-like 検出 regression なし。

---

## Task 12-6: observation-window-runbook.md

### 本サイクル（no-op verifier）

| 手順 | 操作 |
|---|---|
| 1 | GitHub Actions → `oidc-observation-window` → Run workflow |
| 2 | `window_label` に `YYYY-MM-DD-<purpose>` 形式（例: `2026-05-17-dry-run`）を入力 |
| 3 | job `verify` が green になることを確認 |
| 4 | run URL + 結果サマリを `outputs/phase-11/observation-window-dispatch.md` に記録 |

### 後続サイクル（実 verifier 差し替え後）

| 判定項目 | 判定基準 | 失敗時の対応 |
|---|---|---|
| fallback 起動回数 | observation 期間中の `web-cd.yml` step-scoped `CLOUDFLARE_API_TOKEN` 経路 fallback 起動が 0 件 | 1 件でもあれば G4（legacy revocation）を保留 |
| deploy version 突合 | Cloudflare dashboard の deploy version と GitHub Actions run の version が一致 | 不一致は OIDC exchange を疑い、step-scoped 経路に rollback |
| redaction-check | observation 期間中の全 deploy log で `scripts/redaction-check.sh` PASS | leak 検出時は即時 secret rotation |

### 不変条件

- `workflow_dispatch` only（`push` / `schedule` trigger を持たせない）。
- `permissions: contents: read` のみ。
- 後続サイクルで実 verifier に差し替える際は、本 runbook の判定基準を script に落とし込む。

---

## Task 12-7: unassigned-task-detection.md

### 検出対象（最低 3 件 — task-specification-creator 規約）

| ID | タスク名 | 検出理由 | 実施先候補 |
|---|---|---|---|
| 1 | 実 OIDC 切替（`.github/workflows/web-cd.yml` への `id-token: write` 付与 + exchange step 追加） | Cloudflare 公式 OIDC deploy support が 2026-05-17 時点 unsupported | issue-717-followup-001 後続サイクル（G1 完了後 enable） |
| 2 | 実 staging OIDC proof run | 公式 support 前提のため実行不能 | issue-717-followup-001 後続サイクル（G2） |
| 3 | 実 production OIDC cutover | staging proof + observation 完了を待つ | issue-717-followup-001 後続サイクル（G3） |
| 4 | legacy `CLOUDFLARE_API_TOKEN` 物理失効 | observation window 完了まで rollback path 温存必須 | `docs/30-workflows/issue-718-legacy-cf-token-revocation`（既存 unassigned task）/ G4 後 enable |
| 5 | `apps/api` 側 D1 token cutover | application layer 別スコープ | `issue-717-followup-002-apps-api-d1-token-cutover`（既存） |
| 6 | 1Password 構造変更 | OIDC 完全移行確定後の参照 path 再編 | `issue-717-followup-003-1password-restructure`（既存） |

### 実行順制約（依存関係）

```
G1 (公式 support 確認) ─▶ 1 (実 OIDC 切替) ─▶ 2 (staging proof) ─▶ 3 (production cutover) ─▶ observation ─▶ 4 (legacy 物理失効)
                                                                                                          │
                                                                                                          ▼
                                                                                                  5/6 は 4 と並行可
```

### 検出ガイダンス（未検出 0 件時の扱い）

- 本サイクルは 6 件検出済み。0 件の場合でも本ファイルを作成し `未検出` と明示する規約に従う。

---

## Phase 12 DoD

- [x] `outputs/phase-12/` 配下に strict 7 ファイルすべて実体化
- [x] Part 1 中学生レベル概念説明が「OIDC」「subject claim pin」「observation window」の 3 観点を平易な例えで説明している
- [x] `claim-pin-verifier-spec.md` の `EXPECTED_*` 値が `scripts/oidc/verify-claim-pin.sh` 実装と 1:1 一致
- [x] `redaction-pattern-update.md` の regex が `scripts/redaction-check.sh` 実装と完全一致
- [x] `unassigned-task-detection.md` に最低 3 件（本サイクルは 6 件）と実施先候補が記載
- [x] `deployment-secrets-management.md` 反映後に `pnpm indexes:rebuild` を実行（CI `verify-indexes-up-to-date` gate）
- [x] OIDC token 値・JWT 実値・Account ID が成果物に含まれない
- [x] 7 ファイル間の cross-reference 整合性（claim 4 軸値・G1-G4 順序・unassigned 6 件）が一致
