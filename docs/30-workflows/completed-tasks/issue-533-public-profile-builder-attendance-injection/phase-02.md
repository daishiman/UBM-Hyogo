# Phase 2: 実装設計

[実装区分: 実装仕様書]

Phase 1 の AC をコード変更単位へ落とす。

## データ構造

```ts
import type { AttendanceRecord } from "../../../apps/api/src/repository/attendance";

export interface PublicMemberProfile {
  memberId: MemberId;
  summary: MemberProfileSummary;
  publicSections: MemberProfileSection[];
  attendance: AttendanceRecord[];
  attendanceMeta?: { hasMore: boolean; nextCursor: string | null };
  tags: Array<{ code: string; label: string; category: string }>;
}
```

実装時は shared package 内の既存 import 境界に合わせ、API package から shared へ逆 import しない。`AttendanceRecord` と optional `attendanceMeta` は shared viewmodel 側の公開 contract を正とし、API repository 型から shared へ import しない。

## 関数シグネチャ

```ts
export async function buildPublicMemberProfile(
  c: RepositoryProviderCtx,
  mid: MemberId,
  deps?: { attendancePage?: AttendancePageDeps },
): Promise<PublicMemberProfile | null>;

export interface GetPublicMemberProfileDeps {
  ctx: RepositoryProviderCtx;
}
```

## 実装設計

| 領域 | 方針 |
| --- | --- |
| shared | `PublicMemberProfile` / `PublicMemberProfileZ` が `attendance: AttendanceRecord[]` と optional `attendanceMeta` を持つことを維持し、zod test で固定する |
| builder | 既存の visibility filter 後、`fetchAttendancePagedFor(mid, c.var.attendanceProvider, deps?.attendancePage)` を `Promise.all` に含める |
| use-case | `getPublicMemberProfileUseCase` は `RepositoryProviderCtx` を受け取り、公開適格判定後に provider 経由の attendance 先頭ページを取得する。converter を残す場合も attendance DTO を明示的に渡し、privacy contract を builder と同一にする |
| route | `attendanceProviderMiddleware` を `/public/members/:memberId` に適用し、session middleware は追加しない |
| privacy | `publicSections` は `visibility='public'` のみ。attendance は公開合意済み member のみ返す |

## 完了条件

- [x] Phase output is synchronized with Issue #533 implementation state.
- 後続実装者が上記シグネチャで編集を開始できる。
- shared/API の import 方向が破綻しない代替案を明記している。
- 既存 use-case / converter 経路を残す場合の二重正本化リスクを実装手順で解消している。


---

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-533-public-profile-builder-attendance-injection |
| phase | 2 |
| status | completed |

## 目的

Phase 2: 実装設計 の範囲で、public profile attendance injection を skill 定義に沿って実装・検証する。

## 実行タスク

- [x] Issue #533 の public profile attendance contract を確認する。
- [x] Phase 2 の成果と後続依存を確認する。

## 参照資料

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `apps/api/src/routes/public/member-profile.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `packages/shared/src/types/viewmodel/index.ts`

## 成果物

- [x] `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/phase-02.md`
- [x] Related artifacts are reflected in `artifacts.json`.

## 統合テスト連携

- [x] Focused Vitest and typecheck evidence are recorded under `outputs/phase-11/`.
- [x] NON_VISUAL task; browser screenshot evidence is not required.

## 依存成果物参照

- `outputs/phase-01/requirements.md`
- `outputs/phase-02/design.md`
- `outputs/phase-03/privacy-attendance-public-contract.md`
- `outputs/phase-11/main.md`
- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/test.log`
- `outputs/phase-11/evidence/build.log`
- `outputs/phase-11/evidence/grep-gate.log`
- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

依存Phase参照: Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 / Phase 13
