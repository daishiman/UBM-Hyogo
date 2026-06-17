# Phase 11 — 手動テスト

## 目的

`admin-identity-conflicts-clarity-and-meetings-rename` の実装が landed したのちに実施する、3 層評価（Semantic / Visual / AI UX）の手動検証計画を固定する。本タスクは **VISUAL かつ implemented_local_evidence_captured**（実コード反映済み）であるため、screenshot 一式は **pending_implementation**（撮影は user-gated）。本 Phase では「何を・どこで・どう確認するか」を決定論的に列挙し、実装完了時にそのまま実行できる手順書とする。

> 文言・seed 仕様・検証コマンドの正本は [shared-context.md](./shared-context.md)。本ファイルはそれを引用する。

## 成果物

- 本ファイル（手動テスト計画）。
- [outputs/phase-11/manual-test-result.md](./outputs/phase-11/manual-test-result.md)（NON_VISUAL / VISUAL を分離記録。implemented_local_evidence_captured のため screenshot 未取得）。
- [outputs/phase-11/phase11-capture-metadata.json](./outputs/phase-11/phase11-capture-metadata.json)（撮影予定 screenshot の canonical 名・status=pending_implementation）。

## 撮影予定 screenshot（canonical 名）

`artifacts.json` の `metadata.screenshots_canonical` と逐語一致させる。implemented_local_evidence_captured のため実体は未撮影（pending）。

| # | canonical 名 | 撮影シーン | 確認観点 |
| --- | --- | --- | --- |
| 1 | `sidebar-meetings-label-renamed.png` | 管理サイドバー展開時 | `開催日`→`開催・出席管理` / `Identity重複`→`会員の重複確認` のラベル反映（id/href/icon 不変） |
| 2 | `identity-conflicts-empty-jp.png` | seed 未投入（候補 0 件） | empty 文言が `現在、重複の可能性がある会員は見つかっていません。`、ガイド表示 |
| 3 | `identity-conflicts-list-jp.png` | seed 投入後（候補 5 組） | カード見出し `重複の可能性がある会員`、各行の日本語ラベル（メール / 一致した項目: 氏名・職業 / 新しい登録 / まとめ先（以前の登録）） |
| 4 | `identity-conflicts-merge-confirm-jp.png` | 統合の 2 段階確認モーダル | `確認 1/2` / `確認 2/2` の平易日本語、`統合を実行` ボタン |
| 5 | `identity-conflicts-dismiss-jp.png` | 別人として確定モーダル | `別人として確定` 説明文・理由入力・実行ボタンの日本語 |

> 撮影は staging（または local dev）で実施し、user-gated（Phase 13）。撮影解像度・端末バリエーション（desktop/tablet/mobile）は実装サイクルの visual pipeline 方針に従う。

## 3 層評価計画

### 層 1: Semantic（意味・文言）— jsdom / focused vitest

CSS 非評価のため、DOM 構造と文言 contract で検証する（[shared-context §8](./shared-context.md)）:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts \
  apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
  apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx \
  apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts
```

確認:
- shell-config: meeting=`開催・出席管理` / identity=`会員の重複確認`、id/href/icon 不変。
- IdentityConflictRow: 英語・技術用語（merge/source/target/email/matched/name/affiliation/canonical/PII/redaction）が日本語に置換。`matchedFields` が glossary 経由で `氏名`/`職業` 表示。
- IdentityConflictGuide: 3 点の平易説明が描画。
- glossary: `matchedFieldLabel("name")="氏名"` / `("affiliation")="職業"` / 未登録は原文 fallback（throw しない）。

### 層 2: Visual（色・余白・レイアウト）— screenshot（pending_implementation）

jsdom では検証不能な視覚要素は staging/local screenshot で確認（上表 5 枚）。implemented_local_evidence_captured の現時点は撮影しない。色は `var(--ubm-color-*)` のみ（`mise exec -- pnpm verify:tokens` 緑）で機械検証。

### 層 3: AI UX（非エンジニアが直感的に操作できるか）

撮影後、以下を観点として人間（または AI レビュー）が評価:
- 「このページで何ができるか」がガイド 3 点で 5 秒以内に伝わるか。
- 「統合」「別人として確定」の差が文言だけで判断できるか（取り消し可能性・記録される旨が伝わるか）。
- 内部 ID（member_id / conflictId）が主役を奪っていないか（補助情報に後退しているか）。

## seed の機能検証手順（concern 4）

local D1 へ専用 staging seed を apply し、候補 5 件が出ることを確認する（[shared-context §6](./shared-context.md)）。実行は実装済み・user-gated。

```bash
# 1) 生成（drift 0 / idempotent）
node scripts/gen-identity-conflict-seed.mjs
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts

# 2) local D1 へ apply
bash scripts/seed-identity-conflicts.sh --env local --action apply

# 3) 候補 5 件確認（repository query 相当 / または d1 execute）
#    期待: ちょうど 5 組（P1 完全一致 / P2 NFKC / P3 trim / P4 別ゾーン / P5 同姓同名）
#    既存 TEST-MEM-01..10 と非衝突（cross-collision なし）

# 4) 撤去（scoped cleanup・既存 seed を巻き込まない）
bash scripts/seed-identity-conflicts.sh --env local --action cleanup
```

確認:
- apply 後 `/admin/identity-conflicts` に 5 組表示。各組が異なるパターンを demonstrate。
- 各組で「新しい登録（source）」「まとめ先（以前の登録）（target）」が `last_submitted_at` で決定論化されている。
- cleanup 後に候補 0 件へ戻り、TEST-MEM-01..10 が無傷。

## 統合テスト連携

- focused vitest（層 1）: shell-config / IdentityConflictRow / IdentityConflictGuide / identityConflictGlossary / identity-conflict-seed.contract を `--root=. --config=vitest.config.ts apps/...` 形式で実行（ルートからフルパス必須・FB-UI-02-2）。
- seed contract test: 生成 SQL の drift 0 / idempotent（`INSERT OR REPLACE`）/ 行数 contract を機械検証。
- jsdom は CSS 非評価のため、視覚（色・余白）は構造/文言 contract で代替し、最終視覚は staging screenshot（user-gated）に委譲。
- seed の機能検証は local D1 apply → 候補 5 件確認で代替（E2E 相当）。

## 完了条件

- [ ] 3 層評価計画（Semantic / Visual / AI UX）を固定した。
- [ ] 撮影予定 screenshot 5 枚の canonical 名を `screenshots_canonical` と一致させた。
- [ ] seed の local 機能検証手順（apply → 候補 5 件 → cleanup）を手順化した。
- [ ] implemented_local_evidence_captured のため screenshot は pending_implementation である旨を明記した。
