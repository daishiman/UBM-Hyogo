# Phase 10: 最終レビュー（Gate 相当）

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL** / **workflow_state: implemented_local_evidence_captured** / **判定: PASS（local evidence captured）**

## 1. acceptance criteria 検証テーブル

| AC | 内容 | 対応 TC | 仕様判定 | blocker |
| --- | --- | --- | --- | --- |
| AC-1 | member token → `{ kind:"member", profileHref:"/profile" }` | TC-AVSC-01 | PASS（設計確定） | なし |
| AC-2 | admin token（`isAdmin:true`）→ `{ kind:"admin", profileHref:"/profile", adminHref:"/admin" }` | TC-AVSC-02 | PASS | なし |
| AC-3 | `memberId` 欠落 → callback が `memberId:""` → `{ kind:"guest" }` fail-closed | TC-AVSC-03 | PASS（不変条件 #11 整合） | なし |
| AC-4 | `getAuthView()` を実 callback 出力相当 `auth()` mock に接続し AC-1〜3 と整合 | TC-AVSC-04 | PASS | なし |
| AC-5 | 既存 3 spec が緑のまま（regression なし） | focused vitest 4 spec 同時実行 | PASS（検証コマンドで担保） | なし |
| AC-6 | `AuthView.kind` は `guest \| member \| admin` 以外を出さない | TC-AVSC-05（drift guard） | PASS | なし |

## 2. blocker / MINOR 判定

| 区分 | 件数 | 内容 |
| --- | --- | --- |
| blocker | 0 | 仕様の論理欠落・AC 未カバー・不変条件違反なし |
| MINOR | 0（見込み） | 現時点で MINOR 指摘は想定なし |

> MINOR 指摘が発生した場合は **Phase 12 の unassigned（未タスク化対象）へ送る** 方針とする。
> ただし本タスクは単一 spec ファイル追加で論点が閉じており、現時点で未タスク化候補は 0 件見込み。

## 3. Gate 判定

- **PASS。** AC-1〜6 すべて local evidence で充足され、blocker 0 件。
- focused Vitest 4 files / 61 tests PASS、typecheck exit 0、lint exit 0 を確認済み。

## 4. 本サイクルでの sign-off 手順（Gate-B passed 化）

1. 本サイクルで新規 spec を RED→GREEN で作成（Phase 4 設計に従う）。
2. 検証コマンドを実行:
   - `mise exec -- pnpm exec vitest run apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts apps/web/src/lib/auth.spec.ts`
   - `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`
   - `mise exec -- pnpm lint`
3. focused vitest 結果（PASS 件数・全 spec 緑）を Phase 11 の `manual-test-result.md` に記録する。
4. `artifacts.json` の Gate-A / Gate-B を `passed` + `passed_at`（ISO8601 offset）へ更新し、`workflow_state` を `implemented_local_evidence_captured` へ昇格する。
5. Gate-C（staging / runtime）は本 NON_VISUAL テスト追加タスクでは非該当（UI runtime 経路なし）。

## 完了条件（Phase 10）

- [x] AC-1〜6 を検証テーブルで判定（全 PASS）
- [x] blocker 0 / MINOR 0 見込みを記録（MINOR は Phase 12 unassigned へ送る方針を明記）
- [x] Gate 判定 = PASS（local evidence captured）
- [x] 本サイクルでの sign-off 手順（manual-test-result.md 記録 → Gate-B passed）を記載
