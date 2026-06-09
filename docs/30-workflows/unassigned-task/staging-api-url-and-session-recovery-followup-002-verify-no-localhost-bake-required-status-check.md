# verify-no-localhost-bake を dev/main の required status check に登録 - タスク指示書

```yaml
issue_number: 1146
task_id: staging-api-url-and-session-recovery-followup-002-verify-no-localhost-bake-required-status-check
task_name: verify-no-localhost-bake を dev/main の required status check に登録
category: ガバナンス / ワークフロー整備（CI gate 強制化）
target_feature: GitHub branch protection（dev / main）の required_status_checks.contexts
priority: 中
scale: 小規模
status: consumed
source_phase: staging-api-url-and-session-recovery Phase 10 §MINOR M-2（2回検証で superset 検出）
created_date: 2026-06-03
dependencies: [staging-api-url-and-session-recovery]
```

## メタ情報

| 項目         | 内容                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| タスクID     | staging-api-url-and-session-recovery-followup-002-verify-no-localhost-bake-required-status-check             |
| タスク名     | 新設した `verify-no-localhost-bake` CI workflow を `dev` / `main` の required status check に登録する          |
| 分類         | ガバナンス / ワークフロー整備（CI gate 強制化）                                                                |
| 対象機能     | GitHub branch protection（`dev` / `main`）の `required_status_checks.contexts`                               |
| 優先度       | 中（gate を新設しても必須化しないと localhost 焼き込み回帰を merge ブロックできないため）                       |
| 見積もり規模 | 小規模                                                                                                       |
| ステータス   | consumed（Issue #1146 canonical workflow root へ移行済み。実 `gh api -X PUT` は user-gated）                                                       |
| 発見元       | staging-api-url-and-session-recovery Phase 10 §MINOR M-2（2回検証で superset 検出）                            |
| 発見日       | 2026-06-03                                                                                                   |
| GitHub Issue | [#1146](https://github.com/daishiman/UBM-Hyogo/issues/1146)                                                  |

## 親 / 関連 workflow

- 起点 workflow: `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/`（実装完了済 `implemented_local_evidence_captured`）
- 起点 outputs: `.../outputs/phase-10/phase-10.md`（§MINOR M-2「`verify-no-localhost-bake` を dev/main の required status check に登録（`gh api -X PUT`）」=user-gated・別途）
- 関連実装: `.github/workflows/verify-no-localhost-bake.yml`（`on: pull_request: branches: [main, dev]` で動作するが branch protection の必須チェックには未登録）
- 関連実装: `scripts/verify-no-localhost-bake.sh`（`apps/web/src` / client bundle への `:8787` / `:8888` / `localhost` 焼き込みを検出する grep gate 本体）
- ガバナンス根拠: CLAUDE.md「ブランチ戦略」セクション（solo 運用ポリシー・branch protection 実値を正本とする・required status check 候補追加の前例）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`staging-api-url-and-session-recovery` workflow（Lane C）で、`apps/web/src` および client bundle に `localhost:8787` / `127.0.0.1:8787` / `:8888` などの API エンドポイントが焼き込まれていないことを検出する grep gate `scripts/verify-no-localhost-bake.sh` と、それを CI で走らせる workflow `.github/workflows/verify-no-localhost-bake.yml` を新設した。

この workflow は既に `on: pull_request: branches: [main, dev]`（+ `push: branches: [main, dev]`）で**動作する**。PR を開けば job 自体は実行され、grep gate が違反を検出すれば job は fail する。

ただし、この workflow は GitHub branch protection の `required_status_checks.contexts`（= merge を機械的にブロックする必須チェック集合）には**未登録**である。

### 1.2 問題点・課題

- workflow が「存在し実行される」ことと、「required status check として merge ブロックに強制される」ことは別物である。後者を branch protection で明示登録しない限り、gate が fail しても PR は merge できてしまう（governance gap）。
- solo 運用ポリシー上、品質保証は必須レビューではなく CI（`required_status_checks`）で担保している（CLAUDE.md ブランチ戦略）。required status check に未登録の gate は、この品質保証モデルの保護対象から外れたままになる。
- 親 workflow が解消した「localhost / loopback エンドポイントの client への焼き込み」は、protection に登録しない限り再発した PR をブロックできず、せっかく新設した gate が回帰防止の実効を持たない。

### 1.3 放置した場合の影響

- `apps/web/src` に再び `http://localhost:8787` / `127.0.0.1:8787` 等を焼き込む変更が入っても、`verify-no-localhost-bake` が fail するだけで merge を止められず、`dev` / `main` に回帰が landed する。
- task-18 で「`:8888` 検出を謳いつつ専用 gate script が実在しなかった」のと同型の「gate を作ったが強制されていない」ギャップが、今度は branch protection 層で残る。
- 監査 / governance review 時に「localhost-bake gate は存在するが required check に入っていない」が指摘事項になり、再度 user-gated 操作（branch protection 変更）をやり直すことになる。

---

## 2. 何を達成するか（What）

### 2.1 目的

`verify-no-localhost-bake` job context を `dev` および `main` の branch protection の `required_status_checks.contexts` に追加し、当 gate が fail する PR を merge できないように強制する。

### 2.2 最終ゴール

- `dev` / `main` 両方の branch protection で `required_status_checks.contexts` に `verify-no-localhost-bake` が含まれる。
- 既存の required status check（`audit-correlation-verify / verify` / `verify-design-tokens / verify-design-tokens` / `playwright-smoke / ...` など現状登録済みの全 context）が削除されず保持される。
- `required_pull_request_reviews=null`（solo 運用）/ `lock_branch=false` / `enforce_admins=true` / `required_linear_history` / `required_conversation_resolution` といった他の protection 設定に drift が生じない。
- 操作前後の branch protection JSON を read-only で取得し、追加した context のみが差分であることを before/after で確認できる。

### 2.3 スコープ

#### 含むもの

- `dev` の branch protection `required_status_checks.contexts` への `verify-no-localhost-bake` 追加。
- `main` の branch protection `required_status_checks.contexts` への `verify-no-localhost-bake` 追加。
- 操作前後の read-only JSON evidence 取得（`gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection`）。
- CLAUDE.md ブランチ戦略の required status check 列挙（運用参照）と GitHub 実値の整合確認。

#### 含まないもの

- `verify-no-localhost-bake.yml` / `verify-no-localhost-bake.sh` のロジック変更（gate 本体は既に動作しており改修不要）。
- 他 gate（`audit-correlation-verify` / `verify-design-tokens` / `playwright-smoke` 等）の required check 追加・削除（本タスクは `verify-no-localhost-bake` 1 context に限定）。
- `required_pull_request_reviews` の有効化（solo 運用ポリシーにより `null` を維持）。
- D1 schema / API endpoint / Google Form 仕様変更（親不変条件）。

### 2.4 成果物

- `dev` / `main` の branch protection に追加された `verify-no-localhost-bake` context（実 `gh api -X PUT` は user-gated）。
- before/after の read-only JSON evidence（差分が追加 context のみであることの証跡）。
- 本 follow-up を consumed に更新する記録（実装 workflow 側）。

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 PUT payload による contexts の全体置換リスク（最重要）

`required_status_checks` の `gh api -X PUT` は、`contexts`（または `checks`）配列を**まるごと上書き**する。差分追加 API ではないため、`verify-no-localhost-bake` だけを payload に入れて PUT すると、既存の `audit-correlation-verify` / `verify-design-tokens` / `playwright-smoke` 等が**すべて消える**。必ず先に現状の `contexts` を read-only で取得し、既存項目を全件保持したうえで `verify-no-localhost-bake` を末尾に追加した完全な配列を PUT すること。

### 3.2 branch protection 実値の正本性

CLAUDE.md 上の required status check 列挙は運用参照であり、正本は GitHub 側 branch protection 実値である。`dev` / `main` は protection が独立しているため、**個別に** `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` と `.../branches/main/protection` を実行し、`grep` で `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` の drift が無いことを確認してから contexts を追加する（UT-GOV-001 と同じ手順様式）。

### 3.3 job context 名の正確な一致

required status check の context 名は GitHub Checks の名前と完全一致でなければ強制が効かない（名前がずれると「never run = pending のまま」になり別の意味でブロックしうる）。`verify-no-localhost-bake.yml` の `jobs.verify-no-localhost-bake.name: verify-no-localhost-bake` が context 名となる。matrix を持たない単一 job のため context は `verify-no-localhost-bake` 単独で、`audit-correlation-verify / verify` のような `<workflow> / <job>` 二段形式にはならない点に注意（実際に登録する文字列は read-only before JSON で実行済み run の context 表記を確認して確定する）。

### 3.4 user-gated 境界の厳守

実 `gh api -X PUT`（protection 変更）・commit・push・PR・Issue 起票は CLAUDE.md ブランチ戦略に従い**ユーザー明示承認後のみ**実行する。read-only の `gh api ... /protection` 取得（before evidence）と、追加後の `contexts` 配列を組み立てた PUT payload の**事前提示**までは承認前に可能。承認を得るまで mutation を実行しないこと。

---

## 4. 受入条件 (AC)

- **AC-1**: 操作前に `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` と `.../branches/main/protection` を個別実行し、両 branch の現状 `required_status_checks.contexts` / `required_pull_request_reviews` / `lock_branch` / `enforce_admins` を before evidence として取得している。
- **AC-2**: `dev` の `required_status_checks.contexts` に `verify-no-localhost-bake` が追加されている。
- **AC-3**: `main` の `required_status_checks.contexts` に `verify-no-localhost-bake` が追加されている。
- **AC-4**: dev/main 両方で、追加前に存在した既存 contexts（`audit-correlation-verify` / `verify-design-tokens` / `playwright-smoke` 等の現状登録済み全 context）が削除されずに保持されている（before/after diff が `verify-no-localhost-bake` 追加のみ）。
- **AC-5**: `required_pull_request_reviews=null`（solo 運用）/ `lock_branch=false` / `enforce_admins=true` / `required_linear_history` / `required_conversation_resolution` に drift が無い（after JSON が before と当該項目で一致）。
- **AC-6**: 操作後に `gh api ... /protection` を再取得した after evidence があり、AC-2〜AC-5 を JSON で確認できる。
- **AC-7**: `verify-no-localhost-bake.yml` / `verify-no-localhost-bake.sh` のロジックは未変更（gate 本体は無改修）。
- **AC-8**: 実 `gh api -X PUT` は user-gated として、ユーザー明示承認後にのみ実行されている（承認前は before evidence + PUT payload 提示まで）。

---

## 5. 参照資料

- `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-10/phase-10.md` — §MINOR M-2（本タスクの発見元・user-gated 別途と明記した起点）
- `.github/workflows/verify-no-localhost-bake.yml` — required check に登録する対象 workflow（job context = `verify-no-localhost-bake`）
- `scripts/verify-no-localhost-bake.sh` — grep gate 本体（`:8787` / `:8888` / `localhost` 検出・allowlist 規約）
- CLAUDE.md「ブランチ戦略」 — solo 運用ポリシー / branch protection 実値を正本 / required status check 候補追加の前例（`audit-correlation-verify` / `verify-design-tokens` / `playwright-smoke`）
- CLAUDE.md「Governance / CODEOWNERS」 — `required_pull_request_reviews=null`（require_code_owner_reviews 無効）の運用根拠
- `docs/30-workflows/ut-gov-001-*`（UT-GOV-001 適用時の `gh api .../protection` 個別取得 + `grep` drift 確認手順の前例）

---

## 苦戦箇所【記入必須】

- 対象: `.github/workflows/verify-no-localhost-bake.yml`（job context `verify-no-localhost-bake`）/ GitHub branch protection `dev` / `main`
- 症状（D-1: gate 実在 vs 必須化のギャップ）: task-18 で「`:8888` 検出」を謳いつつ専用 gate script が実在せず、`apps/web/src` の `:8787` / `localhost` 焼き込みを検出できていなかった構造原因がある。本件はその逆で「gate script / workflow は実在し動作する」が「required status check として branch protection に強制登録されていない」。**workflow が存在する**ことと**required status check として強制されている**ことは別物で、後者を branch protection で明示登録しない限り、gate が fail しても merge をブロックできず回帰を防げない。
- 解決粒度（branch protection の正本性）: CLAUDE.md 上の運用記述ではなく GitHub 側 branch protection 実値が正本。`dev` / `main` を**個別に** `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` で取得し、`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` の drift が無いことを確認してから `required_status_checks.contexts` を追加する。
- 解決粒度（PUT payload の全体置換リスク）: `required_status_checks` の `gh api -X PUT` は既存 `contexts` を**上書き**するため、現状 `contexts` を read-only で取得し、既存項目（`audit-correlation-verify` / `verify-design-tokens` / `playwright-smoke` 等）を全件保持したまま `verify-no-localhost-bake` を追加した完全配列を PUT する（既存 gate を消さない）。before/after JSON diff が追加 1 件のみであることで検証する。
- 解決粒度（allowlist 規約の reference 保持）: `verify-no-localhost-bake.sh` の allowlist 規約は再利用のため記録に残す — local fallback 行に限り `// localhost-allow:local-fallback` を**該当行または直前行**に付与した場合のみ許容、client bundle（`.open-next/assets` / `.next/static`）への混入は無条件 fail、`__tests__/` / `*.spec.ts` / `*.spec.tsx` は除外、検出パターンは `(https?://)?(localhost|127\.0\.0\.1):(8787|8888)`。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `required_status_checks` の PUT で既存 contexts を上書きし、`audit-correlation-verify` / `verify-design-tokens` / `playwright-smoke` 等が消える | 先に read-only で現状 `contexts` を取得し、既存項目を全件保持したまま `verify-no-localhost-bake` を末尾追加した完全配列を PUT する。after JSON で既存 context が全件残ることを確認 |
| `required_pull_request_reviews` / `lock_branch` / `enforce_admins` 等を意図せず変更し governance に drift が出る | PUT payload は `required_status_checks` のみ更新する形に限定し、他フィールドは before JSON と同値で送る。after 再取得で drift 0 を確認（AC-5） |
| context 名が GitHub Checks の実表記とずれ、pending のまま merge ブロック（never run）になる | before JSON / 実 run の Checks 表記から正確な context 文字列（`verify-no-localhost-bake`）を確定してから登録する |
| 未承認のまま branch protection を mutate する | 実 `gh api -X PUT` は user-gated。承認前は before evidence 取得と PUT payload 提示までに限定し、ユーザー明示承認後にのみ PUT を実行する |

## 検証方法

### 事前検証（read-only・承認前に可）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > /tmp/dev-protection-before.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > /tmp/main-protection-before.json
# drift 確認（required_pull_request_reviews=null / lock_branch=false / enforce_admins=true）
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection | grep -E 'required_pull_request_reviews|lock_branch|enforce_admins'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | grep -E 'required_pull_request_reviews|lock_branch|enforce_admins'
```

期待: 両 branch の現状 contexts と protection フィールドが取得でき、`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` であることを確認できる。

### 本処理（user-gated・ユーザー明示承認後のみ）

```bash
# before JSON の contexts に verify-no-localhost-bake を加えた完全配列で PUT する
# （dev / main それぞれに対し、既存フィールドを保持した payload を組み立てて実行）
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection --input /tmp/dev-protection-put.json
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection --input /tmp/main-protection-put.json
```

期待: dev/main の `required_status_checks.contexts` に `verify-no-localhost-bake` が追加され、既存 context が全件保持される。

### 事後検証（after evidence）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > /tmp/dev-protection-after.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > /tmp/main-protection-after.json
# before/after の差分が verify-no-localhost-bake 追加のみであることを確認
diff <(jq -S . /tmp/dev-protection-before.json) <(jq -S . /tmp/dev-protection-after.json)
diff <(jq -S . /tmp/main-protection-before.json) <(jq -S . /tmp/main-protection-after.json)
```

期待: diff が `required_status_checks.contexts` への `verify-no-localhost-bake` 追加のみで、`required_pull_request_reviews` / `lock_branch` / `enforce_admins` / `required_linear_history` / `required_conversation_resolution` に drift が無い（AC-4 / AC-5 / AC-6）。

## スコープ

### 含む

- `dev` / `main` の branch protection `required_status_checks.contexts` への `verify-no-localhost-bake` 追加（既存 context 全件保持）。
- 操作前後の read-only JSON evidence 取得（before/after）。
- CLAUDE.md ブランチ戦略の required status check 列挙と GitHub 実値の整合確認。

### 含まない

- `verify-no-localhost-bake.sh` の grep ロジック変更（gate LOGIC は無改修）。
- 他 gate（現 required check: `ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`）の追加・削除。
- `required_pull_request_reviews` の有効化（solo 運用で `null` 維持）。
- API / D1 / Google Form / Cloudflare runtime 設定の変更。

---

```yaml
status: consumed
consumed_at: 2026-06-08
consumed_by_issue: 1146
canonical_workflow: docs/30-workflows/completed-tasks/issue-1146-verify-no-localhost-bake-required-status-check/
recovery_note: |
  Issue #1146 (FU-SASR-002) was CLOSED before a canonical workflow root existed.
  This unassigned-task (proto-spec) file is preserved for backward link integrity
  (issue #1146 body links to this path). All Phase 1-13 work has been migrated to
  the canonical workflow root above as an implementation spec
  (implemented_local_runtime_pending; branch-protection PUT remains user-gated).
optimization_note: |
  本 proto-spec は「登録済み required context = audit-correlation-verify / verify-design-tokens
  / playwright-smoke」を前提としていたが、2026-06-08 の実測では dev/main の
  required_status_checks.contexts は ci / Validate Build / coverage-gate / lighthouse-ci
  / e2e-tests-coverage-gate であり前提が stale。また verify-no-localhost-bake.yml は
  on.pull_request.paths フィルタを持つため、現状のまま required 化すると非 web PR が
  Waiting-for-status で永久 merge block になる根本問題が判明した。canonical workflow root
  では (1) 実測 context を正本化し (2) yml の pull_request.paths 除去（常時実行化・grep
  LOGIC 不変）を実装仕様に追加した。詳細は canonical_workflow を参照。
```
