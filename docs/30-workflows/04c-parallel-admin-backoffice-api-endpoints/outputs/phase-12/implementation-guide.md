# 04c admin-backoffice-api-endpoints — Implementation Guide

## 概要

UBM 兵庫支部会メンバーサイトの管理者バックオフィス API（18 endpoint）を `apps/api`（Hono on Cloudflare Workers）に実装。spec 11 の 5 画面（dashboard / members / tags / schema / meetings）+ sync trigger を 1 系統 API で提供する。

## Part 1: 中学生レベルの説明

このタスクは、先生だけが使える職員室の管理窓口を作る作業である。会員名簿を見たり、先生用メモを書いたり、会合の出席を記録したりできるが、生徒本人が書いた提出用紙の本文は先生が勝手に書き換えない。

タグ付けは、いきなり名簿へ書くのではなく、確認待ち箱に入った候補を先生が確認してから反映する。フォーム項目の変更も、決められた schema 窓口だけで扱う。これにより、誰が何を変更したかを後から追える。

04c は画面を作るタスクではないため、スクリーンショットは不要。画面は 06c で、この API を使って作る。

## 変更ファイル

### 新規

| パス | 役割 |
|---|---|
| `apps/api/src/routes/admin/_shared.ts` | 共通ヘルパー（zod parse / audit append wrapper） |
| `apps/api/src/routes/admin/dashboard.ts` | `GET /admin/dashboard` |
| `apps/api/src/routes/admin/members.ts` | `GET /admin/members`, `GET /admin/members/:memberId` |
| `apps/api/src/routes/admin/member-status.ts` | `PATCH /admin/members/:memberId/status` |
| `apps/api/src/routes/admin/member-notes.ts` | `POST/PATCH /admin/members/:memberId/notes[/:noteId]` |
| `apps/api/src/routes/admin/member-delete.ts` | `POST /admin/members/:memberId/delete`, `restore` |
| `apps/api/src/routes/admin/tags-queue.ts` | `GET /admin/tags/queue`, `POST .../:queueId/resolve` |
| `apps/api/src/routes/admin/schema.ts` | `GET /admin/schema/diff`, `POST /admin/schema/aliases` |
| `apps/api/src/routes/admin/meetings.ts` | `GET /admin/meetings`, `POST /admin/meetings` |
| `apps/api/src/routes/admin/attendance.ts` | `POST/DELETE /admin/meetings/:sessionId/attendance[/:memberId]` |
| `apps/api/src/repository/dashboard.ts` | dashboard 集計用 raw SQL |
| `apps/api/src/routes/admin/*.test.ts` × 9 | 各 route の vitest テスト |
| `docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/outputs/phase-{01..13}/main.md` | フェーズ成果物 |

### 変更

- `apps/api/src/index.ts` — 9 router を `app.route("/admin", ...)` で mount

## アーキテクチャ

```
Client → Hono → adminGate (Bearer SYNC_ADMIN_TOKEN) → Handler → Repository → D1
                                                              ↓
                                                          audit_log.append
```

- **router factory パターン**: `createXxxRoute()` で `app.use("*", adminGate)` を mount 単位で install。handler 単位の漏れを構造的に排除（AC-1）
- **zod 検証**: 入力 / 出力ともに `*ViewZ.parse(...)`（AC-11）
- **audit_log**: 全 mutation で `auditLog.append({ action, targetType, targetId, before, after })`（AC-9）

## Part 2: 技術者向け API 契約

```ts
type AdminBackofficeAuth = "Authorization: Bearer <SYNC_ADMIN_TOKEN>";

interface AdminRouteResult<T> {
  ok?: boolean;
  error?: string;
  data?: T;
}
```

| Endpoint | 主な成功 status | 主な異常 status |
| --- | --- | --- |
| `GET /admin/dashboard` | 200 | 401 / 403 / 500 |
| `GET /admin/members` | 200 | 400 / 401 / 403 / 500 |
| `GET /admin/members/:memberId` | 200 | 401 / 403 / 404 / 500 |
| `PATCH /admin/members/:memberId/status` | 200 | 400 / 401 / 403 / 404 |
| `POST/PATCH /admin/members/:memberId/notes` | 201 / 200 | 400 / 401 / 403 / 404 |
| `POST /admin/members/:memberId/delete|restore` | 200 | 400 / 401 / 403 / 404 |
| `GET /admin/tags/queue` | 200 | 400 / 401 / 403 |
| `POST /admin/tags/queue/:queueId/resolve` | 200 | 400 / 401 / 403 / 404 / 409 |
| `GET /admin/schema/diff` | 200 | 401 / 403 |
| `POST /admin/schema/aliases` | 200 | 400 / 401 / 403 / 404 / 409 |
| `GET/POST /admin/meetings` | 200 / 201 | 400 / 401 / 403 |
| `POST/DELETE /admin/meetings/:sessionId/attendance` | 200 | 400 / 401 / 403 / 404 / 409 / 422 |

### 重要な修正済み不変条件

- `POST /admin/tags/queue/:queueId/resolve` は queue status だけでなく `member_tags` へ候補 tag を適用する。
- `PATCH /admin/members/:memberId/notes/:noteId` は note の所属 member と path `memberId` の一致を必須にする。
- member note / delete / restore / attendance は存在しない member へ mutation しない。
- `POST /admin/schema/aliases` は diff 未存在、diff と question mismatch を成功扱いしない。
- `GET /admin/meetings` は invalid `limit` / `offset` を 400 にし、`heldOn` は `YYYY-MM-DD` に制限する。

## 不変条件の構造的保証

| # | 条件 | 守る場所 |
|---|---|---|
| #4 | 本人プロフィール本文の D1 編集禁止 | `member_responses` への UPDATE は本タスクで一切呼ばない |
| #11 | 管理者は他人プロフィール本文を直接編集できない | `PATCH /admin/members/:memberId/profile` 等を**作っていない** |
| #12 | admin_member_notes は public/member view に混入しない | `AdminMemberDetailView` のみ含み、list / public / member view から構造的に除外 |
| #13 | tag は queue → resolve 経由のみ | `member_tags` の更新は `tags-queue.ts` の resolve handler のみ。`transitionStatus` で queued→reviewing→resolved を必須経由 |
| #14 | schema 変更は `/admin/schema` 集約 | `updateStableKey` 呼出は `schema.ts` のみ |
| #15 | attendance 重複 / 削除済み除外 | `addAttendance` の戻り値を 404(session)/422(deleted)/409(duplicate)へ厳密マップ |

## 検証

| 項目 | 結果 |
|---|---|
| `pnpm --filter @ubm-hyogo/api typecheck` | エラー 0 |
| `pnpm --filter @ubm-hyogo/api test -- --run` | 251 passed / 0 failed (48 files) |
| `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=../../vitest.config.ts apps/api/src/routes/admin/tags-queue.test.ts apps/api/src/routes/admin/member-notes.test.ts apps/api/src/routes/admin/member-delete.test.ts apps/api/src/routes/admin/attendance.test.ts apps/api/src/routes/admin/meetings.test.ts apps/api/src/routes/admin/schema.test.ts` | 24 passed / 0 failed (6 files) |
| AC-1〜AC-11 | 全 PASS（phase-07 / phase-10 参照） |
| 4 条件（価値・実現・整合・運用） | 全 PASS |

## smoke 手順

`outputs/phase-11/main.md` 参照（curl コマンド集）。

## 既知の制限・後続 wave 対応

- adminGate スタブ（Bearer SYNC_ADMIN_TOKEN）。本格 admin 認証は **05a** で Auth.js + admin_users 照合に差し替え予定 → audit_log の `actor_email` も同時に注入される
- 04c 時点の AC-1 / AC-9 は「全 admin route が gate と audit append を通る」段階まで。`admin_users` active 判定と実 actor email 注入は 05a の既存責務として残す。
- `members detail` の `profile.attendance` は MVP として空配列。詳細ビルダーは **06c** または後続 wave
- attendance audit `targetType` は既存 `meeting` 型を流用（attendance 専用型は audit_log schema 拡張時）

## 参照

- 仕様: `docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/index.md`
- 設計: `outputs/phase-02/main.md`（Mermaid + module + dependency matrix）
- AC: `outputs/phase-07/main.md`（AC × verify × runbook）
- 不変条件: 上表 + spec 11 / 12 / 07
