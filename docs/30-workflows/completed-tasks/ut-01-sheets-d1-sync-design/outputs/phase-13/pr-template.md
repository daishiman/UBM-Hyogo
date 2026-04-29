# pr-template.md（実行時に記入）

> Phase 13: PR タイトル / 本文テンプレ。**user 明示承認後のみ** `gh pr create` で実行する。

## PR タイトル（70 文字以内）

```
docs(spec): UT-01 sheets-d1 sync design (Refs #50)
```

代替（70 文字以内・日本語）:

```
docs(spec): UT-01 Sheets→D1 同期方式定義 (Refs #50)
```

## PR 本文（HEREDOC で渡す）

```markdown
## Summary
- UT-01 Sheets→D1 同期方式定義のタスク仕様書を新規作成（docs-only / NON_VISUAL / spec_created）
- 採択方式: Cloudflare Workers Cron Triggers による定期 pull（無料枠完結 / 冪等性確保が容易）
- `sync_log` テーブルの論理スキーマ（13 カラム）/ エラーハンドリング方針（3 回リトライ + Backoff 1〜32s）/ Sheets API quota 対処（バッチ 100 行）を確定
- Phase 11 は UT-GOV-005 整備の docs-only / NON_VISUAL 縮約テンプレ（main / manual-smoke-log / link-checklist の 3 点固定）を適用
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
- `.claude/skills/*` / `.agents/skills/*`: 変更なし
- aiworkflow-requirements 仕様 / Cloudflare Secrets / 1Password Environments: 変更なし

## AC チェックリスト
- [ ] AC-1: 同期方式比較表が `outputs/phase-02/sync-method-comparison.md` に存在し採択理由が明文化
- [ ] AC-2: 3 種フロー図（手動 / 定期 / バックフィル）が `outputs/phase-02/sync-flow-diagrams.md` に存在
- [ ] AC-3: エラーハンドリング方針（3 回リトライ / Backoff / 冪等性 / 部分失敗 / failed ログ）が記載
- [ ] AC-4: `sync_log` 論理スキーマ（13 カラム）が `outputs/phase-02/sync-log-schema.md` に定義
- [ ] AC-5: source-of-truth 優先順位 + ロールバック判断フローチャート記載
- [ ] AC-6: Sheets API quota 対処（バッチ 100〜500 行 + Backoff）が記載
- [ ] AC-7: 冪等性戦略（行ハッシュ + 固有 ID + UPSERT 前提）が文書化、UT-04 引き継ぎ事項として整理
- [ ] AC-8: 代替案 3 件以上（A/B/C/D）が PASS / MINOR / MAJOR で評価、base case 確定
- [ ] AC-9: UT-09 が本仕様書のみで実装着手可能（open question 0 件）
- [ ] AC-10: メタ整合（docs-only / NON_VISUAL / spec_created / design_specification）が `index.md` と `artifacts.json` で完全一致

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

## post-merge 後続タスク（unassigned-task-detection 由来）
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

## 実行コマンド（user 承認後のみ）

```bash
gh pr create --title "docs(spec): UT-01 sheets-d1 sync design (Refs #50)" --body "$(cat <<'EOF'
（上記 PR 本文をここに貼る）
EOF
)"
```

> **重要**: `user_approval_required: true` のため、ユーザーが明示的に「PR 作成して良い」と発言するまで `gh pr create` を実行しない。

## 注意事項

- Issue #50 は CLOSED のまま `Refs #50` で関連付ける（`Closes #50` は使わない）
- `--no-verify` 禁止 / `--amend` 禁止 / squash 禁止（rebase merge 統一）
- branch protection（main / dev）への直接 push 禁止
