# Phase 1: 要件定義

## 真の論点

1. **mock smoke では検出できない領域は何か** — 06a Phase 11 では `apps/api` を **local mock** で代替し、`apps/web` の curl / screenshot smoke のみ完了している。実 Workers runtime / D1 binding / wrangler 設定 / `PUBLIC_API_BASE_URL` 経路は未検証であり、これは production 直前で初めて顕在化する高リスク領域。本タスクの主目的は「実 binding 経由の smoke を local + staging の 2 段で実施する」こと。
2. **esbuild Host/Binary version mismatch を恒久対応するか、ワークアラウンドで済ますか** — `pnpm --filter @ubm-hyogo/api dev` 直叩きは `Cannot start service: Host version "0.27.3" does not match binary version "0.21.5"` で失敗する。CLAUDE.md は `scripts/cf.sh` ラッパー経由を必須と定めており（`ESBUILD_BINARY_PATH` 自動解決）、本タスクでは **`scripts/cf.sh` 経由を唯一の起動経路として採用** する。
3. **mock vs 実 D1 の判別をどう evidence 化するか** — 単純な `200` だけでは mock でも green になる。API 側 `GET /public/members` の `items.length >= 1` と、その ID を使った web `/members/{seeded-id}` の `200` を主証跡にして「実 binding 経由」を担保する。`/members/UNKNOWN` の `404` は異常系確認であり、実 D1 経由の主証跡にはしない。
4. **staging で `PUBLIC_API_BASE_URL` 未設定リスク** — 未設定だと `apps/web` が `localhost:8787` に向き、production / staging で全リクエストが失敗する。この経路を smoke gate に含める。

## AC 確定

index.md で定義した AC-1〜7 を本 phase で正式採択する。各 AC は検証手段付き断定形であることを再確認:

- AC-1: 起動成功（`scripts/cf.sh` 経由 `Listening on http://127.0.0.1:8787`）
- AC-2: 4 route family / 5 smoke cases curl で期待 status code 観測
- AC-3: 実 D1 経路の証拠（seed データ or 404 応答）
- AC-4: staging 4 route family / 5 smoke cases 同 status
- AC-5: staging `PUBLIC_API_BASE_URL` 設定確認
- AC-6: evidence 追記
- AC-7: 不変条件 #5 を import 検査で再確認

## 不変条件 trace

| # | 内容 | 本タスクでの扱い |
| --- | --- | --- |
| #5 (中心) | D1 直接アクセスは `apps/api` に閉じる | smoke 経路 `apps/web → apps/api → D1` をそのまま実行することで経路自体を検証。`apps/web` 配下に D1 直接 import が無いことを AC-7 で再確認 |
| #1 | 実フォーム schema をコードに固定しすぎない | `/members` レスポンスが extraFields 経路を保ったまま 200 を返すことで間接的に確認 |
| #6 | GAS prototype を本番に昇格させない | smoke 対象は `apps/api` 実体のみ、GAS endpoint は触らない |

## artifacts.json metadata 確定

- `metadata.taskType = "implementation"`（smoke 実施を伴うため docs_only ではない）
- `metadata.docs_only = false`
- `metadata.visualEvidence = "NON_VISUAL"`（curl ログ主体、screenshot は staging 補助 1 枚のみ）
- `metadata.workflow_state = "spec_created"`（spec 段階）
- `metadata.evidence_type = "curl_logs_with_aux_screenshot"`
- 全 phases[].status は `pending`

## スコープ最終確認

- 含む: local smoke / staging smoke / evidence 追記 / esbuild 恒久対策手順化
- 含まない: UI 機能追加 / API contract 変更 / 新規 migration / Playwright E2E

## 次フェーズへの引き継ぎ事項

Phase 2 では (a) `scripts/cf.sh` 経由の起動コマンド列、(b) D1 binding が `apps/web → apps/api → D1` を辿る mermaid、(c) local / staging 双方の curl コマンド列を設計する。

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 1
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 目的

Phase 1 の責務を、real Workers + D1 smoke 仕様の AC と不変条件に接続して明確化する。

## 実行タスク

- AC-1〜AC-7 と不変条件 trace を確定する
- artifacts.json metadata の taskType / visualEvidence / workflow_state を確認する

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-01/main.md`

## 完了条件

- [ ] Phase 1 の成果物が存在する
- [ ] AC / evidence / dependency trace に矛盾がない

## 統合テスト連携

- Phase 11 の local / staging curl smoke と AC trace に接続する。
- UI regression ではなく NON_VISUAL の HTTP / D1 binding evidence を正本にする。
