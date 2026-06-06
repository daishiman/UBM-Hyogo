# Phase 10: 最終レビュー

## 目的

AC-1〜AC-8 の受入判定を行い、consumer side（`/profile` page）まで主因が解消されているかを確認する。
MINOR 指摘・未タスク候補を明示し、Phase 13（PR）へ進めるかを判定する。

## 受入判定（AC-1〜AC-8）

| AC | 内容 | lane | 検証手段 | 判定根拠 |
|----|------|------|---------|---------|
| AC-1 | staging/production で `fetchAuthed` が `API_SERVICE` binding 経由で `/me` 200（loopback 404 解消） | A | unit（TC-B1 binding 優先・RG-2 plain fetch 不使用）+ staging smoke（user-gated） | source-level は unit で確定。runtime 実証は Phase 13 smoke |
| AC-2 | me/admin/magic-link/verify/gate-state/verify-magic-link が binding 優先 | A | unit（TC-C2 + 各 route spec）+ grep（`FALLBACK_INTERNAL_API`/`LOCAL_DEV_FALLBACK` 消滅） | 6 経路すべて transport 経由・定数消滅で確認 |
| AC-3 | localhost/127.0.0.1 到達は local のみ・非 local は throw（fail-closed） | A,B | unit（TC-A5/FC-1/FC-2/FC-3 throw + TC-A4 local fallback）+ transport.ts grep | silent localhost 禁止を unit で固定 |
| AC-4 | client が参照する base URL は `NEXT_PUBLIC_API_BASE_URL`・bundle に `localhost:8787` 不在 | B | bundle grep（Phase 9 Q7）+ unit（TC-D1 NEXT_PUBLIC 優先） | bundle grep 0 件で確定 |
| AC-5 | grep gate が `:8888` だけでなく `:8787`/localhost を検出 | C | self-test（GT-1/GT-2）+ CI job 登録 | gate 検出範囲拡張を self-test で確認 |
| AC-6 | AUTH_SECRET parity 診断が presence 欠落を非 0 報告・投入は user-gated | C | `diagnose` exit1 経路 + `cf-secret-put` user-gated 表 | presence-only 出力（L-AUTHSECRET-001 遵守） |
| AC-7 | staging smoke が `/me` 200 + `/profile` 認証描画を検証・401 検出 | C | 引数/env バリデーション unit + user-gated 実走 | source 確定・実走は Phase 13 |
| AC-8 | typecheck/lint/対象 vitest/verify-pr-ready 全緑 | A,B,C | Phase 9 Q1-Q9 | 一括判定で確定 |

## consumer side（`/profile`）まで通っているかの確認

- `/profile`（server component / force-dynamic）→ `fetchAuthed<MeSessionResponse>("/me")` が主経路（Phase 1 §S2 因果チェーン）。
- AC-1（fetchAuthed binding 化）により loopback 404 が解消 → `safeServerFetch` が 200 を受領 → `MEMBER_SESSION_404` 分岐（page.tsx:53-63「セッション情報を取得できませんでした」+再ログイン CTA）に**到達しなくなる**ことを確認。
- **判定**: source-level では「fetchAuthed → transport binding → 200」が unit で確定。consumer page の UI コードは変更しない（NON_VISUAL）。`/profile` の実描画復旧（エラーカード → 実コンテンツ）の VISUAL_ON_EXECUTION 証跡は **Phase 13 の staging smoke（user-gated）で取得**する。
- 副経路（client component が public API を叩く / SSG 評価）は Lane B（NEXT_PUBLIC 統一）で localhost fallback を根絶。

## MINOR 指摘 / 未タスク候補

| # | 指摘 | 区分 | 扱い |
|---|------|------|------|
| M-1 | `PUBLIC_API_BASE_URL`（非 inline）を env schema / wrangler.toml から完全削除 | MINOR | **未タスク候補**。本サイクルは後方互換で残置（Phase 3 決定・drift リスク回避）。consumer 全走査が必要なため別タスク化が妥当 |
| M-2 | `verify-no-localhost-bake` を dev/main の required status check に登録（`gh api -X PUT`） | MINOR | **user-gated・別途**。read-only before JSON は取得可。governance 変更は CLAUDE.md ブランチ戦略に従い user 承認後 |
| M-3 | auth route 3 本の `selectTransport` 共通モジュール化 | MINOR | 過剰抽象回避のため見送り（Phase 8 §やらないリファクタ）。未タスク化不要 |

> 上記のうち **M-1 / M-2 が未タスク候補**（2 件）。M-1 は env schema 削除タスク、M-2 は branch protection 登録（user-gated）。
> いずれも本 workflow の AC-1〜AC-8 達成には不要（恒久解消は本サイクルで完結）。Phase 12 detection で正式に未タスク判定する。

## 判定

- AC-1〜AC-8 が source-level で達成見込み（runtime 実証 AC-1/AC-7 は Phase 13 staging smoke で user-gated 確定）。
- consumer `/profile` の主因（loopback 404）は fetchAuthed binding 化で解消。
- 未タスク候補 2 件（M-1 / M-2）は本 workflow スコープ外で別追跡。
- **Phase 13（PR 作成・user-gated）へ進行可（GO）。**
