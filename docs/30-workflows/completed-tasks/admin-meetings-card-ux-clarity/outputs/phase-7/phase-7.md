# Phase 7: カバレッジ確認

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-card-ux-clarity` |
| phase | 7 / 13 |
| created_at | 2026-06-10 |
| 対象 branch | `feat/admin-meetings-card-ux-clarity` |
| 関連 AC | AC-6 / AC-9 / AC-10 |

## 目的

Phase 4 / 6 で追加したテストが、本タスクで**実際に変更した表現層コード（F2 / F3）の分岐・行**を被覆していることを確認する。本タスクは表現層改修のため、ロジック密度が低く、カバレッジ対象は**変更コンポーネントに限定**する。広域指定（apps/web 全体・features 全体）にはしない。

## [Feedback BEFORE-QUIT-002][Feedback 5] カバレッジ対象範囲の限定

- **対象は `_meetings` コンポーネント配下に限定する**。具体的には Phase 5 で実際に DOM を変更した **F2 / F3**:
  - `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx`（F2・主対象）
  - `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx`（F3・class 維持確認のみだが分岐被覆を確認）
- **F1（`globals.css`）はカバレッジ計測対象外**。CSS はカバレッジツールの対象でなく、視覚は jsdom で計測不能（AC-1 / AC-2 の見た目は Phase 11 screenshot で検証）。
- **広域指定にしない理由**: 本タスクの diff は `_meetings` 配下と globals.css のみ。`apps/web` 全体や `features/admin` 全体に `--coverage` を当てると、本タスクと無関係なコンポーネントの未被覆が混入し、改善対象を誤認させる（[Feedback 5]）。`--coverage.include` で `_meetings` に絞る。

## 計測コマンド（範囲限定）

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceChecklist.spec.tsx \
  --coverage \
  --coverage.include='apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx' \
  --coverage.include='apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx'
```

> `--coverage.include` を 2 ファイルに限定し、F2 / F3 の line / branch のみを計測する。globals.css / 他コンポーネント / API は対象に含めない。

## カバレッジ対象の分岐（line / branch）

### F2: MeetingAttendanceDrawer.tsx

| 分岐 / 行 | 被覆するテスト |
|---|---|
| `attended.size > 0` が true（出席者セクション描画） | DR-1 / DR-2 / DR-3 / EDGE-2 / EDGE-3 |
| `attended.size > 0` が false（セクション非表示） | EDGE-1 |
| 見出し `出席者 ({attended.size}名)` の人数評価（1 / 複数） | DR-2 / EDGE-2 |
| `candidateNameById.get(mid)` hit（氏名表示）/ miss（memberId fallback） | DR-3（hit）/ EDGE-3（miss）|
| `fullName ? <span>({mid})</span> : null` の三項両分岐 | DR-3（true）/ EDGE-3（false）|
| 各 `<li>` の `.admin-attendee-row` / data-testid / data-member 付与 | DR-3 / EDGE-3 |
| 「出席を追加」見出し + group / select / button | DR-1 / EDGE-4 / EDGE-5 |
| 「編集」`<details>` / summary | DR-1 / EDGE-5 |

> 一括追加（`BulkAttendanceChecklist` / `BulkAttendanceModal`）の挙動分岐は既存 `MeetingsClientShell.spec.tsx` / `BulkAttendanceChecklist.spec.tsx` で既被覆。本タスクで挙動を変えないため追加被覆は不要（回帰維持のみ）。

### F3: MeetingTimeline.tsx

| 分岐 / 行 | 被覆するテスト |
|---|---|
| `items.length === 0`（empty state） | 既存「0 件で AdminEmptyState」 |
| `items.length > 0`（card 描画・`.ui-card--flat`） | TL-1 / 既存ケース |
| `isSelected`（`data-selected` 付与）true / false | EDGE-6 |
| `attendanceCount > 0` ラベル分岐 | 既存「N 名出席」/「出席 未登録」|
| `m.note ? <p> : null` | 既存（note=null パス）。note 有のパスは任意で 1 ケース確認可 |
| `attendanceLevel()` の none / normal / high | 既存 `it.each` |

> `m.note` 有のパス（`.admin-timeline__note` 描画）が既存テストで未被覆の場合は、TL-1 のバリエーションとして `note: "メモ本文"` を渡す 1 ケースを追加し `.admin-timeline__note` の class hit を確認してよい（任意・branch 補完）。

## カバレッジ目標

| 指標 | 目標 | 根拠 |
|---|---|---|
| F2 / F3 の statement / line | 既存ベースライン維持以上（理想は変更行を全被覆） | 表現層・分岐は上表で網羅 |
| F2 / F3 の branch | 主要三項・条件分岐（出席者有無 / 氏名 hit-miss / isSelected / note 有無）を被覆 | 上表参照 |
| プロジェクト coverage gate | 既存 web shard の閾値（≥80%）を下回らない | `coverage-guard` が web 全体で判定。本タスクは表現層追加で全体閾値を下げない設計 |

> プロジェクト全体の `coverage-guard`（pre-push）は web shard 全体で閾値判定する。本タスクの focused 計測は**変更コードの被覆確認用**であり、全体 gate とは別軸。両者を混同しない（[Feedback 5]・広域指定回避）。

## 参照資料

- `outputs/phase-4/phase-4.md`（DR-1〜DR-3 / TL-1）/ `outputs/phase-6/phase-6.md`（EDGE-1〜EDGE-6）
- `outputs/phase-5/phase-5.md`（F2 / F3 の変更箇所）
- 実コード: `MeetingAttendanceDrawer.tsx` / `MeetingTimeline.tsx`

## 実行手順

1. 範囲限定 `--coverage.include` 付き vitest を実行。
2. F2 / F3 の line / branch レポートを確認し、上表の分岐が全て被覆されていることを確認。
3. 未被覆分岐があれば Phase 6 に該当 edge ケースを追加（例: `m.note` 有パス）。
4. プロジェクト全体 coverage gate（pre-push `coverage-guard`）が閾値を下回らないことを Phase 13 push 前に確認。

## 統合テスト連携

- focused coverage は変更コード被覆の確認専用。全体 gate（`coverage-guard` / CI shard）と切り分ける。
- API contract spec は無改変（AC-8）でカバレッジ対象外。

## 多角的チェック観点（AIが判断）

- **範囲の妥当性**: 変更したのは F2 / F3 のみ。カバレッジ対象をそこに限定するのは「変更コードを被覆できているか」を正確に測るため。広域指定は誤差を生む（[Feedback BEFORE-QUIT-002]）。
- **CSS は対象外**: F1 の視覚効果はカバレッジで測れない。AC-1 / AC-2 は Phase 11 screenshot に委譲する分担を明記。
- **branch 漏れの検出**: 三項演算子（氏名 hit-miss / note 有無 / isSelected）が両分岐被覆されているかを重点確認。

## サブタスク管理

| ID | 内容 | 状態 |
|---|---|---|
| C7-1 | `--coverage.include` を F2 / F3 に限定して計測 | Phase 7 |
| C7-2 | F2 / F3 の分岐被覆を上表で確認 | Phase 7 |
| C7-3 | 未被覆 branch があれば Phase 6 に edge 追加 | Phase 7 → 6 戻し |

## 成果物

- `outputs/phase-7/phase-7.md`（本ファイル）

## 完了条件

- [x] [Feedback BEFORE-QUIT-002][Feedback 5] カバレッジ対象を `_meetings`（F2 / F3）に限定し広域指定を回避
- [x] F1（globals.css）をカバレッジ対象外とする根拠を明記
- [x] 変更した F2 / F3 の line / branch と被覆テストの対応表を提示
- [x] 範囲限定の計測コマンド（`--coverage.include`）を提示
- [x] プロジェクト全体 gate と focused 計測の切り分けを明記

## タスク100%実行確認【必須】

- [x] 実在ファイルパス / data-testid に基づく
- [x] 対象範囲を変更コードに限定（広域指定なし）
- [x] 未被覆 branch の補完手順を提示

## 次Phase

Phase 8（実装着手 / コードレビュー）。
