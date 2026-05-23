[実装区分: 実装仕様書]

# UT-25-DERIV-01: SA Service Account key 定期ローテーション運用 SOP - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-25-DERIV-01 |
| タスク名 | SA Service Account key 定期ローテーション運用 SOP |
| ディレクトリ | docs/30-workflows/ut-25-deriv-01-sa-key-rotation-sop |
| Wave | 2（HIGH） |
| 実行種別 | serial |
| 作成日 | 2026-05-22 |
| 状態 | implemented_local_evidence_captured |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | sa_key_rotation_sop |
| 親タスク | UT-25 |
| 親仕様 (stub) | docs/30-workflows/unassigned-task/UT-25-DERIV-01-sa-key-rotation-sop.md |
| GitHub Issue | #242 |
| 実装区分 | 実装完了（コード変更を伴う: bash helper + SOP markdown + 完了記録テンプレ + bats test） |

## 目的

UT-25 で本番配置した `GOOGLE_SERVICE_ACCOUNT_JSON`（Google Service Account JSON key）を、無停止でローテーションするための運用 SOP を策定し、ローテーション補助 helper スクリプトと完了記録テンプレートを実装する。実値・JSON 内容を一切ドキュメントに残さず、`scripts/cf.sh` ラッパー経由・stdin パイプ・shell 履歴抑止を強制する経路を bash helper と bats テストで保証する。

## 実装区分の根拠

- 新規 helper スクリプト（`scripts/cf-rotate-sa-key.sh`）を作成する → コード変更あり
- SOP markdown 本体（`docs/30-workflows/runbooks/sa-key-rotation-sop.md`）を作成する → ドキュメント新規
- bats テスト（`scripts/__tests__/cf-rotate-sa-key.bats`）を作成する → コード変更あり
- 既存 helper の variant ではなく、ローテーション専用の冪等性 / dry-run / grace period 計測責務を持つため独立スクリプトで実装する

## スコープ

### 含む

- `scripts/cf-rotate-sa-key.sh`（独立 bash helper、stdin パイプ・dry-run・shell 履歴抑止 enforcer 付き）の設計と実装仕様
- `docs/30-workflows/runbooks/sa-key-rotation-sop.md`（SOP markdown 本体）の設計と章立て仕様
- `docs/30-workflows/runbooks/sa-key-rotation-records/TEMPLATE.md`（完了記録テンプレート）
- `scripts/__tests__/cf-rotate-sa-key.bats`（bats による単体テスト：既存リポジトリ慣行に整合）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` への SOP 逆参照追記
- ローテーション state machine（new 発行 → staging put → staging 検証 → production put → production 検証 → grace 24-48h → disable → 7 日 → delete）の定義
- 完了記録テンプレート（実施日 / 実施者 / 旧 key fingerprint / 新 key fingerprint / staging 検証時刻 / production 検証時刻 / disable 時刻 / delete 時刻）の設計

### 含まない

- 実 SA key の発行・ローテーション実行（SOP 公開後の運用作業）
- SA 自体の新規作成・削除（01c-parallel-google-workspace-bootstrap のスコープ）
- Sheets API 疎通確認の実装（UT-26 のスコープ）
- SA key 失効監視 alert の実装（UT-25-DERIV-02 のスコープ）
- Cloudflare Secret audit log の取得自動化（UT-25-DERIV-03 のスコープ）
- GitHub Actions 経由の自動ローテーション（UT-25-DERIV-04 のスコープ・将来）

## 受入条件 (AC)

stub の AC 3 件と完了条件 9 件を Phase 10 のチェックリストへ全件反映する。

- AC-1: ローテーション SOP 文書が `docs/30-workflows/runbooks/sa-key-rotation-sop.md` に固定され、頻度（90 日採用・根拠付き）/ staging→production 順序固定 / stdin パイプ強制 / `HISTFILE=/dev/null` 併用 / grace period 24-48h + disable 後 7 日保持 / `wrangler tail` 60 秒待機 + UT-26 疎通テスト / rollback 経路（`outputs/phase-13/rollback-runbook.md` 逆参照）/ 実値非掲載（`op://` 参照のみ）/ 完了記録テンプレ同梱、の 9 条件を全て満たす。
- AC-2: ローテーション helper `scripts/cf-rotate-sa-key.sh` が `scripts/cf.sh secret put` を stdin パイプ経由のみで呼び出し、`wrangler` を直接呼ばず、`HISTFILE=/dev/null` と `set +o history` を強制し、dry-run mode をサポートする。bats テスト全件 PASS / shellcheck PASS。
- AC-3: 完了記録テンプレート `docs/30-workflows/runbooks/sa-key-rotation-records/TEMPLATE.md` に「実施日 / 実施者 / 旧 key fingerprint / 新 key fingerprint / staging 検証時刻 / production 検証時刻 / disable 時刻 / delete 時刻」の必須フィールドが含まれている。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-1.md | completed |
| 2 | 設計 | phase-2.md | completed |
| 3 | 設計レビュー | phase-3.md | completed |
| 4 | テスト作成 (TDD RED) | phase-4.md | completed |
| 5 | 実装 (TDD GREEN) | phase-5.md | completed |
| 6 | テスト拡充 (異常系) | phase-6.md | completed |
| 7 | カバレッジ確認 | phase-7.md | completed |
| 8 | リファクタリング | phase-8.md | completed |
| 9 | 品質保証 | phase-9.md | completed |
| 10 | 最終レビュー | phase-10.md | completed |
| 11 | 手動テスト (NON_VISUAL 代替証跡) | phase-11.md | completed |
| 12 | ドキュメント更新 | phase-12.md | completed |
| 13 | PR 作成 | phase-13.md | pending_user_approval |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| - | wrangler 直接実行禁止（CLAUDE.md） | helper / SOP は `bash scripts/cf.sh` ラッパー経由のみ |
| - | 平文 secret 禁止（CLAUDE.md） | helper は stdin パイプ強制、SOP は `op://` 参照のみ記載 |

## 主要参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-25-DERIV-01-sa-key-rotation-sop.md | 親 stub（AC / 完了条件 9 件の正本） |
| 必須 | docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md | rollback 逆参照先 |
| 必須 | scripts/cf.sh | secret put / list のラッパー（直接 wrangler 禁止） |
| 必須 | CLAUDE.md | Cloudflare CLI 実行ルール / シークレット管理ルール |
| 参考 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | SOP markdown の章立て参考 |
| 参考 | scripts/d1/__tests__/preflight.bats | bats テスト慣行の参考 |
| 関連 | docs/30-workflows/unassigned-task/UT-25-DERIV-02-sa-key-expiry-monitoring.md | 下流連携（fingerprint 反映先） |
| 関連 | docs/30-workflows/unassigned-task/UT-25-DEFER-01-cf-secrets-dr-backup.md | スコープ重複チェック対象 |

## 完了判定

- 16 ファイル（index.md / artifacts.json / outputs/artifacts.json / phase-1.md..phase-13.md）が本ディレクトリ配下に存在する
- 実装対象ファイル（helper / bats / SOP / record template / aiworkflow sync）が存在する
- Phase 11 evidence と Phase 12 strict 7 が outputs 配下に存在する
- 全 Phase の status が `completed`（Phase 13 のみ `pending_user_approval`）で artifacts.json と一致
