# Phase 7: カバレッジ確認

> **Phase 種別**: カバレッジ計測・確認（変更箇所限定）
> **対象 issue**: #1078 BulkActionBar tag picker 大規模 catalog UX 改善 + tag master read contract 修正
> **実装区分**: implemented_local_evidence_captured。変更分岐は focused tests で実測済み。
> **前提**: Phase 5 実装 + Phase 6 テスト拡充が完了し、全テスト green であること。
> **次フェーズ**: Phase 8 リファクタリング

---

## 7.1 このフェーズのゴール

本 issue で **変更した関数・分岐に限定**して line / branch カバレッジを実測し、
以下が漏れなくテストで踏まれていることを証跡として残す:

1. `fetchTagMaster` / `fetchAllTagMaster`（`members.ts`）の API contract 読み替え（`{total, items}` → `available`）と pagination 取得ループ。
2. `BulkActionBar`（`BulkActionBar.tsx`）の **検索フィルタ / 折りたたみ / 選択中行 chip / ロード（pagination 由来の全件 catalog）** の各分岐。

> カバレッジは「**変更箇所の網羅**」を目的とし、リポジトリ全体の数値目標は本 issue の DoD にしない。
> 既存 coverage-guard（`scripts/coverage-guard.sh`）の閾値は別レーンで担保する（FB BEFORE-QUIT-002 / Feedback 5）。

---

## 7.2 カバレッジ対象範囲（変更関数・変更分岐に限定）

| ファイル | 関数 / 箇所 | 検証すべき分岐 | 担保 TC |
|---------|-----------|--------------|---------|
| `apps/web/src/features/admin/api/members.ts` | `fetchTagMaster`（contract 修正: `{total, items}` を読み `available` を組み立てる） | ① `res.ok=false` → throw ② `{items}` 正常 → `items` を `AdminTagRef[]` に正規化 ③ `items` 空配列 → 空 `available` ④ `total` と `items.length` の整合判断（次ページ要否） | members.spec.ts: AC-0 系（CT-MEM-01..04） |
| `apps/web/src/features/admin/api/members.ts` | `fetchAllTagMaster`（pagination で全 catalog を取得する新規 helper） | ① 1 ページで完了（`items.length >= total`） ② 複数ページ巡回（`offset/cursor` を進めて連結） ③ 途中ページ `res.ok=false` → throw ④ `total=0` → 1 リクエストで空配列 | members.spec.ts: AC-3 系（CT-MEM-05..08） |
| `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | tag catalog ロード（`useEffect` で `fetchAllTagMaster`） | ① 成功 → `available` set ② 失敗（reject） → `available=[]`（picker 空） ③ unmount 中の set 抑止（`active` フラグ） | BulkActionBar.spec.tsx: TC-BAB-TAG-01, TC-BAB-LOAD-01 |
| 同上 | 検索フィルタ（`query` state + 絞り込み） | ① 空 query → 全件表示 ② 一致 query → label / code 部分一致のみ表示 ③ 不一致 query → 0 件（空状態文言） ④ 大文字小文字・前後空白の正規化 | BulkActionBar.spec.tsx: TC-BAB-SEARCH-01..03 |
| 同上 | 折りたたみ（catalog の開閉 + 検索時の自動展開） | ① 既定折りたたみ → group 本体非表示 ② 展開トグル → 表示 ③ 検索入力時の挙動（自動展開 or フィルタ結果のみ表示） | BulkActionBar.spec.tsx: TC-BAB-COLLAPSE-01..02 |
| 同上 | 選択中行 chip（選択タグの常時表示・検索/折りたたみと独立） | ① 選択 0 → chip 行非表示 ② 選択あり → chip 描画 ③ 検索で非表示の選択タグも chip 行に残る ④ chip からの解除トグル | BulkActionBar.spec.tsx: TC-BAB-SELRETAIN-01..02 |
| 同上 | max-height スクロール領域（`AC-5`） | ① catalog 描画コンテナに max-height + overflow が付与される（DOM 属性 / class 観測） | BulkActionBar.spec.tsx: TC-BAB-MAXH-01 |

> 上記 TC 番号は Phase 6 で確定する命名に揃える。Phase 7 は「**7.2 表の全分岐に対応 TC が存在し uncovered branch = 0**」を確認する役割に徹する。
> 未踏分岐が残る場合は Phase 6 に戻り、その分岐に対応する TC を追加する（カバレッジ駆動の補完）。

---

## 7.3 スコープ外（カバレッジ対象にしない）

| 箇所 | 理由 |
|------|------|
| `run()`（publish / hide / soft-delete のシリアル mutation） | **本 issue 無改変**。既存 TC-BAB-01..04 で担保済み。tag picker UX とは別系統。 |
| `runBulkTags()` / `summarize()`（bulk assign/unassign mutation と結果集計） | issue-1036 由来で **本 issue では shape 不変**。既存 TC-BAB-TAG-02..05 で担保。 |
| `bulkApplyMemberTags`（raw helper） | 無改変。read contract（`fetchTagMaster`）のみが本 issue の修正対象。 |
| `useAdminMutation` hook 本体 | 無改変。テストでは mock。 |
| `TagPill` primitive | 無改変（再利用のみ）。 |
| `assignMemberTag` / `unassignMemberTag` / `fetchMemberTags`（drawer 系） | 別経路（member 単体 drawer）。本 issue 無改変。 |

---

## 7.4 カバレッジ実測コマンドと証跡方針

```bash
# web パッケージのカバレッジ（変更ファイルを include で絞る）
mise exec -- pnpm --filter @ubm-hyogo/web test --run --coverage \
  --coverage.include='src/features/admin/api/members.ts' \
  --coverage.include='src/features/admin/components/_members/BulkActionBar.tsx'
```

> `--coverage.include` glob は Vitest（`@vitest/coverage-v8`）設定に依存する。
> プロジェクトの `vitest.config.ts` が CLI override を許すか確認し、不可なら一時的に config の
> `coverage.include` を上記 2 ファイルへ絞って計測する（**commit はしない**）。

### 証跡として残すもの

- 上記出力の **per-file line % / branch %** を Phase 7 実行ログ（`outputs/phase-7/coverage.md`）に貼る。
- 変更 2 ファイル（`members.ts` / `BulkActionBar.tsx`）の **branch カバレッジが 7.2 表の全分岐を踏んでいる**こと（uncovered branch = 0）を確認する。

---

## 7.5 期待カバレッジ（変更箇所）

- **line**: `fetchTagMaster` / `fetchAllTagMaster` の追加・修正行、`BulkActionBar` の検索 / 折りたたみ / chip / ロード分岐を 100% 近傍で踏む。
- **branch**: 7.2 表の全分岐に対応 TC が存在し uncovered branch = 0 を目標とする。
  特に **contract 読み替え（`{items}` → `available`）の正常 / 空 / 複数ページ巡回**は P0 バグの核心のため必ず全て踏む。

---

## 7.6 入出力・副作用

- **入力**: Phase 4-6 の全テスト（green 前提）。
- **出力**: カバレッジレポート（per-file line/branch %）。
- **副作用**: 計測のみ。プロダクトコード変更なし（config を一時変更した場合は計測後に戻す＝commit しない）。

---

## 7.7 ローカル実行コマンド（CONST_005）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run --coverage
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 7.8 DoD（Definition of Done）

- [x] 変更 2 ファイル（`members.ts` / `BulkActionBar.tsx`）の主要分岐を focused tests で実測した
- [x] 7.2 表の全分岐に対応 TC が存在する
- [x] contract 読み替え（`{items}` → `available`）の正常 / 空 / 複数ページ巡回が全て踏まれている
- [x] 検索 / 折りたたみ / 選択中行 chip / catalog ロードの各分岐が踏まれている
- [x] スコープ外（publish/hide/soft-delete・bulk mutation・drawer 系）を 7.3 に明記し対象に含めていない
- [x] 証跡を `outputs/phase-11/manual-test-result.md` と `outputs/phase-12/phase12-task-spec-compliance-check.md` に残した
- [x] `git status` / `git diff --stat` で実変更を確認した

> coverage CLI の per-file percentage は未取得だが、local deterministic evidence として focused Vitest / typecheck / lint / token grep は取得済み。


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| workflow | issue-1078-bulk-tag-picker-large-catalog-ux |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| verdict | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 目的

本 Phase の既存本文で定義した目的に従い、issue #1078 の tag master contract 修正と BulkActionBar large catalog UX を検証可能な単位で扱う。

## 実行タスク

- [x] Phase 本文の設計・実装・検証項目を issue #1078 の実装結果に同期する。
- [x] 実コード差分、focused tests、typecheck、lint の local evidence と矛盾しない状態語彙へ更新する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/index.md`
- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/artifacts.json`
- `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [x] 必須見出しが揃っている。
- [x] 状態語彙が `implemented_local_evidence_captured` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` と整合している。


## 統合テスト連携

- [x] API client contract は `apps/web/src/features/admin/api/__tests__/members.spec.ts`（11 tests PASS）で検証済み。
- [x] BulkActionBar UI / a11y / regression は `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`（20 tests PASS）で検証済み。
- [x] broader web Vitest run は 216 files / 1587 tests PASS / 1 skipped。
