# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 10 (最終レビュー) |
| 下流 | Phase 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

repository 層の手動 smoke を **wrangler dev / vitest UI / 手動 D1 query** で実施し、自動 test では拾えない「実環境での挙動」を確認する。証跡を残す。

## smoke シナリオ

### S-1: D1 接続確認
```bash
# wrangler dev の context で D1 binding を確認
pnpm --filter apps/api wrangler d1 execute ubm-hyogo-staging --command "SELECT name FROM sqlite_master WHERE type='table';"
```
- 期待: 9 テーブルが返る
- 証跡: `outputs/phase-11/evidence/s-1-tables.txt`

### S-2: fixture 投入
```bash
pnpm --filter apps/api wrangler d1 execute ubm-hyogo-staging --file scripts/seed-smoke.sql
```
- 期待: 5 member, 5 status, 5 responses が投入
- 証跡: `outputs/phase-11/evidence/s-2-seed.txt`

### S-3: builder 動作確認（vitest UI）
```bash
pnpm --filter apps/api test:ui repository
```
- 確認:
  - `buildPublicMemberProfile("m_001")` → 正常に view model 返却
  - `buildPublicMemberProfile("m_003")` (deleted) → `null`
  - `buildMemberProfile("m_001")` → `responseEmail` 含む
  - `buildAdminMemberDetailView("m_001", [adminNote1])` → `adminNotes` attached
- 証跡: `outputs/phase-11/evidence/s-3-vitest-ui.png`

### S-4: 認可境界 manual
```bash
# REPL 風に検証
pnpm --filter apps/api exec node -e "
  // import * as builder from './dist/repository/_shared/builder.js';
  // ... env mock
"
```
- 確認:
  - `consent != consented` の memberId を public で取得 → null/items 不在
  - `member_field_visibility = admin` の field が public sections に出ない
- 証跡: `outputs/phase-11/evidence/s-4-authz-output.txt`

### S-5: dependency-cruiser 違反 zero
```bash
pnpm depcruise --config .dependency-cruiser.cjs apps/api
```
- 期待: `0 dependency violations`
- 証跡: `outputs/phase-11/evidence/s-5-depcruise.txt`

### S-6: 型混同 TS エラー
```bash
# 意図的にエラーになるべき snippet を tsc にかける
pnpm exec tsc --noEmit apps/api/src/repository/__tests__/brand.test.ts
```
- 期待: `Type 'ResponseId' is not assignable to type 'MemberId'` が出る
- 証跡: `outputs/phase-11/evidence/s-6-tsc-brand-error.txt`

### S-7: bundle size
```bash
pnpm --filter apps/api build
du -sh apps/api/dist/index.js
```
- 期待: `< 1MB`
- 証跡: `outputs/phase-11/evidence/s-7-bundle.txt`

## 証跡保存ルール

- 全 evidence は `outputs/phase-11/evidence/` に保存
- スクリーンショットは PNG、テキスト出力は TXT
- ファイル名は `s-N-<内容>.{ext}` 形式
- 機密情報（メアド本物 / token / private key）はマスクして保存

## 実行タスク

1. S-1〜S-7 を順次実行
2. 各 evidence をファイル保存
3. `outputs/phase-11/manual-evidence.md` に summary 表
4. `outputs/phase-11/main.md` に総括 + 不合格 case の対応

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 10 outputs/phase-10/main.md | GO 判定 |
| 必須 | Phase 5 runbook.md | 実装手順 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 操作 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke evidence を documentation に添付 |
| 09a (staging) | smoke の reality check |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| D1 boundary | #5 | S-1 が apps/api 経由で D1 接続 |
| 型混同 | #7 | S-6 が TS エラーで防御 |
| view 分離 | #12 | S-3 が adminNotes 引数受取で確認 |
| 認可 | #4, #11 | S-4 が漏洩防止 |
| 無料枠 | #10 | S-7 が bundle size < 1MB |
| boundary | #5 | S-5 が dep-cruiser 0 violation |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | S-1 D1 接続 | 11 | pending | tables.txt |
| 2 | S-2 seed | 11 | pending | seed.txt |
| 3 | S-3 vitest UI | 11 | pending | screenshot |
| 4 | S-4 authz | 11 | pending | output.txt |
| 5 | S-5 depcruise | 11 | pending | depcruise.txt |
| 6 | S-6 brand TS | 11 | pending | tsc-error.txt |
| 7 | S-7 bundle | 11 | pending | bundle.txt |
| 8 | summary 作成 | 11 | pending | manual-evidence.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 総括 |
| ドキュメント | outputs/phase-11/manual-evidence.md | 7 シナリオ summary |
| evidence | outputs/phase-11/evidence/* | 7 files |

## 完了条件

- [ ] S-1〜S-7 全て期待通り
- [ ] evidence が指定パスに保存
- [ ] 不合格 case があれば修正 plan が main.md に記載

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜8 が completed
- [ ] outputs/phase-11/* が配置済み
- [ ] artifacts.json の Phase 11 を completed に更新

## 次 Phase

- 次: Phase 12 (ドキュメント更新)
- 引き継ぎ事項: smoke evidence
- ブロック条件: いずれかが期待通りでなければ Phase 5 / 8 / 9 に戻る
