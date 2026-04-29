# Phase 13: PR 作成 / ユーザー承認後 3 段階適用（user 明示承認後のみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | テストカバレッジ 80% 強制（全 package 一律 / CI hard gate / ローカル auto-loop） |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 / ユーザー承認後 3 段階適用 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL（CI gate + script + skill 正本同期） |
| **user_approval_required** | **true** |
| 実行ステータス | **NOT EXECUTED — awaiting user approval** |

> **PR 作成・実 merge・branch protection contexts 登録は user の明示承認後のみ実行する。**
> 本 Phase 仕様書は (a) PR① / PR② / PR③ の草案 + 段階性、(b) commit / push / `gh pr create` 手順、(c) branch protection 操作タイミング、(d) lefthook 統合 / aiworkflow-requirements 同期手順を「予約」する目的で作成され、user の明示指示があるまで `git commit` / `git push` / `gh pr create` / `gh api PUT` / `pnpm indexes:rebuild` を一切実行しない。本ワークフロー成果物（仕様書・outputs）も Phase 13 完了時点では未コミット状態で待機する。

## 目的

Phase 1〜12 の成果物（Phase 4〜13 仕様書 + index.md + artifacts.json + outputs/phase-{04..13}/）を 3 段階の PR にまとめ、user 明示承認後に：

- **PR①**: 仕組み導入 + soft gate（鶏卵問題回避のため `coverage-gate` を `continue-on-error: true` で導入）
- **PR②**: package 別 80% 達成テスト追加（複数 sub PR 想定）
- **PR③**: hard gate 化 + lefthook 統合 + aiworkflow-requirements 正本同期 + branch protection `required_status_checks.contexts` への `coverage-gate` 登録

PR 草案は Phase 12 documentation-changelog を入力にする。実 merge / branch protection PUT / `pnpm indexes:rebuild` は本 Phase 仕様書のコマンドに従い、user の **多段承認**（PR① 作成 / PR① merge / PR② 各 sub PR 作成・merge / PR③ 作成 / PR③ merge / branch protection PUT / indexes:rebuild）を経て実行する。

## 成果物

| 種別 | パス | 生成タイミング |
| --- | --- | --- |
| Phase 13 索引 | `outputs/phase-13/main.md` | 本 workflow で作成済み |
| PR① runbook | `outputs/phase-13/pr1-runbook.md` | 本 workflow で作成済み |
| PR② runbook | `outputs/phase-13/pr2-runbook.md` | 本 workflow で作成済み |
| PR③ runbook | `outputs/phase-13/pr3-runbook.md` | 本 workflow で作成済み |
| 実 PR URL / merge ログ | （後追いで本ファイルに追記） | user 承認後の各段階 |

## 段階性（PR 順序と前提条件）

| PR | 前提条件 | スコープ | CI 挙動 | merge 可否 |
| --- | --- | --- | --- | --- |
| PR① | Phase 12 7 ファイル PASS / docs validator PASS / user 「PR① 作成承認」 | T0 baseline + T1 vitest config + T2 coverage-guard.sh + T3 package script + T4 CI soft gate + LOGS / CLAUDE.md 追記 | `coverage-gate` job warning のみ（continue-on-error: true）| 既存 CI（typecheck/lint）green + user 「merge 承認」 |
| PR② | PR① merge 完了 / user 「PR② 各 sub PR 作成承認」 | T5 package 別テスト追加（package 単位で sub PR 分割可） | sub PR ごとに warning が消えるまでテスト追加 | 各 sub PR が warning green + user 「sub PR merge 承認」 |
| PR③ | 全 package が baseline で 80% 達成 / UT-GOV-004 完了確認 / user 「PR③ 作成承認」 | T6 lefthook 統合 + T7 hard gate 化 + T8 aiworkflow-requirements / coverage-standards 正本同期 | `continue-on-error` 削除、required（branch protection contexts 登録は merge 後の別オペレーション） | hard gate green + user 「merge 承認」+ user 「contexts 登録承認」+ user 「indexes:rebuild 承認」 |

## 承認ゲート（最優先 / 必須）

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜3 状態 | `artifacts.json` で `completed` | 確認済 |
| Phase 4〜12 状態 | `pending`（spec_created） | 要確認 |
| Phase 12 必須 7 outputs | main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check | 要確認 |
| 外部シークレット注入形式の混入チェック | 0 件 | 要確認 |
| 計画系 wording 残存チェック | 0 件 | 要確認 |
| UT-GOV-004 completed | UT-GOV-004 の完了状態（PR③ contexts 登録の前提）| **要確認**（5 重明記の 5 箇所目） |
| user の明示承認（PR① 作成）| 「PR① を作成してよい」 | **承認待ち** |
| user の明示承認（PR① merge）| 「PR① を merge してよい」 | **承認待ち** |
| user の明示承認（PR② 各 sub PR）| sub PR 単位で都度 | **承認待ち** |
| user の明示承認（PR③ 作成）| 「PR③ を作成してよい」 | **承認待ち** |
| user の明示承認（PR③ merge）| 「PR③ を merge してよい」 | **承認待ち** |
| user の明示承認（branch protection contexts 登録）| 「`coverage-gate` を contexts に追加してよい」 | **承認待ち** |
| user の明示承認（`pnpm indexes:rebuild` 実行）| 「indexes 再生成を実行してよい」 | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` / `gh api PUT` / `pnpm indexes:rebuild` を一切実行しない。**

## 実行タスク

1. 承認ゲート（PR① 段）を通過し、PR① を作成・merge する（詳細: `outputs/phase-13/pr1-runbook.md`）
2. 承認ゲート（PR② 段）を通過し、package 別 sub PR を順次 merge する（詳細: `outputs/phase-13/pr2-runbook.md`）
3. 全 package で baseline 80% 達成を確認する
4. 承認ゲート（PR③ 段）を通過し、PR③ を作成・merge する（詳細: `outputs/phase-13/pr3-runbook.md`）
5. PR③ merge 後、user 承認後の別オペレーションで:
   - branch protection の `required_status_checks.contexts` に `coverage-gate` を追加（`gh api PUT`）
   - `mise exec -- pnpm indexes:rebuild` 実行
   - drift 検証（`gh api .../protection` ↔ CLAUDE.md grep / vitest.config.ts ↔ codecov.yml ↔ aiworkflow-requirements）

## local-check（docs-only スコープ）

```bash
# 必須 outputs ファイル存在確認
ls docs/30-workflows/coverage-80-enforcement/outputs/phase-12/  # 7 files
ls docs/30-workflows/coverage-80-enforcement/outputs/phase-13/  # 4 files (main + pr1/pr2/pr3 runbook)

# 計画系 wording / 外部シークレット注入形式混入チェック
rg -n "仕様策定のみ|実行予定|保留として記録" docs/30-workflows/coverage-80-enforcement/outputs/ \
  || echo "計画系 wording なし"
rg -n "op://|secret URI" docs/30-workflows/coverage-80-enforcement/outputs/phase-12/implementation-guide.md \
  || echo "外部シークレット注入形式の混入なし"

# 機密情報チェック
rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=|gho_|ghp_" docs/30-workflows/coverage-80-enforcement/ \
  || echo "Secret 混入なし"

# spec validator
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/coverage-80-enforcement
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧 |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-12/implementation-guide.md | YAML / コマンド例の正本 |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-13/pr1-runbook.md | PR① 詳細 |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-13/pr2-runbook.md | PR② 詳細 |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-13/pr3-runbook.md | PR③ 詳細 |
| 必須 | docs/30-workflows/coverage-80-enforcement/index.md | AC / 段階性根拠 |
| 必須 | CLAUDE.md | ブランチ戦略（feature → dev → main / solo 運用） |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-13.md | 構造リファレンス |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user の多段明示承認）
- [ ] local-check（docs validator）PASS
- [ ] 外部シークレット注入形式 / 計画系 wording / Secret 混入が 0 件
- [ ] PR① / PR② sub / PR③ がそれぞれ作成され、`Refs #<issue>` でリンク
- [ ] CI（`gh pr checks`）が各 PR で green
- [ ] PR③ merge 後、branch protection contexts に `coverage-gate` が登録される
- [ ] `mise exec -- pnpm indexes:rebuild` 実行後、aiworkflow-requirements indexes に drift なし
- [ ] CLAUDE.md ↔ vitest.config.ts ↔ codecov.yml ↔ aiworkflow-requirements の 4 系正本一致確認
- [ ] artifacts.json の Phase 13 が `completed` に更新される（全 PR merge + contexts 登録 + indexes:rebuild 完了後）

## 苦戦防止メモ

1. **`Refs #<issue>` を維持**: 各 PR は仕様書 / テスト追加 / hard gate 化の段階的差分。Issue 本体クローズは PR③ merge + contexts 登録完了後の別 PR で行う。
2. **`git add .` / `git add -A` 禁止**: 必ずパス明示で add。他 worktree や `.env` 混入事故を防ぐ。
3. **base = `dev`**: feature → dev → main を厳守。直接 main へは PR しない。
4. **多段承認の独立性**: 各 user 承認は独立。PR① 作成承認だけで自動的に PR① merge / PR② / PR③ には進まない。
5. **本タスクは Cloudflare Secret 非関与**: Cloudflare 系の外部シークレット注入形式 / `scripts/cf.sh` / Cloudflare API token は触らない。GitHub Token は既存 `gh auth login` 流用。
6. **UT-GOV-004 未完了下の PR③ 取扱い**: PR③ merge 直前で UT-GOV-004 completed を再確認。未完了なら `coverage-gate` を contexts 登録せず、CI 内 hard gate のみで先行運用 → UT-GOV-004 完了後に contexts 登録（2 段階適用）。
7. **soft → hard 切替忘却防止**: PR① merge 時点で「PR③ 提出期限」を Issue にリマインダ作成（U-4 unassigned-task で formalize 候補）。
8. **PR③ で並行 PR の rebase**: hard gate 化前に open PR は rebase + coverage 確認。さもないと PR③ merge 直後に既存 PR が一斉に block。
9. **dev / main 別 branch protection**: dev / main それぞれ独立に `gh api .../protection` を呼ぶ。bulk 化禁止。
10. **drift 検証**: PR③ merge 後の grep 一致確認で drift 検出時、**GitHub 実値 / 実 CI 出力ではなく、CLAUDE.md / aiworkflow-requirements を訂正**する（正本は実値、ドキュメントは参照）。

## 次 Phase

- 次: なし（タスク完了）
- マージ後フォロー:
  - artifacts.json の Phase 13 を `completed` に更新（全 PR merge + contexts 登録 + indexes:rebuild 完了後）
  - U-4（soft→hard リマインダ）の formalize 検討
  - U-5（codecov.yml ↔ vitest.config 同期 lint）の formalize 検討
- ブロック条件:
  - user 多段承認のいずれかが無い場合は該当オペレーション一切実行しない
  - local-check（docs validator）が FAIL → Phase 12 差し戻し
  - 計画系 wording / 外部シークレット注入形式 / Secret 混入が 1 件以上 → 即時停止
  - UT-GOV-004 未完了下で 2 段階適用にも切替できない場合 → UT-GOV-004 完了待機
