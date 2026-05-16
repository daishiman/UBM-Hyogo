# Phase 3: - 設計レビュー（admin UI vs 静的 HTML 確定）

[実装区分: 実装仕様書 / Phase 03]

## 目的

Phase 02 の dashboard 描画 2 案について 4 条件 gate（価値性・実現性・整合性・運用性）で評価し、実装方針を**ここで確定**する。Phase 4 以降は決定結果に従う。

## 4 条件 gate

| 条件 | 候補 A: admin UI 組込 | 候補 B: 静的 HTML | 判定 |
| --- | --- | --- | --- |
| 価値性 (solo dev が継続観閲するか) | 既存 admin 動線で習慣化しやすい | 都度 git pull / open file 必要 | A |
| 実現性 (本サイクル内で完成可能か) | 既存 `apps/web/src/app/(admin)/admin/audit/` が無い場合 layout 構築必要 | HTML 1 ファイル + 自前 SVG で完結 | B |
| 整合性 (CLAUDE.md 不変条件) | OKLch トークン強制 / Auth.js 再利用 / D1 直接アクセスなし | 静的につき violation なし | 同点 |
| 運用性 (delete / rebuild の容易さ) | Cloudflare Workers deploy 必要 | git rm で消えるだけ | B |

**総合**: 本タスクの目的が「solo dev の継続観閲」かつ「外部 SaaS 依存禁止」「public 公開しない」であり、現 worktree に `apps/web/src/app/(admin)/admin/audit/` が存在しないため、**Phase 03 では候補 B: 静的 HTMLを採択する**。

候補 A（admin UI 組込）は、admin audit route が別タスクで実体化した後の将来候補とし、本サイクルでは作成しない。**確定理由を `outputs/phase-03/decision.md` に必ず記録する**。

## Phase 4 へ進む可否判定

以下すべてを満たすこと:

- [ ] 描画レイヤ確定（B: 静的 HTML）が `outputs/phase-03/decision.md` に記録されている
- [ ] 確定方針に応じた実装ファイルパスが index.md「実装ファイル一覧」と整合している
- [ ] OKLch トークン正本（`apps/web/src/styles/tokens.css`）の参照経路が確認できている（静的 HTML でも tokens 値を inline 化）
- [ ] 着手 Gate（Gate-PRECONDITION-PARENT-RUNTIME-SYNCED / Gate-PRECONDITION-OBSERVABILITY-NEED）が満たされている

## 出力

- `outputs/phase-03/main.md` — レビュー実施記録
- `outputs/phase-03/decision.md` — 描画レイヤ最終決定（A or B）と理由

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 状態 | spec_created |

## 実行タスク

- 本文の目的・手順・出力に従う。

## 参照資料

- `index.md`
- `artifacts.json`

## 成果物

- `outputs/phase-*` に定義された成果物。

## 完了条件

- [ ] 本 Phase の出力仕様が `artifacts.json` と一致している。

## 統合テスト連携

- 実装 Phase で指定された focused command と Phase 09 品質ゲートに接続する。
