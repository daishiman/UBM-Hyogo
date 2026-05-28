[実装区分: 実装仕様書]

# Phase 7: カバレッジ確認

**依存**: Phase 6（テスト実装・グリーン化）完了。
**前提**: `_shared-context.md` §6 に列挙された変更ファイルのみを対象とする（FB BEFORE-QUIT-002 / Feedback 5: リポジトリ全体ではなく本ワークフローで触れたファイルに限定）。
**目的**: 本ワークフローで追加・変更したコードの line / branch coverage を実測し、品質ゲートを満たすことを定量的に証明する。

---

## 1. 対象ファイル限定（Scope）

### 1.1 対象（`_shared-context.md` §6 新規 + 編集 のみ）

**Web (vitest)**:
- `apps/web/src/features/admin/attendance/components/*.tsx`（12 ファイル）
- `apps/web/src/features/admin/attendance/hooks/useAttendanceFilters.ts`
- `apps/web/src/features/admin/attendance/lib/format-attendance.ts`
- `apps/web/src/lib/admin/fetch-attendance.ts`
- `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`（編集）

**API (vitest + Miniflare/D1)**:
- `apps/api/src/routes/admin/attendance-trend.ts`
- `apps/api/src/routes/admin/attendance-zone-distribution.ts`
- `apps/api/src/routes/admin/attendance-session-detail.ts`
- `apps/api/src/routes/admin/attendance-absentees.ts`
- `apps/api/src/routes/admin/attendance-export.ts`
- `apps/api/src/repository/attendance-analytics.ts`
- `apps/api/src/lib/csv-export.ts`

**Shared**:
- `packages/shared/src/zod/admin-attendance.ts`
- `packages/shared/src/types/admin-attendance.ts`（型のみ・実測対象外、`coverage.exclude` に追加）

### 1.2 除外（NG）

- `_shared-context.md` §6 に列挙されていないファイル
- 既存の無関係コード（過去の admin ダッシュボード／members／permits 等）
- 自動生成物（drizzle migrations, generated zod, OpenAPI stubs）
- 型のみファイル（`*/types/*.ts` で実行コードを含まないもの）

### 1.3 限定の実装方法

各 `vitest.config.ts`（web / api）の `test.coverage.include` を本 Phase 用に上書きしたプロファイルを用意し、`pnpm test:coverage:d1` / `pnpm test:coverage` が **本ワークフローの対象ファイルだけを集計する**ようにする。既存全体カバレッジ設定は維持し、Phase 7 専用に `--config vitest.config.coverage-phase7.ts` を追加するか、`--coverage.include` CLI フラグでスコープを縛る。

---

## 2. カバレッジ実測ターゲット

| 区分 | line | branch | function | 備考 |
|------|------|--------|----------|------|
| 変更関数（components / routes / repository / hooks の export） | **100%** | **100%** | **100%** | 原則。未到達は §5 の除外基準でのみ許容 |
| グラフ描画内部（`AttendanceTrendChart` / `AttendanceZoneDistributionChart` の Recharts ラッパ部） | **90%+** | **85%+** | **90%+** | DOM 計測不能な内部レンダラは除外可 |
| CSV 内部（`csv-export.ts` の文字列整形ロジック） | **90%+** | **85%+** | **90%+** | エスケープ分岐は必須・改行コード分岐は除外可 |
| Zod schema (`admin-attendance.ts`) | **100%** | **100%** | – | refine / superRefine の全分岐 |

集計結果が上記を下回る場合、Phase 7 は **未達** として Phase 6 へ差し戻す。

---

## 3. 実行コマンド

```bash
# 1. API (Miniflare + D1)
pnpm --filter @ubm-hyogo/api test:coverage:d1 \
  --coverage.include='src/routes/admin/attendance-*.ts' \
  --coverage.include='src/repository/attendance-analytics.ts' \
  --coverage.include='src/lib/csv-export.ts' \
  --coverage.reporter=text --coverage.reporter=json-summary --coverage.reporter=lcov

# 2. Web (vitest + jsdom)
pnpm --filter @ubm-hyogo/web test -- --coverage \
  --coverage.include='src/features/admin/attendance/**' \
  --coverage.include='src/lib/admin/fetch-attendance.ts' \
  --coverage.include='app/(admin)/admin/dashboard/attendance/page.tsx' \
  --coverage.reporter=text --coverage.reporter=json-summary --coverage.reporter=lcov

# 3. Shared
pnpm --filter @ubm-hyogo/shared test -- --coverage \
  --coverage.include='src/zod/admin-attendance.ts' \
  --coverage.reporter=text --coverage.reporter=json-summary
```

`--coverage.thresholds.lines=100` 等のしきい値フラグを CI で付与し、不足時は exit 1 で落とす（後述 Phase 9 の CI 配線で恒久化）。

---

## 4. 成果物の置き場

すべて `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/outputs/phase-7/` 配下に出力する。

```
outputs/phase-7/
├─ coverage-summary.md         # ★ 人間可読サマリ（本 Phase の主成果物）
├─ api/
│  ├─ coverage-summary.json    # vitest json-summary
│  └─ lcov.info
├─ web/
│  ├─ coverage-summary.json
│  └─ lcov.info
├─ shared/
│  └─ coverage-summary.json
└─ uncovered-justification.md  # §5 の除外判定一覧（除外ゼロなら空セクションで残す）
```

`coverage-summary.md` には以下を必須記載:
- 実行日時 / commit SHA
- 上記 §2 の表形式で実測値と判定（✅/❌）
- 対象ファイルごとの line/branch/func の数値テーブル
- 未カバー箇所一覧と `uncovered-justification.md` への参照

---

## 5. 未カバー箇所の判定基準

未カバー行が残った場合、以下のルールで **除外可** / **必須カバー** を判定し、`uncovered-justification.md` に1件ずつ記録する。

### 5.1 除外可（justify すれば OK）

- **防御的 fallback**: `?? defaultValue` / `if (!x) return []` 等、型上は到達不能だが実行時安全のために残す分岐
- **`unreachable`/`assertNever` 系**: discriminated union の網羅性チェック
- **環境依存**: `if (process.env.NODE_ENV === 'production')` 等、テスト環境で再現困難な分岐
- **Recharts/Recoil 等の third-party レンダラ内部呼び出し**: ラッパ境界をテストしていれば内部分岐は除外可

### 5.2 必須カバー（除外不可）

- **エラーパス**: `throw` を含む分岐、401/403/404/422/500 を返す HTTP ハンドラ
- **Zod schema の refine / superRefine 全分岐**
- **CSV エスケープ**: ダブルクォート・カンマ・改行を含むセルの処理
- **権限チェック**: admin/non-admin 分岐、`assertAdminContext` の両側
- **空データ / ゼロ件分岐**: KPI 計算の分母 0、トレンドゼロ件等の UI 表示分岐
- **フィルタ境界**: 期間 from/to 同日、ゾーン未選択（all）、検索クエリ空文字

`uncovered-justification.md` の各エントリ:

```
- file: apps/api/src/routes/admin/attendance-trend.ts
  lines: 87-89
  category: 防御的 fallback
  reason: zod parse 後に到達不能だが型ガードのため残置
  reviewer: <human/AI 判定者>
```

---

## 6. DoD（Definition of Done）

- [ ] `_shared-context.md` §6 列挙の全対象ファイルが §3 のコマンドで計測されている（除外設定漏れなし）
- [ ] §2 の数値ターゲットを **全カテゴリで達成** している（または §5 ルールに基づき justify 済み）
- [ ] `outputs/phase-7/coverage-summary.md` が生成され、commit SHA・実行日時・実測テーブル・判定（✅/❌）が記載されている
- [ ] `outputs/phase-7/{api,web,shared}/coverage-summary.json` と `lcov.info` がコミットされている
- [ ] 未カバー行はすべて `uncovered-justification.md` に分類・理由付きで列挙され、§5.2「必須カバー」カテゴリの未カバーは **ゼロ**
- [ ] CI ローカル再現用に `pnpm` ワンライナーが `coverage-summary.md` 冒頭に記録されている（Phase 9 で CI 配線へ昇格）
- [ ] Phase 7 対象外のファイル（既存 admin 機能等）のカバレッジ数値は **本 Phase の合否判定に含めない**ことが summary に明記されている
