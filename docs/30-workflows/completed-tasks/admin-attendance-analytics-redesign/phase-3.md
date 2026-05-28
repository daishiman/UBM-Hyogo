[実装区分: 実装仕様書]

# Phase 3: 設計レビュー（自己 + 多角検証）

> 依存: Phase 2（設計仕様書）完了。`_shared-context.md` を SSOT として参照。
> 目的: Phase 2 の設計を 4 条件 × 多角思考で検証し、Phase 4（テスト先行実装）への進行可否を判定する。

---

## 1. レビュー観点チェックリスト（4 条件）

各条件 3-5 項目。OK/MINOR/MAJOR/CRITICAL を付与する。

### 1.1 価値性（ユーザー/運用が本当に得をするか）
- [ ] 404 解消が DoD 1 を満たす導線になっているか（root page → AttendanceAnalyticsPage 委譲が直結）
- [ ] KPI 4 枚が「全体出席率 / 総出席者 / 平均出席 / 前期間比トレンド」で運用判断に十分か
- [ ] 区画フィルタ（0→1/1→10/10→100）が現場の関心軸と一致しているか
- [ ] CSV エクスポートが「次の打ち手」に直結するカラム構成か
- [ ] AbsenteeAlert の `lastN=3` 既定値がフォロー業務の頻度と整合するか

### 1.2 実現性（決められた工期・スキルで完遂可能か）
- [ ] 新規 5 API + 既存 3 API 拡張が Hono ルート 1 PR 規模に収まるか
- [ ] `attendance-analytics.ts` 集計関数が D1（SQLite）の SQL 表現範囲で実装可能か（window 関数/CTE 制約）
- [ ] Recharts 等の追加依存が `package.json` 既存に存在するか / 追加要否
- [ ] Drilldown Modal の attendees/absentees 配列が大規模セッションでも payload 過大化しないか（pagination 要否）
- [ ] CSV ストリーミングが Cloudflare Workers の応答サイズ上限に収まるか

### 1.3 整合性（既存 SSOT と矛盾しないか）
- [ ] API 命名が `/admin/dashboard/attendance/*` 配下に閉じているか（新ベースパス禁止）
- [ ] Zod schema が `XxxZ` suffix + `.strict()` 規約に準拠
- [ ] `safeServerFetch<T>()` 経由を全 fetch で維持（D1 直叩き禁止）
- [ ] Sort 不変条件 `held_on DESC, session_id DESC` を全集計関数で保持
- [ ] Design Token `--ubm-*` のみ使用、HEX 直書きゼロ
- [ ] subpath export `@repo/shared/types/admin-attendance` が他 import と衝突しないか

### 1.4 運用性（変更耐性・観測性・degrade）
- [ ] partial failure 時に `AdminSectionError` で degrade（page error.tsx に throw しない）
- [ ] limit clamp / 不正クエリ default fallback（400 を返さない）が全新規 API に適用
- [ ] Admin gate 二段防御（middleware + requireAdmin）が新規ルートに漏れなく適用
- [ ] 404 原因仮説 5 件を Phase 5 で検証可能な形で残しているか（ログ/feature flag 等）
- [ ] CSV エクスポートに監査ログ要否を判断記録（read-only → 不要の根拠明示）

---

## 2. システム系セルフレビュー

### 2.1 因果ループ
- 期間/区画フィルタ変更 → URL query 更新 → Server Component 再フェッチ → 全 KPI/Chart/Table 同時更新。
- ループ閉鎖の確認: `useAttendanceFilters` が URL を SSOT とし、ローカル state とのダブルソース回避。

### 2.2 依存方向
- `apps/web` → `safeServerFetch` → `/api/admin/*` proxy → `apps/api` → `repository/attendance-analytics.ts` → D1。
- 逆流ゼロ。`packages/shared` は型のみで実装非依存。

### 2.3 責務境界
- `routes/admin/attendance-*.ts`: 入力 clamp + repository 呼出 + Zod parse のみ。
- `repository/attendance-analytics.ts`: SQL + 集計のみ、HTTP 非依存。
- `features/admin/attendance/components/*`: 表示専用、fetch は page 層が担当。
- `lib/admin/fetch-attendance.ts`: server-side aggregation のみ、コンポーネントから直 import しない。

### 2.4 state 所有権
- URL query: 期間/区画/limit/lastN（共有・bookmarkable）
- Server Component: 取得データ（SSR キャッシュ対象外）
- Drilldown Modal open 状態: client component local state（URL 非昇格）
- CSV ダウンロード進行状態: Button 内 local state

---

## 3. 戦略・価値系レビュー

### 3.1 Why now
staging で 404 が継続発生し、Admin 業務（出席フォロー）が停止中。プロトタイプ提示済みで仕様凍結条件が揃った。

### 3.2 Why this way
- 既存 3 API を拡張 + 新規 5 API 追加の「拡張 + 追加」二段構えで、既存契約破壊ゼロを担保。
- Server Component + URL query 駆動で SEO 不要 + bookmarkable + cache 効率の両立。
- Recharts/同等を採用する場合は SSR 互換性を最優先（Phase 4 で確定）。

### 3.3 トレードオン（両立）
- パフォーマンス vs 機能数: 8 API を `Promise.all` 並列で 1 round-trip 化 → degrade 時も部分表示。
- 拡張性 vs YAGNI: zone enum を `'0→1'|'1→10'|'10→100'|'unknown'` で確定、追加は migration 必要にして契約を硬く。

---

## 4. 問題解決系（KJ 法クラスタ & 優先順位）

### クラスタ A: 404 原因（最優先）
- A1 D1 データ0件パス、A2 INTERNAL_API_BASE_URL、A3 fixture fall-through、A4 deployment、A5 x-internal-auth。
- 優先度: A2 > A3 > A1 > A5 > A4（Phase 5 で順次検証）。

### クラスタ B: 集計性能
- B1 月別 trend window 関数、B2 zone 分布 GROUP BY、B3 absentee anti-join、B4 CSV ストリーミング。
- 優先度: B3 > B4 > B1 > B2。

### クラスタ C: UI 整合
- C1 KPI 配色 token、C2 Chart 凡例 i18n、C3 Table sort/pagination、C4 Modal a11y。
- 優先度: C4 > C3 > C1 > C2。

### クラスタ D: 契約進化
- D1 既存 overview に previousPeriodRate 追加で破壊有無、D2 zone enum 追加変更耐性、D3 export format=csv 以外の将来拡張。
- 優先度: D1 > D2 > D3。

---

## 5. ゲート判定基準

| ランク | 定義 | Phase 4 進行 |
| ---- | ---- | ---- |
| CRITICAL | DoD 直撃 / 既存契約破壊 / セキュリティ後退 / SSOT 矛盾 | 不可（Phase 2 へ差戻し） |
| MAJOR | 設計の前提覆し / 大規模手戻り懸念 / 性能/運用リスク高 | 不可（同 Phase 内で修正後再レビュー） |
| MINOR | 命名ドリフト / 既存パターン未追従 / コメント不足 / 軽微な責務漏れ | 可（Phase 4-5 で同時修正、TODO 化禁止＝即時修正） |
| OK | 指摘なし | 可 |

判定: **CRITICAL=0 かつ MAJOR=0** で Phase 4 進行可。

---

## 6. 想定 MINOR 指摘の事前リストアップ

| # | 指摘想定 | 事前修正方針 |
| - | -------- | ------------ |
| M1 | `fetch-attendance.ts` が `lib/admin/` 直下で `safe-server-fetch.ts` と並列。命名が `fetch-` prefix で既存 `safeServerFetch` 命名規約と不一致 | `safe-fetch-attendance.ts` にリネーム検討 or `features/admin/attendance/server/` 配下へ移設 |
| M2 | Zod schema を `packages/shared/src/zod/admin-attendance.ts` 新規 vs `viewmodel.ts` 追記で二重定義リスク | 全 attendance 系を `admin-attendance.ts` に集約、`viewmodel.ts` は re-export のみ |
| M3 | zone enum `'0→1'` 等の全角矢印が URL encode で煩雑 | API 層は `0to1` / `1to10` / `10to100` の slug、表示層で矢印に変換 |
| M4 | `previousPeriodRate` を `AttendanceOverviewZ` に追加すると既存 client の strict parse が破壊 | optional + default 0 で後方互換、もしくは v2 schema 分離 |
| M5 | Recharts コンポーネント名が `AttendanceTrendChart` で既存 `*Chart` 規約と整合するか未確認 | Phase 2 で `apps/web` 既存 Chart 系命名を grep 確認 |
| M6 | CSV ヘッダ名が日本語/英語混在の懸念 | `format-attendance.ts` でヘッダ定数化、英語 snake_case 固定 |
| M7 | AbsenteeAlert の `lastN` 既定値 3 が hardcode | `packages/shared/src/constants/admin-attendance.ts` に `DEFAULT_ABSENTEE_WINDOW = 3` |
| M8 | Drilldown modal の URL 非昇格 → 共有 URL で復元不可 | 受容（YAGNI）。判断根拠を design-review.md に明記 |
| M9 | test ファイル配置が `__tests__/` と `*.spec.ts` 並列の二系統 | 既存多数派に揃える（要 grep 確認、Phase 4 着手前に統一） |
| M10 | `requireAdmin` ミドルウェアを新規ルート 5 本に都度適用 vs router 単位適用 | 既存 `dashboard.ts` パターンに合わせ、ルート単位適用で統一 |

---

## 7. レビュー成果物の置き場

- 出力先: `outputs/phase-3/design-review.md`
- 構造:
  1. 観点別判定マトリクス（4 条件 × 各項目に OK/MINOR/MAJOR/CRITICAL）
  2. 指摘ごとのランク + 根拠 + 推奨対応 + 担当 Phase
  3. KJ クラスタ A-D の優先度確定
  4. ゲート判定結果（CRITICAL/MAJOR 件数）
  5. Phase 4 進行可否 + 残課題 TODO 一覧（即時修正対象は完了印）

補助成果物（任意）:
- `outputs/phase-3/risk-register.md`（クラスタ A-D のリスク登録）
- `outputs/phase-3/naming-grep.md`（M5/M9 命名 grep ログ）

---

## 8. Phase 4 進行可否判定

進行可条件（AND）:
1. `outputs/phase-3/design-review.md` 作成済み
2. CRITICAL = 0 件
3. MAJOR = 0 件
4. MINOR 指摘は Phase 4 開始前に即時修正 or 修正タスク化（TODO(human) 禁止＝AI が文脈から最適解で即決）
5. 404 原因仮説 A1-A5 が Phase 5 で検証可能な観測ポイントに紐付いている
6. 想定 MINOR M1-M10 のうち M2/M3/M4/M9/M10 は Phase 4 着手前に修正方針を確定

判定ログ: `outputs/phase-3/gate-decision.json`
```json
{
  "phase": 3,
  "decision": "PASS|HOLD|FAIL",
  "critical": 0,
  "major": 0,
  "minor": 0,
  "decidedAt": "ISO8601",
  "nextPhase": 4
}
```

PASS 時のみ Phase 4（テスト先行実装）へ進行。HOLD/FAIL 時は対応指摘を Phase 2 もしくは本 Phase 内で解消し再判定。
