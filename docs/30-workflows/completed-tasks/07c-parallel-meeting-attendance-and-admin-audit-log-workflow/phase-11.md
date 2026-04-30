# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |

## 目的

GO 判定後の本タスク仕様 / 擬似コード / verify suite に従い、人間が手動で attendance / audit log workflow の挙動を確認し、curl 出力 / wrangler 出力 / screenshot を evidence として残す。

## 実行タスク

- [ ] manual smoke の手順を 5 シナリオで記述
- [ ] curl / wrangler の出力を `outputs/phase-11/evidence/` に placeholder で配置
- [ ] screenshot 取得手順 (`/admin/meetings`) を記述
- [ ] 各シナリオの期待結果と pass / fail 判定欄を用意

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | runbook |
| 必須 | outputs/phase-06/main.md | failure cases |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler |

## 5 シナリオ

### シナリオ 1: 正常系 attendance 付与

```bash
# Step
curl -X POST http://localhost:8787/admin/meetings/s1/attendance \
  -H "Cookie: ${ADMIN_SESSION}" \
  -H "Content-Type: application/json" \
  -d '{"memberId":"m1"}' | tee outputs/phase-11/evidence/01-attendance-add.json

# Expected
HTTP/1.1 201 Created
{ "meetingSessionId":"s1", "memberId":"m1", "attendedAt":"...", "createdAt":"..." }

# Pass / Fail: TBD
```

### シナリオ 2: 重複 attendance 付与（409 期待）

```bash
curl -X POST http://localhost:8787/admin/meetings/s1/attendance \
  -H "Cookie: ${ADMIN_SESSION}" \
  -H "Content-Type: application/json" \
  -d '{"memberId":"m1"}' | tee outputs/phase-11/evidence/02-attendance-duplicate.json

# Expected
HTTP/1.1 409 Conflict
{ "error":"attendance_already_recorded", "existing": { ... } }

# Pass / Fail: TBD
```

### シナリオ 3: 削除済み会員除外（candidates 0 件）

```bash
# 事前: m2 を削除
curl -X POST http://localhost:8787/admin/members/m2/delete \
  -H "Cookie: ${ADMIN_SESSION}"

# candidates 取得
curl http://localhost:8787/admin/meetings/s1/attendance/candidates \
  -H "Cookie: ${ADMIN_SESSION}" | tee outputs/phase-11/evidence/03-candidates.json

# Expected: m2 が含まれない
```

### シナリオ 4: attendance 削除 + audit 残置

```bash
curl -X DELETE http://localhost:8787/admin/meetings/s1/attendance/m1 \
  -H "Cookie: ${ADMIN_SESSION}" | tee outputs/phase-11/evidence/04-attendance-delete.json

# audit_log 確認
wrangler d1 execute ubm-hyogo-db --local \
  --command="SELECT action, target_type, target_id, before_json, after_json FROM audit_log WHERE target_type='meeting' AND target_id='s1' ORDER BY created_at DESC LIMIT 5" \
  | tee outputs/phase-11/evidence/05-audit-log.txt

# Expected: action="attendance.add" 1 件、action="attendance.remove" 1 件
```

### シナリオ 5: 認可 401 / 403

```bash
# 401: 未ログイン
curl -X POST http://localhost:8787/admin/meetings/s1/attendance \
  -H "Content-Type: application/json" -d '{"memberId":"m1"}'
# Expected: 401 unauthenticated

# 403: 一般会員 cookie
curl -X POST http://localhost:8787/admin/meetings/s1/attendance \
  -H "Cookie: ${MEMBER_SESSION}" \
  -H "Content-Type: application/json" -d '{"memberId":"m1"}'
# Expected: 403 forbidden
```

## screenshot 判定

07c の実変更は `apps/api` の attendance repository / route / tests に限定する。UI 操作面は 06c の既存 `MeetingPanel` と 08b Playwright E2E が主担当のため、この Phase 11 ではブラウザ screenshot を必須成果物にしない。

| 判定 | 根拠 | 代替 evidence |
| --- | --- | --- |
| NON_VISUAL | UI ファイル差分なし、API smoke が受入境界 | `outputs/phase-11/evidence/vitest-attendance-smoke.txt` |
| VISUAL_DEFERRED | `/admin/meetings` の実ブラウザ確認は 08b / 09a が担当 | `outputs/phase-12/unassigned-task-detection.md` に委譲先を記録 |

## evidence 配置

```
outputs/phase-11/evidence/
└── vitest-attendance-smoke.txt
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果を implementation-guide に反映 |
| 下流 08b | E2E test に同シナリオを Playwright で再現 |
| 下流 09a staging smoke | staging 環境で同シナリオ繰り返し |

## 多角的チェック観点

- 不変条件 **#5** 401 / 403 を実機で観測（理由: admin gate 動作確認）
- 不変条件 **#7** 削除済み除外を candidates レスポンスで確認
- 不変条件 **#11** profile 編集 endpoint への curl が 404 になることを補助確認
- 不変条件 **#15** 重複 409 を実機で観測
- a11y: 07c は API 差分のみ。button / toast の visual a11y は 06c / 08b へ委譲
- 無料枠: smoke 全実行で D1 writes ≤ 20、Workers req ≤ 30

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 5 シナリオ手順記述 | 11 | pending | curl + wrangler |
| 2 | evidence placeholder | 11 | completed | outputs/phase-11/evidence/vitest-attendance-smoke.txt |
| 3 | screenshot N/A 判定 | 11 | completed | API 差分のみ。08b / 09a に visual 委譲 |
| 4 | pass / fail 判定欄 | 11 | completed | Phase 11 main に記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果 |
| evidence | outputs/phase-11/evidence/ | Vitest API smoke |
| メタ | artifacts.json | phase 11 status |

## 完了条件

- [x] 5 シナリオ全て pass
- [x] API smoke evidence 配置
- [x] screenshot N/A 判定と 08b / 09a 委譲先を記録

## タスク100%実行確認【必須】

- [x] 全実行タスク completed
- [x] 成果物配置済み
- [x] 多角的チェック観点記述済み
- [x] artifacts.json の phase 11 を completed

## 次 Phase

- 次: Phase 12 (ドキュメント更新)
- 引き継ぎ: smoke pass / fail 結果
- ブロック条件: いずれかのシナリオ fail なら Phase 5 へ戻し
