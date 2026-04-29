# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-29 |
| 上流 | Phase 12（ドキュメント更新） |
| 下流 | — |
| 状態 | blocked |
| user_approval_required | **true** |
| ブロック条件 | user の明示承認なし / Phase 12 未完 / CI gate FAIL / mirror diff ≠ 0 |
| GitHub Issue | #148（CLOSED のまま reopen しない） |
| ブランチ | `feat/issue-148-ut-gov-005-docs-only-nonvisual-template-skill-sync` |

## 目的

user の明示承認後に PR を作成する。承認なしの状態では blocked のまま放置する。
本 Phase は本ワークフロー（skill 縮約テンプレ整備 + 自己適用第一例）の最終ゲートで、
merge 後は task-specification-creator skill が新縮約テンプレを正本として後続タスクに供給する状態になる。

**Issue #148 は CLOSED のまま** で参照のみ（reopen 禁止）。PR 本文では `Refs #148`（Closes ではなく Refs）で関連付ける。

## 入力

- `outputs/phase-12/` 配下 6 ファイル（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）
- `outputs/phase-11/` 配下 NON_VISUAL 代替証跡 3 点（main / manual-smoke-log / link-checklist）
- `.claude/skills/task-specification-creator/`（編集 6 ファイル + SKILL.md）
- `.agents/skills/task-specification-creator/`（mirror）

## ブロック解除条件

- user が「PR 作成して良い」と明示承認
- Phase 12 完了（6 必須成果物 + Part 2 5 項目 全 PASS）
- CI gate（typecheck / lint / verify-indexes-up-to-date）GREEN 想定
- `.claude` ⇄ `.agents` mirror diff = 0
- AC-1〜AC-10 全件 PASS（`outputs/phase-09/main.md` / `phase-11/manual-smoke-log.md` / `phase-12/phase12-task-spec-compliance-check.md`）
- branch protection（main / dev）への直接 push でないことを確認
- Issue #148 が CLOSED のまま（reopen していないこと）

## ローカル確認（省略禁止 / pre-merge checklist）

```bash
# 1. branch 状態
git status --porcelain
git log --oneline main..HEAD

# 2. typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. mirror parity 検証（AC-5）
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
echo $?    # => 0

# 4. verify-indexes-up-to-date 相当（CI 同等の検証）
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes
# diff があれば再 commit が必要

# 5. Phase 12 計画系 wording 残存確認
rg -n "仕様策定のみ|実行対象|保留として記録" \
  docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "計画系 wording なし"

# 6. 自己適用 3 点固定（縮約テンプレ準拠）
ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/
# => main.md / manual-smoke-log.md / link-checklist.md のみ

# 7. state ownership 維持確認
rg -n '状態.*spec_created' docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/index.md

# 8. AC マトリクス全件 PASS
rg -n 'AC-[0-9]+.*PASS|AC-[0-9]+.*GREEN' docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-07/ac-matrix.md
```

すべての出力結果を `outputs/phase-13/local-check-result.md` に保存する。

## merge 戦略（CLAUDE.md 規約準拠）

- **線形履歴必須**（`required_linear_history`）→ rebase merge or squash merge いずれか。**squash 不可** とする方針（個別コミット履歴を保持）→ **rebase merge** で統一
- force push 禁止（main / dev）
- 必須レビュアー数 = 0（solo 開発）。CI gate / 線形履歴 / 会話解決必須化で品質担保
- `--no-verify` 禁止（hook はすべて通す）
- `--amend` 禁止（hook 失敗時は新規コミットを積む）

## PR タイトルテンプレ

```
chore(skill): apply docs-only / NON_VISUAL reduced template to task-specification-creator (UT-GOV-005)
```

70 文字以内に収まる代替案:

```
chore(skill): docs-only NON_VISUAL reduced template (UT-GOV-005)
```

## PR 本文テンプレ

```markdown
## Summary
- task-specification-creator skill に docs-only / `visualEvidence: NON_VISUAL` 向けの縮約テンプレを追加
- canonical artefact を `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点に固定（screenshot 不要を明文化）
- Phase 12 Part 2 必須 5 項目（C12P2-1〜5）を `phase-12-completion-checklist.md` に一対一でチェック項目化
- `.agents/skills/task-specification-creator/` mirror へ差分 0 で同期
- 本ワークフロー自身の Phase 11 / 12 を縮約テンプレの **第一適用例（drink-your-own-champagne）** として参照リンク化

## 関連 Issue
- Refs #148 （CLOSED のまま参照のみ。reopen しない）

## 上流依存
- task-github-governance-branch-protection（Phase 11 / 12 outputs を実証データとして使用 / main マージ済）

## 影響範囲
- `.claude/skills/task-specification-creator/SKILL.md`（タスクタイプ判定フロー追記）
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`（縮約テンプレ追加）
- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`（Part 2 5 項目チェック化）
- `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`（C12P2-1〜5 + docs-only ブランチ追加）
- `.claude/skills/task-specification-creator/references/phase-template-phase1.md`（visualEvidence 必須入力ルール）
- `.claude/skills/task-specification-creator/references/phase-template-core.md`（state ownership 分離）
- `.agents/skills/task-specification-creator/`（上記 6 ファイル mirror 同期）
- `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/`（task workflow 一式）

## 影響範囲外
- aiworkflow-requirements（references / indexes / SKILL.md）への変更なし
- ランタイムコード（apps/api / apps/web）への変更なし
- D1 schema / Cloudflare Workers binding への変更なし
- Secrets / 1Password 参照の追加なし

## 検証
- [ ] AC-1〜AC-10 全件 PASS（`outputs/phase-09/main.md`）
- [ ] 自己適用 smoke PASS（`outputs/phase-11/manual-smoke-log.md` S-1〜S-6）
- [ ] mirror diff 0（`diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator`）
- [ ] Phase 12 Part 2 必須 5 項目 PASS（`outputs/phase-12/phase12-task-spec-compliance-check.md`）
- [ ] Phase 10 Go 判定（`outputs/phase-10/go-no-go.md`）
- [ ] typecheck / lint / verify-indexes-up-to-date GREEN
- [ ] state ownership 維持（workflow root = `spec_created`）

## 遡及適用方針（TECH-M-03）
- 新規タスク: Phase 1 から本縮約テンプレを適用
- 進行中タスク: Phase 11 着手時点で再判定（着手済なら従来テンプレで完走）
- 完了済タスク: 遡及適用しない

## post-merge 後続タスク（unassigned-task-detection）
- U-6: UT-GOV-001〜007 系の遡及適用判定タスク（LOW）
- U-7: mirror parity CI gate 強制タスク（MEDIUM）
- U-8: skill-fixture-runner への縮約テンプレ検証追加タスク（LOW）

## Test plan
- [ ] CI: typecheck / lint / verify-indexes-up-to-date
- [ ] reviewer: SKILL.md タスクタイプ判定フローの読み下し
- [ ] reviewer: `.claude` ⇄ `.agents` mirror parity 確認
- [ ] reviewer: 縮約テンプレ自己適用 evidence（Phase 11 outputs 3 点）の確認
- [ ] reviewer: Issue #148 が CLOSED のまま reopen されていないこと

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行タスク

1. user 承認待ち（明示承認なき限り blocked のまま）
2. ローカル確認 1〜8 を実行し `outputs/phase-13/local-check-result.md` に保存
3. `outputs/phase-13/change-summary.md` 作成（変更ファイル一覧 + 影響範囲 + 影響範囲外）
4. `outputs/phase-13/main.md` 作成（blocked 理由 / approval status / pre-merge checklist 進捗）
5. user 明示承認後に `gh pr create` 実行（HEREDOC で本文渡し）
6. PR 番号と URL を `outputs/phase-13/pr-creation-result.md` に記録
7. CI gate 結果（typecheck / lint / verify-indexes-up-to-date）を待ち、`outputs/phase-13/pr-info.md` に最終ステータス記録
8. post-merge: U-6 / U-7 / U-8 を別 GitHub Issue 化（github-issue-manager skill で起票）
9. post-merge: `documentation-changelog.md` を merge 結果（commit hash / merge 日時）で更新

## pre-merge checklist（必須）

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `mise exec -- pnpm indexes:rebuild` 後の `git diff` が空
- [ ] `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` が 0 行
- [ ] AC-1〜AC-10 全件 PASS
- [ ] Phase 11 outputs = 3 点固定（screenshot / 冗長 artefact なし）
- [ ] Phase 12 Part 2 5 項目（C12P2-1〜5）全 PASS
- [ ] state ownership 維持（workflow root = `spec_created`）
- [ ] Issue #148 が CLOSED のまま
- [ ] branch が `feat/issue-148-ut-gov-005-docs-only-nonvisual-template-skill-sync`
- [ ] 計画系 wording 残存 0 件

## 参照資料

### システム仕様（task-specification-creator skill）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 13 テンプレ | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` | PR 作成プロセス正本 |
| Phase 13 detail | `.claude/skills/task-specification-creator/references/phase-template-phase13-detail.md` | PR 本文・タイトル詳細 |

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-12/` 配下 6 ファイル |
| 必須 | `outputs/phase-11/` 配下 3 点 |
| 必須 | `outputs/phase-10/go-no-go.md` |
| 必須 | `outputs/phase-09/main.md`（AC マトリクス最終結果）|
| 参考 | `docs/30-workflows/skill-ledger-b1-gitattributes/phase-13.md`（NON_VISUAL 先行先例）|
| 参考 | `CLAUDE.md`（ブランチ戦略 / merge 規約）|

## 依存Phase明示

- Phase 1〜12 の成果物すべてを参照する。
- 特に Phase 5（skill 編集実体）/ Phase 9（mirror diff 0）/ Phase 11（自己適用 evidence）/ Phase 12（6 必須成果物 + Part 2 5 項目）が PR 検証根拠。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-13/main.md` | Phase 13 トップ index / blocked 理由 / approval status |
| `outputs/phase-13/local-check-result.md` | ローカル確認 1〜8 の出力 |
| `outputs/phase-13/change-summary.md` | 変更ファイル / 影響範囲 / 影響範囲外 |
| `outputs/phase-13/pr-info.md` | PR 番号 / URL / CI ステータス（user 承認後） |
| `outputs/phase-13/pr-creation-result.md` | `gh pr create` 結果（user 承認後） |

## 完了条件 (DoD)

- [ ] user 承認確認済（明示承認なしなら blocked のまま終了）
- [ ] local-check-result.md / change-summary.md / main.md 作成済
- [ ] PR 作成済（承認後のみ）
- [ ] CI gate（typecheck / lint / verify-indexes-up-to-date）GREEN（承認後のみ）
- [ ] mirror diff 0 確認済
- [ ] pr-info.md / pr-creation-result.md 作成済（承認後のみ）
- [ ] post-merge: U-6 / U-7 / U-8 別 issue 化（merge 後）
- [ ] post-merge: documentation-changelog 更新（merge commit hash 追記）

## 苦戦箇所・注意

- **承認なし自動実行禁止**: Phase 13 の最重要ルール。ユーザーが「進めて」と言うまで blocked のままにする。`gh pr create` を勝手に走らせない
- **Issue #148 reopen 厳禁**: CLOSED のまま参照する。本タスクは「CLOSED Issue を仕様書として再構築」する性質のため、PR 本文は `Closes #148` ではなく `Refs #148` を使う
- **mirror diff の merge 直前ドリフト**: Phase 9 / 11 で 0 確認済でも、Phase 12 で skill 側を意図せず触っていないか pre-merge で `diff -qr` 再確認
- **branch protection**: main / dev への直接 push は pre-commit hook で拒否される。PR 経由のみ
- **混在コミット**: 本 PR は skill 6 ファイル追記 + task workflow 仕様書のみで構成。無関係な変更が混入していないか `git log --oneline main..HEAD` で確認
- **state ownership 書換え事故**: Phase 13 の最終整備で `index.md` の workflow root 状態を `completed` に変えてしまう事故を防ぐ。`spec_created` のままにする
- **CI hook 失敗時の再 commit**: hook 失敗時は `--amend` ではなく新規コミットを積む（CLAUDE.md 規約）。`--no-verify` は禁止
- **post-merge 後続タスク起票忘れ**: U-6 / U-7 / U-8 を merge 後に必ず別 issue 化する。本 PR 内では起票しない（PR スコープを汚染しない）
- **squash merge の誘惑**: 線形履歴維持のため rebase merge で統一する。squash すると個別コミット履歴が失われる

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs（5 件）が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。
- [ ] **user 明示承認なしに `gh pr create` を実行していないことを確認する**。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改善であり、アプリケーション統合テストは追加しない。
- 統合検証は CI gate（typecheck / lint / verify-indexes-up-to-date）/ `diff -qr` mirror parity / Phase 11 自己適用 smoke / AC マトリクス全件 PASS で代替する。
- post-merge で task-specification-creator skill が新縮約テンプレを正本として後続タスクに供給開始する。

## 次 Phase

- 次: なし（最終 Phase）
- post-merge: U-6 / U-7 / U-8 を別 issue 化 / documentation-changelog 更新 / UT-GOV-001〜007 系 Wave で縮約テンプレ参照リンク化
