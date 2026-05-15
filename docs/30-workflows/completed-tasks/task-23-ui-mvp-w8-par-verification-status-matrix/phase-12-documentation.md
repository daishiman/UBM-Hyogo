# Phase 12: ドキュメント更新

Phase 12 では task-specification-creator の strict 7 成果物すべてを出力する（NON_VISUAL / docs-only でも省略しない）。

| Task | 成果物 | 必須 |
|------|--------|------|
| 12-1 | `outputs/phase-12/main.md`（Phase 12 root summary） | ✅ |
| 12-2 | `outputs/phase-12/implementation-guide.md`（Part 1: 中学生レベル / Part 2: 技術者向け） | ✅ |
| 12-3 | `outputs/phase-12/system-spec-update-summary.md` | ✅ |
| 12-4 | `outputs/phase-12/documentation-changelog.md`（Step 1-A / 1-B / 1-C / Step 2 判定）| ✅ |
| 12-5 | `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力）| ✅ |
| 12-6 | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力）| ✅ |
| 12-7 | `outputs/phase-12/phase12-task-spec-compliance-check.md`（root evidence）| ✅ |

---

## Task 12-1: main.md

Phase 12 の root summary として、strict 7 の存在、docs-only / NON_VISUAL 境界、親 workflow の正規配置先を記録する。

## Task 12-2: implementation-guide.md（2 パート構成）

### Part 1: 概念説明（中学生レベル）

#### このタスクで作るもの

**「クラスごとに 22 人の生徒がいて、4 教科のテストを受けたとします。担任の先生は、22 人 × 4 教科 = 88 マスの一覧表を作って、誰がどの教科で『よくできた / もう少し / 不合格』だったかを 1 枚の紙でひと目で分かるようにします」**

このタスクは、まさにこれと同じことをします。

- **22 人の生徒** = 「UI プロトタイプ整合」のために順番に進めてきた 22 個の作業（task-01 〜 task-22）
- **4 教科のテスト** = 「ちゃんと書けているか / 抜けていないか / 名前がそろっているか / 順番通りに前の作業が終わっているか」という 4 つのチェック
- **88 マスの一覧表** = `VERIFICATION-STATUS.md` というファイル

#### なぜ必要なのか

22 個の作業はそれぞれ別の人が（または別の日に）行いました。そのままにしておくと、

- 「task-19 が終わったかどうか覚えていない」
- 「task-03 と task-07 はちゃんとできていたっけ？」
- 「全部終わったか確認する場所がない」

ということが起きます。1 枚の表にまとめれば、**誰が見ても 10 秒で全体の健康状態が分かる**ようになります。

#### 4 つのチェックを身近な例で

| チェック | 身近な例 |
|----------|----------|
| C1: 矛盾なし | 「料理のレシピで『砂糖大さじ 2』と書いた直後に『砂糖は入れない』と書かれていないか」 |
| C2: 漏れなし | 「買い物リストに書いた物を全部買ったか」 |
| C3: 整合性あり | 「ノートに書いた名前と、出席簿の名前が同じスペルか」 |
| C4: 依存関係整合 | 「カレーを作るとき、肉を炒める前にちゃんと玉ねぎを切ったか」 |

#### 表のマークの意味

- 🟢 **PASS** = 「ばっちりできた」
- 🟡 **WARN** = 「だいたいできてるけど、ちょっとだけ気になる所がある（理由を必ず書く）」
- 🔴 **FAIL** = 「ここはダメだった（理由を必ず書く）」
- ⚪ **N/A** = 「そもそもこの教科は受ける必要がなかった」

---

### Part 2: 技術者向け詳細

#### インターフェース

```typescript
// matrix 行モデル
interface VerificationRow {
  taskId: string;            // "task-01" 〜 "task-22"
  subject: string;           // task spec の Task ID または「目的」を 1 行抽出
  c1_consistency: Verdict;   // PASS / WARN / FAIL / N/A
  c2_completeness: Verdict;
  c3_integrity: Verdict;
  c4_dependency: Verdict;
  remarks?: string;          // WARN / FAIL 行で必須、PASS は空可
}

type Verdict = "PASS" | "WARN" | "FAIL" | "N/A";

// matrix 全体
interface VerificationStatusDocument {
  meta: {
    evaluatedAt: string;     // ISO 8601 YYYY-MM-DD
    evaluator: string;       // "task-23 (solo)"
    branch: string;          // 評価時の branch
    commit: string;          // short or full SHA
  };
  rows: VerificationRow[22]; // 必ず 22 行
  summary: {
    pass: number;
    warn: number;
    fail: number;
    na: number;
    total: 88;
  };
}
```

#### 評価アルゴリズム

Phase 2 §2 で定義した判定ロジックに従う。各行の評価は以下の擬似コードで再現可能:

```typescript
function evaluateTask(taskId: string): VerificationRow {
  const spec = readTaskSpec(taskId);
  return {
    taskId,
    subject: extractSubject(spec),
    c1_consistency: evaluateC1(spec),
    c2_completeness: evaluateC2(spec, repoFiles),
    c3_integrity: evaluateC3(spec, repoIdentifiers),
    c4_dependency: evaluateC4(spec, otherRowsResults),
    remarks: collectRemarks(...),
  };
}
```

#### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は `outputs/phase-7/coverage.md`（埋まり率 100%）と `outputs/phase-9/qa.md`（GFM 構文 / line budget）。

#### エラーハンドリング

- 88 セル未満で生成された場合 → Phase 4 T-04/T-05 で fail 検出
- WARN/FAIL に理由欠落 → Phase 9 で fail 検出
- 参照 spec の path drift → Phase 9 で fail 検出

#### 設定可能パラメータ

なし（単発生成タスク）。

---

## Task 12-3: system-spec-update-summary.md

| Step | 判定 |
|------|------|
| Step 1-A: 完了タスク記録 + 関連ドキュメントリンク + LOGS.md ×2 + topic-map.md | 該当する場合のみ実行（同 wave で wf 内 index.md / artifacts.json を更新） |
| Step 1-B: 実装状況テーブル更新 | `task-23` を `implemented_local_evidence_captured` で登録 |
| Step 1-C: 関連タスクテーブル更新 | task-27（downstream）の依存欄に task-23 を追加 |
| Step 2: 新規 interface 追加時のみ | 該当なし（docs-only タスク）|

---

## Task 12-4: documentation-changelog.md

各 Step の実行有無を `done` / `該当なし` で記録する。Phase 12 完了前に `artifacts.json` と `outputs/artifacts.json` の parity を diff で確認。

---

## Task 12-5: unassigned-task-detection.md

| ID | 内容 | 判定 |
|----|------|------|
| U-01 | matrix 評価ロジックの将来スクリプト化（`scripts/verify-matrix.ts`） | 今回は未タスク化しない。task-23 は docs-only matrix を生成済みで、Phase 5/7/9 evidence により現サイクルの完了条件を満たす |

→ 未タスク 0 件として出力し、将来案は `skill-feedback-report.md` の改善メモに留める。CONST_005 により、実施時期・管理場所が確定していない backlog 送りはしない。

---

## Task 12-6: skill-feedback-report.md

| 観点 | 記録 |
|------|------|
| テンプレート改善 | docs-only NON_VISUAL タスクで matrix 単一生成型の専用テンプレートが skill 側にあると速い |
| ワークフロー改善 | 22 × 4 セル評価のような構造化検証は将来スクリプト化したい |
| ドキュメント改善 | 検証 4 条件の定義は他ワークフローでも再利用できる |

---

## Task 12-7: phase12-task-spec-compliance-check.md

`phase12-compliance-check-template.md` の 9 heading に従い、Phase 12 root evidence として残す。
