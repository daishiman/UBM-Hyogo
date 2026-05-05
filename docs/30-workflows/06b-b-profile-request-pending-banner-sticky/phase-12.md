# Phase 12: ドキュメント更新 — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 12 / 13 |
| wave | 06b-fu |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`/profile` の pending banner を server-side 正本で sticky 化する変更を、正本仕様書（`05-pages.md` / `07-edit-delete.md` / `09-ui-ux.md`）と実装ガイドへ反映する。Part 1 中学生レベル概念説明 + Part 2 開発者レベル技術詳細を `implementation-guide.md` に書く。

## 事前チェック【必須】

1. P1: LOGS.md 2 ファイル更新漏れ
2. P2: topic-map.md 再生成忘れ
3. P3: 未タスク管理の 3 ステップ不完全
4. P29: SKILL.md 変更履歴更新漏れ
5. FB-UT-UIUX-001: Phase 11 screenshot ハードゲート確認

## 実行タスク（必須 6 タスク）

| Task | 内容 | 主成果物 |
| --- | --- | --- |
| Task 12-1 | 実装ガイド作成（Part 1 + Part 2） | `outputs/phase-12/implementation-guide.md` |
| Task 12-2 | システム仕様書更新 | `outputs/phase-12/system-spec-update-summary.md` |
| Task 12-3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| Task 12-4 | 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` |
| Task 12-5 | スキルフィードバック | `outputs/phase-12/skill-feedback-report.md` |
| Task 12-6 | Task 12-1〜12-5 準拠確認 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 参照資料

| 資料 | パス |
| --- | --- |
| Phase 1 | `outputs/phase-01/main.md` |
| Phase 2 | `outputs/phase-02/main.md` |
| Phase 11 | `outputs/phase-11/main.md`, `outputs/phase-11/screenshots/` |
| pages 仕様 | `docs/00-getting-started-manual/specs/05-pages.md` |
| 編集/削除 仕様 | `docs/00-getting-started-manual/specs/07-edit-delete.md` |
| UI/UX 仕様 | `docs/00-getting-started-manual/specs/09-ui-ux.md` |
| /me API | `apps/api/src/routes/me/index.ts`, `apps/api/src/routes/me/schemas.ts` |
| diff-to-pr | `.claude/commands/ai/diff-to-pr.md` |

## Task 12-1: 実装ガイド（Part 1 + Part 2）

### Part 1: 中学生レベル

順序固定で 3 トピック。「たとえば」を最低 1 回使う。

1. 「pending（処理待ち）状態とは何か」
   - たとえば: 学校に「来週休みます」と紙で出した後、先生がハンコを押すまでの間の「受け取った状態」
   - なぜ必要か: ユーザーが「自分の申請がちゃんと届いた」と分かる
   - 何をするか: マイページに「申請を受け付けています」と表示する
2. 「reload しても消えない（sticky）とはどういうことか」
   - たとえば: ブラウザを閉じて開き直しても、Amazon の「カート」が消えないのと同じ
   - なぜ必要か: 画面を更新したら pending が消えると、ユーザーが「届いてないかも」と思って二重申請してしまう
   - 何をするか: pending 情報をサーバー側で保存し、ページを開くたびにサーバーから取り直す
3. 「重複申請を 409 で防ぐ理由」
   - たとえば: 同じ宅配を 2 回頼むと配達員が混乱するのと同じ
   - なぜ必要か: 同じ申請が 2 件入ると管理者が混乱する
   - 何をするか: 既に pending があれば、API は 409 を返してやんわり拒否する

### Part 2: 技術詳細

| 項目 | 内容 |
| --- | --- |
| Summary | `GET /me/profile` を拡張して `pendingRequests` を返し、`/profile` Server Component から `RequestActionPanel` に props で渡す |
| 追加ファイル | `apps/api/src/routes/me/__tests__/services.pending.test.ts`、`apps/web/playwright/tests/profile-pending-sticky.spec.ts` |
| 変更ファイル | `apps/api/src/routes/me/{schemas,services,index}.ts`、`apps/web/app/profile/page.tsx`、`apps/web/app/profile/_components/RequestActionPanel.tsx` |
| API contract | `GET /me/profile` レスポンスに `pendingRequests: { visibility?, delete? }` を追加。POST 系は不変 |
| Test coverage | unit (services / schema)、integration (route handler)、E2E (Playwright reload 永続性 + stale 409) |
| Screenshots | `outputs/phase-11/screenshots/TC-01..05` |
| Invariants | #4 (本文編集禁止)、#5 (D1 直接禁止)、#11 (`:memberId` を web path に出さない) |
| Out of scope | admin queue 再設計、即時 approve/reject、profile body 編集 UI |
| Error 処理 | 409 で `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')` 再利用（S5）、新 code 追加なし |
| 設定可能パラメータ | pending 取得は `admin_member_notes.request_status='pending'` AND `member_id=:memberId` AND `note_type IN ('visibility_request','delete_request')` |

Part 2 必須 5 項目:

- C12P2-1 型定義: `PendingVisibilityRequestZ` / `PendingDeleteRequestZ` / `PendingRequestsZ`
- C12P2-2 API シグネチャ: `getPendingRequestsForMember(db, memberId)`、`GET /me/profile`
- C12P2-3 使用例: Server Component から props 経由で `RequestActionPanel` に渡すコード例
- C12P2-4 エラー処理: 409 → `DUPLICATE_PENDING_REQUEST` 再利用 / 5xx → banner 表示せず
- C12P2-5 設定値: pending 取得 SQL の WHERE 句

## Task 12-2: システム仕様書更新

| 対象 | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/05-pages.md` | `/profile` の `RequestActionPanel` 説明に「server-side pending state を初期値とし reload で永続表示」と追記 |
| `docs/00-getting-started-manual/specs/07-edit-delete.md` | 公開停止 / 退会の pending 状態の正本が server-side であることを記述 |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | `RequestPendingBanner` の sticky 仕様（`role=status` + server pending）と error mapping 表（変更なし）を整理 |

drift チェック:

```bash
rg -n "pendingRequests|RequestPendingBanner.*sticky|server-side pending" docs/00-getting-started-manual/specs/
```

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を記録:

- 変更ファイル一覧（仕様書 3 種 + implementation-guide + artifacts.json + index.md）
- baseline / current の境界
- validator 結果（typecheck / lint / `validate-phase12-implementation-guide.js`）
- artifacts.json と outputs/artifacts.json の同期結果

## Task 12-4: 未タスク検出

| 候補 | 判定 | 起票 |
| --- | --- | --- |
| admin queue 再設計（管理画面の状態遷移 UI） | open / 別 wave | follow-up issue 候補 |
| WebSocket / SSE による別タブリアルタイム同期 | baseline backlog | 起票見送り（YAGNI） |
| pending 件数のヘッダーバッジ表示 | open（任意） | 起票見送り |

0 件でも summary を残す。SF-03 4 パターン照合結果を記録。

## Task 12-5: スキルフィードバック

- `task-specification-creator`: server 正本／client local の境界が苦戦箇所として頻出。テンプレに「state-of-truth boundary」セクションを追加すべきか
- `aiworkflow-requirements`: `09-ui-ux.md` の banner sticky 仕様を共通テーブルとして追記すべきか
- 改善点なしでも「なし」と理由を記録

## Task 12-6: phase12-task-spec-compliance-check

- Task 12-1〜12-5 全完了確認
- planned wording (`計画`/`予定`/`TODO`/`保留`) が `outputs/phase-12/` に残っていないことを `rg` で確認
- artifacts.json と outputs 実体の整合確認

## 多角的チェック観点

- 不変条件 #4 / #5 / #11
- S1 (server 正本) / S5 (error code 再利用) が implementation-guide に明示されているか
- VISUAL_ON_EXECUTION の screenshot path が Part 2 の Screenshots 行に列挙されているか
- 未実装/未実測を PASS と扱わない

## サブタスク管理

- [ ] Part 1 / Part 2 を含む `implementation-guide.md` 作成
- [ ] 仕様書 3 種更新
- [ ] `documentation-changelog.md` 作成
- [ ] `unassigned-task-detection.md` 作成
- [ ] `skill-feedback-report.md` 作成
- [ ] `phase12-task-spec-compliance-check.md` 作成
- [ ] artifacts.json / index.md outputs を同期

## 成果物

| 成果物 | パス | 必須 |
| --- | --- | --- |
| 集約 | `outputs/phase-12/main.md` | 任意 |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` | ✅ |
| 仕様更新サマリー | `outputs/phase-12/system-spec-update-summary.md` | ✅ |
| 更新履歴 | `outputs/phase-12/documentation-changelog.md` | ✅ |
| 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` | ✅ |
| スキルフィードバック | `outputs/phase-12/skill-feedback-report.md` | ✅ |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ |

## 完了条件

- [ ] Part 1 / Part 2 の implementation-guide.md 完成
- [ ] 仕様書 3 種 drift 解消
- [ ] AC × evidence path が 1:1
- [ ] unassigned-task-detection.md 0 件でも作成
- [ ] skill-feedback-report.md 作成
- [ ] artifacts.json と outputs 同期
- [ ] planned wording なし
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 06b-B 復活ではなく durable 化の follow-up である
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] FB-UT-UIUX-001（screenshot ハードゲート）が Phase 11 evidence path と紐付く

## 次 Phase への引き渡し

Phase 13 へ、PR title 案 / PR body 構成 / approval gate / `implementation-guide.md` path を渡す。
