# Unassigned Task Detection — staging-mint-bearer-env-contract-guard

> 0 件でも出力必須。本タスク本体の成果物（A role-scoping / B drift gate / C provision 整合 / D degrade）は **先送りせず本サイクルで実コード化まで完了**した。本ファイルは current（今回検出された未タスク）と baseline（既存）を分離し、Phase 10 の MINOR（M-1〜M-4）を漏れなく追跡する。

## 設計タスク 4 パターン チェック

| パターン | チェック観点 | 検出 |
| -------- | ------------ | ---- |
| 型 → 実装 | 仕様に定義した型/関数（`MintRole` / `parseRoles` / `detectContractViolations` 等）に未実装宣言が残らないか | 0 件（本体スコープ内で実装済み） |
| 契約 → テスト | 各 AC（AC-1〜AC-12）に対応する test ケースが設計されているか | 0 件（phase-4/6 で T-RS / T-RE / T-FM / T-MR / T-CLI / drift gate ケースに対応付け済み） |
| UI → component | UI route / component の不足 | 0 件（NON_VISUAL・UI 変更なし） |
| 仕様書間差異 | Phase 1/2/5/9/10 と strict 7 の契約・env 名・定数の不整合 | 0 件（`MintRole` / `ROLE_REQUIRED_ENV` / `MINT_ROLES` / `RUNTIME_SMOKE_MINT_DEGRADE` で全 phase 統一） |

## ソース別 検出結果

| ソース | 検出 | 内容 |
| ------ | ---- | ---- |
| Phase 10 レビュー MINOR | 4 件（M-1〜M-4） | M-1 = current（gating）/ M-2/M-3/M-4 = baseline（将来候補） |
| Phase 11 手動テスト発見 | 0 件 | spec 段階のため runtime 発見なし |
| コードコメント TODO/FIXME | 0 件 | TODO/FIXME なし |
| describe.skip 残存 | 0 件 | — |
| 既存 unassigned-task ディレクトリ | 1 件（issue #916） | 下記 baseline B-0（関連既存タスク・本タスクと境界分離） |

## current（今回検出された未タスク）

### M-1: required status check への `verify-mint-env-contract` 登録（gating・先送りではない）

- 概要: 新規 gate workflow `verify-mint-env-contract.yml` は実装されるが、`dev` / `main` の `required_status_checks` に登録しないと PR をブロックできない（drift を検出しても merge を止められない）。
- 区分: governance / gating。
- **gating であり先送り（別 Issue 化）ではない**: CLAUDE.md「ブランチ戦略」記載のとおり、`verify-mint-env-contract / verify` を required status check に追加する操作（`gh api -X PUT` / PUT payload）は **user 明示承認後のみ実行**する。read-only の before JSON（`gh api repos/daishiman/UBM-Hyogo/branches/dev/protection`）取得は事前 evidence として可。本タスクでは承認待ち境界として記録し、実 PUT は行わない。これは CONST_007 の先送りではなく、user 承認必須の gating である。
- 実施時期 / 場所: 実装 wave で gate workflow が landed し、PR が緑になることを確認した後、user 明示承認で `gh api -X PUT`。

> Phase 10 §10.5 / §10.6 と一致。silent drop せず current として記録（2 回検証一致を取り次第 user-gated で扱う）。

## baseline（既存・将来候補・本タスク AC 射程外）

### B-0: STAGING_AUTH_SECRET 投入と mint path 有効化（既存 unassigned-task・issue #916）

- ファイル: `docs/30-workflows/unassigned-task/runtime-smoke-staging-mint-recurrence-fix-followup-001-staging-auth-secret-provisioning-mint-activation.md`（status=未実施・infra-ops）。
- 関係: 本タスク（契約 drift gate の実装仕様化）が「どの env が必要か」を role 単位に整理するのに対し、#916 は「その env（実 secret）を 1Password から Cloudflare へ実投入する」infra-ops 実行タスク。関心が分離しており本タスクで消費・変更しない。
- 既存 remediation task として参照記録のみ（baselineViolations の既存分・新規起票しない）。

### B-1（M-2）: drift gate の YAML 静的解析網羅性の将来再点検

- 概要: gate の YAML 解析は js-yaml 不在時に正規表現 fallback となる。将来 workflow 記法（matrix 内 mint step・複数行 `run` での `--roles` 指定等）が増えると抽出漏れリスク。
- 区分: improvement / 将来候補。2 本目以降の mint step 追加時に descriptor 抽出の網羅性を再点検。

### B-2（M-3）: degrade の恒久化回避（secret 整備後の撤去運用）

- 概要: degrade（D）は staging 過渡期の安全網。secret 整備完了後は `RUNTIME_SMOKE_MINT_DEGRADE` を撤去し staging も hard-fail へ戻す運用判断が将来発生しうる（恒久 degrade を既定化しない）。
- 区分: operations / 将来候補。

### B-3（M-4）: 旧 static-bearer secret の dead 化追跡

- 概要: provision の旧 static-bearer 集合（`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `STAGING_MEMBER_ID`）は degrade fallback 用に明示分離して残すが、degrade 撤去（B-2）と同時に廃止できる。dead secret 化の追跡。
- 区分: operations / 将来候補。

## 関連タスク差分確認（重複起票防止 / FB-CANCEL-004-2）

| 候補 | 既存タスクとの重複 | 判定 |
| ---- | ------------------ | ---- |
| M-1（required status check 登録） | 既存に該当 Issue なし。CLAUDE.md ブランチ戦略の user-gated 操作 | 重複なし・gating として current 記録（起票せず） |
| B-1（YAML 解析網羅性） | 既存 Issue なし。将来候補 | 重複なし・起票しない |
| B-2 / B-3（degrade 撤去・dead secret） | issue #916（secret 投入）の後工程と論理依存。#916 完了が前提 | #916 と論理連続・本サイクルで起票しない |
| B-0（issue #916） | 既存 unassigned-task として実在 | 既存・新規起票しない |

> current = M-1（gating）1 件。baseline = B-0（issue #916）+ B-1/B-2/B-3（将来候補）。いずれも本サイクルで Issue 化しない（M-1 は user 承認 gating・B-* は 2 回検証一致後に必要なら user-gated 起票）。本体成果物（A/B/C/D）は先送りではなく同一スコープで実装済み。
