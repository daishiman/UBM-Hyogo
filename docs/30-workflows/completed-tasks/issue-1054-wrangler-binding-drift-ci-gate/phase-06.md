# Phase 6: 異常系・回帰テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | wrangler.toml binding ↔ env.ts ↔ 棚卸し表 三者ドリフト検出 CI gate (issue-1054-wrangler-binding-drift-ci-gate) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系・回帰テスト拡充（TC-E01〜TC-E05） |
| 作成日 | 2026-06-02 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC / カバレッジマトリクス) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1054（CLOSED のまま参照のみ） |

## 目的

Phase 4 の正常系 TC-01〜TC-10 に対し、gate が「誤 fail（valid な構成を drift 扱い）」「誤 pass（実 drift を見逃す）」しないことを担保する異常系・境界テスト TC-E01〜TC-E05 を設計する。Phase 2 D 方針（state 表記揺れは unknown→warn で誤 fail 回避）と Phase 3 MINOR R-3 をテストで固定する。

## 異常系・境界テストケース TC-E01〜TC-E05

| TC | 対象関数 | 異常系入力 | 期待挙動 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-E01 | `main` | 解析対象 3 ソースのいずれかが不在（ENOENT） | `readFileSync` 例外を握り潰さず、`[verify-wrangler-binding-drift]` 接頭辞で「source not found」を出力し非ゼロ exit。誤って exit 0（誤 pass）にしない | AC-7 |
| TC-E02 | `parseInventoryRows` / `reconcile` | 棚卸し表 state 列が未知語（`production/staging active in ...` 等の自由記述 / 既知 3 区分に正規化できない語） | `state:"unknown"` に正規化し、`reconcile` は unknown を **warn にとどめ FAIL させない**（誤 fail 回避・R-3） | AC-3 / AC-4 |
| TC-E03 | `parseWranglerBindings` | binding 行が無い（block ヘッダのみ / 空 TOML / binding キー欠落） | 当該 block を無視し空配列または該当 block 除外。例外を投げず、後続 `reconcile` を誤検出させない | AC-1 |
| TC-E04 | `parseWranglerBindings` | env-prefix 重複（同名 binding が `[[env.production.r2_buckets]]` と `[[env.staging.r2_buckets]]` の両方に出現し、片方のみコメントアウト） | `{name,kind}` で 1 エントリに集約し、`envs` を結合、`applied` は非コメント宣言が 1 つでもあれば true（OR）。重複で 2 エントリにしない | AC-1 / AC-5 |
| TC-E05 | `parseWranglerBindings` / `parseInventoryRows` | 壊れた table 行 / 不正な block 行（区切り欠落 `| binding |`、閉じ `]]` 欠落、`binding = ` 値欠落） | パーサが該当行をスキップして throw せず、整合する行のみ抽出する。壊れた 1 行で全解析を停止させない | AC-1 |

> 設計目標は「**実 drift（MEMBER_PHOTOS 欠落 = TC-06）は確実に検出しつつ、表記揺れ・空 block・壊れた行で誤 fail / 誤 pass しない**」こと。TC-E01 のみ非ゼロ exit（読めない＝判定不能を fail 扱い）で、TC-E02〜E05 は誤検出を抑える方向の guard。

## 設計判断（誤 fail / 誤 pass の境界）

- **ENOENT は fail（TC-E01）**: 正本ファイルが読めない場合は「drift が無いと断定できない」ため exit 0 にせず非ゼロ exit。沈黙して pass する誤 pass を防ぐ。
- **unknown state は warn（TC-E02）**: 棚卸し表の自由記述を厳格パースして誤 fail すると運用が壊れるため、未知語は `unknown` として FAIL 対象から外し warn 出力にとどめる（R-3）。ただし `active` と明示された行の orphan 検出（AC-4）は維持する。
- **空 / 壊れた行はスキップ（TC-E03/E05）**: パーサは堅牢に部分抽出し、整合行のみ採用。1 行の破損で全 gate が誤 fail しないようにする。
- **env-prefix 重複の OR 集約（TC-E04）**: `applied` は OR（prod active / staging commented でも applied:true）。これにより「片 env だけ適用済み」を見逃さない（誤 pass 防止）。

## 実行タスク

1. ENOENT 異常系 TC-E01 を設計し誤 pass を防ぐ（完了条件: TC-E01 が非ゼロ exit + decisive log で記述されている）。
2. 棚卸し表 state 表記揺れ TC-E02 を設計し unknown→warn で誤 fail を防ぐ（完了条件: TC-E02 が unknown 区分 + warn にとどめる挙動で記述され R-3 に対応している）。
3. 空 binding / block ヘッダのみの TC-E03 を設計する（完了条件: TC-E03 が例外を投げず空抽出で記述されている）。
4. env-prefix 重複の OR 集約 TC-E04 を設計する（完了条件: TC-E04 が `{name,kind}` 集約 + applied OR で記述されている）。
5. 壊れた table 行 / block 行スキップ TC-E05 を設計する（完了条件: TC-E05 が部分抽出 + throw しない挙動で記述されている）。
6. 誤 fail / 誤 pass の境界判断を明文化する（完了条件: 設計判断セクションが ENOENT=fail / unknown=warn / 破損=skip で記述されている）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-04.md | 正常系 TC-01〜TC-10（重複回避の境界） |
| 必須 | phase-02.md | D 方針（unknown→warn）/ データ構造 / 集約ロジック |
| 必須 | phase-03.md | MINOR R-3（表記揺れ unknown 扱い） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 棚卸し表 state 列の自由記述実例 |
| 参考 | scripts/verify-d1-migration-sequence.mjs | 異常系（欠番 / 不正シーケンス）fail の先例 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 異常系テスト主成果物（TC-E01〜TC-E05 / 誤 fail・誤 pass 境界判断） |
| メタ | artifacts.json | Phase 6 状態の更新（spec_created） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 正常系 TC との重複を避けた異常系境界を相互参照する |
| Phase 7 | TC-E01〜TC-E05 を AC カバレッジマトリクスの横軸に追加する |
| Phase 9 | unknown→warn / ENOENT→fail の挙動を品質保証の境界確認に渡す |
| Phase 11 | ENOENT / 破損行で gate が誤 pass しないことを CLI smoke の補助観点に渡す |

## 完了条件

- [ ] ENOENT 異常系 TC-E01 が非ゼロ exit（誤 pass 防止）で設計されている
- [ ] 棚卸し表 state 表記揺れ TC-E02 が unknown→warn（誤 fail 防止・R-3）で設計されている
- [ ] 空 binding / block ヘッダのみの TC-E03 が例外なし空抽出で設計されている
- [ ] env-prefix 重複の TC-E04 が `{name,kind}` 集約 + applied OR で設計されている
- [ ] 壊れた行スキップ TC-E05 が部分抽出 + throw なしで設計されている
- [ ] 誤 fail / 誤 pass の境界判断（ENOENT=fail / unknown=warn / 破損=skip）が明文化されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created` 範囲で記述済み
- 成果物 `outputs/phase-06/main.md` が配置済み
- TC-E01〜TC-E05 が誤 fail / 誤 pass の両方向をカバーしている
- artifacts.json の `phases[5].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 7 (AC / カバレッジマトリクス)
- 引き継ぎ事項:
  - TC-E01〜TC-E05（異常系・境界）
  - 誤 fail / 誤 pass の境界判断（ENOENT=fail / unknown=warn / 破損=skip）
- ブロック条件:
  - 表記揺れで誤 fail する厳格パースが実装に混入する
  - ENOENT を握り潰して誤 pass する実装が残る
