# Phase 2: 設計（fixture / runbook / evidence contract）

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-399-admin-queue-resolve-staging-visual-evidence |
| phase | 02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implementation-prepared |

## 設計サマリ

3 レイヤで構成する:

1. **D1 staging seed**: SQL ファイル + 投入 / 撤去 / 検証スクリプト
2. **screenshot runbook**: admin login → 7 状態の UI 操作 → 取得 → redaction
3. **evidence contract**: ディレクトリ構造 + `phase11-capture-metadata.json` schema

## 1. D1 staging seed 設計

### 変更対象ファイル

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql` | 新規 | 7 状態を再現する synthetic 行を `INSERT`。seed由来行は既存ID列の prefix `ISSUE399-` で識別 |
| `apps/api/migrations/seed/issue-399-admin-queue-staging-cleanup.sql` | 新規 | `DELETE FROM ... WHERE id LIKE 'ISSUE399-%'` を全関連テーブルに対して実行 |

### seed 内容（最小構成）

| 状態 | 必要行 |
| --- | --- |
| Pending visibility list | `admin_member_notes.note_type='visibility_request'` の pending 行 × 3 + 対応する `member_status` 行 |
| Pending delete list | `admin_member_notes.note_type='delete_request'` の pending 行 × 2 + 対応する `member_status` 行 |
| Detail panel | 上記 pending 行のいずれか 1 件に十分な詳細データ（理由・タイムスタンプ） |
| Approve modal | UI 操作で再現（DB 変更不要） |
| Reject modal | UI 操作で再現（DB 変更不要） |
| Empty state | seed 撤去後に確認 |
| 409 toast | 同一行を 2 ブラウザで同時 approve することで再現 |

> 注: 正本テーブルは 04b 実装に合わせて `admin_member_notes` + `member_status`。`member_requests` という別テーブルは採用しない。

### 投入 / 撤去スクリプト

| パス | 種別 | 概要 |
| --- | --- | --- |
| `scripts/staging/seed-issue-399.sh` | 新規 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --file apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql` をラップ |
| `scripts/staging/cleanup-issue-399.sh` | 新規 | cleanup SQL を実行し、`admin_member_notes` / `member_status` / `deleted_members` / `audit_log` の `ISSUE399-` 由来行が 0 であることを確認して exit code 0 |

両スクリプトは `${CLOUDFLARE_ENV}` を確認し `staging` 以外なら `exit 1`（NFR-02 ガード）。

## 2. screenshot runbook 設計

### 変更対象ファイル

| パス | 種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/runbook.md` | 新規 | 手動取得手順（ブラウザ操作 + redaction + 保存先） |
| `runbook.md` | 新規 | 手動取得を正本手順にする。Playwright 補助 script は今回実体化しない |

### redaction ルール

| 対象 | 方針 |
| --- | --- |
| admin email | DevTools で DOM 編集 or 画像編集で黒塗り |
| 実 member 氏名 / email | seed では synthetic 値のみ使用するため redaction 不要 |
| セッション token / cookie | URL bar / DevTools panel を screenshot に含めない |
| Cloudflare account ID 等 | URL bar が staging.ubm-hyogo.workers.dev のみ表示される範囲に限定 |

## 3. evidence contract 設計

### ディレクトリ構造

```
outputs/phase-11/
├── main.md
├── screenshots/
│   ├── 01-pending-visibility-list.png
│   ├── 02-pending-delete-list.png
│   ├── 03-detail-panel.png
│   ├── 04-approve-modal.png
│   ├── 05-reject-modal.png
│   ├── 06-empty-state.png
│   └── 07-409-toast.png
├── phase11-capture-metadata.json
├── manual-test-result.md
├── redaction-check.md
└── discovered-issues.md
```

### `phase11-capture-metadata.json` schema

```json
{
  "captured_at": "ISO8601",
  "staging_url": "https://web-staging.ubm-hyogo.workers.dev",
  "admin_account_ref": "op://Vault/Item/Field",
  "fixture_summary": { "pending_visibility": 3, "pending_delete": 2 },
  "screenshots": [
    { "file": "01-pending-visibility-list.png", "captured_at": "ISO8601", "redaction_applied": ["admin_email"] }
  ],
  "cleanup_verified_at": "ISO8601",
  "cleanup_verified_count": 0
}
```

## 4. 親 workflow 反映 diff 案

| パス | 種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/04b-followup-004-admin-queue-resolve-workflow/outputs/phase-12/implementation-guide.md` | 編集 | "Visual evidence (delegated)" セクションに本 workflow の `outputs/phase-11/screenshots/` への relative link を追記 |

## 完了条件

- [ ] - 上記 4 レイヤすべての変更対象ファイル一覧 / シグネチャ / 入出力が `outputs/phase-02/main.md` に記録されていること

## 目的

Phase 02 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 02 の入力、実装状態、runtime pending 境界を確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-02/main.md`

## 統合テスト連携

- Focused Vitest は Phase 09 の品質 gate に集約する。
