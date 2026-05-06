# Phase 3 本文 — 設計レビュー

## 0. レビュー対象

- `outputs/phase-01/main.md`（要件定義）
- `outputs/phase-02/main.md`（設計）

## 1. 判定サマリ

| 項目 | 判定 |
| --- | --- |
| Phase 4（実装計画）への進行 | **GO** |
| 重大な設計欠陥 | なし |
| 未確定事項 | 仮説 A/B/C のうち真因が未確定（Phase 5 検証で確定する設計） |
| approval gate | production D1 への変更は Phase 11 で別途承認必要 |

## 2. MINOR チェックリスト

- [x] AC が evidence path とペアで列挙されている
- [x] scope in / out が分離されている
- [x] 不変条件（CLAUDE.md 由来）への参照がある
- [x] ローカル実行コマンドが具体的（pnpm filter / cf.sh ラッパー）
- [x] 関数シグネチャが既存維持と明記
- [x] DoD が AC と独立に記述
- [x] テスト方針が vitest ケース 4 件まで具体化

## 3. MAJOR チェックリスト

- [x] **API 仕様変更禁止**: `FormPreviewResponse` 不変、`get-form-preview.ts` の throw 仕様維持を明示
- [x] **D1 直アクセス境界**: 修正対象から `apps/web` 除外、`apps/api` 内に閉じる
- [x] **schema 集約**: `schema_versions` × `schema_questions` の二段構造を維持
- [x] **シークレット管理**: `wrangler` 直叩き禁止、`scripts/cf.sh` 経由を全コマンドに適用
- [x] **本番影響の隔離**: production への apply は AC-2 達成のための最小範囲、approval gate 設定済み
- [x] **再発防止**: vitest 追加ケースで env fallback と空 schema 境界を回帰テストに固定

## 4. 想定差分の規模

| 仮説 | 想定 LOC | 影響範囲 |
| --- | --- | --- |
| A | 0 LOC（コード）+ SQL 数十行 | staging D1 のみ |
| B | 1〜3 LOC（`wrangler.toml` env） | staging Worker config |
| C | 1 行（`wrangler.toml` database_id） | staging Worker config |
| 共通 | テスト追加 +30〜60 LOC | `__tests__/get-form-preview.test.ts` |

すべて **MINOR** 規模に収まる見込み。MAJOR（破壊的変更・API 互換崩壊）に該当する変更は本タスクに含まない。

## 5. レビュー指摘 / 改善提案

1. **指摘 1**: 仮説 A 修正時に production export → staging import を行うが、`schema_questions` の id 衝突可能性。 → 対策: import 前に staging の該当 formId 行を `DELETE` する事前ステップを Phase 5 runbook に明記すること。
2. **指摘 2**: 仮説 C が真因だった場合、wrangler.toml 修正 → deploy までの dry-run を `bash scripts/cf.sh deploy --dry-run` 相当で先行する手順を Phase 5 に追加すること（cf.sh が dry-run をサポートしない場合は wrangler の `--dry-run` 経路を確認）。
3. **指摘 3**: AC-3（`/register` 200）は web 側 host 名が phase-01 では `<web-staging-host>` プレースホルダ。Phase 5 で実 host を確定し evidence path に反映すること。

これら 3 件は **Phase 5 設計詳細化で吸収可能**であり、Phase 4 進行をブロックしない。

## 6. 次 Phase への引き渡し

Phase 4（実装計画）へ:

- 検証順序 A → C → B を遵守。
- 上記レビュー指摘 3 件を Phase 5 runbook に取り込む TODO として持ち越す。
- DoD の 8 項目をそのままタスク分解の基準として使う。
