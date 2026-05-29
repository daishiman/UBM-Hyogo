# Phase 8: 可観測性・ログ設計

## 8.1 metric

既存 `identityHealth.membersWithoutIdentity` を本タスクの primary KPI とする。新規 metric 追加なし。

| metric                                   | source                                                              | 期待値（成功時） |
| ---------------------------------------- | ------------------------------------------------------------------- | ---------------- |
| `identityHealth.membersWithoutIdentity` | `forms-pipeline.ts:196-198` の `member_status LEFT JOIN member_identities` | 0                |
| `identityHealth.identitiesWithoutMember` | 既存                                                                | 0（変更なし）    |
| `hypothesisFlags.H2_identityMismatchSuspected` | derive 条件に membersWithoutIdentity を OR 追加                | false            |

## 8.2 log（Phase 6 で定義済）

| code                            | level | 発火タイミング                              |
| ------------------------------- | ----- | ------------------------------------------- |
| `UBM-AUTH-AUTOLINK-OK`         | info  | auto-link 成功                              |
| `UBM-AUTH-AUTOLINK-NO-CAND`    | info  | candidate なし（既存 unregistered 経路）   |
| `UBM-AUTH-AUTOLINK-MULTI-MID`  | warn  | 多重 member_id 検出                         |
| `UBM-AUTH-AUTOLINK-RESELECT-NIL` | warn  | 再 SELECT で null（理論上発生せず）         |

## 8.3 ダッシュボード

`/admin/diagnostics`（既存 page）で `identityHealth` を可視化済。本タスクで新規 UI なし。ただし implementation-guide で確認手順を明記する。

## 8.4 production 後追跡

deploy 後 24 時間以内に以下を確認:

- `UBM-AUTH-AUTOLINK-OK` の発火件数（過去 backlog 分の救済件数の上限）
- `UBM-AUTH-AUTOLINK-MULTI-MID` の発火件数（identity-merge 残課題の指標）
- `identityHealth.membersWithoutIdentity` の推移（0 維持）
