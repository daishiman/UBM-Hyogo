# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 10 / 13 |
| 実装区分 | 実装仕様書 |
| workflow_state | implemented_local_evidence_captured |
| 前提 | Phase 1-9 完了 |
| 最終ゲート判定 | **PASS** |

## 目的

Task A（公開状態 backfill 管理 UI）の AC-A1..A4 充足、親 AC-G2 / AC-G3 充足、NO-GO 条件の再掲を行い、
最終ゲート判定を確定する。

## 1. AC-A1..A4 充足マッピング

| AC | 内容 | 実装箇所 | テストケース | 判定 |
|----|------|----------|-------------|------|
| AC-A1 | dry-run で `scanned/candidates/skipped` 内訳を確認（DB 無変更） | `BackfillPublishStatePanel.client.tsx`（`run("dryRun")` → `?dryRun=true`、`resultRows` + `<dl>` 描画） | TC-A1 | PASS |
| AC-A2 | apply で同意済み×member_only を public 昇格、`applied` 件数表示 | 同上（`run("apply")` → `?dryRun=false`、`onApplied`、`applied` 行描画） | TC-A2 / TC-A2b / TC-A2c / TC-A7 | PASS |
| AC-A3 | admin override / is_deleted を尊重しスキップ、`skipped.*` 可視化 | 同上（`resultRows` の `skipped.{alreadyPublic,adminExplicit,consentNotMet,deleted}` 4 行） | TC-A3 | PASS |
| AC-A4 | mutation は `@/features/admin/hooks/useAdminMutation` 経由 | `import { useAdminMutation } from "../../hooks/useAdminMutation"` | TC-A4（pending disabled で hook 経路を間接検証） | PASS |

### 補助ガードの充足

| ガード | 実装 | テスト |
|--------|------|--------|
| dry-run 先行必須 | `canApply`（mode==="dryRun" && dryRun && candidates>0） | TC-A2b |
| confirm 確認 | `globalThis.confirm(...)` キャンセルで no-op | TC-A2c |
| 二重起動防止 | `isSubmittingRef` + 両ボタン `disabled={mutation.isLoading}` | TC-A4 |
| HTTP error 分離 | `mutation.error` → `role="alert"`、結果非描画 | TC-A5 |
| schema mismatch 分離 | `safeParse` 失敗 → `parseError`、結果非描画 | TC-A6 |

## 2. 親 AC-G2 / AC-G3 充足

| 親 AC | 内容 | 判定 | 根拠 |
|-------|------|------|------|
| AC-G2 | 新規 D1 migration / Google Form schema / cron 間隔変更を含まない（endpoint/D1/Form 不変） | PASS | 変更対象は web のみ（`backfill.ts` / panel / page mount / 2 spec）。`apps/api` 差分 0。migration / Form schema 無変更 |
| AC-G3 | 1 サイクル内完結（先送り無し、CONST_007） | PASS | schema + panel + mount + 2 spec を 1 サイクルで完結。後続 Phase へ実装を先送りしない。Task A 単独で landed（#1064） |

## 3. NO-GO 条件（実行時依存の再掲）

| 条件 | 内容 | 状態 |
|------|------|------|
| NO-GO-1 | proxy（`apps/web/app/api/admin/[...path]/route.ts`）が `Authorization: Bearer ${SYNC_ADMIN_TOKEN}` を server-only 注入していない場合、ブラウザ素 fetch は backfill endpoint で 401 となり到達不能 | **実行時依存**。Authorization 注入は **Task B に 1 箇所集約**済み。本タスクは proxy を変更しない |

- 本タスク（Task A）の静的成果物（schema / panel / mount / spec）は Task B の proxy 注入状態に依存せず green（jsdom テストは fetch をモック）。
- runtime（staging）での実行は proxy 注入完了が前提。Task B 未完なら staging で 401 到達不能となるため、runtime evidence は Task B 完了後の staging で取得する（Phase 11 で pending として明記）。

## 4. 不変条件最終確認

| # | 不変条件 | 判定 |
|---|---------|------|
| #5 | D1 直接アクセス禁止（web から binding なし） | PASS |
| #10 | useAdminMutation（`@/features/admin/hooks/`）経由 | PASS |
| §2 | OKLch トークン正本（HEX / inline style 禁止） | PASS |
| §3 / #9 | 新規 primitive を生やさない / `<input>` を増やさない | PASS |
| #8 | 新規 test は `*.spec.{ts,tsx}` のみ | PASS |

## 5. 最終ゲート判定

| ゲート | 判定 |
|--------|------|
| AC-A1..A4 全充足 | PASS |
| 親 AC-G2 / AC-G3 充足 | PASS |
| 不変条件 #5/#10/§2/§3/#8/#9 | PASS |
| Phase 9 品質（typecheck/lint/test/coverage） | PASS |
| NO-GO 条件 | 実行時依存（Task B proxy 注入）を明記。静的成果物は green |
| **総合** | **PASS**（Phase 11 へ進行可） |

## 参照資料

| 参照 | パス |
|------|------|
| 依存 Phase 1 成果物 | `./phase-1.md` |
| 親 AC | `../task-member-publish-recovery-form-ops-and-admin-link/phase-1.md`（AC-A1..A4 / AC-G2 / AC-G3） |
| 要件 | `./phase-1.md`（AC-1..AC-4 / RC-1..RC-4） |
| 依存 Phase 2 成果物 | `./phase-2.md` |
| 依存 Phase 5 成果物 | `./phase-5.md` |
| 設計レビュー | `./phase-3.md`（R-1..R-8 / NO-GO） |
| 品質保証 | `./phase-9.md` |

## 実行タスク

1. AC-A1..A4 を実装箇所 + テストケースへ写像し全 PASS を確認する。
2. 親 AC-G2 / AC-G3 の充足を確認する。
3. NO-GO 条件（Task B proxy Authorization 注入依存）を再掲する。
4. 不変条件 #5/#10/§2/§3/#8/#9 を最終確認する。
5. 最終ゲート判定 PASS を確定する。

## 実行手順

1. AC-A1..A4 を実装箇所 + テストケースへ写像し全 PASS を確認。
2. 親 AC-G2（endpoint/D1/Form 不変）/ AC-G3（1 サイクル完結）を確認。
3. NO-GO 条件（proxy Authorization 注入 = Task B 依存）を再掲。
4. 不変条件 #5/#10/§2/§3/#8/#9 を最終確認。
5. 最終ゲート判定 PASS を確定。

## 統合テスト連携

- 3 層整合（endpoint D1 spec / web schema spec / panel spec）が AC-A1..A4 を担保。
- runtime（staging）evidence は Phase 11 で pending（Task B proxy 注入完了後に取得）。

## 多角的チェック観点（AIが判断）

- AC-A4 の hook 経路は import 静的検査 + TC-A4 の pending 挙動で間接検証され、直接の hook spy が無くても充足するか。
- NO-GO-1 が「本タスク単独では解決しない実行時依存」であることを Phase 11 の runtime pending と整合させているか。

## サブタスク管理

| ID | 内容 | 判定 |
|----|------|------|
| FR-1 | AC-A1..A4 マッピング | PASS |
| FR-2 | 親 AC-G2/G3 充足 | PASS |
| FR-3 | NO-GO 条件再掲 | 完了 |
| FR-4 | 不変条件最終確認 | PASS |
| FR-5 | 最終ゲート判定 | PASS |

## 成果物

- 本最終レビューファイル（AC マッピング / 親 AC / NO-GO / 最終ゲート判定 PASS）。

## 完了条件

- [x] AC-A1..A4 を実装箇所 + テストケースへ写像。
- [x] 親 AC-G2 / AC-G3 充足を確認。
- [x] NO-GO 条件（proxy Authorization 注入 = Task B 依存）を再掲。
- [x] 不変条件 #5/#10/§2/§3/#8/#9 を最終確認。
- [x] 最終ゲート判定 PASS を確定。

## タスク100%実行確認【必須】

- [x] 全 AC を実装 + テストへ写像し漏れなし。
- [x] 実行時依存（NO-GO）を runtime pending と整合。

## 次Phase

Phase 11（マニュアルテスト / VISUAL_ON_EXECUTION）。
