# Phase 3: アーキテクチャ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |
| 依存 Phase | Phase 1, 2 |

## 目的

4 lane 並列実装に進む前に、PASS / MINOR / MAJOR の戻り先と Phase 4 開始条件 / Phase 13 blocked 条件を固定する。lane 間の同名インターフェース型ドリフト・mock 型互換性・migrations 対応の整合を最終確認する。

## PASS / MINOR / MAJOR 判定

| 判定 | 条件 | 戻り先 |
| --- | --- | --- |
| PASS | Phase 1 baseline + Phase 2 lane 分割で全 AC が達成可能と確認 | Phase 4 へ進む |
| MINOR | 個別ファイル除外で 80% 達成可能 / fixture 不足のみ / migrations 名 1-2 件の特定遅れ | Phase 4 並行で fixture 補強・MINOR 追跡テーブルへ記録 |
| MAJOR | D1 binding が Miniflare で取得不能 / Mock provider と既存 repository interface の型ドリフト / Task B 完了後も failure 残存 | Phase 2 へ戻り 5 lane の戦略再設計 / 最悪は scope 縮退（Issue #320 系 4 本のみに絞る） |

## MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 備考 |
| --- | --- | --- | --- | --- |
| TECH-M-01 | 特定 repository の D1 binding fake 互換が `D1Database` 型と乖離 | Phase 5 | Phase 9 | int-test-skill ガイド準拠 |
| TECH-M-02 | route lane で外部 API mock が `vi.mock` factory 戻り型と乖離 | Phase 5 | Phase 8 | hoisting 制約に注意 |
| TECH-M-03 | use-case port 化が repository 直叩きで止まる | Phase 6 | Phase 7 | CONST_007 範囲内で対応可なら実施 |

## 同名インターフェース型ドリフト検出

repository lane / use-case lane で同名 interface（例: `MembersRepository`、`MagicTokensRepository`）が複数箇所定義されている場合、Phase 3 で次を確認する。

```bash
grep -rn "interface MembersRepository\|type MembersRepository" apps/api/src
grep -rn "interface MagicTokensRepository\|type MagicTokensRepository" apps/api/src
```

- 多重定義が発見された場合は MAJOR 判定とし Phase 2 へ戻し、`apps/api/src/repository/_shared/` への統合を検討する
- 統合不可なら MINOR で記録し、本タスク内の fixture/exclude/readiness gate で閉じる

## Phase 4 開始条件

- [ ] Phase 1 完了（baseline + lane 分類確定）
- [ ] Phase 2 完了（4 lane + dependency matrix + validation matrix 確定）
- [ ] Task B 完了確認（PR merged）
- [ ] D1 binding が Miniflare 経由で取得可能であることを smoke check 済み

## Phase 13 blocked 条件

- coverage が一度でも 80% を下回る評価に戻る
- 既存 test の regression 1 件以上残存
- Mock provider 改変で repository 契約破壊
- Issue #320 系 4 本のいずれかが個別 ≥80% に到達しない
- main 取り込み後の CI run が赤

## 上流文書整合チェック

- 親 wave Phase 3 と本タスク配置先は `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-d-apps-api-coverage-80/` に統一済み。

## 完了条件

- [ ] PASS / MINOR / MAJOR 判定基準が明文化
- [ ] MINOR 追跡テーブル 3 件以上記載
- [ ] 同名 interface 検出コマンド実行
- [ ] Phase 4 開始条件 4 項目チェック
- [ ] Phase 13 blocked 条件 5 項目チェック

## 次 Phase

Phase 4（テスト設計）。GO 判定後のみ進行。
