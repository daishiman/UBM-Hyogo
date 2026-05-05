# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 4 (followup) |
| 実行種別 | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## 目的

migration 0007 / repository helper / route guard の 3 レイヤを横断し、型安全 / lint / テスト / 無料枠 / secret hygiene / a11y の 5 軸で「実装が AC を満たしながら回帰を生まない」状態を確定する。
本タスクは admin / 本人 API の DB 層変更であり UI を伴わないため、a11y 軸は対象外として明示する（NON_VISUAL）。

## 実行タスク

1. typecheck（`apps/api` 全件 + `RequestStatus` 型 export 整合）
2. lint（`apps/api` 全件 + repository / route ファイル）
3. unit test（`adminNotes.test.ts` / `routes/me/index.test.ts` + 既存全件）
4. 無料枠見積もり（D1 reads/writes、partial index による削減効果）
5. secret hygiene チェックリスト（本タスクで導入なし）
6. a11y 観点（NON_VISUAL の確認のみ）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/main.md | テスト戦略 |
| 必須 | outputs/phase-05/main.md | 実装ランブック |
| 必須 | outputs/phase-08/main.md | 命名統一・DRY 結果 |
| 必須 | apps/api/migrations/0006_admin_member_notes_type.sql | 直前 migration（reads/writes 比較ベース） |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 無料枠 |

## 実行手順

### ステップ 1: 型安全
```bash
mise exec -- pnpm typecheck
```
- `RequestStatus = 'pending' | 'resolved' | 'rejected'` が repository から export されている
- `AdminMemberNoteRow` interface に `request_status / resolved_at / resolved_by_admin_id` が追加されている
- `markResolved` / `markRejected` の戻り型が `Promise<NoteId | null>` で routes 側と整合

### ステップ 2: lint
```bash
mise exec -- pnpm lint
```
- repository 内で `request_status` の string literal が enum 経由でしか書かれていない
- routes/me/services.ts の `hasPendingRequest` 呼び出しが pending 限定化された後の signature と一致

### ステップ 3: unit test
```bash
mise exec -- pnpm -F apps/api test
mise exec -- pnpm -F apps/api test src/repository/__tests__/adminNotes.test.ts
mise exec -- pnpm -F apps/api test src/routes/me/index.test.ts
```
- AC-3 / AC-4 / AC-5 / AC-6 / AC-7 / AC-8 を網羅する 6 ケースが green
- 既存テスト breakage 0

### ステップ 4: 無料枠見積もり

| 操作 | 想定/日 | 想定/月 | 備考 |
| --- | --- | --- | --- |
| migration 0007 適用 | 1 回（production / staging 各 1） | — | ALTER TABLE 3 列 + UPDATE backfill + CREATE INDEX |
| `hasPendingRequest` 検索 | ~20 (本人申請ガード) | 600 | partial index hit |
| `markResolved` / `markRejected` | ~5 (admin 処理) | 150 | UPDATE 1 行 |
| 新規 pending INSERT | ~5 | 150 | resolved 後の再申請含む |
| D1 writes 合計 | ~10 | 300 | |
| D1 reads 合計 | ~25 | 750 | |

| サービス | 想定 | 上限 | 余裕 |
| --- | --- | --- | --- |
| D1 writes | 300 / 月 | 100k / 日（≈3M / 月） | 99.99% |
| D1 reads | 750 / 月 | 500k / 日（≈15M / 月） | 99.99% |
| Workers req | 1.5k / 月 | 100k / 日（≈3M / 月） | 99.95% |

- partial index 化により pending 検索の scanned rows が「note_type 一致行全件」から「pending 行のみ」に縮小
- migration 0007 の backfill UPDATE は対象 visibility_request / delete_request 行のみで件数 < 1k 想定（writes 1k 以内の単発実行）

### ステップ 5: secret hygiene チェックリスト
- [ ] 本タスクで新規 secret 追加なし（`Secrets 一覧（このタスクで導入）= なし`）
- [ ] `CLOUDFLARE_API_TOKEN` 等は `scripts/cf.sh` 経由で 1Password から動的注入
- [ ] migration / repository / routes に API token / OAuth token のハードコードなし
- [ ] `.env` 実値の参照・転記なし（op:// 参照のみ）
- [ ] wrangler を直接呼ぶ箇所なし（ラッパー `scripts/cf.sh` のみ）

### ステップ 6: a11y 観点（NON_VISUAL）
- 本タスクは `admin_member_notes` schema / repository helper / API route guard の改修のみで UI 変更を伴わない
- screenshot / ARIA / contrast / keyboard navigation はすべて対象外
- 下流タスク（07a / 07c）で UI が追加される際に a11y は当該タスクで担保する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 全項目 PASS が GO 判定の前提 |
| Phase 11 | smoke 実施前の自動テスト品質保証 |
| 下流 07a / 07c | helper signature が typecheck で確定 |

## 多角的チェック観点

| 不変条件 | チェック | 確認方法 |
| --- | --- | --- |
| #4 | `member_responses` 非編集 | grep で repository helper が `admin_member_notes` のみを更新 |
| #5 | `apps/web` から D1 直接アクセスなし | grep で `apps/web` 内に D1 binding 参照なし |
| #11 | admin が member 本文を直接編集していない | repository helper / migration が `admin_member_notes` のみに閉じる |
| 無料枠 | 300 writes/月 | 0.0003% / 100k/日 |
| 監査 | resolved_by_admin_id を明示記録 | unit test |

## 無料枠見積もり

| サービス | 想定 | 上限 | 余裕 |
| --- | --- | --- | --- |
| D1 writes | 300 / 月 | 3M / 月 | 99.99% |
| D1 reads | 750 / 月 | 15M / 月 | 99.99% |
| Workers req | 1.5k / 月 | 3M / 月 | 99.95% |

## secret hygiene チェックリスト

- [ ] 新規 secret なし
- [ ] D1 binding は `apps/api/wrangler.toml` で管理
- [ ] `wrangler` 直接実行なし（`scripts/cf.sh` 経由）
- [ ] `.env` 実値参照なし（op:// 参照のみ）

## a11y チェックリスト

- [x] NON_VISUAL タスクのため UI a11y 対象外
- [x] 下流 UI タスクへ a11y 責務を委譲（07a / 07c）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | typecheck | 9 | pending | RequestStatus / Row 拡張 |
| 2 | lint | 9 | pending | enum 経由 |
| 3 | unit test | 9 | pending | repository + routes/me |
| 4 | 無料枠 | 9 | pending | 300 writes/月 |
| 5 | secret hygiene | 9 | pending | 追加なし |
| 6 | a11y | 9 | pending | NON_VISUAL |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | チェック結果 |
| メタ | artifacts.json | Phase 9 を completed |

## 完了条件

- [ ] 6 項目すべて PASS
- [ ] 無料枠余裕 99% 以上
- [ ] secret 漏れなし
- [ ] NON_VISUAL の明示

## タスク100%実行確認

- 全項目に check
- artifacts.json で phase 9 を completed

## 次 Phase への引き渡し

- 次: 10 (最終レビュー)
- 引き継ぎ: 全 PASS が GO の根拠
- ブロック条件: 1 項目でも FAIL なら差し戻し
