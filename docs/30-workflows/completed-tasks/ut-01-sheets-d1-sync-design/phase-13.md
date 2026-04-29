# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-29 |
| 上流 | Phase 12（ドキュメント更新） |
| 下流 | — |
| 状態 | blocked |
| user_approval_required | **true** |
| ブロック条件 | user の明示承認なし / Phase 12 未完 / CI gate FAIL / `workflow_state` 誤書換え |
| GitHub Issue | #50（CLOSED のまま reopen しない） |
| ブランチ | （実行時に記入：feature 系 branch 名） |

## 目的

user の明示承認後に PR を作成する。承認なしの状態では blocked のまま放置する。
本タスクは **docs-only / 設計仕様策定のみ** であり、コード変更・runtime 影響を一切持たない。
PR merge 後は UT-09 / UT-04 が本仕様書のみで実装着手可能（AC-9）になり、UT-03 と並列着手も可能になる。

**Issue #50 は CLOSED のまま** で参照のみ（reopen 禁止）。PR 本文では `Refs #50`（Closes ではなく Refs）で関連付ける。

## 入力

- `outputs/phase-12/` 配下 7 ファイル（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）
- `outputs/phase-11/` 配下 3 点（main.md / manual-smoke-log.md / link-checklist.md）
- `outputs/phase-10/go-no-go.md`
- `outputs/phase-09/main.md`
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-03/main.md` / `alternatives.md`
- `outputs/phase-02/sync-method-comparison.md` / `sync-flow-diagrams.md` / `sync-log-schema.md`
- `outputs/phase-01/main.md`
- `index.md` / `artifacts.json`

## ブロック解除条件

- **user が明示的に「PR 作成して良い」と発言**（明示承認）
- Phase 12 完了（7 必須成果物 + Part 2 5 項目 全 PASS / `phase12-task-spec-compliance-check.md` 総合 PASS）
- CI gate（typecheck / lint / verify-indexes-up-to-date）GREEN 想定
- `workflow_state=spec_created` 据え置き確認（`index.md` 状態欄が書き換わっていない）
- AC-1〜AC-10 全件 PASS
- branch protection（main / dev）への直接 push でないこと
- Issue #50 が CLOSED のまま（reopen していないこと）
- 本 PR スコープ内に **コード変更ファイルが存在しないこと**（`apps/api` / `apps/web` / `.claude/skills` / `.agents/skills` 触らず）

## ローカル確認（省略禁止 / pre-merge checklist）

```bash
# 1. branch 状態
git status --porcelain
git log --oneline main..HEAD

# 2. typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. verify-indexes-up-to-date 相当
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes

# 4. Phase 12 計画系 wording 残存確認
rg -n "仕様策定のみ|実行対象|保留として記録" \
  docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' \
  || echo "計画系 wording なし"

# 5. Phase 11 縮約 3 点固定確認
ls docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-11/
# => main.md / manual-smoke-log.md / link-checklist.md のみ（screenshot / 冗長 artefact なし）

# 6. workflow_state 据え置き確認
rg -n '状態.*spec_created' docs/30-workflows/ut-01-sheets-d1-sync-design/index.md
jq -r '.metadata.workflow_state' docs/30-workflows/ut-01-sheets-d1-sync-design/artifacts.json
# => どちらも spec_created

# 7. AC マトリクス全件 PASS
rg -n 'AC-[0-9]+.*PASS|AC-[0-9]+.*GREEN' docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-07/ac-matrix.md

# 8. コード変更なし確認
git diff --stat main..HEAD -- apps/ packages/ .claude/skills/ .agents/skills/
# => 出力 0 行（コード / skill 変更なし）

# 9. mirror parity（skill 編集なしの形式確認）
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
echo $?    # => 0
```

すべての出力結果を `outputs/phase-13/local-check-result.md` に保存する。

## merge 戦略（CLAUDE.md 規約準拠）

- **線形履歴必須** → rebase merge で統一（squash 禁止 / 個別コミット履歴を保持）
- force push 禁止（main / dev）
- 必須レビュアー数 = 0（solo 開発）。CI gate / 線形履歴 / 会話解決必須化で品質担保
- `--no-verify` 禁止（hook はすべて通す）
- `--amend` 禁止（hook 失敗時は新規コミットを積む）
- branch protection（main / dev）への直接 push 禁止 / PR 経由のみ

## PR タイトルテンプレ

```
docs(spec): UT-01 Sheets→D1 同期方式定義 (Refs #50)
```

70 文字以内代替案:

```
docs(spec): UT-01 sheets-d1 sync design (Refs #50)
```

## PR 本文テンプレ

```markdown
## Summary
- UT-01 Sheets→D1 同期方式定義のタスク仕様書を新規作成（docs-only / NON_VISUAL / spec_created）
- 採択方式: Cloudflare Workers Cron Triggers による定期 pull（無料枠完結 / 冪等性確保が容易）
- `sync_log` テーブルの論理スキーマ（13 カラム）/ エラーハンドリング方針（3 回リトライ + Backoff 1〜32s）/ Sheets API quota 対処（バッチ 100 行）を確定
- Phase 11 は UT-GOV-005 で整備された docs-only / NON_VISUAL 縮約テンプレ（main.md / manual-smoke-log.md / link-checklist.md の 3 点固定）を適用
- `workflow_state=spec_created` を Phase 12 close-out 後も据え置き（実装完了は UT-09 / UT-04 が担う）

## 関連 Issue
- Refs #50（CLOSED のまま参照のみ。reopen しない）

## 実装範囲（仕様書のみ・コード変更なし）
- `docs/30-workflows/ut-01-sheets-d1-sync-design/index.md`（新規）
- `docs/30-workflows/ut-01-sheets-d1-sync-design/artifacts.json`（新規）
- `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-01.md`〜`phase-13.md`（新規 13 ファイル）
- `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-01/`〜`phase-13/`（新規）

## 影響範囲外（コード変更なし宣言）
- `apps/api` / `apps/web` ランタイムコード: 変更なし
- D1 schema / migrations: 変更なし（論理設計のみ。物理化は UT-04）
- `.claude/skills/*` / `.agents/skills/*`: 変更なし（縮約テンプレを参照するのみ）
- aiworkflow-requirements 仕様 / Cloudflare Secrets / 1Password Environments: 変更なし

## AC チェックリスト
- [ ] **AC-1**: 同期方式比較表が `outputs/phase-02/sync-method-comparison.md` に存在し採択理由が明文化
- [ ] **AC-2**: 3 種フロー図（手動 / 定期 / バックフィル）が `outputs/phase-02/sync-flow-diagrams.md` に存在
- [ ] **AC-3**: エラーハンドリング方針（3 回リトライ / Backoff / 冪等性 / 部分失敗 / failed ログ）が記載
- [ ] **AC-4**: `sync_log` 論理スキーマ（13 カラム）が `outputs/phase-02/sync-log-schema.md` に定義
- [ ] **AC-5**: source-of-truth 優先順位 + ロールバック判断フローチャート記載
- [ ] **AC-6**: Sheets API quota 対処（バッチ 100〜500 行 + Backoff）が記載
- [ ] **AC-7**: 冪等性戦略（行ハッシュ + 固有 ID + UPSERT 前提）が文書化、UT-04 引き継ぎ事項として整理
- [ ] **AC-8**: 代替案 3 件以上（A/B/C/D）が PASS / MINOR / MAJOR で評価、base case 確定
- [ ] **AC-9**: UT-09 が本仕様書のみで実装着手可能（open question 0 件）
- [ ] **AC-10**: メタ整合（docs-only / NON_VISUAL / spec_created / design_specification）が `index.md` と `artifacts.json` で完全一致

## Phase 11 縮約テンプレ準拠
- [ ] `outputs/phase-11/` = 3 点固定（main.md / manual-smoke-log.md / link-checklist.md）
- [ ] screenshot / `manual-test-result.md` 等の冗長 artefact なし
- [ ] 第一適用例（UT-GOV-005）への参照リンク記載

## Phase 12 必須 5 タスク
- [ ] Task 12-1: implementation-guide.md（Part 1 アナロジー + Part 2 C12P2-1〜5）
- [ ] Task 12-2: system-spec-update-summary.md（Step 1-A/B/C + Step 2 N/A 宣言）
- [ ] Task 12-3: documentation-changelog.md（変更ファイル + MINOR 解決状況）
- [ ] Task 12-4: unassigned-task-detection.md（U-1〜U-10 / 0 件でも出力遵守）
- [ ] Task 12-5: skill-feedback-report.md（観察事項 / 改善点なしでも出力遵守）
- [ ] Task 12-6: phase12-task-spec-compliance-check.md（総合 PASS）

## state ownership
- [ ] `workflow_state=spec_created` を据え置き（`index.md` の状態欄を書き換えない）
- [ ] 実装完了は UT-09 / UT-04 が担う（本タスクは設計仕様のみ）

## post-merge 後続タスク
- U-1: hybrid（webhook + cron fallback）方式の将来評価（LOW）
- U-2: Cron 間隔 staging 測定（MEDIUM / UT-09 内吸収可）
- U-3: partial index D1 サポート確認 / 代替設計（LOW / UT-04 内吸収可）
- U-4: sync_log 保持期間 / 監視連動（LOW / UT-08 連動）

## Test plan
- [ ] CI: typecheck / lint / verify-indexes-up-to-date GREEN
- [ ] reviewer: 採択方式（Cron pull）と代替案 3 件以上の比較根拠を確認
- [ ] reviewer: `sync_log` 論理スキーマ 13 カラムの妥当性確認
- [ ] reviewer: Phase 11 縮約 3 点固定（screenshot 不存在）の確認
- [ ] reviewer: `workflow_state=spec_created` 据え置きの確認
- [ ] reviewer: Issue #50 が CLOSED のまま reopen されていないこと

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行タスク

1. **user 承認待ち**（明示承認なき限り blocked のまま放置）
2. ローカル確認 1〜9 を実行し `outputs/phase-13/local-check-result.md` に保存
3. `outputs/phase-13/change-summary.md` 作成（変更ファイル一覧 + 影響範囲 + 影響範囲外）
4. `outputs/phase-13/main.md` 作成（blocked 理由 / approval status / pre-merge checklist 進捗）
5. `outputs/phase-13/pr-template.md` 作成（PR タイトル / 本文 / AC チェックリスト）
6. **user 明示承認後にのみ** `gh pr create` 実行（HEREDOC で本文渡し）
7. PR 番号と URL を `outputs/phase-13/main.md` に追記
8. CI gate 結果（typecheck / lint / verify-indexes-up-to-date）を待ち、最終ステータスを `outputs/phase-13/main.md` に記録
9. post-merge: U-1〜U-10 を別 GitHub Issue 化（必要なもののみ / github-issue-manager skill で起票）
10. post-merge: `documentation-changelog.md` を merge 結果（commit hash / merge 日時）で更新

## pre-merge checklist（必須）

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `mise exec -- pnpm indexes:rebuild` 後の `git diff` が空
- [ ] AC-1〜AC-10 全件 PASS
- [ ] Phase 11 outputs = 3 点固定（screenshot / 冗長 artefact なし）
- [ ] Phase 12 必須 5 タスク全 PASS / compliance-check 総合 PASS
- [ ] `workflow_state=spec_created` 据え置き（書換えなし）
- [ ] Issue #50 が CLOSED のまま
- [ ] 計画系 wording 残存 0 件
- [ ] コード変更なし（`apps/` / `packages/` / `.claude/skills/` / `.agents/skills/` 全 0 行差分）
- [ ] `.claude` ↔ `.agents` mirror diff 0 行
- [ ] **user 明示承認取得済**

## 参照資料

### システム仕様（task-specification-creator skill）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 13 テンプレ | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` | PR 作成プロセス正本 |
| 第一適用例 Phase 13 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/phase-13.md` | docs-only / NON_VISUAL Phase 13 適用例 |

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-12/` 配下 7 ファイル |
| 必須 | `outputs/phase-11/` 配下 3 点 |
| 必須 | `outputs/phase-10/go-no-go.md` |
| 必須 | `outputs/phase-09/main.md`（AC マトリクス最終結果） |
| 参考 | `CLAUDE.md`（ブランチ戦略 / merge 規約 / Issue 運用） |

## 依存Phase明示

- Phase 1〜12 の成果物すべてを参照する
- 特に Phase 11（縮約 3 点）/ Phase 12（7 必須成果物 + Part 2 5 項目）が PR 検証根拠

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-13/main.md` | Phase 13 トップ index / blocked 理由 / approval status / PR 番号・URL（承認後） / CI 最終ステータス |
| `outputs/phase-13/local-check-result.md` | ローカル確認 1〜9 の出力 |
| `outputs/phase-13/change-summary.md` | 変更ファイル / 影響範囲 / 影響範囲外 |
| `outputs/phase-13/pr-template.md` | PR タイトル / 本文 / AC-1〜AC-10 チェックリスト / 実装範囲明示 |

## 完了条件 (DoD)

- [ ] user 承認確認済（明示承認なしなら blocked のまま終了）
- [ ] local-check-result.md / change-summary.md / pr-template.md / main.md 作成済
- [ ] PR 作成済（**user 承認後のみ**）
- [ ] CI gate（typecheck / lint / verify-indexes-up-to-date）GREEN（承認後のみ）
- [ ] `workflow_state=spec_created` 据え置き確認済
- [ ] post-merge: U-1〜U-10 別 issue 化判定（merge 後 / 起票は任意）
- [ ] post-merge: documentation-changelog 更新（merge commit hash 追記）

## 苦戦箇所・注意

- **承認なし自動実行禁止（最重要）**: Phase 13 の `user_approval_required: true` を厳守。ユーザーが「進めて」と明示するまで `gh pr create` を勝手に走らせない
- **Issue #50 reopen 厳禁**: CLOSED のまま参照する。本タスクは「CLOSED Issue を仕様書として再構築」する性質のため、PR 本文は `Closes #50` ではなく `Refs #50` を使う
- **`workflow_state` 誤書換え**: Phase 13 の最終整備で `index.md` の状態欄を `completed` に変えてしまう事故を防ぐ。`spec_created` のままにする
- **コード変更混入**: 本 PR は仕様書のみで構成。`apps/` / `packages/` / `.claude/skills/` / `.agents/skills/` に 1 行でも diff があれば、本 PR スコープ違反として fail-fast
- **mirror diff の merge 直前ドリフト**: 本タスクは skill 編集を行わないため diff 0 が前提。pre-merge で再確認
- **branch protection 抵触**: main / dev への直接 push は pre-commit hook で拒否される。PR 経由のみ
- **CI hook 失敗時の再 commit**: hook 失敗時は `--amend` ではなく新規コミットを積む（CLAUDE.md 規約）。`--no-verify` は禁止
- **post-merge 後続タスク起票忘れ**: U-1〜U-10 を merge 後に別 issue 化判定する（必須ではないが、TECH-M-NN 由来項目を放置しない）
- **squash merge の誘惑**: 線形履歴維持のため rebase merge で統一する

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パスと `artifacts.json` の outputs（4 件）が一致していることを確認する
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない
- [ ] **user 明示承認なしに `gh pr create` を実行していないことを確認する**
- [ ] **`workflow_state=spec_created` を書き換えていないことを確認する**

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計仕様策定タスクであり、アプリケーション統合テストは追加しない
- 統合検証は CI gate（typecheck / lint / verify-indexes-up-to-date）/ AC マトリクス全件 PASS / Phase 11 縮約 3 点固定確認 / コード変更 0 行確認で代替する
- post-merge で UT-09 / UT-04 が本仕様書のみで実装着手開始する状態になる

## 次 Phase

- 次: なし（最終 Phase）
- post-merge: U-1〜U-10 別 issue 化判定 / documentation-changelog 更新 / UT-09 / UT-04 が本仕様書を参照して実装着手
