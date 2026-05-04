[実装区分: 実装仕様書]

# Phase 8: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| Source Issue | #438 |
| 区分 | implementation / NON_VISUAL / scale: small |
| 依存 | UT-07B-FU-03 (main merged) |

---

## 目的

Phase 5 で実施した
`.claude/skills/aiworkflow-requirements/indexes/resource-map.md` への D1 migration runbook + `scripts/d1/*.sh` + `.github/workflows/d1-migration-verify.yml` 逆引き追記、
`.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` への `bash scripts/cf.sh d1:apply-prod` 1 行追記、
および `pnpm indexes:rebuild` による `topic-map.md` 再生成について、
indexes 固有の DRY / 文体統一 / 行数規律の観点で再構成する。
本タスクは追記スコープが 1〜2 行規模であり大規模リファクタは scope 外とするが、
既存セクション構造との整合・文言重複・tag/anchor 形式の統一を Phase 9 / 10 の前段で確定する。

---

## 実行タスク

1. `resource-map.md` の追記行と既存「D1 / migration / runbook」関連エントリの重複有無を確認する
2. `quick-reference.md` の `bash scripts/cf.sh ...` 既存コマンド群と新規 1 行の文体（命令形 / 動詞形 / コメント形式）を統一する
3. `topic-map.md` 再生成結果が UT-07B-FU-03 で確定した topic 群と意味的に重複していないかを確認する
4. tag / anchor 命名（`d1-migration-runbook` / `d1-apply-prod` 等）が既存キーと衝突していないか確認する
5. 追記行の内訳が「1 行 = 1 逆引きエントリ」原則を維持しているか確認する
6. UT-07B-FU-03 の追記スコープと本タスクの追記スコープの境界（runbook 本体 vs runbook+scripts+workflow の逆引き）を整理する

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | Module 設計 / 追従対象表 |
| 必須 | phase-05.md | 実装後の indexes 差分 |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 既存逆引きエントリの構造 |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 既存コマンド群の文体 |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | rebuild 結果の topic 重複確認 |
| 参考 | `docs/30-workflows/ut-07b-fu-03-*/` | 上流タスクの追記スコープ |
| 参考 | `scripts/d1/*.sh` | 逆引き対象 scripts 一覧 |
| 参考 | `.github/workflows/d1-migration-verify.yml` | 逆引き対象 workflow |

---

## Before / After 比較表（4 軸）

### 命名

| 対象 | Before | After | 根拠 |
| --- | --- | --- | --- |
| resource-map anchor | （未登録） | `d1-migration-runbook` | 既存 `d1-*` 系 anchor 命名と整合 |
| quick-reference コマンド表記 | （未登録） | `bash scripts/cf.sh d1:apply-prod` | CLAUDE.md「Cloudflare 系 CLI 実行ルール」の正規形 |
| topic-map トピック | （rebuild 後に自動付与） | `d1-migration-operations` | 既存 `d1-schema` / `d1-binding` と区別可能な動詞名詞句 |

### 型（記述形式）

| 対象 | Before | After | 根拠 |
| --- | --- | --- | --- |
| 逆引き行構造 | N/A | `<keyword> → <path> (<role>)` | resource-map 既存行の支配的フォーマット |
| quick-reference 行構造 | N/A | `# <intent>` + 1 コマンド | quick-reference 既存ブロックの支配的フォーマット |
| topic-map エントリ | N/A | rebuild 自動生成のみ（手書き禁止） | indexes:rebuild の冪等性維持 |

### Path

| 対象 | Before | After | 根拠 |
| --- | --- | --- | --- |
| 追記対象 1 | N/A | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | スコープ要約 |
| 追記対象 2 | N/A | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | スコープ要約 |
| 自動再生成 | N/A | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `pnpm indexes:rebuild` |
| 参照される runbook 実体 | N/A | UT-07B-FU-03 で確定済の D1 migration runbook path | 二重逆引き禁止のため path 完全一致 |
| 参照される scripts | N/A | `scripts/d1/*.sh` | スコープ要約 |
| 参照される workflow | N/A | `.github/workflows/d1-migration-verify.yml` | スコープ要約 |

### Endpoint（CI gate 観点）

| 対象 | Before | After | 根拠 |
| --- | --- | --- | --- |
| CI gate | N/A | `verify-indexes-up-to-date` | `.github/workflows/verify-indexes.yml` |
| 期待値 | N/A | `topic-map.md` に drift 0 | rebuild 後の git diff が空 |

---

## 重複削減 / 整合性チェック対象一覧

| # | 観点 | 対象 | 確認方法 |
| --- | --- | --- | --- |
| D-1 | resource-map に同一 path が 2 行以上で逆引きされていないか | runbook path / scripts/d1/*.sh / workflow yml | `rg "d1-migration-runbook\|d1-migration-verify" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` で hit 数を確認 |
| D-2 | quick-reference の `cf.sh d1:apply-prod` が 1 件のみか | quick-reference.md | `rg "cf.sh d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes/quick-reference.md` で hit 1 件 |
| D-3 | topic-map の自動生成 entry が UT-07B-FU-03 と重複していないか | topic-map.md | rebuild 後の git diff を目視 / 既存 topic との意味重複を確認 |
| D-4 | UT-07B-FU-03 が runbook 本体への逆引きを持つ場合、本タスクは「runbook + scripts + workflow」の合成逆引きとして責務を分離 | resource-map.md | hit 行の役割注記が異なることを確認 |

---

## 文体 / 形式統一ポイント

- resource-map の追記行は既存行と同じ「`-` 始まり / 1 行 / `→` で関係表現」フォーマット
- quick-reference の追記行は既存ブロックと同じ「コメント `#` で intent → 次行で 1 コマンド」フォーマット
- 追記行末に句点は付けない（既存行と整合）
- 半角 / 全角の混在を避ける（既存行は半角支配）
- 文中で言及する path は backtick で囲む

---

## 認知負荷削減ポイント

- skill 利用者が「D1 を本番反映する手順」と打鍵した瞬間、resource-map 1 行から runbook + scripts + workflow の 3 アーティファクトを同時に思い出せる
- quick-reference を開いた瞬間、`bash scripts/cf.sh d1:apply-prod` がそのまま貼り付け可能（CLAUDE.md「wrangler 直接実行禁止」ポリシーと整合）
- topic-map は自動再生成のため、追記者が手書きで保守する負荷が 0
- UT-07B-FU-03 の逆引き（runbook 本体）と本タスクの逆引き（runbook + scripts + workflow）の責務境界が明確

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC マトリクスの「逆引きエントリ存在」項目を本 Phase の D-1〜D-4 で再確認 |
| Phase 9 | DRY 化後の `pnpm indexes:rebuild` 冪等性確認 / `verify-indexes-up-to-date` ローカル相当 PASS |
| Phase 10 | D-1〜D-4 が hit 期待値を満たし二重逆引きが発生していないことを GO 条件として確認 |
| Phase 12 | UT-07B-FU-03 との責務境界を docs 反映時に転記 |

---

## 多角的チェック観点

- 不変条件 #5: indexes は documentation artifact のみで D1 binding に依存しない
- DRY: 追記行は resource-map 1 行 / quick-reference 1 行で「1 エントリ = 1 行」を維持
- YAGNI: references 本体や runbook 本文へは手を出さない（scope 外）
- 後方互換: 既存 anchor / topic を改名しない
- 整合性: UT-07B-FU-03 の追記行と path 重複しても、役割注記で区別される

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | resource-map 追記行の重複点検（D-1）| 8 | completed | rg ベース |
| 2 | quick-reference の文体統一（D-2）| 8 | completed | 命令形 / `#` コメント形式 |
| 3 | topic-map 自動生成 entry の意味重複確認（D-3）| 8 | completed | rebuild 後 diff 目視 |
| 4 | UT-07B-FU-03 との責務境界整理（D-4）| 8 | completed | 役割注記で区別 |
| 5 | tag / anchor 衝突確認 | 8 | completed | 既存キー一覧と突合 |
| 6 | 認知負荷削減ポイント記録 | 8 | completed | 4 項目以上 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before/After 比較表 / 重複削減一覧 / 文体統一ポイント / 認知負荷削減ポイント |
| メタ | artifacts.json | Phase 8 を completed に更新 |

---

## 完了条件 (DoD)

- [ ] Before / After 比較表が 命名 / 型 / path / endpoint の 4 軸で記述されている
- [ ] D-1〜D-4 がそれぞれ期待 hit 数 / 責務境界条件を満たしている
- [ ] resource-map / quick-reference の追記行が既存行の文体と整合している
- [ ] topic-map は手書き編集されておらず rebuild 結果のみで生成されている
- [ ] 認知負荷削減ポイントが 4 項目以上記録されている

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-08/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- DRY 化により既存 references / runbook 本体への副作用が発生していないこと
- artifacts.json の phase 8 を completed に更新

---

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: 追記行の最終形 / topic-map 再生成済 / UT-07B-FU-03 との責務境界
- ブロック条件: D-1〜D-4 のいずれかが期待値外の場合は本 Phase で再収束
