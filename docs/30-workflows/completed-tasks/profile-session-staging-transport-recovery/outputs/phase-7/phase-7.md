# Phase 7: カバレッジ確認

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 7 / 13 |
| taskType | implementation |
| implementation_mode | `edit` |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

Phase 6 のテスト群が、本サイクルで**変更するブロックに限定**して line / branch を充足することを、対象ファイル・対象関数・実測予定値の表で固定する。カバレッジ目標は apps 全体の一律閾値ではなく、**T02（env field-tolerant）/ T03（chain 構成・fallback 分岐）が触れる関数・分岐に限定**して評価する。T01 統合 取込分は観測性ブランチ側で既にテスト済（merge 後 green 確認 = AC-1）であり、T04（shell）は vitest カバレッジ対象外として `bash -n` + 出力 key 検査（task-04 §5）で別途担保する。

## 実行タスク

### 7.1 カバレッジ対象範囲（限定スコープ）

| タスク | 変更ファイル | 評価対象ブロック | 評価対象外 |
| --- | --- | --- | --- |
| T02 | `apps/web/src/lib/env.ts`（編集） | `parseAuthEnvFieldTolerant`（field ループ・valid/drop 分岐）+ `getAuthEnv`（warn 有無分岐・`API_SERVICE` 透過） | `getEnv` / `getPublicEnv*` / `getEnvironment*` / `getPublicFetchEnv` / `getAdminFetchEnv`（無変更） |
| T03 | `apps/web/src/lib/fetch/transport.ts`（編集） | `resolveApiTransportChain` 全分岐（isTest / binding / internal / public(staging・production 限定 + 重複排除) / 明示 local / 候補 0 throw）+ `fetchViaApiTransportChainWithMeta`（成功 / `ApiTransportError` 判定 / method 判定 / 次候補有無 / warn / rethrow）+ `fetchViaApiTransportChain` wrapper | 既存 `resolveApiFetch` / `fetchViaApiTransport` / `describeTransport` / `ApiTransportError`（T01 取込・無変更。既存テストで被覆済） |
| T03 | `apps/web/src/lib/fetch/authed.ts`（編集） | chain 構成呼び出し + meta 版実行 + descriptor 受け渡し（変更行） | cookie header 組立・401/非 2xx/JSON 変換（無変更だが AU 系で被覆維持） |

### 7.2 変更ブロックの line / branch 実測予定値

| 対象ブロック | 関数 / 箇所 | line 予定 | branch 予定 | 充足テスト |
| --- | --- | --- | --- | --- |
| env field ループ | `parseAuthEnvFieldTolerant`（undefined スキップ / valid 採用 / 不正 drop） | 100% | 100%（3 経路 + 空入力） | EV-1〜EV-6 |
| warn 分岐 | `getAuthEnv`（droppedKeys 0 件 / >=1 件・binding 有無） | 100% | 100%（2×2） | EV-1 / EV-2 / EV-4 / EV-5 / EV-6 |
| chain 構成 | `resolveApiTransportChain` | 100% | 100%（isTest 短絡 / binding 有無 / internal 有無 / public の environment 判定・重複排除 truthy・falsy / 明示 local / 候補 0 throw） | CH-1〜CH-6 |
| chain 実行 | `fetchViaApiTransportChainWithMeta` | 100% | 100%（成功即 return / 非 `ApiTransportError` 伝播 / 非冪等伝播 / 次候補あり warn / 全滅 rethrow / 空 chain 防御） | FB-1〜FB-6（+ 空 chain は契約違反ケースを 1 本追加可） |
| authed chain 化 | `fetchAuthed` の変更行（chain 構成 + meta 受領 + descriptor） | 100% | 100%（fallback あり / なし / 全滅） | AU-1〜AU-5 |

> 予定値は**変更ブロック 100%**。`resolveApiTransportChain` の `public` 候補判定は「staging で採用 / local で不採用 / 重複で縮約」の三方向を CH-1 / CH-4 / CH-6 で両側被覆する。`fetchViaApiTransportChainWithMeta` の「非 `ApiTransportError` throw は即伝播」分岐は FB 系に 1 ケース追加（path 形式違反等の素 `Error`）で到達させる。

### 7.3 coverage-guard 整合

- `bash scripts/coverage-guard.sh --changed` は変更行被覆を判定する。本サイクルの ts 変更行（env.ts / transport.ts / authed.ts）はすべて 7.2 の対象ブロックに含まれ Phase 6 のテストで到達するため、changed-line coverage は閾値を割り込まない。
- T01 の merge commit は CLAUDE.md の sync-merge ポリシーどおり coverage-guard（merge commit を含む push の `--changed` モード）を自動スキップする対象。T02/T03 の feature commit には通常どおり適用される。
- T04（shell）と spec ファイル自体は coverage 計測対象外。

### 7.4 カバレッジ計測コマンド（限定実行・実測方針）

```bash
# apps/web package 内から focused + --coverage（SSOT §8 形式）
cd apps/web
mise exec -- pnpm exec vitest run --coverage --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/__tests__/env.spec.ts \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts' \
  'apps/web/app/(member)/profile/page.spec.tsx'
cd ../..
```

計測後、coverage レポートで **`env.ts` / `transport.ts` / `authed.ts` の 3 ファイルのみ**を確認し、7.2 の予定値（変更ブロック line/branch 100%）と一致することを判定する。focused 実行のため他ファイルの % は参考値とし評価しない（広域一律judgしない）。未到達分岐が出た場合は Phase 6 のケース表へ 1 ケース追補して再計測する（実装変更で分岐を消す方向は契約変更になるため不可）。

## 完了条件

- [x] カバレッジ評価対象を T02/T03 の変更ブロック（env.ts / transport.ts / authed.ts の変更関数・変更行）に限定
- [x] 各変更ブロックの line / branch 予定値（100%）と充足テスト（EV / CH / FB / AU）を対応付け
- [x] public 候補判定・非 `ApiTransportError` 伝播などの境界分岐の両側被覆方針を明示
- [x] coverage-guard（changed-line / merge commit スキップ）との整合を明示
- [x] 限定スコープの計測コマンド（`--coverage` + SSOT §8 形式）を固定

## 成果物

- `outputs/phase-7/phase-7.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 分岐（被覆対象境界の根拠） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` 契約（変更対象外境界の確認） |

- `outputs/phase-6/phase-6.md`（ケース表 EV / CH / FB / AU / PG）
- `outputs/phase-5/phase-5.md`（変更ファイル俯瞰）
- `CLAUDE.md`（coverage-guard の sync-merge スキップポリシー）

## 統合テスト連携

7.2 の変更ブロック被覆を Phase 9 の品質保証（typecheck / lint / focused vitest 一括 / `bash -n` / grep ゲート）と同時に確認し、未到達分岐ゼロを Phase 10 の AC-2 / AC-3 / AC-4 / AC-8 充足判定へ引き継ぐ。
