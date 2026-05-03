# Lessons Learned: 05a Auth UI Logout Button（2026-05）

## L-05A-LO-001: SignOutButton は単一 client component に集約し、配置側は子要素として再利用する

`signOut({ redirectTo: "/login" })` を `MemberHeader` / `(member)/layout` / `/profile` / `AdminSidebar` の 4 配置に直書きすると、`callbackUrl` / `redirectTo` の Auth.js v5 移行時に複数箇所を同期更新する必要が出る。`apps/web/src/components/auth/SignOutButton.tsx` に Auth.js client 呼び出しを唯一の箇所として集約し、`className` / `label` / `redirectTo` だけ props 上書きを許す。配置側は `<SignOutButton />` を貼るだけにする。

## L-05A-LO-002: `redirectTo`（v5）と `callbackUrl`（v4）を取り違えない

Auth.js v5 では `signOut({ redirectTo })` が正、`callbackUrl` は v4 由来の deprecated alias。Phase 12 review で v4 表記が混入していると気付かないまま runtime に出る。client / unit test / manual spec / discoverability の 4 面で `redirectTo` 表記を統一し、`callbackUrl` は grep で残らない状態を作る。

## L-05A-LO-003: `/profile` は `(member)` route group 外なので `MemberHeader` 二重描画は構造的に発生しない

`apps/web/app/profile/page.tsx` は `(member)` route group の外側に配置されているため、`(member)/layout.tsx` が `MemberHeader` を描画しても `/profile` ページには適用されない。したがって `page.tsx` 側で `MemberHeader` を直接埋め込んでも二重描画にならない。逆に `(member)` 配下に `/profile` を移動した場合は `page.tsx` から `MemberHeader` を外さないと二重描画になるため、route 配置とヘッダ描画責務をペアで判断する。

## L-05A-LO-004: VISUAL_ON_EXECUTION の M-08 は upstream OAuth runtime に依存させ、placeholder のまま PASS と書かない

ログアウト UI 自体は code / unit / typecheck で local PASS まで到達できるが、OAuth visual smoke / cookie / session 無効化 evidence は authenticated browser session が必要で、本 cycle では取得できない。M-08 を `linked` / `completed` に進める条件を「Phase 11 で実 screenshot を取得 + cookie 無効化を確認」と明記し、`runtime-evidence-blocked` のまま `phase12-task-spec-compliance-check.md` の compliance を PASS にしない。Phase 13 screenshot filename（`before-signout-profile.png` / `before-signout-admin.png` / `after-signout.png`）は Phase 11 と整合させ、未取得時は PR 本文の screenshot 節を作らない。

## L-05A-LO-005: 昇格した unassigned stub は完了前なら consumed 中間状態として残す

`unassigned-task/task-05a-auth-ui-logout-button-001.md` は workflow root（`ut-05a-auth-ui-logout-button-001/`）で consumed されているが、`workflow_state=implemented-local-runtime-evidence-blocked` で Phase 11 が `pending_execution` のため、`completed-tasks/` への移動は早い。stub には canonical workflow root と current state を明示し、完全 completed まで `unassigned-task/` 配下に置く（04b-RQ-004 の「consumed として同期」を中間状態にも適用）。
