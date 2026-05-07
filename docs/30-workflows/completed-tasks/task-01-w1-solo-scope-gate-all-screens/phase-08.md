# Phase 08: リスク・代替案（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 08 / 13（リスク・代替案） |
| 推定工数 | 0.02 人日 |
| 依存 Phase | Phase 01..07 |
| タスク種別 | `docs-only` / `NON_VISUAL` |

---

## 0. 自己完結コンテキスト

task-01 は docs 編集タスクで失敗影響範囲は限定的だが、後続 21 タスクの参照基盤になるため、**ドリフト・リンク切れ・誤った scope 拡大** が起きると workflow 全体が崩壊する。本 Phase でリスク特定と代替案・rollback を明示する。

---

## 1. 目的

task-01 実装過程・実装後に発生しうるリスクを列挙し、影響度 / 発生確率 / 緩和策 / rollback 手順を固定する。

---

## 2. リスク一覧

| ID | リスク | 影響 | 発生確率 | 緩和策 | rollback |
|----|--------|------|---------|--------|---------|
| R-01 | CLAUDE.md 既存セクションを誤って編集 | AI エージェントの全タスク挙動破壊 | 中 | Phase 06 ST-B-4 で `git diff` 行数を確認、Edit tool は最小 anchor で適用 | `git checkout -- CLAUDE.md` で当該行を revert、再適用 |
| R-02 | SCOPE.md の 19 routes 表で route が欠落 / 重複 | 後続 task の実装スコープ誤認 | 中 | Phase 07 §3 行数検算（合計 19 / 層別 6+2+8+3） | SCOPE.md を再生成（task-01 §5.3 から再 copy） |
| R-03 | `## 参照ドキュメント` 直前のアンカー位置が変動（既存編集で別セクション挿入済） | CLAUDE.md 追記位置がずれる | 低 | Phase 06 ST-B-1 で行番号 grep で動的特定 | revert 後に新位置で再適用 |
| R-04 | specs/00-overview.md 末尾の改行不足で `---` 区切りが H1 と密着 | markdown lint fail | 低 | Phase 07 lint で検出 | 改行 1 行追加で修正 |
| R-05 | mapping 表で `apps/api/src/routes/` 実在 endpoint と乖離 | 後続 task が架空 endpoint を呼ぶ | 中 | Phase 07 §4 step 7 で endpoint diff、phase-3 §7（実在確認済 surface）と照合 | 該当行を実在 endpoint に修正、SCOPE.md §2 を再 commit |
| R-06 | OKLch 参照が prototype の現行 token 名と乖離 | task-08 / task-09 で誤った token 名で誘導 | 低 | Phase 06 §7 / Phase 03 §10 で `styles.css` L1-70 を参照固定 | SCOPE.md §3 #3 を修正 |
| R-07 | 後続 task の `../SCOPE.md` 相対パス解決失敗（SCOPE.md を別ディレクトリに置いた場合） | 後続 task 全件 link broken | 低 | Phase 06 ST-A-1 で workflow root 直下を厳守 | SCOPE.md を正規位置に移動 |
| R-08 | 並列ワークツリーで他 task が同じ CLAUDE.md を編集（merge conflict） | PR レビュー時に conflict | 低 | task-01 を W1 単独 wave とし、W2 起動前に必ず merge 完了 | rebase で衝突解消 |
| R-09 | docs lint pipeline 未整備で「lint pass」を misjudge | false green | 低 | Phase 11 evidence に `pnpm lint` 実出力を貼付 | lint command 自体を再確認 |
| R-10 | task-01 完了前に W2 起動（順序違反） | 後続 task が SCOPE.md 不在で着手 | 中 | EXECUTION-ORDER.md で W1 → W2 を明記、Phase 09 進捗管理で gate | W2 を一旦停止し W1 完了を待つ |

---

## 3. 影響度マトリクス

| 影響度 \ 発生確率 | 低 | 中 | 高 |
|------------------|----|----|----|
| 高 | R-03, R-08 | R-01, R-02, R-10 | - |
| 中 | R-04, R-06, R-07, R-09 | R-05 | - |
| 低 | - | - | - |

R-01 / R-02 / R-05 / R-10 が **重点監視**。

---

## 4. 代替案（採用しなかった案）

| 代替案 | 採用しなかった理由 |
|--------|-------------------|
| SCOPE.md を作らず CLAUDE.md だけに 3 合意を書く | CLAUDE.md が肥大化し読み込みコスト増。SCOPE.md の独立により後続 task が grep で参照しやすい |
| SCOPE.md を `outputs/phase-1/` に置く | outputs はフェーズ生成物のため scope gate の集約には不適。workflow root 直下が正本順位 1 位として明示的 |
| CLAUDE.md の `## 重要な不変条件` に追加項目を混ぜ込む | 既存 6 項目（プロジェクト恒久不変）と本 workflow 固有 3 項目が混在し、将来のワークフロー終了時に分離困難 |
| specs/ を編集せず SCOPE.md だけで完結 | specs/00-overview.md を read する開発者が 19 routes 拡張を知る経路が無くなる |

---

## 5. rollback 手順（タスク全体）

```bash
# 全変更を revert
git checkout main -- CLAUDE.md docs/00-getting-started-manual/specs/00-overview.md
git rm docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md
git commit -m "revert(task-01): rollback scope gate docs"
```

> rollback は workflow 全体停止を意味するため、原因確定後に再適用。

---

## 6. プロトタイプ参照表

| リスク | prototype 参照 | 緩和に使う行 |
|-------|---------------|-------------|
| R-06 OKLch 名乖離 | `styles.css` L1-70 | `:root` 23 token の正本名 |
| R-02 19 routes 整合 | `pages-public.jsx` / `pages-member.jsx` / `pages-admin.jsx` | 各 page component の存在確認 |

---

## 7. 完了条件（Phase 09 へ進む gate）

- [ ] R-01〜R-10 が表として確定
- [ ] 影響度マトリクスで重点監視リスクが特定
- [ ] 代替案 4 件と却下理由が明記
- [ ] rollback 手順が実行可能コマンドで記述

## 実行タスク

- 本 phase 本文に記載済みのタスクを実行し、task-01 scope gate の正本化に必要な判断・検証・成果物を閉じる。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 親タスク仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/01-scope/task-01-w1-solo-scope-gate-all-screens.md` | 3 docs 正本化の要求 |
| Scope 正本 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 後続 task-02..22 の参照先 |
| workflow 実行順 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` | W1 -> W7 DAG |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-08.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。代替として Phase 11 の docs walkthrough、grep、route count、link checklist を統合証跡とする。
