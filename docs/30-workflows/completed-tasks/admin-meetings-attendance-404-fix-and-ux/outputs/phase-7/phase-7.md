**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 7: カバレッジ確認

`taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

Task A（proxy transport 統一）と Task B（出席管理 UI/UX 改善）で**変更した関数・ブロックに限定**してカバレッジを実測する。
全ファイル一律ではなく、変更箇所（transport 3 分岐 / 各 component の新挙動行）だけを measure 対象とする（BEFORE-QUIT-002 / Feedback 5）。
本フェーズは「測定の対象・コマンド・完了基準」を定義する仕様であり、実行は後続 03.実装.md が行う。

---

## 7.1 coverage 対象範囲（変更ファイルに限定）

| 区分 | パス | 測定する変更箇所 |
|------|------|----------------|
| measure 対象（A） | `apps/web/app/api/admin/[...path]/route.ts` | transport 選択分岐（binding / HTTP fallback / 500） |
| measure 対象（B1） | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 氏名解決 Map + 出席者表示行 |
| measure 対象（B2/B3） | `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | 出席人数バッジ + aria-label 導線 |
| measure 対象（B1/B2/B4） | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | attendedCounts 配線 / 導線テキスト |

> Phase 5 で編集するのは上記 4 ファイルのみ。`server-fetch.ts` / `env.ts` / `api.ts` / `apps/api/**` は不変のため
> **coverage 対象外**とし、include を上記 4 ファイルに絞る。全ファイル一律指定はしない。

### 対象範囲外（明示）

| 範囲外 | 理由 |
|------|------|
| `apps/web/src/lib/admin/server-fetch.ts` | 参照元（transport ロジックの模範）。本タスクで変更しない |
| `apps/web/src/lib/env.ts`（`getAuthEnv`） | `API_SERVICE` は公開済み。新アクセサを足さない |
| `apps/web/src/lib/admin/api.ts`（attendance パス） | api と一致済み。不変 |
| `apps/api/**` / D1 / Google Form | API contract・schema・Form 仕様は不変条件 #1 で不変 |
| `route.ts` の `requireAdmin` / `needsSyncAdminBearer` 既存ロジック | 既存ケースで covered 済（本タスクで退行させない検証のみ） |

---

## 7.2 Task A — transport 3 分岐の branch カバレッジ（必須）

proxy 修正の核心は transport 選択である。以下 3 分岐すべてが実行されることを branch coverage で確認する。

| 分岐 | 条件 | covered する Phase 4 / 6 ケース |
|------|------|------------------------------|
| ① service binding 経路 | `getAuthEnv().API_SERVICE` が存在（かつ test 隔離で undefined 化されない条件） | TC-A-binding（binding.fetch が呼ばれ upstream status を中継） |
| ② HTTP fallback 経路 | binding 無し かつ `INTERNAL_API_BASE_URL` あり（local dev / test） | TC-A-http（`fetch(base + path)` 経路。既存挙動の回帰） |
| ③ 500 fail-fast 枝 | binding 無し かつ URL 無し かつ非 local | TC-A-missing（`internal_api_base_url_missing` 500） |

> branch coverage の観点では、binding の **存在 / 不在 両枝**、および URL の **存在 / 不在 両枝**がいずれも 1 件以上のケースで実行されること。
> 上表 ①②③ で全枝を網羅する。`server-fetch.ts` と同じく **test/playwright かつ `INTERNAL_API_BASE_URL` あり時は binding を使わず HTTP へ落とす**隔離分岐を採る場合、その隔離条件も branch として測定対象に含める。

### A の不変ロジック（covered 済の確認のみ・新規ケース不要）

| 既存ブロック | 確認 |
|------|------|
| `requireAdmin()`（403 枝） | 既存ケースで covered。transport 変更で退行しないこと |
| `needsSyncAdminBearer`（sync bearer 付与 / token 欠落 500） | 既存ケースで covered |
| cookie / authorization / content-type 中継・`init.body = await req.text()`（GET/DELETE 除外）・upstream status/content-type 戻し | TC-A-binding / TC-A-http が両 method（GET と非 GET）を通すことで line covered |

---

## 7.3 Task B — 各 component 新挙動の line カバレッジ（必須）

| component | 新規 line | covered する Phase 4 / 6 ケース |
|------|------|------------------------------|
| `MeetingAttendanceDrawer.tsx` | `nameOf = useMemo(new Map(candidates.map(...)))` の構築行 | TC-B1（candidates あり時に Map 構築） |
| 〃 | 出席者行 `{nameOf.get(mid) ?? mid}`（解決成功枝） | TC-B1（氏名表示） |
| 〃 | 同行の `?? mid`（解決失敗 fallback 枝） | TC-B1-fallback（candidates 不在 memberId は memberId 表示） |
| `MeetingTimeline.tsx` | 出席人数バッジ要素（`count > 0` 枝） | TC-B2（N 名出席） |
| 〃 | バッジ `count === 0` 枝（「出席 未登録」） | TC-B2-zero（0 名カード） |
| 〃 | 見出し button の `aria-label`（導線） | TC-B3（aria-label が出席記録導線として識別可能） |
| `MeetingsClientShell.tsx` | `attendedCounts` 算出 / `MeetingTimeline` への prop 配線 | TC-B2（バッジ値が `attended` state 由来で stale でない） |
| 〃 | 運用導線テキスト（開催日 1 件以上時） | TC-B4（導線テキスト表示） |

> branch の要点: バッジは `count > 0` / `count === 0` の**両枝**、氏名解決は `get(mid)` の **成功 / fallback 両枝**が実行されること。

---

## 7.4 測定コマンド（ルートから vitest --coverage・対象指定）

本リポジトリの vitest 正経路はルートから config 明示（`apps/web/vitest.config.ts` は不在）。coverage を変更 4 ファイルに限定する。

```bash
# A: route handler transport 分岐
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  'apps/web/app/api/admin/[...path]/route.spec.ts' \
  --coverage \
  --coverage.include='apps/web/app/api/admin/[...path]/route.ts'

# B: 3 component の新挙動
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx \
  --coverage \
  --coverage.include='apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx' \
  --coverage.include='apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx' \
  --coverage.include='apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx'
```

> `--coverage.include` で計測を変更ファイルに限定し、無関係ファイルの低 coverage をノイズ化させない。
> provider 設定の都合で include 指定方法が異なる場合は `vitest.config` の `coverage.include` を一時上書きで同等の限定を行う。
> Phase 4 で対象 spec の正確なパス（既存有無）を `ls` で確定し、新規/編集を分岐する。

---

## 7.5 covered 確認手順

1. coverage サマリで上記 4 ファイルの **Branch % / Line %** を確認する。
2. テキスト or HTML レポート（`coverage/index.html` 等）で以下を目視確認する。
   - `route.ts`: binding 経路行 / HTTP fallback 行 / 500 return 行がいずれも緑。
   - `MeetingTimeline.tsx`: バッジ `count > 0` 行と `count === 0` 行が両方緑。
   - `MeetingAttendanceDrawer.tsx`: `nameOf.get(mid)` 成功表示行と `?? mid` fallback 行が両方緑。
   - `MeetingsClientShell.tsx`: `attendedCounts` 配線行と導線テキスト行が緑。
3. uncovered（赤/黄）があれば対応 Phase 4/6 ケースが分岐に到達していない。
   - binding 枝未到達 → mock で `API_SERVICE` を注入しているか確認。
   - 500 枝未到達 → binding/URL ともに無い env を組んだケースがあるか確認。
   - fallback 氏名枝未到達 → candidates に存在しない memberId の出席者ケースがあるか確認。

---

## 7.6 完了条件

| 項目 | 基準 |
|------|------|
| Task A branch coverage | binding / HTTP fallback / 500 の 3 分岐すべて covered（branch 両枝 = binding 有無・URL 有無） |
| Task B line coverage | バッジ（両枝）・氏名解決（成功/fallback 両枝）・aria-label 導線・attendedCounts 配線・導線テキストの追加行すべて covered |
| 既存 coverage 退行なし | `route.ts` の `requireAdmin` / `needsSyncAdminBearer` / header 中継、各 component の既存行が変更前より低下しないこと（特に Task A の admin gate・sync bearer を退行させない） |

> 未 cover の追加分岐があれば Phase 6 に戻りケースを補強する。
> coverage を満たしたら typecheck / lint（Phase 9）を経て後続 Phase へ進む。
