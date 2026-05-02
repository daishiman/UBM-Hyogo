# Phase 12: ドキュメント更新 — メインサマリー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 12（ドキュメント更新） |
| 状態 | spec_created root / Phase 12 artifact completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 上流 | Phase 1〜11 成果物（Phase 11 は planned evidence container として生成済み、実測は未実施） |
| 並列タスク | U-FIX-CF-ACCT-02（CI/CD runtime warning cleanup） |

## 1. 本 Phase の責務

本 Phase は **Cloudflare API Token のスコープ最小化監査** に関するドキュメント整備を統括する。
コード変更（`apps/`、`packages/`、`scripts/`）はスコープ外であり、本タスクは **ランブック・ADR 方針・実装ガイド** を整備するに留める。
`workflow_state` は `spec_created` のままで `completed` に昇格させない（Phase 11 の verified が前提）。

## 2. 更新対象ドキュメント一覧

| 区分 | パス | 本タスクでの扱い | タイミング |
| --- | --- | --- | --- |
| workflow-local | `docs/30-workflows/u-fix-cf-acct-01-.../index.md` | root は `spec_created`、Phase 1〜12 は成果物作成済みとして `completed` | 本 Phase |
| workflow-local | `docs/30-workflows/u-fix-cf-acct-01-.../artifacts.json` | root は `spec_created`、Phase 13 は `blocked_until_user_approval` | 本 Phase |
| workflow-local | `outputs/phase-12/*` | 7 ファイルを生成（main + 6 補助） | 本 Phase |
| global skill | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | **Phase 11 verified 後にのみ追記**。spec_created 段階では参照のみ | Phase 11 verified 後 |
| global skill | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 同上（Phase 11 verified 後） | Phase 11 verified 後 |
| global skill | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | 同上（Phase 11 verified 後） | Phase 11 verified 後 |
| global skill | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | `generate-index.js` で再生成 | Phase 11 verified 後 |
| global skill | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `generate-index.js` で再生成 | Phase 11 verified 後 |
| LOGS | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 参照のみ。runtime fact 未検証のため追記しない | Phase 11 verified 後 |
| LOGS | `.claude/skills/task-specification-creator/LOGS/_legacy.md` | 参照のみ。skill behavior 変更なしのため追記しない | N/A |

## 3. 差分方針（更新スタンス）

1. **Token 値・Account ID 値は一切記載しない**。権限名・検証コマンド・期待結果のみを残す。
2. **正本仕様（aiworkflow-requirements/references）への上書きは Phase 11 verified を待つ**。spec_created 段階で 6 権限へ広げて記録すると、後段で 4 権限に絞った時に正本が drift する。
3. **workflow-local と global skill 同期は別ブロックで管理**（`documentation-changelog.md` で分離）。混在させると `phase12-task-spec-compliance-check.md` で不整合を検出される。
4. **Phase 11 evidence への参照のみ記載**（実体は Phase 11 で生成）。
5. **ADR は本タスク配下に配置**（`outputs/phase-12/adr-cloudflare-token-scope.md`、Phase 2 §9 の方針に従う）。U-FIX-CF-ACCT-02 と相互参照する。

## 4. Phase 12 必須 7 ファイル

| Task | ファイル | 役割 |
| --- | --- | --- |
| 12-0 | `outputs/phase-12/main.md` | 本サマリー |
| 12-1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生向け）+ Part 2（技術者向け） |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A〜1-C / Step 2 判定 |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | workflow-local / global skill / LOGS 別ブロック |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（最低 2 件、Phase 3 の MINOR 由来） |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | スキルフィードバック |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | parity / 7 ファイル / Token 値非露出の compliance |

## 5. AC マトリクス（本 Phase で扱う AC）

| AC | 本 Phase での扱い |
| --- | --- |
| AC-1 | implementation-guide.md Part 2 に権限マトリクス（§3.1 P1〜P4 / §3.3 不要候補）を再掲し、不要 0 件を再確認 |
| AC-2 | Part 2 に「正本 4 権限 + 追加候補 2 種（実測昇格）」の方針を明記 |
| AC-3〜AC-5 | Phase 4・11 evidence への参照として記録（実測は Phase 11） |
| AC-6 | Part 2 の適用順序図 T0〜T5 として再掲 |
| AC-7 | Part 2 の rollback 手順 R1〜R5 として再掲 |
| AC-8 | 本 Phase の全成果物に Token 値が含まれないことを compliance check で確認 |
| AC-9 | Part 2 §「不変条件 #5 への影響なし」節で再宣言 |
| AC-10 | Part 2 §「U-FIX-CF-ACCT-02 との関係」で ADR 整合を明記 |
| AC-11 | skill 検証 4 条件の PASS を skill-feedback-report.md で参照 |
| AC-12 | Part 2 の検証コマンドに `gh secret list` の値非出力を明記 |

## 6. workflow_state 据え置きの根拠

- 本タスクは Phase 11（手動 smoke）が未実施のため、Cloudflare 側の権限突合・dry-run 結果が未取得。
- spec_created → verified への昇格は Phase 11 evidence と Phase 12 compliance の同時 PASS が前提（index.md §状態語彙）。
- Phase 12 単独で `completed` に昇格させない（苦戦想定 1 と整合）。

## 7. 後続タスクとの関係

- **U-FIX-CF-ACCT-02（並列）**: wrangler.toml の runtime warning 側を担当。本タスクは Token 権限側を担当。ADR は本タスク配下に配置し、02 から相互参照する。
- **GitHub Issue #330（CLOSED）**: 本タスク verified 完了後に「再オープン or 新規 Issue」のいずれかを判定する（Phase 12 で判断根拠を残す方針）。

## 8. 完了条件

- [x] 7 ファイルすべてが `outputs/phase-12/` に存在
- [x] root `artifacts.json` と `outputs/artifacts.json`（存在する場合）の parity が PASS、または root 単独正本宣言を `phase12-task-spec-compliance-check.md` に記録
- [x] 全成果物に Token 値・Account ID 値が含まれない（80 文字以上の secret-like 文字列 scan で 0 件）
- [x] LOGS は fragment 構成を確認済み。runtime fact 未検証・skill behavior 変更なしのため本 Phase では未編集
- [x] `workflow_state` が `spec_created` のまま（root は `completed` 未昇格）
