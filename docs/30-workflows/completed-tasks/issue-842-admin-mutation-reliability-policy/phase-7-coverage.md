# Phase 7: カバレッジ確認

> 本タスクは admin hooks 内部の信頼性 policy 追加（NON_VISUAL）。
> カバレッジ評価対象は **本サイクルで変更したファイルに限定**する。
> プロジェクト全体カバレッジ目標は本 Phase の責務外（`coverage-guard.sh` baseline を下げないことのみ確認）。

## 1. 対象範囲（変更ファイル限定）

| ファイル | 変更種別 | カバレッジ評価対象 |
|---|---|---|
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 編集（policy 追加） | **変更行の line / branch** |
| `apps/web/src/features/admin/hooks/useConfirmDialog.ts` | 編集（`onCancelMutation` 連携追加） | **変更行の line / branch** |

> 評価方針: 「全体カバレッジ %」ではなく、Phase 2 §4 / §5 で新規追加した分岐（timeout / retry / idempotency-key / 404 三値 / abort / `closeConfirm` の submit 中 close）の **変更行 line / branch が踏まれているか**を残す。`MeetingAttendancePanel.tsx` など本サイクル不変のファイルはカバレッジ対象外（index.md「変更対象ファイル」参照）。

## 2. 新規 branch のカバレッジ対応表（Phase 2 §4 / §5 由来）

`useAdminMutation` の `trigger` 改修（Phase 2 §4 内部実装フロー）で追加された各 branch が、Phase 6 で拡充した spec のどのケースで踏まれるかを示す。

| # | 分岐（Phase 2 §） | 期待挙動 | テスト観点（`useAdminMutation.spec.ts`） | 踏破 |
|---|---|---|---|---|
| 1 | timeout 発火（§4 `setTimeout(() => controller.abort(), timeoutMs ?? 10000)`） | timeoutMs 経過で `AbortController.abort()` 発火 | fake timer で timeoutMs 経過 → abort 発火を確認 | ☐ |
| 2 | timeout 既定適用（§8 既定 10000ms） | timeoutMs 未指定で既定 10000ms が使われる | option 未指定 trigger が即解決系で影響なしを確認 | ☐ |
| 3 | retry 成功（§4 `shouldRetry`→`continue loop`、idempotent） | 一過性 5xx 後の再試行で成功し data を返す | `PUT`/`DELETE` + `retry.maxAttempts` で 5xx→200 を確認 | ☐ |
| 4 | retry 最終失敗（§4 `attempt+1 < retry.maxAttempts` 偽） | maxAttempts 到達で最終 5xx を throw | maxAttempts 回 5xx → `FetchAuthedError` throw を確認 | ☐ |
| 5 | retry 非対象 4xx（§4 補助 `shouldRetry` の `retryOn` 既定）| 4xx は idempotent でも retry しない | `PUT` + 400 で retry せず即 throw を確認 | ☐ |
| 6 | retry の二重ガード（§4 `shouldRetry`：`!isIdempotent` で false） | runtime でも非冪等 method では retry されない | 実装シグネチャ経由で非冪等が retry されないことを確認 | ☐ |
| 7 | idempotency-key 指定（§4 header 付与 + §4 `resolveIdempotencyKey`） | `Idempotency-Key` header に文字列値が送出される | `idempotencyKey: "k1"` で header 送出を確認 | ☐ |
| 8 | idempotency-key 未指定 | header に `Idempotency-Key` が付かない | option 未指定で header 不在を確認 | ☐ |
| 9 | idempotency-key 関数形（§4 `typeof k === "function" ? k()`） | trigger 毎に関数評価された値が送出される | `idempotencyKey: () => "k2"` で評価値送出を確認 | ☐ |
| 10 | 404 = `false`（§8 既定）| 既定で 404 は `FetchAuthedError` 失敗扱い | `treat404AsSuccess` 未指定 + 404 で失敗 toast を確認 | ☐ |
| 11 | 404 = `'silent'`（§4 toast なし success）| 404 を成功相当・toast 出さず `undefined` 返却 | `treat404AsSuccess: 'silent'` + 404 で onSuccess 呼出 / toast 無を確認 | ☐ |
| 12 | 404 = `{ toast }`（§4 `toast(treat404AsSuccess.toast, "status")`）| 404 を成功相当・指定 toast を `status` で表示 | `treat404AsSuccess: { toast: "..." }` + 404 で status toast を確認 | ☐ |
| 13 | abort（§4 `e.name === "AbortError"` → silent）| AbortError は `onError`/失敗 toast を呼ばず reject、error 状態も残さない | `abort()` 呼出 → toast/onError 非呼出・`error` が null を確認 | ☐ |
| 14 | mutationFn 経路（§4 `if options.mutationFn` + §8 timeout/retry 非適用）| mutationFn 経路では timeout/retry/abort signal が適用されない | `mutationFn` 指定時に timeout 期待が裏切られない（非適用）を確認 | ☐ |

`useConfirmDialog` の `closeConfirm` 改修（Phase 2 §5）:

| # | 分岐（Phase 2 §5） | 期待挙動 | テスト観点（`useConfirmDialog.spec.ts`） | 踏破 |
|---|---|---|---|---|
| 15 | submit 中 close（§5 `s.submitting` → `onCancelMutation` 呼出 + `INITIAL`）| submit 中の close で `onCancelMutation` を呼び dialog も閉じる | `submitting` 状態で `closeConfirm` → callback 呼出 + close を確認 | ☐ |
| 16 | 非 submit 時 close（§5 `s.open ? INITIAL : s`）| open かつ非 submit で従来通り閉じる（callback 非呼出）| 非 submit で `closeConfirm` → `onCancelMutation` 非呼出を確認 | ☐ |

## 3. カバレッジ取得コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage src/features/admin/hooks/
```

> coverage オプション（`--coverage` の収集 provider / reporter / summary 出力先）は **`apps/web` の vitest.config を確認**して合わせること。`coverage/coverage-summary.json` 等が生成される設定であれば、そこから `useAdminMutation.ts` / `useConfirmDialog.ts` の line / branch を抽出し、上表 #1〜#16 の踏破を裏付ける。timeout 系（#1）は fake timer（Phase 4 / Phase 3 §4 リスク表）で計測する。

全体ガード（merge commit 時は CLAUDE.md 個人開発ポリシーで自動 skip）:

```bash
bash scripts/coverage-guard.sh --changed
```

## 4. 期待結果

| 観点 | 期待値 |
|---|---|
| `useAdminMutation.ts` の変更行 line coverage | 変更行が全て踏まれる（新規 branch #1〜#14 が踏破済） |
| `useAdminMutation.ts` の変更行 branch coverage | timeout / retry（成功・最終失敗・4xx 非retry）/ idempotency-key（指定・未指定・関数形）/ 404 三値 / abort / mutationFn 非適用の各 branch が踏破済 |
| `useConfirmDialog.ts` の変更行 branch coverage | submit 中 close / 非 submit close の両分岐が踏破済（#15・#16）|
| 全体 line coverage delta | `coverage-guard.sh --changed` で低下なし（≥ 0）|

未踏破 branch がある場合は Phase 6 のテストケースを追加・再実行する（新ケース ID は既存連番 `TC-NN` を継続）。

## 5. DoD（Phase 7 完了条件）

- [ ] 評価対象を変更ファイル（`useAdminMutation.ts` / `useConfirmDialog.ts`）に限定したことを明記
- [ ] §2 の新規 branch #1〜#16 が対応テストで踏破済（変更行 line / branch）
- [ ] timeout 分岐 / retry（成功・最終失敗・4xx 非retry）/ idempotency-key（指定・未指定・関数形）/ 404 三値（false / silent / toast）/ abort / mutationFn 非適用経路 が全て表で踏破確認済
- [ ] カバレッジ取得コマンドを実行（coverage オプションは vitest.config 準拠）
- [ ] `coverage-guard.sh --changed` で全体 coverage delta ≥ 0
