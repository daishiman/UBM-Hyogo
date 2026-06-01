# Phase 9: 品質保証

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL** / **workflow_state: implemented_local_evidence_captured**

## 1. QA スコープの前提

本タスクは `implemented_local_evidence_captured`（新規 integration spec 追加・focused Vitest / typecheck / lint 実行済み）。
よって本 Phase の QA 対象は「**仕様書の自己完結性**」「**検証コマンドの妥当性**」「**不変条件整合**」「**ローカル検証結果**」である。

## 2. line budget / mirror parity 観点

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| line budget（テストファイル肥大） | OK 見込み | TC は 5 ケース（TC-AVSC-01〜05）+ getAuthView 経路。spec 内 inline helper で連鎖を 1 箇所集約（Phase 8）するため、過大化しない |
| mirror parity（実装 ↔ テスト対称性） | OK 見込み | 実 `callbacks.session` 出力を mock せず連鎖させる設計（Phase 2 §2.3）により、実装側 contract とテスト側 assertion が 1:1 対応 |
| ファイル削除に伴う mirror 不整合（FB-UI-02-1） | 該当なし | 本タスクは新規追加のみでファイル削除なし。FB-UI-02-1（削除時の mirror 整合チェック）は非該当 |

## 3. 仕様書の自己完結性チェック

| 項目 | 結果 |
| --- | --- |
| 被テスト対象ファイルと役割が Phase 1 §3 に明記されているか | OK |
| 新規 spec の配置・命名・import が Phase 2 §2 で確定しているか | OK |
| TC（TC-AVSC-01〜05）が入力→期待 session.user→期待 AuthView で一意に書けているか | OK（Phase 2 §3） |
| AC-1〜6 が TC と対応づくか | OK（AC-1=TC-01 / AC-2=TC-02 / AC-3=TC-03 / AC-4=TC-04 / AC-5=regression / AC-6=TC-05 drift guard） |
| Cloudflare context / getAuth の mock 境界が明示されているか | OK（Phase 2 §5 責務境界テーブル） |

## 4. 検証コマンドの妥当性

本サイクルで実行する確定コマンド（Phase 2 §6 と一致）:

| 種別 | コマンド | 妥当性 |
| --- | --- | --- |
| focused vitest | `mise exec -- pnpm exec vitest run apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts apps/web/src/lib/auth.spec.ts` | 新規 spec + regression 保護対象 3 spec を同時実行。AC-5（既存緑維持）を直接検証可能 |
| 型 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | `SessionLike` / `AuthView` 型整合を確認 |
| lint | `mise exec -- pnpm lint` | `.integration.spec.ts` suffix（不変条件 #8）と import boundary を確認 |

## 5. 不変条件整合（#5 / #8 / #11）

| 不変条件 | 整合 | 根拠 |
| --- | --- | --- |
| #5（D1 直接アクセスを `apps/api` に閉じる） | OK | テストは `fetch` を `vi.fn()` stub し D1 へ触れない（Phase 2 §2.4 副作用なし） |
| #8（新規 test は `*.spec.{ts,tsx}` のみ） | OK | `authViewSessionContract.integration.spec.ts` は `.spec.ts` で終わる。`*.test.*` 不使用 |
| #11（認証境界 fail-closed） | OK | AC-3 / TC-AVSC-03 で `memberId` 欠落 → `guest` への fail-closed を pin。`getAuthView()` の catch fallback は AC-4 経路で確認 |

## 6. ローカル検証結果

- focused Vitest: 4 files / 61 tests PASS（`manual-test-result.md` に記録）
- typecheck: `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` exit 0
- lint: `mise exec -- pnpm lint` exit 0（stablekey warning 2 件は既存 warning mode）
- production code diff: なし。追加は `authViewSessionContract.integration.spec.ts` 1 件のみ。

## 完了条件（Phase 9）

- [x] line budget / mirror parity 観点を記録（FB-UI-02-1 非該当を明記）
- [x] 仕様書の自己完結性を確認
- [x] 検証コマンドの妥当性を確認
- [x] 不変条件 #5 / #8 / #11 整合を確認
- [x] lint/typecheck/vitest の PASS を記録
