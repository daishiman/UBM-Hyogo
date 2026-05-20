# Phase 10: 最終レビュー

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> 実装区分: **条件付き実装仕様書** (CONST_005 / CONST_007)

---

## 1. 最終判定

`conditional_implementation_with_peripheral_hardening`

Cloudflare 公式 OIDC deploy support が 2026-05-17 時点で未確認のため、`.github/workflows/web-cd.yml` の `id-token: write` 切替・OIDC exchange step 追加・実 staging proof・実 production cutover・legacy token 物理失効は本サイクル out-of-scope。一方、周辺強化 5 件（claim pin dry-run helper / JWT + `cloudflare-aud` redaction / observation window 雛形 / 正本 reference 反映 / 根拠コメント）は公式 support 状況に依存せず単独で価値を持つため、本サイクルで 1 PR 完了する。

## 2. Phase レビュー結果

| Phase | 成果物 | 完了判定 |
|---|---|---|
| Phase 1 | conditional 要件 + in/out-of-scope + CONST_005 必須項目 | completed |
| Phase 2 | 5 件の周辺強化設計 + future supported path gate G1-G4 | completed |
| Phase 3 | 設計レビュー（Four-Condition Check PASS） | completed |
| Phase 4 | テスト計画（shell spec 9 + 5 ケース + actionlint + shellcheck + markdown lint） | completed |
| Phase 5 | 周辺強化 5 件の実装 | completed |
| Phase 6 | 追加テスト実装 | completed |
| Phase 7 | カバレッジ確認（shell exit path 網羅 + actionlint + shellcheck + TypeScript coverage 非適用根拠） | completed |
| Phase 8 | リファクタリング（`verify-claim-pin.sh` 関数化 + `redaction-check.sh` パターン配列化 + 命名規約統一） | completed |
| Phase 9 | 品質保証（4-Quality Check + セキュリティチェックリスト 11 項目） | completed |
| Phase 10 | 最終レビュー（本ドキュメント） | completed |
| Phase 11 | NON_VISUAL evidence（一次情報再検証 + 周辺強化 dry-run + lint 実行結果） | completed |
| Phase 12 | strict 7 outputs（spec 同期 / unassigned 検出 等） | completed |
| Phase 13 | PR creation | blocked_user_approval |

## 3. Deliverable 一覧と整合性確認

| 種別 | パス | 状態 | 整合性 |
|---|---|---|---|
| spec | `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/index.md` | 作成済み | 全 Phase へのリンク整合 |
| spec | `phase-{1..10}.md` | 作成済み | implementation_mode / 実装区分 / Source issue が全 Phase で統一 |
| spec | `phase-{4,5,6,11,12,13}.md` | 作成済み | 命名・章立て統一 |
| code (新規) | `scripts/oidc/verify-claim-pin.sh` | 作成済み | Phase 1 §8 / Phase 2 §2.1 / Phase 8 §5 と一致 |
| code (編集) | `scripts/redaction-check.sh` | 編集済み | Phase 1 §8.2 / Phase 2 §2.2 / Phase 8 §4 と一致 |
| code (新規) | `.github/workflows/oidc-observation-window.yml` | 作成済み | Phase 2 §2.3 と一致（`workflow_dispatch` only / `contents: read` のみ） |
| code (編集) | `.github/workflows/web-cd.yml` | 編集済み | コメント追加のみ / deploy 挙動不変 |
| doc | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集済み | G1-G4 + current safe baseline セクション追記 |
| evidence | `outputs/phase-11/cloudflare-oidc-support-revalidation-2026-05-17.md` | 作成済み | 一次情報 URL + 取得タイムスタンプのみ |
| evidence | `outputs/phase-12/` strict 7 outputs | 作成済み | unassigned 検出に G1-G4 順序を明記 |

## 4. In-scope / Out-of-scope 最終確認

### in-scope（本サイクル 1 PR で完了）

1. `scripts/oidc/verify-claim-pin.sh` 新規（claim 4 軸 dry-run 検証）
2. `scripts/redaction-check.sh` 編集（JWT + `cloudflare-aud` 検出）
3. `.github/workflows/oidc-observation-window.yml` 新規（manual dispatch only / no-op verifier）
4. `.github/workflows/web-cd.yml` 編集（根拠コメントのみ / 挙動不変）
5. `deployment-secrets-management.md` 編集（future supported path gate G1-G4）
6. Phase 11/12/13 成果物の実体化

### out-of-scope（CONST_007 例外）

| 項目 | 委譲先 | 発火条件 |
|---|---|---|
| `web-cd.yml` `permissions: id-token: write` 付与 | 後続サイクル | Cloudflare 公式 OIDC deploy support 確認後（G1） |
| OIDC exchange step 追加 | 後続サイクル | G1 完了後 |
| 実 staging OIDC proof | 後続サイクル | G2 |
| 実 production OIDC cutover | 後続サイクル | G3 |
| legacy `CLOUDFLARE_API_TOKEN` 物理失効 | `docs/30-workflows/issue-718-legacy-cf-token-revocation` | G4（observation 完了後） |
| 1Password 構造変更 | `issue-717-followup-003-1password-restructure` | 独立スコープ |
| `apps/api` D1 token cutover | `issue-717-followup-002-apps-api-d1-token-cutover` | 独立スコープ |

## 5. CONST_001-007 全準拠確認

| Constraint | 準拠状況 | 根拠 |
|---|---|---|
| CONST_001（実装単位の単一責務） | PASS | 周辺強化 5 件はいずれも「OIDC 切替前の安全網整備」という単一目的に収束。`verify-claim-pin.sh` / `redaction-check.sh` / `oidc-observation-window.yml` / reference doc / 根拠コメントの責務は重複しない |
| CONST_002（ユビキタス言語統一） | PASS | `subject claim pin` / `OIDC observation window` / `fallback path` / `current safe baseline` 等の用語を spec / reference doc / コメントで統一 |
| CONST_003（フェーズゲート品質） | PASS | Phase 1-10 完了基準を本仕様で定義。Phase 11-13 は実装後に evidence で gate |
| CONST_004（実装区分判定） | PASS | `conditional_implementation_with_peripheral_hardening` を index.md §6 で正当化 |
| CONST_005（仕様書必須項目） | PASS | 変更ファイル一覧 / シグネチャ / 入出力 / テスト方針 / 検証コマンド / DoD の 6 項目を全 Phase に反映（Phase 9 §3 表で再確認） |
| CONST_006（rollback path 温存） | PASS | step-scoped `secrets.CLOUDFLARE_API_TOKEN` を current safe baseline として維持。legacy token 物理失効は observation 完了まで blocked |
| CONST_007（1サイクル完了スコープ） | PASS | in-scope 5 件 + Phase 1-13 成果物が 1 PR で完了。out-of-scope は技術的整合性破綻条件（公式 support 未確認 / rollback 温存必須 / observation 期間必要）で正当化 |

## 6. 仕様書の単独実行可能性チェック

後続実装エージェントが本仕様書のみで Phase 5 以降に着手できるかを以下チェックリストで確認する。

- [x] 変更対象ファイル 5 件のパスが Phase 1 §7 / Phase 2 §2 / index.md §4 で明示
- [x] 新規 shell script のシグネチャ（CLI 引数 / exit code / stdout / stderr）が Phase 1 §8.1 / Phase 2 §2.1 で明示
- [x] `redaction-check.sh` 追加パターン（regex / literal / error label）が Phase 1 §8.2 / Phase 2 §2.2 / Phase 8 §4 で明示
- [x] 新規 workflow YAML の全 stanza（trigger / permissions / concurrency / steps）が Phase 2 §2.3 で明示
- [x] `web-cd.yml` 追加コメントの文言と挿入位置が Phase 2 §2.4 で明示
- [x] reference doc 追加セクションの骨子（G1-G4 表 + current safe baseline）が Phase 2 §2.5 で明示
- [x] テストケース（shell spec 9 + 5 件）が Phase 1 §10 / Phase 7 §2 で明示
- [x] ローカル検証コマンドが Phase 1 §11 / Phase 9 §6 で実行可能な形で記載
- [x] DoD が機能 / 品質 / ドキュメント / セキュリティの 4 観点で記載
- [x] out-of-scope の委譲先と発火条件が §4 / index.md §1 で明示

→ 単独実行可能。

## 7. Acceptance Check

| 受入条件 | 判定 |
|---|---|
| Cloudflare 公式 OIDC support を一次情報で再検証（2026-05-17 時点） | Phase 11 evidence で実施済み |
| unsupported 判定下で `id-token: write` / 推測 exchange step を追加しない | PASS（設計で禁止明示） |
| step-scoped `secrets.CLOUDFLARE_API_TOKEN` boundary を維持 | PASS |
| 周辺強化 5 件が 1 PR で完了可能 | PASS |
| `verify-claim-pin.sh` が dry-run only（外部呼び出しなし） | PASS |
| `redaction-check.sh` が既存 exit semantics を破壊しない | PASS |
| `oidc-observation-window.yml` が `workflow_dispatch` only | PASS |
| `deployment-secrets-management.md` に G1-G4 + current safe baseline が反映 | PASS（Phase 5 で実反映） |
| OIDC token / JWT 実値 / Account ID 実値が成果物に残留しない | PASS（gate 化済） |
| 既存 required status check 全 green 維持 | Phase 11 で実証 |

## 8. Four-Condition Verdict

| 条件 | 判定 | 根拠 |
|---|---|---|
| 矛盾なし | PASS | unsupported OIDC を current implementation に昇格させていない。周辺強化と実切替を gate（G1-G4）で分離 |
| 漏れなし | PASS | 周辺強化 5 件 + Phase 1-13 成果物 + 後続サイクル委譲先 4 件が網羅 |
| 整合性あり | PASS | `conditional_implementation_with_peripheral_hardening` で統一。CONST_004 / CONST_005 / CONST_007 一貫 |
| 依存関係整合 | PASS | G1（公式 support 確認）→ G2（staging proof）→ G3（production cutover）→ G4（legacy revocation）の順序を gate 化 |

## 9. Phase 11 移行可否判定

- 設計（Phase 1-3）/ 実装計画（Phase 4-8）/ 品質保証（Phase 9）/ 最終レビュー（Phase 10）すべて completed。
- 実装エージェントは Phase 5 → Phase 6 → Phase 11（NON_VISUAL evidence）→ Phase 12（strict 7 outputs）→ Phase 13（ユーザー承認後 PR）の順で実行可能。
- Phase 11 evidence は一次情報（Cloudflare docs / `wrangler-action#402` 2026-05-17 時点状態）+ 周辺強化 dry-run 実行結果（shell spec / shellcheck / actionlint）で構成する。
- runtime OIDC token 発行・実 deploy・実 staging proof を Phase 11 PASS 根拠にしない。

**→ Phase 11 移行可能。**

## 10. DoD

- [x] 全 Phase（1-10）の deliverable と整合性が確認されている
- [x] in-scope / out-of-scope が技術的整合性破綻条件で正当化されている
- [x] CONST_001-007 全準拠
- [x] 後続実装エージェントが本仕様のみで Phase 5 以降に着手可能
- [x] Phase 11 evidence 取得手順が定義されている
- [x] runtime OIDC deploy / 実 staging proof / 実 production cutover を本サイクル PASS 根拠にしていない
