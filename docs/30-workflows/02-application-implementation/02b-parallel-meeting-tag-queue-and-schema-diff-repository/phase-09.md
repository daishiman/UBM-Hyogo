# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 8 |
| 下流 | Phase 10 |
| 状態 | pending |

## 目的

型安全 / lint / test / 無料枠 / secret hygiene を quantitative に確認。

## 品質チェック

### 1. 型 / lint / test / dep-cruiser / bundle

| # | 項目 | コマンド | 期待 |
| --- | --- | --- | --- |
| Q-1 | typecheck | `pnpm --filter apps/api typecheck` | 0 error |
| Q-2 | lint | `pnpm --filter apps/api lint` | 0 |
| Q-3 | unit test | `pnpm --filter apps/api test repository` | 全 pass、coverage 95%+ |
| Q-4 | depcruise | `pnpm depcruise apps/api` | 0 violation |
| Q-5 | bundle size | `du -sh dist/index.js` | < 1MB |

### 2. 無料枠（D1）

| 操作 | 頻度 | reads/day | writes/day |
| --- | --- | --- | --- |
| `listMeetings` (admin / public stats) | 公開 trip + admin、200/day | 200 | 0 |
| `listRecentMeetings` (public stats) | top page、500/day | 500 | 0 |
| `listAttendanceBySession` | admin meetings、20/day | 20 | 0 |
| `addAttendance` | admin、5/day | 0 | 5 |
| `listAttendableMembers` | admin meetings、20/day（JOIN 1 回） | 20 | 0 |
| `listAllTagDefinitions` | admin tags、100/day | 100 | 0 |
| `listQueue("queued")` | admin tags、200/day | 200 | 0 |
| `transitionStatus` | admin tags、20/day | 0 | 20 |
| `getLatestVersion` | 起動時 / sync、100/day | 100 | 0 |
| `list (schemaDiff)` | admin schema、50/day | 50 | 0 |
| `enqueue (tagQueue)` | 03b sync、約 50/day | 0 | 50 |
| `enqueue (schemaDiffQueue)` | 03a sync、約 5/day | 0 | 5 |
| `upsertManifest` | 03a sync、約 1/day | 0 | 1 |
| `upsertField` | 03a sync、約 31/day | 0 | 31 |
| **合計** | | **1190 reads/day** | **112 writes/day** |
| **使用率** | | **0.24%** | **0.11%** |

無料枠内で十分。

### 3. Secret hygiene

| # | 項目 | 確認 |
| --- | --- | --- |
| S-1 | 新規 secret 導入なし | artifacts.json の `secrets_introduced: []` |
| S-2 | placeholder に実 secret なし | grep |
| S-3 | repository が直接 process.env を参照しない | env access via `apps/api/src/env.ts` |
| S-4 | fixture に実会員データなし | `m_001` 等ダミー |
| S-5 | wrangler binding `DB` のみ参照 | grep |

### 4. a11y

repository 層、N/A。view model に a11y 関連がある field は 04c / 06c へ申し送り。

### 5. 認可境界

| # | 項目 | 確認 |
| --- | --- | --- |
| Z-1 | tag 直接編集禁止 | tagDefinitions に write API 不在 |
| Z-2 | schema 集約 | schemaQuestions.updateStableKey は 07b workflow 経由のみ呼ぶ規約（route 層責務） |
| Z-3 | attendance 重複防止 | DB PK 制約 |
| Z-4 | 削除済み除外 | listAttendableMembers JOIN |

## 実行タスク

1. Q-1〜Q-5 を `outputs/phase-09/main.md`
2. 無料枠を `outputs/phase-09/free-tier.md`
3. secret hygiene を `outputs/phase-09/secret-hygiene.md`
4. a11y N/A 申し送り
5. 認可境界 Z-1〜Z-4 を main.md

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 5 runbook | sanity check 流用 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠 |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 10 | GO/NO-GO 根拠 |
| 09a (staging) | reality check |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 無料枠 | #10 | reads 0.24% / writes 0.11% |
| boundary | #5 | depcruise pass |
| tag 直接編集 | #13 | Z-1 |
| schema 集約 | #14 | Z-2 |
| attendance | #15 | Z-3, Z-4 |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | Q-1〜Q-5 | pending |
| 2 | 無料枠 | pending |
| 3 | secret | pending |
| 4 | a11y | pending |
| 5 | 認可境界 | pending |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-09/main.md | 総括 |
| outputs/phase-09/free-tier.md | 無料枠 |
| outputs/phase-09/secret-hygiene.md | secret |

## 完了条件

- [ ] Q-1〜Q-5 pass
- [ ] 無料枠 < 5%
- [ ] Secret hygiene OK

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 completed
- [ ] outputs/phase-09/* 配置済み
- [ ] artifacts.json の Phase 9 を completed

## 次 Phase

- 次: Phase 10
- 引き継ぎ事項: 品質結果 + 無料枠余裕
- ブロック条件: いずれか fail なら Phase 5/8 戻し
