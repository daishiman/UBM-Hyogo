# Phase 12: ドキュメント

## 1. 概要

Issue #891（クローズ済、issue-827 の followup）が提案した `FieldKindZ` exhaustiveness guard を、現行コード状態に合わせて再設計し実装するワークフローのドキュメントである。本仕様のゴールは「`apps/web/src/lib/adapters/member-detail.ts` 上で `FieldKindZ` の全 kind を `KIND_ROUTE` で exhaustive に分類し、新 kind 追加時の分類漏れを `pnpm typecheck` と adapter unit test の両方で検出可能にする」こと。

## 2. 中学生レベル概念説明

このタスクは「会員プロフィール画面で、データの種類（kind）に応じて表示する／しないを決めるしくみ」をきちんと整える作業。

会員データには「短い文（shortText）」「長い文（paragraph）」「日付（date）」「URL」「同意フラグ（consent）」など色々な種類があり、種類ごとに「画面に出していい／出してはいけない」が変わる。今のコードはこの判定の表（分類表）を持っていないので、新しい種類が増えたとき何が起きるかわからない。

そこで「全部の種類について、どこに表示するか」を必ず書かないとプログラムがエラーで動かなくなる表を作る。これを `KIND_ROUTE` という。新しい種類が増えたときも、この表を更新し忘れたら CI が落ちて教えてくれるので、見落としによる事故が起きない。

## 3. アーキテクチャ概要

- adapter: `apps/web/src/lib/adapters/member-detail.ts`
- enum 正本: `packages/shared/src/zod/primitives.ts` の `FieldKindZ`
- consumer: `apps/web/src/components/public/MemberDetail.tsx` → `MemberDetailSections.tsx`
- 分類 3 種（`detail` / `links` / `excluded`）のうち、adapter は `detail` を `sections`、`links` を `linkSections` に分離する

## 4. 実装ガイド

詳細は `phase-05-implementation-guide.md` を参照。要点:

1. `KIND_ROUTE` を `as const satisfies Record<FieldKind, KindRoute>` で定義
2. `DETAIL_KINDS` / `LINK_KINDS` を `KIND_ROUTE` から導出
3. `normalizeField` を route set 共用にし、`sections` と `linkSections` を生成
4. `__testInternals` 経由で spec から `KIND_ROUTE` を検証
5. `MemberDetail` で `linkSections` を既存 `MemberLinks` へ渡す

## 5. テスト戦略

詳細は `phase-06-test-strategy.md`。新規 6 ケース（TC-EX-01〜06）と既存 8 ケースを green に維持する。`consent` / `system` / `unknown` は `sections` と `linkSections` の双方から除外されることを検証する。`KIND_ROUTE` の 1 key 削除実験は手動 typecheck で実証。

## 6. 品質ゲート

詳細は `phase-07-quality-gates.md`。Gate-A: 仕様レビュー、Gate-B: 実装レビュー、Gate-C: 外部運用（user-gated）。

## 7. 完了定義

詳細は `phase-08-definition-of-done.md`。typecheck / lint / 単体テスト / build / visual snapshot 確認の全 green を必須とする。

## 8. リスクと緩和

詳細は `phase-09-risks-and-mitigations.md`。`url` を `"links"` 分類することで公開 detail の KV row からは外れるが、同 cycle で `MemberLinks` へ接続するため公開リンク自体は失わない。

## 9. 関連リンク

- Issue: https://github.com/daishiman/UBM-Hyogo/issues/891 (CLOSED)
- 親仕様: `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/`
- 旧 followup 仕様: `docs/30-workflows/unassigned-task/issue-827-followup-001-displayable-kinds-exhaustiveness-guard.md`（本ワークフローで吸収。実装完了時に completed-tasks へ移動するか close 扱いとする）
- 関連ファイル:
  - `apps/web/src/lib/adapters/member-detail.ts`
  - `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`
  - `packages/shared/src/zod/primitives.ts`
  - `apps/web/src/components/public/MemberDetail.tsx`
  - `apps/web/src/components/public/MemberDetailSections.tsx`
