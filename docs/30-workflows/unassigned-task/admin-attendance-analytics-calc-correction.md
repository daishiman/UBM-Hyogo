# 出席分析の計算意味論是正（出席回数帯境界・延べ/unique・全体出席率）

## メタ情報

```yaml
task_id: admin-attendance-analytics-calc-correction
task_name: 出席分析の計算意味論是正（出席回数帯境界・延べ/unique・全体出席率）
category: 改善
target_feature: 管理者向け出席分析 API
priority: 中
scale: 中規模
status: 未実施
source_phase: Phase 12
created_date: 2026-06-03
dependencies: [admin-attendance-dashboard-ux]
spec_path: docs/30-workflows/unassigned-task/admin-attendance-analytics-calc-correction.md
issue_number: 1101
```

| 項目 | 値 |
| --- | --- |
| 実装区分 | **[実装区分: 実装仕様書]** |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |
| 主変更対象 | `apps/api/src/repository/attendance-analytics.ts` |
| 親タスク | `docs/30-workflows/admin-attendance-dashboard-ux/` |
| 親 Phase 12 実装ガイド | `docs/30-workflows/admin-attendance-dashboard-ux/outputs/phase-12/implementation-guide.md` |
| 親配下の検出元 spec | `docs/30-workflows/admin-attendance-dashboard-ux/unassigned-task-specs/admin-attendance-analytics-calc-correction.md` |

---

## 1. 背景 / 親タスクから分離した理由

親タスク `admin-attendance-dashboard-ux` は `apps/web` の出席ダッシュボード UI/UX 是正であり、`.attendance-*` CSS 未定義、SVG バー寸法未固定、出席回数帯ラベル、KPI hint の不整合を修正した。
その Phase 1 / Phase 3 / Phase 12 で、UI の見た目崩れとは別に `apps/api/src/repository/attendance-analytics.ts` の計算意味論に残課題があることが確定した。

ユーザー指示により、以下は親タスクから分離する。

| 分離対象 | 理由 |
| --- | --- |
| 出席回数帯 `zoneFromCount` の境界・命名 | 旧キー `"0→1" / "1→10" / "10→100" / "unknown"` が実際の範囲と一致せず、100 回以上が `unknown` に落ちる |
| `overallRate` の定義 | `attendCount / (totalSessions * totalMembers)` の分母・分子が延べ/unique の説明と混ざりやすく、実態の説明が不足している |
| unique 指標の扱い | trend 側には `unique_member_count` の前例があるが、overview KPI では延べ出席数と unique 出席者数が整理されていない |

親タスクは「現行境界に忠実な UI ラベル」までで完了済み。本タスクは API/shared/web/doc/test を同じ変更セットで揃え、表示と値の契約を再定義する。

## 2. 問題詳細

`apps/api/src/repository/attendance-analytics.ts` の `zoneFromCount` は、現在次の意味を持つ。

| 旧 zone キー | 実際の分類 | 問題 |
| --- | --- | --- |
| `"0→1"` | 0 回 | 1 回を含むように読める |
| `"1→10"` | 1〜9 回 | 10 回を含むように読める |
| `"10→100"` | 10〜99 回 | 100 回を含むように読める |
| `"unknown"` | 100 回以上 | 正常な高頻度帯が「不明」に分類される |

また `overallRate` は延べ出席数を全セッション数と現在 active member 数で割る形になっており、期間内に出席可能だった母集団、退会者、unique 出席者数の説明が曖昧である。

## 3. スコープ（含む / 含まない）

### 含む

- `apps/api/src/repository/attendance-analytics.ts` の `zoneFromCount` 境界・命名の再設計。
- `overallRate` の定義見直し、延べ率 / unique 率の役割整理、必要な unique 指標の追加。
- `packages/shared/src/zod/admin-attendance.ts` の `AttendanceZone` enum / overview schema の追従。
- `apps/web/src/features/admin/attendance/lib/format-attendance.ts` の `ZONE_LABEL` / `ZONE_HELP` 追従。
- `docs/00-getting-started-manual/specs/01-api-schema.md` の Zone 派生・集計母数仕様の更新。
- attendance analytics 関連の focused test 更新・追加。

### 含まない

- 親タスクで完了済みの CSS レイアウト復旧、SVG バー楕円修正、見方ガイド UI の再設計。
- D1 schema migration。
- Google Form schema、endpoint path、HTTP method の変更。
- 新規 endpoint の追加。
- staging deploy、commit、push、PR。これらはユーザー承認後の Phase 13 作業とする。

## 4. 変更対象候補

| パス | 変更内容 |
| --- | --- |
| `apps/api/src/repository/attendance-analytics.ts` | `zoneFromCount`、`normalizeZone`、overview rate / unique helper を更新 |
| `packages/shared/src/zod/admin-attendance.ts` | `AttendanceZoneZ` と overview response schema を更新 |
| `apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts` | 境界値・normalize の focused test を更新 |
| `apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts` | overview rate / zone distribution の repository test を更新 |
| `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 新 enum / 新境界に合わせてラベル・凡例を更新 |
| `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` | UI ラベル追従 test を更新 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | API 仕様の Zone 派生・集計母数を更新 |

## 5. 設計方針

- shared zod schema を API/web 境界の正本として、API の返却値、web の表示ラベル、仕様 doc、test の 4 面を同時更新する。
- API enum は機械可読キーへ寄せ、日本語表示は web 側 `ZONE_LABEL` で持つ。
- `unknown` は正常な「100 回以上」ではなく、異常値・分類不能のフォールバック専用に戻す。
- `overallRate` は延べ率として定義を明確化し、unique 出席者数 / unique 出席率が必要な場合は additive field として追加する。
- D1 は read-only SELECT のみ。migration や mutation は行わない。

## 6. 受け入れ基準

- [ ] `100 回以上` 相当の正常値が `unknown` に分類されない。
- [ ] 旧矢印 enum 値（`"0→1"`, `"1→10"`, `"10→100"`）が API/web/shared から消えている、または互換入力として残す場合は明示的にテストされている。
- [ ] `overallRate` の分母・分子・延べ/unique の役割がコード、schema、仕様 doc、UI ラベルで一致している。
- [ ] `AttendanceZoneZ` と `zoneFromCount` の返り値が一致している。
- [ ] 親タスクで追加された `ZONE_LABEL` / `ZONE_HELP` が新境界に追従している。
- [ ] focused vitest、typecheck、lint が PASS している。
- [ ] D1 migration、endpoint path/method、Google Form schema の差分がない。

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/attendance-analytics.ts` と `packages/shared/src/zod/admin-attendance.ts`
- 症状: zone enum は API の内部分類、shared schema、web のフィルタ・ラベルにまたがるため、1 ファイルだけ直すと UI 表示と API 値が静かに乖離する。
- 解決策: Phase 1 で `rg -n '"0→1"|"1→10"|"10→100"|AttendanceZone' apps/api apps/web packages/shared docs/00-getting-started-manual/specs/01-api-schema.md` を実行し、更新対象を先に棚卸しする。
- 対象: `overallRate` / `attendCount` / unique 指標
- 症状: 「期間内出席者数」という UI 文言と API の実値が延べ出席数か unique 出席者数かで混同しやすい。親タスクでは UI 側で延べ表記へ補正したが、API 側の意味論はまだ未整理。
- 解決策: 延べ率と unique 率を同じ名前で扱わず、DoD に「コード・schema・doc・UI ラベルの 4 面一致」を入れる。
- 参照: `docs/30-workflows/admin-attendance-dashboard-ux/outputs/phase-12/implementation-guide.md`、`docs/30-workflows/admin-attendance-dashboard-ux/outputs/phase-12/unassigned-task-detection.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| enum 値変更で API と web の契約が破綻する | `packages/shared/src/zod/admin-attendance.ts` を正本に API/web/test を同時更新し、旧値 grep を gate にする |
| `overallRate` の定義変更で既存 dashboard 数値が大きく変わる | Phase 1 で現行定義・新定義・期待ユーザー意味を表にし、延べ率/unique 率を別名で扱う |
| 退会者・期間外入会者の扱いが膨らみすぎる | 本タスクでは最小実装を「定義明確化 + unique 指標 + zone 是正」に固定し、母集団の厳密化が必要なら follow-up に分離する |
| 親タスクの UI ラベルが旧境界に残る | `format-attendance.ts` と `format-attendance.spec.ts` を本タスクの変更対象に含める |

## 検証方法

### 事前棚卸し

```bash
rg -n '"0→1"|"1→10"|"10→100"|AttendanceZone|overallRate|unique_member_count' \
  apps/api apps/web packages/shared docs/00-getting-started-manual/specs/01-api-schema.md
```

期待: enum / rate / unique に関係する変更対象が漏れなく列挙される。

### 単体・契約検証

```bash
mise exec -- pnpm exec vitest run --root=. \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts
```

期待: 新境界、normalize、overallRate、unique 指標、UI ラベル追従の focused test が PASS。

### 全体検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
git diff --name-only -- apps/api/migrations apps/api/src/routes
```

期待: typecheck / lint PASS。D1 migration 差分なし。route path / method の不要変更なし。

## 参照

- 親 workflow: `docs/30-workflows/admin-attendance-dashboard-ux/`
- 親 Phase 12 実装ガイド: `docs/30-workflows/admin-attendance-dashboard-ux/outputs/phase-12/implementation-guide.md`
- 親未タスク検出: `docs/30-workflows/admin-attendance-dashboard-ux/outputs/phase-12/unassigned-task-detection.md`
- 親配下の詳細 spec: `docs/30-workflows/admin-attendance-dashboard-ux/unassigned-task-specs/admin-attendance-analytics-calc-correction.md`
