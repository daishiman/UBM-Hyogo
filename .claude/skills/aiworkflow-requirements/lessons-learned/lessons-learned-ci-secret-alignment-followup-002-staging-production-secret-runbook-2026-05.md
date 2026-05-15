# Lessons Learned — CI Secret Alignment Followup-002 Staging / Production Secret Runbook（2026-05-14）

> task: `ci-secret-alignment-followup-002-staging-production-secret-runbook`
> 関連 spec: `docs/30-workflows/ci-secret-alignment-followup-002-staging-production-secret-runbook/phase-{1..13}.md`、`docs/30-workflows/ci-secret-alignment-followup-002-staging-production-secret-runbook/outputs/phase-{11,12}/`
> 関連 source: `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md`、`runbooks/production-secret-provisioning.md`、`runbooks/secret-provisioning.md`、`scripts/smoke/provision-staging-secrets.sh`
> 関連 reference: `references/deployment-secrets-management.md`、`references/task-workflow-active.md`、`indexes/quick-reference.md`、`indexes/resource-map.md`、`changelog/20260514-ci-secret-alignment-followup-002-staging-production-secret-runbook.md`

## 教訓一覧

### L-CIPR-FU-002-001: 初期 docs-only 判定は close-out review で必ず adjacent helper / runbook を grep し直し、stale CLI guidance があれば CONST_009 で同一サイクル補正に格上げする

- **背景**: 当初は「runbook 新規 2 本のみ」の docs-only として spec 化したが、close-out review で `scripts/smoke/provision-staging-secrets.sh` と既存 `secret-provisioning.md` に `gh secret set --body -` という stale guidance が残存していることを検出した。現行 `gh secret set --help` は `--body` 未指定時に stdin を読む契約に変わっており、運用者がコピペするとそのまま事故になる。
- **教訓**: docs-only 判定は spec 段階の暫定値であり、Phase 11 close-out review で **同じトピックを扱う adjacent helper / runbook を必ず grep し、stale CLI / API guidance を検出**したら CONST_009（ラベルより実態優先）に従い同一サイクルで `implementation / NON_VISUAL / docs_plus_script_fix` に reclassify する。別 PR に分離すると runbook と helper の説明が乖離して運用事故になる。
- **将来アクション**: secret / CLI 操作系の runbook を新規作成する task では Phase 2（既存資産インベントリ）に「同トピックの helper / 既存 runbook の grep」を AC として含める。grep 対象キーワードは少なくとも `gh secret set` / `wrangler secret put` / `op read` / `op run` / `--body` のような副作用 CLI を入れる。

### L-CIPR-FU-002-002: `gh secret set` の正式契約は「stdin を読む」。`--body -` / `--body <(...)` パターンは記述禁止

- **背景**: `gh secret set --body -` は古い CLI バージョンの非公式運用で、現行版では `--body` の引数として文字列 `-` を扱う挙動になり secret に literal `-` が登録されてしまう。同様に `--body <(op read ...)` は zsh process substitution の path を渡すため macOS / Linux で挙動が異なる。
- **教訓**: secret 投入の canonical 形は `op read 'op://...' | gh secret set NAME --env <env>` の **stdin pipe** のみ。runbook / helper / spec 内のコード例は grep gate で `--body -` / `--body <(` パターンを禁止語として検出する。本 task では Phase 6 gate `g2-secret-literal-grep` / `g4-op-reference-grep` で確認した。
- **将来アクション**: aiworkflow-requirements の `references/deployment-secrets-management.md` を SSOT とし、新規 runbook はここを参照する。CLI 契約が変わった場合は SSOT を 1 箇所だけ更新し、各 runbook に DRY で反映する運用にする。

### L-CIPR-FU-002-003: runbook ファミリ並立構成（template + N 派生）は章立て一致 grep gate を Phase 6 に含めて drift を防ぐ

- **背景**: `staging-runtime-smoke` 用の既存 `secret-provisioning.md` を template に、`staging-secret-provisioning.md` / `production-secret-provisioning.md` の 2 本を新設する並立構成（3 ファイル）にした。template が更新されても派生が追随しないと運用が分岐する。
- **教訓**: 同一テンプレを共有する runbook ファミリでは、Phase 6 検証手順に **章立て diff の grep gate**（`grep -nE '^## ' file1 file2 file3` → `diff` で章タイトルと並びの一致確認）を含める。本 task では `g1-heading-diff.txt` として Phase 11 evidence に保存し、再現可能にした。
- **将来アクション**: runbook 系 task の Phase 3（差分設計）で「ファミリ並立か単独か」を必ず明示し、並立なら Phase 6 章立て gate を必須化する。新規派生を追加するときは template の章立てを正本とする旨を index.md の不変条件に書く。

### L-CIPR-FU-002-004: `CLOUDFLARE_ACCOUNT_ID` は GitHub Variables、`CLOUDFLARE_API_TOKEN` は Environment Secret という境界は runbook 冒頭で明記する

- **背景**: Cloudflare API 経路の認証は token + account id の対だが、account id は機密ではない（公開しても直接の不正利用はできない）。誤って Environment Secret として投入されると rotation / 可視化のオペレーション負荷が無駄に増える。
- **教訓**: secret / variable の境界は runbook の **冒頭（目的 / 必要 secret 一覧）に明記**し、`CLOUDFLARE_ACCOUNT_ID` を「Variables 管理」と明示する。SSOT は `references/deployment-secrets-management.md`。
- **将来アクション**: 新規 Cloudflare 系 runbook を作るときは `deployment-secrets-management.md` の boundary 表を参照リンクとして冒頭に貼る。

### L-CIPR-FU-002-005: close 済 Issue の対象成果物が未作成のまま残っていたら、Issue を再 open せず canonical workflow を新設して `Refs #<n>` で履歴を紐付ける

- **背景**: Issue #662 は CLOSED 済だったが、In-scope 「staging / production Environment 用 secret provisioning runbook」項目は未充足のまま親 workflow が `completed-tasks/` に移動していた。
- **教訓**: 親 workflow が completed 後に未充足項目が見つかった場合、**Issue を再 open するのではなく**新しい canonical workflow（本 task）を立て、`index.md` の「由来 Issue」欄と将来の PR description に `Refs #<n>` で紐付ける。CLOSED Issue の再 open は notification ノイズとレビュー履歴の混線を生む。
- **将来アクション**: `task-specification-creator` の `closed-issue-formalization` 系 reference に「close 済 Issue の対象成果物未作成パターン」を 1 項目として追加候補にする（本 task の skill-feedback-report.md でも検討事項として明示済）。

## 同期した正本

- `references/deployment-secrets-management.md`（staging / production web-cd boundary + stdin contract 補正）
- `references/task-workflow-active.md`（followup-002 linkage）
- `indexes/quick-reference.md`（web-cd staging / production secret provisioning 行）
- `indexes/resource-map.md`（canonical artifact 一覧）
- `indexes/topic-map.md` / `indexes/keywords.json`（再生成）
- `changelog/20260514-ci-secret-alignment-followup-002-staging-production-secret-runbook.md`
- `SKILL-changelog.md`
