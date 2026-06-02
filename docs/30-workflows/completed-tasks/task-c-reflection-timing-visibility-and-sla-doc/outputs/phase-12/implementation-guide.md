# task-c-reflection-timing-visibility-and-sla-doc - 実装ガイド

## メタ情報

| 項目 | 内容 |
| --- | --- |
| 機能名 | Google Form 反映タイミング可視化 + 反映 SLA 文書化 |
| 作成日 | 2026-06-01 |
| 対象読者 | 開発者・運用担当・問い合わせ対応者 |
| implementation_mode | `verify_existing`（PR #1064 / commit `745c95115` landed） |

## Part 1

### なぜ必要か

なぜこの表示が必要かというと、Google Form に回答してから会員一覧やマイページへ反映されるまでに時間差があるためです。
利用者が「送ったのに表示されない」と感じたとき、画面上で最後の同期時刻と反映目安を確認できれば、問い合わせ前に現在地を判断できます。

### 何をするか

`/members` と `/profile` に反映タイミングの案内を表示します。
公開一覧では公開条件を満たすメンバーだけが表示されること、本人プロフィールでは公開状態に関係なく最新回答が見えることを分けて説明します。
同じ説明を `docs/00-getting-started-manual/specs/03-data-fetching.md` の反映 SLA セクションにも残します。

### 日常の例え

たとえば:

```text
学校の掲示板を想像してください。
先生に提出した紙は、提出した瞬間に掲示板へ貼られるわけではありません。
係の人が回収して確認し、掲示板へ貼った時点でみんなに見えるようになります。
この機能は「最後に掲示板を更新した時刻」と「次に貼られるまでの目安」を掲示板の近くに書くものです。
```

### 今回作ったもの

| 日本語 | 英語 | 役割 |
| --- | --- | --- |
| 反映タイミング案内 | `ReflectionTimingNote` | 最終同期時刻と反映目安を表示する read-only UI |
| 公開一覧への配線 | `/members` wiring | 既存 stats を使い、一覧の反映条件を説明する |
| 本人プロフィールへの配線 | `/profile` wiring | 認証済み本人に、公開状態と無関係に反映されることを説明する |
| 反映 SLA | reflection SLA | 同期から表示までの目安を運用ドキュメントへ固定する |
| 視覚証跡計画 | screenshot plan | user-gated screenshot の取得対象と保存予定先を記録する |

## Part 2

### アーキテクチャ設計

既存の公開 stats payload を再利用するため、新規 API、D1 migration、Google Form schema 変更、cron 間隔変更はありません。

| 層 | ファイル | 責務 |
| --- | --- | --- |
| UI component | `apps/web/src/components/public/ReflectionTimingNote.tsx` | surface 別の反映案内を描画する |
| Public page | `apps/web/app/(public)/members/page.tsx` | 既存 `statsResult` を component に渡す |
| Member page | `apps/web/app/(member)/profile/page.tsx` | `getStats({ revalidate: 60 })` を fail-soft で取得する |
| Spec doc | `docs/00-getting-started-manual/specs/03-data-fetching.md` | `## 反映 SLA` を正本として保持する |
| Evidence | `docs/30-workflows/completed-tasks/task-c-reflection-timing-visibility-and-sla-doc/outputs/phase-11/screenshot-plan.json` | runtime screenshot の user-gated 計画を保持する |

### インターフェース定義

`ReflectionTimingNoteProps` は component-local interface であり、`aiworkflow-requirements` の新規 public interface ではありません。
外部契約は既存 `GET /public/stats` の `lastSync.responseSyncFinishedAt` です。

### 型定義

```typescript
export type ReflectionTimingSurface = "members" | "profile";

export interface ReflectionTimingNoteProps {
  readonly surface: ReflectionTimingSurface;
  readonly lastSyncAt: string | null;
  readonly maxDelayMinutes?: number;
  readonly statsUnavailable?: boolean;
}
```

### APIシグネチャ

```typescript
type PublicStatsResponse = {
  lastSync: {
    responseSyncFinishedAt: string | null;
  };
};

function ReflectionTimingNote(props: ReflectionTimingNoteProps): JSX.Element;
```

### 使用例

```tsx
<ReflectionTimingNote
  surface="members"
  lastSyncAt={
    statsResult.ok ? statsResult.data.lastSync.responseSyncFinishedAt : null
  }
  statsUnavailable={!statsResult.ok}
/>
```

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/completed-tasks/task-c-reflection-timing-visibility-and-sla-doc
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/completed-tasks/task-c-reflection-timing-visibility-and-sla-doc
```

### エラーハンドリング

`GET /public/stats` の取得に失敗した場合、画面全体は止めず `statsUnavailable` を渡します。
component は `最終同期時刻を取得できませんでした` を表示し、反映目安と公開条件説明は継続して表示します。

### エッジケース

| ケース | 期待動作 |
| --- | --- |
| `lastSyncAt === null` | `最終同期: まだ同期されていません` を表示 |
| stats fetch failure | fallback 文言を表示し、ページ本体は描画継続 |
| `surface="members"` | 30 秒 ISR cache と公開条件を明示 |
| `surface="profile"` | cache なし、公開状態と無関係に本人回答が反映されることを明示 |
| runtime screenshot 未取得 | user-gated として `outputs/phase-11/screenshot-plan.json` に保存予定先を記録 |

### 設定項目と定数一覧

| 定数 / 設定 | 値 | 目的 |
| --- | --- | --- |
| `RESPONSE_SYNC_MAX_DELAY_MINUTES` | `15` | Google Form 同期待ちの目安 |
| `MEMBERS_ISR_MAX_SECONDS` | `30` | `/members` ISR cache 待ち |
| `WORST_CASE_MAX_MINUTES` | `45` | 公開一覧の最大目安表示 |
| `formatJstDateTime` | JST formatter | 最終同期時刻を JST 表示する |
| screenshot target | `/members`, `/profile` | Phase 11 runtime screenshot 取得対象 |

### セキュリティ・運用上の禁止事項

- `apps/web` から D1 へ直接アクセスしない。
- 新規 API endpoint や schema 変更をこのタスクへ混ぜない。
- HEX color、inline style、非 token 色を追加しない。
- authenticated `/profile` runtime screenshot、commit、push、PR はユーザー明示指示なしに実行しない。

### テスト構成

| 種別 | 証跡 |
| --- | --- |
| Focused component spec | `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx` 7 ケース |
| Phase output validation | `validate-phase-output.js` PASS（警告のみ） |
| Phase 12 guide validation | `validate-phase12-implementation-guide.js` PASS 対象 |
| Visual evidence | `outputs/phase-11/screenshot-plan.json` と `outputs/phase-11/phase11-capture-metadata.json` に user-gated 状態を記録 |

### 下流タスク連携

Phase 11 の runtime screenshots は user-gated です。
承認後は `docs/30-workflows/completed-tasks/task-c-reflection-timing-visibility-and-sla-doc/outputs/phase-11/screenshots/reflection-timing-members.png` と `.../reflection-timing-profile.png` に保存し、`manual-test-result.md` と本ガイドの Visual evidence 行を更新します。
