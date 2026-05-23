# Phase 8: リファクタ

## 方針

**本タスクではリファクタを行わない。**

## 理由

- 変更は file rename + function 名変更のみで、振る舞いを保つことが第一義
- middleware.ts のロジック（SESSION_COOKIE_NAMES、helper 関数群、guardedMiddleware）は既に整理されており、近接タスク（05a, 06b）でレビュー済み
- proxy.ts に rename したタイミングで helper 切り出し・hook 化を行うと差分が肥大化し、振る舞い変更との切り分けが困難になる

## 非目標（未タスク化しない）

以下は今回の受入条件を満たすための不足ではないため、未タスク化しない:

- `apps/web/proxy.ts` の helper 関数群（`buildAdminLoginRedirect` / `buildProfileLoginRedirect` / `sessionToken` / `authSecret`）を `apps/web/src/lib/proxy/` 配下に抽出
- session cookie 名 array を `@ubm-hyogo/shared` に集約

これらを同時に行うと rename の安全確認と責務抽出が混ざる。今回のエレガント解は、deprecated convention の解消と gate 振る舞い保持だけに閉じること。

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 8 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

rename と責務抽出を混ぜず、今回の変更を最小で保つ。

## 実行タスク

- リファクタを行わない判断を明記する。
- helper extraction を未タスク化しない理由を明記する。
- 差分肥大化を避ける。

## 参照資料

- Phase 2 設計。
- Phase 3 代替案検討。

## 成果物

- 本 Phase 8 リファクタ方針。

## 完了条件

- 実装 wave で rename 以外の責務変更が混入しない。
- 未タスク送りが発生していない。

## 統合テスト連携

リファクタなしのため追加統合テストは不要。Phase 6 / 9 / 11 の parity 検証で十分とする。
