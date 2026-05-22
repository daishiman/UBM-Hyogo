# Phase 12: ドキュメント整備・compliance

task-specification-creator skill の Phase 12 6 必須タスクに沿って成果物を生成済み。

## 1. 実装ガイド作成

出力先: `outputs/phase-12/implementation-guide.md`

### Part 1（中学生レベル）

「待っている間に表示される“読み込み中”の画面を、ぼんやりした影絵みたいなカードのカタチに変える。文字だけだと寂しいので、丸いアイコンの場所と、4 行の項目の場所をうっすら出しておく。色は HEX を直接書かず、サイトの公式パレット（OKLch token）から拾う。アニメは“動きを減らす設定”を ON にしているユーザーには止まる」。

### Part 2（技術者レベル）

- `apps/web/app/profile/loading.tsx` を `<main role="status" aria-busy aria-live="polite">` で skeleton に置換
- `bg-surface-2` design-token utility のみ使用、component-level HEX / arbitrary color 直書き禁止
- `motion-safe:animate-pulse` で `prefers-reduced-motion` に追従
- `loading.spec.tsx` で role/aria/sr-only/structure/token class を 4 ケース検証
- `apps/web/playwright/tests/visual/profile-loading-skeleton.spec.ts` で Phase 11 screenshot を保存

## 2. システム仕様書更新

aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / changelog / artifact inventory を同一 wave で同期する。`docs/00-getting-started-manual/specs/` の API / DB / auth contract には影響しない（loading placeholder の実装詳細のため）。

## 3. ドキュメント更新履歴

出力先: `outputs/phase-12/documentation-changelog.md`

- 新規 `docs/30-workflows/profile-loading-skeleton-oklch/{index,phase-01..13}.md`
- 新規 `apps/web/app/profile/loading.spec.tsx`
- 変更 `apps/web/app/profile/loading.tsx`

## 4. 未タスク検出レポート

出力先: `outputs/phase-12/unassigned-task-detection.md`

検出: **0 件**。
理由: avatar / KV pair component 化、`/login/loading.tsx` 等の他 route skeleton 統一は別タスクで扱う（本タスクの SCOPE 外として明示済み）。

## 5. スキルフィードバックレポート

出力先: `outputs/phase-12/skill-feedback-report.md`

- テンプレ改善: なし
- ワークフロー改善: 元 spec の in-place fix を Phase 1-13 へ正式昇格させた手順を記録
- ドキュメント改善: なし

## 6. タスク仕様書 compliance チェック

出力先: `outputs/phase-12/phase12-task-spec-compliance-check.md`

| 観点 | 状態 |
|------|------|
| canonical 9 headings | PASS |
| Phase 11 evidence inventory（番号付き見出し / Path 列 / status lowercase / screenshot） | PASS |
| workflow root scan | PASS（path 全て workflow root 配下） |
| HEX 直書き 0 件 | PASS |
| 状態語彙 | `implemented_local_evidence_captured / implementation_complete_pending_pr` |

## 完了条件

- [x] 上記 7 成果物が `outputs/phase-12/` に物理存在
- [x] root / outputs `artifacts.json` parity
- [x] `verify-phase12-compliance` gate PASS（`outputs/phase-11/evidence/verify-phase12-compliance.log`）
- [ ] commit / push / PR はユーザー承認待ち
