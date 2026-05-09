# Phase 13: PR 作成

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| Branch | `feat/e2e-quality-uplift` |
| Base | `dev` |
| 準拠 | `.claude/commands/ai/diff-to-pr.md` |

---

## 1. PR 作成手順（CLAUDE.md 自律フロー準拠）

| step | 操作 |
|------|------|
| 1 | `git fetch origin dev` → ローカル `dev` を fast-forward 同期 |
| 2 | 作業ブランチ `feat/e2e-quality-uplift` に戻り、`dev` を merge |
| 3 | コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」表に従い自律解消 |
| 4 | `pnpm install --force` / `pnpm typecheck` / `pnpm lint` を実行（最大 3 回自動修復） |
| 5 | `git status --porcelain` 空を確認 |
| 6 | `git diff dev...HEAD --name-only` で対象ファイル取得 |
| 7 | `gh pr create --base dev` で PR 作成 |

> **base = `dev`**（CLAUDE.md「既定ブランチは dev」+ MEMORY.md 既定方針）。

---

## 2. PR タイトル（70 文字以内）

```
test(e2e): admin mutation flow + contract for requests / identity-conflicts / member-delete
```

---

## 3. PR 本文テンプレ

```markdown
## Summary
- admin 4 routes の mutation flow を E2E でカバー（2a/2b/2c）
- UI ↔ API shape 同型性を contract test で機械検証（2d）
- cascade preview は API 未実装のため Stage 3 持越し

## Scope
- `apps/web/playwright/tests/admin-requests.spec.ts`（新規）
- `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（新規）
- `apps/web/playwright/tests/admin-member-delete.spec.ts`（新規）
- `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`（新規）

## Coverage / Critical Smoke
- line cov: >= 70%（standard tier）
- critical route smoke: admin 4 routes 100%

## Carryover (Stage 3)
- cascade preview API 実装 + 2c-2 有効化
- line cov 70% 未達時の追加 unit test
- `DeleteBodyZ` の `packages/shared` 移管

## Test plan
- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] `pnpm --filter @ubm-hyogo/api test` green
- [ ] `pnpm --filter @ubm-hyogo/web test:e2e` green
- [ ] manual evidence (4 screenshots) — see `outputs/phase-11/`

## Screenshots
（`outputs/phase-11/screenshots/` に画像がある場合のみ列挙）
- admin-requests-mutation.png
- admin-identity-conflicts-merge.png
- admin-member-delete.png
- admin-audit-after-delete.png
```

> Phase 11 で screenshot がない場合は **Screenshots セクションを削除**（CLAUDE.md ルール）。

---

## 4. PR 作成前チェック

| # | 項目 | 期待 |
|---|------|------|
| 1 | `git status --porcelain` 空 | OK |
| 2 | `git diff dev...HEAD --name-only` で 4 ファイル + docs 追加 | OK |
| 3 | implementation-guide.md の主要見出しが PR 本文に反映 | OK |
| 4 | screenshot 数と PR 本文の参照数が一致 | OK |
| 5 | scope 外ファイル変更なし | OK |

---

## 5. PR レビュー（solo dev ポリシー）

| 観点 | 設定 |
|------|------|
| required reviews | 0（CLAUDE.md branch 戦略） |
| required status checks | 全 CI gate（typecheck / lint / vitest / playwright / verify-design-tokens 等） |
| linear history | required |
| force-push | 禁止 |

---

## 6. 最終レポート（PR 作成後）

| 項目 | 内容 |
|------|------|
| PR URL | (実行時に記録) |
| 採用ブランチ | `feat/e2e-quality-uplift` → `dev` |
| 自動修復 | (実行時に記録) |
| 解消したコンフリクト | (実行時に記録) |
| 残課題 | Stage 3 持越し 3 件（phase-12 §5） |

---

## 7. Phase 13 完了定義

- [x] PR 手順が CLAUDE.md 自律フローに準拠
- [x] base = `dev` を明示
- [x] PR タイトル・本文テンプレ確定
- [x] 作成前チェック 5 件
- [x] solo dev レビューポリシー整合
- [x] 最終レポート様式

> Stage 2 spec 一式完了。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 13
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 2 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

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
