# Phase 3: 設計レビュー — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 状態 | completed |
| 作成日 | 2026-04-26 |

## レビューチェックリスト（4条件）

| 観点 | レビュー問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | この task は誰の迷いを減らすか | PASS | apps/web と apps/api の境界・バージョンが明確になり、実装者の判断コストを削減 |
| 実現性 | 初回無料運用で成立するか | PASS | Workers 無料枠 3MB 制限 + pnpm 10.x + Next.js 16.x の組み合わせで成立。バンドルサイズは Phase 5 で確認 |
| 整合性 | branch / env / runtime / data / secret が一致するか | PASS | feature→dev→main, @opennextjs/cloudflare 採用, AUTH_* 環境変数が一致することを確認 |
| 運用性 | rollback / handoff / same-wave sync が可能か | PASS | foundation-bootstrap-runbook.md に rollback 手順を記録し、03/04/05b への handoff を明記 |

## 代替案と不採用理由

| 代替案 | 不採用理由 |
| --- | --- |
| @cloudflare/next-on-pages を継続採用 | 廃止予定（Deprecated）のため不採用。@opennextjs/cloudflare を採用 |
| apps/web と apps/api を OpenNext 単一構成で一体化（Hono 廃止・Next.js Route Handlers に統合） | API 独立性・テスタビリティ・スケーラビリティの観点から分離を維持 |
| pnpm 9.x を継続使用 | pnpm 9 は 2026-04-30 に EOL のため pnpm 10.x へ移行必須 |
| TypeScript 5.7.x を継続使用 | TypeScript 6.x に移行し、strict モードの強化を図る。v7.0 はベータのため非推奨 |

## PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 内容 |
| --- | --- | --- |
| apps/web と apps/api の分離設計 | PASS | runtime-topology.md で境界明確化 |
| version policy | PASS | version-policy.md を唯一の ledger として確立 |
| TypeScript バージョン（5.7.x → 6.x） | MINOR | Phase 12 Step 2 で正本仕様と同期 |
| Workers バンドルサイズ (3MB) | MINOR | Phase 5 で確認手順を記録 |
| Auth.js v5 の既知バグ | MINOR | JWT 暗号化・OAuth 周りに注意。Phase 9/12 で記録 |

## MINOR 追跡表

| ID | 内容 | 対応 Phase |
| --- | --- | --- |
| M-01 | TypeScript バージョン（5.7.x → 6.x）の正本仕様同期 | 12 |
| M-02 | @opennextjs/cloudflare 採用の正本仕様への明示記録 | 12 |
| M-03 | Workers バンドルサイズ (3MB) 超過時の Page Functions fallback の詳細設計 | Phase 12 以降の別タスク |
| M-04 | Auth.js v5 JWT 暗号化の既知バグ対応 | Phase 9/12 で注意喚起を記録 |
| M-05 | apps/web/wrangler.toml の @opennextjs/cloudflare 向け設定更新 | Phase 12 で解消済み |

## Phase 3 → Phase 4 handoff

| 引き継ぎ事項 | 内容 |
| --- | --- |
| 設計成果物 | outputs/phase-02/runtime-topology.md, outputs/phase-02/version-policy.md |
| MINOR 追跡表 | M-01〜M-05（Phase 9/12 で継続追跡） |
| 正本仕様同期ゲート | TypeScript 6.x 同期は Phase 12 Step 2 で必須 |
| 検証手順 | Phase 4 では Phase 5 の事前確認手順を準備する |

## 完了条件チェック

- [x] 主成果物が作成済み
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
