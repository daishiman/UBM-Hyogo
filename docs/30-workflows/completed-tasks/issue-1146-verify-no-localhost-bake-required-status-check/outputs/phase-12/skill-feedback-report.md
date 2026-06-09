# スキルフィードバックレポート

| 項目 | 値 |
| --- | --- |
| タスク | issue-1146 `verify-no-localhost-bake` を dev/main の required status check に登録 |
| ステータス | `implemented_local_runtime_pending` |

本レポートは **改善点なしでも出力必須**。観点は (1) テンプレート改善 / (2) ワークフロー改善 / (3) ドキュメント改善。
各 item に promotion target（反映先 skill reference）と evidence path（本 workflow 内の根拠）を付す。

---

## (1) テンプレート改善

| ID | 内容 | promotion target | evidence path |
| --- | --- | --- | --- |
| FB-T1 | governance mutation を伴う実装仕様書では、Phase 12 の Step 2 が「新規 interface / 型 / API surface なし → N/A」になるケースが頻出する。CI governance only タスクは API/interface Step 2=N/A でも workflow inventory / active indexes は same-wave sync する、と整理した | `task-specification-creator/references/governance-branch-protection-pattern.md` / aiworkflow inventory | `outputs/phase-12/system-spec-update-summary.md`（Step 2 = N/A + workflow sync applied） |

---

## (2) ワークフロー改善

| ID | 内容 | promotion target | evidence path |
| --- | --- | --- | --- |
| FB-W1（主提案・反映済み） | `governance-branch-protection-pattern.md` に **paths-filter footgun**（required check + `on.pull_request.paths` フィルタ → 非該当 PR が `Expected - Waiting for status` で permanent pending block）を追記し、required 化対象 workflow の no-paths 常時起動チェックを Phase 2 / 5 の必須項目へ昇格した | `task-specification-creator/references/governance-branch-protection-pattern.md` | `phase-1-requirements.md` / `phase-2-design.md` / `index.md`（根本最適化 2 点）/ `.github/workflows/verify-no-localhost-bake.yml` local diff |

---

## (3) ドキュメント改善

| ID | 内容 | promotion target | evidence path |
| --- | --- | --- | --- |
| FB-D1（反映済み） | `closed-issue-canonical-workflow-recovery.md` に proto-spec の前提（登録済 context 集合）が **stale 化しているケースの是正手順**を追記した。recovery 時に proto-spec の前提値を実測（`gh api ... GET` / `rg --files`）で再検証し、stale なら canonical workflow root 側で実測値を正本化する | `task-specification-creator/references/closed-issue-canonical-workflow-recovery.md` | `outputs/phase-11/manual-test-result.md`（検証 2: proto-spec stale 確認）/ `index.md`（根本最適化 #1） |

---

## サマリ

| 観点 | 件数 |
| --- | --- |
| テンプレート改善 | 1（FB-T1・workflow sync 実施） |
| ワークフロー改善 | 1（FB-W1・反映済み） |
| ドキュメント改善 | 1（FB-D1・反映済み） |

CONST_005 に従い、検出した skill feedback は今回 cycle 内で反映済み。未タスク化なし。
