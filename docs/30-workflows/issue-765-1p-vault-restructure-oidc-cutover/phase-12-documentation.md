# Phase 12: ドキュメント更新

## メタ情報

- phase: 12 / documentation
- prev: phase-11-manual-test
- next: phase-13-pr
- 実装区分: 実装仕様書

## 目的

正本仕様 `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の inventory を canonical 2 path（`api_token_staging` / `api_token_production`）に整合させ、legacy 6 path に deprecated marker を付与し、本ワークフローの Phase 12 strict 7 outputs を作成する。

## 実行タスク

1. Phase 12 strict 7 outputs を作成し、root workflow の状態と整合させる
2. aiworkflow-requirements の workflow registration と索引を同一 wave で更新する
3. runtime/user-gated evidence の pending 境界と system spec update summary を記録する

## 中学生レベル概念説明（Phase 12 必須項目）

### このタスクで設計したこと

1Password という「鍵を安全にしまっておく金庫」の中で、Cloudflare（クラウドサービス）にアクセスするための鍵を**どこにしまうかの番地（op:// path）**がバラバラになっていました。例えば「2 階の引き出し」「3 階の棚」「地下の金庫」と 6 箇所に同じような鍵が入っていて、コードや設定ファイルがどれを参照すべきか迷う状態でした。

そこで:

1. 鍵の番地を 2 つだけ（staging 用 1 つ・production 用 1 つ）に**揃える設計**にした
2. 古い 6 箇所の番地は、いきなり捨てずに「archived（しまい込み）」状態へ移す計画にし、もし問題が起きたらすぐ戻せるようにした
3. コードや `.env` ファイルから「古い番地」を参照している箇所を新しい番地へ書き換える差分を定義した
4. 二度と古い番地を書いてしまわないよう、**自動チェック（grep gate）**を追加する計画にした
5. 一定期間（deprecation window）様子を見て問題が起きなければ、別の承認手順で archived item を**物理的に削除**する（このタスクではここまでやらない）

### なぜいきなり legacy を削除しないのか

「archive」と「物理 delete」を分けているのは、**いきなり捨てると戻せないから**です。もしどこかのコード・スクリプト・CI 設定で見落とした legacy path 参照が残っていたら、削除した瞬間にデプロイや CLI が動かなくなります。archive 状態であれば、1Password 上で unarchive すれば即時に元に戻せます。物理 delete してしまうと、token を新規発行して再投入するしかなく、復旧に時間がかかります。

### なぜ token 値を絶対にどこにも書かないのか

token 値（鍵そのものの中身）をドキュメント・ログ・evidence ファイルに 1 文字でも書いてしまうと、それが Git 履歴に永久に残り、さらに **AI（Claude を含む）の学習データに混入する事故**につながります。一度混入すると取り消せません。だから本タスクでは、token 値・vault URI の中身・item secret reference の中身を**絶対に記録せず**、「item の名前（番地）」と「状態（active / archived）」だけを記録する規律にしています。

## ドキュメント更新内容

### 12.1 `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

inventory 表に以下を反映:

| op:// path | role | status | 用途 | rotation policy |
|----------|------|--------|------|---------------|
| `op://UBM-Hyogo/Cloudflare/api_token_staging` | canonical | active | `bash scripts/cf.sh` staging 経路 / `.env.example` reference | 90 日 |
| `op://UBM-Hyogo/Cloudflare/api_token_production` | canonical | active | `bash scripts/cf.sh` production 経路 / production deploy reference | 90 日 |
| `op://UBM-Hyogo/Cloudflare/<legacy item 1>` | legacy | archive pending (Issue #765 Phase 11 user-gated) | 旧 staging account-scoped 経路 | 物理 delete は Gate B' で実施 |
| `op://UBM-Hyogo/Cloudflare/<legacy item 2..6>` | legacy | archive pending (Issue #765 Phase 11 user-gated) | 旧用途 | 同上 |

changelog 節に追記:

```
- 2026-05-18: Issue #765 で 1Password vault `UBM-Hyogo/Cloudflare` の op:// path を canonical 2 種へ統合する仕様を作成。
  legacy 6 item の archive は Phase 11 user gate 後に実行。grep gate `scripts/verify-onepassword-op-uri-canonical.sh` を追加予定。
  物理 delete は Gate B'（deprecation window 経過後・別 sub-gate）で実施予定。
  evidence: docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/outputs/phase-11/
```

### 12.2 `docs/30-workflows/unassigned-task/issue-717-followup-003-1password-restructure.md`

ステータスを「Issue #765 本ワークフローへ昇格済 / archive 段階は Issue #765 Phase 11 で user-gated / 物理 delete は Gate B' pending」へ更新する。親未タスクの完了扱いは Issue #765 PR merge 後に限定し、Gate B' は別 sub-gate として残す。

### 12.3 `completed-tasks/` 移動準備

本ワークフローの `completed-tasks/` 移動は **Phase 13 PR マージ後に実施**する。Phase 12 spec_created 段階では移動しない（task-spec-creator の path normalization rule に従う）。物理 delete を扱う後続 workflow（Gate B'）で改めて completed 化する設計もあり得るが、本ワークフローでは archive 完了 + grep gate green の時点で `completed-tasks/` 移動可能とする方針を採る。

## 参照資料

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`

## 成果物（Phase 12 strict 7 outputs）

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`（Phase 13 PR 本文生成用要約）
- `outputs/phase-12/system-spec-update-summary.md`（deployment-secrets-management.md の更新点）
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`（残課題があれば。なければ「該当なし」を明記）
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [ ] `deployment-secrets-management.md` の差分案がレビュー可能な状態
- [ ] unassigned-task 元仕様書のステータスが整合
- [ ] 中学生レベル概念説明セクションが本ファイルに記載済み（compliance check 項目）
- [ ] strict 7 outputs すべてが作成されている

## タスク100%実行確認【必須】

- [ ] 成果物 7 ファイル作成（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）
- [ ] redaction 漏れがないことを確認（token 値・URI 値・vault item secret reference 中身の混入 0 件）
- [ ] canonical 2 path のみが正本として記載されている

## 次Phase

phase-13-pr.md
