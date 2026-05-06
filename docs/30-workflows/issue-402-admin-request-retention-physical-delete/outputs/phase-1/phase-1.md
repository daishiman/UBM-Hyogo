# Phase 1: 要件定義・GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |

## 目的

Issue #402 の AC を確定し、retention 期間（90 / 180 / 365 日）の選定肢から MVP 採用案を決定する。あわせて audit minimum / PII 列の物理削除 vs 匿名化方針を文書化し、Phase 2 着手の GO/NO-GO を判定する。

## Step 0: P50 チェック（必須）

```bash
# 1) deleted_members schema の存在
find apps/api/migrations -name 'deleted-members*' \
  | tee outputs/phase-1/schema-presence.log

# 2) 親 Issue #319 の merge 状態
gh pr view 319 --json mergedAt,state \
  | tee outputs/phase-1/parent-pr-319.json

# 3) wrangler.toml の Cron Trigger 利用余地
grep -nE '^\[triggers\]|crons' apps/api/wrangler.toml \
  | tee outputs/phase-1/wrangler-triggers.log

# 4) member_* schema の列確認（PII 列特定の前提）
grep -rE 'fullName|email|phone|address' apps/api/migrations \
  | tee outputs/phase-1/pii-columns.log
```

期待:

- `deleted-members.ts` が存在
- PR #319 が `mergedAt != null`
- `[triggers]` セクションが未定義（追加余地）または既存 cron と衝突なし
- PII 列（氏名 / email / 電話 / 住所）が `member_responses` または `member_identities` に存在

## retention 期間 選定肢

| 案 | 期間 | 根拠 | 採用判定 |
| --- | --- | --- | --- |
| A | 90 日 | 苦情受付の社内 SLA（30 日）+ 余裕 60 日。短く運用負荷は最低 | NOT RECOMMENDED — 申請者からの再撤回 / 法務問い合わせに対する余裕が薄い |
| **B** | **180 日** | **GDPR の慣例（6 ヶ月相当）+ 国内自治体個人情報保護条例での問合せ対応想定期間** | **RECOMMENDED — MVP 採用** |
| C | 365 日 | 会計年度をまたぐ監査要請に対応 | DEFERRED — 監査要件が出てから policy version v2 で再検討 |

採用根拠: UBM 兵庫支部会は personal data 保有を最小化する方針で、180 日で個人特定データを物理削除しつつ audit minimum は半永久保持することで accountability と minimization のバランスを取る。

## audit minimum

`deleted_members` 行は retention 経過後も以下フィールドのみ永続保持する:

| 列 | 用途 |
| --- | --- |
| `member_id` | audit 連鎖キー |
| `deleted_by` | 承認した admin / operation actor |
| `deleted_at` | 論理削除時刻（不可逆判定基準） |
| `reason` | 削除理由（既存 tombstone payload。新規 audit_log には転記しない） |
| `purged_at` | 物理削除実施時刻 |
| `retention_policy_version` | 適用した retention policy version |

`member_responses` / `member_identities` / `member_status` と、それらに連なる `response_fields` / `response_sections` は retention 経過後に物理削除する。`deleted_members` には snapshot 名前 / email 等の PII 列を追加しない。

## 物理削除 vs 匿名化（ハイブリッド方針）

| 対象 | 方針 | 理由 |
| --- | --- | --- |
| `member_responses` 全行（該当 memberId） | 物理削除 | フォーム回答は個人識別情報の塊で匿名化価値が低い |
| `member_identities` 全行（該当 memberId） | 物理削除 | email / Google sub は匿名化しても再識別容易 |
| `member_status` 全行（該当 memberId） | 物理削除 | 状態のみで集計価値が低い |
| `deleted_members` | tombstone 保持 | PII-bearing row は持たせず、audit minimum のみ残す |
| `deleted_members.{member_id, deleted_by, deleted_at, reason, purged_at, retention_policy_version}` | 永続保持 | audit minimum |

## 不可逆通知（approve 時）

- approve 操作の email / マイページ通知に「本削除実施日: {deletedAt + retentionDays}」を明示
- 撤回は `deletedAt + retentionDays` 直前まで admin 経由で reversible
- 物理削除以後は復元不能であることを明文化

## Acceptance Criteria

| ID | 内容 | 計測方法 |
| --- | --- | --- |
| AC-1 | retention 期間が policy version v1 として確定（180 日採用） | `data-retention-policy.md` の grep |
| AC-2 | audit minimum 6 列が SSOT に明記 | 同上 |
| AC-3 | PII 列の物理削除 vs 匿名化マトリクスが SSOT に明記 | 同上 |
| AC-4 | `deleted_members` schema に retention metadata 列追加（migration 含む） | rg migration check |
| AC-5 | `runRetentionPurge` の dry-run / apply 双方が miniflare D1 で成功 | Vitest |
| AC-6 | dry-run 時 `appliedCount === 0` 不変条件を property test で確認 | Vitest |
| AC-7 | 削除順序が子→親（response_fields/response_sections → responses → identities/status → deleted_members tombstone update）で実装 | Phase 3 図と diff |
| AC-8 | approve 時の通知文言に「本削除実施日」が含まれる仕様確定 | spec grep |
| AC-9 | manual runbook が dry-run / apply / rollback 3 節を含む | grep |
| AC-10 | retention 関連コードの coverage ≥ 80% | vitest coverage report |

## GO / NO-GO 判定

| 条件 | 判定 |
| --- | --- |
| Step 0 全て期待通り、かつ retention 採用案 B (180 日) 確定 | GO（Phase 2 へ） |
| `deleted-members.ts` 不在 | NO-GO（#319 取り込み待ち） |
| Cron Trigger が他 cron で衝突 | NO-GO（schedule 再設計） |
| PII 列が想定外に多くハイブリッド方針が破綻 | NO-GO（policy 再設計） |

## 成果物

- `outputs/phase-1/schema-presence.log`
- `outputs/phase-1/parent-pr-319.json`
- `outputs/phase-1/wrangler-triggers.log`
- `outputs/phase-1/pii-columns.log`
- `outputs/phase-1/go-no-go-decision.md`（判定結果と根拠）
