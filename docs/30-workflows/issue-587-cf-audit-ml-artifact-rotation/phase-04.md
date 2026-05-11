# Phase 4: 環境準備 / 前提条件確認（着手 Gate-R0 と staging verify）

## 目的

着手 Gate-R0 を確認し、本サイクルで rotation scripts / canary workflow / runbook を整備するための前提条件（親 #549 の安定運用、staging の `bash scripts/cf.sh whoami` 成功、`..._CANDIDATE` op 参照新設準備）を満たす。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 着手 Gate-R0 確認

| Gate | 条件 | 確認方法 | 失敗時の挙動 |
| --- | --- | --- | --- |
| R0-1 | Issue #549 が `pass_runtime_synced` または同等の安定運用状態 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/main.md` で state 確認 | `spec_created` / `implemented_local_evidence_captured` 段階なら、本タスクは **rotation 設計のみ先行**、scripts 実装は #549 安定後 |
| R0-2 | `.github/workflows/cf-audit-log-monitor.yml` の production env が `CF_AUDIT_CLASSIFIER=ml` で稼働中（または同等の運用前提） | `gh api repos/.../actions/workflows/cf-audit-log-monitor.yml/runs --jq '.workflow_runs[0]'` | env が `threshold` のままなら canary は不要。本タスク pause |
| R0-3 | `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` が op に登録済み | `op item get CF_AUDIT_ML_MODEL_PATH_PROD --vault Employee`（実値は表示しない） | 未登録なら #549 完了前提が崩れる。差し戻し |
| R0-4 | `bash scripts/cf.sh whoami` が staging account で成功 | `bash scripts/cf.sh whoami` | 失敗なら 1Password / scripts/cf.sh の前提整備（別タスク） |
| R0-5 | `secret-leakage-grep.ts` の `--exit-on-detect` 相当が利用可能 | `node scripts/cf-audit-log/evaluation/secret-leakage-grep.ts --help` | 不在なら #549 / #515 完了前提が崩れる。差し戻し |

## 環境前提

| 項目 | 値 / 確認手順 |
| --- | --- |
| Node | 24.15.0（`mise exec -- node -v`） |
| pnpm | 10.33.2（`mise exec -- pnpm -v`） |
| Cloudflare CLI | `bash scripts/cf.sh` 経由のみ。`wrangler` 直接実行禁止 |
| op CLI | `op --version` 成功 / `op signin` 完了 |
| GitHub CLI | `gh auth status` 成功（`workflow` scope 必須） |

## staging verify 手順

```
1. mise exec -- pnpm install
2. bash scripts/cf.sh whoami           # staging account 確認
3. mise exec -- pnpm typecheck         # 既存 known-failure 以外 0 件
4. mise exec -- pnpm lint              # 既存 known-failure 以外 0 件
5. node scripts/cf-audit-log/classifier/ml.ts --dry-run  # ML skeleton load 動作確認
6. op item get CF_AUDIT_ML_MODEL_PATH_PROD --vault Employee --fields label  # 実値非表示で存在確認
```

実値（API token / model path 文字列）はログ・stdout に出さない。`--fields label` のみで存在確認する。

## `..._CANDIDATE` op 参照新設手順（spec のみ）

本サイクルでは op vault の実エントリ追加は **行わない**（candidate artifact が決まっていないため）。Phase 12 で次世代 model 学習の未タスクを起票し、その実装サイクルで以下を行う:

```
spec:
  vault:  Employee
  item:   ubm-hyogo-env
  field:  CF_AUDIT_ML_MODEL_PATH_CANDIDATE
  value:  <次世代 artifact の path / R2 URL / Workers AI binding 名>
        ※実値は op に直接入力。spec / docs / log には書かない。
```

deployment-secrets-management.md には **field name のみ** 追記し、実値は記載しない。

## 完了条件

- [ ] Gate-R0-1〜R0-5 すべて pass。または failing gate に対する rationale を記録
- [ ] staging verify 6 step すべて成功（既存 known-failure を除く）
- [ ] `..._CANDIDATE` op 参照新設は spec のみで本サイクル外で実施することを明記
- [ ] raw feature dataset 不混入の grep gate を Phase 9 で実装する旨を確認

## 参照資料

- `index.md`
- `phase-01.md` ・ `phase-02.md` ・ `phase-03.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/index.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## 統合テスト連携

- Phase 9 でテスト計画。本 Phase は環境前提のみ。

## 出力

- `outputs/phase-04/main.md`（Gate-R0 確認結果 + staging verify ログ要約 + `..._CANDIDATE` 新設方針）

## Next Phase

- [Phase 5](phase-05.md): データモデル / artifact path schema / evidence JSON schema
