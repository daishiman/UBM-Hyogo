# Phase 6: テスト拡充（fail path / 回帰 guard）— issue-1103 globals.css 重複 shell ブロック 1 本化

> **[実装区分: 実装仕様書 / NON_VISUAL]**
> implementation_mode: new / status: implemented_local_evidence_captured（commit・push・PR は user-gated）

## 1. 方針

Phase 4 の検証コマンドスイートが正常系（happy path）を担保する。本フェーズでは **異常系（fail path）の検出可能性**と、**将来の drift 再発防止 guard** を整理する。

CSS dedup という極小タスクの性質上、専用 Vitest を新設するより **grep ベースの軽量チェック + 既存 token gate の回帰維持**を主とする。専用 CI guard の追加は scope を超えるため、本 PR では採用せず未タスク化の判断材料を残す（§4）。

## 2. fail path（誤削除の検出）

| fail シナリオ | 検出コマンド | fail 時の症状 |
| --- | --- | --- |
| F-1: 先発ブロックも消した（両方削除） | `grep -c '=== parallel-01 P1-1 page surface ===' apps/web/src/styles/globals.css` | 期待 `1` に対し `0` |
| F-2: 後発を消し損ねた（依然重複） | 同上 | 期待 `1` に対し `2` |
| F-3: admin スコープ派生（元 2306）を誤削除 | `grep -c '\[data-route-group="admin"\] \[data-shell="sidebar"\]' apps/web/src/styles/globals.css` | 期待 `1` に対し `0` |
| F-4: 閉じ括弧を取り過ぎ/取り残し（CSS 構造破壊） | `mise exec -- pnpm --filter @ubm-hyogo/web build` | build fail（CSS パースエラー） |
| F-5: 隣接 parallel-09 コメントまで巻き込み削除 | `grep -c 'parallel-09 G9-6 mobile responsive helpers' apps/web/src/styles/globals.css` | 期待 `1` に対し `0` |
| F-6: token を巻き込み破損し HEX 直書きが混入 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/__tests__/tokens.runtime.spec.ts` | token runtime test fail |

> F-1〜F-3 / F-5 は **grep カウント不一致**、F-4 は **build fail**、F-6 は **token gate fail** で必ず検出される。3 系統の独立 guard で誤削除が漏れなく捕捉される。

## 3. 回帰 guard 案（drift 再発防止）

将来再び同一ブロックがコピペで二重化する drift を防ぐ案:

- **案 A（grep 手動チェック / 本 PR 採用）**: 削除後に以下が `1` であることを Phase 4 TC-2b として手動確認する。追加コストゼロ。
  ```bash
  grep -c '=== parallel-01 P1-1 page surface ===' apps/web/src/styles/globals.css   # 期待: 1
  ```
- **案 B（専用 CI guard 追加 / 本 PR 見送り）**: `.github/workflows/` または既存 `verify-design-tokens` 近傍に「`parallel-01 P1-1` コメントが globals.css に 2 回以上現れたら fail」する grep gate を追加する案。drift 再発が頻発する場合の選択肢。本タスクは極小（1 ファイル削除）であり、専用 CI job を増やすコストが利得を上回るため **本 PR では採用しない**。
- **案 C（汎用 CSS 重複検出ツール導入 / 本 PR 見送り）**: stylelint plugin 等での構造重複検出。導入コスト大・本タスク scope 外。

### 判断（本 PR の決定）

- **採用 = 案 A**（grep 手動確認 + 既存 token gate 回帰維持）。
- **見送り = 案 B / 案 C**。専用 CI guard は本タスク scope を超えるため未採用とし、必要なら別 issue（未タスク化）で検討する。Phase 10 / Phase 13 で「専用 drift guard CI を起票するか」を最終判断する。

## 4. 新規テストファイル

- **なし**。本タスクは `*.spec.{ts,tsx}` の新設を行わない（不変条件 #8 に抵触しない / 新規テスト不要）。
- 既存 `apps/web/src/__tests__/tokens.runtime.spec.ts` を回帰 guard として再利用する（変更なし・PASS 維持のみ）。

## 5. 実行（local 実行済み）

```bash
# fail path の網羅検出に使う 3 系統
grep -c '=== parallel-01 P1-1 page surface ===' apps/web/src/styles/globals.css            # 期待 1（F-1/F-2）
grep -c '\[data-route-group="admin"\] \[data-shell="sidebar"\]' apps/web/src/styles/globals.css  # 期待 1（F-3）
mise exec -- pnpm --filter @ubm-hyogo/web build                                            # 期待 exit 0（F-4/F-5）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/__tests__/tokens.runtime.spec.ts                                            # 期待 PASS（F-6）
```
