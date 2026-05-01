# Phase 13: PR 作成 / ユーザー承認後の実装着手（user 明示承認後のみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| ID | UT-06-FU-E |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 / ユーザー承認後の実装着手 |
| 作成日 | 2026-05-01 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（本ワークフロー完了 / 後続は別 PR） |
| 状態 | spec_created |
| タスク種別 | docs-only / workflow_state: spec_created / visualEvidence: NON_VISUAL / scope: data_backup |
| GitHub Issue | #118 (CLOSED) |
| user_approval_required | **true** |
| 実行ステータス | **NOT EXECUTED — awaiting user approval** |

> **PR 作成は user の明示承認後のみ実行する。**
> 本 Phase 仕様書は「PR テンプレ・local check 手順・change-summary・後続実装 PR の起票テンプレ」を **予約** する目的で作成され、`git commit` / `git push` / `gh pr create` は user の明示指示があるまで一切実行しない。

---

## 目的

本 Phase 13 は **本ワークフローの最後のゲート** であり、以下 2 系統の判断を user に提示し、明示承認を得てから実行に移す。

1. **PR 1: 本ワークフロー（Phase 1〜12 仕様書整備）の docs-only PR**
   - 内容: `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/` 配下の `index.md` / `artifacts.json` / `phase-01.md`〜`phase-13.md` / `outputs/phase-{01,02,03}/main.md` を 1 PR にまとめる。
   - 本 PR は **docs-only**。`.github/workflows/d1-backup.yml` の export 主経路追加、`apps/api/wrangler.toml` の healthcheck cron 追加、R2 bucket 設定、暗号化設定変更は **一切含まない**。
   - 不変条件 #5 違反なし（`apps/web` から D1 直接アクセス経路は markdown / JSON のみで構造上発生しない）。
2. **PR 2: 後続 実コード実装 PR の起票方針**
   - 別ブランチ（例: `feat/ut-06-fu-e-d1-backup-impl`）で `.github/workflows/d1-backup.yml` に export 主経路、`apps/api/wrangler.toml` に R2 latest healthcheck cron、Phase 11 smoke S-03 / S-07 / S-11 / S-15 / S-19 実走を行う。
   - 本 Phase 13 では起票テンプレ（タイトル / description / AC checklist trace / smoke evidence 添付欄）を **仕様レベル** で定義する。後続 PR の起票も **ユーザー明示承認後**。

---

## 依存

| 種別 | 対象 | 受け取る前提 |
| --- | --- | --- |
| 上流（必須） | Phase 1〜12 完了 | `artifacts.json.phases[*].status` が `completed` または `spec_created` で揃っていること |
| 上流 | Phase 1 真の論点・AC-1〜AC-9 | PR description の AC trace |
| 上流 | Phase 12 ドキュメント更新の 6 タスクが `spec_created` 状態で記録 | PR description の「next step」根拠 |
| 関連 | Issue #118（CLOSED） | 本 PR では **CLOSED 状態の参照のみ**（`Refs #118`）。再 open / 再 close は user 判断 |

---

## ユーザー承認ゲート（最優先 / 必須）

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜3 完了 | `artifacts.json` で `completed` | 要確認 |
| Phase 4〜12 spec_created | `artifacts.json` で `spec_created` | 要確認 |
| Phase 12 6 タスクの spec_created 状態 | implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check | 要確認 |
| Issue #118 状態 | CLOSED のままで参照のみ（再 open するかは user 判断） | 要確認 |
| 不変条件 #5 違反チェック | 本 PR の差分に `apps/web` から D1 を直接叩く形が **含まれていない**（docs-only のため当然 0 件） | 要確認 |
| Secret 実値混入チェック（`op://` 参照名は許可） | 0 件 | 要確認 |
| 計画系 wording 残存チェック | `仕様策定のみ` / `実行予定` / `保留として記録` 等が outputs に残っていないか | 要確認 |
| Phase 12 §タスク 6 compliance-check 10 項目 | すべて PASS | 要確認 |
| user の明示承認（PR 1） | user から「ワークフロー仕様書 PR を作成してよい」 | **承認待ち** |
| user の明示承認（PR 2 起票） | user から「後続の実コード実装 PR を起票してよい」 | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない。**

---

## PR 1 仕様（ワークフロー仕様書整備 PR）

### ブランチ / base / head

| 項目 | 値 |
| --- | --- |
| head ブランチ | `docs/issue-118-ut-06-followup-E-d1-backup-long-term-storage` |
| base ブランチ | `main`（docs-only のため main 直接 PR を許容。user が dev 経由を希望した場合は `dev` を base にする） |
| labels | `area:docs` / `task:ut-06-fu-e` / `wave:2` / `governance` |
| linked issue | `Refs #118`（**`Closes #118` ではない**。Issue は CLOSED のままで実装は別 PR で行うため） |

### PR タイトル

```
docs(workflow): Add UT-06-FU-E task spec for D1 backup long-term storage (issue #118)
```

### PR description テンプレ

````markdown
## 概要

UT-06 Phase 12 で UNASSIGNED-E として検出された「本番 D1 バックアップ長期保管・日次自動取得」を、`apps/api` cron triggers + R2 30 日 + 月次世代管理 + SSE/KMS/ACL 暗号化 + 復元 SLO < 15 分 + 月次机上演習で実行可能化する **Phase 1〜13 タスク仕様書整備 docs-only PR**。実コード実装（cron handler / wrangler.toml cron triggers / R2 bucket 設定）は本 PR には含まず、ユーザー承認後の別 PR（`feat/ut-06-fu-e-d1-backup-impl`）で実施する。

## 動機

- UT-06 Phase 12 UNASSIGNED-E を解消可能な状態に昇格
- D1 export 一次保管（UT-06 Phase 5）から長期保管・冗長化への昇格経路を仕様レベルで固定
- Cloudflare cron triggers / R2 / UT-08 通知 を AC-7（`bash scripts/cf.sh` 経由徹底）で統合
- Issue #118 は CLOSED のままだが、再 open せず仕様書整備のみで先行する

## 変更内容（docs-only）

- 新規: `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/`
  - `index.md` / `artifacts.json`
  - `phase-01.md` 〜 `phase-13.md`（13 ファイル）
  - `outputs/phase-01/main.md` / `phase-02/main.md` / `phase-03/main.md`
- **本 PR では `apps/api/` / `apps/web/` / `wrangler.toml` / R2 設定 / Cloudflare Secret に一切触れない**

## AC trace（受入条件 AC-1〜AC-9 → 仕様書中の固定箇所）

| AC | 内容 | 仕様書中の固定箇所 |
| --- | --- | --- |
| AC-1 | 日次 cron 稼働 + 成功 log | Phase 9 §C4 / Phase 10 §R1〜R3 / Phase 11 §S-03 / S-07 |
| AC-2 | R2 30 日 + 月次世代管理 | Phase 9 §C2 / Phase 10 §R4 |
| AC-3 | SSE / KMS / ACL 設定 | Phase 8 / Phase 11 §S-03 §L3 metadata |
| AC-4 | 復元 runbook + 机上演習結果記録 | Phase 10 §復元 runbook / §月次机上演習計画 / Phase 11 §S-11 |
| AC-5 | 失敗時 UT-08 通知 alert | Phase 10 §R5 / Phase 11 §S-19 |
| AC-6 | 空 export 許容バリデーション | Phase 9 §AC-6 扱い / Phase 11 §S-15 |
| AC-7 | `bash scripts/cf.sh d1 export` 経由（wrangler 直接禁止） | 全 Phase で徹底 |
| AC-8 | GHA 採用時 UT-05-FU-003 監視 / Cloudflare 採用時 GHA 不圧迫 | Phase 9 §C4 |
| AC-9 | 機密性レベル別暗号化方式記録 | Phase 8 / Phase 11 §L3 |

## 不変条件 #5 違反なし（docs-only）

本 PR は markdown / JSON のみの追加で、`apps/web` から D1 を直接叩く形に変質する余地は構造上存在しない。

## Phase 12 6 タスクの spec_created 状態

| タスク | 状態 |
| --- | --- |
| implementation-guide | spec_created |
| system-spec-update-summary | spec_created |
| documentation-changelog | spec_created |
| unassigned-task-detection | spec_created |
| skill-feedback-report | spec_created |
| phase12-task-spec-compliance-check | spec_created |

## next step（実コード実装は別 PR）

本 PR マージ後、`feat/ut-06-fu-e-d1-backup-impl` ブランチを切り、Phase 5 ランブックを入力にして cron handler 実装 + Phase 11 smoke S-03 / S-07 / S-11 / S-15 / S-19 実走を行う。実装 PR の起票も **user 明示承認後**。

## 関連

- Refs #118（CLOSED のまま参照のみ）
- 上流: `docs/30-workflows/completed-tasks/ut-06-followup-E-d1-backup-long-term-storage.md`
- 関連: UT-12 R2 storage / UT-08 monitoring / UT-05-FU-003 / UT-06 Phase 6 rollback-rehearsal
- 下流: UT-06 Phase 5 d1-backup-evidence.md への append-only 更新

## レビュー方針

- solo 運用のため required reviewers = 0（CLAUDE.md §ブランチ戦略 準拠）
- CI gate / 線形履歴 / 会話解決必須化 / force-push & 削除禁止 で品質保証
````

### CI 必須 check（PR 1）

| check 種別 | 内容 | 想定 |
| --- | --- | --- |
| docs validator | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage` PASS | docs-only スコープ最終 gate |
| `verify-indexes-up-to-date` | `.github/workflows/verify-indexes.yml` | indexes drift なし |
| 線形履歴 | `required_linear_history` | merge commit 不可 |
| 会話解決 | `required_conversation_resolution` | レビューコメント全解決 |
| typecheck / lint / test | docs-only のため対象外 | スキップ可 |

### local-check（PR 1 作成前 / docs-only スコープ）

```bash
# 必須ファイル存在確認
ls docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/
ls docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-01/
ls docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-02/
ls docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-03/

# 不変条件 #5 違反混入チェック
git diff --name-only main...HEAD | rg "apps/web/" \
  && echo "FAIL: apps/web 編集が混入" \
  || echo "OK: apps/web 不在"

# wrangler 直接実行混入チェック（AC-7）
rg -n -e '(^|[[:space:]])wrangler[[:space:]]+(d1|deploy|rollback|secret)' \
  docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/ \
  && echo "FAIL: wrangler 直接実行混入" \
  || echo "OK: scripts/cf.sh 経由のみ"

# 計画系 wording / Secret 値混入チェック
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/ \
  && echo "FAIL: 計画系 wording 残存" \
  || echo "OK: 計画系 wording なし"

rg -n -e 'ya29\.' -e '-----BEGIN PRIVATE' -e 'CLOUDFLARE_API_TOKEN=' \
  docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/ \
  && echo "FAIL: Secret/op URI 混入" \
  || echo "OK: Secret 混入なし"

# screenshots 不在確認（NON_VISUAL）
find docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/ -name screenshots -type d \
  && echo "FAIL: screenshots/ 存在" \
  || echo "OK: NON_VISUAL 整合"

# spec validator
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage
```

### PR 1 作成コマンド（user 承認後のみ実行）

```bash
git status
git branch --show-current

git add docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/

git commit -m "$(cat <<'EOF'
docs(workflow): Add UT-06-FU-E task spec for D1 backup long-term storage (issue #118)

- ut-06-followup-E-d1-backup-long-term-storage ワークフロー新規作成
- Phase 1〜13 仕様書 + outputs/phase-{01,02,03}/main.md
- AC-1〜AC-9 / 不変条件 #5 / GHA schedule 主 + Cloudflare cron healthcheck / R2 daily 30 日 + monthly 12 ヶ月 / 復元 SLO < 15 分 / scripts/cf.sh 経由徹底
- 実 cron 有効化 / 実 backup / 実演習は user 承認後の別 PR (feat/ut-06-fu-e-d1-backup-impl)

Refs #118

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin docs/issue-118-ut-06-followup-E-d1-backup-long-term-storage

gh pr create \
  --title "docs(workflow): Add UT-06-FU-E task spec for D1 backup long-term storage (issue #118)" \
  --base main \
  --body "$(cat <<'EOF'
（上記 PR description テンプレを貼付）
EOF
)"
```

---

## PR 2 仕様（後続 実コード実装 PR の起票テンプレ）

> **本 Phase 13 では PR 2 を起票しない。** 起票そのものが user の明示承認後の別アクション。本セクションはテンプレを「予約」するのみ。

### ブランチ / base / head

| 項目 | 値 |
| --- | --- |
| head ブランチ | `feat/ut-06-fu-e-d1-backup-impl` |
| base ブランチ | `dev` |
| labels | `area:api` / `task:ut-06-fu-e` / `wave:2` / `feature` / `data_backup` |
| linked issue | `Closes #118`（実装完了時のみ Closes。事前に Issue 再 open するかは user 判断） |

### PR タイトル

```
feat(api): apps/api に D1 日次バックアップ cron + R2 長期保管を実装 (UT-06-FU-E)
```

### PR description テンプレ（実装 PR）

````markdown
## 概要

ut-06-followup-E-d1-backup-long-term-storage ワークフロー Phase 5 ランブックを実走し、`.github/workflows/d1-backup.yml` で D1 export → gzip → R2 PUT（SSE / KMS / ACL）→ 月初判定で月次 prefix 複製を実装し、`apps/api/wrangler.toml` には R2 latest healthcheck / UT-08 alert 用 cron triggers を追加する。

仕様書は別 PR（docs(workflow)）で `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/` 配下に既に固定済。

## 変更内容

- `.github/workflows/d1-backup.yml`
- `apps/api/wrangler.toml`（healthcheck cron のみ）
  - `[triggers] crons = ["0 18 * * *"]` 追加（AC-1）
  - R2 bucket binding 追加
- `apps/api/src/`（cron handler 新規）
  - D1 export 等価処理（`bash scripts/cf.sh d1 export` の API 等価呼び出し）/ AC-2
  - gzip 圧縮（AC-2 / Phase 9 C7）
  - R2 PUT with `--metadata 'encrypted=true'`（AC-3 / AC-9）
  - 月初判定で `monthly/<YYYY-MM>.sql.gz` 複製（AC-2）
  - 空 export warning 通知（AC-6）
  - 失敗時 UT-08 通知（AC-5）
- 復元 runbook（`docs/...`）追加（AC-4）

## AC checklist trace

- [ ] AC-1: 日次 cron 稼働 + 成功 log
- [ ] AC-2: R2 30 日 + 月次世代管理
- [ ] AC-3: SSE / KMS / ACL 設定
- [ ] AC-4: 復元 runbook + 机上演習結果記録
- [ ] AC-5: 失敗時 UT-08 alert
- [ ] AC-6: 空 export 許容バリデーション
- [ ] AC-7: `bash scripts/cf.sh d1 export` 経由（wrangler 直接禁止）
- [ ] AC-8: Cloudflare cron triggers 採用 → GHA 無料枠不圧迫 / GHA 採用時 UT-05-FU-003 監視
- [ ] AC-9: 機密性レベル別暗号化方式記録

## smoke evidence 添付欄

```
S-03 (dev 手動 export → R2 PUT): bash scripts/cf.sh d1 export ... → r2 object put ...
  → 期待: PUT 200 + ListObjects に当該 key
  実測: <貼付>

S-07 (staging cron 7 日連続): 7 日後の ListObjects
  → 期待: 7 件、各 key 名に日付 prefix
  実測: <貼付>

S-11 (復元 drill): R2 GET → gunzip → d1 execute → COUNT(*)
  → 期待: 全ステップ exit 0 / 行数一致 / 合計 < 15 分
  実測: <貼付>

S-15 (空 export 許容): 空 D1 で export
  → 期待: exit 0 + UT-08 info 通知
  実測: <貼付>

S-19 (UT-08 critical alert / isolated env): R2 token 無効化
  → 期待: UT-08 critical 通知
  実測: <貼付>
```

## 前提（必須）

- 本 PR の前段に「docs(workflow): Add UT-06-FU-E task spec ...」PR がマージ済
- UT-12 R2 storage / UT-08 monitoring 連携が `completed`

## リスク・ロールバック

- ロールバック: cron 一時停止（`crons = []` で deploy）→ 直前世代 marker 配置 → 失敗原因切分 → 修正後 R1 再 rollout（Phase 10 §R5）
- 不変条件 #5 違反なし: state ownership 表で `apps/web` writer / reader 不在を保証

## 関連

- Closes #118
- 仕様書: `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/`
- 上流: UT-12 R2 / UT-08 monitoring
- 連携: UT-05-FU-003（GHA schedule 主経路の監視対象）/ UT-06 Phase 6 rollback-rehearsal（並列管理）
````

### CI 必須 check（PR 2）

| check 種別 | 内容 |
| --- | --- |
| typecheck | `mise exec -- pnpm typecheck` |
| lint | `mise exec -- pnpm lint` |
| build | `mise exec -- pnpm build` |
| smoke S-03 / S-07 / S-11 / S-15 / S-19 | Phase 11 ランブックを実走、ログを PR description smoke evidence に貼付 |
| 線形履歴 / 会話解決 / force-push 禁止 | dev / main branch protection 共通 |

---

## ロールバック / 緊急時の手順

| 状況 | 対応 |
| --- | --- |
| PR 1 提出後、レビューで重大不整合 | PR を **draft 化**（`gh pr ready --undo`）→ 該当 Phase 差し戻し |
| PR 1 提出後、計画系 wording / Secret 混入が事後検出 | PR を **close** → Phase 12 差し戻し → 新規 PR で出し直し |
| user 承認が PR 1 提出後に撤回 | PR を draft 化 / マージしない |
| PR 2（実装 PR）で UT-12 R2 / UT-08 未完了が判明 | 実装 PR を **draft 化** / 上流完了まで block |
| PR 2 マージ後に cron 連続失敗 | Phase 10 §R5 ロールバック条件「3 連続失敗」を発動 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | CLAUDE.md §ブランチ戦略 | solo 運用 / required reviewers = 0 / CI gate のみで保護 |
| 必須 | CLAUDE.md §Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` 徹底 / `wrangler` 直接禁止 |
| 必須 | .claude/skills/task-specification-creator/references/quality-gates.md | Phase 13 自動実行禁止原則 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/index.md | PR タイトル / AC / 依存関係根拠 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/artifacts.json | Phase 1〜12 状態 / `user_approval_required: true` 正本 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-09.md〜phase-12.md | 設計確定 |
| 参考 | docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint/phase-13.md | フォーマットリファレンス |

---

## 実行タスク

1. PR 1 / PR 2 の二段階ユーザー承認ゲートを提示する（完了条件: 承認文言が分離）。
2. PR 1 の docs-only 変更範囲と AC trace を固定する（完了条件: `apps/` 変更なしが明記）。
3. local-check 実行手順を固定する（完了条件: 必須ファイル / 不変条件 #5 / wrangler 直接禁止 / Secret / NON_VISUAL / validator 6 件）。
4. user 明示承認後のみ PR 1 を作成するコマンドを予約する（完了条件: commit / push / PR 作成の自動実行禁止が明記）。
5. PR URL 記録と artifacts 更新条件を定義する（完了条件: PR merge 後に completed 昇格条件）。
6. PR 2 の実コード実装 PR 起票テンプレを予約する（完了条件: 起票も user 明示承認後）。
7. rollback / 緊急時の手順を固定する（完了条件: PR 1 / PR 2 差し戻し経路が分離）。

## 実行手順

### ステップ 1: 承認ゲートの提示
- user に change-summary（PR 1 / PR 2 双方の差分概要）と AC trace を提示。「PR 1 を作成してよい」明示文言を取得。

### ステップ 2: local-check の実行
- §local-check（6 項目）を実行し全 OK を確認。FAIL 時は Phase 12 差し戻し。

### ステップ 3: PR 1 の作成（user 承認後のみ）
- ブランチ確認 → 明示 add → commit → push → `gh pr create --base main`。`git add .` / `git add -A` 禁止。

### ステップ 4: PR URL の記録
- artifacts.json `phases[12].pr_url` に追記。`phases[12].status` を `completed` に更新する条件は **PR がマージされた後**。

### ステップ 5: PR 2 起票方針の user 確認
- PR 1 マージ後、改めて user に「後続実装 PR を起票してよいか」確認。承認後別ブランチ作成。

### ステップ 6: Issue #118 再起票判断
- 本 Phase 13 で user と「Issue #118 を再 open するか」を確認。CLOSED のまま PR 1 を `Refs #118` で進める方針が default。実装 PR 2 で `Closes #118` を発火させるかは user 判断。

---

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| docs validator | PR 1 作成前の最終 gate |
| `verify-indexes-up-to-date` CI | indexes drift なし |
| PR description AC trace | AC-1〜AC-9 を仕様書中の固定箇所に 1:1 対応 |
| smoke evidence（PR 2） | Phase 11 S-03 / S-07 / S-11 / S-15 / S-19 実測ログ貼付 |
| Phase 12 §タスク 6 compliance-check | PR 1 作成前の 10 項目最終 gate |

---

## 多角的チェック観点

- **不変条件 #5**: PR 1 差分が markdown / JSON のみで、`apps/web` から D1 を直接叩く変更が混入していないか。
- **AC-7（wrangler 直接禁止）**: 本仕様書 / outputs / PR description / commit メッセージのいずれにも `wrangler` 直接実行コマンドが現れないか。
- **solo 運用適合**: required reviewers = 0 / CI gate / 線形履歴 / 会話解決 / force-push 禁止 で品質保証。
- **CI gate 構成**: docs validator / verify-indexes / 線形履歴 / 会話解決必須化が PR 1 必須 check として機能。
- **Issue #118 CLOSED 状態の取扱い**: PR 1 では **再 open しない / Closes #118 を書かない / Refs #118 のみ**。実装 PR 2 で初めて `Closes #118` 候補。
- **user 承認の二段階性**: PR 1 提出承認と PR 2 起票承認は別アクション。
- **rollback 粒度**: PR 1 = markdown 削除のみ / PR 2 = cron 一時停止 + 前世代 marker（Phase 10 §R5）。
- **計画系 wording / Secret 混入**: outputs / docs に転記されていないか。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認ゲート定義 | 13 | spec_created | 二段階承認 |
| 2 | PR 1 仕様（タイトル / description / コマンド）固定 | 13 | spec_created | base = main、docs-only |
| 3 | PR 2 起票テンプレ仕様化（実装 PR） | 13 | spec_created | base = dev、Closes #118 候補 |
| 4 | CI 必須 check 一覧の固定 | 13 | spec_created | docs validator / verify-indexes / 線形履歴 / 会話解決 |
| 5 | local-check スクリプト固定 | 13 | spec_created | 不変条件 #5 / wrangler 禁止 / Secret / NON_VISUAL / 計画系 wording / validator |
| 6 | ロールバック / 緊急時手順 | 13 | spec_created | draft 化 / close / revert PR / Phase 10 §R5 |
| 7 | Issue #118 CLOSED 状態の取扱い明記 | 13 | spec_created | Refs のみ / 再 open は user 判断 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-13.md | 本ファイル。PR は user 明示承認後にのみ作成 |

> 本 Phase 13 では `outputs/phase-13/` ディレクトリは作成しない。PR 1 自体が成果物相当。

---

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] ユーザー承認ゲート（PR 1）の全項目 PASS（user 明示承認を含む）
- [ ] local-check（6 項目: docs validator / 不変条件 #5 / wrangler 直接禁止 / Secret / 計画系 wording / NON_VISUAL）すべて OK
- [ ] PR 1 が作成され、Issue #118 へ `Refs #118`（`Closes` ではない）でリンク
- [ ] PR URL が記録（artifacts.json `phases[12].pr_url`）
- [ ] PR 1 の CI（docs validator / verify-indexes / 線形履歴 / 会話解決）が green
- [ ] PR 1 マージ後、`artifacts.json.phases[12].status` が `completed` に更新
- [ ] PR 2 起票方針が user に提示され、起票判断が user に委ねられている
- [ ] Issue #118 再起票判断が user と確認済み

---

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `completed` 相当（user 承認取得 / local-check / PR 1 作成 / PR URL 記録 / PR 2 方針提示 / Issue 再起票判断 / rollback 手順固定）
- 本 phase-13.md が `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-13.md` に配置済
- artifacts.json の `phases[12].status` が PR マージ後に `completed` へ更新される運用が明記
- 不変条件 #5 違反 / Secret 混入 / 計画系 wording 残存 / `wrangler` 直接実行 が 0 件であることを local-check で確認

---

## 次タスク

- 次: 本ワークフロー完了。
- 後続（別 PR / 別タスク）:
  - **後続 実コード実装 PR の起票**（user 明示承認後のみ）: `feat/ut-06-fu-e-d1-backup-impl` ブランチで Phase 5 ランブックを実走 + Phase 11 smoke S-03 / S-07 / S-11 / S-15 / S-19 実走。Issue #118 の `Closes` 候補。
  - UT-12 R2 storage / UT-08 monitoring の `completed` 状態を実装 PR 着手前に再確認（NO-GO 条件）。
  - 月次机上演習 SOP の formalize（Phase 12 タスク 4 current 候補）。
- ブロック条件:
  - user 承認が無い間は PR 1 / PR 2 のいずれも作成・起票しない
  - local-check が FAIL（→ Phase 12 へ差し戻し）
  - 不変条件 #5 違反 / Secret 混入 / 計画系 wording 残存 / wrangler 直接実行が 1 件以上検出（→ 即時停止 / Phase 12 再実施）
  - UT-12 R2 / UT-08 未完了下で PR 2 を起票しない
