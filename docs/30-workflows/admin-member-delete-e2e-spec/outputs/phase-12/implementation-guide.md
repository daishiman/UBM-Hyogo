# Implementation Guide

## Part 1: 中学生レベル

このタスクでは、管理者が会員を論理削除する流れを自動テストにした。

管理画面は、最初に会員一覧をサーバー側で読み込む。ブラウザだけで通信を差し替えられないため、テスト専用の合図 `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1` を使って、一覧と監査ログだけ固定データにする。

テストの流れは、管理者で一覧を開く、詳細を開く、論理削除ボタンを押す、理由を入力する、削除実行を押す、という順番。理由が空ならボタンは押せない。削除後は監査ログに `admin.member.deleted` が出ることも見る。

## 用語チェック

| 用語 | 意味 |
|------|------|
| 論理削除 | データを物理的に消さず、削除済みフラグを立てること |
| fixture | テスト用の固定データ |
| Server Component | ブラウザではなくサーバー側で動く画面部品 |
| `page.route()` | ブラウザから出る通信をテストで差し替える仕組み |
| 監査ログ | 管理者の操作が後から確認できるように残る記録 |

## Part 2: 技術者向け

- SSR 初期 fetch: `server-fetch.ts` に `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1` gate を追加。
- Client mutation: `MemberDrawer` の `/api/admin/members/:id` と `/delete` を `page.route()` で検証。
- Delete reflection: `MemberDrawer` が削除/復元 mutation 結果を `MembersClient` に渡し、一覧行の `削除済み` 表示を即時反映する。`router.refresh()` は従来通り実行。
- Audit linkage: audit test は削除操作を実行して `POST /delete` call count を確認した後、`/admin/audit?action=admin.member.deleted` で監査ログ表示を確認。
- Auth fixture: 既存 `adminPage` / `memberPage` / `anonymousPage` のみ使用。
- Evidence: `outputs/phase-11/evidence/*.txt` に typecheck / lint / e2e / grep / wc を保存。
- 状態語彙: local pass は `implemented-local-runtime-pending` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。
- CI/user gate: firefox / webkit / staging / CI / commit / push / PR はユーザー承認後。
