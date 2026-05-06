# Unassigned Task Detection — Issue #350

本 cycle 完了時点で残る未割当タスク。**0 件でも出力必須**ルールに従う。

## 検出タスク

### UT-350-FU-01: actionlint / shellcheck の CI 統合

- **検出根拠**: 本仕様書 Phase 6 §5 で「local 必須 / CI 統合は別 governance タスク」と明示。reminder workflow が増えた以上、CI 側で actionlint を一括実行する gate が望ましい。
- **対象**: `.github/workflows/` 配下に lint job を 1 つ追加（または既存 `verify-indexes.yml` に step 追加）
- **苦戦箇所【記入必須】**:
  - 対象: `.github/workflows/`
  - 症状: 新規 workflow YAML / shell が増えても CI で構文検証されず、broken commit が main に入りうる
  - 参照: 本仕様書 Phase 6 §5
- **リスクと対策**: 既存 CI 時間増 → lint job は数秒で完了するため許容
- **検証方法**: `gh run list --workflow=<lint-workflow>` が成功
- **スコープ**:
  - 含む: actionlint / shellcheck job 追加
  - 含まない: 既存 workflow の修正（false positive 抑制は別途）
- **作成先**: `docs/30-workflows/unassigned-task/ut-350-fu-01-ci-actionlint-shellcheck-gate.md`（本 cycle で formalized）
- **優先度**: 低
- **規模**: 小

### UT-350-FU-02: D+7 / D+30 runtime evidence の post-merge 取得

- **検出根拠**: Phase 11 で `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のため、PR merge 後の user gate で実 schedule / dispatch path を確認する必要がある。
- **対象**: PR merge 後の `gh workflow run post-release-observation-reminder.yml -f release_date=YYYY-MM-DD -f offset_days=7` 実行と Phase 11 への evidence 追記
- **苦戦箇所【記入必須】**:
  - 対象: GitHub Actions runtime
  - 症状: spec contract PASS でも実 schedule trigger / Issue 起票の挙動は user 認証下でしか確認できない
  - 参照: Phase 11 §1, §5
- **リスクと対策**: permissions 設定不足で issue create 失敗 → repo settings の Actions 権限確認手順を runbook に明記済
- **検証方法**: `gh run view <run-id>` が success / 起票された Issue URL が runbook §7 履歴へ追記される
- **スコープ**:
  - 含む: runtime confirmation 1 回（D+7 同等の dispatch）
  - 含まない: 実本番 release を待った自然 schedule trigger（時間依存のため）
- **優先度**: 中
- **規模**: 小
- **作成先**: `docs/30-workflows/unassigned-task/ut-350-fu-02-post-merge-runtime-evidence.md`（本 cycle で formalized）

## coverage layer 表（参考 — 本タスク主成果物）

| layer | before | after | delta |
| --- | --- | --- | --- |
| `.github/workflows/post-release-observation-reminder.yml` | n/a | YAML parse + Prettier PASS（actionlint は local 未導入） | new |
| `scripts/observation/create-reminder-issue.sh` | n/a | bash syntax + 13 unit assertions PASS（shellcheck は local 未導入） | new |
| `docs/runbooks/post-release-long-term-observation.md` | n/a | H2 7 セクション存在 | new |
| `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md` | n/a | rg ヒット | new |

## DoD

- [x] 検出タスク 2 件（UT-350-FU-01 / -02）が記載されている
- [x] それぞれに「苦戦箇所 / リスクと対策 / 検証方法 / スコープ」の必須 4 セクションが揃っている
- [x] `docs/30-workflows/unassigned-task/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` と `ut-350-fu-02-post-merge-runtime-evidence.md` を formalized
