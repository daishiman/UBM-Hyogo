# Phase 11: 手動 smoke test（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Required Status Checks の context 名同期 (UT-GOV-004) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (最終レビュー / GO-NO-GO) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | docs-only / NON_VISUAL（manual smoke / governance） |
| user_approval_required | false（本 Phase ではテンプレ作成のみ。dev branch protection への試験適用を実行する場合は UT-GOV-001 側で user 承認必須） |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- **visualEvidence: NON_VISUAL**
- 判定理由:
  - 本タスクは GitHub Actions の job 名同期と branch protection 草案の確定を行う governance ドキュメント中心タスクであり、エンドユーザー向け UI を持たない。
  - 一次証跡は `gh api` の JSON 出力 / 実 PR の Checks タブで表示される context 名 / dev branch protection に phase 1 リストを試験適用する場合の `gh api` レスポンスのみであり、screenshot による視覚証跡は **不要**。
  - 必須 outputs:
    - `outputs/phase-11/main.md`（smoke 実行サマリー / 既知制限）
    - `outputs/phase-11/manual-smoke-log.md`（コマンド単位の実行ログテンプレ）
    - `outputs/phase-11/link-checklist.md`（参照リンクの最小死活確認）
  - **`outputs/phase-11/screenshots/.gitkeep` は作成しない**（NON_VISUAL のため screenshots ディレクトリ自体不要）。

## 目的

Phase 10 の GO 判定を前提に、UT-GOV-001 へ引き渡す前段で **(a) 抽出された context 名が GitHub 上の実 check-run と一致すること**、**(b) 実 PR の Checks タブで context 名が想定通り表示されること**、**(c) dev branch に phase 1 リストを試験適用する場合に永続 block が発生しないこと** の 3 点を手動で確認するためのテンプレを提供する。本仕様書作成時点では実行は行わず、後続実行者が穴埋めできる **コマンド + 期待値 + 結果記録枠** をログテンプレ化する。branch protection 変更を伴うステップ 3〜5 は本タスクのスコープ外であり、実行する場合は UT-GOV-001 の承認ゲート下で扱う。

## 実行タスク（仕様書作成時点では「テンプレ提供」が責務、実行は後段）

1. `gh api repos/:owner/:repo/commits/<recent-sha>/check-runs` の出力テンプレと期待値（phase 1 候補 context が全件存在）を定義する（完了条件: コマンド + 期待 JSON 抜粋枠が記述）。
2. 実 PR の Checks タブで context 名を目視確認する手順をテンプレ化する（完了条件: 確認項目とスクショ代替（テキスト記録欄）が定義されている）。
3. dev branch に phase 1 リストを試験適用する手順を **任意・承認必須テンプレ** として記述する（完了条件: `gh api PATCH` のリクエスト body 例 + rollback 手順 + 本タスクでは実行しない境界が記述）。
4. 試験適用後の dev PR で全 context が `success` で揃うかを確認する手順をテンプレ化する（完了条件: 確認項目が定義）。
5. 試験適用後に未存在 context による永続 block が発生していないことを確認する手順をテンプレ化する（完了条件: 「Expected — Waiting for status to be reported」が出ないことの確認方法）。
6. 既知制限を `outputs/phase-11/main.md` に列挙する（完了条件: solo 運用 / GitHub API rate limit / dev のみで main は触らない 等）。
7. 自動テスト結果サマリー（unit / contract / integration）を Phase 9 から転記する枠を用意する（完了条件: 表テンプレ存在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-02/context-name-mapping.md | smoke 対象 context の設計根拠 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-06/failure-cases.md | Waiting 発生時の復旧ケース |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-08/main.md | NON_VISUAL smoke の schema 方針 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-08/confirmed-contexts.yml | smoke 対象の確定 context リスト |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-10/go-no-go.md | GO 判定の前提 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | smoke 後の引き渡し先 |
| 必須 | scripts/cf.sh | （参考）secrets 取扱規約。本タスクは `gh` CLI 中心 |
| 参考 | https://docs.github.com/en/rest/checks/runs | check-runs API |
| 参考 | https://docs.github.com/en/rest/branches/branch-protection | branch protection API |

## 実行手順テンプレ（後段実行者が穴埋めする）

### ステップ 1: `gh api` での check-run 実在確認

```bash
# 直近 main の HEAD SHA で実行
RECENT_SHA="$(gh api repos/daishiman/UBM-Hyogo/commits/main --jq '.sha')"
gh api "repos/daishiman/UBM-Hyogo/commits/${RECENT_SHA}/check-runs" \
  --jq '.check_runs[] | {name: .name, status: .status, conclusion: .conclusion, app: .app.slug}'
```

- 期待値: `confirmed-contexts.yml` の `contexts[].name` 全件が `name` フィールドに登場する。
- 失敗時: 不一致の context 名は **未出現** とみなし、Phase 9 QA 観点 1 へ差し戻す（`deferred_contexts[]` へ移送）。
- 記録欄: `outputs/phase-11/manual-smoke-log.md §1` に stdout 抜粋を貼付。

### ステップ 2: 実 PR の Checks タブで context 名を目視確認

```text
1. 任意の open PR（または直近 merge 済 PR）の Checks タブを開く
2. 左サイドバーに表示される `<workflow> / <job>` の文字列を全て採取
3. confirmed-contexts.yml の contexts[].name と突合
4. matrix 展開時は ` (<v1>, <v2>)` の値も照合
```

- 記録欄: `outputs/phase-11/manual-smoke-log.md §2` に context 名一覧をテキストで列挙（screenshot 不要）。
- 期待値: `confirmed-contexts.yml` の名称と完全一致。

### ステップ 3: dev branch への phase 1 リスト試験適用（任意・UT-GOV-001 承認ゲート下）

> 本ステップは branch protection 変更を伴うため、本タスクでは実行しない。必要な場合は UT-GOV-001 の user 承認後にのみ実行する。

```bash
# CONTEXTS は confirmed-contexts.yml の apply_phase==1 リストから生成される想定
# 例: ["ci / typecheck", "ci / lint", "ci / build (node-22)"]

# 適用前の現在設定をバックアップ
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > /tmp/dev-protection-backup.json

# 試験適用
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks.strict=false \
  -F required_status_checks.contexts='["ci / typecheck","ci / lint","ci / build (node-22)"]'
```

- 期待値: 200 OK + 適用後の protection JSON が返る。
- rollback 手順:
  ```bash
  cat /tmp/dev-protection-backup.json | gh api -X PUT \
    repos/daishiman/UBM-Hyogo/branches/dev/protection --input -
  ```
- 記録欄: `outputs/phase-11/manual-smoke-log.md §3` に request / response を貼付。**シークレット類は出力に含まれないが念のため `Authorization` ヘッダはマスク**。

### ステップ 4: dev への試験 PR 作成と全 context 揃い確認

```bash
# 任意の no-op PR を dev 向けに作成
gh pr create --base dev --head <feature-branch> --title "smoke: UT-GOV-004 context sync" --body "smoke test for UT-GOV-004"

# 数分待った後で checks 状況を確認
gh pr checks <pr-number>
```

- 期待値: 全 phase 1 context が `pass` に到達。`Expected — Waiting for status to be reported` が **1 件も無い**。
- 失敗時（Waiting 出現）: 該当 context は実在しない or 名称不一致 → Phase 5 抽出ヘルパに差し戻し。即座に rollback コマンドを実行。
- 記録欄: `outputs/phase-11/manual-smoke-log.md §4`。

### ステップ 5: 永続 block 不在の確認

```bash
gh pr checks <pr-number> --json name,bucket,state
```

- 期待値: 全 context の `state` が `pending` から `success` に到達。`pending` のまま 30 分以上残るものはゼロ。
- 失敗時: 即座に Step 3 の rollback を実行し、UT-GOV-001 着手を block 維持。
- 記録欄: `outputs/phase-11/manual-smoke-log.md §5`。

### ステップ 6: 試験適用の rollback（smoke 完了後必須）

```bash
cat /tmp/dev-protection-backup.json | gh api -X PUT \
  repos/daishiman/UBM-Hyogo/branches/dev/protection --input -
```

- 期待値: 200 OK + 元設定が復元。
- 記録欄: `outputs/phase-11/manual-smoke-log.md §6`。

> **重要**: 本 Phase の試験適用は **dev branch のみ**。main branch には絶対に適用しない（main は UT-GOV-001 の責務）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC matrix の smoke 列に本 Phase の証跡パスを記入 |
| Phase 9 | QA 観点 1（永続 block 防止）の実証跡 |
| Phase 12 | smoke で判明した運用知見を unassigned-task-detection.md に登録 |
| Phase 13 | smoke 結果を PR description に転記 |
| UT-GOV-001 | smoke で確定した context 名を直接消費 |

## 自動テスト結果サマリー（Phase 9 から転記、本 Phase の主証跡ソース）

| 種別 | テスト数 | PASS | FAIL | 主な検証対象 |
| --- | --- | --- | --- | --- |
| YAML lint（`confirmed-contexts.yml` schema） | TBD | TBD | TBD | v1 schema 適合 |
| 抽出ヘルパ unit（擬似） | TBD | TBD | TBD | extractWorkflowJobs 出力契約 |
| 段階適用判定 unit（擬似） | TBD | TBD | TBD | classifyApplyPhase の 30 日窓 |
| lefthook ↔ CI 三項対応の漏れ検査 | TBD | TBD | TBD | 空欄 / 片側 only ゼロ |

> 本タスクは実装比率が低いため自動テストは限定的。手動 smoke が主証跡。

## 多角的チェック観点

- 価値性: dev での試験適用が永続 block を起こさず通過する。
- 実現性: `gh api` 1 回で context 一致が確認できる。
- 整合性: smoke 結果が `confirmed-contexts.yml` と完全一致。
- 運用性: rollback 手順がワンコマンドで実行可能。
- 認可境界: smoke は dev のみで実行、main は触らない。
- secret hygiene: `Authorization` ヘッダ等を出力に含めない。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | check-runs 実在確認テンプレ | 11 | spec_created | gh api |
| 2 | PR Checks タブ目視テンプレ | 11 | spec_created | text 記録のみ |
| 3 | dev 試験適用テンプレ | 11 | spec_created | rollback 込み |
| 4 | 試験 PR 全 context 揃い確認テンプレ | 11 | spec_created | gh pr checks |
| 5 | 永続 block 不在確認テンプレ | 11 | spec_created | Waiting ゼロ |
| 6 | rollback 手順テンプレ | 11 | spec_created | 必須実行 |
| 7 | 既知制限リスト | 11 | spec_created | 5 件以上 |
| 8 | 自動テスト結果転記枠 | 11 | spec_created | Phase 9 から |

## manual evidence（実行時に採取するログの placeholder）【必須】

| 項目 | コマンド | 採取先 | 採取済 |
| --- | --- | --- | --- |
| check-runs 一覧 | `gh api repos/.../commits/<sha>/check-runs` | outputs/phase-11/manual-smoke-log.md §1 | TBD |
| PR Checks タブ context 名 | 手動目視（text 記録） | outputs/phase-11/manual-smoke-log.md §2 | TBD |
| dev protection PUT 応答 | `gh api -X PUT .../dev/protection` | outputs/phase-11/manual-smoke-log.md §3 | TBD |
| 試験 PR の `gh pr checks` 出力 | `gh pr checks <pr-number>` | outputs/phase-11/manual-smoke-log.md §4 | TBD |
| Waiting 状態の不在確認 | `gh pr checks <pr-number> --json name,bucket,state` | outputs/phase-11/manual-smoke-log.md §5 | TBD |
| rollback 応答 | バックアップ JSON を PUT で復元 | outputs/phase-11/manual-smoke-log.md §6 | TBD |

> 各セクションには「コマンド」「実行日時」「stdout 抜粋」「期待値との一致 / 不一致」を記録すること。`Authorization` ヘッダは必ずマスク。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | 本 Phase の試験適用は dev のみ。main は触らない | main 適用 smoke は不可 | UT-GOV-001 が main を扱う |
| 2 | solo 運用のため第三者 review は無し（self-review） | レビュー coverage | branch protection の `required_conversation_resolution` で代替 |
| 3 | GitHub API rate limit（authenticated 5000 req/h） | 連続実行不可 | 手動 smoke は 1 回 / 30 分目安 |
| 4 | matrix 展開後の context 名は GitHub 内部規則に依存し将来変更の可能性 | 互換性 | Phase 12 unassigned-task-detection で監視 |
| 5 | dev 試験 PR が他開発者の PR と並行する場合の interference | 試験中の他者 merge | smoke 中はアナウンスする運用ルール |
| 6 | rollback 失敗時は `gh api -X DELETE .../protection` で全解除し再構築 | 緊急対応 | バックアップ JSON は必ず保管 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke テンプレサマリー / 既知制限 / 自動テスト結果枠 |
| ログテンプレ | outputs/phase-11/manual-smoke-log.md | 6 セクションのログ穴埋めテンプレ |
| チェックリスト | outputs/phase-11/link-checklist.md | 参照ドキュメントのリンク死活確認 |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] manual evidence テーブルの 6 項目すべてに採取コマンド + 採取先が定義済み
- [ ] 自動テスト結果サマリー枠（4 種）が定義済み
- [ ] 既知制限が 5 件以上列挙
- [ ] visualEvidence: NON_VISUAL が明記され `screenshots/` ディレクトリは作成されていない
- [ ] dev のみの実行範囲、main 不可侵が明記
- [ ] rollback 手順が必須実行として記述

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-11/` 配下に配置される設計
- AC-1〜AC-7 の証跡採取コマンドが定義済み
- main branch への適用が UT-GOV-001 へ委譲されることが明記
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - smoke テンプレ実行で得られた知見を `unassigned-task-detection.md` / `skill-feedback-report.md` に登録
  - 既知制限 #4（matrix 展開仕様変更監視）を Phase 12 で継続監視タスクへ
  - 自動テスト結果（YAML lint / 抽出 / 判定 / lefthook 漏れ検査）を `system-spec-update-summary.md` に転記
  - 実行は本仕様書作成時点では未実施。実行者は本テンプレの穴埋めをもって evidence とする
- ブロック条件:
  - manual evidence の 6 項目に未採取 / 未 N/A 化が残る（実行フェーズで判定）
  - dev 試験適用後の rollback が記録されていない
  - main branch への試験適用が誤って実施された
  - `screenshots/` ディレクトリが誤って作成されている

## 依存成果物参照

- `outputs/phase-02/context-name-mapping.md`
- `outputs/phase-02/staged-rollout-plan.md`
- `outputs/phase-02/lefthook-ci-correspondence.md`
- `outputs/phase-06/failure-cases.md`
- `outputs/phase-08/main.md`
- `outputs/phase-08/confirmed-contexts.yml`
- `outputs/phase-08/lefthook-ci-mapping.md`
