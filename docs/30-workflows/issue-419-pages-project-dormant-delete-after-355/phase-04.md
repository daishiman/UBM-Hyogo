# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| destructiveOperation | true |

## テスト方針

本タスクは **destructive ops + NON_VISUAL evidence** が主目的のため、自動テストは以下に限定する:

- redaction grep gate（CI 相当の手動 gate として運用）
- preflight script の dry-run（read-only コマンドの exit code 確認）
- `pnpm typecheck` / `pnpm lint`（プロジェクト共通 gate / Phase 09 で実行）

実 Pages 削除 / 観察期間運用は user 承認後の runtime cycle で実行され、unit test 化はしない。

## テスト一覧

| ID | 種別 | 対象 | 期待値 |
| --- | --- | --- | --- |
| T-01 | manual / dry-run | `bash scripts/cf.sh pages project list` | exit 0、Pages プロジェクト一覧が取得できる（read-only） |
| T-02 | manual / dry-run | `bash scripts/cf.sh api-get /client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects` | exit 0、active custom domain が 0 件であること（AC-2 preflight） |
| T-03 | manual / dry-run | redaction grep `rg -i "(token|bearer|sink|secret|CLOUDFLARE_API_TOKEN|Authorization)" docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/` | 0 件（AC-5 / NFR-01） |
| T-04 | gate（CI 相当） | `mise exec -- pnpm typecheck` | 0 errors |
| T-05 | gate（CI 相当） | `mise exec -- pnpm lint` | 0 errors |
| T-06 | manual / runtime | `bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes` | exit 0（Phase 11、user 承認後） |
| T-07 | manual / runtime | 削除後 Workers production smoke（GET production URL） | 200 OK（Phase 11、AC-1） |
| T-08 | manual / runtime | observation period log の append-only 整合 | 開始日 / 中間チェック / 終了日 / 結果 が時系列で揃う（Phase 11、AC-3） |

## redaction gate 詳細

```bash
# AC-5 確認用 grep（0 件期待）
rg -i "(token|bearer|sink|secret|CLOUDFLARE_API_TOKEN|Authorization)" \
  docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/
```

ヒットがあれば evidence ファイルから redact し、再実行で 0 件になるまで反復する。Phase 11 の `redaction-check.md` で実行記録を残す。

## 自動テストファイル

本タスクでは **新規追加なし**。理由:

- `bash scripts/cf.sh` のラッパー単体テストは scripts/cf.sh 側の責務（本タスクは pages サブコマンド追加分のみで、追加分も op run / mise exec / wrangler 委譲のみ）
- Pages 削除 / 観察期間運用は実環境依存で、unit test 化すると実値混入リスク（NFR-01 違反）が発生する

## 実行コマンド（Phase 04 / Phase 09 段階）

```bash
# Phase 04 段階（仕様書のみ）: 実行不要
# Phase 09 段階（CI 相当 gate）:
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# Phase 11 段階（runtime / user 承認後）:
bash scripts/cf.sh whoami
bash scripts/cf.sh pages project list
bash scripts/cf.sh api-get /client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects
# → user 承認取得 →
bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes
# → 事後 smoke + redaction grep
rg -i "(token|bearer|sink|secret|CLOUDFLARE_API_TOKEN|Authorization)" \
  docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/
```

## 完了条件（DoD）

- [ ] T-01〜T-05 が gate として `outputs/phase-04/main.md` に記録されていること
- [ ] T-06〜T-08 が Phase 11 への申し送りとして明記されていること
- [ ] redaction grep のコマンドが Phase 11 / Phase 09 双方で参照可能な単一定義として存在すること

### 全体 DoD（本ワークフローの最終 DoD、Phase 11 で確認）

- redaction grep が **0 件**
- Pages 削除コマンド exit code = 0
- 削除後の Workers production smoke 200 OK
- dormant 観察期間ログが最低 2 週間分 append-only で揃っている
- user 明示承認が `outputs/phase-11/user-approval-record.md` および PR description / Issue comment に記録されている
- aiworkflow-requirements references の Pages 言及箇所が「削除済み（YYYY-MM-DD）」へ更新されている（AC-6）

## 目的

Phase 04 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 04 の入力、実装状態、runtime pending 境界を確認する
- redaction grep / preflight dry-run の手順確定
- Phase 09 / Phase 11 gate との連携確認

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [phase-01.md](phase-01.md)
- [phase-02.md](phase-02.md)
- [phase-03.md](phase-03.md)

## 成果物

- `outputs/phase-04/main.md`

## 統合テスト連携

- redaction grep / typecheck / lint は Phase 09 の品質 gate に集約する。
