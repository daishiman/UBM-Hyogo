# ut-08a-04-d1-migration-test-guideline - タスク実行仕様書

> [実装区分: 実装仕様書]
> 判定根拠: 主成果物は governance runbook 文書だが、(1) `.github/workflows/d1-migration-verify.yml` への runbook link コメント step 追加、(2) `apps/api/migrations/README.md` への最低基準セクション追加、(3) 検証スクリプト `scripts/d1/__tests__/migration-guideline-presence.bats` の追加 を伴うため、CONST_004 により実装仕様書として作成する。

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | ut-08a-04-d1-migration-test-guideline |
| GitHub Issue | #323（CLOSED のままタスク仕様書のみ作成 / 再 OPEN しない） |
| 親タスク | 08a-parallel-api-contract-repository-and-authorization-tests |
| 起票元 | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` §4 |
| 検出仕様書 | `docs/30-workflows/unassigned-task/UT-08A-04-d1-migration-test-guideline.md` |
| 作成日 | 2026-05-15 |
| ステータス | implemented_local_runtime_pending |
| 総 Phase 数 | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_runtime_pending |
| Wave | 1 |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |

---

## 目的

UT-04 / 02b の初期 migration test 完了後、後続の D1 migration 追加時の test 化責任が未割当のため、(1) 最低基準ガイドラインを runbook 文書として正本化し、(2) 02b suite と各タスク個別 test の責任境界を明記し、(3) `apps/api/migrations/**` 変更を含む PR で runbook link を自動コメントする CI step を `d1-migration-verify.yml` に追加して、将来の migration 追加時に gate / レビュー観点が散らばらないようにする。

本仕様書は `implemented_local_runtime_pending` であり、runbook / README / workflow / bats はローカル実装済みとして扱う。PR comment 実投稿だけは Phase 13 の PR 作成後に取得する user-gated runtime evidence として残す。

## スコープ

### 含む

- `docs/30-workflows/runbooks/d1-migration-test-guideline.md` 新規作成（最低基準 3 項目 / 02b 責任範囲 / 適用フロー）
- `apps/api/migrations/README.md` 新規作成または既存への追記（runbook への 1 行リンク）
- `.github/workflows/d1-migration-verify.yml` への "post runbook link comment" step 追加（既存 verify job と独立した軽量 job、または同 job 末尾の step）
- `scripts/d1/__tests__/migration-guideline-presence.bats` 追加（runbook 文書の必須見出し 3 件の presence assertion）
- `aiworkflow-requirements` skill 内 `references/runbooks-index.md`（存在する場合）への新 runbook 登録
- Phase 12 での `system-spec-update-summary` / `documentation-changelog` / `phase12-task-spec-compliance-check` 作成

### 含まない

- 既存 migration への遡及的 test 追加（02b suite が initial schema 専用として完了済み）
- 新規 migration の実体追加（個別 task の責務）
- D1 schema 自体の見直し
- Phase 13 の commit / push / PR 作成（user_approval 必須）

## 受入条件（AC）

- AC-1: `docs/30-workflows/runbooks/d1-migration-test-guideline.md` が存在し、次の 3 セクションと最低基準 3 語句を含む: 「最低基準（forward apply green / contract test pass / repository or use-case test 1 件以上追加）」「02b suite 責任範囲（initial schema 専用 / 以降は task 個別）」「適用フロー（PR 作成時に runbook を確認するレビュー観点）」
- AC-2: `apps/api/migrations/README.md` から AC-1 の runbook への相対リンクが存在
- AC-3: `.github/workflows/d1-migration-verify.yml` に `apps/api/migrations/**` を含む PR に runbook link を自動コメントする step が追加され、`pull_request` イベントで `actions/github-script` または `peter-evans/create-or-update-comment` 等の許可済 action で投稿される（既存 verify job の green/fail と独立して post されるため `if: always() && github.event_name == 'pull_request'` と `continue-on-error: true` を必須とする）
- AC-4: `scripts/d1/__tests__/migration-guideline-presence.bats` が runbook の必須 3 見出しの presence を assert し、`bats scripts/d1/__tests__/*.bats` で green
- AC-5: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き
- AC-6: Phase 12 で必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main）作成
- AC-7: 不変条件 #5（D1 直接アクセスは apps/api 限定）に違反しない（本タスクは文書 + CI のみで apps/web への変更なし）

---

## Phase 一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | completed |
| 2 | 設計（runbook 構造 + CI comment step） | [phase-02.md](phase-02.md) | completed |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | completed |
| 4 | 検証戦略 | [phase-04.md](phase-04.md) | completed |
| 5 | runbook 作成（最低基準 / 責任範囲） | [phase-05.md](phase-05.md) | completed |
| 6 | 異常系（runbook 不在 / CI comment 失敗） | [phase-06.md](phase-06.md) | completed |
| 7 | AC マトリクス | [phase-07.md](phase-07.md) | completed |
| 8 | DRY 化 / 仕様間整合 | [phase-08.md](phase-08.md) | completed |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | completed |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | completed |
| 11 | 手動検証（NON_VISUAL） | [phase-11.md](phase-11.md) | completed |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | completed |
| 13 | PR 作成 | [phase-13.md](phase-13.md) | blocked_until_user_approval |
