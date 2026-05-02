# Output Phase 10: 最終レビュー

## status

NOT_EXECUTED_SPEC_ONLY（実装完了後にレビュアーが本テンプレを埋める）

## 実行ガイダンス

本ファイルはタスク仕様書作成段階での雛形である。Phase 5（実装）完了後、レビュアーは
本テンプレの「レビュー記録」「不変条件検証」「scope out 違反検査」「NO-GO 判定」を
全件埋めて確定する。`NOT_EXECUTED_SPEC_ONLY` は埋め終えた段階で `EXECUTED` へ書き換える。

## レビュー記録テンプレ

| 項目 | 値 |
| --- | --- |
| 確認者 | （記入） |
| 実行日時 | YYYY-MM-DD HH:MM JST（記入） |
| 確認 commit hash | `git rev-parse HEAD` の値（記入） |
| 判定 | PASS / MINOR / MAJOR / CRITICAL（記入） |
| 戻り先（MAJOR 以上時） | Phase 1 / 2 / 4 / 5 / 6 / 7 / 8 のいずれか |
| MINOR follow-up | unassigned-task path（記入） |
| Phase 11 進行可否 | YES / NO |

## AC × evidence マトリクス（最終）

| AC | 期待 | evidence path | 結果 |
| --- | --- | --- | --- |
| AC-1 公開停止申請 → pending | E2E + TC-01/03/07 SS | `outputs/phase-11/screenshots/TC-01,03,07-*.png` | （記入） |
| AC-2 再公開申請（hidden 時のみ） | TC-02 SS + visual diff | `outputs/phase-11/screenshots/TC-02-*.png` | （記入） |
| AC-3 退会申請 二段確認 | E2E + TC-04/05 SS | `outputs/phase-11/screenshots/TC-04,05-*.png` | （記入） |
| AC-4 二重申請 409 | TC-06 SS + unit test | `outputs/phase-11/screenshots/TC-06-*.png` | （記入） |
| AC-5 本文編集 UI 追加なし | grep + visual diff | 後述 grep 結果 | （記入） |
| AC-6 D1 直接禁止 | grep | 後述 grep 結果 | （記入） |
| AC-7 a11y `role=alert` / dialog | axe + TC-08/09 SS | `outputs/phase-11/screenshots/TC-08,09-*.png` | （記入） |

## 不変条件検証（grep 再実行結果）

| 不変条件 | コマンド | 結果（hit 数） |
| --- | --- | --- |
| #4 本文編集禁止 | `rg -n 'name="(displayName\|email\|kana\|address\|phone)"' apps/web/app/profile/_components/Request*.tsx` | （0 を期待） |
| #5 D1 直接禁止 | `rg -n 'cloudflare:d1\|D1Database' apps/web/` | （0 を期待） |
| #11 self-service 境界 | `rg -n '/me/[^/]+/[^"]+' apps/web/src/lib/api/me-requests.ts` | （`/me/visibility-request` `/me/delete-request` のみ） |
| #7 responseId 漏洩 | `rg -n 'responseId' apps/web/app/profile/_components/Request*.tsx` | （0 を期待） |

## Scope Out 違反検査

| scope out | 検出方法 | 結果 |
| --- | --- | --- |
| プロフィール本文編集 UI 追加 | `_components/Request*.tsx` の form field 列挙 | （PASS / FAIL） |
| admin request queue 再設計 | `git diff main -- apps/api/src/routes/admin/requests/` | （0 行を期待） |
| `:memberId` を含む API path | `rg -n ':memberId' apps/web/src/lib/api/` | （0 hit を期待） |
| 楽観的更新の追加 | `rg -n 'useOptimistic\|optimistic' apps/web/app/profile/` | （0 hit を期待） |
| 未承認 commit/push/PR | `git log origin/main..HEAD --oneline` | （Phase 13 user approval 前は 0 件） |

## NO-GO 判定（GATE-1..GATE-7）

| GATE | 条件 | 該当 / 非該当 | 備考 |
| --- | --- | --- | --- |
| GATE-1 | 06b-A が completed でない | （記入） |   |
| GATE-2 | AC-1〜AC-7 のいずれかが FAIL | （記入） |   |
| GATE-3 | 不変条件 grep が 0 hit にならない | （記入） |   |
| GATE-4 | line < 80% / branch < 60% | （記入） |   |
| GATE-5 | a11y critical / serious 残存 | （記入） |   |
| GATE-6 | scope out 違反 | （記入） |   |
| GATE-7 | user approval 前の commit/push/PR/deploy | （記入） |   |

## 自走禁止操作の確認

- [ ] commit / push / PR / deploy を Phase 10 段階で実行していない（`git status` clean）
- [ ] PR 作成は Phase 13 で user approval 取得後にのみ実行する旨を記録

## notes

このファイルはタスク仕様書作成時点の雛形である。実 review は Phase 5 実装完了後に実施する。
