[実装区分: 実装仕様書]

# System Spec Update Summary

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| 採用方針 | Plan A — `getAuth()` lazy factory |
| 改訂日 | 2026-05-03 |

> Plan A の実コード変更と spec docs 追記は本サイクルで実施する。deploy・commit・push・PR は Phase 13 approval gate まで実行しない。

## Step 1-A: spec docs 直接更新

### 判定: UPDATE_REQUIRED（限定範囲）

| 対象 spec | 更新範囲 | 判定根拠 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/02-auth.md` | `getAuth()` lazy factory 経路への移行を 1 段落追記し、route handler 実装ガイドラインに `const { auth } = await getAuth()` / `const { handlers } = await getAuth()` / `const { signIn } = await getAuth()` パターンを明示 | next-auth の利用形態が「top-level import」から「lazy factory 経由」に変わるため認証 spec として明文化必須 |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | 影響なし確認のみ。シナリオ仕様（Magic Link / OAuth フロー）に変更なし | 利用者シナリオ・MVP 認証方針の意味論に変更なし |

### 02-auth.md 追記文面（draft）

> **route handler 実装ガイドライン（Plan A lazy factory）**: Next.js 16 + React 19 prerender 経路における `useContext` null 連鎖を回避するため、`apps/web/src/lib/auth.ts` は `getAuth()` lazy factory を export する。route handler / client は top-level の `next-auth` value import を行わず、必要時に `const { auth } = await getAuth()` / `const { handlers } = await getAuth()` / `const { signIn } = await getAuth()` で取得する。`oauth-client.ts` の `signIn` は `await import("next-auth/react")` の dynamic import 経由で取得する。

## Step 1-B: aiworkflow references / 関連 spec docs cross-reference

| ファイル | 必要性 | 結論 |
| --- | --- | --- |
| `apps/web/CLAUDE.md`（存在時） | 「auth.ts の top-level next-auth value import 禁止 / lazy factory 規約」を 1 節追記 | **追記候補（存在時必須）**。実存在は Phase 12 実走時 `ls apps/web/CLAUDE.md` で確認 |
| `.claude/skills/aiworkflow-requirements/references/` 配下の Web build / Next.js 関連 reference | LL-1 lessons-learned 候補として記録 | **追記候補（提案記録のみ）**。skill-feedback-report.md にて defer |
| `docs/00-getting-started-manual/specs/00-overview.md` のデプロイ章 | 本タスクは build 緑化のみで deploy フロー自体に変更なし | cross-reference 不要 |
| `docs/00-getting-started-manual/claude-code-config.md` | 設定ファイル / 権限への影響なし | 不要 |

## Step 1-C: 既存 system spec との conflict

### 結論: conflict なし

- `apps/web` (`@opennextjs/cloudflare` + Next.js App Router) の構成・スタック・パッケージ管理 (pnpm workspace) は CLAUDE.md / specs と完全整合
- `getAuth()` lazy factory 化は `02-auth.md` の現行設計（Auth.js + Google OAuth + Magic Link）の意味論を変えない（呼び出しタイミングのみ変更）
- middleware / `decodeAuthSessionJwt` 経路は据置で `13-mvp-auth.md` のシナリオ仕様に影響なし

## Step 2: 新規インターフェース追加判定

### 判定: 限定追加あり（公開 API シグネチャ 1 件）

- 新規追加: `apps/web/src/lib/auth.ts` の `export async function getAuth(): Promise<{ handlers; auth; signIn; signOut }>` 1 件
- 既存 export `handlers` / `auth` / `signIn` / `signOut` は仕様レベルで互換維持（Phase 5 設計に従う。既存呼び出し元は 4 route handler + oauth-client + middleware に限定的、いずれも本タスクで lazy factory 経由へ書き換え）
- D1 schema / API endpoint / IPC 契約 / shared package 型 / Auth.js callback signature は **変更ゼロ**
- stale contract withdrawal: 既存 top-level import 慣行を `02-auth.md` および `apps/web/CLAUDE.md` で明示的に「禁止」化

## root / outputs artifacts.json parity

root `artifacts.json` と `outputs/artifacts.json` は同じ status / metadata / phases / blocks を持つ。parity check は root と outputs の双方で実施する。

## まとめ

- spec docs 追記対象: 02-auth.md（lazy factory 段落）、apps/web/CLAUDE.md（存在時の規約追記）
- 13-mvp-auth.md は影響なし注記のみ
- 公開 API シグネチャ追加 1 件（`getAuth()`）。D1 / API / IPC / shared 変更ゼロ
- conflict なし
- 実 docs 編集 commit は Phase 13 PR にまとめて含める
