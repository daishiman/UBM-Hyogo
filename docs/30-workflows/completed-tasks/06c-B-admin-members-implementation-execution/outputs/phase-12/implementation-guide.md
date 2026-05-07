# Implementation Guide

## Part 1: 中学生レベル

管理画面の会員一覧は、図書館の本棚に似ている。たくさんの本から、題名、場所、分類ラベルで探せるようにする。会員を消すときも、本を破って捨てるのではなく「今は見せない」と札を付ける。あとで必要なら戻せるようにするため。

誰がその札を付けたかも、当番ノートに残す。これが audit log。あとから「いつ、誰が、何をしたか」を確認できる。

## Part 2: 技術者レベル

### Contract

- `GET /api/admin/members?filter&q&zone&tag&sort&density&page`
- `GET /api/admin/members/:memberId`
- `POST /api/admin/members/:memberId/delete`
- `POST /api/admin/members/:memberId/restore`

### Shared Schema

- `ADMIN_SEARCH_LIMITS.Q_LIMIT = 200`
- `ADMIN_SEARCH_LIMITS.TAG_LIMIT = 5`
- `ADMIN_SEARCH_LIMITS.PAGE_SIZE = 50`
- `AdminMemberSearchZ`
- `toAdminApiQuery()`

### Runtime Evidence

Runtime screenshots and staging curl are not stored in this workflow. They are delegated to 08b / 09a because authenticated admin fixture access is required.

Delegated screenshot paths:

- `outputs/phase-11/screenshots/admin-members-list.png`
- `outputs/phase-11/screenshots/admin-members-detail.png`
- `outputs/phase-11/screenshots/admin-members-delete.png`

This workflow records the evidence contract only; measured runtime files are created by the approved 08b / 09a execution cycle.
