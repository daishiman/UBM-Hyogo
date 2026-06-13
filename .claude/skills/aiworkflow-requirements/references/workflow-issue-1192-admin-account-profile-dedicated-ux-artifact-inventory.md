# Workflow Artifact Inventory — issue-1192-admin-account-profile-dedicated-ux

## Summary

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1192-admin-account-profile-dedicated-ux/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL` |
| issue | #1192 CLOSED 維持。PR 文脈は `Refs #1192` のみ |
| purpose | 管理者アカウントが `/profile` を開いたとき、member プロフィールを維持したまま `/admin` への補助導線を表示する |
| user gate | staging authenticated screenshot, commit, push, PR, Issue mutation |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx` | 管理者向け案内カード。`SectionCard` + `ButtonLink` の既存 primitives のみ使用 |
| `apps/web/app/(member)/profile/page.tsx` | `me.user.isAdmin` true のときのみ `AdminAccessNotice` を認証成功描画へ挿入 |
| `apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` | 見出し、本文、`/admin` link、primitive data 属性を検証 |
| `apps/web/app/(member)/profile/page.spec.tsx` | admin / non-admin の page-level 条件描画を検証 |

## Evidence

| Command | Result |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/(member)/profile/page.spec.tsx apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` | PASS。targeted Vitest PASS: 2 files / 15 tests |
| `git diff --name-only -- apps/api packages` | 変更なし |

## Invariants

- 新規 API endpoint / response contract / D1 schema / migration / Google Form schema / secret は追加・変更しない。
- 認証・管理者判定の所有権は既存 `/me` response の `isAdmin` に留め、apps/web に新規 auth 判定を持ち込まない。
- 非管理者 `/profile` と `/me` / `/me/profile` degrade 分岐は既存挙動を維持する。
- Styling は既存 `SectionCard` / `ButtonLink` の tokenized primitive のみを使い、新規 CSS / token / HEX を追加しない。

## Lessons Learned

- **L-I1192-001（調査待ち blocker はコード構造で代替確定できる）**: Issue が D1 read-only 確認待ちとしていても、`resolveSession` の session 発行条件のような到達可能性を保証する現行コードがあれば、データ確認待ちを解除して採用分岐を確定できる。
- **L-I1192-002（管理者補助導線は auth 境界へ戻さず UI 表現層で閉じる）**: `/me` が既に `isAdmin` を返している場合、追加 UX は apps/web の条件描画 1 箇所に閉じる。apps/api / D1 / session guard に触れないことで fail-closed 境界を保てる。
