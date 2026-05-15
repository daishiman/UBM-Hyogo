# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 2 設計の GO/NO-GO 判定を行う Phase。コード差分そのものは Phase 6 で確定するため、本 Phase は spec 文書のみ。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解) |
| 状態 | completed |

## 目的

Phase 2 で固定した設計（dialog ローカル `useRouter` / 順序 refresh → onSubmitted → onClose / failure では refresh しない）を、不変条件・親 workflow 整合性・運用性の観点でレビューし、GO/NO-GO 判定する。

## 3-1. レビュー観点

| # | 観点 | チェック内容 | 期待値 |
| --- | --- | --- | --- |
| 1 | 既存 API endpoint 不変 | `apps/api/src/routes/` 配下に変更なし | 不変条件 1 充足 |
| 2 | OKLch token 無関係 | 色 / `tokens.css` / `bg-[#...]` の差分なし | 不変条件 3 充足 |
| 3 | D1 直接アクセス禁止 | `apps/web` から D1 binding 呼び出しなし | 不変条件 5 充足 |
| 4 | `apps/web` 限定 | `apps/api` への変更が設計に含まれない | 不変条件 4 充足 |
| 5 | テストファイル拡張子 | 新規テストが `*.spec.tsx` のみ | 不変条件 5 充足 |
| 6 | 呼び出し順序 | refresh → onSubmitted → onClose の固定 | 不変条件 6 充足 |
| 7 | server state 正本 | 楽観的 UI 採用なし | 不変条件 7 充足 |
| 8 | 既存テスト non-regression | 既存 7 ケース（TC-U-05〜08 / TC-A-02 / 409 / network error）が壊れない設計か | non-regression 担保 |
| 9 | failure path 設計 | refresh を呼ばない 4 branch の網羅 | CONDITIONAL 解消 |
| 10 | UI prototype alignment 整合 | プロトタイプ primitives / tokens / rhythm への影響なし | 親 workflow SCOPE 充足 |

## 3-2. GO/NO-GO 判定

| 観点 | 判定 | 補足 |
| --- | --- | --- |
| 1〜7 不変条件 | GO | Phase 2 で明示確認済み |
| 8 既存テスト | GO | success branch の挙動順序のみ変更。`onSubmitted` / `onClose` の呼び出しタイミングは保持される。既存 TC-U-08 (202 → onSubmitted + onClose) は引き続き green |
| 9 failure path | GO | Phase 2 表で 4 branch 明文化 |
| 10 親 workflow 整合 | GO | UI prototype alignment SCOPE.md の含むスコープ（profile 画面 client state 改善）に該当 |

→ **総合判定: GO**

## 3-3. リスク再確認

| リスク | 緩和策 | 残存リスク |
| --- | --- | --- |
| `useRouter` を 2 dialog で個別に呼ぶことで bundle 二重化 | Next.js が内部で hook を共有 | 無視可能 |
| `RequestActionPanel.tsx` の既存 `router.refresh()` と重複呼び出し | Phase 10 で dialog local refresh に一本化 | 余分な request 可能性を根拠なしに許容しない |
| mutation success だが server 側で別 actor が pending を取り消した場合 | refresh で最新 state を取得するため整合性は保たれる | 無視可能 |
| Playwright e2e で flaky | `aria-live="polite"` 要素を `waitFor` でアサートする方針を Phase 7 で明記 | 低い |

## 3-4. 申し送り事項

- Phase 4 タスク分解: 5 サブタスク（2 dialog 修正 / 2 spec 追加 / non-regression 確認）に分解
- Phase 7 テスト計画: `useRouter` mock 戦略を明確化（既存 RequestActionPanel.component.spec.tsx の mock を参考にする）
- Phase 10 リファクタ: `RequestActionPanel.tsx` の既存 `router.refresh()` を削除し、accepted response bridge state に再構成

## 実行タスク

- [ ] レビュー観点 10 件をチェック
- [ ] GO/NO-GO 判定を記録
- [ ] 残存リスク 4 件を再確認
- [ ] Phase 4/7/10 への申し送り事項を記録
- [ ] `outputs/phase-03/design-review.md` を作成

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | 設計レビュー結果（GO/NO-GO + 申し送り） |

## 完了条件

- [ ] 10 観点のチェック結果が記録されている
- [ ] GO 判定が明示されている
- [ ] Phase 4/7/10 への申し送りが記録されている
- [ ] `outputs/phase-03/design-review.md` が作成されている

## 次 Phase

- 次: 4 (タスク分解)
- 引き継ぎ事項: GO 判定 / 5 サブタスク分解前提 / non-regression 範囲
- ブロック条件: NO-GO の場合は Phase 2 に差し戻し
