# Phase 7: 整合性検証

## 目的

親 #515 SSOT / FU-03-A 着手 gate / FU-03-B dataset 契約との整合性を検証する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 整合性チェック項目

| 項目 | 確認対象 | 期待 |
| --- | --- | --- |
| C-1 | `Classifier` interface（親 #515） | 3 ML classifier がすべて準拠 |
| C-2 | `ThresholdClassifier`（親 #515） | comparison harness baseline / fallback 先として再利用 |
| C-3 | `extractFeatures` redacted output schema | training fixture / comparison input が同 schema |
| C-4 | `secret-leakage-grep.ts`（親 #515） | training output / comparison report 双方で exit 0 |
| C-5 | `CF_AUDIT_CLASSIFIER` env | 既定値 `threshold` 維持。新値 `isolation-forest` / `xgboost` / `workers-ai` を追加するが production には反映しない |
| C-6 | FU-03-A (#546) Gate-A/B/C | 着手前提。仕様策定は独立 |
| C-7 | FU-03-B redacted dataset schema | synthetic fixture が同 schema である（Phase 5） |
| C-8 | factory `getClassifier(env)` | switch 分岐の網羅。未知値は `threshold` fallback |
| C-9 | aiworkflow-requirements observability-monitoring | 親 #515 既存セクションに追記、衝突なし |
| C-10 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rollback runbook に「選定モデルの artifact 配置先」追記、衝突なし |

## 検証方法

- C-1〜C-3: TypeScript compile（`pnpm typecheck`）で interface 互換確認
- C-4: Phase 9 fixture（leakage-positive / leakage-clean）で grep test
- C-5: factory unit test の env 切替テーブル
- C-6: 仕様書テキスト上で「FU-03-A 完了が前提」を index.md / phase-01.md に明記
- C-7: fixture schema diff（FU-03-B 仕様書 phase-05 と本タスク phase-05 の比較）
- C-8: factory unit test の未知値ケース
- C-9 / C-10: SSOT 差分を Phase 12 で確認

## SSOT 同期予定（Phase 12 で実行）

| ファイル | 追記内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 選定モデル候補 3 種 / 選定基準 4 指標 / tie-breaker / production switch は別タスク |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | model artifact 配置先（R2 or workspace ローカル） / rollback 手順（`CF_AUDIT_CLASSIFIER=threshold` へ戻す） |

## 完了条件

- [ ] C-1〜C-10 の整合性確認結果を `phase-07.md` に記録
- [ ] 親 #515 SSOT 衝突がないことを確認
- [ ] FU-03-A / FU-03-B との接続点を明記

## 出力

- `phase-07.md`

## 参照資料

- `index.md`
- 親 #515 phase-07
- FU-03-A (#546) / FU-03-B 関連仕様書

## 統合テスト連携

- C-4 / C-5 / C-8 を Phase 9 test に反映

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 の成果物を上流契約として参照する。
