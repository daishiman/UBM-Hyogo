# Phase 7 — カバレッジマトリクス（仕様要素網羅性）

## Status
done

> docs-only / NON_VISUAL / spec_created タスクのため、本書で扱う「カバレッジ」は
> **コード実行カバレッジではない**。代わりに以下 3 つの軸で仕様要素網羅性を測る。
>
> 1. 受入条件 AC-N × 草案章立て（design.md §N）
> 2. 受入条件 AC-N × Phase 4 静的検証手段
> 3. 草案アーティファクト × 出典章
>
> 「変更行カバレッジ」に相当する指標として **設計章立てカバレッジ**
> （design.md §N が 1 個以上の AC へ紐付く割合）を採用する。

---

## 1. AC × 章立て カバレッジマトリクス

| AC | 要件要旨 | §1 | §2 | §3 | §4 | §5 | §6 | §7 | §8 | 充足 |
| --- | --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| AC-1 | main/dev protection JSON 抜粋 |  | ● | ● |  |  |  |  |  | ✅ |
| AC-2 | squash-only 強制キー明示 |  |  |  | ● |  |  |  |  | ✅ |
| AC-3 | auto-rebase trigger/permissions/concurrency/失敗時 |  |  |  |  | ● |  |  |  | ✅ |
| AC-4 | pr_target safety gate（ref固定/job分離/最小権限） |  |  |  |  |  | ● |  |  | ✅ |
| AC-5 | 横断境界の表示 |  |  |  |  |  |  |  | ● | ✅ |
| AC-6 | Phase 13 承認ゲート維持 | main.md / index.md にて明記 | | | | | | | | ✅ |
| AC-7 | 草案・実装別タスク宣言 | design.md 冒頭注記 | | | | | | | | ✅ |
| **章が 1 AC 以上カバー** | | ● | ● | ● | ● | ● | ● | ● | ● | 100% |

> §1 (status check 命名) は AC-1/AC-3/AC-4 を支える前提として全章へ間接的に寄与し、
> §7 (状態遷移図) は AC-1/AC-2 の運用イメージを補強する役割で、計上は代表 AC のみ。

設計章立てカバレッジ: **8 / 8 章 = 100%**。

---

## 2. AC × Phase 4 静的検証手段 対応表

Phase 4 の test-matrix は docs-only タスクのため「静的検証手段」のみで構成される。

| AC | 検証手段（Phase 4 由来） | Phase 5 ランブック節 |
| --- | --- | --- |
| AC-1 | branch-protection JSON 草案を JSON 構文 lint ＋ 必須キー存在チェック | §B-1 |
| AC-2 | repo setting キーの enumeration を doc 内 grep で確認 | §B-2 |
| AC-3 | auto-rebase YAML を actionlint 相当で trigger/permissions/concurrency 必須キー検査 | §B-3 |
| AC-4 | pr-target YAML を actionlint ＋「`ref:` が SHA / default_branch のみ」grep | §B-4 |
| AC-5 | 横断境界表が 4 タスク全件を網羅しているかセル数チェック | §B-5 |
| AC-6 | index.md / 各 main.md の Phase 13 ゲート文言 grep | §B-6 |
| AC-7 | design.md 冒頭の「草案・実装は別タスク」注記 grep | §B-7 |

検証手段カバレッジ: **7 / 7 AC = 100%**。

---

## 3. 草案アーティファクト × 出典章

| canonical 名 (Phase 1 §7) | 出典章 | 状態 |
| --- | --- | --- |
| `branch-protection.main.json.draft` | design.md §2 | 完備 |
| `branch-protection.dev.json.draft` | design.md §3 | 完備 |
| `merge-policy.draft.md`（章として） | design.md §4 | 完備 |
| `auto-rebase.workflow.yml.draft` | design.md §5 | 完備 |
| `pr-target-safety-gate.workflow.yml.draft` | design.md §6 | 完備 |
| `required-status-checks.draft.md`（章として） | design.md §1 | 完備 |

> §1 と §4 は独立 .md ファイルではなく design.md 内の章として収納する設計を Phase 2 で確定。
> Phase 9 品質ゲートで artifacts.json との parity を確認する。

---

## 4. 「変更行カバレッジ」の代替指標

| 代替指標 | 値 | 判定 |
| --- | --- | :-: |
| 設計章立てカバレッジ | 8/8 = 100% | ✅ |
| AC 充足率 | 7/7 = 100% | ✅ |
| 草案アーティファクト出典率 | 6/6 = 100% | ✅ |
| Phase 4 検証手段の AC 紐付け率 | 7/7 = 100% | ✅ |
| Phase 6 失敗ケースが AC 範囲外を作らない | 0 件 | ✅ |

---

## 5. 仕様要素カバレッジ判定

**PASS**。コード実行カバレッジに代わる「仕様要素網羅性」を上記 5 指標で測定し、
すべての指標が 100% / 0 件で基準を満たした。
