**[実装区分: 実装仕様書]**

# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| status | pending（PR 作成は user 明示承認後のみ） |
| base ブランチ | `dev` |
| 作業ブランチ | feat/admin-sidebar-collapsed-icon-spacing-parity |
| gate | Gate-C（external_ops・user-gated） |

> PR 作成（`gh pr create`）と staging visual smoke は user 明示承認後のみ実行する。
> 本タスクは実装仕様書のため、コード実装・commit・PR 作成は本 Phase の承認まで実行しない。

## 目的

実装差分（`SidebarNavItem.tsx:35` / `SidebarShell.tsx:36` の collapsed icon-box className を
`h-[18px] w-10` へ統一 + `SidebarNavItem.spec.tsx` の collapsed icon-box 回帰更新）を、
base `dev` への PR としてまとめ、Phase 11 視覚証跡と Phase 12 implementation-guide を
反映した PR 本文を作成する。

## 実行タスク

1. pre-flight（4 コマンド）を実行する。
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
2. 実装差分（`SidebarNavItem.tsx:35` / `SidebarShell.tsx:36` の className + `SidebarNavItem.spec.tsx` の
   collapsed icon-box 回帰更新）がすべてコミット済みであることを `git status --porcelain` で確認する。
3. `git diff dev...HEAD --name-only` で PR に含まれるファイル一覧を取得し、漏れなし確認とする。
4. Phase 11 screenshot（`sidebar-collapsed-before.png` / `sidebar-collapsed-after.png` /
   `sidebar-expanded-reference.png` / `sidebar-collapsed-after-footer.png`）が
   `outputs/phase-11/screenshots/` に取得済みなら PR 本文に参照を含める。
5. `implementation-guide.md` の主要見出し（真因・className diff・ピッチ計算・検証コマンド・OOS）を
   PR 本文に反映する。
6. `gh pr create --base dev` で PR を作成する（production リリースではないため `--base dev`）。

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `.claude/commands/ai/diff-to-pr.md` | PR 本文の Phase 13 仕様 |
| `outputs/phase-12/implementation-guide.md` | PR 本文に反映する実装要約 |
| `outputs/phase-11/phase-11.md` | 視覚証跡 canonical 命名と取得手順 |
| `outputs/phase-11/screenshots/` | PR 本文に添付する screenshot（取得済みの場合のみ） |

## 実行手順

1. base `dev` を `origin/dev` に同期し、作業ブランチへ取り込む（コンフリクトは表現層のみのため軽微）。
2. 上記「実行タスク」1〜6 を順に実行する。
3. PR 本文には真因・className diff・ピッチ計算・検証コマンド・OOS（OOS-1 SidebarBrand 箱 / OOS-2 SidebarUserMenu アバター箱）を含める。
4. screenshot 取得済みなら canonical 4名を本文に参照する。未取得ならスクリーンショット節は作らない。

## 完了条件

- [ ] pre-flight 4 コマンドがすべて PASS（user 承認後に実行）
- [ ] `git status --porcelain` が空（未コミット差分なし）
- [ ] `git diff dev...HEAD --name-only` で PR 対象ファイル一覧を取得済み
- [ ] PR 本文に implementation-guide の主要見出しを反映
- [ ] Phase 11 screenshot 取得済みなら本文に参照（未取得なら専用節を作らない）
- [ ] `gh pr create --base dev` で PR 作成（user 明示承認後のみ）

## user-gated 境界

- PR 作成（`gh pr create`）は user 明示承認後のみ。
- staging visual smoke（collapsed/expanded ピッチ目視）も user-gated（Gate-C）。
- 本タスクは実装仕様書のため、コード実装・commit・PR 作成は本 Phase の承認まで実行しない。
