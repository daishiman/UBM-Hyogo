**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 11: 手動テスト / VISUAL

`[実装区分: 実装仕様書]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 11.1 VISUAL 区分の明示

本タスクは **VISUAL タスク**である。`/admin/meetings`（開催日 / 出席管理）で、開催日追加 404 の解消（追加後に開催日カードが一覧へ現れる視覚変化）、開催日カード見出しの出席人数バッジ（`N 名出席` / `出席 未登録`）、展開時の出席者氏名表示、運用導線テキストという UI 状態が変化するため、screenshot による視覚 evidence の取得対象である。

automation-30 改善サイクル（30種思考法 compact evidence 適用）で本 Phase は `implemented_local_runtime_pending` へ昇格した。ローカル実装と focused Vitest は完了し、staging 実機操作・screenshot 取得のみ user-gated として残す。

## 11.2 自動検証の主ソース（取得済み）

screenshot の前段で、視覚変化を裏づける主証跡は focused Vitest（jsdom）である。canonical な spec パスとケースは以下を予定する（Phase 4/6/7 で確定済みの TC-ID に対応）。

| evidence | 予定 path | 主担当 TC | 取得状態 |
| --- | --- | --- | --- |
| focused Vitest（route handler transport） | `apps/web/app/api/admin/[...path]/route.spec.ts` | TC-A-binding / TC-A-http / TC-A-missing | PASS（6 tests） |
| focused Vitest（出席者氏名） | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` | TC-B1 / TC-B1-fallback | PASS（2 tests） |
| focused Vitest（出席人数バッジ・導線） | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` | TC-B2 / TC-B2-zero / TC-B3 | PASS（6 tests） |
| focused Vitest（運用導線テキスト） | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx` | TC-B4 | PASS（1 test） |

> route handler transport は jsdom の Vitest で「`API_SERVICE` binding mock 注入時に `binding.fetch` が呼ばれ upstream status を中継」「binding 不在 + `INTERNAL_API_BASE_URL` あり時に HTTP fetch へ落ちる」「binding も URL も無い非 local で 500 `internal_api_base_url_missing`」の 3 分岐を assert する（Phase 7 §7.2）。

### focused Vitest 実行ログ

Evidence file: `outputs/phase-11/evidence/focused-vitest.log`

```text
pnpm exec vitest run --root=. --config=vitest.config.ts \
  'apps/web/app/api/admin/[...path]/route.spec.ts' \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx

Test Files  4 passed (4)
Tests       15 passed (15)
```

### 静的検証 / Phase 12 gate

```text
pnpm --filter @ubm-hyogo/web typecheck
Result: PASS

pnpm --filter @ubm-hyogo/web lint
Result: PASS

pnpm verify:phase12-compliance
Result: PASS
```

## 11.3 screenshot evidence（canonical 名計画・runtime pending）

screenshot は **staging 認証（admin cookie）が必要**なため、本 spec 段階では取得しない（user-gated）。canonical ファイル名のみ計画として固定し、実機取得は実装完了後の user 操作で行う。

| # | canonical ファイル名（計画） | 撮影状態（計画） | 対応 TC / AC | 取得状態 |
| --- | --- | --- | --- | --- |
| 1 | `admin-meetings-attendance-after-fix.png` | 開催日追加が 201 で成功し、開催日カードが一覧に出現した状態（404 解消） | TC-A-binding / AC-A4 | pending（user-gated staging） |
| 2 | `admin-meetings-attendance-count-badge.png` | 開催日カード見出しに出席人数バッジ（`3 名出席` / 0 名カードは `出席 未登録`）が表示され、展開すると出席者が氏名で並ぶ状態 | TC-B2 / TC-B2-zero / TC-B1 / AC-B1 / AC-B2 | pending（user-gated staging） |

> `screenshots/` ディレクトリに空 PNG・placeholder PNG を作成しない（PNG 0 件のまま）。staging 認証が user-gated のため、PNG 0 件は `implemented_local_runtime_pending` の正常状態として扱う。

### 今 screenshot を作らない理由

- 開催日追加（POST）・出席登録は admin 権限の cookie 認証を必須とし、staging の admin session 取得は user 操作（ログイン）が前提。本サイクルでは認証境界を越えない。
- 実コードと focused Vitest は完了済み。撮影対象は存在するが、staging admin session と実データ操作が user-gated のため本サイクルでは取得しない。
- placeholder PNG を置くと evidence の真正性を損なうため、未取得は「pending」として明示し、空ファイルは作らない。

## 11.4 3層評価観点（計画）

| 層 | 評価観点 | 対応 screenshot（計画） | 計画判定 |
| --- | --- | --- | --- |
| Semantic（意味） | 「開催日を追加 → カードが現れる → 各回を展開して出席を記録」という運用フローが画面の文言・バッジ・導線テキストから読み取れること。バッジの `N 名出席` が出席状況の意味を伝えること | #1 / #2 | local PASS（runtime screenshot pending） |
| Visual（視覚） | バッジ色が既存 `ui-badge` / text utility で、開催日カードのレイアウトを崩さず収まること。出席者氏名と補助 memberId の階層が視認できること | #2 | local PASS（runtime screenshot pending） |
| AI UX（操作体感） | 開催日追加が待ち感なく成功し（404 が消える）、カード展開が「出席を記録・編集する」導線として迷わず識別できること（aria-label） | #1 / #2 | local PASS（runtime pending） |

## 11.5 実行コマンド（実行済み）

```bash
# focused vitest（ルートから config 明示・apps/web/vitest.config.ts は不在）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  'apps/web/app/api/admin/[...path]/route.spec.ts' \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx
```

```bash
# staging 実測（user-gated）: admin ログイン後に開催日追加 → 201 を確認 → screenshot
# POST https://ubm-hyogo-web-staging.daishimanju.workers.dev/api/admin/meetings → 201
```

## 11.6 evidence 整合チェック（計画）

| チェック | 内容 | implemented_local_runtime_pending 時の状態 |
| --- | --- | --- |
| 枚数整合 | `outputs/phase-11/screenshots/` の `.png` 枚数 | 0 枚（pending・placeholder を作らない） |
| 命名整合 | phase-11.md / implementation-guide.md の screenshot canonical 名が一致 | 一致（計画名 2 件: after-fix / count-badge） |
| 状態整合 | 各 png が 404 解消 / バッジ + 氏名表示を表す | user-gated staging 取得後に確認 |
| 主ソース整合 | focused Vitest の TC-ID が AC と対応 | AC-A1..A5 / AC-B1..B5 へ写像済み（§11.2 / §11.3） |

## 11.7 VISUAL 判定（implemented_local_runtime_pending）

**GATE: LOCAL PASS / RUNTIME PENDING**。404 真因（proxy transport 不整合）は proxy の service binding first 化でローカル実装済み。UI/UX 改善（出席人数バッジ・氏名表示・導線）も実装済みで、focused Vitest 4 files / 15 tests PASS。staging 実測・screenshot 2 枚は user-gated として Phase 13 境界に残す。
