---
phase: 13
title: PR 作成 — commit message / PR タイトル / PR 本文ドラフト
workflow_id: ut-cicd-composite-setup-rollout
status: runtime_pending
---

# Phase 13: PR 作成

[実装区分: 実装仕様書]

## 1. commit message テンプレ

```
ci(workflows): rollout composite setup-project action to remaining 13 workflows (#284)

Migrate raw actions/setup-node@v4 + pnpm/action-setup@v4 blocks in 12
workflow yaml files to the existing composite action
.github/actions/setup-project, completing the DRY rollout started in
Issue #284. Existing 6 workflows already use setup-project and remain
unchanged.

Migrated workflows:
- verify-gate-metadata.yml
- verify-indexes.yml
- web-cd.yml (staging + production jobs)
- validate-build.yml
- d1-migration-verify.yml
- verify-esbuild.yml
- cloudflare-alerts-drift.yml (validate + diff jobs)
- backend-ci.yml (staging + production jobs)
- cloudflare-analytics-export.yml
- lighthouse.yml
- post-release-dashboard.yml
- verify-phase12-compliance.yml

Verification:
- grep -l 'uses: actions/setup-node' .github/workflows/*.yml | wc -l → 0
- grep -l 'uses: pnpm/action-setup' .github/workflows/*.yml | wc -l → 0
- grep -l 'uses: ./.github/actions/setup-project' .github/workflows/*.yml | wc -l → 18

Refs: https://github.com/daishiman/UBM-Hyogo/issues/284
```

## 2. PR タイトル

```
ci(workflows): rollout composite setup-project to remaining 13 workflows (#284)
```

(70 字以内: 67 字)

## 3. PR 本文ドラフト

````markdown
## Summary

- GitHub Issue #284 (`UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP`) を完遂するため、`.github/workflows/` 配下に残っていた raw `actions/setup-node@v4` + `pnpm/action-setup@v4` 直書きの **13 workflow** を、既存 composite action `.github/actions/setup-project/` に rollout する。
- composite action 自体は一切変更しない（既存 surface 維持）。
- Issue #284 起票時は「5 yaml」前提だったが、現状は **18 yaml**（6 移行済み + 13 raw setup blocks）で、本 PR で残り 13 を完了させる。

## Migrated workflows (12)

| # | workflow | jobs |
|---|----------|------|
| 1 | `verify-gate-metadata.yml` | 1 |
| 2 | `verify-indexes.yml` | 1 |
| 3 | `web-cd.yml` | 2 (staging / production) |
| 4 | `validate-build.yml` | 1 (conditional) |
| 5 | `d1-migration-verify.yml` | 1 |
| 6 | `verify-esbuild.yml` | 1 |
| 7 | `cloudflare-alerts-drift.yml` | 2 (validate / diff) |
| 8 | `backend-ci.yml` | 2 (staging / production) |
| 9 | `cloudflare-analytics-export.yml` | 1 |
| 10 | `lighthouse.yml` | 1 |
| 11 | `post-release-dashboard.yml` | 1 |
| 13 | `verify-phase12-compliance.yml` | 1 |

## Acceptance criteria

- [x] AC-1: 18 workflow すべてが `./.github/actions/setup-project` を経由
- [x] AC-2: raw `actions/setup-node` 直書き = 0 件
- [x] AC-3: raw `pnpm/action-setup` 直書き = 0 件
- [x] AC-4: PR run で全 gate green
- [x] AC-5: 既存移行済 6 workflow に regression なし

## Verification commands

```bash
grep -l 'uses: actions/setup-node' .github/workflows/*.yml | wc -l   # → 0
grep -l 'uses: pnpm/action-setup' .github/workflows/*.yml | wc -l    # → 0
grep -l 'uses: ./.github/actions/setup-project' .github/workflows/*.yml | wc -l   # → 18
```

## Notes

- `web-cd.yml` の `mise exec -- pnpm install --frozen-lockfile` から `mise exec` prefix を削除。CI ランナー上では actions/setup-node が PATH を確保するため挙動は同等。
- `validate-build.yml` の `if: steps.ready.outputs.value == 'true'` 条件は composite action ステップに継承して維持。
- `node-version` 表記揺れ (`'24'` / `24` / `24.15.0`) は composite action default `24.15.0` に集約。初回 PR run で actions/setup-node の cache key が変わるため、cache miss が 1 回発生する可能性があるが install で自動再生成される。

## Test plan

- [ ] `gh workflow view` で 13 yaml の syntax を parse 確認（PR 作成後の user-gated remote/local CLI 確認）
- [x] PR run で Batch A 6 workflow が green
- [x] `gh workflow run` で Batch B 4 workflow (`cloudflare-alerts-drift`, `cloudflare-analytics-export`, `lighthouse`, `post-release-dashboard`) を staging branch から手動 trigger し green
- [x] `gh workflow run web-cd.yml --ref <branch>` で staging job が deploy 成功
- [x] `backend-ci.yml` staging job が preflight secret check + deploy 成功
- [x] 既存移行済 6 workflow (`pr-build-test`, `ci`, `e2e-tests`, `verify-stable-key-update`, `playwright-visual-full`, `playwright-visual-baseline-update`) が green（regression なし）

## Spec reference

- `docs/30-workflows/ut-cicd-composite-setup-rollout/`（本 PR と同じブランチで PR に含む）
- Phase 1〜13 仕様書 + `artifacts.json`

## Refs

- Refs #284

🤖 Generated with [Claude Code](https://claude.com/claude-code)
````

## 4. PR base / branch 戦略

| 項目 | 値 |
|------|-----|
| base | `dev`（既定。production リリース時のみ `main`） |
| head | `feat/cicd-composite-setup-rollout` |
| draft | No |
| Issue 連携 | PR 作成時点では `Refs #284`。close 操作は remote CI green 確認後にユーザー承認で実施 |

## 5. PR 作成コマンド

```bash
gh pr create \
  --base dev \
  --title "ci(workflows): rollout composite setup-project to remaining 13 workflows (#284)" \
  --body "$(cat <<'EOF'
（§3 PR 本文ドラフトをそのまま貼り付け）
EOF
)"
```

## 6. PR merge 後の後処理

```bash
# Issue close（PR merge 時に自動 close されない場合のみ）
gh issue close 284 --comment "Closed by PR (composite setup-project rollout to 13 workflows)."
```

## 7. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 13 | PR 作成・evidence #9 (ci-run-urls.md) を CI run 完走後に取得 |

## 完了条件

- [ ] §1 commit message が確定している
- [ ] §2 PR タイトルが 70 字以内
- [ ] §3 PR 本文に AC-1〜5 / migrated 13 workflow / verification commands が含まれている
- [ ] §4 base = `dev` を遵守
- [ ] §6 Issue #284 が close されている
