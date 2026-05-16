# Phase 13 — PR 作成（user approval gate）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | serial-05-step-02-identity-conflicts-merge |
| 実装区分 | **実装仕様書** |
| PR base ブランチ | `dev` |
| 初期状態 | **blocked**（user 明示承認まで commit / push / PR 禁止） |

## 1. 目的

実装・VISUAL evidence・Phase 12 strict 7 が揃った後、ユーザー明示承認のもとで
`dev` 宛 PR を作成する。現時点の仕様書では PASS 済みチェックを固定表示しない。

## 2. user approval gate

| # | ゲート | 通過条件 | 実行可否 |
| --- | --- | --- | --- |
| G1 | change-summary 提示 | `outputs/phase-13/change-summary.md` を user に提示 | ここまでは可 |
| G2 | user 明示承認 | 「PR 作成承認」等の明示文言 | 承認まで commit / push / PR 禁止 |
| G3 | local check | `pnpm typecheck` / `pnpm lint` / focused test / smoke green | G2 後のみ |
| G4 | PR 作成 | `gh pr create --base dev` | G3 後のみ |

## 3. change-summary.md 必須内容

- 変更概要: 既存 `IdentityConflictRow` の merge / dismiss UI hardening
- 含めるファイル:
  - `apps/web/src/components/admin/IdentityConflictRow.tsx`
  - `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`
  - `docs/30-workflows/serial-05-step-02-identity-conflicts-merge/`
- 含めないファイル:
  - `apps/api/`（API は既存 contract を利用）
  - D1 migration（schema 変更なし）
- Phase 11 screenshot evidence:
  - `02-inline-confirm-open.png`
  - `04-success-toast.png`
  - `05-error-409.png`
  - `06-error-400.png`
- PR base: `dev`

## 4. local check

```bash
pnpm typecheck
pnpm lint
pnpm --filter @ubm-hyogo/web test -- IdentityConflictRow.spec.tsx
pnpm --filter @ubm-hyogo/web e2e:smoke
pnpm verify:tokens
git status --short
git diff --stat
```

## 5. PR body テンプレ

PR body では実測後にのみ checked marker を付ける。未実行の状態で PASS 表記を先置きしない。

```markdown
## Summary

- Harden existing admin identity-conflicts merge / dismiss row UI.
- Reuse `useAdminMutation`; keep `page.tsx` as a server component.
- Keep API and D1 schema unchanged.

## Test plan

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm --filter @ubm-hyogo/web test -- IdentityConflictRow.spec.tsx`
- [ ] `pnpm --filter @ubm-hyogo/web e2e:smoke`
- [ ] `pnpm verify:tokens`
```

## 6. 成果物

```
outputs/phase-13/
├── change-summary.md
├── local-check-result.md
├── pr-creation-result.md
└── pr-info.md
```

## 7. 完了条件

- [ ] user 明示承認前に commit / push / PR を実行していない
- [ ] `local-check-result.md` に command / exit code を記録
- [ ] `gh pr create --base dev` を使用
- [ ] `pr-info.md` に PR URL / CI 結果を記録

## 8. 次

PR 作成は user 明示承認後にのみ実施する。
