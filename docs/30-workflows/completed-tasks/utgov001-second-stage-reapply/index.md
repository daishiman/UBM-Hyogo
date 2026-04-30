# utgov001-second-stage-reapply - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | task-utgov001-second-stage-reapply-001 |
| タスク名 | UT-GOV-001 second-stage contexts reapply（dev / main の `required_status_checks.contexts` 後追い再 PUT） |
| ディレクトリ | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply |
| Wave | governance（UT-GOV-001 後追い） |
| 実行種別 | implementation（serial。dev / main 独立 PUT を 2 段階目として再適用する後追いタスク） |
| 作成日 | 2026-04-30 |
| 担当 | unassigned |
| 状態 | spec_created（仕様書作成済 / 実装着手前） |
| タスク種別 | implementation / governance / NON_VISUAL（GitHub branch protection の REST API 操作のみ。UI なし） |
| taskType | implementation |
| docsOnly | false |
| visualEvidence | NON_VISUAL |
| 既存タスク組み込み | あり（UT-GOV-001 の Phase 13 で `contexts=[]` fallback を採用した場合の後追い適用） |
| 組み込み先 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md §8.2 |
| GitHub Issue | #202 (CLOSED — ユーザー指示によりクローズドのままタスク仕様書化) |
| 検出元 | UT-GOV-001 Phase 12 unassigned-task-detection C-3 |

## 正本語彙

この workflow では、以下を正本語彙として全 Phase で固定する。Phase 本文に異なる表現が出た場合は、この表を優先して修正する。

| 項目 | 正本 |
| --- | --- |
| 後追い再 PUT (second-stage reapply) | UT-GOV-001 で `required_status_checks.contexts=[]` の暫定 fallback を採用した場合に、UT-GOV-004 完了後に実在 context を埋めた payload で dev / main の branch protection を再 PUT し、最終状態へ移行する手続き |
| 1 段階目 (first stage) | UT-GOV-001 Phase 13 で適用された branch protection。`contexts=[]` または UT-GOV-004 同期前 contexts を含む |
| 2 段階目 (second stage) | 本タスクで適用する branch protection。UT-GOV-004 で確認済みの実在 job/check-run context のみが含まれる |
| 実在 context | UT-GOV-004 の成果物（`required-status-checks-contexts.{dev,main}.json` 等）に登録された、実 GitHub Actions job 名または check-run 名 |
| 暫定 fallback | UT-GOV-004 未完了下で UT-GOV-001 を進める際に採用された `contexts=[]` の payload。`required_status_checks` のスキーマ強制は機能するが、必須 status checks の強制は実質的に無効 |
| dev / main 独立 PUT | dev branch と main branch を別々の PUT 呼び出しで適用する原則。1 PUT が失敗しても他方が中途半端に書き換わらないことを保証 |
| 適用前 GET | 再 PUT 直前に取得する現行 protection。`branch-protection-current-{dev,main}.json` として保全し、本タスクの差分対象とする |
| 適用後 GET | 再 PUT 直後に取得する protection。`branch-protection-applied-{dev,main}.json` として保存し、contexts 反映を検証する根拠とする |
| 期待 contexts | UT-GOV-004 成果物から取得した実在 context の配列。dev / main で別配列となる場合があり、必ず分離管理する |
| Phase 13 = 適用ゲート | 本タスクの Phase 13 はユーザー承認前提の実 PUT 実行ゲート。承認なしに PR 作成・push・実 PUT は実行しない |

## 目的

UT-GOV-001 Phase 13 で `contexts=[]` 暫定 fallback を採用した場合、UT-GOV-004 完了成果物から実在 context を取得して `branch-protection-payload-{dev,main}.json` の `required_status_checks.contexts` を再生成し、dev / main 独立 PUT で branch protection を最終状態へ移行する。GET 実値で contexts 反映を確認し、CLAUDE.md / deployment-branch-strategy.md との drift がないことを検証する。本タスクは branch protection の REST API 操作のみを対象とし、UT-GOV-004 自体の job 名同期、初回 protection 適用、rollback rehearsal、commit / PR / push の自動実行は含まない。

## スコープ

### 含む

- UT-GOV-004 完了成果物（`required-status-checks-contexts.{dev,main}.json` 等）からの実在 context 抽出
- `branch-protection-payload-{dev,main}.json` の `required_status_checks.contexts` 再生成
- 適用前 GET（`branch-protection-current-{dev,main}.json`）の取得・保全
- dev / main 独立 PUT（`PUT /repos/{owner}/{repo}/branches/{branch}/protection`）の実行
- 適用後 GET（`branch-protection-applied-{dev,main}.json`）の取得・差分検証
- CLAUDE.md ブランチ戦略 / deployment-branch-strategy.md との drift 確認
- 1 PUT 失敗時の dev / main 独立 rollback 経路の文書化（payload 別ファイル管理）
- `enforce_admins=true` 下での admin 自身 block を避ける rollback 担当・経路の再確認
- 後追い適用 runbook（`apply-runbook-second-stage.md`）の作成

### 含まない

- UT-GOV-001 の初回 branch protection 適用（既に Phase 13 で完了している前提）
- UT-GOV-001 の rollback rehearsal（初回適用で完了済み）
- UT-GOV-004 自体の job/check-run 名同期作業（前提タスクとして完了している前提）
- `required_pull_request_reviews` の有効化（solo 運用ポリシーにより `null` を維持）
- `enforce_admins` の値変更（UT-GOV-001 で確定した値を維持）
- `required_linear_history` / `required_conversation_resolution` / `allow_force_pushes` / `allow_deletions` の値変更
- CODEOWNERS の編集（UT-GOV-003 で別管理）
- GitHub Actions workflow の編集（UT-GOV-007 等で別管理）
- commit / push / PR 作成の自動実行（Phase 13 ユーザー承認後に実行者承認を経て実施）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | UT-GOV-001 で `contexts=[]` fallback を採用、かつ UT-GOV-001 Phase 13 完了 | 1 段階目 protection が既に適用されていることが前提 |
| 上流（必須） | UT-GOV-004 完了 | 実在 context の正本がここで確定される |
| 上流（参照） | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md §8.2 | 後追い再 PUT の運用境界の記載元 |
| 並列 | UT-GOV-002 (PR target safety gate dry-run) | 後追い適用後の挙動検証で参照 |
| 並列 | UT-GOV-003 (CODEOWNERS governance paths) | branch protection と CODEOWNERS の組み合わせ確認 |
| 下流 | UT-GOV-005〜007（後続 governance タスク） | 「contexts 強制が機能している protected dev / main」を前提とする |
| 下流 | aiworkflow-requirements references | branch protection の最終状態 / 適用日付を反映 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | ./origin-unassigned-task.md | 原典 unassigned-task spec |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 1 段階目適用の成果物・rollback 経路・運用境界 |
| 必須 | UT-GOV-004 成果物（`required-status-checks-contexts.{dev,main}.json` 等） | 実在 context の正本 |
| 必須 | CLAUDE.md（ブランチ戦略 / Governance 節） | solo 運用ポリシー（`required_pull_request_reviews=null`）・drift 検証基準 |
| 必須 | docs/00-getting-started-manual/deployment-branch-strategy.md（または同等の正本） | deployment branch strategy 正本との drift 確認 |
| 必須 | GitHub REST API: `PUT /repos/{owner}/{repo}/branches/{branch}/protection` | 再 PUT のスキーマ正本 |
| 必須 | GitHub REST API: `GET /repos/{owner}/{repo}/branches/{branch}/protection` | 適用前 / 適用後の実値確認 |
| 参考 | .claude/skills/aiworkflow-requirements/references/ci-cd.md | required_status_checks 関連の正本 |
| 参考 | scripts/cf.sh / scripts/with-env.sh | secrets 管理運用（本タスクは GitHub token のみで完結） |

## 受入条件 (AC)

- AC-1: UT-GOV-004 完了成果物から実在 context（job/check-run 名）が抽出され、`outputs/phase-02/contexts-source.json` に保全されている。
- AC-2: dev / main それぞれの期待 contexts が個別 JSON（`outputs/phase-02/expected-contexts-{dev,main}.json`）として保存され、配列の集合差分が明文化されている。
- AC-3: 適用前 GET（`outputs/phase-13/branch-protection-current-{dev,main}.json`）が dev / main で個別取得・保全されている。
- AC-4: `branch-protection-payload-{dev,main}.json` の `required_status_checks.contexts` が UT-GOV-004 由来の実在 context のみで再生成されている（暫定 `contexts=[]` の残留が無い）。
- AC-5: dev / main 独立 PUT が REST API で成功し、応答 JSON が `outputs/phase-13/branch-protection-applied-{dev,main}.json` として保存されている。
- AC-6: 適用後 GET の `required_status_checks.contexts` が期待 contexts と完全一致（順序不問・集合一致）している証跡が記述されている。
- AC-7: CLAUDE.md / deployment-branch-strategy.md と drift がないことが `outputs/phase-09/drift-check.md` で確認されている（`required_pull_request_reviews=null`、`enforce_admins=true`、`allow_force_pushes=false`、`allow_deletions=false`、`required_linear_history`、`required_conversation_resolution` の各値）。
- AC-8: 1 PUT 失敗時の dev / main 独立 rollback 経路が `outputs/phase-05/apply-runbook-second-stage.md` に記述されている（rollback payload は UT-GOV-001 の rollback payload を再利用し、上書き書換しない）。
- AC-9: typo context による merge block を防ぐため、workflow 名ではなく実 job/check-run 名を採用する原則と検証手段が文書化されている。
- AC-10: `enforce_admins=true` 下での admin 自身 block を避ける rollback 担当・経路が再確認・記述されている。
- AC-11: 30種思考法レビューで PASS / MINOR / MAJOR が付与され、MAJOR が 0 件で着手可否ゲート（Phase 3）を通る。
- AC-12: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS であり、根拠が記述されている（Phase 1 / Phase 3 / Phase 10）。
- AC-13: Phase 13 はユーザー承認なしに実 PUT・push・PR 作成を行わない原則が記述されている。
- AC-14: aiworkflow-requirements references（`ci-cd.md` 等）に対し、branch protection 最終状態の反映方針が Phase 12 で明文化されている（実反映は別タスクへ引き渡し）。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計（contexts 抽出 / payload 再生成設計） | phase-02.md | spec_created | outputs/phase-02/contexts-source.json, outputs/phase-02/expected-contexts-{dev,main}.json, outputs/phase-02/payload-design.md |
| 3 | 設計レビュー（30種思考法 / GO/NO-GO） | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | spec_created | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック（後追い再 PUT 手順） | phase-05.md | spec_created | outputs/phase-05/apply-runbook-second-stage.md |
| 6 | 異常系検証 | phase-06.md | spec_created | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化（payload / runbook 重複排除） | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証（drift 検証 / 期待 contexts 一致確認） | phase-09.md | spec_created | outputs/phase-09/main.md, outputs/phase-09/drift-check.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke / 検証 | phase-11.md | spec_created | outputs/phase-11/main.md, outputs/phase-11/manual-verification-log.md |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12/main.md, outputs/phase-12/implementation-guide.md, outputs/phase-12/system-spec-update-summary.md, outputs/phase-12/documentation-changelog.md, outputs/phase-12/unassigned-task-detection.md, outputs/phase-12/skill-feedback-report.md, outputs/phase-12/phase12-task-spec-compliance-check.md |
| 13 | PR作成 | phase-13.md | spec_created | outputs/phase-13/branch-protection-current-{dev,main}.json, outputs/phase-13/branch-protection-applied-{dev,main}.json, outputs/phase-13/local-check-result.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4条件評価・true issue・依存境界・Ownership） |
| 設計 | outputs/phase-02/contexts-source.json | UT-GOV-004 由来 context の抽出証跡 |
| 設計 | outputs/phase-02/expected-contexts-{dev,main}.json | dev / main 別の期待 contexts |
| 設計 | outputs/phase-02/payload-design.md | payload 再生成設計（差分のみが contexts であることを固定） |
| レビュー | outputs/phase-03/main.md | 代替案比較・30 種思考法・PASS/MINOR/MAJOR 判定・GO/NO-GO ゲート |
| ランブック | outputs/phase-05/apply-runbook-second-stage.md | dev / main 独立 PUT 手順・rollback 経路・admin block 回避策 |
| 検証 | outputs/phase-09/drift-check.md | CLAUDE.md / deployment-branch-strategy.md との drift 検査結果 |
| 適用結果 | outputs/phase-13/branch-protection-applied-{dev,main}.json | 適用後 GET 応答 |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| GitHub REST API (`/branches/{branch}/protection`) | branch protection の GET / PUT | 無料（authenticated rate limit 内） |
| `gh api` CLI | REST 呼び出し用 client | 無料 |
| `jq` | JSON 整形・差分抽出 | 無料 |
| GitHub Personal Access Token / GitHub App token | API 認証 | 無料（admin scope 必須） |

## Secrets 一覧（このタスクで言及）

| Secret 名 | 用途 | 注入経路 | 1Password 参照 | 備考 |
| --- | --- | --- | --- | --- |
| `GITHUB_TOKEN` （または gh CLI 認証） | branch protection GET / PUT 用 | ローカル `gh auth status` または環境変数 | `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN`（admin scope 必須） | repository admin 権限が無いと PUT が 403 で失敗する |

> 本タスクは `scripts/cf.sh` を使わない（Cloudflare 操作なし）。GitHub admin scope を持つ token は、ローカルでのみ揮発的に扱い、ファイル / ログに残さない（CLAUDE.md「禁止事項」と整合）。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| solo 運用 | `required_pull_request_reviews=null` を維持 | 再 PUT payload で `required_pull_request_reviews=null` を維持。CI gate / 線形履歴 / 会話解決必須化 / force-push 禁止 / 削除禁止 で品質保証 |
| GitHub branch protection 正本 | GitHub 側 protection を正本とし、CLAUDE.md は運用参照 | 適用後 GET を正本として `applied-{branch}.json` を保存。CLAUDE.md と drift があれば CLAUDE.md 側の追従を別タスクで起票 |
| dev / main 独立 PUT | 1 PUT が失敗しても他方が部分適用にならない | dev / main を別 PUT で実行。失敗時 rollback も branch 別 |
| Secret hygiene | API token を出力 / ログに残さない | runbook では `op://...` 参照のみを記述。実行時は環境変数で揮発的に渡す |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-14 すべてが対応 Phase でトレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS（Phase 1 / 3 / 10）
- 30種思考法レビューで MAJOR が 0 件（Phase 3）
- 適用前 / 適用後 GET の保全と差分検証が完了している（Phase 9 / Phase 13）
- Phase 13 はユーザー承認なしでは実 PUT を実行しない

## 苦戦箇所・知見

**1. typo context による merge block**
`required_status_checks.contexts` に未出現 context 名（typo / 廃止 workflow 名）を入れると、対象 PR が永続的に green にならず merge 不能になる事故が発生する。workflow 名ではなく、実 GitHub Actions の job 名 / check-run 名を採用することで防ぐ。UT-GOV-004 の成果物は実 check から抽出されているため、これを唯一の入力源とする。

**2. dev / main 片側だけ更新**
1 PUT が成功して 1 PUT が失敗した場合、dev / main の protection が乖離する。`branch-protection-payload-{branch}.json` / `branch-protection-applied-{branch}.json` を branch 別ファイルとして必須化し、片側失敗時に他方を再 PUT で揃える経路を runbook に記述する。

**3. admin block（`enforce_admins=true`）**
contexts を埋めた瞬間、対応 check-run が走っていない PR は admin でも merge できなくなる。実行者が rollback 経路（UT-GOV-001 で確立した rollback payload）に即座にアクセスできる状態で PUT を行う。

**4. UT-GOV-004 同期前の暫定 `contexts=[]` 残留**
1 段階目で `contexts=[]` が残ったまま忘れると、必須 status checks が事実上機能しない governance になる。本タスクの存在自体がこのリスクへの構造的対策。

**5. workflow 名 vs job 名の混同**
GitHub Actions の workflow ファイル名（`build-and-test.yml`）と check-run 名（`build (ubuntu-latest)` 等）は別物。誤って workflow 名を contexts に入れると AC-1 / AC-9 を満たさず merge block 事故になる。Phase 2 で「workflow 名禁止 / job 名 or check-run 名のみ採用」を明示する。

**6. dev / main 別 contexts の必要性**
dev / main で走る workflow が異なる場合（例: dev のみ smoke deploy、main のみ release notes）、contexts 配列が異なる。dev / main を 1 つの配列で扱わず、個別ファイルで管理する。

**7. CLAUDE.md drift 検査の片務化**
GitHub 側 protection を正本としつつ、CLAUDE.md の記述が古いまま放置されると将来の運用判断を誤る。Phase 9 で drift 検査を行い、検出時は別タスク起票（aiworkflow-requirements references 反映含む）として明記する。

**8. PR / commit / push の自動実行禁止**
Phase 13 はユーザー承認前提の実 PUT 実行ゲート。本タスク仕様書作成段階では commit / push / PR 作成を一切行わない（CLAUDE.md / task-specification-creator skill 共通原則）。

## 関連リンク

- 上位 README: ../README.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/202 (CLOSED)
- 原典 unassigned-task: ../unassigned-task/task-utgov001-second-stage-reapply.md
- 1 段階目仕様書: ../completed-tasks/UT-GOV-001-github-branch-protection-apply.md
- GitHub REST API: https://docs.github.com/en/rest/branches/branch-protection
