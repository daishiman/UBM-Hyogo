# Skill Feedback Report — task-specification-creator

本 task 08a 実行を通じて見出した、`task-specification-creator` skill への改善提案。

## 1. 提案サマリ

| # | 提案 | 重要度 | 理由 |
| --- | --- | --- | --- |
| 1 | 4 軸 verify suite テンプレ（contract / authz / type / lint）を skill resource に追加 | High | 30 endpoint × 6〜7 ケース等のスケール感が phase-04 で毎回再発見になっている |
| 2 | msw handler テンプレを skill resource に同梱 | High | Phase 5 runbook で msw 設定が個別記述になり、handler 漏れリスクが高い |
| 3 | coverage 閾値テンプレ（85/80）と未達時の補強導線を Phase 11/12 テンプレに明記 | High | 本 task で AC-6 (-0.82pt) 未達。view-model に責務委譲済みの層が coverage 計測対象になる罠を skill 側で警告すべき |
| 4 | 「spec_created タスク」専用テンプレ（specs 本体無変更 + 提案差分のみ）を Phase 12 system-spec-update に追加 | Medium | metadata.taskType を skill が拾えるようにし、誤って specs 直接編集を促さない |
| 5 | 不変条件 trace を AC matrix と compliance-check の双方に複製している重複を簡素化 | Low | Phase 7 ac-matrix と Phase 12 compliance-check で 2 重管理になりがち |
| 6 | `@ts-expect-error` 観測 test の packages 横断スコープ判定 helper を skill に追加 | Medium | 本 task は apps/api 単独のため type test が N/A になる判定を毎回手で書いている |
| 7 | implementation / NON_VISUAL で AC 未達がある場合、Phase 11/12/artifacts を `partial` に落とす close-out ルールを追加 | High | 本 task で coverage 未達のまま completed 表記になり、後続 09a/09b の gate が false positive になりかけた |

## 2. 詳細提案

### 提案 1: 4 軸 verify suite テンプレ

skill resource として以下を提供:

```
references/
├── verify-suite-templates/
│   ├── contract.spec.template.ts      # 6〜7 ケース版
│   ├── authz-matrix.spec.template.ts  # role × endpoint 行列
│   ├── repository.spec.template.ts    # D1 binding 経由
│   ├── type.spec.template.ts          # @ts-expect-error
│   └── lint.spec.template.ts          # ESLint custom rule 検査
```

これにより phase-04 / phase-05 / phase-07 の三所で signature を再発明しなくて済む。

### 提案 2: msw handler テンプレ

```
references/msw-handlers/
├── google-forms.handlers.ts    # Google Form API のモック handler
├── google-oauth.handlers.ts    # Auth.js 経由 OAuth
└── _co-located-policy.md       # handler は test と co-located 配置
```

Phase 10 §5 で「msw handler co-located 配置」を skill 改善として挙げたが、テンプレ提供まで踏み込むと事故率が下がる。

### 提案 3: coverage 未達時の補強導線

skill が Phase 11 で coverage 結果を記述する際、自動で:
- 未達指標を列挙
- per-file Stmts < 50% のファイルを抽出
- それらのファイルへの test 追加 or coverage.exclude を Phase 12 unassigned-task に転記

までを実施すべき。本 task では人手でこの作業をしている。

### 提案 4: spec_created タスク専用テンプレ

`metadata.taskType === "spec_created"` の場合、Phase 12 の `system-spec-update-summary.md` テンプレが「specs 本体は無変更」を冒頭に明記する形に固定化されるとよい。

### 提案 7: AC 未達時の partial close-out

implementation / NON_VISUAL task では、UI screenshot が不要でも API / coverage / contract gate は独立して判定する。Phase 11 の test execution が PASS でも coverage や contract inventory が未達なら、以下をテンプレートで固定する:

- `artifacts.json.metadata.workflow_state = "partial"`
- 該当 Phase status を `partial`
- Phase 12 compliance は「ドキュメント成果物」と「タスク全体 gate」を分離
- High 影響の残課題は `docs/30-workflows/unassigned-task/` に formalize

## 3. その他の所見

- Phase 12 の中学生レベル概念説明（implementation guide Part 1）は本 task では「契約書 / 鍵付き扉 / 設計図 / 部品検査 / 合格点」の 5 例えで整理した。skill にこの例え話をライブラリとして持つと再利用しやすい。
- `unassigned-task-detection.md` の最低 3 件要件は、low 重要度の項目が水増しになりがち。**重要度別下限（High ≥ 1, Medium ≥ 1）** へ仕様変更を提案。

## 4. なし扱いの項目

なし。すべて改善提案として有効。
