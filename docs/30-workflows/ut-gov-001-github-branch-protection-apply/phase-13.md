# Phase 13: PR 作成 / ユーザー承認後 PUT 実行（user 明示承認後のみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化（dev / main 実適用） |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 / ユーザー承認後 PUT 実行 |
| 作成日 | 2026-04-28 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / github_governance |
| **user_approval_required** | **true** |
| 実行ステータス | **NOT EXECUTED — awaiting user approval** |

> **PR 作成・実 PUT 適用は user の明示承認後のみ実行する。**
> 本 Phase 仕様書は (a) PR 草案、(b) commit / push / `gh pr create` 手順、(c) snapshot / payload / rollback / applied JSON 生成の `gh api` コマンド、(d) `apply-runbook.md` を「予約」する目的で作成され、user の明示指示があるまで `git commit` / `git push` / `gh pr create` / `gh api PUT` を一切実行しない。本ワークフロー成果物（仕様書・outputs）も Phase 13 完了時点では未コミット状態で待機する。

## 目的

Phase 1〜12 の成果物（Phase 11/12/13 仕様書 + index.md + artifacts.json + outputs/phase-{01,02,03,11,12,13}/）を 1 PR にまとめ、user 明示承認後に：

1. PR を GitHub Issue #144 へリンクして提出（**docs-only PR**: 仕様書整備までの差分）
2. user 明示承認後の **別オペレーション** として、4 ステップ手動 smoke を実走し snapshot / payload / rollback / applied JSON を確定させ、`apply-runbook.md` / `rollback-rehearsal-log.md` を完成させる

PR 草案は Phase 12 documentation-changelog を入力にする。実 PUT は本 Phase 仕様書のコマンドに従い、user の二重承認（PR 作成承認 + 実 PUT 承認）後にのみ実行する。

## 成果物

| 種別 | パス | 生成タイミング |
| --- | --- | --- |
| Phase 13 index | `outputs/phase-13/main.md` | 本 workflow で作成済み |
| snapshot | `outputs/phase-13/branch-protection-snapshot-{dev,main}.json` | user の実 PUT 承認後 |
| payload | `outputs/phase-13/branch-protection-payload-{dev,main}.json` | user の実 PUT 承認後 |
| rollback | `outputs/phase-13/branch-protection-rollback-{dev,main}.json` | user の実 PUT 承認後 |
| applied | `outputs/phase-13/branch-protection-applied-{dev,main}.json` | user の実 PUT 承認後 |
| apply runbook | `outputs/phase-13/apply-runbook.md` | user の実 PUT 承認後 |
| rollback rehearsal log | `outputs/phase-13/rollback-rehearsal-log.md` | user の実 PUT 承認後 |

## 承認ゲート（最優先 / 必須）

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜3 の状態 | `artifacts.json` で `completed` | 確認済 |
| Phase 4〜10 状態 | `pending`（本ワークフローは仕様書整備のみ） | 確認済 |
| Phase 11 必須 3 outputs | main.md / manual-smoke-log.md / link-checklist.md が揃っている | 要確認 |
| Phase 12 必須 5+1 outputs | main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report | 要確認 |
| `1Password secret URI` 混入チェック | 0 件 | 要確認 |
| 計画系 wording 残存チェック | 0 件 | 要確認 |
| UT-GOV-004 completed | UT-GOV-004 の完了状態（実 PUT の前提） | **要確認**（STEP 0.1） |
| 親タスク Phase 13 承認 | task-github-governance-branch-protection の Phase 13 承認 | 要確認 |
| user の明示承認（PR 作成） | user から「PR を作成してよい」の明示指示 | **承認待ち** |
| user の明示承認（実 PUT 実行） | user から「実 PUT を実行してよい」の明示指示（PR 作成承認とは独立） | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` / `gh api PUT` を一切実行しない。**

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得）。
2. local-check（docs validator のみ。typecheck / lint / app test は本タスク無関係のため対象外）を実行・記録する。
3. change-summary（PR description 草案）を作成する。
4. **user 明示承認後（PR 作成承認）**、ブランチ確認 → 必要なファイルを明示 add → commit → push → PR 作成を実行する。
5. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。
6. **user 明示承認後（実 PUT 承認 / PR マージ後の別オペレーション）**、Phase 11 manual-smoke-log.md の 4 ステップを実走し、以下を確定する：
   - `outputs/phase-13/branch-protection-snapshot-{dev,main}.json`（lane 1）
   - `outputs/phase-13/branch-protection-payload-{dev,main}.json`（lane 2 / adapter）
   - `outputs/phase-13/branch-protection-rollback-{dev,main}.json`（lane 2 / adapter）
   - `outputs/phase-13/branch-protection-applied-{dev,main}.json`（lane 4 / 実 PUT 応答）
   - `outputs/phase-13/apply-runbook.md`（dry-run 差分 / 実 PUT ログ / drift 検証 / 緊急 rollback 経路）
   - `outputs/phase-13/rollback-rehearsal-log.md`（rollback リハーサル + 再適用の実走ログ）

## local-check（docs-only スコープ）

```bash
# 必須 outputs ファイル存在確認
ls docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/  # 3 files
ls docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/  # 6 files (main + 5)
ls docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-13/  # 1 file (本 main.md / 他 JSON は実走後生成)

# screenshots/ が無いこと
test ! -d docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/screenshots && echo "OK: NON_VISUAL 整合"

# 計画系 wording / 1Password secret URI 混入チェック
rg -n "仕様策定のみ|実行予定|保留として記録" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/ \
  || echo "計画系 wording なし"
rg -n "1Password secret URI" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/implementation-guide.md \
  || echo "1Password secret URI 混入なし"

# 機密情報チェック
rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=|gho_|ghp_" docs/30-workflows/ut-gov-001-github-branch-protection-apply/ \
  || echo "Secret 混入なし"

# spec validator
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-gov-001-github-branch-protection-apply
```

## 実行手順

1. 承認ゲートと local-check を user に提示する。
2. user の明示承認（PR 作成）を得た場合のみ、ブランチ確認、明示 add、commit、push、PR 作成へ進む。
3. PR マージ後、user の明示承認（実 PUT 実行）を別途取得し、Phase 11 manual-smoke-log.md の 4 ステップを実走する。
4. user 承認が無い場合は本 Phase を NOT EXECUTED のまま保持する。

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| **title** | `docs(workflow): add UT-GOV-001 GitHub branch protection apply Phase 11-13 task spec (Issue #144)` |
| base | `dev` |
| head | 現行 worktree branch（`task-20260428-223418-wt-1`）または `feat/ut-gov-001-branch-protection-apply` |
| labels | `area:docs` / `task:ut-gov-001` / `wave:0` / `governance` |
| linked issue | #144 (`Refs #144` ではなく `Refs #144`: 本 PR は仕様書整備までで、Issue #144 の本体クローズは実 PUT 完了後の別 PR で行う) |

### PR body テンプレ

```markdown
## 概要
GitHub Issue #144「UT-GOV-001: GitHub branch protection apply / rollback payload 正規化」の Phase 11〜13 タスク仕様書を `docs/30-workflows/ut-gov-001-github-branch-protection-apply/` 配下に固定する docs-only PR。Phase 1〜3（要件定義 / 設計 / 設計レビュー）は別 PR で固定済。

実 `gh api PUT` による branch protection 適用 / snapshot / payload / rollback / applied JSON 生成 / `apply-runbook.md` 完成は本 PR の **マージ後**、user の二重承認（PR マージ + 実 PUT 実行）後の別オペレーションで実施する。

## 動機
- task-github-governance-branch-protection Phase 12 で検出された U-1（branch protection 実適用 + payload 正規化 adapter）を実行可能な spec へ昇格
- solo 運用ポリシー（`required_pull_request_reviews=null`）を GitHub 実値として強制化する前提整備
- governance 系（UT-GOV-002〜007）の上流ゲート確立

## 変更内容（docs-only）
- 新規: `docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-{11,12,13}.md`
- 新規: `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md`（NON_VISUAL 代替 evidence 3 点）
- 新規: `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report}.md`（Phase 12 必須 5 + index）
- 新規: `outputs/phase-13/main.md`（PR 作成手順 / 実 PUT 手順 / NOT EXECUTED — user 承認待ち）
- 同期: `docs/30-workflows/LOGS.md` / `.claude/skills/task-specification-creator/LOGS.md` / `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` / `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- 追記: `CLAUDE.md` ブランチ戦略章へ grep 検証注記（既存記述変更なし）
- 同期: `completed-tasks/UT-GOV-002〜007`（仮）への双方向リンク

## 動作確認
- Phase 11 NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）適用済（spec walkthrough）
- 4 ステップ手動 smoke コマンド系列は仕様レベルで固定（NOT EXECUTED — 実 PUT は本 PR マージ後の別オペレーション）
- docs validator PASS

## リスク・後方互換性
- **本 PR 自体は破壊的変更なし**（markdown / JSON のみ追加）
- apps/ / packages/ / migration / wrangler 設定 / Cloudflare Secret への影響なし
- 実 `gh api PUT` は **本 PR では実行しない**（user の二重承認後の別オペレーションで実行）

## 関連
- Refs #144
- 親タスク: `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/`
- 草案 design.md: `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md`
- 上流前提: UT-GOV-004（required_status_checks contexts 同期 / 5 重明記）
- 並列: UT-GOV-002 / UT-GOV-003 / UT-GOV-005〜007

## 注意事項
- UT-GOV-001 の実適用（`gh api PUT`）は **UT-GOV-004 完了が必須前提**。UT-GOV-004 未完了下で実 PUT を走らせると `required_status_checks.contexts` 未出現値投入で merge 不能事故が発生するため、Phase 1 / 2 / 3 / Phase 11 STEP 0 / Phase 12 Step 1-C で 5 重明記している。
- `enforce_admins=true` 適用時の admin 自身 block 詰みに備え、緊急 rollback 2 経路（`enforce_admins` サブリソース DELETE / `enforce_admins=false` 最小 patch PUT）を `apply-runbook.md` に明記する（実走時に確定）。
```

## PR 作成コマンド（user 承認後のみ実行）

```bash
# 現在ブランチ確認
git status
git branch --show-current

# 必要なファイルを明示 add（git add . / -A は禁止）
git add docs/30-workflows/ut-gov-001-github-branch-protection-apply/ \
        docs/30-workflows/unassigned-task/task-utgov001-second-stage-reapply.md \
        docs/30-workflows/unassigned-task/task-task-specification-governance-template-hardening.md \
        docs/30-workflows/LOGS.md \
        .claude/skills/task-specification-creator/LOGS.md \
        .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md \
        .claude/skills/aiworkflow-requirements/indexes/topic-map.md \
        CLAUDE.md

# コミット
git commit -m "$(cat <<'EOF'
docs(workflow): add UT-GOV-001 GitHub branch protection apply Phase 11-13 task spec (Issue #144)

- ut-gov-001-github-branch-protection-apply ワークフローの Phase 11/12/13 仕様書 + outputs を新規作成
- 4 ステップ手動 smoke（dry-run / apply / GET 検証 / CLAUDE.md grep）のコマンド系列を仕様レベル固定
- adapter（GET → PUT 正規化）と rollback 3 経路（通常 / 緊急 enforce_admins / 再適用）を Phase 12 implementation-guide に固定
- UT-GOV-004 完了必須前提を Phase 1 / 2 / 3 / Phase 11 STEP 0 / Phase 12 Step 1-C で 5 重明記
- 実 gh api PUT は本 PR マージ後、user 明示承認後の別オペレーションで実施

Refs #144

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# push
git push -u origin <current-branch>

# PR 作成
gh pr create \
  --title "docs(workflow): add UT-GOV-001 GitHub branch protection apply Phase 11-13 task spec (Issue #144)" \
  --base dev \
  --body "$(cat <<'EOF'
（上記 PR body テンプレを貼付）
EOF
)"
```

## 実 PUT 適用コマンド（PR マージ後 / user 二重承認後のみ実行）

```bash
# === user の明示承認（実 PUT 実行）取得確認 ===
# 本セクションは PR マージ後 + user の二重承認後にのみ実行する

# === STEP 0: 前提確認 ===
gh auth status   # administration:write スコープ確認
# UT-GOV-004 completed か確認（未完了なら contexts=[] で 2 段階適用に切替）

# === STEP 1〜4: Phase 11 manual-smoke-log.md と同一系列を実走 ===
# 詳細は outputs/phase-11/manual-smoke-log.md を参照
# snapshot 取得 → adapter で payload / rollback 生成 → dry-run diff レビュー
# → 実適用 PUT (dev / main 独立) → GET 実値確認 → CLAUDE.md grep 一致確認

# === STEP 5: rollback リハーサル + 再適用 ===
# rollback-rehearsal-log.md に記録しながら実走

# === STEP 6: apply-runbook.md / rollback-rehearsal-log.md 確定 + 後追い PR ===
# outputs/phase-13/{snapshot,payload,rollback,applied}-{dev,main}.json 8 件 + 2 runbook を後追い PR で commit
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/main.md | Phase 12 統合記録 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/implementation-guide.md | 実 PUT 手順の正本 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/main.md | NON_VISUAL 代替 evidence サマリー |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/manual-smoke-log.md | 4 ステップ手動 smoke 正本 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md | ブランチ戦略（feature → dev → main / solo 運用） |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-13.md | PR Phase 構造リファレンス |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user の二重明示承認を含む）
- [ ] local-check（docs validator）が PASS
- [ ] `1Password secret URI` / 計画系 wording / Secret 混入が 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #144 にリンク（`Refs #144`）
- [ ] CI（`gh pr checks`）が green
- [ ] PR マージ後、user 明示承認（実 PUT）を取得
- [ ] 実 PUT 実行後、`outputs/phase-13/` 配下に snapshot / payload / rollback / applied JSON 8 件 + apply-runbook.md + rollback-rehearsal-log.md が揃う
- [ ] CLAUDE.md ↔ GitHub 実値の grep 一致確認 PASS（drift 0）
- [ ] artifacts.json の Phase 13 が `completed` に更新される（user マージ後 + 実 PUT 完了後）

## 苦戦防止メモ

1. **`Refs #144` を維持**: 本 PR は仕様書整備までであり、Issue #144 の本体クローズは実 PUT 完了後の別 PR で行う。Issue を誤クローズしない。
2. **`git add .` / `git add -A` 禁止**: 他 worktree や無関係ファイルが混入する事故を防ぐため、必ずパス明示で add する。
3. **base = `dev`**: feature → dev → main のブランチ戦略を厳守。直接 main へは PR しない。
4. **user 二重承認の独立性**: 「PR 作成承認」と「実 PUT 実行承認」は独立。PR 作成だけで自動的に実 PUT に進まない。実 PUT は PR マージ後の **別オペレーション**。
5. **本タスクは Cloudflare Secret 非関与**: `1Password secret URI` / `scripts/cf.sh` / Cloudflare API token / OAuth は触らない。GitHub Token は既存 `gh auth login` 流用のみ。
6. **UT-GOV-004 未完了下の 2 段階適用**: 実 PUT 開始時に UT-GOV-004 completed を再確認し、未完了なら `contexts=[]` で先行 PUT に切替（NO-GO せず段階適用に降りる）。
7. **`enforce_admins=true` で admin 自身詰み**: 緊急 rollback 2 経路（DELETE / `enforce_admins=false` PUT）は事前生成済 rollback payload を使う。慌ててから生成しない。
8. **二重正本 drift 検証**: 実 PUT 後の grep 一致確認で drift 検出時、**GitHub 実値ではなく CLAUDE.md** を訂正する（正本は GitHub 実値、CLAUDE.md は参照）。
9. **dev / main 独立 PUT（bulk 化禁止）**: 1 つのスクリプトで両方一括 PUT しない。片方失敗時の影響分離を維持する。

## 次 Phase

- 次: なし（タスク完了）
- マージ後フォロー:
  - artifacts.json の Phase 13 を `completed` に更新（実 PUT 完了後）
  - `outputs/phase-13/` の 8 JSON + 2 runbook を後追い PR で commit
  - GitHub Issue #144 へ「spec 完了 + 実 PUT 完了」コメント追加 + クローズ
  - UT-GOV-002（PR target safety gate dry-run）への引き渡し（適用後の挙動検証）
- ブロック条件:
  - user 承認（PR 作成 or 実 PUT のいずれか）が無い場合は該当オペレーションを一切実行しない
  - local-check（docs validator）が FAIL（→ Phase 12 へ差し戻し）
  - 計画系 wording / `1Password secret URI` / Secret 混入が 1 件以上検出（→ 即時停止 / Phase 12 再実施）
  - UT-GOV-004 未完了で `contexts=[]` 2 段階適用にも切替できない場合（→ UT-GOV-004 完了待機）
