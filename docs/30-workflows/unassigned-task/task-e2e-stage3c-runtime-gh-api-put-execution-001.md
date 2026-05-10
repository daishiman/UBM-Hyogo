# task-e2e-stage3c-runtime-gh-api-put-execution-001: 3c branch protection `gh api -X PUT` 実行 + 4 snapshot + evidence commit (runtime)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-e2e-stage3c-runtime-gh-api-put-execution-001 |
| タスク名 | 3c branch protection `gh api -X PUT` 実行 + pre/post snapshot 4 件 + `branch-protection-evidence.md` 1 件生成・commit (runtime) |
| 分類 | governance / runtime mutation / branch protection evidence |
| 対象機能 | GitHub branch protection (`dev` / `main`) `required_status_checks.contexts` 配列の 5 件化 |
| 優先度 | HIGH |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 (proposed) |
| 親タスク | e2e-quality-uplift-stage-3-impl |
| サブタスク識別子 | Stage 3 サブタスク 3c の runtime 実行レイヤ |
| taskType | runtime-mutation |
| visualEvidence | NON_VISUAL |
| 発見日 | 2026-05-09 |
| 発見元 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/outputs/phase-12/main.md` / `phase-11.md §1.2` / `outputs/phase-12/skill-feedback-report.md` |
| 関連 historical | `task-e2e-stage3c-branch-protection-contexts-001`（3c 仕様レイヤ）/ `task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001`（先行 `coverage-gate` 1 件追加） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/` のサブタスク仕様書（Phase 1-13 + index + artifacts.json）は完成しており、Phase 12 close-out (`outputs/phase-12/main.md`) 時点で次のように記録されている。

> State: `spec_created / implementation / NON_VISUAL / runtime_pending`
> Real `gh api` branch protection mutation, fresh GET evidence, commit, push, and PR remain user-gated.

すなわち、3c は **仕様レイヤとしては完了**しているが、以下の **runtime 実行レイヤがユーザー明示承認 gate により未実施**として残置されている。

- `gh api -X PUT repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection`（実 API mutation）
- pre/post snapshot 4 ファイルの runtime 取得（dev-pre / dev-post / main-pre / main-post）
- `outputs/phase-11/branch-protection-evidence.md` の生成
- evidence ファイルの commit

`outputs/phase-12/implementation-guide.md` が以下 5 件の runtime evidence を期待値として明記しており、それらが揃うまで workflow_state は `runtime_pending` のまま固定される。

- `outputs/phase-11/branch-protection-dev-pre.json`
- `outputs/phase-11/branch-protection-dev-post.json`
- `outputs/phase-11/branch-protection-main-pre.json`
- `outputs/phase-11/branch-protection-main-post.json`
- `outputs/phase-11/check-runs.txt`

### 1.2 問題点・課題

- 3c 仕様書は `spec_created` 完了だが、runtime evidence が `runtime_pending` のまま親 workflow `e2e-quality-uplift-stage-3-impl` の Phase 13 統合 PR が close できない
- 3a / 3b の hard gate 化が `dev` / `main` で実体として有効化されないため、Stage 3 全体の品質投資が PR フローへ実効反映されない
- 仕様書側で `gh api -X PUT` runbook / heredoc / drift 検証 jq クエリは整備されているが、実 mutation 実行と evidence 取得は人手による明示承認 gate が必要

### 1.3 放置した場合の影響

- Lighthouse スコア劣化 / E2E coverage 低下 PR が `lighthouse-ci` / `e2e-tests-coverage-gate` を通らずに dev / main へ merge される
- 親 workflow Phase 13 統合 PR が close できず、Stage 4 以降の依存タスクが順送りで block する
- runtime evidence 不在のまま長期化すると、3a / 3b の workflow 名・job 名 rename 等で context 名 drift が発生した際に検出が遅れる

---

## 2. 何を達成するか（What）

### 2.1 目的

`docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/phase-11.md §1` に記載された runtime 実行手順を、ユーザー明示承認後に実行し、以下を成立させる:

- `dev` / `main` branch protection `required_status_checks.contexts` を 5 件（`ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`）に揃える
- pre/post snapshot 4 ファイル + `check-runs.txt` + `branch-protection-evidence.md` を canonical path に保存
- solo dev policy（`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / `required_linear_history=true` / force-push & 削除禁止 / `required_conversation_resolution=true`）を 1 項目も drift させない
- evidence をコミットし、親 Phase 13 統合 PR に取り込む

### 2.2 最終ゴール（AC）

`docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/index.md` の AC-05 / AC-06 を runtime で実証する。

- **AC-05 (runtime)**: `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` の post snapshot で `required_status_checks.contexts | sort -u` が `["Validate Build", "ci", "coverage-gate", "e2e-tests-coverage-gate", "lighthouse-ci"]` と完全一致する
- **AC-06 (runtime)**: 同 snapshot で以下に drift がない
  - `required_pull_request_reviews == null`
  - `lock_branch.enabled == false`
  - `enforce_admins.enabled == pre 値`（drift = 0）
  - `required_status_checks.strict == false`
  - `required_conversation_resolution.enabled == true`
  - `allow_force_pushes.enabled == false`
  - `allow_deletions.enabled == false`
  - `required_linear_history.enabled == true`
- **AC-RT-01**: `outputs/phase-11/` に runtime evidence 5 ファイル + 補助 3 ファイル（`check-runs.txt` / `dev-contexts.diff` / `main-contexts.diff`）が存在し、commit 済みである
- **AC-RT-02**: evidence コミットが親 Phase 13 統合 PR に取り込まれている

### 2.3 検証エビデンス

- `outputs/phase-11/branch-protection-{dev,main}-{pre,post}.json`（fresh GET）
- `outputs/phase-11/check-runs.txt`（HEAD SHA に対する `lighthouse-ci` / `e2e-tests-coverage-gate` の登録確認ログ）
- `outputs/phase-11/branch-protection-evidence.md`（jq 検証結果集約・AC 対応表・runbook 結果）
- `outputs/phase-11/{dev,main}-contexts.diff`（pre/post diff、追加 2 件のみが期待）

### 2.4 スコープ

#### 含むもの

- 3c phase-11.md §1.2 のコマンド集（手順 1-6）の runtime 実行
- pre snapshot × 2（dev / main）の取得（read-only・ユーザー承認前に事前取得可）
- HEAD SHA での `check-runs` 確認と `lighthouse-ci` / `e2e-tests-coverage-gate` の存在 grep
- `gh api -X PUT` の dev → main 段階適用（dev 安定確認後 main へ）
- post snapshot × 2 の取得 + drift 検証 jq クエリ実行
- pre/post diff 生成（contexts 配列のみの追加 2 件チェック）
- `branch-protection-evidence.md` テンプレ埋め
- evidence 全 5 ファイル + 補助 3 ファイルのコミット

#### 含まないもの

- 3a workflow 自体の実装（別タスク `task-e2e-stage3a-lighthouse-ci-001`）
- 3b workflow 自体の実装（`task-e2e-stage3b-e2e-tests-hard-gate-001`）
- 3c 仕様レイヤの作成（`task-e2e-stage3c-branch-protection-contexts-001` で完了済）
- CLAUDE.md governance 文言と実値の整合判断（`task-e2e-stage3c-enforce-admins-claudemd-alignment-001` 側に分離）
- merge queue 導入 / ruleset 移行 / レビュアー必須化
- branch protection 他項目（`required_pull_request_reviews` 等）の挙動変更

### 2.5 成果物

| path | 種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/outputs/phase-11/branch-protection-dev-pre.json` | evidence | dev 適用前 fresh GET |
| `.../phase-11/branch-protection-dev-post.json` | evidence | dev 適用後 fresh GET |
| `.../phase-11/branch-protection-main-pre.json` | evidence | main 適用前 fresh GET |
| `.../phase-11/branch-protection-main-post.json` | evidence | main 適用後 fresh GET |
| `.../phase-11/check-runs.txt` | evidence | HEAD SHA に対する登録 check-run 一覧 |
| `.../phase-11/dev-contexts.diff` | 補助 | pre/post の contexts 配列 diff |
| `.../phase-11/main-contexts.diff` | 補助 | 同上 |
| `.../phase-11/branch-protection-evidence.md` | evidence | jq 検証ログ集約・AC 対応表 |
| 親 Phase 13 統合 PR | governance | 上記 evidence のコミット取り込み |
| 揮発（commit 対象外） | — | PUT body 一時 JSON、`gh auth status` ログ |

---

## 3. どのように実行するか（How）

### 3.1 前提条件（着手ゲート）

| 条件 | 理由 |
| --- | --- |
| 3a PR-A が `dev` に merge 済みかつ workflow が dev で 1 度以上 success run を返している | `lighthouse-ci` が GitHub 内部 DB の check-run として未登録だと PUT 時 `422 Unprocessable Entity`、もしくは PR が永久 pending（BLK-03） |
| 3b PR-B が `dev` に merge 済みかつ workflow が dev で 1 度以上 success run を返している | `e2e-tests-coverage-gate` が同上 |
| `gh auth status` で repo admin scope が現在 token に付与されている | `enforce_admins=true` 状態でも admin token なら通るが、scope 不足で 403 |
| `outputs/phase-11/check-runs.txt` に `lighthouse-ci` / `e2e-tests-coverage-gate` の両方が grep でヒットする | context 名一致が確定しないと PUT が 422 |
| ユーザー明示承認 | repository settings の実 mutation を伴うため CLAUDE.md UT-GOV-001 系 / Issue #554 audit-correlation-verify と同一の user-gated 扱い |

> read-only な pre snapshot（`gh api ... > ...-pre.json`）と check-runs 取得・dry-run jq 検証は **事前 evidence として承認前に取得して構わない**。`gh api -X PUT` のみがユーザー明示承認の対象。

### 3.2 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| depends-on | `task-e2e-stage3a-lighthouse-ci-001` の dev merge + 1 success run | context 登録 |
| depends-on | `task-e2e-stage3b-e2e-tests-hard-gate-001` の dev merge + 1 success run | context 登録 |
| depends-on | `task-e2e-stage3c-branch-protection-contexts-001`（3c 仕様レイヤ） | runbook / heredoc / jq クエリの根拠 |
| 順序整合 | `task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001` | pre snapshot に `coverage-gate` が含まれている前提（3 件目として既追加） |
| blocks | 親 Phase 13 統合 PR の close | evidence 揃いが merge gate |

### 3.3 推奨アプローチ（順序厳守）

```
[gate] 3a / 3b の dev merge + 1 run 成功 + check-run 登録確認
   ↓
1. pre snapshot 取得（dev / main、read-only・事前可）
2. HEAD SHA で check-runs 取得 + lighthouse-ci / e2e-tests-coverage-gate を grep
3. 【ユーザー明示承認】
4. PUT dev → post snapshot dev
5. drift 検証（dev、jq クエリ全件 PASS 確認）
6. PUT main → post snapshot main
7. drift 検証（main、jq クエリ全件 PASS 確認）
8. pre/post diff 生成（dev / main）
9. branch-protection-evidence.md 生成
10. evidence コミット + 親 Phase 13 統合 PR への取り込み
```

### 3.4 実行コマンド例（参考）

3c phase-11.md §1.2 の runbook を canonical path（`docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/outputs/phase-11/`）に向けて実行する。

```bash
SPEC_DIR=docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts
EV=$SPEC_DIR/outputs/phase-11
mkdir -p $EV

# 1) pre
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  > $EV/branch-protection-dev-pre.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > $EV/branch-protection-main-pre.json

# 2) check-runs 確認（dev HEAD）
HEAD_SHA=$(gh api repos/daishiman/UBM-Hyogo/commits/dev --jq '.sha')
gh api "repos/daishiman/UBM-Hyogo/commits/${HEAD_SHA}/check-runs" --paginate \
  | jq -r '.check_runs[].name' | sort -u | tee $EV/check-runs.txt
grep -x 'lighthouse-ci' $EV/check-runs.txt
grep -x 'e2e-tests-coverage-gate' $EV/check-runs.txt

# 3) 【ユーザー明示承認後】PUT dev（Phase 5 §4 heredoc を実行）
# 4) post dev
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > $EV/branch-protection-dev-post.json

# 5) drift 検証 dev
diff <(jq -S '.required_status_checks.contexts | sort' $EV/branch-protection-dev-pre.json) \
     <(jq -S '.required_status_checks.contexts | sort' $EV/branch-protection-dev-post.json) \
     > $EV/dev-contexts.diff || true

# 6-7) main も同様
# 8) evidence.md（phase-11.md §3 テンプレに沿って生成）
```

### 3.5 rollback 手順

PUT 失敗 / drift 検出時:

1. pre JSON を入力に再 PUT で原状復帰（contexts 配列を pre の状態に戻す）
2. fresh GET で contexts 配列が pre と一致することを確認
3. `branch-protection-evidence.md` §6 残課題に rollback 実施時刻と原因を記録
4. 失敗原因を分類（context 未登録 422 / scope 不足 403 / non-target fields の意図せぬ drift / heredoc JSON 構造ミス）
5. 親 Phase 13 統合 PR の本文に rollback 事由を追記

---

## 4. 苦戦箇所【記入必須】

### 4.1 3a / 3b workflow 実行 success の事前確認（BLK-03 順序逆転防止）

3a / 3b の workflow が `dev` の最新 commit に対して **1 度も success run を返していない**状態で 3c の `gh api -X PUT` を実行すると、context 名が GitHub 内部 DB に未登録のため、

- 楽観ケース: PUT が `422 Unprocessable Entity` で fail
- 悲観ケース: PUT は通るが、その後の PR で必須 check が **永久 pending**（GitHub 側で check-run 生成イベントが起きない限り解消されない）

を招く。耐性のため、PUT 実行直前に必ず `gh api repos/.../commits/{HEAD_SHA}/check-runs --paginate | jq -r '.check_runs[].name' | sort -u | tee check-runs.txt` を取得し、`grep -x 'lighthouse-ci' check-runs.txt` / `grep -x 'e2e-tests-coverage-gate' check-runs.txt` の両方が exit 0 になることをチェックリストの最上位に置く。

### 4.2 既存 contexts の全置換と先行 `coverage-gate` の継承

`gh api -X PUT .../protection` は `required_status_checks.contexts` を全置換するため、pre snapshot に存在する `ci` / `Validate Build` / `coverage-gate` を漏らすと既存 merge gate が抜け落ちる。**pre JSON を `jq` で読み、配列を 5 件として再構成する**テンプレ化が必須。手書きで JSON を起こすと 1 件以上の漏れが起きる。`coverage-gate` は先行タスク `task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001` で 3 件目として追加済みであり、pre snapshot に存在しない場合は先行タスクの完了状態自体を確認する。

### 4.3 solo dev policy 6 項目の drift 防止（CLAUDE.md UT-GOV-001）

`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / `required_linear_history=true` / `allow_force_pushes=false` / `allow_deletions=false` の 6 項目は CLAUDE.md ブランチ戦略の不変条件。PUT body の組み立て時、`enforce_admins` のような nested オブジェクト（`enforce_admins.enabled`）と REST API ペイロードの直接 boolean（`enforce_admins: true`）の表現差で取り違えると drift が起きる。3c phase-11.md §3 jq テンプレに従い、pre 値継承を機械化する。

### 4.4 dev / main 段階適用（feature → dev → main）

個人開発フローに合わせ **dev を先に PUT し、main を次に** という順序が標準。dev 側で gate 違反 PR が block されることを確認してから main へ進めると、main で予期せぬ rollback が必要になる事態を避けられる。両方を同時に PUT すると、ロールバック影響半径が倍増する。

### 4.5 `gh auth status` scope 確認と canonical path

`enforce_admins=true` 状態でも `gh api -X PUT` は repo admin scope の token なら通るが、`op://` 経由 token に admin scope がないと 403 で fail。`gh auth status` で `Token scopes: 'admin:org', 'repo', 'workflow'` 等を事前確認する。3c spec ディレクトリは `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/`（`-impl` サフィックス付き）であり親 `e2e-quality-uplift-stage-3` 配下と混同しないこと。evidence path を間違えると親 Phase 13 統合 PR の取り込みから外れ `runtime_pending` のまま固定化する。

### 4.7 governance 突合の分離と commit 粒度

phase-11.md §5 で「`enforce_admins` と CLAUDE.md governance 期待値の突合は Phase 12 で実施」と明記されており、本タスクでは突合自体は行わず実値を evidence.md §6 残課題に記録するに留める。整合判断は派生タスク `task-e2e-stage3c-enforce-admins-claudemd-alignment-001` に委ねる。commit は `docs(stage-3-impl): add 3c branch protection evidence (dev/main contexts=5)` 等のメッセージで evidence を 1 commit に集約し、親 Phase 13 統合 PR で漏れなく取り込めるよう `git diff dev...HEAD --name-only` で 8 ファイル全て含まれることを確認する。

---

## 5. 影響範囲

| パス | 変更内容 |
| --- | --- |
| GitHub repo settings: `daishiman/UBM-Hyogo` の `dev` / `main` branch protection（実値） | `required_status_checks.contexts` を 5 件に拡張 |
| `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/outputs/phase-11/` | evidence 5 ファイル + 補助 3 ファイル新規 |
| 親 workflow `e2e-quality-uplift-stage-3-impl` Phase 13 統合 PR | evidence コミット取り込み・workflow_state 更新 |
| 後続全 PR の merge button 判定 | 5 contexts すべて green が必須化 |

---

## 6. 推奨タスクタイプ

- taskType: **runtime-mutation**（仕様コード変更を伴わず、外部システム＝GitHub repo settings の状態を `gh api -X PUT` で書換える）
- visualEvidence: **NON_VISUAL**（UI 描画変更なし）
- coverageTier: **standard**（親 workflow 継承）

---

## 7. 不変条件

| 項目 | 値 |
| --- | --- |
| `required_pull_request_reviews` | `null` を維持（solo 開発ポリシー） |
| `lock_branch.enabled` | `false` を維持 |
| `enforce_admins.enabled` | pre 値と post 値が同値（drift = 0） |
| `required_linear_history.enabled` | `true` を維持 |
| `allow_force_pushes.enabled` | `false` を維持 |
| `allow_deletions.enabled` | `false` を維持 |
| `required_conversation_resolution.enabled` | `true` を維持 |
| `required_status_checks.strict` | `false` を維持（merge queue 未導入） |
| 評価対象 contexts | 完全一致 5 件（順序不問・`sort -u` で一致） |
| 正本ソース | GitHub branch protection 実値が正本。CLAUDE.md は運用参照 |
| 実 PUT 実行タイミング | ユーザー明示承認後のみ。read-only GET / check-runs 取得は事前可 |
| `wrangler` 依存 | なし（本タスクは Cloudflare 系 CLI 不使用） |

---

## 8. 完了条件チェックリスト

- [ ] 3a workflow が `dev` で 1 回以上 success run（`gh run list -b dev -w lighthouse.yml --limit 5`）
- [ ] 3b workflow が `dev` で 1 回以上 success run（`gh run list -b dev -w e2e-tests.yml --limit 5`）
- [ ] `outputs/phase-11/check-runs.txt` に `lighthouse-ci` / `e2e-tests-coverage-gate` 両方を grep でヒット確認
- [ ] pre snapshot × 2（dev / main）取得済み（read-only・事前可）
- [ ] `gh auth status` で admin scope 確認済み
- [ ] ユーザー明示承認取得
- [ ] `gh api -X PUT .../dev/protection` 成功
- [ ] dev post snapshot で 5 contexts 完全一致 / non-target fields drift = 0
- [ ] `gh api -X PUT .../main/protection` 成功
- [ ] main post snapshot で 5 contexts 完全一致 / non-target fields drift = 0
- [ ] `dev-contexts.diff` / `main-contexts.diff` で追加 2 件のみが diff として観測される
- [ ] `branch-protection-evidence.md` 生成（phase-11.md §3 テンプレに準拠）
- [ ] evidence 5 ファイル + 補助 3 ファイルがコミットされている
- [ ] 親 Phase 13 統合 PR に取り込み済み

---

## 9. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 仕様根拠 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/outputs/phase-12/main.md` | runtime_pending 状態の定義 |
| 仕様根拠 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/outputs/phase-12/implementation-guide.md` | 期待 evidence 5 ファイル |
| 仕様根拠 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/phase-11.md` | 実行手順・コマンド集・evidence.md テンプレ |
| 仕様根拠 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/index.md` | AC-05 / AC-06 / 不変条件 |
| 関連 historical | `task-e2e-stage3c-branch-protection-contexts-001` | 仕様レイヤ |
| 派生 | `task-e2e-stage3c-enforce-admins-claudemd-alignment-001` | governance 整合判断 |
| 先行 | `task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001` | `coverage-gate` 1 件追加 |
| governance 正本 | `CLAUDE.md` ブランチ戦略 / Governance / CODEOWNERS 節 | 不変条件 |
| 関連運用 | UT-GOV-001 系 / Issue #554 audit-correlation-verify | read-only before / 明示承認 / after JSON パターン |
| 補助コマンド | `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` | drift 検出 |

---

## 10. 備考

- 本タスクは仕様レイヤ（`task-e2e-stage3c-branch-protection-contexts-001`）の **runtime 実行レイヤ専用**。仕様変更を伴わず、phase-11.md §1.2 の runbook をそのまま実行する。`enforce_admins` 期待値乖離の整合判断は派生タスクに分離する。AI エージェントは pre snapshot 取得・check-runs 取得・jq dry-run までを承認前に完了させ、`gh api -X PUT` の実行直前に承認を仰ぐ。
