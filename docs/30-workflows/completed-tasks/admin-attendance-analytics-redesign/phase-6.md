[実装区分: 実装仕様書]

# Phase 6: テスト拡充（Fail Path / 回帰 Guard / 契約スナップショット）

> 前提: Phase 5 (GREEN: 機能実装完了) — Phase 4 で作成した最小 Happy Path テストが全て PASS している状態。本 Phase は fail-path / 退化防止 / contract snapshot / falsy ガードの網羅を追加し、本番投入耐性を確保する。
> 参照 SSOT: `_shared-context.md`（§3 機能仕様、§6 ファイル一覧、§7 既存テスト一覧、§8 実行コマンド）

---

## 1. Fail Path 追加対象

Phase 4/5 で Happy Path のみカバーした各レイヤに、以下の異常系を追加する。マトリクスで漏れを防ぐ。

### 1.1 API contract レベル（追記先: `apps/api/src/routes/admin/__tests__/attendance-analytics.contract.spec.ts`）

| ID | シナリオ | 期待挙動 | 対象エンドポイント |
| --- | --- | --- | --- |
| F-API-01 | **403 未認可**: `Authorization` ヘッダ無し / `isAdmin=false` の JWT | `403 {code:"ADMIN_FORBIDDEN"}`、レスポンス body に集計値が漏出しないこと | 全 8 エンドポイント (overview/by-session/ranking/trend/zone-distribution/sessions/:id/attendees/absentees/export) |
| F-API-02 | **500 内部エラー**: repository を `vi.spyOn(...).mockRejectedValue(new Error("boom"))` で強制失敗 | `500 {code:"ADMIN_INTERNAL"}`、stack trace を body に含めない | trend / zone-distribution / absentees |
| F-API-03 | **D1 timeout**: `setupD1()` の `prepare()` を `() => new Promise((_,r)=>setTimeout(()=>r(new Error("D1_TIMEOUT")),50))` でモック | `500 {code:"ADMIN_INTERNAL"}` を 1s 以内に返す（hang しない） | overview / trend |
| F-API-04 | **巨大 dataset**: `meeting_sessions` 5,000 行 + `member_attendance` 50,000 行を `setupD1` に投入 | 200 で返却、レスポンス時間 < 2s、`limit` clamp が 200 で効くこと | by-session / ranking |
| F-API-05 | **CSV 0 件**: 期間内 0 セッション | `200 text/csv; charset=utf-8`、body はヘッダ行のみ（`\n` 改行で終端）、`Content-Disposition` 付与 | export |
| F-API-06 | **period 逆順**: `periodFrom=2026-12-31&periodTo=2026-01-01` | 400 不可（§3 規約）。default fallback で `[periodTo, periodFrom)` に swap、または全期間として処理。エコーバックで正規化後の値を返す | 全フィルタ対応 5 エンドポイント |
| F-API-07 | **zone 未知値**: `zone=foo,1→10,bar` | unknown 値を silent drop し `1→10` のみ適用。エコーバック `zoneFilter:["1→10"]`。全 unknown の場合は全 zone 扱い | overview / by-session / ranking / trend / zone-distribution / absentees / export |

### 1.2 Repository レベル（追記先: `apps/api/src/repository/__tests__/attendance-analytics.spec.ts`）

| ID | シナリオ | 期待 |
| --- | --- | --- |
| F-REPO-01 | `deleted_at IS NOT NULL` の member が分母から除外されること | active のみカウント |
| F-REPO-02 | `periodFrom == periodTo`（空区間） | 全集計 0、エラー無し |
| F-REPO-03 | session の `held_on` が null | 集計対象外（trend bucket に含めない） |

### 1.3 Web vitest レベル（追記先: 各 `*.spec.tsx`）

| ID | シナリオ | 期待 |
| --- | --- | --- |
| F-WEB-01 | `safeServerFetch` が `{ ok: false, error: { code: "ADMIN_FETCH_403" } }` を返す | `AttendanceAnalyticsPage` 内の該当セクションだけ `AdminSectionErrorClient` へ degrade、他セクションは表示維持 |
| F-WEB-02 | 部分失敗 (trend だけ 500、他 200) | trend セクションのみエラー表示、KPI / table は描画 |
| F-WEB-03 | `useAttendanceFilters` に `periodFrom > periodTo` を渡す | 内部で swap、URL query にも正規化値で反映 |
| F-WEB-04 | `AttendanceExportButton` クリック時 fetch が reject | toast でエラー表示、ボタンは再有効化 (`disabled` 解除) |
| F-WEB-05 | `AttendanceDrilldownModal` が空 attendees/absentees を受領 | 「該当者なし」プレースホルダ表示、close ボタン動作 |

---

## 2. 回帰 Guard（既存画面が壊れていないこと）

新規 `features/admin/attendance/*` 追加・`packages/shared/src/zod/viewmodel.ts` 拡張による既存破壊を検出する。

### 2.1 対象ファイル（既存 spec、変更不要のまま再実行で PASS 維持）

- `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts`
- `apps/web/playwright/tests/visual/admin-dashboard.spec.ts`（dashboard top の visual snapshot）
- `apps/web/src/features/admin/members/__tests__/*.spec.tsx`（既存があれば全て）
- `apps/web/src/features/admin/tags/__tests__/*.spec.tsx`（既存があれば全て）
- `apps/api/src/routes/admin/dashboard.contract.spec.ts`（overview/by-session/ranking 既存 contract を破らない）

### 2.2 新規追加する回帰 guard

新規ファイル `apps/web/src/features/admin/__tests__/regression-admin-pages.spec.tsx`:

```ts
// 既存 admin 4 ページ（dashboard top / members / tags / sessions）が
// AttendanceAnalyticsPage 追加後も import に成功し render error を出さないことを smoke で確認
describe.each([
  ['dashboard', () => import('@/app/(admin)/admin/dashboard/page')],
  ['members',   () => import('@/app/(admin)/admin/members/page')],
  ['tags',      () => import('@/app/(admin)/admin/tags/page')],
  ['sessions',  () => import('@/app/(admin)/admin/sessions/page')],
])('regression: %s page module', (_, loader) => {
  it('imports without throwing', async () => {
    await expect(loader()).resolves.toBeTruthy();
  });
});
```

### 2.3 既存 zod 拡張の後方互換確認

新規ファイル `packages/shared/src/zod/__tests__/viewmodel-backcompat.spec.ts`:

- 既存 `AttendanceOverviewZ` に対し、Phase 5 で追加した `previousPeriodRate / periodFrom / periodTo / zoneFilter` を **省略した古い payload** でも `parse` が成功すること（`.optional()` で拡張されていることを assert）。失敗したら API レスポンス互換性破壊を検知。

---

## 3. 空文字 URL ガード（FB UT-W3-HTTP）— 全 falsy パターン

`safeServerFetch` / `fetchAdmin` / `apps/web/src/lib/admin/server-fetch.ts` 内で URL を組み立てる全箇所に対し、`baseUrl`/`path` が falsy のときに `fetch("")` を発射せず早期 `{ ok: false, error: { code: "ADMIN_FETCH_CONFIG" } }` を返すガードを確認する。

### 3.1 追記先

新規ファイル `apps/web/src/lib/admin/__tests__/url-guard-falsy.spec.ts`

### 3.2 検証マトリクス（全 falsy 7 パターン × 入力位置 3）

```ts
const FALSY_VALUES = [
  ['empty string',  ''],
  ['undefined',     undefined],
  ['null',          null],
  ['zero',          0],
  ['false',         false],
  ['NaN',           NaN],
  ['whitespace',    '   '],   // trim 後 empty
] as const;

const TARGETS = [
  'INTERNAL_API_BASE_URL env',
  'path argument',
  'concatenated url',
] as const;
```

各組み合わせで以下を assert:

1. `fetch` mock が **呼ばれない**（`expect(fetchSpy).not.toHaveBeenCalled()`）
2. 戻り値が `{ ok: false, error: { code: "ADMIN_FETCH_CONFIG", message: /.+/ } }` 形（message は非空）
3. `console.error` で 1 回だけログ（PII を含まないことを正規表現で確認: `/URL config missing/`）
4. Promise が **reject しない**（`expect(promise).resolves.toMatchObject(...)`）

### 3.3 実装ガード（Phase 5 で導入済みのはず、未導入なら REDDoD として戻す）

```ts
function isBlank(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (typeof v === 'number') return !Number.isFinite(v) || v === 0;
  if (typeof v === 'boolean') return v === false;
  return false;
}
```

---

## 4. Snapshot Test Pattern（IPC 相当の固定 contract）

本プロジェクトに Electron IPC は無いため、FB-IPC-SNAP-001/002 を **「Web ↔ API 間の HTTP contract」** に読み替えて適用する。

### 4.1 対象

新規ファイル `apps/api/src/routes/admin/__tests__/attendance-contract-snapshot.spec.ts`

### 4.2 スナップショット対象（凍結する payload 形状）

| Snapshot ID | エンドポイント | スナップ対象 |
| --- | --- | --- |
| SNAP-ATT-001 | `GET /admin/dashboard/attendance/overview` (Happy) | response keys / 型 sample / エコーバックキー有無（値は `expect.any(Number)`） |
| SNAP-ATT-002 | `GET /admin/dashboard/attendance/trend?granularity=month` | `granularity`, `buckets[0]` の key 集合 |
| SNAP-ATT-003 | `GET .../zone-distribution` | row の zone enum 値, `rate` が `number` |
| SNAP-ATT-004 | `GET .../sessions/:id/attendees` | `attendees[].zone` enum |
| SNAP-ATT-005 | `GET .../export?format=csv` | CSV 1 行目（ヘッダ）完全文字列、行区切り `\n` |
| SNAP-ATT-006 | 403 共通エラー形 | `{ code: "ADMIN_FORBIDDEN", message: expect.any(String) }` |

### 4.3 ルール

- `toMatchInlineSnapshot()` を使用（PR diff で contract 変更が可視化される）
- 値ではなく **形** を snapshot（数値・ID は `expect.any()` でマスク）
- snapshot 更新は **PR description に変更理由を明記**、Phase 12 ゲートで人間レビュー

---

## 5. testid 削除確認（FB-TASK-01/02）

本タスクは新規追加であり、既存 `data-testid` を削除する作業は含まれない。ただし新規コンポーネントへの testid 漏れ流入を防ぐため、以下の確認スクリプトを CI に組み込む。

### 5.1 確認スクリプト（新規）

`scripts/check-no-testid-in-attendance.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
TARGET="apps/web/src/features/admin/attendance"
if grep -rn "data-testid" "$TARGET" >/dev/null 2>&1; then
  echo "ERROR: data-testid found in $TARGET — use role/label-based query (RTL best practice)"
  grep -rn "data-testid" "$TARGET"
  exit 1
fi
echo "OK: no data-testid in $TARGET"
```

### 5.2 配線

`package.json` (root) の `lint` スクリプトに `&& bash scripts/check-no-testid-in-attendance.sh` を追加。Phase 5 で既に配線済みなら本 Phase では検証のみ。

---

## 6. 追加テストファイルリスト（Phase 6 で新規作成）

| # | パス | 目的 |
| --- | --- | --- |
| 1 | `apps/api/src/routes/admin/__tests__/attendance-contract-snapshot.spec.ts` | §4 contract snapshot |
| 2 | `apps/api/src/routes/admin/__tests__/attendance-analytics-failpath.spec.ts` | §1.1 F-API-01〜07（既存 happy spec を肥大化させない分離） |
| 3 | `apps/api/src/repository/__tests__/attendance-analytics-edgecase.spec.ts` | §1.2 F-REPO-01〜03 |
| 4 | `apps/web/src/features/admin/attendance/__tests__/AttendanceAnalyticsPage.failpath.spec.tsx` | §1.3 F-WEB-01/02 |
| 5 | `apps/web/src/features/admin/attendance/__tests__/useAttendanceFilters.edgecase.spec.ts` | §1.3 F-WEB-03 |
| 6 | `apps/web/src/features/admin/attendance/__tests__/AttendanceExportButton.failpath.spec.tsx` | §1.3 F-WEB-04 |
| 7 | `apps/web/src/features/admin/attendance/__tests__/AttendanceDrilldownModal.empty.spec.tsx` | §1.3 F-WEB-05 |
| 8 | `apps/web/src/lib/admin/__tests__/url-guard-falsy.spec.ts` | §3 falsy URL guard |
| 9 | `apps/web/src/features/admin/__tests__/regression-admin-pages.spec.tsx` | §2.2 既存ページ smoke |
| 10 | `packages/shared/src/zod/__tests__/viewmodel-backcompat.spec.ts` | §2.3 zod 後方互換 |
| 11 | `scripts/check-no-testid-in-attendance.sh` | §5 testid 検査 |

合計 **新規 10 spec + 1 script**。

---

## 7. 実行コマンド + 期待件数

### 7.1 個別実行（開発中）

```bash
# API fail-path + snapshot
pnpm --filter @ubm-hyogo/api test -- attendance-analytics-failpath
pnpm --filter @ubm-hyogo/api test -- attendance-contract-snapshot
pnpm --filter @ubm-hyogo/api test -- attendance-analytics-edgecase

# Web fail-path + guard
pnpm --filter @ubm-hyogo/web test -- attendance.*failpath
pnpm --filter @ubm-hyogo/web test -- url-guard-falsy
pnpm --filter @ubm-hyogo/web test -- regression-admin-pages
pnpm --filter @ubm-hyogo/web test -- viewmodel-backcompat

# testid 検査
bash scripts/check-no-testid-in-attendance.sh
```

### 7.2 全実行（Phase ゲート）

```bash
pnpm -w lint && pnpm -w build && pnpm -w test
```

### 7.3 期待件数

| Spec | 期待 PASS | 期待 FAIL |
| --- | --- | --- |
| `attendance-analytics-failpath.spec.ts` (F-API-01×8 + 02×3 + 03×2 + 04×2 + 05×1 + 06×5 + 07×7) | **28 PASS** | 0 |
| `attendance-contract-snapshot.spec.ts` | **6 PASS**（初回は snapshot 生成のため `--update` 必要） | 0 |
| `attendance-analytics-edgecase.spec.ts` | **3 PASS** | 0 |
| `AttendanceAnalyticsPage.failpath.spec.tsx` | **2 PASS** | 0 |
| `useAttendanceFilters.edgecase.spec.ts` | **3 PASS**（swap×1 / URL 反映×1 / null 入力×1） | 0 |
| `AttendanceExportButton.failpath.spec.tsx` | **2 PASS**（reject / 再有効化） | 0 |
| `AttendanceDrilldownModal.empty.spec.tsx` | **2 PASS** | 0 |
| `url-guard-falsy.spec.ts` (7 falsy × 3 位置 × 4 assert)  | **21 PASS**（it() 単位 = 7×3） | 0 |
| `regression-admin-pages.spec.tsx` | **4 PASS** | 0 |
| `viewmodel-backcompat.spec.ts` | **1 PASS** | 0 |
| **合計（本 Phase 追加分）** | **72 PASS** | **0 FAIL** |

加えて Phase 4 既存 Happy Path（推定 ~25 spec）も維持して PASS、`pnpm -w test` 全体で **既存件数 + 72 増 / FAIL 0**。

---

## 8. DoD（Phase 6 完了条件）

- [ ] §6 の新規 10 spec + 1 script が全てリポジトリに存在
- [ ] §7.2 `pnpm -w lint && pnpm -w build && pnpm -w test` が **FAIL 0** で完走
- [ ] §7.3 期待件数表の **72 PASS** を実測ログで確認（CI ログを PR にリンク）
- [ ] §3 falsy URL ガード: 7 パターン × 3 位置すべてで `fetch` が呼ばれないことを assert で確認
- [ ] §4 snapshot 6 件が生成され、`*.snap` または `toMatchInlineSnapshot` の差分が PR 上で可視
- [ ] §2.2 既存 admin 4 ページの smoke が PASS（破壊検知ゲート稼働）
- [ ] §2.3 `AttendanceOverviewZ` 後方互換 spec が PASS（旧 payload 受領可）
- [ ] §5 `scripts/check-no-testid-in-attendance.sh` を `pnpm -w lint` から呼び出し、`features/admin/attendance` 配下に `data-testid` が 0 件であることを CI が保証
- [ ] §1.1 F-API-03 (D1 timeout) が **1s 以内** に応答することをタイマー assert で測定
- [ ] §1.1 F-API-04 (巨大 dataset) が **2s 以内** に応答することを測定（ローカル `vitest --reporter=verbose` で時間ログ確認）
- [ ] CSV エクスポート 0 件時の `Content-Disposition: attachment; filename="attendance-*.csv"` ヘッダ付与を assert
- [ ] 全 fail-path で stack trace / SQL / token / member 個人情報が response body・ログに **漏出しない** ことを正規表現 assert で確認
- [ ] Phase 7（lint/format ゲート）への引き継ぎメモを `_shared-context.md` §10 に追記（snapshot 更新有無、追加 spec 件数、所要時間実測）
