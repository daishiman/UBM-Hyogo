# Phase 2: アーキテクチャ設計

## 2.1 全体図

```
[Auth.js signIn callback (apps/web)]
        │
        │ POST/GET fetchSessionResolve(email)
        ▼
[/auth/session-resolve (apps/api)]
        │
        ├─ findIdentityByEmail(email) → 既存 identity あり → 通常パス
        │
        └─ 既存 identity なし → tryAutoLinkByResponseEmail(email)
                                 │
                                 ├─ member_responses から email 一致 row を SELECT
                                 │   (group by email, MIN(submitted_at)=first, MAX(submitted_at)=current)
                                 │   tag_assignment_queue bridge があれば既存 member_id を採用
                                 │
                                 ├─ 該当なし → unregistered（変更なし）
                                 │
                                 └─ 該当あり → member_identities に INSERT OR IGNORE
                                                │
                                                └─ status / isAdmin lookup 続行
```

## 2.2 レイヤ責務

| レイヤ                                                  | 責務                                                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `apps/api/migrations/0021_backfill_member_identities.sql` | 既存 D1 上で `tag_assignment_queue` bridge 付き response を `member_identities` へ backfill（一度限り適用、冪等） |
| `apps/api/src/repository/identities.ts`                  | `findAutoLinkCandidateByEmail`、`backfillIdentityFromCandidate`、`tryAutoLinkIdentityByEmail` を提供 |
| `apps/api/src/routes/auth/session-resolve.ts`            | sign-in 時に on-the-fly auto-link を実行し再 lookup を行う                                    |
| `apps/api/src/diagnostics/forms-pipeline.ts`             | `membersWithoutIdentity` を H2 hypothesis flag に紐付け                                       |

## 2.3 設計判断

| 論点                                                       | 採用                                                                                                       | 理由                                                                                                       |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| matching 軸                                                | response_email 単軸                                                                                        | schema に `external_id` 列なし。OAuth sub vs Form 入力 email が一致しないケースは別 followup へ            |
| member_id 復元                                             | `tag_assignment_queue(response_id, member_id)` bridge があれば既存 member_id を流用。無ければ auto-link 専用 `autolink:<uuid>` を採番 | `member_responses` には `member_id` が無いため、存在しない列に依存しない |
| 競合（同一 email × 複数 bridge member_id）                 | bridge member_id を MIN(member_id) 優先で採用、他は別 followup（identity-merge）に委譲                       | identity-merge は別 workflow が既に管理（migration 0010 identity_merge_audit）                              |
| auto-link 失敗時                                           | unregistered を返す（fail-closed）                                                                         | CLAUDE.md 不変条件 #11 fail-closed                                                                         |
| auto-link を session-resolve に inline するか別 endpoint か | inline（session-resolve route 内で完結）                                                                   | apps/web 側の auth.ts callback への変更が不要、内部認証境界が変わらない                                    |

## 2.4 シーケンス（auto-link）

1. Auth.js signIn callback が `/auth/session-resolve?email=foo@example.com` を呼ぶ
2. session-resolve は `findIdentityByEmail` で member_identities を引く
3. ヒット → 既存パス（status / isAdmin lookup → memberId 返却）
4. ミス → `findAutoLinkCandidateByEmail(email)` で member_responses を引く
5. 候補あり → `backfillIdentityFromResponses(email, candidate)` で member_identities に INSERT OR IGNORE
6. 再度 `findIdentityByEmail` を実行（race-safe）
7. 成功 → status / isAdmin lookup 続行
8. 失敗 → unregistered

## 2.5 backfill migration の位置付け

migration 0021 は本タスク merge 時点での過去データ救済（バッチ backfill）。auto-link はそれ以降に新規発生する H2 ケースの予防策。二段構成で「過去」と「将来」を両方カバーする。
