# Phase 8: リファクタリング

## 目的

duplicate と navigation drift を削る。

## 変更内容（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| env-aware 分岐ロジック（runner）| 想定: 各 step で `if env=production` 分岐 | `resolve_env_vars()` に集約 | SSOT、test の差し込みポイントを 1 箇所に固定 |
| env-aware 分岐ロジック（mint）| 想定: env 取得時に if 分岐 | `resolveEnvPrefix()` 純粋関数化 | unit test 可能化、未知 env を fail-fast |
| reason 分類文字列 | 既存 runner に直書き | 変更なし（既存定数ブロックを維持）| 既存 SSOT を踏襲 |
| cookie 名 | `__Secure-authjs.session-token`（共通）| 変更なし | staging / production 共通仕様 |
| web-cd の production job | 想定: staging job を共通化 | **意図的に複製**（composite action 化は将来層）| CI workflow の早期共通化は壊れやすい。複製で独立性優先（親 #864 Phase 8 と同方針）|
| mint helper ファイル名 | `mint-staging-session-cookie.mts` | **変更なし**（rename しない）| review surface 最小化。内部の env-aware 一般化で後方互換性を保つ |

## navigation drift チェック

- 親 #864 の Phase 12 unassigned-task-detection.md UT-CANDIDATE-1（production 展開）を本タスクで formalize した旨を Phase 12 で記録。
- Phase 12 system-spec-update-summary.md に親 #864 の completed-tasks root への前方参照を追加。

## 抽出判断（早期抽象化の抑制）

> mint helper rename（`mint-staging-session-cookie.mts` → `mint-admin-session-cookie.mts`）は **行わない**:
> - rename は import path / workflow `tsx <path>` 引用 / skill reference の全件更新を伴う高コスト変更
> - 内部の env-aware 一般化のみで AC を満たせる
> - 将来 `preview` env 等を追加するタイミングで rename を検討（YAGNI）

> 同様に shell common helper `scripts/smoke/lib/smoke-common.sh` 抽出も**行わない**。
> 親 #864 Phase 8 と同方針: 2 個目の web runner が増えた時点で抽出する。

## 完了判定

- [x] env-aware 集約（`resolve_env_vars` / `resolveEnvPrefix`）を SSOT 化
- [x] CI workflow 早期共通化を避けた判断を記録
- [x] rename / helper 抽出を YAGNI で抑制した判断を記録
