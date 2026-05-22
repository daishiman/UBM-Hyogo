# Phase 13: PR 作成と振り返り

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 1〜12 で完成した rename / config 編集 / CI gate / docs 同期を 1 PR に集約し、`dev` にマージ可能な状態にする最終 Phase。CLOSED 済 Issue #623 への参照記法、retrospective テンプレート、PR 本文規約を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成と振り返り |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 12（正本同期） |
| 次 Phase | なし |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL |
| GitHub Issue | #623（CLOSED — `Refs` として参照、`Closes` は使わない） |

---

## 目的

Phase 1〜12 の全成果物を 1 PR にまとめ、`dev` ブランチへマージ可能な状態にする。Issue #623 は CLOSED であり再 open しないため、PR 本文では `Refs #623` 表記で参照のみ行う。

> CLAUDE.md「PR作成の完全自律フロー」適用時は確認質問を挟まず本 Phase を実行する。それ以外は Phase 12 完了後にユーザー承認を得てから実行する。

---

## 13-1. PR 基本情報

| 項目 | 値 |
| --- | --- |
| PR タイトル | `refactor(test): converge vitest test suffix to *.spec only (issue-623)` |
| 70 文字以内 | YES（67 文字） |
| ベースブランチ | `dev` |
| 作業ブランチ | `feat/issue-623-vitest-spec-suffix-convergence` |
| PR 種別 | refactor + ci + docs |
| 関連 Issue 参照 | `Refs #623`（CLOSED 維持） / `Refs #325`（親 ADR） |

### CLOSED 済 Issue #623 への参照記述方法

- ❌ 禁止: `Closes #623`、`Fixes #623`、`Resolves #623`（CLOSED を re-open / reopen-close ループさせる原因）
- ✅ 推奨: `Refs #623`、`Related to #623`、`Follow-up of #325`
- 本文の最終段で `Refs #623 (closed)` と明示し「再 open は不要」を示す

---

## 13-2. ローカルチェック手順

```bash
# 0. dev 同期
git fetch origin dev
git checkout feat/issue-623-vitest-spec-suffix-convergence
git merge origin/dev  # conflict は CLAUDE.md の規定方針に従い解消

# 1. 品質ゲート
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 2. vitest 全件
mise exec -- pnpm test --run --reporter=json > /tmp/final.json
jq '.numTotalTests' /tmp/final.json

# 3. 残存 0 件
find . -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) \
  -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.open-next/*' | wc -l
# 期待: 0

# 4. config grep
grep -E '\{test,spec\}' vitest.config.ts | wc -l  # 期待 0
grep -E '\*\.test\.\{ts,tsx\}' vitest.config.ts | wc -l  # 期待 0

# 5. artifacts.json 妥当性
node -e "JSON.parse(require('fs').readFileSync('docs/30-workflows/issue-623-vitest-spec-suffix-convergence/artifacts.json','utf8'))" \
  && echo "artifacts.json: PASS"

# 6. CI gate ファイルが存在
test -x scripts/hooks/block-test-suffix.sh && echo "hook: OK"
test -f .github/workflows/verify-test-suffix.yml && echo "workflow: OK"
grep -q 'block-test-suffix' lefthook.yml && echo "lefthook wired: OK"

# 7. docs 追記
grep -q '\*\.spec\.{ts,tsx}' CLAUDE.md && echo "CLAUDE.md: OK"
grep -q 'issue-623' docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md && echo "ADR: OK"
```

結果は `outputs/phase-13/local-check-result.md` に記録。

---

## 13-3. 変更ファイル確認

```bash
git status
git diff dev...HEAD --name-only > outputs/phase-13/changed-files.txt
wc -l outputs/phase-13/changed-files.txt
# 期待: rename 159 + 新規 3 + 編集 3 + docs 4 = 約 169 ファイル
```

確認:
- rename 159 件が含まれる（`R100` で history 保持されている）
- `vitest.config.ts` / `lefthook.yml` / `CLAUDE.md` / ADR が編集されている
- `scripts/hooks/block-test-suffix.sh` / `.github/workflows/verify-test-suffix.yml` / `scripts/migration/rename-test-to-spec.sh` が新規追加
- `apps/web` 配下のソースコード（rename 除く）に変更がない
- `.env` や secrets ファイルが含まれていない

---

## 13-4. push と PR 作成

```bash
git push -u origin feat/issue-623-vitest-spec-suffix-convergence

gh pr create --base dev \
  --title "refactor(test): converge vitest test suffix to *.spec only (issue-623)" \
  --body "$(cat <<'EOF'
## Summary

- リポジトリ全体の `*.test.ts(x)` 159 件を `*.spec.ts(x)` に `git mv` で rename
- `vitest.config.ts` の `test.include` と `coverage.exclude` を `*.spec.{ts,tsx}` 単一に収斂（二段階対応終了）
- 新規 `*.test.ts(x)` 追加を block する CI gate を 2 層導入（lefthook pre-commit + GitHub Actions workflow）
- CLAUDE.md「重要な不変条件」/ ADR（issue-325 phase-12）/ skill LOGS に追記

## 変更点

### rename（git mv 159 件 / history 保持）
- apps/web 83 件 / apps/api 6 件 / packages/shared 17 件 / packages/integrations 11 件 / scripts 35 件 / .claude/skills 7 件

### コード
- 新規: `scripts/hooks/block-test-suffix.sh`、`scripts/migration/rename-test-to-spec.sh`、`.github/workflows/verify-test-suffix.yml`
- 編集: `vitest.config.ts`（include / coverage.exclude）、`lefthook.yml`（block-test-suffix command 追加）

### docs / skill
- 編集: `CLAUDE.md`（不変条件 +1 行）
- 編集: `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md`（履歴追記）
- 編集: `.claude/skills/task-specification-creator/SKILL-changelog.md`、`.claude/skills/aiworkflow-requirements/SKILL-changelog.md`
- 再生成: `.claude/skills/aiworkflow-requirements/indexes/*`
- 新規: `docs/30-workflows/issue-623-vitest-spec-suffix-convergence/` 配下（index.md + phase-01〜13 + artifacts.json + outputs/）
- 移動: `docs/30-workflows/unassigned-task/task-issue-325-followup-003-*.md` → `docs/30-workflows/completed-tasks/`

## Test plan

- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm test --run` PASS（`numTotalTests` が rename 前と同一）
- [x] coverage delta ±0.5pt 以内
- [x] `find . -name '*.test.ts' -o -name '*.test.tsx' | grep -v node_modules` が 0 件
- [x] `grep -E '\{test,spec\}' vitest.config.ts` が 0 hit
- [x] `grep -E '\*\.test\.\{ts,tsx\}' vitest.config.ts` が 0 hit
- [x] lefthook `block-test-suffix` が dummy `.test.ts` staged で exit != 0
- [x] GitHub Actions `verify-test-suffix` が dummy branch で job fail / 本 branch で green
- [x] 既存 lefthook commands（main-branch-guard / staged-task-dir-guard）が並列で正常動作

## Evidence

- `outputs/phase-11/test-report.md`: AC-1〜AC-8 判定
- `outputs/phase-11/evidence-bundle/ac-1-find-before.txt`（159 件）/ `ac-1-find-after.txt`（0 件）
- `outputs/phase-11/evidence-bundle/ac-2-vitest-config-diff.txt`: config before/after diff
- `outputs/phase-11/evidence-bundle/ac-4-precommit-log.txt`: hook reject 実証
- `outputs/phase-11/evidence-bundle/ac-6-ci-fail.txt` / `ac-6-ci-green.txt`: CI workflow 実証
- `outputs/phase-11/evidence-bundle/ac-7-numTotalTests-diff.txt`: discovery 不変
- `outputs/phase-11/coverage-delta-report.md`: coverage delta
- `outputs/phase-12/implementation-guide.md`: 実装ガイド（Part 1 中学生 / Part 2 技術者）

## 不変条件チェック

- [x] rename は `git mv` 経由（`R100` で history 保持）
- [x] CI gate 命名固定: `block-test-suffix` / `verify-test-suffix`
- [x] 既存 hook を改変せず独立 step として並列追加
- [x] `apps/web` のソースコード（rename 除く）に変更なし
- [x] `__tests__` ディレクトリ名は変更していない
- [x] D1 binding / wrangler 直接実行などに触れていない
- [x] `.env` に実値を書いていない / PR 本文に secrets を貼っていない

## 関連 Issue

Refs #623 (closed) — 再 open は不要。close 時点での未完了部分を本 PR で完了。
Refs #325 — 親 ADR の追記対象。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 13-5. PR チェックリストテンプレ

`outputs/phase-13/pr-checklist.md`:

```markdown
# issue-623 PR チェックリスト

## 基本情報
| 項目 | 値 |
| --- | --- |
| PR タイトル | refactor(test): converge vitest test suffix to *.spec only (issue-623) |
| ベース | dev |
| 作業ブランチ | feat/issue-623-vitest-spec-suffix-convergence |
| 関連 Issue | Refs #623 (closed) / Refs #325 |

## ローカルチェック
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm test --run` PASS / `numTotalTests` 不変
- [ ] coverage delta ±0.5pt 以内
- [ ] `find` 残存 0 件
- [ ] vitest.config 二段階記法 0 hit
- [ ] CI gate ファイル 3 件配置
- [ ] CLAUDE.md / ADR / skill LOGS 追記
- [ ] artifacts.json 妥当性 PASS

## 不変条件
- [ ] `git mv` で rename / `R100` 保持
- [ ] 命名固定（block-test-suffix / verify-test-suffix）
- [ ] 既存 hook 無改変
- [ ] `__tests__` 名称不変
- [ ] secrets 混入なし

## evidence
- [ ] AC-1〜AC-8 evidence が `outputs/phase-11/evidence-bundle/` に揃う
- [ ] test-report.md / coverage-delta-report.md / ci-gate-trigger-results.md 作成済み

## PR URL
（gh pr create 実行後に記録）
```

---

## 13-6. post-merge アクション

| # | アクション | 担当 |
| --- | --- | --- |
| 1 | `docs/30-workflows/issue-623-vitest-spec-suffix-convergence/` を `docs/30-workflows/completed-tasks/` 配下へ移動 | post-merge スクリプト or 手動 |
| 2 | `docs/30-workflows/unassigned-task/task-issue-325-followup-003-*.md` の移動が反映済みであることを確認（Phase 12 で実施済み） | 手動 |
| 3 | artifacts.json の全 Phase が `completed` であることを再確認 | 手動 |
| 4 | dev → main 昇格 PR は別タスクで実施（本 PR は dev までで完了） | 別タスク |
| 5 | Issue #623 を re-open しない（CLOSED のまま） | 手動確認 |

---

## 13-7. 振り返り（retrospective）テンプレート

`outputs/phase-13/retrospective.md`:

```markdown
# issue-623 retrospective

## 計画精度
| 観点 | 計画 | 実績 | 差分 |
| --- | --- | --- | --- |
| 工数（時間） | (Phase 4 見積) | (実工数) | (差) |
| commit 数 | 約 12 | (実数) | (差) |
| rename 件数 | 159 | (実数) | (差) |

## うまくいったこと
- `git mv` バッチで 159 件を機械的に処理できた
- CI gate 2 層化で「rename だけ完了して再混入する」中間状態を排除できた
- coverage delta ±0% を保てた（rename のみで実体不変）

## 改善点 / Lessons Learned
- 二段階対応の恒久化は ADR だけでは止められない（CI gate がないと必ず再混入）
- lefthook `parallel: true` 下で state 共有しない独立 hook 設計が後方互換に効く
- `find` の除外 path は `node_modules` / `.next` / `.open-next` の 3 段が標準形

## 後続タスク
- `__tests__` ディレクトリ名の見直し（別タスク）
- Playwright / Storybook suffix 規約（別タスク）
- coverage threshold 見直し（別タスク）

## CONST_005 / CONST_007 違反の有無
- なし

## skill / spec への反映
- Phase 12 skill-feedback-report.md の 5 カテゴリが `.claude/skills/` LOGS に反映済み

## 月次運用への影響
- なし（本タスクは CI gate 追加のみで、月次 runbook の運用変更はない）
```

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| dev → main 昇格 PR | 本 PR マージ後、別タスクで実施 | スコープ外 |
| issue-325 親タスク | ADR 履歴追記が連動 | Phase 12 で完了済み |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/outputs/phase-12/documentation-changelog.md | PR 本文「変更点」の元データ |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/outputs/phase-12/unassigned-task-detection.md | PR 本文「Summary」の元データ |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/outputs/phase-11/test-report.md | Test plan / Evidence の元データ |
| 必須 | CLAUDE.md「PR作成の完全自律フロー」 | PR 作成プロトコル |
| 必須 | CLAUDE.md「ブランチ戦略」 | dev base 運用 |
| 参考 | .claude/commands/ai/diff-to-pr.md | PR 本文 Phase 13 仕様 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/pr-checklist.md | PR チェックリスト + URL 記録 |
| ドキュメント | outputs/phase-13/local-check-result.md | ローカルチェック結果 |
| ドキュメント | outputs/phase-13/changed-files.txt | 変更ファイル一覧 |
| ドキュメント | outputs/phase-13/change-summary.md | PR 本文へ転記する変更サマリー |
| ドキュメント | outputs/phase-13/retrospective.md | 13-7 振り返り |
| PR | GitHub Pull Request | レビュー / マージ |
| メタ | artifacts.json | 全 Phase を completed に更新 |

---

## 完了条件 (DoD 再掲)

タスク全体の DoD を本 Phase で最終確認:

1. [ ] `find . -name '*.test.ts' -o -name '*.test.tsx' \| grep -v node_modules` が 0 件
2. [ ] `vitest.config.ts` の `test.include` が `*.spec.{ts,tsx}` 単一
3. [ ] `vitest.config.ts` の `coverage.exclude` から `**/*.test.{ts,tsx}` 削除
4. [ ] `pnpm test --run` の `numTotalTests` が rename 前と同一
5. [ ] coverage delta ±0%（許容誤差 ±0.5pt）
6. [ ] `scripts/hooks/block-test-suffix.sh` が `.test.ts(x)` staged 時に exit != 0
7. [ ] `.github/workflows/verify-test-suffix.yml` が main/dev push および PR で trigger し fail 動作可能
8. [ ] CLAUDE.md / ADR / skill changelog に追記反映

加えて:

- [ ] ローカルチェック全 PASS
- [ ] PR が GitHub 上に作成され URL が `pr-checklist.md` に記録されている
- [ ] PR base が `dev`
- [ ] PR 本文に `Refs #623 (closed)` と `Refs #325` が記載
- [ ] secrets（API token 等）が PR 本文 / コミット / コードに含まれていない
- [ ] artifacts.json の全 Phase が `completed`
- [ ] `retrospective.md` が記録されている
- [ ] Issue #623 が CLOSED のまま（re-open しない）

---

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/task-specification-creator/references/phase-13-spec.md` | PR 本文規約（存在する場合） |
| `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | 完了同期手順 |
| `.claude/commands/ai/diff-to-pr.md` | PR 本文 Phase 13 仕様 |

---

## タスク 100% 実行確認【必須】

- [ ] 全仕様化タスクが `spec_created` として整合し、実装後の最終チェック項目が明記されている
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の全 Phase を completed に更新
- [ ] PR URL を pr-checklist.md に記録

---

## 次 Phase

- なし（Phase 13 が最終 Phase）
- post-merge: 13-6 の 5 アクションを実施
- ブロック条件: ローカルチェック FAIL / DoD 8 条件のいずれかが未達 / secrets 混入 / `apps/web` ソース変更混入（rename 除く）

## 実行タスク

- ユーザー承認後に push / PR 作成 / retrospective 記録を実施する。
