# force-migration production runbook（AC-6）

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

> 強制移行（force-migration）は **「`member_tags` の参照を別 tag へ全件付け替えてから元 tag を物理削除する」不可逆操作** を含む。物理削除した `tag_definitions` 行と解放された UNIQUE `code` は通常の application 操作では戻せず、移行で消えた `src` 参照も自動では戻らない。本 runbook は production の tag 強制移行 + 物理削除を **user 承認後のみ・手順固定**で実行し、移行先誤指定時の **逆移行ロールバック（dest→src 戻し）** を明文化するための正本。`governance_mutation_user_gate = true`。

## 0. 適用範囲と前提

- 対象: production D1（`ubm-hyogo-db-prod`）で、参照（`member_tags`）のある tag（`src`）の参照を別 tag（`dest`）へ移行し、`src` を物理削除する運用。
- 経路: アプリ endpoint `DELETE /admin/tags/:tagId/physical?migrateTo=<dest>`（参照付け替え → COUNT=0 再検証 → physical delete を二段で原子的に実行・推奨）。直接 SQL は endpoint が使えない緊急時のみ・各ステップ後の参照件数を手動確認しながら実行する。
- 前提: 強制移行 endpoint は local 実装済み。production 実行時は deploy 済みであることを確認してから実行する。
- 不可逆: 物理削除した `src` 行・`code` 占有は元に戻らない。移行で `src`→`dest` に付け替えた参照は、§7 の逆移行手順か DB restore でしか戻せない。

## 1. 不可逆性の警告（必読）

| 事項 | 内容 |
| --- | --- |
| 操作の性質 | ① `member_tags` の `src` 参照を `dest` へ全件付け替え（不可逆・移行先に集約）。② `src` の `tag_definitions` 行を **完全削除**（`code` UNIQUE 解放） |
| rollback | 物理削除した行の復旧は **`bash scripts/cf.sh d1 export` のバックアップ restore のみ**。移行（参照付け替え）の取り消しは §7 の逆移行（`dest`→`src` 戻し）で部分的に可能だが、移行前に `dest` も保有していた member の区別は移行後には付かない（§7 の制約参照）。だから移行前 snapshot 保全（§2）が必須 |
| 拒否経路を退化させない | `migrateTo` 未指定の `DELETE /admin/tags/:tagId/physical` は issue-1070 の挙動（参照あり → 409 `tag_has_references`）のまま。強制移行は `migrateTo` を **明示指定したときだけ** 発火する |
| 移行先検証 | 移行先 `dest` が不在 / 非 active / `src===dest` のときは移行・削除を一切実行せず明示エラーで拒否する（404 `migration_target_not_found` / 409 `migration_target_inactive` / 400 `migration_target_same_as_source`） |

## 2. 移行前 snapshot 保全（必須・最優先）

逆移行ロールバックを可能にするため、**移行を実行する前に `src` の参照行を export** する。これは mutation を伴わない read-only 操作。

```bash
# 認証確認（read-only）
bash scripts/cf.sh whoami

# 移行元 src / 移行先 dest の現状（active / code / label）を確認（read-only）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT tag_id, code, label, category, active FROM tag_definitions WHERE tag_id IN ('<SRC_ID>', '<DEST_ID>')"

# 【最重要】移行前の src 参照 member 一覧を snapshot として保全（逆移行の起点）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT member_id FROM member_tags WHERE tag_id = '<SRC_ID>' ORDER BY member_id" \
  > "snapshot-src-members-<SRC_ID>-<timestamp>.txt"

# 移行前に dest を既に持つ member（衝突 member）も別途保全（逆移行で「戻してはいけない member」の判別用）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT member_id FROM member_tags WHERE tag_id = '<DEST_ID>' ORDER BY member_id" \
  > "snapshot-dest-members-<DEST_ID>-<timestamp>.txt"

# 移行元の参照件数（migratedCount の期待値）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT COUNT(*) AS n FROM member_tags WHERE tag_id = '<SRC_ID>'"
```

- `snapshot-src-members-*.txt` は **逆移行で `dest`→`src` に戻す member の正本リスト**。これが無いと安全な逆移行は不能。
- `snapshot-dest-members-*.txt`（移行前から dest を保有していた member）は、逆移行時に **「元々 dest を持っていただけで src 由来ではない member の dest 行まで誤って消さない」** ための除外リスト。

## 3. backup（実行直前・必須）

物理削除の直前に production DB 全体をエクスポートする（誤削除時の最終復旧手段）。

```bash
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output "backup-before-force-migration-<SRC_ID>-<timestamp>.sql"
```

- backup ファイルと §2 の snapshot は安全な場所に保管し、移行完了後も一定期間保持する。

## 4. user approval marker 手順

- production 強制移行 + 物理削除は **user の明示承認が必須**。承認は `outputs/phase-13/user-approval-<timestamp>.md` に記録する（Phase 13 の user_approval_marker と同経路）。
- marker には最低限: 移行元 `src` の `tag_id`/`code` / 移行先 `dest` の `tag_id`/`code` / §2 で確認した `src` 参照件数 / §2 snapshot のパス / §3 backup のパス / 承認者 / 承認日時 / 実行理由 を記す。
- marker が存在しない状態で §5 / §7 の mutation コマンドを実行してはならない（AI は §8 に従い停止）。

## 5. 実行 → 検証（user 承認後のみ）

```bash
# 推奨: アプリ endpoint 経由（参照付け替え → COUNT=0 再検証 → physical delete を原子実行）。base URL は運用環境の admin API に置換
#   DELETE https://<admin-api>/admin/tags/<SRC_ID>/physical?migrateTo=<DEST_ID>
#   → 204（成功・audit references_migrated + physically_deleted 2 件）
#   → 404 tag_not_found / 404 migration_target_not_found / 409 migration_target_inactive
#   → 400 migration_target_same_as_source / 409 tag_has_references（移行後も残参照ありの防御）
```

緊急時のみ・直接 SQL（endpoint が使えないときに限る・各ステップ後に件数確認・user-gated）:

```bash
# Step 1: src を持つ全 member に dest 行を冪等に確保（衝突は OR IGNORE でスキップ）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "INSERT OR IGNORE INTO member_tags (member_id, tag_id) SELECT member_id, '<DEST_ID>' FROM member_tags WHERE tag_id = '<SRC_ID>'"

# Step 2: src 行を全削除（dest 側に集約済み）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "DELETE FROM member_tags WHERE tag_id = '<SRC_ID>'"

# Step 3: src 参照が 0 になったことを確認（0 でなければ Step 4 へ進まない）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT COUNT(*) AS n FROM member_tags WHERE tag_id = '<SRC_ID>'"

# Step 4: src の tag_definitions 行を物理削除（Step 3 が 0 のときのみ）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "DELETE FROM tag_definitions WHERE tag_id = '<SRC_ID>'"
```

実行後の検証（read-only）:

```bash
# src 行が消えたこと（0 行）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT COUNT(*) AS n FROM tag_definitions WHERE tag_id = '<SRC_ID>'"

# audit に references_migrated + physically_deleted が残ったこと（endpoint 経由時）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT action, target_id, created_at FROM audit_log WHERE target_id = '<SRC_ID>' AND action IN ('admin.tag.references_migrated','admin.tag.physically_deleted') ORDER BY created_at DESC LIMIT 2"
```

## 6. 移行先を誤指定したと判明したら（判断フロー）

| 状況 | 対応 |
| --- | --- |
| **endpoint がエラー（404/409/400）を返し移行・削除が走っていない** | 副作用ゼロ。正しい `dest` を指定して再実行するだけでよい。逆移行不要 |
| **移行は走ったが物理削除前（緊急 SQL の Step 2 まで実行）に誤指定に気づいた** | §7 の逆移行で `dest`→`src` に戻す。`src` 行はまだ残っているため逆移行で復旧可能 |
| **物理削除まで完走（`src` 行が消えた）後に誤指定に気づいた** | §7 逆移行で参照を戻し、さらに `src` の `tag_definitions` 行を §3 backup から再作成する必要がある（物理削除は不可逆ゆえ DB restore 級の重操作・user 承認必須） |

## 7. 逆移行ロールバック手順（dest→src 戻し・user-gated）

> 移行先を誤って指定した場合に、§2 で保全した `snapshot-src-members-*.txt` を正本として、`dest` に付いた参照を `src` へ戻す。**`dest` に付いている参照のうち「元々 dest を持っていた member（`snapshot-dest-members-*.txt`）」は src 由来ではないため戻してはならない。** 戻す対象は `snapshot-src-members - snapshot-dest-members`（src にあって dest に無かった member）に限る。

### 7.1 逆移行の前提

- 物理削除まで完走している場合は、先に `src` の `tag_definitions` 行を復元しておく（§7.3）。`member_tags` には DB-FK が無いため行が無くても参照は張れるが、台帳 master が無いと運用上整合しないため復元を推奨。
- 逆移行も **user approval marker 必須**（§4 と同じ marker に逆移行の事実・対象 member 件数を追記）。

### 7.2 参照を src へ戻す（緊急 SQL・user 承認後）

```bash
# 戻す対象 = src にあって dest に無かった member（snapshot 差分）に src 行を復元
#   <RESTORE_MEMBER_LIST> = snapshot-src-members − snapshot-dest-members を IN 句に展開
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "INSERT OR IGNORE INTO member_tags (member_id, tag_id) SELECT member_id, '<SRC_ID>' FROM member_tags WHERE tag_id = '<DEST_ID>' AND member_id IN (<RESTORE_MEMBER_LIST>)"

# 誤って dest へ付け替えた分を dest から除去（同じく snapshot 差分の member のみ）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "DELETE FROM member_tags WHERE tag_id = '<DEST_ID>' AND member_id IN (<RESTORE_MEMBER_LIST>)"
```

- `<RESTORE_MEMBER_LIST>` は §2 の 2 つの snapshot から **「src snapshot に在り、かつ dest snapshot に無い」member** を抽出して作る。これにより、移行前から dest を保有していた member の dest 行を誤って削除する事故を防ぐ。

### 7.3 物理削除済みの src master 復元（必要時・user 承認後）

```bash
# §3 backup から src 行を再作成（code が他で再利用されていないことを read-only 確認後）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT tag_id, code FROM tag_definitions WHERE code = '<SRC_CODE>'"   # 衝突確認（read-only）
# 衝突がなければ backup の該当 INSERT 文を適用、または DB restore（重操作）
```

### 7.4 逆移行後の検証（read-only）

```bash
# src 参照が snapshot 件数に戻ったこと
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT COUNT(*) AS n FROM member_tags WHERE tag_id = '<SRC_ID>'"
```

## 8. AI 実行禁止カテゴリ（Claude Code を含む全 AI エージェントに適用）

| 操作 | 種別 | AI 実行 |
| --- | --- | --- |
| `bash scripts/cf.sh whoami` | read-only | 可 |
| `SELECT ... FROM tag_definitions WHERE tag_id` | read-only | 可 |
| `SELECT member_id / COUNT(*) FROM member_tags WHERE tag_id`（snapshot 保全 / 件数確認） | read-only | 可 |
| `bash scripts/cf.sh d1 export ...`（backup 取得） | read-only（DB を変更しない） | 可 |
| `DELETE /admin/tags/:tagId/physical?migrateTo=...`（production runtime） | **mutation・不可逆** | **不可**（user 承認 + marker 必須） |
| 直接 SQL の `INSERT OR IGNORE` / `DELETE FROM member_tags` / `DELETE FROM tag_definitions`（production） | **mutation・不可逆** | **不可**（user 承認 + marker 必須） |
| §7 逆移行ロールバック（production の `member_tags` / `tag_definitions` 書き換え） | **mutation** | **不可**（user 承認 + marker 必須） |

- AI は read-only の事前確認・snapshot 保全・backup 取得までを自動範囲とし、**強制移行・物理削除・逆移行の production mutation は user approval marker が無い限り停止** する。
- 移行先が不明 / 合意未済の状態で強制移行を要求された場合、AI は実行せず user に移行先の確定を求める。
