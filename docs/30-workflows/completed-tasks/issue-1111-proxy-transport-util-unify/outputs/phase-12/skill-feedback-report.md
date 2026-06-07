# Skill Feedback Report（issue-1111-proxy-transport-util-unify）

task-specification-creator スキルおよび関連テンプレート/ワークフロー/ドキュメントへの改善フィードバック。改善点が無い場合も本ファイルを出力する。

## サマリ

| 観点 | 改善提案 |
| --- | --- |
| テンプレート改善 | **なし**（現行 Phase 12 strict 7 テンプレートで pure refactor / implemented_local_evidence_captured を過不足なく表現できた） |
| ワークフロー改善 | **なし**（YAGNI 解除判定を Phase 1 要件に組み込めた） |
| ドキュメント改善 | **なし**（identifier drift 防止のため index.md → implementation-guide.md で確定名を一致させる運用が機能した） |

## 得られた知見（記録）

### K-1: pure refactor + YAGNI gate 解除判定の spec 化

本タスクは「YAGNI で意図的に見送り中。利用箇所が 3 箇所目に増えたときにのみ着手」という起票時の前提を、現行コード調査で「`public.ts`（public read）が同型イディオムを独立複製済 = 3 箇所目出現」と確認し、**Rule of Three 成立**を AC 化した。

- **知見**: refactoring タスクで「YAGNI で見送り中」の前提が付く場合、Phase 1 要件で「現行コードに同型コピーが N 箇所あるか」を実コード grep で再確認し、Rule of Three（3 箇所目）成立を着手 gate（AC）として明文化すると、過去の見送り判断と現状の乖離を機械的に解消できる。
- **適用**: index.md §Issue 最適化 O1 で「YAGNI 解除条件成立」を確定し、phase-01 の AC-1 gate を「成立」に固定した。

### K-2: 同型でない別形状の正当なスコープ外化

`auth.ts` の軽量変種を「無理に統合すると挙動が変わる（pure refactor 違反）」という技術理由でスコープ外に固定した。

- **知見**: refactor の集約対象を決める際、「似ているが同型でない」コードを統合すると pure refactor を破る。per-caller の真理値（`disableBinding` 等）を保存することが「挙動不変」の必須条件であり、判定述語を util へ移送せず呼び出し側に残す設計（症状 1/2/3 を呼び出し側 boolean / closure に吸収）が pure refactor を保証する。
- **適用**: index.md §アーキテクチャ決定で症状 1-4 ごとに「util に潰さず呼び出し側に残す」を明示し、unassigned-task-detection の baseline 境界に `auth.ts` を記録した。

### K-3: NON_VISUAL refactor の代替証跡

UI/UX 変更なしの refactor では Phase 11 スクリーンショットを「不要」と明記し、focused vitest + typecheck + lint を代替証跡とする運用が compliance gate と整合した。

- **知見**: NON_VISUAL タスクの Phase 11 evidence inventory は status `n/a` を使い、screenshot 行を作らず代替証跡（focused Vitest / typecheck / lint）を明示する。これにより `verify:phase12-compliance` の evidence 検証（`present` / `pending` / `n/a` の 3 値固定・`n-a` ハイフン表記は invalid 判定でゲート fail）を満たせる。

## テンプレート改善候補

なし。本タスクは現行 task-specification-creator の Phase 12 strict 7 構造で完結し、テンプレート/ワークフローの変更を要しなかった。
