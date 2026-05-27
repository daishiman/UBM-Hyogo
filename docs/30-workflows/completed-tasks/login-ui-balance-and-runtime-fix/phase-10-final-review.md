# Phase 10 — 最終レビュー

## 判定: Gate-A local pass / staging pending

## 受入条件チェック

| AC | 検証 | 状態 |
| -- | ---- | ------------ |
| AC-1 input/button バランス | Phase 11 visual + manual | pass_local（44px / 44px / 差分 0px） |
| AC-2 Google brand icon 4 色 | Phase 11 visual + DOM inspection | pass_local |
| AC-3 legacy `[data-size]` brand-icon 非影響 | CSS spec / visual | pass_local |
| AC-4 magic-link route の env 解決 | T-C-01..06 + grep gate | pass_local |
| AC-5 verify route 同方針 | T-C-04 系列 | pass_local |
| AC-6 `apps/web` 配下 `process.env.INTERNAL_API_BASE_URL` 0 件 | grep gate | pass_local |
| AC-7 staging `POST /api/auth/magic-link` 200/202 | Phase 11 staging smoke | pending |
| AC-8 typecheck / lint / spec 全 green | Phase 9 | focused specs pass_local / full suite not run |
| AC-9 visual baseline 差分が AC-1/AC-2 のみ | Phase 11 | local screenshot evidence captured / staging baseline pending |
| AC-10 prototype `index.html` が HTTP serve で 200 + UI 描画 | Phase 11 manual | pass_local |
| AC-11 CDN SRI 整合戦略適用済 | static grep + visual | pass_local |

## blocker 確認

| 項目 | 状態 |
| ---- | ---- |
| `apps/web/src/lib/env.ts` schema に `INTERNAL_API_BASE_URL` | 確認済み |
| `wrangler.toml` staging vars | 既存設定確認済（CLAUDE.md 抜粋） |
| playwright baseline 更新権限 | staging baseline は user-gated |
| staging deploy 権限 | user-gated |

## レビュー結論

- 実装スコープは Phase 1〜2 で固定済み。
- local visual evidence、focused route specs、grep gate、prototype MIME/browser capture は pass。
- staging deploy 後の `/login` visual capture と magic-link staging smoke は user-gated のため、Gate-B full pass は保留する。
