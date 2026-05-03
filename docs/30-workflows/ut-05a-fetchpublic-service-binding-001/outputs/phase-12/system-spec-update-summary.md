# System Spec Update Summary — ut-05a-fetchpublic-service-binding-001

## 状態

`initial spec sync complete / runtime completion pending`。

spec_created 段階では workflow 登録と service-binding 方針の初期 system spec sync は実施済み。
ただし本タスクを runtime completed に昇格する反映は、Phase 11 で実 staging / production
deploy が PASS した後に行う（placeholder PASS 防止）。

## 反映予定ファイル

| file | 反映予定内容 | タイミング |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本タスクを `spec_created / runtime evidence pending_user_approval` として登録済み。完了状態への昇格は Phase 11 PASS 後 | 初期同期済み / 完了昇格は Phase 11 PASS 後 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | `apps/web` → `apps/api` の経路は service-binding が正本（HTTP fetch は local fallback）の方針を登録済み | 初期同期済み |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 本 workflow root の canonical 行を追加済み | 初期同期済み |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` で再生成済み | 初期同期済み |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` で再生成済み | 初期同期済み |
| `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/artifacts.json` | Phase 11 status を `pending` → `completed` / `partial` / `failed` のいずれかに更新 | Phase 11 実行直後 |
| `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/outputs/artifacts.json` | root mirror | 同上 |

## Step 1 計画

`apps/web` の public fetch 経路に対して、コードベース内の正本ルールを 1 箇所に固定する。
quick-reference / resource-map のどちらに載せるかは、Phase 11 PASS 後に
aiworkflow-requirements skill 側の既存粒度を確認して決定する予定だったが、今回レビューで
初期登録済み差分を確認したため、system spec summary も実状態へ同期した。

## Step 2 計画

`task-workflow-active.md` の本タスク entry を `spec_created` から `completed` へ更新する
判定式は「AC-1〜AC-6 全 PASS かつ redaction-checklist PASS」とする。
いずれかが FAIL / BLOCKED の場合は `partial` または `blocked` を記録し、`completed` に
昇格させない。

## 09c 系 blocker への影響

本タスクは production deploy 実行を含むが、09c production deploy gate そのものへは
本タスクの PASS が必須条件ではない（独立タスク）。ただし `apps/web` `/` `/members` 500 が
解消するまでは public ディレクトリ系の機能検証が阻害されるため、Phase 11 PASS 結果を
`task-workflow-active.md` に記録して関連 follow-up を unblock 可能な状態にする。

## 09c Blocker Decision Record（pending）

| state | reason | evidence_path | checked_at |
| --- | --- | --- | --- |
| pending | spec_created (runtime not yet executed) | `outputs/phase-11/main.md`（実行後に置換） | 2026-05-03 |

## Artifact Parity

`artifacts.json`（root）と `outputs/artifacts.json` は spec_created 段階の段階で
parity を維持する。Phase 11 直後に同時更新する。
