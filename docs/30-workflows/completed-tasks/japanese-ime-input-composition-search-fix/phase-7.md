# Phase 7: カバレッジ確認（変更ファイル限定）

> 本プロンプト（タスク仕様書作成）ではコードを実装しない。本 Phase は後続実装プロンプトが着手できる
> **カバレッジ確認仕様**を記述する（CONST_006）。

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 前 Phase: 6 / 次 Phase: 8
- 作成日: 2026-06-02

## 目的

本サイクルの変更ファイルに限定してカバレッジを評価し、IME-safe 入力ロジックの分岐網羅が十分であることを確認する。
カバレッジ対象を無制限に広げて全体平均で誤魔化さず、**変更ファイルに範囲を限定**して評価する（[Feedback BEFORE-QUIT-002]）。
特に共有フック `useImeSafeInput.ts` の分岐（composition 中 / 非中、debounce 0 / >0、commitNow、外部 value 同期スキップ）の
line / branch 100% を変更箇所の目標として明記する（[Feedback 5]）。

## 実行タスク

1. カバレッジ評価対象を変更 4 ファイルに限定して列挙する。
2. 各ファイルの目標カバレッジ（特に `useImeSafeInput.ts` の分岐）を確定する。
3. カバレッジ取得コマンドと判定手順を記述する。
4. `bash scripts/coverage-guard.sh` exit 0 を完了条件とする。

## 7.1 カバレッジ評価対象（変更ファイル限定・[BEFORE-QUIT-002]）

| パス | 種別 | 目標 |
| --- | --- | --- |
| `apps/web/src/hooks/useImeSafeInput.ts` | 新規 | line / branch **100%**（全分岐網羅・[Feedback 5]） |
| `apps/web/src/components/ui/Search.tsx` | 修正 | 変更行（フック配線・×即 commit・draft 表示条件）100% |
| `apps/web/src/components/public/SelectedFiltersBar.client.tsx` | 修正 | 変更行（q チップ削除後の他チップ分岐）非退行 |
| `apps/web/src/components/ui/Input.tsx` | 修正 | 追加分岐（imeSafe opt-in 経路 / 既存経路）両側 100% |

> `MemberFilters.client.tsx` は原則無改修（配線確認のみ）。改修が発生した場合のみ対象に追加する。

## 7.2 `useImeSafeInput.ts` の分岐網羅目標（[Feedback 5]）

以下の分岐を line / branch 100% でカバーする（Phase 4/6 の TC で担保）:

| 分岐 | 真 | 偽 | 担保 TC |
| --- | --- | --- | --- |
| `isComposingRef.current`（composition 中 / 非中） | 中: commit 抑止（TC-H1） | 非中: scheduleCommit（TC-H3） | TC-H1 / TC-H3 |
| `debounceMs === 0`（即時 / 遅延） | 0: 同期 commit（TC-H12） | >0: timer commit（TC-H2） | TC-H12 / TC-H2 |
| `commitNow` 経路（clearTimer + 即 commit） | 呼出（TC-H5/TC-H13） | — | TC-H5 / TC-H13 |
| 外部 `value` 同期（`!isComposing && value !== draft`） | 同期（TC-H6 非 composition） | スキップ（TC-H6 composition 中） | TC-H6 |
| compositionend 値取得（`currentTarget ?? target`） | currentTarget（TC-H10） | target（TC-H10） | TC-H10 |
| unmount cleanup（clearTimer） | 保留タイマー clear（TC-H9） | — | TC-H9 |
| 連続 change のタイマー clear（最終値のみ） | clear して再設定（TC-H8/TC-H4） | — | TC-H4 / TC-H8 |

## 7.3 取得コマンド

```bash
# 変更ファイルに限定してカバレッジ取得（対象 spec 指定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts --coverage \
  apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx \
  apps/web/src/components/ui/__tests__/Search.spec.tsx \
  apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/ui/__tests__/Input.spec.tsx

# プロジェクト coverage gate
bash scripts/coverage-guard.sh
```

## 7.4 判定手順

1. カバレッジレポートで対象 4 ファイルの line / branch / function を確認する。
2. `useImeSafeInput.ts` は line / branch 100% であること（未到達分岐があれば Phase 6 TC を追補）。
3. 他 3 ファイルの変更行に未カバー行がないこと。
4. apps/web 全体しきい値 >=80%（Statements/Branches/Functions/Lines）を満たすこと。
5. `bash scripts/coverage-guard.sh` が exit 0 であること。

## 参照資料

- `phase-4.md` / `phase-6.md`（TC 定義）/ `phase-5.md`（変更ファイル）
- [Feedback BEFORE-QUIT-002]（カバレッジ対象の変更ファイル限定）
- [Feedback 5]（変更箇所の line/branch 100% 明記）

## 成果物

- `phase-7.md`（変更ファイル限定カバレッジ確認仕様）

## 統合テスト連携

- Phase 6 で拡充した TC を含めて変更ファイル限定カバレッジを取得する。
- 未到達分岐が判明した場合は Phase 6 へ戻り TC を追補する。
- Phase 9 品質保証で `coverage-guard.sh` exit 0 を最終ゲートとして再確認する。

## 完了条件

- [ ] カバレッジ評価対象を変更 4 ファイルに限定明示した（[BEFORE-QUIT-002]）
- [ ] `useImeSafeInput.ts` の分岐網羅目標を line/branch 100% として表で確定した（[Feedback 5]）
- [ ] 各分岐を担保する TC をマッピングした
- [ ] カバレッジ取得コマンドと判定手順を明記した
- [ ] apps/web しきい値 >=80% を明記した
- [ ] `bash scripts/coverage-guard.sh` exit 0 を完了条件に含めた
