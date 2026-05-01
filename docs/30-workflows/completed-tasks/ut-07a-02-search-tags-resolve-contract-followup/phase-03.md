# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| Gate | MAJOR 判定の場合は Phase 1 または 2 に戻る |

---

## 目的

Phase 2 で仮採用した「shared zod schema 案 A」を含めた alternative を 3 案以上比較し、
契約整合性 / drift 検出可能性 / 保守コスト / 後続 UT-07A-03 との非競合 の 4 観点でレビューして
GO / NO-GO（または条件付き GO）を仮判定する。

---

## 実行タスク

1. alternative 案 3 種を列挙し、PASS / MINOR / MAJOR 判定を付ける
2. 4 観点（契約整合性 / drift 検出 / 保守コスト / UT-07A-03 非競合）で各案を採点
3. 推奨案を確定し、ブロッカー一覧を作成
4. GO / NO-GO 仮判定を出す（最終判定は Phase 10）

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 前 Phase | `phase-02.md` | alias 表 / dependency matrix / module 設計 |
| 正本 | `docs/00-getting-started-manual/specs/12-search-tags.md` | body shape と alias の判断基準 |
| 正本 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | response shape / error code の判断基準 |
| 正本 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | web client 契約 |
| スキル | `.claude/skills/task-specification-creator/references/phase-template-core.md` | Phase 3 gate と共通見出し |

---

## 実行手順

1. Phase 2 の案 A/B/C を「実装量」「drift 防止力」「依存境界」「rollback 容易性」で比較する。
2. 仕様語 `confirmed` と DB enum `resolved` の alias が正本と実装で逆転していないか確認する。
3. 08a contract test に引き継ぐ最小ケース数を確定し、過剰な E2E / OpenAPI 生成を分離する。
4. MAJOR 指摘がある場合は Phase 2 へ戻し、GO 判定時のみ Phase 4 へ進める。

---

## Alternative 案

### 案 A: shared zod schema を新設して両側で参照（推奨）

- `packages/shared/src/schemas/admin/tag-queue-resolve.ts` に `tagQueueResolveBodySchema` を新設
- apps/api の route と apps/web の client、08a contract test の 3 箇所が同 schema を import
- type は `z.infer<typeof tagQueueResolveBodySchema>` から導出

| 観点 | 評価 | 判定 |
| --- | --- | --- |
| 契約整合性 | 単一 schema を SSOT にできる | PASS |
| drift 検出 | typecheck で全層を機械検出可能 | PASS |
| 保守コスト | 初回新設コストは中、以降の維持コストは低 | PASS |
| UT-07A-03 との非競合 | staging smoke は本契約を前提にできる | PASS |

**総合判定: PASS（推奨）**

---

### 案 B: apps/web 側で TypeScript type だけ複製する

- shared schema を作らず、apps/web 側で `type TagQueueResolveBody = { action: "confirmed"; ... } | ...` を local 定義
- apps/api 側は既存 zod を維持、08a contract test は API 側 zod を直接参照

| 観点 | 評価 | 判定 |
| --- | --- | --- |
| 契約整合性 | apps/web type と apps/api zod が独立 → drift 余地あり | MINOR |
| drift 検出 | 型の手書き複製のため runtime 検出不可、目視レビュー依存 | MAJOR |
| 保守コスト | 契約変更ごとに 2 箇所修正必要 | MINOR |
| UT-07A-03 との非競合 | smoke 自体は通るが drift 検出を staging で再現できない | MINOR |

**総合判定: MINOR（採用するなら drift 検出を CI に組む条件付き）**

---

### 案 C: 08a contract test を OpenAPI 仕様から自動生成する

- 12-search-tags.md とは別に OpenAPI yaml を新設し、contract test を openapi-zod-client 等で生成
- apps/web client / apps/api route も同 OpenAPI から型生成

| 観点 | 評価 | 判定 |
| --- | --- | --- |
| 契約整合性 | OpenAPI が SSOT 化される | PASS |
| drift 検出 | 自動生成のため強い | PASS |
| 保守コスト | OpenAPI 整備 + ツールチェイン導入の初期コスト大 | MAJOR |
| UT-07A-03 との非競合 | OpenAPI 整備が他 API（admin/forms 等）にも波及 → scope 拡大 | MAJOR |

**総合判定: MAJOR（本タスクの scope を超える、将来検討）**

---

### 案 D（補足）: Phase 2 設計をやり直し API zod を packages/shared に移すだけに留める

- 既存 apps/api の zod を `packages/shared` に物理移動するだけ
- apps/web client は既存 type 定義を維持して別途追従

| 観点 | 評価 | 判定 |
| --- | --- | --- |
| 契約整合性 | API 側は SSOT 化されるが web 側は分離 | MINOR |
| drift 検出 | 部分的 | MINOR |
| 保守コスト | 案 A より低い | PASS |
| UT-07A-03 との非競合 | smoke 自体は通る | PASS |

**総合判定: MINOR（案 A の準備段階として位置付け可）**

---

## 採点サマリ

| 案 | 契約整合性 | drift 検出 | 保守コスト | UT-07A-03 非競合 | 総合 |
| --- | --- | --- | --- | --- | --- |
| A: shared zod schema | PASS | PASS | PASS | PASS | **採用候補** |
| B: web 側 type 複製 | MINOR | MAJOR | MINOR | MINOR | 不採用 |
| C: OpenAPI 自動生成 | PASS | PASS | MAJOR | MAJOR | 将来検討 |
| D: API zod 物理移動 | MINOR | MINOR | PASS | PASS | 部分採用可 |

---

## レビュー観点ごとの結論

- **契約整合性**: 案 A が最も堅い。zod 1 本で 3 層を縛る。
- **drift 検出可能性**: 案 A / C が runtime レベルで検出可能。案 B は人間レビュー依存で危険。
- **保守コスト**: 案 A は初回中・維持低、案 C は初回大、案 B は維持中。
- **UT-07A-03 との非競合**: 案 A / D が安全。案 C は scope 爆発リスク。

---

## ブロッカー一覧

| # | 内容 | 影響 Phase | 解消条件 |
| --- | --- | --- | --- |
| B-1 | `packages/shared` 配下に admin schema 配置慣習が確定していない場合がある | Phase 5 | 既存の他 admin schema 配置を Phase 5 冒頭で確認、無ければ本タスクで先例を作る |
| B-2 | 07a Phase 12 の implementation-guide が discriminated union を採用済みである前提が崩れた場合 | Phase 1 | Phase 1 の上流 AC 引き継ぎで判定済みのはず（NO-GO 候補） |
| B-3 | 08a contract test ファイルの物理位置が apps/api / packages/shared のどちらか未確定 | Phase 4 | 既存 contract test 配置慣習を Phase 4 で確認 |

---

## GO / NO-GO 仮判定

- **仮判定: 条件付き GO（案 A 採用）**
- 条件:
  - B-1 が Phase 5 冒頭で解消されること
  - B-2 が Phase 1 で達成済みとマークされていること
  - B-3 が Phase 4 で確定すること
- 最終判定: Phase 10

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案 A をテスト戦略に展開 |
| Phase 5 | Module 設計（Phase 2）と採用案を実装ランブックに反映 |
| Phase 10 | 本 Phase の仮判定 + ブロッカー解消状況で最終 GO/NO-GO 判定 |

---

## 多角的チェック観点

- 不変条件 #11: いずれの案も resolve API の責務範囲を変えず、admin が本人本文を編集する経路を新設しない
- DRY: 案 A は SSOT を 1 つに保つ。案 B は SSOT を増やす（不採用根拠）
- YAGNI: 案 C は本タスク scope に対して過剰投資（不採用根拠）
- 後方互換: 旧契約（空 body）を呼び出す client コードは「修正対象」として drift inventory に列挙済（Phase 1）

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 案 A/B/C の比較表作成 | 3 | pending | 採用理由を明記 |
| 2 | 4 条件レビュー | 3 | pending | 矛盾 / 漏れ / 整合 / 依存 |
| 3 | GO/NO-GO 判定 | 3 | pending | MAJOR は Phase 2 戻し |
| 4 | Phase 4 test 条件の確定 | 3 | pending | contract test 最小ケース |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | alternative 4 案 + 採点表 + GO/NO-GO 仮判定 + ブロッカー一覧 |

---

## 完了条件

- [ ] alternative 案を 3 件以上列挙し、各案に PASS / MINOR / MAJOR 判定を付与
- [ ] 4 観点（契約整合性 / drift 検出 / 保守コスト / UT-07A-03 非競合）で全案を採点
- [ ] 採用案を 1 つに絞り、根拠を明記
- [ ] ブロッカー一覧と解消条件が記述されている
- [ ] GO / NO-GO 仮判定が出ている

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-03/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- 仮判定が NO-GO の場合、Phase 1 または 2 への戻り経路を明記
- artifacts.json の phase 3 を completed に更新

---

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ事項: 採用案 A / ブロッカー B-1〜B-3 / 仮判定（条件付き GO）
- ブロック条件: 仮判定が NO-GO の場合は Phase 1 または 2 に戻る
