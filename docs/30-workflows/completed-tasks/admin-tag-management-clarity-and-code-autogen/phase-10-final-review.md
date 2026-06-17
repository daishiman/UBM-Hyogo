# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

> SSOT: [shared-context.md](./shared-context.md)。AC の正本は §8、DoD は §9、Phase 11 / capture 方針は §10、OOS は §12。

## 目的

AC-1〜AC-12（SSOT §8）の充足見込みを 1 件ずつ判定し、本仕様が AC を満たす設計になっているかを確認する。`implemented_local_evidence_captured`（local evidence 取得済み）のため各 AC は「実装後に達成」を前提としつつ、設計上の達成可能性を判定する。MINOR 指摘の未タスク化（Phase 12 unassigned へ送付）と blocker 判定を行う。

## 実行タスク

- AC-1〜AC-12 を 1 件ずつ判定表（§1）で評価し、検証手段と実装後の想定結果を記す。
- DoD（SSOT §9）整合を確認する（§2）。
- MINOR を未タスク化候補として記録し Phase 12 へ送る（§3）。
- blocker 判定を行う（§4）。
- 最終判定を下す（§5）。

## 参照資料

- [shared-context.md](./shared-context.md) §8（AC）/ §9（DoD）/ §10（capture 方針）/ §12（OOS）
- [phase-9-qa.md](./phase-9-qa.md)（QA 番号）/ [phase-7-coverage.md](./phase-7-coverage.md) / [phase-8-refactor.md](./phase-8-refactor.md)

## 1. AC チェックリスト（AC-1〜AC-12）

> `implemented_local_evidence_captured` のため「達成状態」は実装後に確定する。本表は「仕様が AC を満たす設計になっているか（設計妥当性）」を判定する。検証手段は [phase-9-qa.md](./phase-9-qa.md) の QA 番号と整合。

| AC | 内容（要約） | 検証手段 | 設計妥当性判定 | 実装後の想定結果 |
|----|--------------|----------|----------------|------------------|
| AC-1 | 表示名入力でコード欄が `generateTagCode` 値で自動補完（C1） | QA-3（form spec） | ✅ 設計あり（`codeDirty=false` 経路で `setCode(generateTagCode(label))`） | 表示名入力でコード自動補完 |
| AC-2 | コード手動編集後は自動上書きされない（`codeDirty`）（C1） | QA-3（form spec） | ✅ 設計あり（`codeDirty=true` で自動停止） | 手動値が保持される |
| AC-3 | `generateTagCode` 返り値が常に `TAG_CODE_PATTERN` 一致（全分岐）（C1） | QA-3（`tagCodeAutogen.spec.ts`） | ✅ 設計あり（step 8 で pattern 保証 + fallback） | 空 / 日本語 / 記号 / 長文すべて pattern 一致 |
| AC-4 | 「表示名から自動生成（編集可）」ヒント + 自動生成中状態表示（C1） | QA-3（form spec） | ✅ 設計あり（SSOT §6 ヒント + バッジ） | ヒント・状態バッジ描画 |
| AC-5 | サイドバー label「タグ割当」がタイトルと一致（C2） | QA-3 / grep | ✅ 設計あり（`shell-config.ts` label 変更） | 「タグ割当」で名称統一 |
| AC-6 | `/admin/tag-master` 冒頭に guide(definition) + `/admin/tags` 相互リンク（C3） | QA-3（guide / page spec） | ✅ 設計あり（variant="definition"） | ガイド + 相互リンク描画 |
| AC-7 | `/admin/tags` 冒頭に guide(assignment) + `/admin/tag-master` 相互リンク（C3） | QA-3（guide / page spec） | ✅ 設計あり（variant="assignment"） | ガイド + 相互リンク描画 |
| AC-8 | `TAG_MANAGEMENT_GLOSSARY` 必須キー揃い + `getTagTerm` lookup（C3） | QA-3（`tagManagementGlossary.spec.ts`） | ✅ 設計あり（8 必須キー + lookup 関数） | 必須キー揃い・lookup 成功/未登録 undefined |
| AC-9 | 技術文言（"tag master API" 等）が平易文に置換（C4） | grep / QA-3 | ✅ 設計あり（用語集経由の平易文） | "tag master API" grep 0 件 |
| AC-10 | `apps/api` に差分なし（全） | QA-5（git diff） | ✅ 設計あり（表現層のみ・不変条件 #6） | diff 0 行 |
| AC-11 | HEX 直書き 0 件（OKLch token のみ）（C3） | QA-4 / grep | ✅ 設計あり（token クラスのみ・新 primitive なし） | HEX 0 件 PASS |
| AC-12 | 既存タグ管理テストが回帰しない（DOM contract 維持）（C5） | 既存 spec PASS | ✅ 設計あり（追加のみ・testid/aria 不変） | 既存 spec GREEN |

> 12 件すべて設計妥当性 ✅。`implemented_local_evidence_captured` のため達成は実装後に確定するが、仕様（Phase 2-8）は全 AC を満たす設計を提示している。

## 2. DoD 整合（SSOT §9）

| DoD | 状態（implemented_local_evidence_captured 時点） |
|-----|---------------------------|
| AC-1〜AC-12 を満たす実装手順が phase-5 に記述 | 実装済み（staging visual / commit / PR は user-gated） |
| 変更対象ファイル一覧（新規 7 / 編集 product 6 + spec 2 / 非接触）が phase-5 に列挙 | SSOT §5 に列挙済み |
| 関数シグネチャ（`generateTagCode` / `getTagTerm` / `TagManagementGuide`）明記 | SSOT §6 に明記済み |
| テスト方針（追加 spec・ケース・期待値）が phase-4/6 に記述 | Phase 7 カバレッジ表で具体化済み |
| ローカル検証コマンド（§11）が phase-5/9 に記述 | Phase 9 QA に転記済み |
| 実装後検証: typecheck / lint / focused vitest / verify:tokens / apps/api 空 | Phase 9 QA-1〜QA-5（実装後 user-gated） |
| spec 側 CI gate: `gate-metadata:validate` / `verify:phase12-compliance` | Phase 9 QA-6/QA-7（pre-flight） |

## 3. MINOR 再掲（未タスク化対象 → Phase 12 へ送付）

> MINOR → 未タスク化（unassigned-task-guidelines）。実施場所は Phase 12 `unassigned-task-detection.md`。

| ID | 指摘 | 未タスク化の理由 | 送付先 |
|----|------|------------------|--------|
| M-1（OOS-1） | 2 画面の 1 画面統合（タブ等） | 定義 = tag master CRUD / 割当 = queue resolve は API・データ構造が別系統。統合は API 層設計を要し表現層のみの本サイクルで破綻（CONST_007 例外）。R-2 は説明 UI + 相互リンクで意図充足（AskUser 確定） | Phase 12 `unassigned-task-detection.md` |
| M-2（OOS-2） | 漢字→読み（ローマ字）変換でのコード生成 | 読み辞書が重く読み曖昧性あり。本サイクルは fallback `tag_<hash>` で十分（code は技術識別子） | Phase 12 `unassigned-task-detection.md` |
| M-3（OOS-3） | `TagMasterEditForm` へのコード自動生成適用 / `TAG_CODE_PATTERN` 広域 import 統一 | 編集時は既存コードあり自動生成の意味が薄い。rename は別タスク（#1069 等）で扱い済み。広域 import 置換はリスク次第で分離 | Phase 12 `unassigned-task-detection.md` |

> M-1〜M-3 はいずれも「本サイクルで対応すると技術的・整合性的に破綻する（API 接触 / 辞書コスト / スコープ拡大）」ため分離が妥当。**現時点 MINOR は上記 OOS 由来の 3 件のみで、設計に起因する新規 MINOR は 0 件。**

## 4. blocker 判定

**機能・設計上の blocker は 0 件。**

| 項目 | 区分 | 説明 |
|------|------|------|
| 仕様（Phase 2-8） | **完了** | 責務境界維持・API 不変・全 AC を満たす設計を提示済み |
| コード実装 | **予定された境界（blocker でない）** | apps/web 実装・focused tests は user-gated |
| runtime / staging 反映 | **予定された境界（blocker でない）** | staging deploy・実機確認は user-gated（Phase 11） |
| screenshot / visual evidence | **implemented_local_evidence_captured 境界（blocker でない）** | canonical screenshot 2 件は `staging_visual_pending_user_gate`（SSOT §10） |
| commit / push / PR | **予定された境界（blocker でない）** | Phase 13 で user-gated |

> 未実施として残るのは実装 / runtime / user-gated 操作のみ。未解決の設計矛盾・不変条件違反は無い。

## 5. 最終判定

**PASS — implemented_local_evidence_captured として完了可能。**

- AC-1〜AC-12 はすべて設計妥当性 ✅（実装後に達成、仕様は全 AC を満たす設計を提示）。
- blocker は 0 件（実装 / staging runtime / screenshot / PR は予定された user-gated 境界）。
- MINOR は OOS 由来 3 件（M-1〜M-3）を Phase 12 unassigned-task-detection へ送付。設計起因の新規 MINOR は 0 件。
- 後続は本サイクル（user-gated）→ Phase 11 authenticated staging visual（user-gated）→ Phase 13 commit/PR（user-gated）の順で進める。

## 成果物

- 本ファイル（`phase-10-final-review.md`）= AC-1〜AC-12 判定表 + DoD 整合 + MINOR 未タスク化（3 件 / 新規 0）+ blocker 判定（0）+ 最終判定（PASS）。

## 完了条件

- [ ] AC-1〜AC-12 が 1 件ずつ判定表で評価され、implemented_local_evidence_captured の「実装後に達成」が明記されている。
- [ ] 仕様が各 AC を満たす設計になっているか（設計妥当性）が判定されている。
- [ ] MINOR が未タスク化候補として記録され Phase 12 へ送付されている（設計起因の新規 MINOR 0 を明記）。
- [ ] blocker 判定（なし）が記述されている。
- [ ] 最終判定（PASS）が下されている。
