# Unassigned Task Detection

[実装区分: 実装仕様書]

本タスク（`admin-tag-management-clarity-and-code-autogen`）のサイクル内未対応・将来候補を current / baseline 分離で記録する（0 件でも出力必須）。

---

## current（本サイクルで対応すべき残課題）

**0 件。**

本サイクル（Lane C1〜C5）の AC-1〜AC-12 は 1 本サイクルに収まる設計であり、本サイクル中に対応すべき未割当タスクはない。TODO / skip / 設計レビュー BLOCKER いずれも 0。すべて apps/web 表現層で完結し、新 API endpoint・D1 schema 変更・Google Form 仕様変更を伴わない。

---

## baseline（将来候補・本サイクル外・CONST_007 例外条件 1 該当）

SSOT §12 の OOS-1〜3 を baseline 候補として分離記録する。いずれも「分量」ではなく技術的・整合性的理由（API/データ構造接触・読み曖昧性・rename 別タスク済み）で分離が妥当であり、本サイクルでは実施しない。

| ID | 課題 | 本サイクルで分離する理由 | 将来の実施場所 |
|----|------|--------------------------|----------------|
| OOS-1 | 2 画面の 1 画面統合（タブ等） | 定義 = tag master CRUD / 割当 = queue resolve は **API・データ構造が別系統**。統合は API 層設計を要し、本サイクル（表現層のみ）で破綻する。R-2 は「説明 UI + 相互リンク」で意図を満たす（AskUser 確定）。 | 将来 Issue |
| OOS-2 | 漢字 → 読み（ローマ字）変換でのコード生成 | 読み辞書が重く読み曖昧性がある。本サイクルは fallback `tag_<hash>` で十分（code は技術識別子であり非エンジニアには表示名が重要）。 | 将来 Issue（必要性が出た場合） |
| OOS-3 | `TagMasterEditForm`（編集フォーム）へのコード自動生成適用 | 編集時は既存コードが存在し自動生成の意味が薄い（rename は別タスク #1069 等で扱い済み）。本サイクルは新規作成フォームに限定。 | 将来 Issue（必要性が出た場合） |

---

## 関連タスク差分確認（重複起票回避）

| 確認対象 | 結果 |
|----------|------|
| 既存タグ管理 component（`TagDefinitionPanel` / `TagQueuePanel` / `TagsQueueResolveDrawer`） | 本タスクはガイド挿入・コード自動生成・命名統一のみで割当ロジック不変。重複なし |
| rename 関連（#1069 等） | OOS-3（編集フォームへの自動生成）の隣接。本タスクは新規作成フォーム限定で重複なし |
| 既存 open issue | OOS-1〜3 に対応する open issue は確認時点で重複なし。新規 Issue 起票は user-gated（relatedIssue=null） |

---

## まとめ

- current 0 件（本サイクルで対応すべき残課題なし）。
- baseline 3 件（OOS-1 / OOS-2 / OOS-3）。いずれも将来候補として記録のみ。新規 Issue 起票・タスク化は user-gated。
