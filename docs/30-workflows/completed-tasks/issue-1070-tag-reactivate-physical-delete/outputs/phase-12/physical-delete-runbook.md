# physical delete production runbook（AC-4）

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

> physical delete は **不可逆操作**（`DELETE FROM tag_definitions` で行を削除し UNIQUE `code` を解放）。rollback は通常の application 操作では不能で、DB restore でしか戻せない。本 runbook は production の tag 物理削除を **user 承認後のみ・手順固定**で実行するための正本。`governance_mutation_user_gate = true`。

## 0. 適用範囲と前提

- 対象: production D1（`ubm-hyogo-db-prod`）の `tag_definitions` 1 行を物理削除する運用。
- 経路: アプリ endpoint `DELETE /admin/tags/:tagId/physical`（参照ガード付き・推奨）。直接 SQL `DELETE FROM tag_definitions ...` は endpoint が使えない緊急時のみ・参照0を手動確認した後に限る。
- 前提: reactivate / physical delete endpoint は local 実装済み。production 実行時は deploy 済みであることを確認してから実行する。
- 不可逆: 削除した行・`code` 占有は元に戻らない。誤削除は **DB restore でしか復旧できない**。

## 1. 不可逆性の警告（必読）

| 事項 | 内容 |
| --- | --- |
| 操作の性質 | `tag_definitions` 行の **完全削除**。`code` UNIQUE が解放され、同 `code` で別の tag を再作成できる状態になる |
| rollback | アプリ層に undo は無い。誤削除の復旧は **`bash scripts/cf.sh d1 export` で取得したバックアップからの restore のみ**。restore は他テーブルへの影響も伴う重操作 |
| logical との違い | 「もう使わないが履歴は残す」だけなら **logical delete（`DELETE /admin/tags/:tagId` → active=0）** を使う。physical delete は「`code` を解放して再利用したい」「テスト/誤作成の完全除去」のときだけ |
| 参照ガード | endpoint は `member_tags` 参照>0 のとき 409 `tag_has_references` で拒否する。参照ありを物理削除したい場合は本サイクル範囲外（別 Issue の強制移行 migration が必要） |

## 2. 前提条件: 参照0の事前 read-only 確認

物理削除の前に、対象 tag が誰にも使われていない（`member_tags` 参照0）ことを **read-only クエリ**で確認する。これらは mutation を伴わないため AI / 手動どちらでも実行可。

```bash
# 認証確認（read-only）
bash scripts/cf.sh whoami

# 対象 tag の現状（active / code / label）を確認（read-only）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT tag_id, code, label, category, active FROM tag_definitions WHERE tag_id = '<TAG_ID>'"

# member_tags 参照件数を確認（read-only・0 であること）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT COUNT(*) AS n FROM member_tags WHERE tag_id = '<TAG_ID>'"
```

- 参照件数 `n` が **0 でなければ中止**する（孤児化禁止）。endpoint も同条件で 409 を返す。
- 参照ありを本当に消したい場合は U-1（強制移行 migration・別 Issue）へエスカレーションする。

## 3. user approval marker 手順

- production 物理削除は **user の明示承認が必須**。承認は `outputs/phase-13/user-approval-<timestamp>.md` に記録する（Phase 13 の user_approval_marker と同経路）。
- marker には最低限: 対象 `tag_id` / `code` / §2 で確認した参照件数（=0）/ 承認者 / 承認日時 / 実行理由 を記す。
- marker が存在しない状態で mutation コマンドを実行してはならない（AI は §6 に従い停止）。

## 4. backup（実行直前・必須）

物理削除の直前に production DB をエクスポートしておく（誤削除時の唯一の復旧手段）。

```bash
# 直前バックアップ（restore の唯一の起点）
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output "backup-before-physical-delete-<TAG_ID>-<timestamp>.sql"
```

- backup ファイルは安全な場所に保管し、削除完了後も一定期間保持する。

## 5. 実行 → 検証（user 承認後のみ）

```bash
# 推奨: アプリ endpoint 経由（参照ガードが二重に効く）。production base URL は運用環境の admin API に置換
#   DELETE https://<admin-api>/admin/tags/<TAG_ID>/physical
#   → 204（成功） / 409 tag_has_references（参照あり → 中止） / 404 tag_not_found

# 緊急時のみ: 直接 SQL（参照0を §2 で確認済みのときに限る・mutation・user-gated）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "DELETE FROM tag_definitions WHERE tag_id = '<TAG_ID>'"
```

実行後の検証（read-only）:

```bash
# 行が消えたこと（0 行）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT COUNT(*) AS n FROM tag_definitions WHERE tag_id = '<TAG_ID>'"

# audit に admin.tag.physically_deleted が 1 件残ったこと（endpoint 経由時）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT action, target_id, created_at FROM audit_log WHERE target_id = '<TAG_ID>' AND action = 'admin.tag.physically_deleted' ORDER BY created_at DESC LIMIT 1"
```

## 6. AI 実行禁止カテゴリ（Claude Code を含む全 AI エージェントに適用）

| 操作 | 種別 | AI 実行 |
| --- | --- | --- |
| `bash scripts/cf.sh whoami` | read-only | 可 |
| `SELECT ... FROM tag_definitions WHERE tag_id` | read-only | 可 |
| `SELECT COUNT(*) FROM member_tags WHERE tag_id`（参照0確認） | read-only | 可 |
| `bash scripts/cf.sh d1 migrations list ...` | read-only | 可 |
| `bash scripts/cf.sh d1 export ...`（backup 取得） | read-only（DB を変更しない） | 可 |
| `DELETE /admin/tags/:tagId/physical`（production runtime） | **mutation・不可逆** | **不可**（user 承認 + marker 必須） |
| `DELETE FROM tag_definitions ...`（直接 SQL・production） | **mutation・不可逆** | **不可**（user 承認 + marker 必須） |
| `member_tags` 強制移行（参照付け替え） | **mutation・スコープ外** | **不可**（U-1 別 Issue・合意未済） |

- AI は read-only の事前確認・backup 取得までを自動範囲とし、**production 物理削除 mutation は user approval marker が無い限り停止**する。
- 参照>0 の tag を物理削除する要求が来た場合、AI は実行せず U-1（強制移行・別 Issue）へエスカレーションする。

## 7. rollback（誤削除時）

- アプリ層 undo は無い。`outputs/phase-12/physical-delete-runbook.md` §4 の backup（`backup-before-physical-delete-*.sql`）から restore する以外に復旧手段は無い。
- restore は他テーブルにも影響する重操作のため、影響範囲を確認したうえで user 承認後に実施する。
- 復旧後は `tag_id` / `code` の再採番有無を確認し、`member_tags` 参照との整合を検証する。
