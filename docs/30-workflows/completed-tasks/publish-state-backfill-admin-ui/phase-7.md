# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 7 / 13 |
| 実装区分 | 実装仕様書 |
| workflow_state | implemented_local_evidence_captured |
| 前提 | Phase 4-6（テスト / 実装 / 拡充）完了 |
| 正本 | 既存実装（PR #1064 / commit `745c95115` で dev へ landed） |

> 本仕様書は landed 実装の正本記述。本タスク追加モジュールの分岐が Phase 4-6 の TC で覆われ、apps/web 既定 coverage 閾値を満たすことを確定する。Write 対象は仕様書のみ。

## 目的

`backfill.ts` / `BackfillPublishStatePanel.client.tsx` の全分岐が TC-A1..A7 / TC-B1..B4 で覆われていることをマッピングで証明し、apps/web 既定 coverage 閾値（Statements / Branches / Functions / Lines >= 80%）を満たすことを `coverage-guard.sh` で確定する。

## 実行タスク

### coverage AC

| 指標 | 閾値 |
|------|------|
| Statements | >= 80% |
| Branches | >= 80% |
| Functions | >= 80% |
| Lines | >= 80% |

- apps/web の既定閾値（プロジェクト共通）を本タスク追加モジュールに適用する。
- 閾値割れ時は `coverage-guard.sh` が exit 非 0 で fail する。

### 検証コマンド

```bash
bash scripts/coverage-guard.sh                       # exit 0 を確認
mise exec -- pnpm --filter @ubm-hyogo/web test        # 全 TC green
```

### 分岐カバレッジ マッピング

#### `backfill.ts`（`BackfillResultSchema`）

| 分岐 | 覆う TC |
|------|---------|
| valid object 受理 | TC-B1（candidates=2 parse） / TC-A1（panel 経由 dry-run parse 成功） |
| `policy` literal 違反 | TC-B2（`policy:"other"` reject） |
| `nonnegative` 違反 | TC-B3（`scanned:-1` reject） |
| `skipped` キー欠落（`.strict()`） | TC-B4（`deleted` 欠落 reject） |
| schema mismatch（panel 経由） | TC-A6（`{ foo:1 }` → parseError） |

#### `BackfillPublishStatePanel.client.tsx`

| 分岐 | 条件 | 覆う TC |
|------|------|---------|
| dryRun path | `nextMode==="dryRun"` → `?dryRun=true` | TC-A1 |
| apply path | `nextMode==="apply"` → `?dryRun=false` | TC-A2 |
| parse 成功 | `safeParse().success===true` → setLastResult/setMode | TC-A1 / TC-A2 |
| parse 失敗 | `safeParse().success===false` → parseError + 結果クリア | TC-A6 |
| confirm true | apply 続行 | TC-A2 / TC-A7 |
| confirm false | 早期 return（trigger 未呼出） | TC-A2c |
| `canApply` true | dry-run 済 + dryRun + candidates>0 → apply 有効 | TC-A2（apply 実行可） |
| `canApply` false | dry-run 前 / candidates=0 → apply disabled | TC-A2b |
| `mutation.error` 有 | `role="alert"` に error、結果非描画 | TC-A5 |
| `mutation.error` 無 | 通常描画 | TC-A1 / TC-A2 |
| `parseError` 優先描画 | parseError → mutation.error の順 | TC-A6 |
| pending（isLoading） | 両ボタン disabled | TC-A4 |
| apply 実行中の busy（`activeMode==="apply"`） | apply ボタンのみ loading（dry-run は非 loading） | TC-A4b |
| dry-run 実行中の busy（`activeMode==="dryRun"`） | dry-run ボタンのみ loading（apply は非 loading） | TC-A1（dry-run 実行経路） |
| `onApplied` 呼出 | apply 成功時 `!dryRun` で `onApplied?.(parsed.data)` | TC-A7 |
| `onApplied` 未呼出 | dry-run 時は呼ばない | TC-A1（onApplied prop 無し） |
| skipped 各行描画 | 4 種の `dt`/`dd` 描画 | TC-A3 |

> 上表により dryRun/apply・parse 成功/失敗・confirm true/false・canApply true/false・error 有無の全分岐が TC で到達済み。

## 参照資料

| 種別 | パス |
|------|------|
| 依存 Phase 5 成果物 | `./phase-5.md` |
| 依存 Phase 6 成果物 | `./phase-6.md` |
| coverage gate | `scripts/coverage-guard.sh` |
| 対象モジュール | `apps/web/src/features/admin/diagnostics/backfill.ts` |
| 対象モジュール | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` |
| panel テスト | `.../components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx` |
| schema テスト | `.../diagnostics/__tests__/sync-schemas.spec.ts` |

## 実行手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test
bash scripts/coverage-guard.sh
mise exec -- pnpm lint
```

1. `pnpm --filter @ubm-hyogo/web test` で全 TC green を確認する。
2. `bash scripts/coverage-guard.sh` を exit 0 で通す。
3. 分岐カバレッジ マッピング表で未到達分岐がないことを点検する。
4. 閾値割れがあれば未到達分岐を特定し Phase 6 へ差し戻す。

## 統合テスト連携

- 3 層（endpoint / web schema / panel）のうち web 層 2 モジュールの分岐網羅をここで確定し、Phase 8 以降（品質 / レビュー / ドキュメント）へ引き渡す。

## 多角的チェック観点（AIが判断）

- coverage 閾値割れが追加モジュール起因か他モジュール起因かを切り分けられるか。
- マッピング表の各分岐が実 TC のアサーションと対応しているか（机上対応で終わっていないか）。
- `coverage-guard.sh` が `--changed` モードで本タスク差分を正しく対象化するか。
- 命名規約（`*.spec.*`）/ mutation 規約（不変条件 #10）が coverage 取得対象内で維持されているか。

## サブタスク管理

| ID | 内容 | 判定 |
|----|------|------|
| T7-1 | coverage AC（>=80% 4 指標）定義 | 完了 |
| T7-2 | 分岐カバレッジ マッピング | 完了 |
| T7-3 | `coverage-guard.sh` exit 0 確認 | 完了（landed） |

## 成果物

- 分岐カバレッジ マッピング表（backfill.ts / BackfillPublishStatePanel.client.tsx）。
- `coverage-guard.sh` exit 0 / 全 TC green の確認。

## 完了条件

- [x] apps/web 既定 coverage 閾値（Statements / Branches / Functions / Lines >= 80%）を満たす。
- [x] `bash scripts/coverage-guard.sh` が exit 0。
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web test` が全 TC green。
- [x] dryRun/apply・parse 成功/失敗・confirm true/false・canApply true/false・error 有無の全分岐が TC にマッピング済み。

## タスク100%実行確認【必須】

- [x] coverage AC（4 指標 >= 80%）を明記した。
- [x] 検証コマンド（`coverage-guard.sh` / `pnpm --filter @ubm-hyogo/web test`）を記載した。
- [x] 対象モジュールの全分岐を TC へマッピングした。

## 次Phase

Phase 8（品質ゲート / 静的解析）。
