# Phase 13: コミット・PR 作成【BLOCKED PLACEHOLDER】

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 状態 | **blocked** |
| ブロック理由 | Gate A 外部適用と Phase 11 fresh GET evidence は取得済み。commit / push / PR 作成と throwaway PR による empirical merge gate observation は Gate B 承認後にのみ実行可 |

## ⚠️ 実行禁止事項（spec 段階）

本ファイルは Gate B 承認前の placeholder であり、以下のアクションを **絶対に実行してはならない**:

- [ ] `git commit`
- [ ] `git push`
- [ ] `gh pr create`
- [ ] `gh pr merge`
- [ ] `gh api PUT .../protection`（Phase 5 で Gate A 承認後に実行）
- [ ] Cloudflare deploy（本タスクは該当なし）

## 実行解放条件（すべて満たした後のみ進行）

- [ ] Phase 1 GO 判定が記録 (`outputs/phase-1/go-no-go-decision.md`)
- [ ] Phase 5 で main / dev 両方 PUT 適用済 (`outputs/phase-5/{main,dev}-put-response.json`)
- [ ] Phase 5 で SSOT 更新 + `pnpm indexes:rebuild` 完了
- [ ] Phase 9 品質検証 6 項目 PASS
- [ ] Phase 11 NON_VISUAL evidence 8 ファイルすべて実体配置
- [ ] Phase 12 7 ファイル実体 + compliance check PASS
- [ ] **Gate B: git publish approval**（"Phase 13 を実行してよい" 等）

## 実行解放後の手順（参考）

```bash
git add docs/30-workflows/issue-475-branch-protection-coverage-gate/ \
        .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md \
        .claude/skills/aiworkflow-requirements/indexes/

git commit -m "$(cat <<'EOF'
docs(issue-475): branch protection coverage-gate 追加 — spec + applied evidence

- main / dev の required_status_checks.contexts に coverage-gate を追加
  (Phase 5 で gh api PUT 実適用済、Phase 11 fresh GET で drift なし確認)
- aiworkflow-requirements SSOT (deployment-branch-strategy.md) の
  current applied 表に main / dev の coverage-gate と適用日 (2026-05-05) を反映
- skill indexes 再生成 (pnpm indexes:rebuild)
- Phase 1-13 仕様書 + Phase 11 NON_VISUAL evidence 8 件 + Phase 12 必須 7 件を配置

Refs: #475
EOF
)"

git push -u origin docs/issue-475-branch-protection-coverage-gate-spec

gh pr create --title "docs(issue-475): branch protection coverage-gate 追加" \
  --body "$(cat <<'EOF'
## Summary
- Issue #475 のタスク仕様書 (Phase 1-13) を `docs/30-workflows/issue-475-branch-protection-coverage-gate/` 配下に配置
- main / dev の \`required_status_checks.contexts\` に \`coverage-gate\` を追加適用済 (Gate A 承認後の Phase 5)
- \`deployment-branch-strategy.md\` の current applied 表を更新

## Test plan
- [ ] \`gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq '.required_status_checks.contexts'\` に \`coverage-gate\` を含む
- [ ] dev 同上
- [ ] non-target protection fields drift なし
- [ ] 既存 contexts (\`ci\` / \`Validate Build\` 等) が消えていない
- [ ] coverage 未達 throwaway PR で merge button が disabled になることを 1 件確認

Refs: #475
EOF
)"
```

## ロールバック（万一 PUT 後に問題発生時）

Phase 10 / Phase 5 の rollback 手順を参照（baseline JSON で再 PUT）。
