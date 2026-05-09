# Phase 13: PR 作成

> workflow: `e2e-quality-uplift-stage-1` / 起案日: 2026-05-09

## 1. PR メタ情報

| 項目 | 値 |
|------|----|
| base branch | `dev` |
| head branch | `feat/e2e-quality-uplift` |
| title 案 | `test(e2e): add critical regression assertions for public leak & profile sticky` |
| labels | `area/e2e`, `tier/standard` |
| reviewers | n/a（solo dev / required reviewers 0） |

## 2. depends-on 確認手順（Stage 0）

| 確認項目 | コマンド / 手段 | 期待 |
|---------|---------------|------|
| Stage 0 PR (#594) が `dev` にマージ済 | `gh pr view 594 --json mergedAt,baseRefName` | `mergedAt != null` かつ `baseRefName == "dev"` |
| `dev` の HEAD が unskip 済 spec を含む | `git fetch origin dev && git grep -n 'test.describe.skip' origin/dev -- 'apps/web/playwright/tests'` | unskip 済（`describe.skip` が対象 spec で残っていない） |
| 本ブランチが `dev` を取り込み済 | `git log --oneline dev..HEAD` および `git log --oneline HEAD..dev` | HEAD..dev が空 |

> いずれかが NG なら PR を作成しない。`dev` を取り込み直してから再実行する。

## 3. PR 作成前 checklist

| 項目 | 状態 |
|------|------|
| `git status --porcelain` 空 | — |
| `git diff dev...HEAD --name-only` が `apps/web/playwright/tests/{public-flow,profile-visibility-request,profile-delete-request}.spec.ts` と本 workflow doc のみ | — |
| `mise exec -- pnpm install --force` 成功 | — |
| `mise exec -- pnpm typecheck` green | — |
| `mise exec -- pnpm lint` green | — |
| `apps/api/**` および `apps/web/src/**` の diff 空 | — |
| `outputs/phase-11/` screenshot が PR 本文の参照と一致 | — |

## 4. PR 本文 template

```
## Summary
- public route で `responseEmail` / 任意 email リテラルが DOM に出力されないことを fixture-driven で assert（1a）
- `/profile` の visibility / delete request pending banner が、別 route への round-trip 後もサーバ正本（`GET /api/me` mock）由来で persist することを assert（1b）
- production code 変更ゼロ・spec のみ追加（CONST_007 単一サイクル）

## Scope
- `apps/web/playwright/tests/public-flow.spec.ts`
- `apps/web/playwright/tests/profile-visibility-request.spec.ts`
- `apps/web/playwright/tests/profile-delete-request.spec.ts`
- `docs/30-workflows/e2e-quality-uplift-stage-1/`

## depends-on
- Stage 0 (#594) merged into `dev`

## Test plan
- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] Playwright smoke job green（追加 3 test 含む）
- [ ] critical 5 route smoke 100% 維持

## Out of scope
- fixture seed 拡張、`signSession` 実署名、design token 改修、新規 endpoint
```

## 5. 本サイクル成果物 inventory

| 種別 | パス |
|------|------|
| spec 編集 | `apps/web/playwright/tests/public-flow.spec.ts` |
| spec 編集 | `apps/web/playwright/tests/profile-visibility-request.spec.ts` |
| spec 編集 | `apps/web/playwright/tests/profile-delete-request.spec.ts` |
| workflow doc | `docs/30-workflows/e2e-quality-uplift-stage-1/phase-{4..13}.md` |
| workflow doc | `docs/30-workflows/e2e-quality-uplift-stage-1/index.md`（status 更新） |

## 6. PR 作成コマンド（参考）

```bash
gh pr create --base dev --head feat/e2e-quality-uplift \
  --title "test(e2e): add critical regression assertions for public leak & profile sticky" \
  --body "$(cat <<'EOF'
（§4 PR 本文 template を参照）
EOF
)"
```

## 7. PR マージ後 follow-up

| 項目 | 担当 stage |
|------|-----------|
| Stage 2 着手 | phase-12 §4 未タスク U-1..U-3 を入力に新 workflow 起票 |
| `signSession` 実装 | 別 workflow（auth uplift） |
| lessons-learned 反映 | Stage 2 完了時にまとめて反映 |

## 8. 完了条件

- [ ] §3 checklist 全 OK
- [ ] §4 PR 本文が github 上で render 整合
- [ ] §2 depends-on 確認 OK
- [ ] CI green を確認したのち merge 可

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 13
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

