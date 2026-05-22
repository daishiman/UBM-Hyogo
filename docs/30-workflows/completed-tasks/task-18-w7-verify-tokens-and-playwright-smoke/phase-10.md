# Phase 10: 最終レビュー / Required status check 登録準備

## 目的

PR push 前の最終レビューと、branch protection の `required_status_checks.contexts` 更新の準備（実行は Phase 13 user approval 後）。

## 10.1 自己レビューチェックリスト

- [ ] 仕様書 §3.1 のファイル table が `git diff --name-only main...HEAD` の出力と整合
- [ ] 範囲外 deletion / addition がない（CONST_005 / diff scope 規律）
- [ ] `apps/api/` に変更がない（不変条件 1）
- [ ] `apps/web/src/styles/tokens.css` / `globals.css` の**値**に変更がない（不変条件 2-3）
- [ ] 4 PNG が `apps/web/playwright/tests/visual/__screenshots__/` に commit されている
- [ ] `.env` 実値が含まれない（grep gate Phase 8.4）
- [ ] `test.skip` / `it.skip` の残留 0 件:
      ```bash
      grep -rn 'test\.skip\|it\.skip\|describe\.skip\|test\.todo\|it\.todo' apps/web/playwright/tests/ scripts/
      ```
- [ ] placeholder token 残留 0 件（Phase 8.4）

## 10.2 Branch protection 変更プラン（実行は Phase 13）

> 不可逆 governance mutation は user 明示承認後に実行する（references/governance-branch-protection-pattern.md / non-visual-irreversible-task-rules.md §0）。

事前 read-only evidence:
```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-11/evidence/branch-protection-main-before.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-11/evidence/branch-protection-dev-before.json
```

期待差分（追加対象）:
- `required_status_checks.contexts` に以下 3 件 append:
  - `verify-design-tokens / verify-design-tokens`
  - `playwright-smoke / smoke (chromium)`
  - `playwright-smoke / visual (chromium, 4 screens)`

不変フィールド（drift 禁止、各 dev/main で個別取得・個別 PUT）:
- `required_pull_request_reviews: null`（solo dev policy）
- `lock_branch: false`
- `enforce_admins: true`
- `required_linear_history: true`
- `required_conversation_resolution: true`
- `allow_force_pushes: false`
- `allow_deletions: false`

実行コマンド（dev / main 個別、Phase 13 user approval 後）:
```bash
# main
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
  --input outputs/phase-13/branch-protection-main-after.json
# dev
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input outputs/phase-13/branch-protection-dev-after.json
```

`*-after.json` は read response をそのままコピーしない。Phase 13 で PUT 用 payload を次の最小 schema へ正規化して生成する:

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["existing", "verify-design-tokens / verify-design-tokens"],
    "checks": []
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "lock_branch": false
}
```

payload 生成後、before の不変フィールドと payload の値を `jq` で比較し、3 contexts 以外の drift があれば PUT 禁止。

## 10.3 PR 本文ドラフト構造

PR 本文は Phase 12 `outputs/phase-12/implementation-guide.md` を正本として、`.claude/commands/ai/diff-to-pr.md` のルールで生成する。最低限のヘッダ:

- ## Summary（3 行）: gate 3 本確立、17 URL routes smoke、4 画面 visual baseline
- ## Changes（変更ファイル table）
- ## Verification（Phase 8 PASS 5-set + smoke + visual のコマンドと exit code）
- ## Required Status Check 追加プラン（Phase 13 で実行）
- ## Test plan: `pnpm verify:tokens` / `pnpm --filter @ubm-hyogo/web e2e:smoke` / `e2e:visual` の checkbox

## 完了条件

- [ ] 自己レビューチェック 8 件 PASS
- [ ] branch protection before JSON 取得
- [ ] after JSON ドラフト準備（実投入は Phase 13）
- [ ] PR 本文ドラフトを `outputs/phase-12/` の implementation-guide.md に統合する準備

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- diff scope、branch protection before JSON、PUT payload guard をレビューする。

| Task | 内容 |
| --- | --- |
| 10-A | diff scope と skip / secret / placeholder gate をレビューする |
| 10-B | branch protection before JSON を read-only evidence として取得する |
| 10-C | PUT 用 payload の正規化と drift guard を Phase 13 へ引き渡す |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| branch protection pattern | `.claude/skills/task-specification-creator/references/governance-branch-protection-pattern.md` | governance mutation gate |
| non-visual irreversible rules | `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md` | user approval gate |
| Phase 8 | `phase-08.md` | local evidence |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 10 仕様 | `phase-10.md` | 最終レビュー / branch protection 準備 |

## 統合テスト連携

Phase 10 はテスト再実行ではなく review gate。Phase 8/11 evidence と Phase 13 CI checks を PR 本文へつなぐ。
