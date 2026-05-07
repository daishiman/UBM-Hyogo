# issue-402 follow-up: audit_log 自体への retention 適用

## メタ情報

```yaml
issue_number: 402
```

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| タスクID     | task-issue-402-audit-log-retention-followup-001            |
| タスク名     | audit_log テーブル自体の retention ポリシー設計と適用      |
| 分類         | follow-up / data-retention                                 |
| 対象機能     | audit_log table の保持期間管理                             |
| 優先度       | Medium                                                     |
| 見積もり規模 | 中規模                                                     |
| ステータス   | 未実施                                                     |
| 発見元       | issue-402 Phase 12 unassigned-task-detection (`scope out`) |
| 発見日       | 2026-05-06                                                 |

---

## 1. 概要

issue-402 では `members` 系 row の retention purge を実装したが、**`audit_log` テーブル自体の retention** はスコープ外として明示的に除外した。本タスクでは audit_log の保持期間を SSOT (`data-retention-policy.md` §12) に追加し、長期保管要件と GDPR 類似の最小化原則のバランスを取った retention を別 cron もしくは同 cron の別 mode として適用する。

## 2. 背景

issue-402 の retention purge job は member 系 PII を物理削除するが、その削除事実を残す `audit_log` 自体は無期限に増え続ける設計のままになっている。Phase 12 unassigned-task-detection.md にも:

> audit_log table への retention 適用 / 結果: scope out / 備考: `audit_log` 自体の retention は本タスクスコープ外。data-retention-policy.md に future TODO として記録

と記録済み。member purge との整合（「会員情報は消えたが audit_log には member_id ハッシュが残る」状態の保持期間）を policy 化する必要がある。

## 3. 目的

- `audit_log` 行の保持期間ポリシーを SSOT に追記し、
- 期間超過行を物理削除（または匿名化アーカイブ）する仕組みを issue-402 と同等の dry-run/apply ゲートで実装する。

## 4. スコープ

### 含むもの (in)

- `data-retention-policy.md` §12 に audit_log retention 期間の追記（候補: 1 年 / 3 年 / 永続のいずれか + 根拠）
- 現行 audit_log カラム棚卸し（PII 残存の有無、member_id ハッシュ化済みかの再確認）
- audit_log 用 retention job の設計（issue-402 と同 cron に mode 追加 or 別 cron 切り分けの判断）
- dry-run / apply / audit (audit_log の retention を audit する meta-audit) のゲート設計
- 単体・統合テスト
- staging runtime evidence

### 含まないもの (out)

- member 系 retention 仕様変更（issue-402 で確定済）
- approve email 文言（`task-issue-402-approve-email-template-001`）
- production apply 切替（本タスク完了後に別途 Gate C タスク化）

## 5. 苦戦箇所として想定される観点

| 項目                  | 内容                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT 同期             | `data-retention-policy.md` を正本とし、wrangler.toml / job 実装 / 本タスク手順が三位一体で更新される必要。member 側 retention と区別された期間値を持つ |
| meta-audit のループ   | audit_log の物理削除自体が audit_log に書かれるとループで肥大化する。retention job の発火を audit する別レイヤの設計が必要                            |
| 法的・コンプラ要件    | retention 期間の根拠（理事会記録 / 監査要件 / 個人情報保護方針）が SSOT 上で説明できるか                                                              |
| member purge との整合 | member row 削除直後の audit_log は最低限の保持期間で残す必要があるが、ハッシュのみで個人特定不能であれば短く保持してもよい                            |
| 不可逆操作            | audit_log は法的監査の根拠になる可能性があるため、誤削除のインパクトが member purge より大きい場合がある                                              |

## 6. リスクと対策

| リスク                                                              | 影響度 | 発生確率 | 対策                                                                                            |
| ------------------------------------------------------------------- | ------ | -------- | ----------------------------------------------------------------------------------------------- |
| 法的根拠なく audit_log を短期で削除                                 | 高     | 中       | retention 期間を 1 年未満に設定する場合は理事会承認を SSOT に記録し、デフォルトは 3 年保持      |
| meta-audit のループで audit_log が爆発的に増える                    | 中     | 中       | retention job の自己 log は専用 tag で分け、retention 自体の log は別 retention で管理         |
| member 側 retention と整合しない期間設定                            | 中     | 中       | data-retention-policy.md にマトリクス（テーブル × 期間 × 根拠）を新設し integrate review        |
| PII 残存に気付かずまま retention 適用                               | 高     | 低       | 適用前に audit_log カラム棚卸しを必須フェーズとして set                                         |

## 7. 検証方法

### 受け入れ基準

- `data-retention-policy.md` §12 に audit_log の保持期間と根拠が明記されている
- audit_log 用 retention job が dry-run / apply の双方を備える
- staging で 1 件の retention apply が成功し、対象行が消えている
- meta-audit log が retention job 自体の発火を最低限の情報量で残している
- 法的・運用上の根拠が SSOT で説明可能

## 8. 関連

- `docs/30-workflows/issue-402-admin-request-retention-physical-delete/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md`
- `apps/api/src/jobs/` (issue-402 retention purge 実装の参照ベースライン)
- `task-issue-402-staging-runtime-evidence-001.md`（同等パターンの staging evidence 取得）

## 9. 備考

| 項目 | 内容 |
| ---- | ---- |
| 苦戦箇所 | issue-402 では member 物理削除に集中するため audit_log retention を切り出したが、未実施のままだと audit_log が無制限に増える運用負債が残る |
| 原因 | 1 タスク内に 2 系統の retention を抱えると user-gate 境界が複雑化 |
| 対応 | 別 follow-up タスクとして起票、SSOT に future TODO として記録済 |
| 再発防止 | data-retention-policy.md にテーブル単位の retention マトリクスを置き、各テーブルの担当タスクを 1:1 で対応付ける |
