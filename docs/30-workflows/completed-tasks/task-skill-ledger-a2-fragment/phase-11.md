# Phase 11: 手動テスト（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 11 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

NON_VISUAL / `implementation` タスクのため screenshot は不要。現在の仕様書作成では、将来実装時に必要な **4 worktree 並列 smoke で fragment 由来 conflict 0 件** の手順と証跡項目を検証可能な計画として固定し、実機実行は将来の implementation workflow で行う。

## NON_VISUAL 判定の根拠

- UI 変更なし（CLI / shell / file system 操作のみ）
- screenshot は要求しない（FB-UBM-009 / 010 / Feedback BEFORE-QUIT-001）
- 自動テスト名 + 実行件数 + 4 worktree smoke 出力ログを **証跡の主ソース** として記録する

## 実行タスク

### Step 1: 自動テスト計画確認（NON_VISUAL evidence の主ソース）

```bash
mise exec -- pnpm vitest run scripts/skill-logs-render.test.ts scripts/skill-logs-append.test.ts
```

- 将来実装時に Green 件数 / 総件数 / 所要時間を `outputs/phase-11/manual-smoke-log.md` に記録する計画になっていることを確認。
- スクリーンショットを作らない理由を `manual-smoke-log.md` のメタ情報に明記（FB-Feedback 4 対応）。

### Step 2: 4 worktree 並列 smoke 計画確認

```bash
for n in 1 2 3 4; do bash scripts/new-worktree.sh verify/a2-$n; done
```

各 worktree で以下を実行:

```bash
mise exec -- pnpm skill:logs:append --skill aiworkflow-requirements --type log --message "smoke a2-$n"
git add . && git commit -m "smoke: a2-$n fragment"
git push origin verify/a2-$n
```

main で順次 merge:

```bash
git checkout main
for n in 1 2 3 4; do git merge --no-ff verify/a2-$n; done
git ls-files --unmerged   # => 0 行（必須）
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements | head -n 40
```

### Step 3: render 出力確認計画

- 4 entry が timestamp 降順で出力されること
- 各 fragment の front matter（`branch: verify/a2-$n`）が render 結果に反映されていること

### Step 4: 証跡保存計画

- `outputs/phase-11/4worktree-smoke-evidence.md` に以下を保存
  - 各 worktree の commit hash
  - merge 結果の `git ls-files --unmerged` 出力（0 行）
  - render 出力の先頭 40 行
  - 所要時間 / 環境（Node / pnpm version）

### Step 5: link checklist（NON_VISUAL でも実施）

- `outputs/phase-*/main.md` 内の相対リンク先存在チェック
- 相対リンク先が 1 つでも 404 ならば Blocker
- 結果を `outputs/phase-11/link-checklist.md` に保存する。

## 参照資料

- Phase 2 `outputs/phase-2/fragment-schema.md` / `outputs/phase-2/render-api.md`
- Phase 4 `outputs/phase-4/test-matrix.md`（C-16: 4 worktree smoke）
- Phase 5 `outputs/phase-5/runbook.md`
- Phase 6 `outputs/phase-6/fragment-runbook.md`
- Phase 7 `outputs/phase-7/coverage.md`
- Phase 8 `outputs/phase-8/before-after.md`
- Phase 9 `outputs/phase-9/quality-gate.md`
- Phase 10 `outputs/phase-10/go-no-go.md`
- 既存仕様書 §6 検証手順

## 統合テスト連携

将来実装時の統合テストは Phase 4 C-16 と Phase 6 `outputs/phase-6/fragment-runbook.md` を入力にし、4 worktree smoke の実行結果を `outputs/phase-11/4worktree-smoke-evidence.md` へ保存する。現在の implementation close-out では、実行ではなく証跡フォーマットと link checklist の妥当性を確認する。

## 成果物

- `outputs/phase-11/main.md`（NON_VISUAL 判定根拠・Step 1〜5 サマリー）
- `outputs/phase-11/manual-smoke-log.md`（自動テスト件数・スクショ不要理由）
- `outputs/phase-11/link-checklist.md`（相対リンク存在チェック）
- `outputs/phase-11/4worktree-smoke-evidence.md`（将来実装時の実機 smoke 証跡フォーマット）

## 完了条件

- [ ] 自動テスト全件 Green を記録する計画が manual-smoke-log.md に固定されている。
- [ ] 4 worktree smoke で `git ls-files --unmerged` が 0 行であることを証跡化するフォーマットが固定されている。
- [ ] render 出力に 4 entry すべてが timestamp 降順で含まれることを確認する手順が固定されている。
- [ ] スクリーンショット不要理由が manual-smoke-log.md メタ情報に明記されている。
- [ ] 相対リンク 404 が 0 件。
- [ ] implementation / `NON_VISUAL` Phase 11 の必須 3 点（main.md / manual-smoke-log.md / link-checklist.md）が揃っている。
- [ ] artifacts.json の Phase 11 status と整合。
- [ ] `screenshots/` ディレクトリは作成しない（NON_VISUAL）。
