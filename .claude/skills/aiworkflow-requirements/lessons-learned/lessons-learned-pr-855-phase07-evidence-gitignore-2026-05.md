# Lessons Learned — PR #855 Phase 07/08 evidence gitignore whitelist

> 起源: PR #855 task-staging-auth-secret-binding-recovery-001（2026-05-22）
> 関連 CI: `validate / Run gate-metadata validator` + `verify-phase12-compliance` 同時 ERROR
> 関連: [phase11-evidence-existence-parser](../../task-specification-creator/lessons-learned/phase11-evidence-existence-parser.md) L-IS855-EVD-007

## 事象（L-PR855-001）

PR #855 で 2 つの CI gate が同時 fail:

- `validate / gate-metadata validator`: `artifacts.json.metadata.gates[].evidence_path` の `outputs/phase-07/test.log` が ERROR（`evidence_path not found`）
- `verify-phase12-compliance`: Phase 11 evidence inventory の `outputs/phase-07/*.log` 群が `missing-evidence` 判定

ローカルでは file が物理存在しているのに CI で fail する → `.gitignore` の `*.log` パターンに該当して checkout で除外されていた。

## 根本原因

`.gitignore` line 41 の `*.log` は Phase 11 evidence のみ whitelist されており（line 48-52）、Phase 07 / Phase 08 の `*.log` には適用されていなかった。両 validator は `existsSync()` で物理実在を検証するため、tracked でない log は必ず fail する。

## 対策（L-PR855-002）

`.gitignore` の `# Logs` セクションに Phase 11 whitelist と同パターンを追加:

```gitignore
# Phase 07 implementation evidence logs（phase-11 evidence inventory が phase-07 *.log を
# 物理証跡として claim するパターンを許可するため tracked にする / PR #855 staging-auth-secret-binding-recovery）
!docs/30-workflows/**/outputs/phase-07/*.log
!docs/30-workflows/**/outputs/phase-07/**/*.log
# Phase 08 runtime evidence outputs（curl/backend-ci の text/log 証跡を tracked にする）
!docs/30-workflows/**/outputs/phase-08/*.log
!docs/30-workflows/**/outputs/phase-08/**/*.log
```

## 適用範囲

- 任意の task workflow root で Phase 11 evidence inventory が `phase-07/*.log` または `phase-08/*.log` を `status: present` で claim するパターン全てに適用
- `verify-phase12-compliance` / `gate-metadata:validate` の existsSync 系 validator に対して有効
- Phase 11 evidence convention（log を `outputs/phase-11/` 配下に集約）と並行運用可能

## 検出シグナル

以下が **同時に fail** したら gitignore 由来をまず疑う:

| CI gate | 失敗メッセージ |
| --- | --- |
| `validate / gate-metadata validator` | `[ERROR] ...artifacts.json: Gate-X: evidence_path not found (<phase-07 or phase-08 path>)` |
| `verify-phase12-compliance` | `reason: missing-evidence` + `outputs/phase-07/*.log` / `outputs/phase-08/*.log` を含む `details` |

切り分けコマンド: `git check-ignore -v <evidence_path>` → 出力があれば gitignore 起因確定。

## やってはいけないこと

- 個別タスクで `git add -f <log>` する（再発する）
- Phase 11 inventory の `status: present` 行を `pending` に書き換えて回避する（証跡欠落）
- `artifacts.json.evidence_path` を別 phase の `.md` に差し替える（implementation evidence と documentation evidence の意味分離が崩れる）

## 参考リンク

- `.gitignore` の `# Logs` セクション
- `scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts`
- `scripts/verify-gate-metadata.ts`（gate-metadata validator）
- `docs/30-workflows/completed-tasks/task-staging-auth-secret-binding-recovery-001/`
- PR #855: https://github.com/daishiman/UBM-Hyogo/pull/855
