[実装区分: ドキュメントのみ]

# Phase 1: 要件定義

> 理由: task-19 の主成果物はドキュメント作成で完結する。review cycle で検出した隣接 apps/api diff は task-19 primary deliverable から分離して扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | primitives-full-spec |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-07 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| scope | docs/00-getting-started-manual/specs/09c-primitives.md の新規作成（600〜1200 行）。task-19 primary deliverable はコード変更なし。隣接 apps/api diff は分離記録。受け側 task spec: docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md |
| coverage AC | 適用外（pure-docs / NON_VISUAL タスク） |

## 目的

`primitives.jsx`（272 行・凍結正本）に存在する全 primitive component の **完全仕様書** `09c-primitives.md` を新規作成するために、AC-1〜AC-17 の判定材料を本 Phase で揃え、Phase 2 設計の入力を確定する。token 値（HEX/oklch/px）の混入を排除し、09b（値）/ 09a（mapping）/ 09e/09f/09g（採用例）への link を完備するための要件を定義する。

## 実行タスク

- AC-1: 09c-primitives.md の新規作成（600〜1200 行）スコープを固定する
- AC-2: §1〜§18 + §99 の grep 可能見出し 19 件を確定する（タスク正本 §0.7）
- AC-3: 各 §X の 6 サブセクション（X.1 prototype 由来 / X.2 props / X.3 variants/sizes/states / X.4 a11y / X.5 token 参照 / X.6 link）を必須化する
- AC-4: 視覚値混入禁止 grep gate（HEX / oklch / Npx / bg-[）を 0 件として AC 化する（タスク正本 §6.2）
- AC-5: icon-only Button / IconBtn の `aria-label` 必須を AC 化する（不変条件 7）
- AC-6: dialog / drawer / modal で `role="dialog"` + `aria-modal="true"` + focus trap + Esc close を AC 化する（不変条件 6）
- AC-7: §99 不採用 primitive 列挙（TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage）を AC 化する（不変条件 5）
- AC-8: link 整備（09b / 09a / 09e/09f/09g）を AC 化する
- AC-9: primitives.jsx 凍結条件を AC 化する（不変条件 1）
- AC-10: JSX 一字一句転記を AC 化する（不変条件 2）
- AC-11: token 値 0 件混入を AC 化する（不変条件 3）
- AC-12: token 名参照 + 09b link 併記を AC 化する（不変条件 4）
- AC-13: EDITMODE 専用 primitive 除外を AC 化する（不変条件 5）
- AC-14: WAI-ARIA 整合を AC 化する（不変条件 6）
- AC-15: icon-only Button aria-label 必須を AC 化する（不変条件 7）
- AC-16: markdown lint error 0 を AC 化する
- AC-17: primitive / helper 列挙漏れなし（`rg -n '^(const|function) [A-Z][A-Za-z0-9]*\b' primitives.jsx` 抽出 checklist との照合）を AC 化する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/primitives.jsx | JSX 転記元（272 行・凍結正本） |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/styles.css | class 名出典のみ（値転記禁止） |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | タスク正本（§0.5 不変条件 / §0.7 見出し / §6.2 grep gate） |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | 正本順位（§6 diff scope 規律） |
| 参考 | docs/00-getting-started-manual/specs/09a-prototype-map.md | task-07 link 先（行範囲 mapping） |
| 参考 | docs/00-getting-started-manual/specs/09b-design-tokens.md | task-08 link 先（token 値の正本） |

## 実行手順

### Step 0: P50 チェック（既実装状態の調査）

```bash
# 09c-primitives.md がまだ存在しないことを確認
ls docs/00-getting-started-manual/specs/09c-*.md 2>/dev/null || echo "未作成（正常）"

# 凍結正本の primitive 関数を列挙
rg -n '^(const|function) [A-Z][A-Za-z0-9]*\b' docs/00-getting-started-manual/claude-design-prototype/primitives.jsx
```

### Step 1: 不変条件 7 件の AC 化

タスク正本 §0.5 から以下を AC として転記する:

1. primitives.jsx は凍結正本（改変禁止）
2. JSX inline 転記は一字一句（class 名・whitespace 含む）
3. token 値（HEX / oklch / px）を 0 件
4. 値が必要な箇所は token 名で参照し 09b への link を併記
5. EDITMODE 専用 primitive を §99 に列挙
6. `aria-*` / `role` を WAI-ARIA Authoring Practices に整合（dialog / drawer / modal は role/aria-modal/Esc/focus trap 必須）
7. icon-only Button は `aria-label` 必須

### Step 2: §0.7 grep 可能見出し 19 件の固定

| # | 見出し | 由来 (primitives.jsx) |
| --- | --- | --- |
| 1 | `## 1. Button` | L92-L110 |
| 2 | `## 2. Card` | (派生) |
| 3 | `## 3. Badge` | Chip L6-L14 |
| 4 | `## 4. Input` | (Field 内) |
| 5 | `## 5. Field` | L129-L143 |
| 6 | `## 6. Select` | (派生) |
| 7 | `## 7. Switch` | L113-L115 |
| 8 | `## 8. Segmented` | L118-L126 |
| 9 | `## 9. Sidebar` | (派生) |
| 10 | `## 10. Stat` | (派生) |
| 11 | `## 11. EmptyState` | (派生) |
| 12 | `## 12. Avatar` | (派生) |
| 13 | `## 13. Banner` | (派生) |
| 14 | `## 14. Drawer` | L158-L174 |
| 15 | `## 15. Modal` | L177-L195 |
| 16 | `## 16. Toast` | L198-L223 |
| 17 | `## 17. KVList` | L226-L235 |
| 18 | `## 18. LinkPills` | L248-L262 |
| 19 | `## 99. 不採用 primitive` | (TweaksPanel / data-theme / AvatarStoreProvider#localStorage) |

### Step 3: §6.2 視覚値混入禁止 grep gate の AC 化

```bash
F=docs/00-getting-started-manual/specs/09c-primitives.md
grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" && exit 1 || true
grep -nE 'oklch\(' "$F" && exit 1 || true
grep -nE '\b[0-9]+px\b' "$F" && exit 1 || true
grep -nE '\bbg-\[' "$F" && exit 1 || true
```

これら 4 件全てが 0 ヒットであることを AC-4 / AC-11 として固定する。

### Step 4: outputs/phase-01/main.md への記録

- AC-1〜AC-17 を一覧化
- 不変条件 7 件と AC の対応表を記録
- §0.7 19 見出しを記録
- §6.2 grep gate コマンドを記録
- 4条件評価（価値性 / 実現性 / 整合性 / 運用性）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 19 見出し / 6 サブセクション topology を設計に展開 |
| Phase 3 | NO-GO 条件として「token 値混入」「primitive 列挙漏れ」「primitives.jsx 改変」を継承 |
| Phase 4 | grep gate / markdown 構造検証スクリプトの作成根拠 |
| Phase 7 | AC-1〜AC-17 のトレース元 |
| Phase 10 | gate 判定の根拠 |

## 多角的チェック観点（AIが判断）

- 価値性: task-10（ui-primitives 実装）担当者が 09c §X.Y を読んで 1 ファイル書ける決定論的状態を作れるか
- 実現性: 600〜1200 行に 17 primitive + §99 を収められるか（1 primitive 平均 35〜70 行）
- 整合性: 09b（値）/ 09a（mapping）/ 09e/f/g（採用例）と link が双方向で破綻しないか
- 運用性: §6.2 grep gate を pre-commit / CI で再現実行できるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 不変条件 7 件の AC 転記 | 1 | spec_created | AC-9〜AC-15 |
| 2 | 19 見出しの確定 | 1 | spec_created | AC-2 |
| 3 | 6 サブセクション structure 確定 | 1 | spec_created | AC-3 |
| 4 | grep gate 4 種コマンド固定 | 1 | spec_created | AC-4 / AC-11 |
| 5 | link 整備対象 4 ファイル列挙 | 1 | spec_created | AC-8 |
| 6 | 17 primitive checklist 抽出 | 1 | spec_created | AC-17 |
| 7 | §99 不採用 3 件確定 | 1 | spec_created | AC-7 / AC-13 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | AC 一覧 / 不変条件対応表 / 19 見出し / grep gate / 4条件評価 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] AC-1〜AC-17 が main.md 内で具体的に判定済み
- [ ] 不変条件 1〜7 の全てが AC にマッピング済み
- [ ] 19 見出しの確定リストが main.md に列挙済み
- [ ] §6.2 grep gate コマンド 4 種が main.md にコピペ可能な形で記載
- [ ] §99 不採用 3 件（TweaksPanel / data-theme / AvatarStoreProvider#localStorage）が確定
- [ ] Phase 2 への handoff（章立て / topology table 指示）が明記
- [ ] 上流ブロッカーなし（task-01 完了済み）を Phase 1 / 2 / 3 の 3 箇所で重複明記する初出として記録
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが spec_created
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（primitive 列挙漏れ / 視覚値混入 / 凍結正本改変 / link 切れ）の検討済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の該当 phase を spec_created に更新

## 次 Phase

Phase 2: 設計（19 セクション × 6 サブセクション topology table の確定 / link mapping 表 / a11y matrix）
