# Phase 3: 設計レビュー

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> task classification: code task (shell script + workflow YAML + reference doc)
> visual classification: NON_VISUAL
> 実装区分: **条件付き実装仕様書** (CONST_005 必須項目すべて含む / CONST_007 1サイクル完了スコープ)

---

## 1. Review Summary

本設計は「Cloudflare 公式 OIDC deploy support 未確認」という外部ブロッカー下でも、周辺強化 5 件を 1 サイクルで安全に実装する設計として妥当。実 OIDC 切替（`id-token: write` 付与・exchange step 追加・実 staging proof・実 production cutover・legacy token 物理失効）を後続サイクル送りにする判断は、trust boundary 不明 / rollback path 不全 / observation 不能の 3 条件を満たしており、CONST_007 の正当な例外として処理可能。

## 2. Findings

| Finding | Result | 補足 |
|---|---|---|
| `.github/workflows/web-cd.yml` の deploy 挙動が不変であること | PASS | 編集はコメント追加のみ。`actionlint` で挙動差分なし |
| `permissions: id-token: write` を本サイクルで付与しないこと | PASS | 公式 support 未確認のため speculative 実装回避 |
| `scripts/oidc/verify-claim-pin.sh` が dry-run only であること | PASS | 外部 API / OIDC token 発行を一切行わない設計 |
| `scripts/redaction-check.sh` 拡張が既存 exit semantics を破壊しないこと | PASS | 既存 `LEAK_FOUND` フローに OR で合算する設計 |
| `.github/workflows/oidc-observation-window.yml` が `workflow_dispatch` only であること | PASS | `push` / `schedule` trigger を持たない |
| `deployment-secrets-management.md` に future supported path gate G1-G4 が反映されること | PASS | 後続実切替エージェントの正本参照先として機能 |
| step-scoped `secrets.CLOUDFLARE_API_TOKEN` 経路の rollback path 温存 | PASS | observation 完了まで legacy token を温存する条件と整合 |
| CONST_007 例外（実 OIDC 切替・実 proof・実 cutover・物理失効）の妥当性 | PASS | 外部ブロッカー（公式 support 未確認）+ rollback 温存必須 + observation 期間必要 の 3 条件で正当化 |
| subject claim pin 4 軸（`repository` / `ref` / `environment` / `event_name`）の確定 | PASS | 親 spec の DoD と一致 |
| Phase 11 evidence が一次情報（2026-05-17 時点 Cloudflare docs + `wrangler-action#402`）のみで構成されていること | PASS | runtime OIDC log は発生させない |

## 3. Reviewer Notes

- `verify-claim-pin.sh` の `EXPECTED_REPOSITORY` 固定値は repo 移管時に破綻するため、reference doc に「repo 移管時に script と reference doc を同時更新」と明記すること。Phase 12 の正本同期セクションに反映可能。
- JWT regex は `eyJ` プレフィックス + 2 つの `.` 区切りで限定しているため `pnpm-lock.yaml` integrity hash を誤検出しない。ただし `redaction-check.sh` 拡張のテスト fixture に「`pnpm-lock.yaml` 風 integrity hash 含む log → クリーン PASS」ケースを含めることを推奨。
- `.github/workflows/oidc-observation-window.yml` の no-op verifier は後続サイクルで実 verifier に差し替える前提のため、`actionlint` 例外（`shellcheck` 警告等）が出ないよう、`echo` のみの最小構成に留めること。
- `web-cd.yml` のコメント追加は 2 箇所（staging / production）で文言を完全一致させ、`grep -c "NOTE(issue-762)" .github/workflows/web-cd.yml` で 2 を期待する Phase 11 evidence を取得可能。
- 後続サイクルで `id-token: write` を付与する際は、`permissions:` ブロック全体を `contents: read` / `id-token: write` の 2 行構成に変更する必要がある。本サイクルのコメント追加が後続 diff の文脈として残る点を Phase 13 PR body にも記載すること。

## 4. CONST_005 必須項目カバレッジ確認

| 項目 | Phase 1 反映 | Phase 2 反映 |
|---|---|---|
| 変更対象ファイル一覧（パス）と変更種別 | §7 | §2 各サブセクション |
| 主要な関数・型・スクリプトのシグネチャ / 構造 | §8 | §2.1-2.5 |
| 入力・出力・副作用の定義 | §9 | §2.1-2.4 |
| テスト方針（追加テストファイル・ケース） | §10 | §2.2 互換性 + Phase 4 へ展開予定 |
| ローカル実行・検証コマンド | §11 | §2.1 / §2.2 |
| 完了条件（DoD: ビルド成功・テストパス・想定動作確認手順） | §12 | §4 Four-Condition Check |

→ Phase 1 / Phase 2 で CONST_005 必須項目をすべて充足。

## 5. CONST_007 スコープ判定確認

- 本サイクル in-scope（周辺強化 5 件 + Phase 1-13 全成果物）は 1 PR で完了可能。
- out-of-scope（実 OIDC 切替 / 実 staging proof / 実 production cutover / legacy token 物理失効）は「公式 support 未確認」「rollback 温存必須」「observation 期間必要」の技術的整合性破綻条件に該当し、CONST_007 例外として正当化される。
- 「分量が多い」「複雑」「念のため」を分離理由としていない。

## 6. 次フェーズ移行可否

- Phase 4（テスト計画）へ移行可能。`verify-claim-pin.sh` テスト 6 ケース、`redaction-check.sh` 拡張 4 ケース、`actionlint` 適用 2 ファイル、markdown lint 1 ファイルの計画を Phase 4 で具体化する。
