# Phase 3: 設計レビュー

> 前提: [phase-1.md](../phase-1/phase-1.md), [phase-2.md](../phase-2/phase-2.md)。Phase 4 へ進めるかを判定する。

## 3.1 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| **価値性** | PASS | 誰=開発者の「毎 staging deploy で bulk-tag job が他責で fail し CI が止まる」コストを 0 にする。B gate で再発を機械的に封じる |
| **実現性** | PASS | 既存 mint script に pure 関数 3 + wrapper 1 を追加、新規 gate script 1、workflow 1 新規 + 1 編集、provision 1 編集。1 サイクルで実装可能な厚み |
| **整合性** | PASS | role→env 契約を `ROLE_REQUIRED_ENV` の単一定数に集約し、mint script と gate が同一定数を共有。契約の二重定義なし。既存 pure 関数のシグネチャ不変で後方互換 |
| **運用性** | PASS | gate が PR/push で drift を継続検出。degrade は staging 過渡期の安全網。production は hard-fail 維持で安全性低下なし |

## 3.2 リスクと緩和

| リスク | 影響 | 緩和 |
|--------|------|------|
| YAML 静的解析の脆さ（js-yaml 不在時の正規表現抽出） | gate の誤検出/見逃し | Phase 5 で依存有無を確認し js-yaml 優先。pure 関数 `detectContractViolations` を descriptor 入力で網羅テスト（Phase 6） |
| degrade が production に誤適用 | 本番 smoke が静かに skip | AC-11 で production workflow に `RUNTIME_SMOKE_MINT_DEGRADE` を設定しないことを差分確認。gate で production workflow を解析対象に含め degrade=true を error 扱いにする案も Phase 6 で検討 |
| `--roles` と `MINT_ROLES` の二系統 | 解釈の曖昧さ | CLI 優先の明確な優先順位を `parseRoles` テストで固定（Phase 4） |
| 既存 `smoke` job の無改修が gate の「明示性」要求と衝突 | gate が既定 admin,me step を fail 判定 | 既定（roles 無指定）= admin,me として gate も同じ既定で算出。明示 `--roles admin,me` 付与は任意（Phase 5 決定） |
| provision の 1Password item 未実在 | provision 実行時 fail | 仕様書は参照キーのみ。実 item 整備は user 前提（Phase 13 runbook に明記） |

## 3.3 スコープ妥当性（CONST_007）

- A+B+C+D はすべて今回サイクルで完了。先送り項目なし。
- 未タスク化候補（Phase 12 で再確認）: required status check への gate 登録は CLAUDE.md 上 user 明示承認必須のため、Phase 13 で user-gated 提案として扱う（先送りではなく gating）。

## 3.4 命名・契約レビュー（FB-04 クラス名衝突検査相当）

| 新規識別子 | 既存衝突確認 | 判定 |
|------------|--------------|------|
| `parseRoles` / `requiredEnvForRoles` / `findMissingEnv` | mint script 内に同名なし | OK |
| `mintStagingBearersForRoles` | 既存 `mintStagingBearers` と prefix 共有・suffix `ForRoles` で区別 | OK（FB-04 準拠） |
| `MintRole` / `MintStepDescriptor` / `ContractViolation` | shared / smoke に同名なし | OK |
| `verify-mint-env-contract`（gate 名） | 既存 `verify-*.yml` と非衝突 | OK |
| env `MINT_ROLES` / `RUNTIME_SMOKE_MINT_DEGRADE` | 既存 env と非衝突（`MINT_TTL_SECONDS` / `RUNTIME_SMOKE_FRESHNESS_ENFORCE` と同系統命名） | OK |

## 3.5 Phase 4 進行判定

**判定: PASS（Phase 4 へ進行可）**

- 設計は実装可能な粒度に到達。pure 関数シグネチャ・main フロー・gate アルゴリズム・workflow 差分・provision 差分・degrade 条件をすべて確定済み。
- 残る不確定（js-yaml 依存有無）は Phase 5 着手時の事前チェックで解決可能で、設計の骨格を揺るがさない。

## 3.6 完了条件（Phase 3）

- [x] 4 条件評価（全 PASS）
- [x] リスク・緩和の列挙
- [x] スコープ妥当性（CONST_007）確認
- [x] 命名衝突検査
- [x] Phase 4 進行判定 = PASS
