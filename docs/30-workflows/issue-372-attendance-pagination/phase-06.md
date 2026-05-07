# Phase 6: テスト拡充（GREEN・統合）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-6/phase-6.md` |

## 目的
Phase 4-5 の単体テストを GREEN 化したうえで、E2E / 統合シナリオを追加する。

## 追加 / 拡充テスト

### 統合テスト
- `apps/api/src/routes/me/index.test.ts`:
  - `attendance 0 件 / 1 件 / 50 件丁度 / 51 件 / 200 件 / 500 件` の境界。
  - cursor 連続呼び出しで全件再構成可能（順序重複なし）。
- `apps/api/src/routes/admin/members.test.ts`:
  - admin 認証なしは 401、admin 以外は 403。
  - 同等のページング境界ケース。

### E2E（Playwright）
- `apps/web/e2e/profile-attendance-pagination.spec.ts`:
  - fixture: 60 件 attendance を持つ test user。
  - 初回ロードで 50 件 + 「もっと見る」表示。クリックで残り 10 件 append、ボタン消失。
  - スクリーンショット: 初期状態 / クリック後 / 末尾到達。
- `apps/web/e2e/admin-member-attendance-pagination.spec.ts`:
  - admin detail drawer で初回 50 件 + 「もっと見る」表示。
  - クリックで残り件数 append、ボタン消失。
  - authenticated admin storageState がない場合は Phase 11 手動 VISUAL に委譲し、skip ではなく `PENDING_RUNTIME_EVIDENCE` として記録する。

### 回帰テスト
- 既存 `attendance.test.ts` / `attendance-provider.test.ts` の全ケース PASS（read path regression なし）。

## 参照資料
- `outputs/phase-6/phase-6.md`
- `outputs/phase-4/red-evidence.txt`

## 成果物
- 上記テストファイル
- `outputs/phase-6/green-evidence.txt`（vitest 全 PASS）
- `outputs/phase-6/playwright-report/` 配下スクリーンショット

## 完了条件
- `mise exec -- pnpm --filter @ubm-hyogo/api test:run` 全 PASS。
- `mise exec -- pnpm --filter @ubm-hyogo/web test:run` 全 PASS。
- Playwright E2E 全 PASS、profile 3 種 + admin 3 種のスクリーンショット取得済み。admin authenticated runtime が未取得の場合は Phase 11 の手動 VISUAL evidence が blocker として残る。

## 実行タスク
- [ ] 上記テストを追加し全 PASS を確認する。
- [ ] Playwright E2E を実行し evidence を保存する。

## 統合テスト連携
- Phase 9 で全体 quality gate を再走させる。
