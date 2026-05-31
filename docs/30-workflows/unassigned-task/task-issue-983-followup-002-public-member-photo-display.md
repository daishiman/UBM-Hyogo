# Public member photo display policy and implementation - タスク指示書

## メタ情報

```yaml
issue_number: 1029
task_id: task-issue-983-followup-002-public-member-photo-display
task_name: Public member photo display policy and implementation
category: 改善
target_feature: public member directory photo display
priority: 中
scale: 中規模
status: 未実施
source_phase: issue-983 Phase 12 unassigned-task-detection
created_date: 2026-05-29
dependencies: [issue-983-member-photo-avatar-r2-storage]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-983-followup-002-public-member-photo-display |
| タスク名 | Public member photo display policy and implementation |
| 分類 | 改善 |
| 対象機能 | public member directory photo display |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/unassigned-task-detection.md` |
| 関連 Issue | #983 |

---

## 1. なぜこのタスクが必要か

Issue #983 は admin member drawer の写真表示を対象にし、`GET /admin/members/:memberId` に optional `photoUrl` を同梱する実装で閉じた。Phase 12 implementation guide でも、web layer は R2/D1 へ直接触れず signed `photoUrl` だけを受け取ることが contract になっている。

public member directory で同じ写真を表示するには、公開同意、publish state、signed URL の露出範囲、TTL、一覧での R2 read cost が別途必要になる。admin drawer と同じ `photoUrl` を public API にそのまま出すと、PII と consent policy の境界が曖昧になる。

## 2. 何を達成するか

public member directory と public member detail に写真を出してよい条件を定義し、その条件を満たす member のみ public-safe photo URL を返す。非公開、同意なし、期限切れ、画像エラー時は既存 placeholder にフォールバックする。

### 受け入れ基準

- public API は consent/publish state を満たす member のみ `photoUrl` を返す
- admin-only photo と public-safe photo の境界が仕様化されている
- public route で R2 bucket name、object key、admin-only audit data が露出しない
- signed URL TTL と cache policy が public read cost を考慮して決定されている
- `/(public)/members` と必要な detail route の visual evidence がある

## 3. 実行方針

1. Phase 1 で既存 public member API と publish consent の正本仕様を確認する
2. Phase 2 で public exposure policy を ADR 化する
3. Phase 4-6 で API schema、repository query、public UI render tests を追加する
4. Phase 11 で photo visible / hidden / fallback の screenshots を取得する
5. Phase 12 で aiworkflow-requirements の public profile/photo policy を更新する

## 苦戦箇所【記入必須】

- 対象: `packages/shared/src/zod/viewmodel.ts`
- 症状: Issue #983 では admin detail schema にだけ `photoUrl?: string` を追加し `.strict()` を維持した。public schema にも安易に同じ field を追加すると、admin-only signed URL と public-safe URL の意味が同名で混ざり、consumer が consent boundary を誤解しやすい。
- 対象: `apps/api/src/routes/admin/members.ts` と今後確認する public member route
- 症状: admin route は認証済み admin 前提で `photoUrl` を返せるが、public route は publish state と PII policy が先に必要。admin 実装の query/presign helper をそのまま reuse すると公開不可 member に URL を出す事故が起こり得る。
- 参照: `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| consent なし写真の public exposure | Phase 2 で publish state と photo consent の両方を必須条件にする |
| public API に admin-only signed URL を出す | public 用 presenter/helper を分け、admin schema と public schema を別名で扱う |
| 一覧表示で R2 read が増える | list では thumbnail/transcode 後の URL か placeholder を使う判断を ADR 化する |
| URL TTL と browser cache が矛盾する | signed URL TTL、Cache-Control、再取得タイミングを同じ ADR で固定する |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @repo/api test -- public
mise exec -- pnpm --filter @repo/shared test -- viewmodel
mise exec -- pnpm --filter @repo/web test -- members
```

期待: consent/publish matrix、schema strictness、public UI fallback が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/web typecheck
mise exec -- pnpm --filter @repo/web lint
```

期待: public route と UI の型・lint が PASS。

### Runtime evidence

staging authenticated/admin setup と public browser screenshot が必要。signed URL や cookie は artifact に残さず、スクリーンショットと redacted response summary だけを保存する。

## スコープ

### 含む

- public photo exposure policy ADR
- public API schema/query update
- public members UI photo rendering and fallback
- consent/publish matrix tests
- local/staging visual evidence plan

### 含まない

- member self-upload（別タスク `task-issue-983-followup-001-member-self-photo-upload.md`）
- transcode/resize pipeline（別タスク `task-issue-983-followup-003-member-photo-transcode-resize.md`）
- Google Form schema 変更（Issue #983 invariant と矛盾するため実施しない）

## 参照

- Issue #983: https://github.com/daishiman/UBM-Hyogo/issues/983
- `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/unassigned-task-detection.md`
- `packages/shared/src/zod/viewmodel.ts`
- `apps/web/app/(public)/members/page.tsx`
