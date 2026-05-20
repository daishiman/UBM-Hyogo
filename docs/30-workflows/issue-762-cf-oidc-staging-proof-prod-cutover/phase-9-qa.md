# Phase 9: 品質保証

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> 実装区分: **条件付き実装仕様書** (CONST_005 / CONST_007)

---

## 1. 4-Quality Check

| 観点 | 検証内容 | 検証方法 | 期待結果 |
|---|---|---|---|
| CONST_005 必須項目チェック | 変更ファイル一覧 / シグネチャ / 入出力 / テスト方針 / 検証コマンド / DoD の 6 項目が Phase 1-8 に揃っている | Phase 3 §4 + 本 phase §3 で再確認 | 全項目記載済み |
| CONST_007 1サイクル完了確認 | in-scope 5 件 + Phase 1-13 成果物が 1 PR で完了可能 / out-of-scope に「分量」「念のため」を使っていない | `index.md` §1 / §7 と本 phase §4 | PASS |
| 既存 CI gate 影響 | 既存 required status check に regression を起こさない | 本 phase §2 | 全 gate green 維持 |
| セキュリティ surface 検証 | 新規 script / workflow に secret leak / privilege escalation がない | 本 phase §5 | リスクなし |

## 2. 既存 CI gate への影響

| gate | 影響 | 検証 |
|---|---|---|
| `verify-indexes-up-to-date` | なし | 本サイクルは `.claude/skills/aiworkflow-requirements/indexes/` を変更しない（reference doc 編集のみ。index 再生成が必要なら `pnpm indexes:rebuild` を実装 phase で実行し commit） |
| `verify-gate-metadata` | なし | workflow gate metadata schema を変更しない |
| `verify-test-suffix` | なし | TypeScript test ファイル追加なし（shell spec のみ） |
| `verify-design-tokens` | なし | UI / CSS 変更なし |
| `actionlint` | 追加 1 ファイル（`oidc-observation-window.yml`）+ 編集 1 ファイル（`web-cd.yml`） | 両ファイルとも警告 0 件を確認 |
| `shellcheck`（lefthook） | 追加 1 ファイル + 編集 1 ファイル | 警告 0 件を確認 |
| `pnpm typecheck` | なし | TypeScript 変更なし |
| `pnpm lint` | なし（markdown lint は通過） | reference doc 編集のみ |
| `coverage-guard` | なし | TypeScript / TSX 変更なし |
| `audit-correlation-verify`（task-15） | なし | audit pipeline 変更なし |

## 3. CONST_005 必須項目カバレッジ再確認

| 項目 | Phase 反映先 |
|---|---|
| 変更対象ファイル一覧（パス）と変更種別 | Phase 1 §7 / Phase 2 §2 / index.md §4 |
| 主要な関数・型・スクリプトのシグネチャ / 構造 | Phase 1 §8 / Phase 2 §2.1-2.5 / Phase 8 §4-5 |
| 入力・出力・副作用の定義 | Phase 1 §9 / Phase 2 §2 |
| テスト方針（追加テストファイル・ケース） | Phase 1 §10 / Phase 4（テスト計画）/ Phase 7 §2 |
| ローカル実行・検証コマンド | Phase 1 §11 / 本 phase §6 |
| 完了条件（DoD） | Phase 1 §12 / 各 Phase 末尾 DoD |

## 4. CONST_007 スコープ判定確認

- 本サイクル in-scope（周辺強化 5 件 + Phase 1-13 成果物）は 1 PR で完了可能。
- out-of-scope（実 `id-token: write` 切替 / 実 OIDC exchange step / 実 staging proof / 実 production cutover / legacy token 物理失効）の分離理由は「公式 support 未確認」「rollback path 温存必須」「observation 期間必要」の技術的整合性破綻条件であり、分量・複雑さ・念のためを理由にしていない。
- 後続サイクルへの引継条件（公式 support 確認 → G1 → G2 → G3 → G4）は `deployment-secrets-management.md` と `outputs/phase-12/unassigned-task-detection.md` に明文化。

## 5. セキュリティチェックリスト

| 観点 | 評価 | 根拠 |
|---|---|---|
| `set -euo pipefail` | PASS | `verify-claim-pin.sh` 冒頭で適用。`redaction-check.sh` は既存通り |
| 機密値の env var 経由扱い禁止 | PASS | `verify-claim-pin.sh` は CLI 引数のみ受領（claim 期待値は public な repo / ref / environment / event_name）。OIDC token 値・JWT 実値は受領しない |
| log への secret 流出防止 | PASS | `redaction-check.sh` 拡張で JWT / `cloudflare-aud` を検出。`verify-claim-pin.sh` の mismatch 出力に token 値が混入しない |
| `permissions: id-token: write` 付与禁止 | PASS | `oidc-observation-window.yml` / `web-cd.yml` ともに `contents: read` のみ |
| 外部 API 呼び出し禁止（本サイクル） | PASS | `verify-claim-pin.sh` は read-only / 外部呼び出しなし。observation workflow は `echo` のみ |
| OIDC token / JWT 実値の成果物残留禁止 | PASS | Phase 11 evidence は一次情報 URL + 取得タイムスタンプ + spec / lint 実行結果のみ |
| Cloudflare Account ID の成果物残留禁止 | PASS | 既存 `redaction-check.sh` で gate 化。本サイクル成果物に実値を載せない |
| trust boundary 拡大の禁止 | PASS | 新規 credential path を追加しない。step-scoped `secrets.CLOUDFLARE_API_TOKEN` を維持 |
| privilege escalation 防止 | PASS | `id-token: write` 未付与のため GitHub OIDC permission の拡散なし |
| rollback path 温存 | PASS | legacy `CLOUDFLARE_API_TOKEN` 経路を温存。物理失効は `docs/30-workflows/issue-718-legacy-cf-token-revocation` 所有のまま |
| concurrency 制御 | PASS | `oidc-observation-window.yml` に `concurrency.group` 設定（同一 label の同時実行抑止） |

## 6. ローカル検証コマンド一覧（再掲 + 拡張）

```bash
# shell spec
bash scripts/oidc/__tests__/verify-claim-pin.spec.sh
bash scripts/__tests__/redaction-check.spec.sh

# 静的解析
shellcheck scripts/oidc/verify-claim-pin.sh scripts/redaction-check.sh
actionlint .github/workflows/oidc-observation-window.yml .github/workflows/web-cd.yml

# 既存 CI gate
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# index 再生成（reference doc 編集後に必要なら）
mise exec -- pnpm indexes:rebuild

# secret leak 検出（成果物 dir に対する自己検査）
bash scripts/redaction-check.sh --log docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/outputs/phase-11/cloudflare-oidc-support-revalidation-2026-05-17.md
```

## 7. DoD

- [ ] 既存 required status check（`verify-indexes-up-to-date` / `verify-gate-metadata` / `verify-test-suffix` / `verify-design-tokens` / `actionlint` / `shellcheck` / `pnpm typecheck` / `pnpm lint`）全 green
- [ ] §5 セキュリティチェックリスト全項目 PASS
- [ ] CONST_005 必須項目 6 件すべて Phase 1-8 に反映済み
- [ ] CONST_007 out-of-scope 分離理由が技術的整合性破綻条件で正当化されている
- [ ] OIDC token / JWT 実値 / Account ID 実値が成果物・log・コミットに含まれない
- [ ] missing runtime OIDC deploy log を PASS 根拠にしていない
