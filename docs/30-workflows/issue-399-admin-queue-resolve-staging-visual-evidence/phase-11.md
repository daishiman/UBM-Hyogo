# Phase 11: staging visual evidence 取得（VISUAL_ON_EXECUTION）

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-399-admin-queue-resolve-staging-visual-evidence |
| phase | 11 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implementation-prepared |

## visualEvidence 区分

`VISUAL_ON_EXECUTION` — 仕様書作成時点では evidence 未取得。user 承認付き staging runtime cycleで `runbook.md` に従い実取得する。

## declared outputs（実装サイクルで実体化必須）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 サマリ（取得日時 / 実施者 / 結果 PASS/BLOCKED/FAIL） |
| `outputs/phase-11/manual-test-result.md` | 7 状態の取得結果（OK/NG + 補足） |
| `outputs/phase-11/redaction-check.md` | 全 screenshot の redaction 検証結果 |
| `outputs/phase-11/discovered-issues.md` | 取得中に発見した問題 / 0 件でも空配列で出力 |
| `outputs/phase-11/phase11-capture-metadata.json` | Phase 02 schema に従う metadata |
| `outputs/phase-11/screenshots/01-pending-visibility-list.png` | Pending visibility list |
| `outputs/phase-11/screenshots/02-pending-delete-list.png` | Pending delete list |
| `outputs/phase-11/screenshots/03-detail-panel.png` | Detail panel |
| `outputs/phase-11/screenshots/04-approve-modal.png` | Approve modal |
| `outputs/phase-11/screenshots/05-reject-modal.png` | Reject modal |
| `outputs/phase-11/screenshots/06-empty-state.png` | Empty state（cleanup 後） |
| `outputs/phase-11/screenshots/07-409-toast.png` | 409 already-resolved toast |

## 取得手順（runbook.md に詳細）

1. 1Password 経由で admin 認証情報を取得（ファイルに値を残さない）
2. seed 投入: `CLOUDFLARE_ENV=staging bash scripts/staging/seed-issue-399.sh`
3. staging URL `https://web-staging.ubm-hyogo.workers.dev/admin/requests` にアクセス
4. 各状態を `runbook.md` に従って手動取得
5. redaction を全画像に適用 → `redaction-check.md` に PASS 記録
6. `phase11-capture-metadata.json` を作成
7. cleanup: `CLOUDFLARE_ENV=staging bash scripts/staging/cleanup-issue-399.sh`
8. cleanup 後に再アクセスし `06-empty-state.png` を取得
9. `manual-test-result.md` / `main.md` を埋めて Phase 11 PASS とする

## implementation-prepared 時点の placeholder

`outputs/phase-11/main.md` は user 承認付き staging runtime cycle 開始時に以下フォーマットで初期化:

```markdown
# Phase 11 — staging visual evidence

state: PENDING_IMPLEMENTATION_FOLLOW_UP
captured_at: -
result: -
```

## 完了条件（実装サイクル）

- [ ] 7 screenshot すべて取得済 / redaction PASS
- [ ] cleanup 検証 count=0
- [ ] `manual-test-result.md` が全 7 状態 OK
- [ ] secret / PII 漏洩なし

## 目的

Phase 11 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 11 の入力、実装状態、runtime pending 境界を確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-11/main.md`

## 統合テスト連携

- Focused Vitest は Phase 09 の品質 gate に集約する。
