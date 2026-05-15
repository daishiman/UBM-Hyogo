# Phase 8 — ドキュメント更新

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 08 |
| Status | spec_created |

## 目的

この Phase の目的は、下記の詳細仕様に従って `parallel-10-auth-session-handling` を spec_created から実装可能な状態へ進めることである。

## 実行タスク

- [ ] 下記の Phase 固有手順を実行する。
- [ ] 成果物と evidence path を確認する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| workflow index | docs/30-workflows/parallel-10-auth-session-handling/index.md | 全体仕様 |
| artifacts | docs/30-workflows/parallel-10-auth-session-handling/artifacts.json | 状態台帳 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-08/ | Phase成果物 |


## 更新対象

| パス | 内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/02-auth.md` | session callback / 24h TTL / silent refresh 不採用の決定を追記 |
| `/Users/dm/.agents/skills/aiworkflow-requirements/indexes/quick-reference.md` | UBM-Hyogo Member Login / Profile Pages 早見に client 401/403 handling の導線を追加 |
| `/Users/dm/.agents/skills/aiworkflow-requirements/indexes/resource-map.md` | auth/admin UI 関連 workflow inventory に本 workflow と正本ファイルを登録 |
| `/Users/dm/.agents/skills/aiworkflow-requirements/references/task-workflow-active.md` | `parallel-10-auth-session-handling` を `spec_created / implementation / NON_VISUAL` として登録 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-10-auth-session-handling/spec.md` | 「実装完了」ステータスへの更新（Phase 13 後） |
| `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-12/documentation-changelog.md` | 全変更ファイルを列挙 |

## 追記方針

- `02-auth.md` には「401 を受け取った client は `useAdminMutation` の DI 経由で `toLoginRedirect()` に飛ばす」「403 は `権限がありません` toast」「silent refresh 不採用、24h TTL 内 expiry は 401 catch で吸収」の 3 点を箇条書きで追加。
- aiworkflow-requirements は same-wave sync とし、`quick-reference.md` / `resource-map.md` / `task-workflow-active.md` の 3 点を最低更新対象にする。実装完了前は `spec_created` と明記し、runtime PASS と混同しない。
- silent refresh を後日導入する場合の前提条件（refresh token 取得、scope 拡張）も 1 行残す。

## 完了条件

- `outputs/phase-08/docs-updates.md` に対象ファイルと patch 方針が記録され、後続実行者が `Edit` で直接適用できる粒度であること。
