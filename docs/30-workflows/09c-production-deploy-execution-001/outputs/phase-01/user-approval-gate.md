# user 明示承認ゲート設計（G1 / G2 / G3）

| ゲート | Phase | 承認対象 | 入力 evidence | 出力 evidence |
| --- | --- | --- | --- | --- |
| G1: scope 固定 | 1 | scope / AC 13 件 / approval gate 設計 | outputs/phase-01/main.md, user-approval-gate.md | outputs/phase-01/user-approval-log.md |
| G2: preflight 通過 | 5 | `git rev-parse origin/main` / `cf.sh whoami` / migration list / secrets list | outputs/phase-05/preflight-evidence.md | outputs/phase-05/user-approval-log.md |
| G3: GO/NO-GO | 10 | smoke + 認可境界 + release tag 付与結果 | outputs/phase-09/smoke-evidence.md, outputs/phase-08/release-tag-evidence.md | outputs/phase-10/go-no-go.md, outputs/phase-10/user-approval-log.md |

## 各ゲート共通ルール

1. **承認なしで次 Phase 実行禁止**: `outputs/phase-XX/user-approval-log.md` に GO 文字列が無い限り次 Phase の mutation コマンドを起動しない。
2. **承認文字列の例**: `[approval-gate-N] GO @ <ISO8601> by <user>` / `[approval-gate-N] NO-GO @ <ISO8601> reason: <text>`
3. **rollback 起動条件**:
   - G2 NO-GO → mutation 開始前のため rollback 不要、Phase 5 で停止
   - G3 NO-GO → Phase 6/7/8 で適用済みのため `bash scripts/cf.sh rollback <PREV_VERSION_ID>` + 必要なら D1 restore 起動

## G1 適用範囲ノート

本実行セッションでは user は **(A) safe route** を選択した。これは:
- Phase 1〜4 の docs evidence 出力までは GO
- Phase 5 の **read-only preflight のみ** 実行 GO（mutation を伴うコマンドは不実行）
- **Phase 6 以降は別途 G2 を取得するまで起動しない**

を意味する範囲承認である。完全な G1 (全 Phase scope 承認) ではない点に留意。
