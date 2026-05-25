# Phase 12: 未タスク検出

## 1. 本サイクルで完了した範囲

| # | 完了項目 | 根拠 |
|---|---------|------|
| C1 | `script-src` の nonce 化（`'self' 'nonce-<n>' 'strict-dynamic'`） | 元 issue の主目的 |
| C2 | `style-src` / `style-src-elem` の nonce 化 | 元 issue の style-src 対象 |
| C3 | 既存 `style={{...}}` を `style-src-attr` に分離する過渡境界の明文化 | 広範UIリファクタを避けつつ directive責務を分離 |
| C4 | literal unsafe-inline grep gate 0 hit | Phase 11 evidence |
| C5 | focused Vitest / middleware tests | Phase 11 evidence |
| C6 | aiworkflow-requirements 同期 | Phase 12 system-spec-update-summary |

## 2. 正当に user-gated として残す範囲

| 残境界 | 理由 |
|---------|------|
| CSP report-only → enforce 切替 | staging/production observation後の運用判断。nonce実装とは独立 |
| Playwright HTTP smoke execution | dev/server runtime orchestration が必要 |
| staging/production response verification | deploy/runtime observation が必要 |
| commit / push / PR | ユーザー明示承認が必要 |

## 3. 既存指示書との関係

`docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-002-csp-nonce-migration.md` は削除・改変しない。本 workflow が issue #871 / U-AWSHH-002 の local implementation canonical root となる。

## 4. 30種思考法レビュー追加検出（2026-05-24 追補）

| # | 検出項目 | 判定 | 対応 |
|---|---------|------|------|
| D1 | `style-src-attr 'unsafe-inline'` の将来撤去追跡が存在しない | 過渡境界の恒久化リスク。CONST_008 例外条件(1)=広範UIリファクタ独立スコープ に該当 | `docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-005-style-src-attr-retirement.md` を新規作成 |
| D2 | `apps/web/app/layout.tsx` が index.md スコープ表に含まれるが無変更 | Next.js 16 が request CSP header から nonce を自動抽出するため layout 改修は不要。実害なし | documentation-changelog.md に記載追加 |

## 5. 検出結果サマリ

D1 により unassigned-task 1 件を新規作成（`awshh-followup-005-style-src-attr-retirement.md`）。D2 は documentation のみで完結。残る user-gated 境界（staging/production verification / PR）は従来どおり Phase 13 承認後に実施。
