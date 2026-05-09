# U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-02: Branch protection に audit-correlation-verify を required 登録 - タスク指示書

## メタ情報

```yaml
parent_issue_number: 516
issue_number: 554
```

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-02                                         |
| タスク名     | `audit-correlation-verify / verify` を branch protection の required status check に登録 |
| 分類         | ガバナンス / セキュリティ                                                     |
| 対象機能     | `.github/workflows/audit-correlation-verify.yml` + branch protection 設定     |
| 優先度       | 中（priority:medium）                                                         |
| 見積もり規模 | 小規模（scale:small）                                                         |
| ステータス   | formalized / transferred_to_workflow（canonical workflow 作成済み。外部 PUT は user gate） |
| 発見元       | Issue #516 Phase-12 / outputs/phase-12/unassigned-task-detection.md          |
| 発見日       | 2026-05-07                                                                    |
| 親タスク     | `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`     |
| 親 Issue     | https://github.com/daishiman/UBM-Hyogo/issues/516                             |
| 着手判断     | `audit-correlation-verify.yml` が main 上で 1 回以上 empirical green になった後（drift / flaky を観測してから登録するため） |

---

## Formalization trace

本未タスクは `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/` に formalize 済み。重複着手を避けるため、このファイルは起票元 trace としてのみ維持する。Issue #554 は CLOSED のまま `Refs #554` で参照し、`gh api -X PUT` / commit / push / PR はユーザー明示承認後の Phase 13 でのみ実施する。

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #516 で `.github/workflows/audit-correlation-verify.yml` を新規作成し、fixture 駆動の
typecheck / lint / vitest / bats / shellcheck / actionlint を CI で恒久実行している。
ただし branch protection の required status check に登録すると、empirical green 化の前から
新 PR を全てブロックする risk があるため、Issue #516 では「workflow 追加のみ」に留めた。

### 1.2 問題点・課題

- required status check に未登録のため、誤って `audit-correlation-verify` job を skip / disable
  するような workflow 編集 PR が main にマージされうる。
- CLAUDE.md の solo 運用ポリシー（`required_status_checks` で品質保証）と整合させるには、
  本 workflow も protection に組み込む必要がある。
- `dev` / `main` 双方の branch protection 同期が抜けると drift 検知（UT-GOV-001）で fail する
  可能性がある。

### 1.3 放置した場合の影響

- audit-correlation の grep gate が CI で実行されない PR が main に到達するリスク。
- governance drift が累積し、UT-GOV-001 系の audit で別の workflow と一括検出される。

---

## 2. 何を達成するか（What）

### 2.1 目的

`audit-correlation-verify / verify` job を `dev` および `main` の `required_status_checks.contexts`
に追加し、`gh api repos/{owner}/{repo}/branches/<branch>/protection` で drift がないことを
確認する。

### 2.2 最終ゴール

- `dev` / `main` 双方で `audit-correlation-verify / verify` が required status check に登録されている。
- protection スナップショットが governance リファレンス（CLAUDE.md / aiworkflow-requirements）に
  反映されている。

### 2.3 完了条件（DoD）

- [ ] `audit-correlation-verify.yml` が main の最新 commit で 1 回以上 empirical green になっている。
- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` の `required_status_checks.contexts`
      に `audit-correlation-verify / verify` が含まれる。
- [ ] 同じく `branches/main/protection` にも含まれる。
- [ ] CLAUDE.md governance 章 / aiworkflow-requirements `references/branch-protection.md` に
      追記済み。
- [ ] UT-GOV-001 系 drift check で `required_pull_request_reviews=null` / `lock_branch=false` /
      `enforce_admins=true` が維持されていること。

---

## 3. どう実現するか（How）

### 3.1 手順

1. main で `audit-correlation-verify` の最新 run が green であることを確認（`gh run list` 等）。
2. 現行 protection を取得しスナップショット保存:
   ```bash
   gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > /tmp/dev-before.json
   gh api repos/daishiman/UBM-Hyogo/branches/main/protection > /tmp/main-before.json
   ```
3. `required_status_checks.contexts` に `audit-correlation-verify / verify` を追加して PUT:
   ```bash
   gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
     -F required_status_checks.strict=... -F 'required_status_checks.contexts[]=audit-correlation-verify / verify' ...
   ```
   （実際は jq で既存 contexts と merge してから PUT）
4. PUT 後に `gh api branches/<b>/protection` を再取得し diff verify。
5. CLAUDE.md / aiworkflow-requirements に追記し PR を作成。

### 3.2 検証方法

- 適当な docs-only PR を作って `dev` に向け、`audit-correlation-verify / verify` が必須として
  待機状態になることを確認（pass を待つだけで十分）。
- `gh api repos/{owner}/{repo}/branches/dev/protection` の出力を grep して登録確認。

---

## 4. 苦戦箇所（親タスクからの教訓）

### 4.1 Issue #516 で苦戦した点

- **workflow 追加 → branch protection 登録の順序**: Issue #516 では「workflow が empirical green
  になる前に required 登録すると、初回 PR がデッドロックする」リスクを考慮し、protection 編集を
  分離した。**再現対策**: 本タスクでも main 上で 1 回以上 green を確認した後にしか PUT しない。
- **既存 contexts の merge**: `gh api -X PUT branches/.../protection` は contexts 配列を全置換
  するため、jq 等で既存と merge する必要がある。**再現対策**: 必ず before スナップショットを
  取得し、merge 後の diff を目視 review する。

### 4.2 本タスク固有の予想苦戦点

- protection PUT API のスキーマが `required_pull_request_reviews=null` をうまく送れない場合がある
  （明示 null vs key 削除の挙動差）。事前に小さな PUT で挙動を確かめてから本番 PUT する。
- governance 文書とリポジトリ実態の drift（CLAUDE.md は運用参照、GitHub 側が正本）。

### 4.3 Issue #554 formalization wave (2026-05-08) で実際に苦戦した点

Phase 1-12 を本ワークフロー（`docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/`）として形式化する過程で確認された具体的な苦戦点。実 PUT は Phase 13 user gate 待ちのため、以下は仕様面・準備面の知見:

- **before snapshot drift の取り扱い**: read-only `gh api branches/{dev,main}/protection` の取得時点で
  `enforce_admins` / `required_linear_history` / main 側 `required_pull_request_reviews` が CLAUDE.md
  の宣言と乖離していた。**再現対策**: cycle 内で silently 修正せず、Phase 13 user 承認で
  「contexts-only apply」「same-operation drift correction」「separate task creation」のいずれかを
  ユーザーに必ず選ばせる構造に固定する（`outputs/phase-12/unassigned-task-detection.md` 参照）。
- **PUT payload の destructive 性**: `gh api -X PUT branches/.../protection` は payload に含めない field
  を破壊するため、contexts 追加だけのつもりでも `required_pull_request_reviews=null` / `enforce_admins`
  / `lock_branch=false` / `allow_force_pushes=false` を毎回明示的に再送する必要がある。
  **再現対策**: 本ワークフローでは contexts-only normalized adapter を採用し、既存値を before JSON
  から jq で merge する手順を Phase 11/13 に固定。Phase 12 main で `required_pull_request_reviews=null`
  維持を不変条件として明文化済み。
- **canonical workflow root の削除事故**: 過去 wave で `docs/30-workflows/` 配下の current references が
  別 PR に巻き込まれて削除されているのを検出。current references を壊すため復元が必要だった。
  **再現対策**: phase-12 の `unassigned-task-detection.md` で「canonical workflow root deletion repair」
  を decision として明示し、新規未タスク化せずに in-wave 復元する判断を成文化。
- **artifacts.json の正本一意化**: `outputs/artifacts.json` と root `artifacts.json` の二重化が容易に
  発生し、`metadata.workflow_state` / `taskType` / `visualEvidence` が drift しやすい。
  **再現対策**: root `artifacts.json` を単一正本とし、`workflow_state=spec_created` /
  `taskType=implementation` / `visualEvidence=NON_VISUAL` を Phase 12 close-out で固定する。
- **Phase 12 strict 7 outputs**: `main.md` / `implementation-guide.md` / `system-spec-update-summary.md`
  / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` /
  `phase12-task-spec-compliance-check.md` のいずれかが欠けると compliance check で fail する。
  **再現対策**: ワークフロー生成時にこの 7 ファイルを必ず先に空ファイルでも作成し、内容を後埋めする。
- **aiworkflow-requirements 同期の網羅性**: `quick-reference` / `resource-map` / `topic-map` /
  `keywords.json` / `task-workflow-active` / `changelog` / `references/branch-protection.md` /
  artifact inventory の 8 箇所すべてに同 wave で導線追加が必要。
  **再現対策**: Phase 12 `documentation-changelog.md` に 8 箇所同期チェックリストを必ず置く。

---

## 5. システム仕様書への反映

- aiworkflow-requirements `references/branch-protection.md`（既存があれば編集、無ければ新規）に
  `audit-correlation-verify / verify` を反映。
- `indexes/quick-reference.md` / `indexes/topic-map.md` の governance 章を更新。

---

## 6. スコープ

### 含む
- `dev` / `main` branch protection への required status check 追加
- governance ドキュメント更新

### 含まない
- workflow 自体の編集（Issue #516 の責務）
- `required_pull_request_reviews` の有効化（solo 運用ポリシーに反する）

## 7. 参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/516
- 親タスク: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`
- workflow: `.github/workflows/audit-correlation-verify.yml`
- 検出元: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/outputs/phase-12/unassigned-task-detection.md`
- governance 参照: CLAUDE.md「Governance / CODEOWNERS」「ブランチ戦略」
