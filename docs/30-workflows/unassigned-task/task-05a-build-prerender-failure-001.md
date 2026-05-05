# 05a follow-up: apps/web build prerender failure (Next 16 + React 19)

## メタ情報

```yaml
issue_number: 385
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-05a-build-prerender-failure-001 |
| タスク名 | apps/web build 失敗 (`/_global-error` / `/_not-found` prerender で useContext null) の解消 |
| 分類 | bug-fix / infrastructure |
| 対象機能 | apps/web build pipeline |
| 優先度 | **Highest** |
| ステータス | 未実施 |
| 発見元 | `ut-05a-followup-google-oauth-completion` Phase 11 Stage B build |
| 発見日 | 2026-05-01 |
| 関連Issue | https://github.com/daishiman/UBM-Hyogo/issues/385 |
| 関連PR候補 | #271 (next-auth 5.0.0-beta.25 → beta.30) |

## 背景

`pnpm --filter web build` および `pnpm --filter web build:cloudflare` が `/_global-error/page` の prerender で `TypeError: Cannot read properties of null (reading 'useContext')` を出して fail する。`NODE_ENV=production` を明示すると `/_global-error` の代わりに `/_not-found` で同エラーになるため、Next.js が auto-generate する error / not-found page 全般の SSG 互換問題。**main HEAD (`ff0bf6bc`) でも再現** するため P11 で混入したものではなく pre-existing。

build が通らないため、Phase 11 で準備済みの以下 HIGH 修正を staging / production に反映できない:

- `apps/web/src/lib/fetch/public.ts` の service-binding 経路書き換え（P11-PRD-003）
- `apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx` の暫定実装（P11-PRD-004）
- `apps/web/wrangler.toml` の `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` 追加

## 目的

`apps/web` の本番ビルドを通し、staging / production deploy を再開できる状態にする。

## スコープ

含む:

- `/_global-error` / `/_not-found` prerender が成功する build の復旧
- Next.js / React / @opennextjs/cloudflare のバージョン整合性確認
- `app/error.tsx` / `app/global-error.tsx` / `app/not-found.tsx` の Next 16 互換実装
- 解消後の staging redeploy で P11-PRD-003 / P11-PRD-004 の verification

含まない:

- /privacy /terms の本番文面確定（別タスク）
- next-auth signin/error UI の刷新

## 受け入れ条件

- `mise exec -- pnpm --filter web build` が exit 0 で完了する
- `mise exec -- pnpm --filter web build:cloudflare` が exit 0 で完了する
- `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` が成功する
- staging で `/`, `/privacy`, `/terms` が 200 を返す
- regression 無し: `/login`, `/register`, `/api/auth/*`, `/admin → /login` redirect

## 試行履歴 (2026-05-01)

すべて同じ `useContext` null エラー継続:

1. `app/global-error.tsx` 追加（full / minimal client component）
2. `NODE_ENV=production` 明示 → `/_not-found` で同エラー
3. `app/error.tsx` から `useEffect` 除去
4. `pnpm build:cloudflare` 経由（OpenNext path）
5. `git stash --include-untracked` で main HEAD 状態に戻して build → 同じく失敗（pre-existing 確認）

## 次アクション候補

- (a) Next.js を `16.2.5+` にアップグレードして同系問題の patch を確認
- (b) React を `19.2.4` 等にダウングレードして SSG 互換確認
- (c) `next.config.ts` で prerender 関連 experimental flag (例: error page prerender skip) を opt-out
- (d) `app/error.tsx` の `"use client"` 一時撤廃（RSC 化）
- (e) **PR #271 (next-auth beta.30) との関連検証** — beta.29 で `providerMap iterator` の key prop 修正 (nextauthjs/next-auth#13023) が入っており、build 中に大量に出る "unique key prop" 警告と表面的に類似

## 環境

- next: `16.2.4`
- react: `19.2.5`
- react-dom: `19.2.5`
- @opennextjs/cloudflare: `1.19.4`

## 関連

- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-002`
- GitHub Issue #385
- PR #271 (next-auth bump)

## 苦戦箇所【記入必須】

- 対象:
  - `apps/web/app/global-error.tsx`（新規追加したが効果なし）
  - `apps/web/app/error.tsx`（`useEffect` 除去試行済）
  - `apps/web/package.json`（next 16.2.4 / react 19.2.5 / @opennextjs/cloudflare 1.19.4）
- 症状: `pnpm --filter web build` が `/_global-error/page` の prerender で `TypeError: Cannot read properties of null (reading 'useContext')` を返す。`NODE_ENV=production` 明示時は `/_not-found` で同種エラー。`git stash --include-untracked` で main HEAD (`ff0bf6bc`) に戻しても再現するため pre-existing
- 参照:
  - 既存「試行履歴 (2026-05-01)」セクションの 5 試行
  - 既存「次アクション候補」セクションの (a)〜(e)
  - GitHub Issue #385
  - PR #271 (next-auth 5.0.0-beta.25 → beta.30)
  - `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-002`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| Next.js / React のバージョンアップで他依存（next-auth beta, @opennextjs/cloudflare）と非互換が発生 | 高 | upgrade は単独 PR で feature ブランチ検証し、CI typecheck / build / e2e を gate にする |
| 一時 workaround（experimental flag / RSC 化）が production 挙動を変える | 中 | flag 切替時は staging で `/`, `/login`, `/admin → /login`, `/api/auth/*` の regression matrix を実行 |
| build 解消が遅延し依存タスク (`task-05a-fetchpublic-service-binding-001`, `task-05a-privacy-terms-pages-001`) の deploy が止まる | 高 | 依存タスクは「前提: build-prerender-failure-001 完了」として明示済。本タスクを最優先で着手 |
| pre-existing のため main 戻しでも再現する性質 | 中 | 切り分けは「next-auth beta バージョン」「next/react マイナー」「app/error 系ファイル」の3軸で分割し、各単独で再現性を検証 |

## 検証方法

- 実行コマンド:
  - `mise exec -- pnpm --filter web build`
  - `mise exec -- pnpm --filter web build:cloudflare`
  - `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/` / `/privacy` / `/terms` / `/login`
- 期待結果:
  - `pnpm --filter web build` が exit 0
  - `build:cloudflare` が exit 0、`.open-next` artifact が生成される
  - staging deploy が成功し `/` `/privacy` `/terms` `/login` がいずれも 200
  - `/admin` は未認証時 `/login` へ redirect
- 失敗時の切り分け:
  1. 同じ `useContext` null が出る → 「次アクション候補」(a)→(b)→(c)→(d)→(e) の順に単独で試行し、各回で build log の stack trace を保存
  2. `/_not-found` のみ失敗する場合 → `app/not-found.tsx` を明示追加して RSC 互換に統一
  3. deploy 後 5xx → `wrangler tail --env staging` で runtime stack を取得し、build とは別問題として切り分け
