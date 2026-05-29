# google-form-reflection-diagnostics-fu-002 — H2 本人マッチング再構築

[実装区分: 実装仕様書]
判定根拠: 本タスクは `member_identities` backfill migration + Auth.js callback での auto-link 強化を伴う。コード変更なしでは、回答済み email が identity 欠損で未登録扱いになる問題を解消できない。

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | google-form-reflection-diagnostics-fu-002-h2-identity-rebuild                                   |
| 親 workflow  | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/`                          |
| 親 Issue     | #957 (CLOSED — Refs 起票クローズ。実装は未完)                                                   |
| 起票トリガ   | `identityHealth.membersWithoutIdentity > 0` または `/admin/diagnostics/member/:id` で H2_identityMissing=true 再現 |
| 優先度       | high (profile 経路の死命線)                                                                     |
| 見積もり規模 | 中 (migration 1 本 + auth.ts callback 1 patch + spec 2 本)                                      |
| 実装区分     | 実装仕様書                                                                                      |
| スコープ単位 | 単一サイクルで完了する 1 タスク（仕様書分割なし）                                               |

## 単一責務

`member_responses` には存在するが `member_identities` には存在しない email を backfill / auto-link で生成し、以降の sign-in でも再発生を防ぐ。現行 schema では `member_responses` に `member_id` が無いため、既存 member_id の復元は `tag_assignment_queue(response_id, member_id)` bridge が残る範囲に限定する。

## Phase 一覧

| Phase | 内容                                       |
| ----- | ------------------------------------------ |
| 1     | 要件定義                                   |
| 2     | アーキテクチャ設計                         |
| 3     | データ設計                                 |
| 4     | テスト戦略                                 |
| 5     | 実装設計（変更対象ファイル・関数シグネチャ） |
| 6     | エラーハンドリング設計                     |
| 7     | セキュリティ・権限設計                     |
| 8     | 可観測性・ログ設計                         |
| 9     | パフォーマンス・冪等性設計                 |
| 10    | デプロイ・ロールアウト計画                 |
| 11    | 検証 evidence 取得計画                     |
| 12    | DoD・受け入れ基準                          |
| 13    | PR 構成・ドキュメント更新計画              |

## 不変条件（CONST 制約）

- C1: D1 schema 変更は migration ファイル経由のみ（in-place ALTER 禁止 / CLAUDE.md 不変条件 #5）。
- C2: `apps/web` から D1 直接アクセス禁止 → backfill API は `apps/api` 配下のみ。
- C3: backfill SQL は冪等（再実行で差分 0）。
- C4: production 投入前に `bash scripts/cf.sh d1 export` で D1 backup。staging 検証完了をゲートに production 適用。
- C5: Auth.js callback の auto-link は **既存 `member_identities` row を上書きしない**（INSERT OR IGNORE 相当の意味論）。
- C6: matching 軸は `response_email`（lowercase 正規化済）単軸。`external_id` / OAuth sub は schema に存在しないため対象外。

## 変更対象ファイル サマリ（Phase 5 で詳細化）

| 種別 | パス                                                              |
| ---- | ----------------------------------------------------------------- |
| 新規 | `apps/api/migrations/0021_backfill_member_identities.sql`         |
| 編集 | `apps/api/src/routes/auth/session-resolve.ts` (auto-link 統合)    |
| 編集 | `apps/api/src/repository/identities.ts` (backfill helper 追加)    |
| 編集 | `apps/api/src/diagnostics/forms-pipeline.ts` (hypothesis 紐付け)  |
| 編集 | `apps/api/src/routes/auth/session-resolve.contract.spec.ts` (拡張) |
| 新規 | `apps/api/src/repository/__tests__/identities.autolink.spec.ts`    |
| 編集 | `docs/00-getting-started-manual/specs/02-auth.md` (auto-link 仕様) |

## 完了条件サマリ（Phase 12 で詳細）

- staging / production 双方で bridge-backed H2 sample の `H2_identityMissing === false`
- bridge 無しの `member_status` orphan が残る場合、email との対応が schema 上存在しないことを evidence に記録し、auto-link は新規 identity として救済する
- backfill migration を 2 回連続適用しても差分 0（idempotency test green）
- 新規 sign-in が未登録扱いで弾かれた場合、auto-link で recover し、2 回目の sign-in は成功する
- `pnpm typecheck` / `pnpm lint` / `pnpm --filter api test` green
