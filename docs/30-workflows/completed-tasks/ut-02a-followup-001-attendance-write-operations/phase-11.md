# Phase 11: 実装 smoke

実装区分: resolved-by-existing implementation close-out（NON_VISUAL）

判定: CONTRACT_ONLY_NOT_EXECUTED

本 Phase 11 は local / staging server と authenticated admin session を必要とする API curl / UI smoke の **実測完了ではない**。既存 06c-E / 07c の focused tests を実装証跡として参照し、curl JSON と UI smoke md は 08b / 09a runtime evidence gate で実行するための contract placeholder として扱う。

## 11.1 evidence 取得計画

| # | evidence | 種別 | 保存先 | AC ref |
| --- | --- | --- | --- | --- |
| E1 | `attendance.add` 成功 | API curl JSON | `outputs/phase-11/evidence/api-curl/attendance-add-ok.json` | AC-2, AC-5, AC-10 |
| E2 | `attendance.add` duplicate | API curl JSON | `outputs/phase-11/evidence/api-curl/attendance-add-duplicate.json` | AC-2, AC-7, AC-10 |
| E3 | `attendance.remove` 成功 | API curl JSON | `outputs/phase-11/evidence/api-curl/attendance-remove-ok.json` | AC-3, AC-5, AC-10 |
| E4 | `session_not_found` 404 | API curl JSON | `outputs/phase-11/evidence/api-curl/attendance-session-not-found.json` | AC-6, AC-10 |
| E5 | admin meeting 詳細画面で attendance ON/OFF が即時反映 | UI smoke ログ | `outputs/phase-11/evidence/ui-smoke/admin-meeting-attendance-edit.md` | AC-5, AC-8 |

## 11.2 取得手順（E1〜E4）

`apps/api` をローカル起動 (`mise exec -- pnpm --filter @ubm-hyogo/api dev`) し、admin token を取得後、Phase 5 Step 9 の curl コマンドを実行。

### 期待値テンプレート

#### E1: `attendance-add-ok.json`
```json
{
  "ok": true,
  "row": {
    "memberId": "m1",
    "sessionId": "s1",
    "assignedAt": "<ISO8601>",
    "assignedBy": "owner@example.com"
  }
}
```

#### E2: `attendance-add-duplicate.json`
```json
{
  "ok": false,
  "reason": "duplicate",
  "existing": {
    "memberId": "m1",
    "sessionId": "s1",
    "assignedAt": "<ISO8601>",
    "assignedBy": "owner@example.com"
  }
}
```

#### E3: `attendance-remove-ok.json`
```json
{
  "ok": true,
  "removed": {
    "memberId": "m1",
    "sessionId": "s1",
    "assignedAt": "<ISO8601>",
    "assignedBy": "owner@example.com"
  }
}
```

#### E4: `attendance-session-not-found.json`
HTTP 404
```json
{
  "ok": false,
  "reason": "session_not_found"
}
```

## 11.3 ui-smoke 取得手順（E5）

1. `apps/web` をローカル起動
2. admin としてログイン (`/admin`)
3. meeting 詳細画面 (`/admin/meetings/<id>`) を開く
4. attendance チェックボックスを ON → 即時反映を確認、network tab で `POST /admin/meetings/:id/attendances` 200 を確認
5. OFF → 同上
6. 取得したログ / 観察事項を `outputs/phase-11/evidence/ui-smoke/admin-meeting-attendance-edit.md` に記録（NON_VISUAL: スクリーンショット必須ではない、観察ログで可）

## 11.4 evidence contract completeness check

- E1〜E4 の JSON ファイル 4 件が存在
- E5 の md ファイルが存在
- 各 evidence ファイルは `CONTRACT_ONLY_NOT_EXECUTED` を明示し、実測 PASS と混同しない
- audit_log runtime query は未実行。実行時は以下クエリで確認する:

```bash
# admin/audit endpoint 経由
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://127.0.0.1:8787/admin/audit?action=attendance.add" \
  | jq '.items | length'
```

## 11.5 DoD

- contract placeholder 5 件が存在し、未実行状態を明記している
- 実装証跡は 06c-E / 07c focused tests と本 close-out review の local checks に限定する
- runtime curl / UI smoke は 08b / 09a evidence gate に委譲し、本 workflow では PASS 扱いしない
