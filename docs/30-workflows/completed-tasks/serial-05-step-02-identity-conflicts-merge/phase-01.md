# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase で確定する要件は、後続 Phase で `apps/web/app/(admin)/admin/identity-conflicts/`
> 配下に既存 `IdentityConflictRow` の hardening と focused test を実装する前提となる。コード変更を伴う
> 実装タスクの入力定義であり、設定変更のみでは満たせない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-02 identity-conflicts merge UI |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| artifacts.json.metadata.visualEvidence | VISUAL（一覧 → inline confirmation panel → confirm flow の screenshot を Phase 11 で取得） |

## 目的

step-02-identity-conflicts-merge を serial-05 系列の **2 番目の具体化 step** として確定し、
既存 `IdentityConflictRow` の二段階確認 UI を step-01 の `useAdminMutation` hook へ寄せる。
本 Phase は AC（受入条件）と Phase 2 設計が必要とする論点採択を出力する。

## P50 既実装チェック（必須）

Phase 1 開始時点で対象ディレクトリの既実装状態を確認し、重複作成を防止する。

| チェック | コマンド | 期待結果 |
| --- | --- | --- |
| identity-conflicts page 実装 | `ls apps/web/app/\(admin\)/admin/identity-conflicts/` | `page.tsx` が存在し server component として `fetchAdmin` を使う |
| merge UI 既存実装 | `rg -l "IdentityConflictRow" apps/web/src/components/admin apps/web/app` | `apps/web/src/components/admin/IdentityConflictRow.tsx` が存在 |
| useAdminMutation 実装 | `rg -l "useAdminMutation" apps/web/src/features/admin/hooks/` | step-01 成果として 1 件 |
| API route 実装 | `rg -l "identity-conflicts.*merge" apps/api/src/routes` | 1 件以上（実装済前提） |

> 既実装があった場合は P50 結果を `outputs/phase-01/p50-check.md` に記録し、Phase 2 で再利用方針を確定する。

## 真の論点

### 論点 1: 既存 inline 二段階確認の維持

**選択肢**:
- **(A) 既存 `IdentityConflictRow` の inline 二段階確認を hardening**: 最小変更で現行 UI と整合。**採用**
- **(B) 新規 modal component を作る**: 既存 UI と重複し、inventory gate に反する。**不採用**
- **(C) `page.tsx` を client 化する**: server fetch 境界を壊す。**不採用**

→ **(A) を採用**。modal 化は将来の視覚改善として扱わず、今回サイクルでは既存 UI の contract / error / evidence を整える。

### 論点 2: targetMemberId の入力源

API contract は `{ targetMemberId, reason }` を要求する。`targetMemberId` の取得経路を確定する。

**選択肢**:
- **(A) shared `IdentityConflictRow` の `candidateTargetMemberId` を送信する**:
  一覧 row 由来データから自動決定。read-only 表示。UX 最良。**採用**
- **(B) operator が手入力する**: 入力ミス事故リスク / UX 悪化。**不採用**
- **(C) API 側で server 解決**: API 改変が必要 → scope 外。**不採用**

→ **(A) を採用**。存在しない 旧 UI 仕様の型名や targetMemberId field は使わない。
`targetMemberId` payload には `item.candidateTargetMemberId` を入れる。

### 論点 3: 二段階確認の実装方式

**選択肢**:
- **(A) 既存 row 内 inline 二段階確認を維持し、warning → reason 入力へ進める**:
  既存 UI と server component fetch 境界を壊さず、最小差分で `useAdminMutation` 化できる。**採用**
- **(B) 単一 modal 内に warning + reason 入力を同時表示し、`merge 実行` ボタンで送信**:
  上流 draft 由来だが、既存 UI と重複し P50 inventory gate に反する。**不採用**
- **(C) modal を 2 枚にする（warning → reason）**: クリック数増 / 実装複雑。**不採用**

→ **(A) を採用**。「確認 1/2」パネルの後に「確認 2/2」reason 入力を表示し、`merge 実行` ボタンは reason 入力後だけ活性化する。

### 論点 4: error 表示の経路

API error shape:
```
400 { "error": "TARGET_MEMBER_MISMATCH" }
409 { "error": "ALREADY_MERGED" }
```

→ step-01 で確立した hook の error parse 経路（`body.message ?? body.error ?? "サーバーエラー"`）
を利用する。ただし `ALREADY_MERGED` / `TARGET_MEMBER_MISMATCH` / `ALREADY_DISMISSED` は
`useAdminMutation` の operator message map で和訳し、toast と inline alert の両方を運用者に分かりやすくする。inline confirmation panel は閉じない。

## 受入条件 (AC) → index.md 転記

AC-1〜AC-12 は index.md を参照。本 Phase の `outputs/phase-01/requirements.md` にも同文を転記する。

## 依存境界と責務

| 種別 | 対象 | 境界 |
| --- | --- | --- |
| 上流（実装済） | `apps/api/src/routes/admin/identity-conflicts.ts`（または該当 path） | I/O 契約に従う・改変禁止 |
| 上流（step-01 完了済前提） | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | import のみ。signature 改変禁止 |
| 上流（未実装・並列） | parallel-08 ToastProvider | root layout 配置は別タスク。toast 関数 import 前提 |
| 上流（未実装・並列） | parallel-10 auth-session | `FetchAuthedError` / 401 redirect は別タスク |
| 下流 | step-03..05 | 本 step の「inline confirmation + mutation」パターンを参照して踏襲 |
| 対象外 | D1 schema / API 仕様変更 | 変更禁止 |

## 実行タスク

- [ ] 原典 spec.md（`step-02-identity-conflicts-merge/spec.md`）を熟読し論点を抽出する
- [ ] API route の正常 / 400 / 409 応答 shape を実コードから `rg` で確定する
- [ ] step-01 成果の `useAdminMutation` の I/O 契約を `apps/web/src/features/admin/hooks/useAdminMutation.ts` から確定する
- [ ] `IdentityConflictRow` 型の field（`conflictId / sourceMemberId / candidateTargetMemberId / responseEmailMasked` 等）を
  shared schema から確認し、payload の `targetMemberId` は `candidateTargetMemberId` 由来と確定する
- [ ] 既存 inline 二段階確認 UI の a11y / token / error 表示を確認する
- [ ] AC-1〜AC-12 を `outputs/phase-01/requirements.md` に固定する
- [ ] 真の論点 1-4 の採択結果を `outputs/phase-01/decisions.md` に記録する
- [ ] P50 既実装チェック結果を `outputs/phase-01/p50-check.md` に記録する

## 参照資料

- 原典: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-02-identity-conflicts-merge/spec.md`
- API 正本: `apps/api/src/routes/admin/identity-conflicts.ts`（該当 path を Phase 1 で確定）
- step-01 成果: `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- 拡張対象: `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`
- design token: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション
- 先行参照: `docs/30-workflows/completed-tasks/serial-05-step-01-members-note-mutation-ui/phase-01.md`

## 実行手順

1. P50 チェックを実施し既実装の差分を確定する
2. 原典 spec を熟読し、論点 1-4 の採択を `outputs/phase-01/decisions.md` に記録する
3. API / hook / shared schema を実コードから読み取り、`outputs/phase-01/api-contract-evidence.md` に
   shape を抜粋して固定する
4. AC-1〜AC-12 を `outputs/phase-01/requirements.md` に転記する
5. NO-GO 条件（API shape 不一致 / `candidateTargetMemberId` 欠落 / hook 依存不在）に該当する場合は
   Phase 3 で MAJOR 判定するための材料を記録する

## 統合テスト連携

Phase 8 統合テストで以下を確認する前提を Phase 1 で記録する:
- `POST /api/admin/identity-conflicts/:conflictId/merge` が inline panel 経由で 200 を返す
- 409 (`ALREADY_MERGED`) / 400 (`TARGET_MEMBER_MISMATCH`) で inline panel が閉じず error toast が出る
- 成功時に `router.refresh()` 後の一覧から該当 conflict 行が消える / status 更新される

## 多角的チェック観点

- **UX**: 二段階確認の心理的バリア（reason 必須）/ 送信中 disabled / Escape close 挙動
- **a11y**: `role="dialog"` / `aria-modal` / focus trap / 初期 focus / `aria-describedby`
- **security**: reason 文字列の XSS（表示は React default escape に依存 / API 側は既存 zod 検証）
- **performance**: modal mount コスト（一覧 row 数に比例しないように conditional render）
- **i18n / 文言**: 取り消し不可警告・error 和訳マッピング（`ALREADY_MERGED` → 「既に統合済です」等）

## サブタスク管理

| ID | 内容 | 完了基準 |
| --- | --- | --- |
| P1-T1 | P50 チェック | `outputs/phase-01/p50-check.md` 生成 |
| P1-T2 | 論点採択記録 | `outputs/phase-01/decisions.md` 生成 |
| P1-T3 | API / hook / schema shape 確定 | `outputs/phase-01/api-contract-evidence.md` 生成 |
| P1-T4 | AC 固定 | `outputs/phase-01/requirements.md` に AC-1〜12 を転記 |

## 成果物

- `outputs/phase-01/requirements.md` — AC 固定
- `outputs/phase-01/decisions.md` — 真の論点 4 件の採択
- `outputs/phase-01/api-contract-evidence.md` — API / hook / schema shape の rg 抽出証跡
- `outputs/phase-01/p50-check.md` — 既実装チェック結果

## 完了条件

- [ ] AC-1〜AC-12 を index.md と requirements.md の両方に同文で記載
- [ ] 論点 1-4 の採択根拠が記録されている
- [ ] API shape を実コードから抜粋して固定
- [ ] step-01 `useAdminMutation` の signature 引用を固定
- [ ] `IdentityConflictRow` 型に `candidateTargetMemberId` が含まれることを確定
- [ ] 既存 `IdentityConflictRow` hardening 方針が Phase 2 に伝達されている
- [ ] coverage AC（Statements/Branches/Functions/Lines >=80%）を AC に明記
- [ ] `bash scripts/coverage-guard.sh` を Phase 6 / 9 / 11 完了条件に紐づける旨を記載

## タスク100%実行確認【必須】

- [ ] 実行タスク全完了
- [ ] 成果物 4 件 commit-ready
- [ ] Phase 2 開始 gate（要件未確定 / MAJOR フラグありなら NO-GO）

## 次Phase

Phase 2 (設計): inline row hardening / focused test / server component boundary維持の関数シグネチャ・I/O・state 設計、
dependency matrix、validation matrix を確定する。
