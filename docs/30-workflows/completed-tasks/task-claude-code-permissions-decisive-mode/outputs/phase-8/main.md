# Phase 8: リファクタリング 成果物

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 実行種別 | docs-only / spec_created |
| 作成日 | 2026-04-28 |
| 上流 | Phase 7 |
| 下流 | Phase 9 |

## 目的

Phase 2〜5 の設計成果物（`settings-diff.md` / `alias-diff.md` / `whitelist-design.md` / `impact-analysis.md` / `runbook.md` / `implementation-guide.md`）に存在する重複・記述ドリフトを削減し、単一情報源原則（SSOT）と DRY を満たす navigation map を確定する。**コード変更は無し**（docs-only）。

## リファクタリング対象 — Before / After / 理由

### 対象 1: 階層優先順位の説明重複

| 項目 | 内容 |
| --- | --- |
| Before | `settings-diff.md` と `alias-diff.md` の両方に「global → global.local → project → project.local」の優先順位説明が重複記載 |
| After | `outputs/phase-3/impact-analysis.md` を正本（SSOT）とし、`settings-diff.md` / `alias-diff.md` は「階層優先順位は `../phase-3/impact-analysis.md#階層優先順位` を参照」のリンクのみ残す |
| 理由 | 単一情報源原則（SSOT）。仕様変更時の更新箇所を 1 箇所に限定し、ドリフトを防ぐ |
| Diff 概要 | `settings-diff.md`: -12 行（説明削除）+ 1 行（参照リンク） / `alias-diff.md`: -8 行 + 1 行 / `impact-analysis.md`: 既存記述を正本として固定 |

### 対象 2: `permissions` allow/deny 列挙の重複

| 項目 | 内容 |
| --- | --- |
| Before | `whitelist-design.md` と `settings-diff.md` の両方に `permissions.allow` / `permissions.deny` の具体エントリが列挙 |
| After | `whitelist-design.md` を正本にし、`settings-diff.md` は「whitelist 詳細は `./whitelist-design.md` を参照」のリンクと差分の overview のみに圧縮 |
| 理由 | DRY。allow/deny エントリの追加削除時に 2 箇所同時修正が必要な状態を解消 |
| Diff 概要 | `settings-diff.md`: -24 行（列挙削除）+ 1 行（リンク）/ `whitelist-design.md`: 変更なし（正本） |

### 対象 3: ランブック手順と implementation-guide の重複

| 項目 | 内容 |
| --- | --- |
| Before | Phase 5 `runbook.md` と Phase 12 `implementation-guide.md` の両方に Step 1〜6（settings 編集 → alias 更新 → reload → smoke test）が登場 |
| After | `implementation-guide.md` を Part 1（中学生レベル概念説明）+ Part 2（`../phase-5/runbook.md` への参照リンク）に分離。詳細手順は `runbook.md` のみ |
| 理由 | 読者層分離（初学者向け概念 vs オペレーター向け手順）。重複維持コスト排除 |
| Diff 概要 | `implementation-guide.md`: Part 2 を参照リンクへ圧縮（-約 40 行）/ `runbook.md`: 変更なし（正本） |

## navigation map（重複削減後）

```
index.md (Phase 表)
  ├─ phase-01.md → outputs/phase-1/main.md
  ├─ phase-02.md → outputs/phase-2/{main,settings-diff,alias-diff,whitelist-design}.md
  │                  └─ 階層優先順位/permissions列挙 → outputs/phase-3/impact-analysis.md（SSOT）
  │                  └─ whitelist詳細 → outputs/phase-2/whitelist-design.md（SSOT）
  ├─ phase-03.md → outputs/phase-3/{main,impact-analysis}.md
  ├─ phase-04.md → outputs/phase-4/{main,test-scenarios}.md
  ├─ phase-05.md → outputs/phase-5/{main,runbook}.md（手順SSOT）
  ├─ phase-06.md → outputs/phase-6/main.md
  ├─ phase-07.md → outputs/phase-7/main.md
  ├─ phase-08.md → outputs/phase-8/main.md（本書）
  ├─ phase-09.md → outputs/phase-9/main.md
  ├─ phase-10.md → outputs/phase-10/{main,final-review-result}.md
  ├─ phase-11.md → outputs/phase-11/{main,manual-smoke-log,link-checklist}.md
  ├─ phase-12.md → outputs/phase-12/* 6 種
  │                  └─ implementation-guide Part 2 → outputs/phase-5/runbook.md
  └─ phase-13.md → outputs/phase-13/{main,pr-template}.md
```

## navigation drift 確認結果

| 確認項目 | 確認方法 | 結果 |
| --- | --- | --- |
| `index.md` Phase 表 → `phase-NN.md` リンク（13 件） | 目視 + ファイル存在確認 | PASS（13/13 解決） |
| `phase-NN.md` → `outputs/phase-N/*.md` リンク | 目視 + ファイル存在確認 | PASS（記述された outputs はすべて artifacts.json と一致） |
| `artifacts.json` `phases[].outputs` 配列 vs 実ファイル | `jq '.phases[].outputs[]'` と `ls outputs/phase-*/` の突合 | PASS（差分 0 件） |
| 重複削減で発生し得る dead link | 削減後の参照リンク（`../phase-3/impact-analysis.md` 等）の到達確認 | PASS（参照先はすべて artifacts.json に登録済み） |

**navigation drift: 0 件**

## 完了条件チェック

- [x] 重複削減対象 3 件の Before/After を記録
- [x] navigation map が更新済み
- [x] リンク切れ 0 件（drift 0 件）
- [x] docs-only / spec_created の境界を維持（コード変更なし）

## 下流連携

- Phase 9（品質保証）で line budget / link 健全性 / artifacts parity / secrets / 階層優先順位整合の 5 項目 QA を実施。
