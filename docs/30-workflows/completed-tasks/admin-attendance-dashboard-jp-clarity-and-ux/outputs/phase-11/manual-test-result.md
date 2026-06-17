# Phase 11 — 手動テスト結果 / VISUAL 証跡記録（テンプレート）

> ステータス: `implemented_local_visual_present_staging_pending` / visualScope=`VISUAL` / visualEvidence=`VISUAL`（`phase11-capture-metadata.json` の `status=captured_local_fixture`）。
> apps/web 実装・ローカル機械検証は完了。6 canonical screenshot capture は対象 route が admin 認証 gate 配下・Playwright config が staging 専用のためlocal fixture で取得済みで、authenticated staging baseline は user approval が必要なため pending。

---

## 0. 冒頭メタ — 証跡の主ソースと NON実capture理由（[Feedback 4]）

| 項目 | 内容 |
| --- | --- |
| 証跡の主ソース | **focused vitest 8 files / 23 tests PASS** + local Playwright fixture screenshot 6 canonical PNG（present）。既存追従（T-01〜T-06）+ After 文言固定の回帰テストが「日本語化が画面に反映されること」の一次証跡となる |
| 実行済み focused vitest | `AttendanceDetailTabs.spec.tsx` / `AttendanceZoneDistributionChart.spec.tsx` / `KpiPanel.spec.tsx` / `format-attendance.spec.ts` を含む `apps/web/src/features/admin/attendance/__tests__` 8 files / 23 tests PASS |
| staging screenshot pending 理由 | 6 canonical PNG は local fixture で取得済み。staging deploy / admin auth / staging baseline capture が user-gated のため capture 未実行 |

## 1. 証跡の主ソース一覧

| ソース | 内容 | 状態 |
| --- | --- | --- |
| VISUAL screenshot | `screenshot-plan.json` の 6 canonical 名（`/admin/dashboard/attendance` desktop 5 + mobile 1） | PASS（local fixture 6 PNG present） |
| 自動テスト（追従 + 回帰） | DetailTabs / ZoneDistribution / KpiPanel / format-attendance の After 文言固定 | PASS（8 files / 23 tests） |
| token gate | `verify-design-tokens`（HEX 0 件・新規 token 0） | PASS（91 tracked） |
| 残存 grep | 英語・専門語残存確認 | PASS（UI-facing 旧文言なし。識別子/test 名の residual は対象外） |

## 2. screenshot 記録表

| # | canonical 名 | TC-ID | 証跡 | 取得 | 結果（PASS/FAIL） | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| ① | `attendance-dashboard-full-jp.png` | TC-V-01 | `screenshots/attendance-dashboard-full-jp.png` | [x] | PASS | 3 ゾーン全体・日本語見出し |
| ② | `attendance-overview-zone-jp.png` | TC-V-02 | `screenshots/attendance-overview-zone-jp.png` | [x] | PASS | 全体の状況ゾーン |
| ③ | `attendance-trend-zone-jp.png` | TC-V-03 | `screenshots/attendance-trend-zone-jp.png` | [x] | PASS | 出席の移り変わりゾーン |
| ④ | `attendance-detail-tabs-jp.png` | TC-V-04 | `screenshots/attendance-detail-tabs-jp.png` | [x] | PASS | くわしい一覧タブ |
| ⑤ | `attendance-filter-bar-jp.png` | TC-V-05 | `screenshots/attendance-filter-bar-jp.png` | [x] | PASS | フィルタ / 書き出し |
| ⑥ | `attendance-dashboard-mobile-jp.png` | TC-V-06 | `screenshots/attendance-dashboard-mobile-jp.png` | [x] | PASS | mobile 1 カラム |

## 3. 手動確認チェックリスト（local fixture capture）

### 3.1 日本語見出しの表示（AC-1 / AC-2）

- [x] eyebrow が「管理 / ダッシュボード」（ADMIN / DASHBOARD でない）
- [x] 3 ゾーン h2 が「全体の状況」「出席の移り変わり」「くわしい一覧」（PRIMARY/TREND/DETAIL でない）
- [x] DETAIL タブが「開催回ごと」「会員別」「出席が多い順」（セッション別/TOP10 でない）
- [x] 期間プリセットが「3か月 / 6か月 / 1年」（3M/6M/1Y でない）
- [x] 書き出しリンクが「表計算ファイルで書き出す」（CSVエクスポート でない）

### 3.2 専門語の消失（AC-3）

- [x] 「ユニーク出席率」→「一度でも参加した人の割合」
- [x] 「トレンド」→「出席の移り変わり / 推移」
- [x] 「区画 / 出席回数帯」→「出席回数べつ / 累計の出席回数」
- [x] delta 単位「pt」→「ポイント」（↑↓→ 記号は維持）
- [x] aria-label の「出席KPI」→「出席のおもな指標」

### 3.3 フィルタ / 書き出し挙動不変（AC-10）

- [ ] 期間プリセット切替で表示期間が変わる（挙動不変）
- [ ] 累計の出席回数チェックでフィルタが効く（挙動不変）
- [ ] 「表計算ファイルで書き出す」リンクのダウンロード URL / 挙動が旧 CSV エクスポートと同一
- [ ] ドリルダウン modal / 要フォロー details 展開が動作する
- [ ] SafeResult error 時のゾーン単位 degrade が維持される

### 3.4 見やすさ（AC-4・VISUAL）

- [ ] 長い文言（表計算ファイルで書き出す 等）がはみ出さない
- [ ] 要フォロー行の各要素（会員名/メール → 出席回数べつ → 欠席◯回 → 最終出席）が読み取れる
- [ ] mobile で 3 ゾーンが 1 カラム縦積みで破綻しない

## 4. capture 実行記録（実 capture 後に埋める）

| 項目 | 値 |
| --- | --- |
| 実行日時 | 2026-06-11 |
| 実行環境 | local Playwright admin fixture |
| capture script | `apps/web/playwright/tests/admin-attendance-dashboard-ux.spec.ts` |
| capture lifecycle | apps/web Playwright webServer が server lifecycle を所有 |
| Playwright 実行ログ | `outputs/phase-11/evidence/playwright-attendance-jp.log`（本レビューで追加） |

## 5. 現在の確定事項

- VISUAL タスクであり、6 canonical 名が `screenshot-plan.json` / `phase11-capture-metadata.json` で一致固定済み。
- 実装・focused vitest・token gate・残存 grep は **本サイクルで実行済み**。
- 6 canonical PNG capture は local Playwright admin fixture で **取得済み（present）**。
- staging deploy / admin bearer mint / staging baseline capture / PR はすべて **user-gated**。
