# Phase 12: ドキュメント同期

Phase 11 までで確定した 3 lane の設計・実装・ローカル証跡を、運用者が迷わず追えるドキュメント群に落とす。本タスクは `implemented_local_evidence_captured` であり、コード・CI config・runbook 更新は実装済み。staging secret 投入、remote CI 観測、commit/push/PR は user-gated として明示する。

---

## 0. Phase 12 成果物の構成（2 パート入口）

`task-specification-creator` skill の Phase 12 必須要件に従い、以下 7 成果物を `outputs/phase-12/` に生成する。

| ファイル | 役割 |
|---|---|
| `main.md` | Phase 12 全体インデックス（本 Phase の入口） |
| `implementation-guide.md` | **2 パート構成**。Part 1（中学生レベル概念説明）+ Part 2（開発者レベル技術詳細）+ 視覚証跡セクション |
| `system-spec-update-summary.md` | システム仕様（02-auth / 13-mvp-auth）への反映要否判定と same-wave sync |
| `documentation-changelog.md` | ドキュメント変更ログ |
| `unassigned-task-detection.md` | スコープ外項目の未タスク候補列挙（0 件でも出力必須） |
| `skill-feedback-report.md` | skill 改善点（なしでも出力必須） |
| `phase12-task-spec-compliance-check.md` | canonical 9 headings / Phase 11 evidence / workflow root scan の compliance チェック |

> implementation-guide.md は **中学生レベルの例え話（Part 1）と開発者向け技術詳細（Part 2）の 2 パート構成**を必須とする。視覚証跡セクションには「UI/UX 変更なしのため Phase 11 スクリーンショット不要」を明記し、代替証跡（phase-10/final-review、phase-11/manual-test）を参照する。

---

## 1. ドキュメント更新対象（本ワークフロー外）

| パス | 更新内容 | 実行タイミング |
|---|---|---|
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | mint 方式 secret 5 種の op 参照・投入手順 + 即時再発行手順を追記 | 本サイクルで追記済み。secret 実投入はユーザー gated |
| `docs/00-getting-started-manual/specs/02-auth.md` または `13-mvp-auth.md` | mint helper（CI 実行時 session JWT 発行）の存在を 1 行追記要否を `system-spec-update-summary.md` で判定 | same-wave sync |
| `.claude/skills/aiworkflow-requirements/` indexes / references | 本ワークフローの active entry / artifact inventory を same-wave で同期 | implemented-local 状態へ再同期 |

## 2. 成果物

- `outputs/phase-12/main.md` ほか strict 7 ファイル一式（本 Phase で生成）

## 3. 完了条件（DoD）

- [x] strict 7 ファイルが `outputs/phase-12/` に揃っている
- [x] implementation-guide.md が 2 パート構成 + 視覚証跡セクション（スクリーンショット不要明記）を満たす
- [x] system-spec-update-summary.md が spec 反映要否を判定している
- [x] unassigned-task-detection.md / skill-feedback-report.md が 0 件でも出力されている
- [x] phase12-task-spec-compliance-check.md が canonical 9 headings をカバーしている
