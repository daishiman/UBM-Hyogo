# Phase 10: 最終レビュー — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 10 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial: 06b-A → 06b-B → 06b-C） |
| 作成日 | 2026-05-02 |
| taskType | feature（UI 実装スペック） |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1〜9 の成果物を最終レビューし、本タスクが PR に進める品質基準（AC 全充足 / 不変条件 #4 #5 #11 構造遵守 / scope out 違反不在 / 自走禁止操作の未実行）を満たすか判定する。
判定結果（PASS / MINOR / MAJOR / CRITICAL）と戻り先 Phase を `outputs/phase-10/main.md` に記録し、Phase 11（実 UI smoke / screenshot 取得）への進行可否を決定する。

## 実行タスク

1. AC-1..AC-7（Phase 1）と実装/テスト（Phase 5/6/7）/ 設計（Phase 2/3）の対応を再検算する。完了条件: 全 AC が PASS / 補正計画ありで記録される。
2. 不変条件 #4 #5 #11 の静的検出（Phase 3 で定義した grep）を再実行し 0 hit を確認する。完了条件: コマンドと結果が記録される。
3. scope out 違反（本文編集 UI 追加 / admin queue 再設計 / `:memberId` 付加 URL）の不在を確認する。完了条件: scope out × 検出方法 × 結果が表で記録される。
4. 自走禁止操作（commit / push / PR / deploy）が未実行であること、user approval gate が分離されていることを確認する。
5. NO-GO 条件（後述）に 1 件でも該当する場合は判定 MAJOR / CRITICAL とし戻り先を確定する。完了条件: 該当 / 非該当が全件記録される。

## 参照資料

| 資料名 | パス |
| --- | --- |
| Phase 1 成果物 | `outputs/phase-01/main.md` |
| Phase 2 成果物 | `outputs/phase-02/main.md` |
| Phase 3 成果物 | `outputs/phase-03/main.md` |
| Phase 4 テスト戦略 | `outputs/phase-04/main.md` |
| Phase 5 実装ランブック | `outputs/phase-05/main.md` |
| Phase 6 異常系 | `outputs/phase-06/main.md` |
| Phase 7 AC マトリクス | `outputs/phase-07/main.md` |
| Phase 8 DRY | `outputs/phase-08/main.md` |
| Phase 9 品質保証 | `outputs/phase-09/main.md` |
| 仕様書 | `docs/00-getting-started-manual/specs/{05-pages,07-edit-delete,09-ui-ux}.md` |
| 現行 UI / API | `apps/web/app/profile/`、`apps/api/src/routes/me/` |
| ガイド | `.claude/skills/task-specification-creator/references/review-gate-criteria.md` |

## 実行手順

### 1. AC × 実装/テスト 最終マッピング

| AC | 検証 evidence | 期待 |
| --- | --- | --- |
| AC-1 公開停止申請 202 → pending | E2E `profile.visibility-request.spec.ts`（hidden 化）/ Phase 11 SS | PASS |
| AC-2 再公開申請（hidden 時のみボタン） | E2E + visual diff（hidden 状態） | PASS |
| AC-3 退会申請 二段確認 | E2E `profile.delete-request.spec.ts` / Phase 11 SS | PASS |
| AC-4 二重申請 409 banner + disabled | API mock 409 unit / 統合 / Phase 11 SS | PASS |
| AC-5 本文編集 UI 追加なし | 静的 grep（後述）+ visual diff | PASS |
| AC-6 D1 直接禁止 | `rg cloudflare:d1\|D1Database apps/web/` 0 hit | PASS |
| AC-7 a11y `role=alert` / `role=dialog` | axe scan（Phase 9）/ keyboard SS | PASS |

### 2. 不変条件 静的検出（再実行）

| 不変条件 | コマンド | 期待 |
| --- | --- | --- |
| #4 本文編集禁止 | `rg -n 'name="(displayName\|email\|kana\|address\|phone)"' apps/web/app/profile/_components/Request*.tsx` | 0 hit |
| #5 D1 直接禁止 | `rg -n 'cloudflare:d1\|D1Database' apps/web/` | 0 hit |
| #11 self-service 境界 | `rg -n '/me/[^/]+/[^"]+' apps/web/src/lib/api/me-requests.ts` | `/me/visibility-request` `/me/delete-request` 以外 0 hit |
| #7 responseId 漏洩 | `rg -n 'responseId' apps/web/app/profile/_components/Request*.tsx` | 0 hit |

実行結果は `outputs/phase-10/main.md` の「不変条件検証」表に記録する。

### 3. Scope Out 違反検査

| scope out | 検出方法 | 期待 |
| --- | --- | --- |
| プロフィール本文編集 UI 追加 | `_components/Request*.tsx` の form field 列挙 → `desiredState` / `reason` / 確認チェックのみであること | PASS |
| admin request queue 再設計 | `apps/api/src/routes/admin/requests/` の diff が 0 行 | PASS |
| `:memberId` を含む API path | `rg -n ':memberId' apps/web/src/lib/api/` | 0 hit |
| 楽観的更新の追加 | `rg -n 'useOptimistic\|optimistic' apps/web/app/profile/` | 0 hit |
| 未承認 commit/push/PR | `git log origin/main..HEAD --oneline` を Phase 13 user approval 前に新規 push していないこと | PASS |

### 4. レビュー記録テンプレ

| 項目 | 値 |
| --- | --- |
| 確認者 | （Phase 10 実行時に記入） |
| 実行日時 | YYYY-MM-DD HH:MM JST |
| 確認 commit hash | `git rev-parse HEAD` の値 |
| 判定 | PASS / MINOR / MAJOR / CRITICAL |
| 戻り先（MAJOR 以上時） | Phase 1 / 2 / 4 / 5 / 6 / 7 / 8 のいずれか |
| MINOR 時の follow-up | unassigned-task として `docs/30-workflows/unassigned-task/` に起票（owner / 期限を明記） |
| Phase 11 進行可否 | YES / NO |

### 5. 判定基準（review-gate-criteria.md 準拠）

| 判定 | 条件 | 対応 |
| --- | --- | --- |
| PASS | 全観点で問題なし | Phase 11 へ進行 |
| MINOR | 軽微な指摘あり（例: pending 状態 reload 揮発の follow-up 化） | unassigned-task 化のうえ Phase 11 へ進行 |
| MAJOR | AC 不充足 / 不変条件抵触 / scope out 違反 | 影響範囲に応じ Phase 1〜8 のいずれかへ戻し |
| CRITICAL | セキュリティ / 認証境界破綻 / D1 直接アクセス検出 | Phase 1 へ戻し user と要件再確認 |

### 6. NO-GO 条件（1 件でも該当で MAJOR 以上）

| GATE | 条件 |
| --- | --- |
| GATE-1 | 06b-A-me-api-authjs-session-resolver が `completed` でない（session 解決前提が崩れる） |
| GATE-2 | AC-1〜AC-7 のいずれかが FAIL |
| GATE-3 | 不変条件 #4 / #5 / #11 / #7 のいずれかで grep が 0 hit にならない |
| GATE-4 | Phase 9 で line < 80% / branch < 60% のカバレッジ未達 |
| GATE-5 | a11y axe scan に critical / serious 違反が残存 |
| GATE-6 | scope out（本文編集 UI / admin queue / `:memberId`）に違反 |
| GATE-7 | user approval 前に commit / push / PR / deploy が実行されている |

### 7. 自走禁止操作の確認

- 本仕様書作成段階および Phase 10 実行時は、commit / push / PR / deploy を行わない。
- 実装・evidence 取得は Phase 5 / Phase 11 の runbook に従い、PR 作成は Phase 13 で user approval 取得後にのみ実行する。
- `git status` が clean であること、または変更が staging に上がっていないことを確認する。

## 統合テスト連携

| 確認項目 | 確認方法 | 期待 |
| --- | --- | --- |
| 全自動テスト成功 | `pnpm test` / `pnpm --filter @repo/web test:run` | PASS |
| 統合テスト | `pnpm --filter @repo/api test:run`（/me/* 既存 suite） | PASS |
| E2E（S1/S2/S3/S4） | `pnpm --filter @repo/web e2e:profile` | PASS |
| typecheck / lint | `pnpm typecheck && pnpm lint` | PASS |
| coverage | Phase 9 レポート参照 | line ≥ 80% / branch ≥ 60% |

## 多角的チェック観点

- AC × 実装 × テスト × evidence の 4 軸で抜けがないか
- 不変条件 #4 / #5 / #11 / #7 の静的検出が 0 hit か
- scope out 違反が混入していないか（特に「ついでに本文編集も」を入れていないか）
- 06b-A 完了 gate を Phase 1 / Phase 2 / Phase 3 / Phase 10 の 4 箇所で重複明記しているか
- pending 状態 reload 揮発（Phase 3 の MINOR）が unassigned-task 化されているか
- user approval 前に自走禁止操作を実行していないか
- 未実装/未実測を PASS と扱っていないか

## サブタスク管理

- [ ] AC × 実装/テスト 最終マッピング表を完成
- [ ] 不変条件 grep を再実行し結果を記録
- [ ] scope out 違反検査結果を記録
- [ ] レビュー記録テンプレ（確認者 / 日時 / 判定）を埋める
- [ ] NO-GO 条件 GATE-1..GATE-7 を判定
- [ ] MINOR は unassigned-task 起票計画を確認
- [ ] `outputs/phase-10/main.md` を作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 最終レビュー結果 | `outputs/phase-10/main.md` | 判定（PASS/MINOR/MAJOR/CRITICAL）/ 戻り先 / NO-GO 結果 / レビュー記録 |

## 完了条件

- [ ] AC-1..AC-7 の最終 evidence が記録されている
- [ ] 不変条件 #4 / #5 / #11 / #7 の grep 結果が記録されている
- [ ] scope out 違反不在が記録されている
- [ ] NO-GO 条件 GATE-1..GATE-7 の判定が全件記録されている
- [ ] レビュー記録テンプレ（確認者 / 日時 / 判定 / 戻り先 / Phase 11 進行可否）が埋まっている
- [ ] 自走禁止操作が未実行であることが確認されている
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認【必須】

- [ ] PASS / MINOR / MAJOR / CRITICAL の戻り先 Phase が明示されている
- [ ] 06b-A 依存 gate が Phase 1 / 2 / 3 / 10 の 4 箇所で重複明記されている
- [ ] 完了済み本体タスクの復活ではなく未反映 UI の最終レビューになっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ、判定結果（PASS/MINOR）/ AC 一覧 / blocker（あれば）/ Phase 11 で取得すべき screenshot 一覧（後述）/ approval gate（06b-A 完了 / staging 環境疎通）を渡す。
