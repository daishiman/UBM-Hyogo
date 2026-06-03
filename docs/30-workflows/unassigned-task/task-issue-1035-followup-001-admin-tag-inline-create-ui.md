# Issue #1035 follow-up: admin tag inline-create UI

## メタ情報

```yaml
issue_number: 1068
task_id: task-issue-1035-followup-001-admin-tag-inline-create-ui
task_name: Admin tag inline-create UI from member drawer
category: 改善
target_feature: admin member drawer tag editing
priority: 中
scale: 中規模
status: 未実施
source_phase: issue-1035 Phase 12 unassigned-task-detection U-1
created_date: 2026-06-01
dependencies: [issue-1035-tag-master-write-endpoints, issue-982-drawer-tag-pill-editing]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-1035-followup-001-admin-tag-inline-create-ui |
| タスク名 | Admin tag inline-create UI from member drawer |
| 分類 | 改善 |
| 対象機能 | admin member drawer tag editing |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/unassigned-task-detection.md` U-1 |
| 関連 Issue | #1035 |

---

## 1. なぜこのタスクが必要か

Issue #1035 では `apps/api` に tag master (`tag_definitions`) の CRUD endpoint を追加し、管理者がタグ台帳を作成・更新・論理削除できる backend contract を用意した。一方、`apps/web` の admin member drawer から「必要な tag が無いので、その場で作って member に付与する」導線は Issue #1035 の AC 外として残っている。

API だけでは管理者の実作業は完結しない。drawer で member を見ながら tag を探し、無ければ新規作成し、作成直後に member へ付与できる UX を別タスクとして実装する。

## 2. 何を達成するか

admin member drawer の tag 編集 UI に、既存 tag 検索・選択に加えて inline create の操作を追加する。作成処理は Issue #1035 の `POST /admin/tags` を利用し、作成済み tag は既存 member tag 付与 API に渡す。

### 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | member drawer の tag 編集 UI から新規 tag を作成できる |
| AC-2 | 作成成功後、作成した tag がその member に付与され、drawer の tag pill 表示へ反映される |
| AC-3 | `tag_code_conflict` は既存 tag の選択導線へ回収され、重複作成の失敗だけで操作が詰まらない |
| AC-4 | label/category/code validation error が drawer 内で読める形で表示される |
| AC-5 | `GET /admin/tags` search/pagination と既存 member tag 付与/解除 UI が退化しない |
| AC-6 | desktop/mobile drawer で操作部品と tag pill が重ならない |

## 3. 実行方針

1. Phase 1 で Issue #982 の drawer tag pill 編集実装と Issue #1035 の API contract を baseline にする。
2. Phase 2 で inline create の state machine（検索中 / create form / conflict recovery / attach pending）を設計する。
3. Phase 4-6 で component test、API mock test、必要な Playwright visual sanity を追加する。
4. Phase 11 で drawer inline create の local visual evidence を取得する。
5. Phase 12 で aiworkflow-requirements の admin tag UI 境界を同期する。

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260601-055938-wt-1/docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/implementation-guide.md`
- 症状: Issue #1035 は NON_VISUAL API タスクとして閉じており、drawer UI を同じサイクルに混ぜると visual evidence、admin web tests、API mock fixture 更新が追加で必要になる。API と UI を分離しないと Phase 12 の実装区分が崩れる。
- 対象: `apps/api/src/routes/admin/tags.ts`
- 症状: `POST /admin/tags` は tag master 作成までで、member への付与は既存の別 endpoint が責務を持つ。UI 実装では create 成功後に attach を連続実行する必要があり、部分成功時の表示・retry 方針を先に決める必要がある。
- 参照: `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/unassigned-task-detection.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| tag 作成成功後の member 付与失敗で UI と backend state がずれる | 高 | create と attach を別 state として扱い、作成済み tag を選択状態に残して attach retry を表示する |
| conflict 時に同名 tag を重複作成しようとし続ける | 中 | `tag_code_conflict` では `GET /admin/tags?q=<code or label>` を再取得し、既存 tag 選択へ誘導する |
| drawer の既存 tag pill 編集 UX が複雑化する | 中 | inline create は既存検索 UI の補助導線に限定し、drawer 全体の layout primitive を再利用する |
| visual evidence 不足で UI regressions を見逃す | 中 | component test に加えて desktop/mobile の local screenshot または Playwright smoke を Phase 11 に含める |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin
```

期待: member drawer tag editing の create success、conflict recovery、validation error、attach retry が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- tags
```

期待: web/API の型契約が同期し、Issue #1035 tag master endpoint の regression が green。

### Visual sanity

```bash
mise exec -- pnpm --filter @ubm-hyogo/web playwright test --project=chromium apps/web/e2e/admin-members*.spec.ts
```

期待: drawer 内の inline create UI、tag pill、error 表示が desktop/mobile で重ならない。該当 e2e が無い場合は component screenshot evidence を Phase 11 に保存する。

## スコープ

### 含む

- admin member drawer の tag inline create UI
- `POST /admin/tags` と既存 member tag attach endpoint の連携
- conflict / validation / partial success の UI state
- focused tests and visual evidence

### 含まない

- tag master API の再設計（Issue #1035 で実装済み）
- tag `code` rename（別タスク `task-issue-1035-followup-002-tag-code-rename-requirements.md`）
- tag 物理削除 / reactivate（別タスク `task-issue-1035-followup-003-tag-reactivate-physical-delete.md`）
- staging / production deploy、commit、push、PR 作成

## 参照

- Issue #1035: https://github.com/daishiman/UBM-Hyogo/issues/1035
- `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
