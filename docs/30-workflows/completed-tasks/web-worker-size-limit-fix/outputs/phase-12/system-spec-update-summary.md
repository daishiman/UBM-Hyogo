# Phase 12: システム仕様更新サマリ

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
|------|-----|
| task_id | `web-worker-size-limit-fix` |
| 反映対象 1 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` |
| 反映対象 2 | `docs/00-getting-started-manual/specs/08-free-database.md` |

## 目的

Worker bundle size 超過の解消知見（next/og 撤去 + minify + CI サイズ gate）を正本仕様へ反映する方針を定義する。

## Step1-A: deployment-cloudflare-opennext-workers.md（追記方針）

- **Worker bundle size ガード節へ追記**: 「Cloudflare 無料プランの Worker サイズ上限は gzip 後 3072KiB（3MiB）。超過時は `[code: 10027]` で deploy 失敗する」を明記。
- **next/og の重量焼き込み警告を追記**: `next/og`（@vercel/og）は `resvg.wasm`（1346KB）+ `yoga.wasm`（70KB）+ Geist フォント（123KB）≒ 1539KB を bundle に焼き込むため、無料プランでは動的 OG を避け静的 PNG を推奨する旨を追記。
- **production minify 維持 + CI サイズ gate の運用知見を追記**: OpenNext v1.19.4 に `minify` config key がないため無効な設定を追加せず、`OPEN_NEXT_DEBUG` / `debug:true` 禁止 guard と `scripts/check-worker-size.sh`（gzip 計測 / 閾値 3072KiB / warn 2800KiB / 超過 exit 1）を deploy 前段 gate として両 deploy job に挿入する運用を追記。

## Step1-B: 08-free-database.md（追記方針）

- 既存の無料プラン制約節に **Worker サイズ上限（gzip 3MiB）** の項目を追記し、本 workflow の閾値 gate を参照リンクする（no-op で良ければ参照追記のみ）。

## Step1-C: 反映タイミング

- 上記反映は実装サイクル（Gate-B）と同 wave で skill 同期エージェントが実施する。implemented_local_evidence_captured 時点では方針記述のみ（no-op）。

## 多角的チェック観点（AIが判断）

- 追記が既存節と重複しないこと。
- 閾値（3072KiB / 2800KiB warn）が script・spec・ドキュメントで一貫すること。

## 成果物

- 上記 2 ファイルへの追記方針（実装時に反映）

## 完了条件

- [ ] 反映方針が 2 正本ファイルについて記述されている
- [ ] 閾値の一貫性が担保されている

## タスク100%実行確認【必須】

- [ ] Step1-A/B/C 相当の反映方針を全て記述した
