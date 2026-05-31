# Phase 7: カバレッジ

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- 前 Phase: 6（回帰確認） / 次 Phase: 8（リファクタリング）
- 実装区分: **実装仕様書**（CONST_004 判定根拠は `index.md` 参照）
- coverage 閾値: `apps/web` で Statements/Branches/Functions/Lines **>=80%**（workspace 既定）
- 検証経路: `mise exec -- pnpm --filter @ubm-hyogo/web test --run --coverage` + `bash scripts/coverage-guard.sh` exit 0

## 目的

Phase 5 で書き換えた `apps/web/app/(admin)/layout.tsx`（およびフォールバック採用時の
`apps/web/src/lib/admin/schema-diff-count.ts`）の全分岐を、Phase 4 の TC-01〜08 で網羅する。
`apps/web` の coverage が Statements/Branches/Functions/Lines >=80% を満たし、`coverage-guard.sh` が exit 0 になることを確認する（AC-10）。

## 実行タスク

- タスク1: `layout.tsx` の分岐（null / non-admin / admin × fetch ok / fetch fail）を列挙し、TC へマップする。
- タスク2: concern × command の coverage matrix を作成する。
- タスク3: フォールバック helper 採用時の純関数 coverage を確認する。
- タスク4: 閾値 >=80% と `coverage-guard.sh` exit 0 を確認する。

## layout.tsx 分岐網羅マトリクス

`AdminLayout` の制御フローは「session 判定 2 分岐 × schemaDiffCount fetch 2 状態」で構成される。

| 分岐 ID | 条件 | 経路 | 網羅 TC | 期待 |
| --- | --- | --- | --- | --- |
| B-1 | `session === null` | `redirect("/login?next=/admin")` で early return | TC-01 | redirect throw・以降の render に到達しない |
| B-2 | `session.isAdmin === false` | `redirect("/login?gate=forbidden")` で early return | TC-02 | redirect throw |
| B-3 | `session.isAdmin === true` かつ fetch ok（queued あり） | shell render + warn badge | TC-03 / TC-04 / TC-05 | shell mount・13 item・badge `2` |
| B-4 | `session.isAdmin === true` かつ fetch ok（queued 0） | shell render + badge 非表示 | TC-03（beforeEach の `items:[]`） | badge 非表示 |
| B-5 | `session.isAdmin === true` かつ fetch fail | shell render + count=0（badge 非表示） | TC-06 | render 成功・数字なし |

> B-3〜B-5 の fetch 状態は、schemaDiffCount SSOT を Task A の `SidebarShellServer` に委譲した場合は **shell 内部** で評価される。layout.spec が `SidebarShellServer` を実体で読む（Phase 4 mock 方針 A）なら、`safeServerFetch` mock の ok/fail 切替が shell 内 fetch にも効き、B-3〜B-5 は layout.spec から網羅できる。mock 方針 B（stub）の場合、B-3〜B-5 の fetch 分岐は Task A spec 側で網羅し、layout.spec は B-1/B-2/B-3（shell mount のみ）を担う。**Phase 5 で確定した方針に応じて網羅元を記録する**。

## フォールバック helper 採用時の coverage（TECH-M-01）

`apps/web/src/lib/admin/schema-diff-count.ts` を新設した場合、純関数 `countQueuedDiffs` と `loadSchemaDiffCount` の分岐を
`schema-diff-count.spec.ts` で網羅する。

| 関数 | 分岐 | 網羅ケース |
| --- | --- | --- |
| `countQueuedDiffs` | queued あり | `items:[{status:"queued"},{status:"queued"},{status:"resolved"}]` → `2` |
| `countQueuedDiffs` | queued なし / 空配列 | `items:[]` → `0` |
| `loadSchemaDiffCount` | fetch ok | mock `safeServerFetch` ok → queued count |
| `loadSchemaDiffCount` | fetch fail | mock `safeServerFetch` `{ ok:false }` → `0` |

> 第一案（Task A 内算出）を採用した場合、本 helper は新設しないため本セクションは N/A（Phase 6 で記録した SSOT 採否に従う）。

## coverage matrix（concern × command）

| concern | 検証 command | coverage 対象 |
| --- | --- | --- |
| layout 分岐（B-1〜B-5） | `mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/\(admin\)/layout.spec.tsx --coverage` | `apps/web/app/(admin)/layout.tsx` |
| helper 純関数（フォールバック時） | `mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/lib/admin/schema-diff-count.spec.ts --coverage` | `apps/web/src/lib/admin/schema-diff-count.ts` |
| workspace 全体閾値 | `mise exec -- pnpm --filter @ubm-hyogo/web test --run --coverage` | `apps/web` 全体 |
| coverage gate | `bash scripts/coverage-guard.sh` | exit 0 を要求 |

## 閾値

- `apps/web`: Statements **>=80%** / Branches **>=80%** / Functions **>=80%** / Lines **>=80%**（workspace 既定）。
- `bash scripts/coverage-guard.sh` exit 0。
- 削除した 6 ファイル（`AdminSidebar*` 系）は coverage 母数から外れる。削除により coverage が一時的に変動する可能性があるため、`apps/web` 全体閾値で最終判定する（個別ファイル 100% を要求しない）。

## 実行手順

### ステップ1: layout.tsx の分岐列挙と TC マップ（完了・上表）

### ステップ2: coverage 実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run --coverage
```

`layout.tsx` の B-1〜B-5 が cover されていること、未到達行が無いことを coverage レポートで確認する。

### ステップ3: helper coverage（フォールバック採用時のみ）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/lib/admin/schema-diff-count.spec.ts --coverage
```

### ステップ4: gate 確認

```bash
bash scripts/coverage-guard.sh
echo "exit=$?"   # → exit=0 を要求
```

## 参照資料

- phase-4.md（TC-01〜08 / mock 方針 A/B） / phase-5.md（layout 新形・SSOT 分岐） / phase-6.md（SSOT 採否の記録）
- phase-3.md（TECH-M-01 = schemaDiffCount SSOT 追跡）
- `scripts/coverage-guard.sh`（実在）
- coverage 標準: `.claude/skills/task-specification-creator/references/coverage-standards.md`

## 統合テスト連携

- layout.spec の TC-01〜08 が layout.tsx の B-1〜B-5 を網羅する。
- フォールバック helper を新設した場合、その単体 spec が helper 分岐を網羅し `apps/web` 全体閾値に寄与する。

## 多角的チェック観点（AIが判断）

- redirect 分岐（B-1/B-2）は throw で early return するため、`render` 後の DOM assert と分けて網羅する（カバレッジは throw 到達で計上される）。
- fetch ok/fail（B-3〜B-5）の網羅元が layout.spec か Task A spec かを mock 方針に応じて明示し、二重計上・欠落のどちらも起こさない。
- 削除ファイルの coverage 変動に惑わされず、`apps/web` 全体の 4 指標 >=80% で判定する。
- placeholder（`getSchemaDiffCount`）由来の存在しない分岐を coverage 表に書かない。実在経路（`safeServerFetch` + queued filter）のみ。

## サブタスク管理

- 単一責務。サブタスク分割なし。

## 成果物

- 本 Phase: 分岐網羅マトリクス（B-1〜B-5）/ coverage matrix / 閾値結果（本ファイル + coverage レポート）。

## 完了条件

- [ ] `layout.tsx` の B-1〜B-5 を TC-01〜08 で網羅した
- [ ] フォールバック helper 採用時、`schema-diff-count.ts` の純関数分岐を網羅した（または第一案採用で N/A を記録した）
- [ ] `apps/web` の coverage が Statements/Branches/Functions/Lines >=80%
- [ ] `bash scripts/coverage-guard.sh` exit 0（AC-10）
- [ ] coverage 網羅元（layout.spec / Task A spec）を mock 方針に応じて記録した

## タスク100%実行確認【必須】

- [ ] 上記「完了条件」全項目を満たした
- [ ] AC-10（>=80% / coverage-guard exit 0）を本 Phase で充足した
- [ ] B-1〜B-5 の全分岐が網羅され、未到達分岐が無いことを coverage レポートで確認した

## 次Phase

Phase 8（リファクタリング）。
