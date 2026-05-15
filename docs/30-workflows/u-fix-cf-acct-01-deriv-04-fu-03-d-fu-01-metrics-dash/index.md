# タスク仕様書: U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-01-METRICS-DASH — 7day summary 可視化ダッシュボード

[実装区分: 実装仕様書]

判定根拠: 本タスクは (1) 新規 aggregator script `scripts/cf-audit-log/dashboard/aggregate-weekly.ts` の追加、(2) 既存 `.github/workflows/cf-audit-log-7day-summary.yml` の出力 schema に `week_starting`（ISO week）field を追加する mini-PR 相当の編集（unassigned-task 仕様 9. 苦戦箇所で予告済み）、(3) 静的 HTML ダッシュボード描画レイヤの新規追加、(4) Phase 11 で screenshot 4 点を取得する VISUAL task の遂行、を伴う。コード追加 / workflow 編集 / SSOT 同期を必要とするため CONST_004 デフォルトに従い実装仕様書として作成する。Issue #656 は CLOSED のままとし、`Refs #549, Refs #586, Refs #656` で連携する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash |
| GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/656 |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/586 |
| 祖父 Issue | https://github.com/daishiman/UBM-Hyogo/issues/549 |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash.md` |
| 親タスク仕様 | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/` |
| 配置先 | `docs/30-workflows/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash/` |
| 作成日 | 2026-05-14 |
| 状態 | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | VISUAL（dashboard screenshot 4 点） |
| implementation_mode | implemented-local |
| 優先度 | LOW（issue label `priority:low`） |
| Wave | follow-up（observability 拡張 / Issue #549 派生 FU-03-D / FU-01） |
| 想定 PR 数 | 1（先頭 commit で `cf-audit-log-7day-summary.yml` の `week_starting` 追加 + aggregator script + dashboard 描画 + SSOT 同期）|
| coverage AC | 適用（aggregator script line/branch ≥ 90%、対象 `scripts/cf-audit-log/dashboard/**`）|

## 着手判断（着手 Gate）

本タスクは LOW priority・条件付き起票のため、以下 Gate を Phase 03 完了時に必ず確認する。Phase 04 以降は Gate 全件が `spec_created (ready for implementation)` になった場合のみ実行する:

- **Gate-PRECONDITION-PARENT-RUNTIME-SYNCED**: 親 Issue #586 が `pass_runtime_synced` 昇格済みで、`docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-11/evidence/hourly-run-7day-summary.json` が最低 1 週分（168h × 1）commit 済みであること。`gh issue view 586 --json state,labels` と `git ls-files docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-11/evidence/hourly-run-7day-summary.json` の双方で確認。
- **Gate-PRECONDITION-OBSERVABILITY-NEED**: ML classifier の継続観測ニーズが顕在化していること（fallback rate / Issue 起票傾向の週次レビュー要請 issue / discussion / SSOT entry が 1 件以上ある）。
- **Gate-DESIGN-DECIDED**: Phase 3 で「静的 HTML（`docs/dashboards/cf-audit-log-7day-trend/`）」を確定済みであること。現 worktree には `apps/web/src/app/(admin)/admin/audit/` が存在しないため、admin UI 組込は本サイクル外の将来候補に固定する。

Gate のいずれかが未達の場合、Phase 04 以降のテスト・実装着手を行わず、本仕様書を `spec_created` のまま停止し、unassigned-task に再差し戻す。

## 苦戦箇所（unassigned-task 9 項より引用）

- ダッシュボード系タスクは「solo dev で本当に必要か」を起票前に判定する gate が必要。reactive な observability（Slack 通知）と proactive な傾向把握（dashboard）の責務分離を最初に切らないと、両タスクが overlapping scope で再着手される。
- summary JSON は単発サンプル設計のため `week_starting`（ISO week）field を最初から入れておかないと、aggregator が過去 JSON に対して date 推定を強いられる。**本タスクの先頭 commit で `cf-audit-log-7day-summary.yml` 出力 schema に `week_starting` を追加する**（同一 PR 内で技術的に独立してリリース可能な mini-PR 相当として処理）。
- 静的 HTML はデプロイ簿価が安いが、admin UI 組込は Auth.js セッションで保護できる。Phase 3 で「公開しない / 公開する」を明示決定する設計工程を入れる。

## スコープ（CONST_007 遵守）

### 含む（scope in）

1. `.github/workflows/cf-audit-log-7day-summary.yml` の編集: 出力 JSON schema に `week_starting`（ISO 8601 week 形式 `YYYY-Www`）と `schema_version`（`"1.0.0"` から起算）field を追加。aggregator script 内で計算するか workflow YAML 側で `date -u +"%G-W%V"` 等で算出するかは Phase 5 で確定。
2. 集計 script `scripts/cf-audit-log/dashboard/aggregate-weekly.ts` の新規追加。
   - input: `outputs/phase-11/evidence/hourly-run-7day-summary.json` を含む directory（複数週分）
   - output: 集約済み trend JSON（4 指標 × 週次）
3. ダッシュボード描画レイヤ（**Phase 3 で静的 HTML に確定**）:
   - 採択: 静的 HTML `docs/dashboards/cf-audit-log-7day-trend/index.html`（public 公開はしない）
   - 不採択: `apps/web/src/app/(admin)/admin/audit/dashboard/page.tsx`（現 worktree に親 route が無いため本サイクル外）
4. 4 指標の時系列プロット: fallback rate / p95 latency / Issue 起票数 / leakage grep 件数
5. threshold 期 baseline と ML 期の比較線を同一プロット内に並記
6. Phase 11 evidence: dashboard screenshot 4 点（`fallback-rate-trend.png` / `p95-latency-trend.png` / `issue-rate-trend.png` / `leakage-count-trend.png`）
7. SSOT 同期: `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` にダッシュボード URL/path を追記

### 含まない（scope out / 別タスク）

- FU-03-D-FOLLOWUP-03 Slack リアルタイム通知（責務分離: 本タスクは「過去傾向の閲覧」のみ・push 通知なし）
- 新規 D1 列追加（forward-safe で不変）
- Google Form schema 変更
- 外部 SaaS 依存（Datadog / Grafana Cloud 等は採用禁止）
- 90 日 baseline（FU-03-A 別タスク）
- 親 #549 / #586 の reopen

## 不変条件・正本仕様との整合

1. 新規 D1 列追加なし（forward-safe で不変）
2. FU-03-D-FOLLOWUP-03（Slack リアルタイム通知）と scope 重複しない（過去閲覧のみ・push 通知なし）
3. 認証要件は solo dev 想定。静的 HTML は public 公開しない（`docs/` 配下に置き Cloudflare Pages の public route には deploy しない）。URL と local path は SSOT 上で分離し、public URL は未設定として扱う。
4. 外部 SaaS 依存禁止（chart 描画は inline SVG / pure JS / 軽量 lib のみ）
5. summary JSON は versioned schema（`schema_version` field 必須化）にする。`schema_version` が未指定の旧 JSON は warn + skip、明示的な unsupported version（例: `"2.0.0"`）と型不正は throw、`schema_version: "1.0.0"` で `week_starting` が無い場合は `generated_at` から native ISO week 算出で補完する。
6. aiworkflow-requirements skill > 親 #549 spec > 親 #586 spec > 本仕様書の正本順位を維持

## リスクと対策（forward-safe rollback）

| リスク | 検知 | 対策 |
| --- | --- | --- |
| `week_starting` 追加で過去 summary JSON との後方非互換 | 旧 JSON が入力に混ざる | `schema_version` 未指定は warn + skip、unsupported explicit version / 型不正は throw。`1.0.0` の `week_starting` 欠落のみ `generated_at` から補完 |
| admin UI 組込で auth bypass | Phase 11 smoke で未認証 access テスト | `requireAdminSession()` middleware を `(admin)` layout で強制 |
| 静的 HTML を誤って public 公開 | Cloudflare Pages route 設定の grep gate | `docs/30-workflows/dashboards/**` を `apps/web` のビルド対象から除外（`.opennextignore` 等で確認）|
| 集計 script の ISO week 計算境界バグ | unit test で年跨ぎ / 53 週年ケースを追加 | Phase 4 / 6 で境界 fixture 追加 |
| Slack scope（FU-03-D-FOLLOWUP-03）との重複 | Phase 10 の DoD で「push 通知 0 件」確認 | 本仕様書冒頭で責務分離を明文化 |

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Issue #586 | summary JSON 正本生成元（`hourly-run-7day-summary.json`） |
| 上流 | Issue #549 | classifier / 7day workflow 祖父 |
| 上流 | `.github/workflows/cf-audit-log-7day-summary.yml` | 出力 schema 編集対象 |
| 上流 | `scripts/cf-audit-log/observation/post-switch-monitor.ts` | aggregation 機能の正本（既存） |
| 関連 | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | SSOT 同期先 |
| external | Gate-PRECONDITION-PARENT-RUNTIME-SYNCED | 親 #586 の 7 日 evidence commit 済み |
| external | Gate-PRECONDITION-OBSERVABILITY-NEED | 週次レビュー要請の顕在化 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash.md` | 起票元 unassigned-task |
| 必須 | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/index.md` | 親タスク仕様（summary JSON の正本生成経路） |
| 必須 | `.github/workflows/cf-audit-log-7day-summary.yml` | 編集対象 workflow |
| 必須 | `scripts/cf-audit-log/observation/post-switch-monitor.ts` | aggregation 既存正本 |
| 参考 | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md` | Slack 通知 scope 切り分け対象 |
| 参考 | `apps/web/src/app/(admin)/admin/audit/` | admin UI 組込時のベース route |
| 参考 | `packages/shared/` | 型共有先（schema 型 export） |
| 参考 | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | SSOT 同期先 |

## AC（Acceptance Criteria）

- AC-1: `.github/workflows/cf-audit-log-7day-summary.yml` の出力 JSON に `week_starting`（`YYYY-Www`）と `schema_version`（`"1.0.0"`）が含まれる。
- AC-2: `scripts/cf-audit-log/dashboard/aggregate-weekly.ts` が新規追加され、入力 directory から N 週分の summary JSON を集約し、4 指標 × 週次の trend JSON を出力する。
- AC-3: aggregator は `schema_version` 契約を統一実装する。未指定旧 JSON は warn + skip、unsupported explicit version（例: `"2.0.0"`）と型不正は throw、`1.0.0` で `week_starting` 欠落時は `generated_at` から native ISO week 算出で補完する。
- AC-4: aggregator unit test (`scripts/cf-audit-log/dashboard/__tests__/aggregate-weekly.spec.ts`) が以下ケースで pass: (a) 4 週分集約 (b) 欠損週 (c) unsupported explicit version throw (d) old JSON skip (e) threshold vs ML 期分岐 (f) ISO week 計算境界（年跨ぎ / 53 週年）。
- AC-5: aggregator script の line / branch カバレッジ ≥ 90%（対象 `scripts/cf-audit-log/dashboard/**`）。
- AC-6: ダッシュボード描画レイヤが Phase 3 確定方針（admin UI or 静的 HTML）に従って実装される。
- AC-7: 4 指標（fallback rate / p95 latency / Issue 起票数 / leakage 件数）の時系列プロットがダッシュボードに表示される。
- AC-8: threshold 期 baseline と ML 期の比較線が同一プロット内に並ぶ。
- AC-9: Phase 11 evidence に screenshot 4 点（`fallback-rate-trend.png` / `p95-latency-trend.png` / `issue-rate-trend.png` / `leakage-count-trend.png`）が `outputs/phase-11/evidence/screenshots/` に配置される。
- AC-10: `screenshot-plan.json` に `mode: "VISUAL"` 明記、`phase11-capture-metadata.json` 作成。
- AC-11: 3 層評価（Semantic / Visual / AI UX）が Phase 11 で実施される。
- AC-12: 新規 D1 列追加 0 件（`apps/api/migrations/` への diff が 0）。
- AC-13: FU-03-D-FOLLOWUP-03 Slack scope と重複しない（push 通知関連の追加が 0 件）。
- AC-14: SSOT `observability-monitoring.md` にダッシュボード URL/path が追記される。
- AC-15: Phase 12 strict 7 outputs（implementation-guide Part1+Part2 / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が `outputs/phase-12/` に実体配置される。
- AC-16: PR 本文に `Refs #549, Refs #586, Refs #656` を含み、issue は閉じない（Issue #656 は CLOSED のまま）。
- AC-17: `pnpm typecheck` / `pnpm lint` / `pnpm build` / `verify-design-tokens` が新規エラー 0 件で pass。
- AC-18: PR 先頭 commit が `cf-audit-log-7day-summary.yml` の `week_starting` 追加（独立リリース可能な mini-PR 相当）として分離されている。

## 実装ファイル一覧（Phase 5 で詳細確定）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-7day-summary.yml` | 編集 | 出力 schema に `week_starting` / `schema_version` 追加 |
| `scripts/cf-audit-log/dashboard/aggregate-weekly.ts` | 新規 | 週次集約 script |
| `scripts/cf-audit-log/dashboard/__tests__/aggregate-weekly.spec.ts` | 新規 | unit test (Vitest) |
| `scripts/cf-audit-log/dashboard/types.ts` | 新規 | summary JSON / trend JSON 型定義（`packages/shared/` への移管検討） |
| `docs/dashboards/cf-audit-log-7day-trend/index.html` | 新規（Phase 3 で採択済み） | 静的 HTML dashboard |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | dashboard URL/path 追記 |

## Phase 一覧

| Phase | 名称 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 / Gate 整理 / 真の論点 | phase-01.md |
| 2 | 設計 (aggregator + dashboard 2 案比較) | phase-02.md |
| 3 | 設計レビュー (admin UI vs 静的 HTML 確定) | phase-03.md |
| 4 | テスト作成 (TDD Red) | phase-04.md |
| 5 | 実装 (TDD Green) | phase-05.md |
| 6 | テスト拡充 | phase-06.md |
| 7 | カバレッジ確認 | phase-07.md |
| 8 | リファクタリング | phase-08.md |
| 9 | 品質保証 (typecheck/lint/build/spec/design-tokens) | phase-09.md |
| 10 | 最終レビュー (DoD) | phase-10.md |
| 11 | 手動テスト (VISUAL: screenshot 4 点 + 3 層評価) | phase-11.md |
| 12 | ドキュメント更新 (Phase 12 strict 7 outputs) | phase-12.md |
| 13 | PR 作成 (`Refs #549, Refs #586, Refs #656`、base=`dev`) | phase-13.md |

各 Phase 詳細は `phase-NN.md` を参照。

- [Phase 01](phase-01.md) ・ [Phase 02](phase-02.md) ・ [Phase 03](phase-03.md) ・ [Phase 04](phase-04.md) ・ [Phase 05](phase-05.md) ・ [Phase 06](phase-06.md) ・ [Phase 07](phase-07.md) ・ [Phase 08](phase-08.md) ・ [Phase 09](phase-09.md) ・ [Phase 10](phase-10.md) ・ [Phase 11](phase-11.md) ・ [Phase 12](phase-12.md) ・ [Phase 13](phase-13.md)

## DoD（Definition of Done・全 Phase 共通）

- [x] AC-1〜AC-15 の local evidence が対応 Phase の `outputs/phase-07` / `outputs/phase-09` / `outputs/phase-11` / `outputs/phase-12` に保存されている。
- [x] Phase 3 で静的 HTML が確定し、`outputs/phase-03/decision.md` に決定理由が記録されている。
- [x] aggregator script の focused test が `outputs/phase-09/test.log` で確認できる。line/branch coverage は `outputs/phase-07/coverage.json` に local focused coverage として記録する。
- [x] dashboard screenshot 4 点が `outputs/phase-11/evidence/screenshots/` に配置されている。
- [x] 新規 D1 列追加 0 件（`apps/api/migrations/` への diff 0）。
- [x] Slack 通知関連の追加 0 件（FU-03-D-FOLLOWUP-03 と scope 重複なし）。
- [x] SSOT `observability-monitoring.md` にダッシュボード URL/path が追記されている。
- [x] Phase 12 strict 7 + optional split guide outputs が `outputs/phase-12/` に実体配置されている（短縮名・別名 0 件）。
- [ ] PR 本文に `Refs #549, Refs #586, Refs #656` を含み、Issue #656 は CLOSED のまま（Phase 13 は user-gated）。
- [x] `pnpm typecheck` / `pnpm lint` / `pnpm build` / `verify-design-tokens` 新規エラー 0 件。
