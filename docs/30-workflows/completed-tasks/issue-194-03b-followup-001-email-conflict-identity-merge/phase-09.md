# Phase 9: 品質保証 — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

実装は既存（`apps/api/migrations/0010-0012`、`apps/api/src/repository/identity-{conflict,merge}.ts`、
`apps/api/src/routes/admin/identity-conflicts.ts`、`apps/api/src/services/admin/identity-conflict-detector.ts`、
`apps/web/app/(admin)/admin/identity-conflicts/`、`packages/shared/src/schemas/identity-conflict.ts`）。
本 phase は実装に対する品質保証手順と実測可能な検証コマンドを正本化する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 9 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 上流 | 03b forms response sync 本体 / 04c admin backoffice API endpoints / 02a member identity-status repository |
| 下流 | 公開ディレクトリ重複解消運用 / 04c admin E2E |

## 目的

実装済みコードに対して、free-tier 見積もり / secret hygiene / a11y / PII 取扱 / 自動テストを
ローカルで実測検証し、結果を `outputs/phase-09/main.md` に記録する。

## 実行タスク

1. typecheck / lint / 関連 vitest を実測（コマンドは下記）
2. D1 read / write 見積もりを再評価（実装 SQL を入力に）
3. secret 追加なしを確認
4. a11y 観点（候補一覧 table、merge モーダル focus trap、3 軸ボタン区別）を整理
5. responseEmail マスク仕様（`maskResponseEmail` の実装）と PII 取扱を確定

## 参照資料

- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/00-overview.md`
- 実装: `packages/shared/src/schemas/identity-conflict.ts:59` `maskResponseEmail`
- 実装: `apps/api/src/repository/identity-conflict.ts:80` `listIdentityConflicts`
- 実装: `apps/api/src/repository/identity-merge.ts:78` `mergeIdentities`

## 検証コマンド（CONST_005 実測）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --no-coverage \
  apps/api/src/services/admin/identity-conflict-detector.test.ts \
  apps/api/src/repository/__tests__/identity-merge.test.ts \
  apps/api/src/repository/__tests__/identity-conflict.test.ts
```

期待値: 全 exit=0、test files 3 / tests 16 以上 passed。

## カバレッジ目標

- 新規 repository / detector / route ユニットは主要パス 100% 通過（16 ケース）
- E2E（UI 経由）は Phase 11 manual smoke へ委譲
- 不足分は Phase 10 残課題に明記

## free-tier 見積もり

- 候補一覧表示: 1 表示 = 2-3 query（list + dismissals 除外）。daily 想定 20 表示 → 60 read
- merge 実行: 1 操作 = 7 write（batch）+ 1 read。月数件想定で free-tier 上限内
- DDL 追加 3 本（`identity_merge_audit` / `identity_aliases` / `identity_conflict_dismissals`）も storage 影響軽微

## secret hygiene

- [ ] 新規 secret 追加なし（`secrets_introduced: []`）
- [ ] AUTH_SECRET の値を log/doc に書かない
- [ ] admin email allowlist は既存 env 参照のまま

## a11y

- 候補一覧は table 構造、各候補行に `role="row"` と aria-label（`apps/web/src/components/admin/IdentityConflictRow.tsx`）
- merge 確認モーダルは focus trap、Esc で close
- 「別人として確定」と「merge」のボタンは色 + アイコン + テキストの 3 軸で区別
- color contrast WCAG AA 準拠

## PII / responseEmail マスク仕様

- `maskResponseEmail(email)` 実装は `先頭1文字 + "***" + "@" + domain` 形式
- admin UI は基本マスク表示。`reveal` action は audit_log に記録（任意拡張）
- `reason` は最大 500 文字。メール / 電話番号らしき文字列は redaction 後保存
- `audit_log.before_json` / `after_json` は member id と operation metadata に限定

## サブタスク管理

- [ ] 検証コマンドを実行し exit code を outputs/phase-09/main.md に記録
- [ ] free-tier 見積もりを実装 SQL ベースで再評価
- [ ] secret 追加 0 を再確認
- [ ] PII マスク仕様と実装を突合

## 成果物

- `outputs/phase-09/main.md`

## 完了条件

- 検証コマンド全 PASS
- free-tier 見積もりが上限内
- secret 追加なし
- a11y 観点 / PII マスク方針が実装と整合

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装に対する検証手順を提示している（コードは書いていない）
- [ ] commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ、検証結果、blocker、evidence path、approval gate を渡す。
