# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 10 (最終レビュー) |
| 下流 | Phase 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

repository 層と boundary tooling の手動 smoke を **wrangler dev / vitest UI / 手動 D1 query / dep-cruiser CLI / ESLint CLI** で実施し、自動 test では拾えない「実環境での挙動」と「意図的 violation snippet が確実に error を出すこと」を確認する。証跡を残す。

## smoke シナリオ

### S-1: D1 接続確認（admin domain 5 テーブル）

```bash
pnpm --filter apps/api wrangler d1 execute ubm-hyogo-staging --command \
  "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('admin_users','admin_member_notes','audit_log','sync_jobs','magic_tokens');"
```
- 期待: 5 テーブルが返る
- 証跡: `outputs/phase-11/evidence/s-1-tables.txt`

### S-2: fixture 投入（admin / notes / audit）

```bash
pnpm --filter apps/api wrangler d1 execute ubm-hyogo-staging --file scripts/seed-admin-smoke.sql
```
- 期待: admin_users 1 件、admin_member_notes 2 件、audit_log 5 件 投入
- 証跡: `outputs/phase-11/evidence/s-2-seed.txt`

### S-3: repository 動作確認（vitest UI）

```bash
pnpm --filter apps/api test:ui repository
```
- 確認:
  - `adminUsers.findByEmail("owner@example.com")` → role: "owner" 返却
  - `adminUsers.findByEmail("ghost@example.com")` → null
  - `adminNotes.create({ memberId, body, createdBy })` → row 返却 + DB に保存
  - `auditLog.append({ actor, action: "test", targetType: "system", targetId: null, metadata: {} })` → row 返却 + DB に保存
  - `syncJobs.start("forms_schema")` → status="running" の row
  - `syncJobs.succeed(id, {})` → status="succeeded" に遷移
  - `magicTokens.issue / verify / consume` の一連フロー成功
- 証跡: `outputs/phase-11/evidence/s-3-vitest-ui.png`

### S-4: append-only / single-use / 状態遷移 manual

```bash
# auditLog UPDATE/DELETE 不在の TS エラー確認
pnpm exec tsc --noEmit apps/api/src/repository/__tests__/auditLog.append-only.test.ts

# magicTokens 二重 consume の挙動確認
pnpm --filter apps/api test repository magicTokens.single-use

# syncJobs 不正状態遷移の throw 確認
pnpm --filter apps/api test repository syncJobs.transition
```
- 期待:
  - `auditLog.update is not a function` 相当の TS error
  - 2 回目 consume が `{ ok: false, reason: "already_used" }`
  - `succeeded` への二重 succeed が `IllegalStateTransition` throw
- 証跡: `outputs/phase-11/evidence/s-4-invariant-output.txt`

### S-5: dependency-cruiser 違反 zero（02c 配下と全体）

```bash
pnpm depcruise --config .dependency-cruiser.cjs apps/api apps/web
```
- 期待: `0 dependency violations`
- 証跡: `outputs/phase-11/evidence/s-5-depcruise.txt`

### S-6: 意図的 violation snippet で boundary tooling が error を出す

```bash
# 意図的に違反 snippet を作って dep-cruiser / ESLint にかける
pnpm depcruise tests/boundary-fixtures/web-import-repo.ts
pnpm --filter apps/web lint tests/boundary-fixtures/web-import-d1.tsx
pnpm depcruise tests/boundary-fixtures/2a-import-2c.ts
```
- 期待: 3 ケース全てで error 出力
- 証跡: `outputs/phase-11/evidence/s-6-violation-detection.txt`

### S-7: 型混同 TS エラー（brand）

```bash
pnpm exec tsc --noEmit apps/api/src/repository/__tests__/brand.test.ts
```
- 期待:
  - `Type 'string' is not assignable to type 'AdminEmail'`
  - `Type 'string' is not assignable to type 'MagicTokenValue'`
- 証跡: `outputs/phase-11/evidence/s-7-tsc-brand-error.txt`

### S-8: bundle size + fixture 除外

```bash
pnpm --filter apps/api build
du -sh apps/api/dist/index.js
ls apps/api/dist/ | grep -c fixture || true
```
- 期待: `< 1MB`、fixture 件数 0
- 証跡: `outputs/phase-11/evidence/s-8-bundle.txt`

## 証跡保存ルール

- 全 evidence は `outputs/phase-11/evidence/` に保存
- スクリーンショットは PNG、テキスト出力は TXT
- ファイル名は `s-N-<内容>.{ext}` 形式
- 機密情報（token / private key / 実 admin email）はマスクして保存

## 実行タスク

1. S-1〜S-8 を順次実行
2. 各 evidence をファイル保存
3. `outputs/phase-11/manual-evidence.md` に summary 表
4. `outputs/phase-11/main.md` に総括 + 不合格 case の対応

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 10 outputs/phase-10/main.md | GO 判定 |
| 必須 | Phase 5 runbook.md | 実装手順 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 操作 |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | Magic Link 動作確認 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke evidence を documentation に添付 |
| 09a (staging) | smoke の reality check |
| 09b (cron) | sync_jobs の実頻度照合 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| D1 boundary | #5 | S-1 が apps/api 経由で D1 接続、S-5 / S-6 で違反検出 |
| 型混同 | — | S-7 が TS エラーで防御 |
| view 分離 | #12 | S-3 で adminNotes が member view に出ないことを確認 |
| append-only | — | S-4 で auditLog UPDATE/DELETE 不在 |
| single-use | — | S-4 で magicTokens 二重 consume が阻止 |
| 状態遷移 | — | S-4 で syncJobs 不正遷移が throw |
| boundary tooling | #5 | S-6 で意図的 violation を確実に検出 |
| GAS 昇格防止 | #6 | S-8 で fixture が build から除外 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | S-1 D1 接続 | 11 | pending | tables.txt |
| 2 | S-2 seed | 11 | pending | seed.txt |
| 3 | S-3 vitest UI | 11 | pending | screenshot |
| 4 | S-4 invariant | 11 | pending | append-only / single-use / 状態遷移 |
| 5 | S-5 depcruise | 11 | pending | depcruise.txt |
| 6 | S-6 violation 検出 | 11 | pending | dep-cruiser + ESLint |
| 7 | S-7 brand TS | 11 | pending | tsc-error.txt |
| 8 | S-8 bundle + fixture | 11 | pending | bundle.txt |
| 9 | summary 作成 | 11 | pending | manual-evidence.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 総括 |
| ドキュメント | outputs/phase-11/manual-evidence.md | 8 シナリオ summary |
| evidence | outputs/phase-11/evidence/* | 8 files |

## 完了条件

- [ ] S-1〜S-8 全て期待通り
- [ ] evidence が指定パスに保存
- [ ] 不合格 case があれば修正 plan が main.md に記載

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜9 が completed
- [ ] outputs/phase-11/* が配置済み
- [ ] artifacts.json の Phase 11 を completed に更新

## 次 Phase

- 次: Phase 12 (ドキュメント更新)
- 引き継ぎ事項: smoke evidence + boundary tooling 実証
- ブロック条件: いずれかが期待通りでなければ Phase 5 / 8 / 9 に戻る
