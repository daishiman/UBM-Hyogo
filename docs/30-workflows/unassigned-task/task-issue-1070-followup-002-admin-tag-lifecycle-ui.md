# Issue #1070 follow-up: admin tag lifecycle UI (reactivate / physical delete)

## メタ情報

```yaml
issue_number: 1118
task_id: task-issue-1070-followup-002-admin-tag-lifecycle-ui
task_name: Admin tag lifecycle UI (reactivate / physical delete) from admin tag UI
category: 改善
target_feature: admin tag lifecycle management UI
priority: 中
scale: 中規模
status: 未実施
source_phase: issue-1070 Phase 12 unassigned-task-detection U-2
created_date: 2026-06-03
dependencies: [issue-1070-tag-reactivate-physical-delete, issue-1068-admin-tag-inline-create-ui]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-1070-followup-002-admin-tag-lifecycle-ui |
| タスク名 | Admin tag lifecycle UI (reactivate / physical delete) from admin tag UI |
| 分類 | 改善 |
| 対象機能 | admin tag lifecycle management UI |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/unassigned-task-detection.md` U-2 |
| 関連 Issue | #1070, #1068 |

---

## 1. なぜこのタスクが必要か

Issue #1070 では `apps/api` に tag master (`tag_definitions`) の lifecycle write endpoint を追加した。具体的には `POST /admin/tags/:tagId/reactivate`（論理削除した tag を棚に戻す・active=0→1・冪等）と `DELETE /admin/tags/:tagId/physical`（参照なし時のみ物理削除・参照あり時は 409 `tag_has_references` + `referenceCount` で拒否）である。論理削除 `DELETE /admin/tags/:tagId`（active=0）は親 Issue #1035 で land 済みである。

しかし Issue #1070 の AC-1..AC-6 は **すべて API endpoint の契約** であり、これらの window（裏側の窓口）を `apps/web` admin tag UI から呼ぶ UX 導線は #1070 のスコープ外として残っている。API だけでは管理者の実作業は完結しない。管理者は画面上で「棚の奥にしまった tag を棚に戻す」「テスト用に作った tag を完全に消す」「使用中の tag を消そうとして 409 で断られた理由（何人に使われているか）を確認する」を行う必要がある。

これは Issue #1035 followup-001（#1068・admin tag inline-create UI）と同じ `apps/web` admin tag UI の関心事であり、API を消費する別レイヤの UX 設計を要する独立タスクである。特に physical delete は **不可逆** であるため、UI 側に確認ダイアログと 409 `referenceCount` 表示を備えた、論理削除とは明確に区別された導線が不可欠である。

## 2. 何を達成するか

admin tag UI（tag 一覧 / tag 行）に lifecycle 操作の導線を追加する。reactivate は Issue #1070 の `POST /admin/tags/:tagId/reactivate` を、physical delete は `DELETE /admin/tags/:tagId/physical` を利用する。論理削除（`DELETE /admin/tags/:tagId`・#1035 land 済み）との 3 操作を UI 上で混同させない。

### 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | 論理削除済み（active=0）の tag 行から reactivate 導線を呼べ、成功後に active 状態と一覧表示が即時反映される |
| AC-2 | active な tag 行から physical delete 導線を呼べ、実行前に **不可逆である旨を明示した確認ダイアログ** が表示され、確認操作なしには削除されない |
| AC-3 | physical delete が 409 `tag_has_references` を返した場合、レスポンスの `referenceCount`（member_tags 参照数）を「使用中のため削除不可（N 人に使用中）」の形で UI に表示する |
| AC-4 | reactivate / 論理削除（active=0 にする） / physical delete の 3 lifecycle 操作が UI 上で視覚的・文言的に区別され、混同して誤操作できない |
| AC-5 | 既存の論理削除導線（#1035 land 済み）と tag 一覧の検索・表示が退化しない（非退化） |
| AC-6 | reactivate 冪等（既に active な tag への reactivate）が UI でエラー扱いされず、状態が静かに維持される |
| AC-7 | 404 `tag_not_found`（既に削除された tag への操作）が読める形のエラーとして表示され、操作が詰まらない |
| AC-8 | desktop / mobile の双方で lifecycle 操作部品・確認ダイアログ・409 referenceCount 表示が崩れず重ならない |

## 3. 実行方針

1. Phase 1 で Issue #1070 の API contract（reactivate / physical delete endpoint + 409 `referenceCount` shape）と Issue #1068 の admin tag UI 実装範囲を baseline inventory にする。
2. Phase 2 で lifecycle UI の state machine（idle / 確認待ち（physical delete のみ） / submitting / 409 reference-blocked / 404 not-found / success）を設計し、3 操作（reactivate / 論理 delete / physical delete）の視覚的・文言的区別ルールを確定する。
3. Phase 3 で 409 `tag_has_references` + `referenceCount` 表示と確認ダイアログの adapter（API レスポンス shape → UI state）を設計する。
4. Phase 4-6 で component test（reactivate success / physical delete 確認フロー / 409 referenceCount 表示 / 404 表示 / 冪等 no-op / 3 操作非混同）、API mock fixture、必要な Playwright visual sanity を設計・追加する。
5. Phase 7-10 で実装・focused test green・typecheck/lint を確定する。
6. Phase 11 で **VISUAL タスクのため local screenshot 証跡** を取得する（reactivate 導線 / physical delete 確認ダイアログ / 409 referenceCount 表示 / desktop・mobile）。
7. Phase 12 で aiworkflow-requirements の admin tag UI 境界を同期し、未タスク検出を行う。

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/implementation-guide.md`
- 症状: physical delete は **不可逆**（破って捨てた紙は戻らない・guide Part 1「大事な約束 2」）であるため、UI 側に確認ダイアログ + 削除理由の明示が必須になる。さらに 409 `tag_has_references` 時は `referenceCount`（member_tags 参照数）を「N 人に使用中」の形で読める表示にする独立した UX 設計が必要で、reactivate のような単純な成功/失敗トグルでは設計が足りない。

- 対象: `apps/web/src/components/admin/`（tag 一覧 / tag 行コンポーネント）
- 症状: reactivate（active=0→1） / 論理 delete（active=1→0・#1035 land 済み） / physical delete（行ごと消す）の 3 lifecycle 操作が同じ tag 行に並ぶ。文言・配置・確認の有無を区別しないと、管理者が「棚に戻すつもりが完全削除を押す」「論理削除のつもりが物理削除を押す」誤操作を誘発する。3 操作を視覚的・文言的に明確に分離する設計が苦戦点になる。

- 対象: `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/unassigned-task-detection.md`
- 症状: admin tag lifecycle UI を NON_VISUAL の API タスク（#1070）と同サイクルに混ぜると、visual evidence・admin web tests・API mock fixture 更新が追加で必要になり、#1070 の実装区分（NON_VISUAL）が崩れる。#1068 spec と同型の問題で、UI は API を消費する別レイヤとして VISUAL タスクに分離しないと Phase 11/12 の証跡要件が衝突する。

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| physical delete を確認なしで実行し、不可逆な誤削除が起きる | 高 | physical delete は必ず確認ダイアログを挟み、確認操作なしに API を呼ばない state machine にする。文言で「元に戻せない」を明示する |
| 409 `tag_has_references` を汎用エラーとして潰し、削除不可の理由が伝わらない | 中 | 409 を専用 state として扱い、`referenceCount` を「N 人に使用中のため削除不可」の形で表示する adapter を Phase 3 で設計する |
| reactivate / 論理 delete / physical delete を UI で混同し誤操作する | 高 | 3 操作を視覚的・文言的に分離し、physical delete のみ確認ダイアログ + 破壊的スタイルにする。component test で 3 操作の非混同を固定する |
| reactivate 冪等（既に active）を UI がエラー表示する | 中 | API は冪等で 200 + 現 row を返すため、UI も成功（状態維持）として扱い、エラーバナーを出さない |
| 既存の論理削除導線（#1035）や tag 一覧が退化する | 中 | 既存導線を base に additive 設計し、AC-5 として component test で非退化を固定する |
| visual evidence 不足で UI regression を見逃す | 中 | component test に加えて desktop/mobile の local screenshot または Playwright smoke を Phase 11 に含める |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin
```

期待: reactivate success、physical delete 確認フロー、409 referenceCount 表示、404 表示、冪等 no-op、3 lifecycle 操作の非混同が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

期待: web の型契約が Issue #1070 endpoint contract（reactivate 200 row / physical 204 / 409 `referenceCount`）と整合し、lint exit 0。

### Visual sanity

```bash
mise exec -- pnpm --filter @ubm-hyogo/web playwright test --project=chromium apps/web/e2e/admin-tags*.spec.ts
```

期待: reactivate 導線・physical delete 確認ダイアログ・409 referenceCount 表示が desktop/mobile で崩れず重ならない。該当 e2e が無い場合は component screenshot evidence を Phase 11 に保存する（VISUAL タスクのため screenshot 証跡は必須）。

## スコープ

### 含む

- admin tag UI の reactivate 導線（`POST /admin/tags/:tagId/reactivate` を利用）
- admin tag UI の physical delete 導線 + 不可逆確認ダイアログ（`DELETE /admin/tags/:tagId/physical` を利用）
- 409 `tag_has_references` 時の `referenceCount` 表示（使用中のため削除不可）
- reactivate / 論理 delete / physical delete の 3 lifecycle 操作の視覚的・文言的区別
- 404 `tag_not_found` / 冪等 no-op の UI state
- focused component tests と local screenshot 証跡（VISUAL）

### 含まない

- lifecycle API の再設計（Issue #1070 で実装済み）
- physical delete 参照あり時の強制移行 migration（別タスク・unassigned U-1）
- `member_tags` への DB-level FOREIGN KEY 追加評価（別タスク・unassigned U-3）
- admin tag inline-create UI（別タスク #1068・統合検討対象だが本タスクの実装範囲外）
- staging / production deploy、commit、push、PR 作成

## 参照

- Issue #1070: https://github.com/daishiman/UBM-Hyogo/issues/1070
- Issue #1068: https://github.com/daishiman/UBM-Hyogo/issues/1068
- `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
