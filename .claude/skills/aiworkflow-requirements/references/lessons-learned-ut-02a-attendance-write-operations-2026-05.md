# Lessons Learned: UT-02A Attendance Write Operations Close-out（2026-05）

本 follow-up は新規実装ではなく、既存 06c-E / 07c 実装で AC が全充足していた resolved-by-existing close-out である。Phase 12 outputs（`skill-feedback-report.md` / `implementation-guide.md` / `main.md`）を一次ソースとして、運用上の固有教訓を記録する。

## L-UT02A-WRITE-001: `spec_drafted` 非標準語彙は使わない（`implemented-local` 統一）

### 事象
Phase 12 compliance-check 段階で workflow 状態語彙に `spec_drafted` が紛れ込みかけた。task-specification-creator / task-workflow-active の標準語彙は `spec_created` / `implemented-local` / `implemented` であり、`spec_drafted` は索引・grep 経路で照合不能になる。

### 教訓
implementation close-out は `implemented-local`（runtime evidence pending）または `implemented`（runtime green）に統一する。`spec_drafted` は使用禁止。

### 適用条件
既存実装で AC を充足する resolved-by-existing close-out 全般、および implementation close-out 全般。

### 参照
`docs/30-workflows/completed-tasks/ut-02a-followup-001-attendance-write-operations/outputs/phase-12/skill-feedback-report.md`、`references/task-workflow-active.md`

---

## L-UT02A-WRITE-002: 既存実装で AC 全充足の follow-up は resolved-by-existing close-out として処理

### 事象
UT-02A Phase 12 で起票された attendance write operations follow-up は、起票時点で既に 06c-E / 07c 実装が canonical/legacy route + repository + audit log を満たしており、新規実装仕様にすると重複 / drift の発生源になる。

### 教訓
follow-up が既存実装で AC を全充足している場合、新規実装タスクではなく `resolved-by-existing-<source-task>` ラベル付きの close-out として task-workflow-active と resource-map に登録する。13 phase テンプレ自体は流用するが、Phase 5 ランブックは「既存実装の確認・補強」スコープに限定する。

### 適用条件
follow-up 起票時に AC マトリクス × 実装ファイルの突合で AC 全行が PASS となるケース。

### 参照
phase-12 `skill-feedback-report.md` / `implementation-guide.md`、resource-map.md row 87

---

## L-UT02A-WRITE-003: contract verification のみ完了時は `CONTRACT_ONLY_NOT_EXECUTED` を明記

### 事象
Phase 11 で focused tests / type contract / boundary check のみ実施し、curl / UI smoke を実行していない場合、placeholder を `completed` 扱いにすると runtime PASS と誤認される。

### 教訓
Phase 11 main.md には `CONTRACT_ONLY_NOT_EXECUTED` ステータスを明記し、curl / UI smoke evidence は `NOT_EXECUTED` 境界として 08b / 09a runtime gate へ委譲する。local test evidence と runtime evidence を語彙レベルで分離する。

### 適用条件
Phase 11 で focused tests のみ完了し、staging / production 通電未実施の close-out。

### 参照
`outputs/phase-12/skill-feedback-report.md`「ワークフロー改善」節、Phase 11 main.md

---

## L-UT02A-WRITE-004: outputs strict 7 files / root parity を Phase 0 で確認

### 事象
Phase 12 で outputs 配下の 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）と root / outputs `artifacts.json` の parity が遅延検出されると、close-out 直前の手戻りになる。

### 教訓
Phase 0（実行前）に outputs 7 files の存在チェックと root / outputs `artifacts.json` parity を確認するゲートを置く。close-out 直前ではなく着手前に検出する。

### 適用条件
Phase 12 を含む全 implementation close-out。

### 参照
`outputs/phase-12/skill-feedback-report.md`「ドキュメント改善」節

---

## L-UT02A-WRITE-005: source unassigned 解消と親 detection を close-out root に同時誘導

### 事象
起票元 unassigned task と、親 workflow の `unassigned-task-detection.md` が別ディレクトリに散在し、close-out 後の参照経路が一意にならない。

### 教訓
source unassigned task と親 `unassigned-task-detection.md` の双方に「解消記録」を追記し、close-out workflow root への片方向誘導を行う。historical stub は削除せず、current root と並存させる。

### 適用条件
unassigned-task / 親 workflow detection から起票された follow-up close-out 全般。

### 参照
`outputs/phase-12/unassigned-task-detection.md`、`outputs/phase-12/main.md` §12.4
