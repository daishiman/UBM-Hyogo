# task-e2e-stage3c-branch-protection-contexts-001: branch protection contexts に `lighthouse-ci` / `e2e-tests-coverage-gate` を追加し CLAUDE.md governance を更新する

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-e2e-stage3c-branch-protection-contexts-001 |
| タスク名 | GitHub branch protection の `required_status_checks.contexts` に `lighthouse-ci` / `e2e-tests-coverage-gate` を追加し、CLAUDE.md governance 表を最新化する |
| 優先度 | HIGH |
| 推奨Wave | Stage 3a / 3b 直後（後続即時） |
| 状態 | proposed (unassigned) |
| 親タスク | e2e-quality-uplift-stage-3 |
| サブタスク区分 | 3c（3a: lighthouse-ci 配信、3b: e2e-tests-coverage-gate 配信、3c: 本タスク） |
| 発見日 | 2026-05-09 |
| 検出元 | `docs/30-workflows/e2e-quality-uplift-stage-3/phase-12.md` 第 1 章 / `index.md` AC-05 / AC-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 関連 historical | task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001（`coverage-gate` 1 件追加の先行タスク・本タスクは 2 件追加の後続） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

e2e-quality-uplift Stage 3 では以下 2 サブタスクで CI workflow を新設・拡張する:

- **3a**: `.github/workflows/lighthouse.yml` を配信し `lighthouse-ci` job を hard gate 化
- **3b**: `.github/workflows/e2e-tests.yml` の `e2e-tests-coverage-gate` job を hard gate 化

これらの workflow が PR で実行されても、**GitHub branch protection の `required_status_checks.contexts` に context 名が登録されていない限り merge gate として機能しない**。CI 上で fail しても merge button が enable のまま残り、quality gate が形骸化する。

### 1.2 問題点・課題

- 3a / 3b の workflow が dev / main 上で動いていても、required contexts に未登録だと PR は無視して merge できる
- CLAUDE.md 「ブランチ戦略 / Governance」節は GitHub 側実値の運用参照ドキュメントのため、追加 contexts を明示しないと drift 検証時の正本表が更新されない
- solo dev 運用ポリシー（`required_pull_request_reviews=null` 維持）と context 追加を同一 PUT で扱うため、誤って reviews 必須化や `enforce_admins=false` への drift を起こすリスクがある

### 1.3 放置した場合の影響

- Lighthouse スコア劣化 / E2E coverage 低下 PR が gate なく dev / main に merge され、Stage 3 の品質投資が即時無効化される
- 後続 Stage 4 以降が「Stage 3 の merge gate が機能している」を前提に依存設計するため、ここを通らないと downstream 全体が崩れる
- governance 正本表が古いまま固定化し、UT-GOV-001 系 drift check が誤検知 / 見逃しを起こす

---

## 2. 何を達成するか（What）

### 2.1 目的

- `gh api -X PUT` で dev / main 両ブランチの `required_status_checks.contexts` に `lighthouse-ci` / `e2e-tests-coverage-gate` の 2 件を append する
- 既存 contexts（`ci` / `Validate Build` / `coverage-gate`）を破壊せず最終 5 件構成に揃える
- solo 運用ポリシー（`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / `required_linear_history=true` / force-push & 削除禁止）を 1 件も drift させない
- CLAUDE.md 「ブランチ戦略 / Governance / CODEOWNERS」節に正本 contexts 表を追記
- `docs/30-workflows/e2e-quality-uplift-stage-3/LOGS.md` に drift check 結果を転記

### 2.2 最終ゴール（AC）

- **AC-05**: `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` および `.../main/protection` の fresh GET で `required_status_checks.contexts` に下記 5 件すべてが含まれる
  - `ci`
  - `Validate Build`
  - `coverage-gate`
  - `lighthouse-ci`（本タスクで追加）
  - `e2e-tests-coverage-gate`（本タスクで追加）
- **AC-06**: 同 GET 結果で以下 non-target fields に drift がないこと
  - `required_pull_request_reviews` が `null`
  - `lock_branch` が `false`
  - `enforce_admins.enabled` が `true`
  - `required_linear_history.enabled` が `true`
  - `allow_force_pushes.enabled` が `false`
  - `allow_deletions.enabled` が `false`
- **AC-07**: CLAUDE.md 「ブランチ戦略 / Governance」節に下記 5 件 contexts 表が追記され、Phase 12 phase-12.md §1.2 の追記内容と完全一致する
- **AC-08**: `docs/30-workflows/e2e-quality-uplift-stage-3/LOGS.md` の §3 drift check 結果に `branch-protection-drift-check.log` の要約が記載される

### 2.3 スコープ

#### 含むもの

- `gh api -X PUT /repos/daishiman/UBM-Hyogo/branches/dev/protection` への 5 件 contexts 配列適用
- `gh api -X PUT /repos/daishiman/UBM-Hyogo/branches/main/protection` への同様適用
- 適用前後の fresh GET evidence 取得（before / after JSON 各 2 ブランチ = 計 4 ファイル）
- `branch-protection-drift-check.log` 生成（diff フォーマット / non-target fields の drift = 0 を機械検証）
- CLAUDE.md 「ブランチ戦略 / Governance / CODEOWNERS」節への contexts 正本表追記
- `docs/30-workflows/e2e-quality-uplift-stage-3/LOGS.md` §3 への結果転記

#### 含まないもの

- 3a（`lighthouse-ci` workflow / job 自体の実装） … 別タスク
- 3b（`e2e-tests-coverage-gate` workflow / job 自体の実装） … 別タスク
- `coverage-gate` 1 件のみの追加 … 先行タスク `task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001` で完了済み
- branch protection 他項目（`required_pull_request_reviews` / `lock_branch` / `enforce_admins` / `required_linear_history` 等）の挙動変更
- 組織レベル / repo settings UI の変更
- Lighthouse スコア閾値や E2E coverage 閾値そのものの調整

### 2.4 成果物

| path | 種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/branch-protection-dev-before.json` | evidence | 適用前 dev fresh GET（read-only・事前取得可） |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/branch-protection-main-before.json` | evidence | 適用前 main fresh GET（read-only・事前取得可） |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/branch-protection-dev-after.json` | evidence | 適用後 dev fresh GET（ユーザー承認後） |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/branch-protection-main-after.json` | evidence | 適用後 main fresh GET（ユーザー承認後） |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/branch-protection-drift-check.log` | evidence | non-target fields drift = 0 検証結果 |
| `CLAUDE.md` | governance 正本 | ブランチ戦略 / Governance 節に 5 件 contexts 表追記 |
| `docs/30-workflows/e2e-quality-uplift-stage-3/LOGS.md` | log | §3 drift check 結果転記 |
| 適用 PUT 入力 JSON（`/tmp/dev-protection-put.json` 等） | 揮発 | コミット対象外。実行ログのみ LOGS.md へ |

---

## 3. どのように実行するか（How）

### 3.1 前提条件（着手ゲート）

| 条件 | 理由 |
| --- | --- |
| 3a の workflow が dev / main の最新 commit 上で 1 回以上 success 完走済み | context 名 `lighthouse-ci` が GitHub 内部 DB に未登録だと PUT 時 `422 Unprocessable Entity` |
| 3b の workflow が同様に 1 回以上 success 完走済み | context 名 `e2e-tests-coverage-gate` が同上 |
| 3a / 3b 自体の hard gate 化（`continue-on-error` 撤去）が main 取り込み済み | 後段で gate が抜けないため |
| ユーザー明示承認 | repository setting の実 PUT を伴うため CLAUDE.md ut-gov-001 系 / Issue #554 audit-correlation-verify と同一の user-gated 扱い |

> read-only な before JSON 取得（`gh api ... > ...-before.json`）と drift 検証 dry-run は事前 evidence として承認前に取得して構わない。**`gh api -X PUT` のみがユーザー明示承認の対象**。

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| depends-on | e2e-quality-uplift-stage-3 / 3a（lighthouse-ci workflow） | context 名の GitHub 登録を経由するため |
| depends-on | e2e-quality-uplift-stage-3 / 3b（e2e-tests-coverage-gate workflow） | 同上 |
| 順序整合 | task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001 | 既に `coverage-gate` を 3 件目として追加済み。本タスクは 4 件目・5 件目を append する後続として整合する |
| blocks | 後続 PR 全体 | gate 機能後は Lighthouse / E2E coverage 未達 PR が merge 不能となる |

### 3.3 推奨アプローチ

1. `gh run list -b main -w lighthouse.yml --limit 5` / `gh run list -b main -w e2e-tests.yml --limit 5` で main 上 1 回以上 success を確認
2. dev 側も同様に確認（`-b dev`）
3. `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > .../branch-protection-dev-before.json`（read-only）
4. main も同様に before JSON 取得
5. `jq` で `required_status_checks.contexts` を `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]` に揃え、non-target fields は before JSON の値を維持した PUT body を組み立てる
6. **ユーザー明示承認後**、`gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection --input <(...)` を実行
7. fresh GET し dev-after.json を保存。drift check スクリプト（`jq`-based）で non-target fields drift = 0 を検証
8. main について 6-7 を繰り返す（dev 安定確認後の段階適用を推奨）
9. CLAUDE.md 「ブランチ戦略 / Governance / CODEOWNERS」節に 5 件 contexts 表を追記
10. `e2e-quality-uplift-stage-3/LOGS.md` §3 に drift check 結果サマリを転記

### 3.4 実行コマンド例（参考）

```bash
# Step 3-4: read-only before
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/branch-protection-dev-before.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/branch-protection-main-before.json

# Step 5: PUT body 組み立て（dev 例）
jq '{
  required_status_checks: {
    strict: .required_status_checks.strict,
    contexts: ["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]
  },
  enforce_admins: .enforce_admins.enabled,
  required_pull_request_reviews: null,
  restrictions: null,
  required_linear_history: .required_linear_history.enabled,
  allow_force_pushes: .allow_force_pushes.enabled,
  allow_deletions: .allow_deletions.enabled,
  block_creations: .block_creations.enabled,
  required_conversation_resolution: .required_conversation_resolution.enabled,
  lock_branch: .lock_branch.enabled,
  allow_fork_syncing: .allow_fork_syncing.enabled
}' .../branch-protection-dev-before.json > /tmp/dev-protection-put.json

# Step 6: 【ユーザー明示承認後のみ】
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input /tmp/dev-protection-put.json

# Step 7: after + drift check
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > .../branch-protection-dev-after.json
diff <(jq -S 'del(.required_status_checks.contexts)' .../branch-protection-dev-before.json) \
     <(jq -S 'del(.required_status_checks.contexts)' .../branch-protection-dev-after.json) \
  >> .../branch-protection-drift-check.log
```

### 3.5 rollback 手順

PUT 失敗時 / drift 検出時:

1. before JSON を入力に再 PUT (`gh api -X PUT --input .../branch-protection-{dev,main}-before.json` の形に再整形)
2. fresh GET で contexts 配列が before と一致することを確認
3. LOGS.md に rollback 実施時刻と原因を記録
4. 失敗原因（context 未登録 422 / 権限不足 / non-target fields の意図せぬ drift）を切り分けて報告

---

## 4. 苦戦箇所【記入必須】

**1. 既存 contexts との 5 件 merge**: `gh api -X PUT .../protection` は `required_status_checks.contexts` を **全置換**するため、`coverage-gate`（先行タスクで追加済み）/ `ci` / `Validate Build` のいずれかを漏らすと既存 merge gate が抜け落ちる。before JSON の現行 contexts を必ず取り込んだ上で `lighthouse-ci` / `e2e-tests-coverage-gate` を append する。

**2. context 名の事前登録タイミング**: 3a / 3b の workflow / job が dev / main の最新 commit に対して 1 回以上 success で実行されていないと、GitHub 内部 DB に context 名が未登録となり PUT で `422 Unprocessable Entity`。先行タスク（coverage-gate）でも同問題が記録されている。本タスクは 2 件同時追加のため、両方 success 確認のチェックを `gh run list` で個別実施する。

**3. `enforce_admins=true` 維持での権限**: `enforce_admins=true` 状態でも `gh api -X PUT` は repo admin token なら通る。ただし `op://` 経由の token に admin scope が付いていることを `gh auth status` で事前確認する。スコープ不足時は 403 で fail する。

**4. solo dev ポリシーの drift 防止**: `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / `required_linear_history=true` / `allow_force_pushes=false` / `allow_deletions=false` の 6 項目は CLAUDE.md ブランチ戦略の不変条件。PUT body 組み立て時に before JSON の値をそのまま継承する `jq` テンプレート化が必須。手書きで JSON を起こすと 6 項目のいずれかを誤って drift させる事故が起きやすい。

**5. apply 失敗時の rollback**: PUT 後の after JSON で drift 検出した場合、即座に before JSON を入力に再 PUT で原状復帰できるようにスクリプトに rollback path を組み込む。実行ログは LOGS.md に必ず転記し、無音 rollback を禁止する。

**6. 先行タスクとの順序整合**: `task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001` で既に `coverage-gate` を 3 件目として追加済み。本タスクの before JSON にはその結果が反映されている前提。先行タスク未完了の状態で本タスクを実行すると contexts 配列の起点が `["ci","Validate Build"]` の 2 件となり、coverage-gate を含めずに上書きしてしまうリスクがある。**実行直前に必ず before JSON で `coverage-gate` の存在を確認**する。

**7. dev / main 段階適用**: 個人開発フローで feature → dev → main の順に merge するため、dev 側の hard gate を先に有効化すると 3a / 3b 後続の修正 PR 自体が block されるリスクがある。安全には main を先に hard gate 化、dev を次サイクル以降で適用する 2 段階を検討。ただし Stage 3 完了 ACの観点では両ブランチ同期適用を最終形とする。

---

## 5. 影響範囲

- GitHub repo settings: `daishiman/UBM-Hyogo` の dev / main branch protection（実値）
- `CLAUDE.md` 「ブランチ戦略」「Governance / CODEOWNERS」節
- `docs/30-workflows/e2e-quality-uplift-stage-3/LOGS.md`（新規 / 既存追記）
- `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/` 配下に branch protection evidence × 5 ファイル
- 後続全 PR の merge button enable 判定（5 contexts すべて green が必須化）

---

## 6. 推奨タスクタイプ

- taskType: **implementation**
- visualEvidence: **NON_VISUAL**（UI 変更を伴わない governance / config 変更）

---

## 7. 不変条件

| 項目 | 値 |
| --- | --- |
| `required_pull_request_reviews` | `null` を維持（solo 開発ポリシー） |
| `lock_branch` | `false` を維持 |
| `enforce_admins.enabled` | `true` を維持 |
| `required_linear_history.enabled` | `true` を維持 |
| `allow_force_pushes.enabled` | `false` を維持 |
| `allow_deletions.enabled` | `false` を維持 |
| 正本ソース | GitHub branch protection 実値が正本。CLAUDE.md は運用参照 |
| `wrangler` 依存 | なし（本タスクは Cloudflare 系 CLI 不使用） |
| 実 PUT 実行タイミング | ユーザー明示承認後のみ。read-only GET は事前可 |

---

## 8. 完了条件チェックリスト

- [ ] `gh run list -b main -w lighthouse.yml` で 1 件以上 success / `-b dev` 同様
- [ ] `gh run list -b main -w e2e-tests.yml` で 1 件以上 success / `-b dev` 同様
- [ ] before JSON × 2 ブランチ取得済み（read-only・事前 evidence）
- [ ] PUT body 組み立てが `jq` テンプレート経由で non-target fields を before 値継承
- [ ] ユーザー明示承認取得
- [ ] `gh api -X PUT .../dev/protection` 成功
- [ ] dev after JSON で 5 contexts すべて含まれる / non-target fields drift = 0
- [ ] `gh api -X PUT .../main/protection` 成功
- [ ] main after JSON で 5 contexts すべて含まれる / non-target fields drift = 0
- [ ] `branch-protection-drift-check.log` に dev / main 両方の diff = 0 記録
- [ ] CLAUDE.md 「ブランチ戦略 / Governance / CODEOWNERS」節に 5 件 contexts 表追記
- [ ] `e2e-quality-uplift-stage-3/LOGS.md` §3 に drift check 結果転記

---

## 9. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 仕様根拠 | `docs/30-workflows/e2e-quality-uplift-stage-3/phase-12.md` §1 | CLAUDE.md 追記内容 / contexts 5 件正本表 |
| 仕様根拠 | `docs/30-workflows/e2e-quality-uplift-stage-3/index.md` AC-05 / AC-06 | 完了条件 |
| 先行タスク | `docs/30-workflows/unassigned-task/task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001.md` | `coverage-gate` 1 件追加の知見・順序整合 |
| governance 正本 | `CLAUDE.md` ブランチ戦略 / Governance / CODEOWNERS 節 | 不変条件 / drift 検証パターン |
| フォーマット | `docs/30-workflows/unassigned-task/task-e2e-playwright-coverage-001.md` | unassigned-task テンプレ |
| 関連運用 | UT-GOV-001 系 / Issue #554 audit-correlation-verify | read-only before / explicit consent / after JSON パターン |
| 補助 | `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` | drift 検出コマンド |

---

## 10. 備考

- 本タスクは Stage 3 全体の「最後の鍵」に相当する。3a / 3b 実装単独では merge gate として機能せず、本タスクで初めて Stage 3 の品質投資が PR フローへ実効反映される。
- 実 PUT の権限事故は影響が大きいため、`jq` テンプレート + before JSON 継承 + drift = 0 自動検証 + rollback path のセットを必ず揃える。
- 将来 Stage 4 以降で contexts を追加する場合も同パターン（read-only before / 明示承認 / non-target 継承 / after drift = 0）で踏襲する。
