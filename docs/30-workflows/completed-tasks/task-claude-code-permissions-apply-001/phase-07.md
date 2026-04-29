# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認（concern × dependency edge マトリクス） |
| 作成日 | 2026-04-28 |
| 上流 | Phase 6（fail-path / regression 補強完了） |
| 下流 | Phase 8（リファクタリング） |
| 状態 | blocked（Phase 6 完了まで着手禁止） |
| user_approval_required | false |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |

## 目的

Phase 4-6 で確定した TC が、本タスクの **3 つの concern** をどの程度カバーしているかを
**concern × dependency edge** マトリクスで可視化し、未カバー edge があれば Phase 6 に追加注入をループバック判定する。
本タスクは host 環境編集であり、xUnit カバレッジツールではなく **手動 TC マッピング表**として記述する。
[Feedback BEFORE-QUIT-002] に従い、対象範囲は **本タスクで変更したファイル / エントリのみ**とし、それ以外は対象外として明示除外する。

## 入力

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 4 test-scenarios | `outputs/phase-04/test-scenarios.md` | Happy path TC リスト |
| Phase 4 expected-results | `outputs/phase-04/expected-results.md` | 期待値定数と TC マッピング |
| Phase 5 runbook-execution-log | `outputs/phase-05/runbook-execution-log.md` | 反映済み edge の確認元 |
| Phase 5 backup-manifest | `outputs/phase-05/backup-manifest.md` | 変更ファイルスコープの確定 |
| Phase 6 fail-path-tests | `outputs/phase-06/fail-path-tests.md` | Fail / Regression TC リスト |
| Phase 2 topology | `outputs/phase-02/topology.md` | concern と edge の元定義 |

## カバレッジ対象範囲（[Feedback BEFORE-QUIT-002] 反映）

### 対象（in-scope）

- **Concern A: settings 3 層**
  - edge A1: `~/.claude/settings.json` の root `defaultMode`
  - edge A2: `~/.claude/settings.local.json` の root `defaultMode`
  - edge A3: `<project>/.claude/settings.json` の root `defaultMode`
- **Concern B: cc alias**
  - edge B1: `~/.zshrc`（または zsh conf.d 該当）の `alias cc=` 1 行
  - edge B2: 他 zsh conf に古い alias が残っていないこと
- **Concern C: project whitelist**
  - edge C1: `<project>/.claude/settings.json` の `permissions.allow` 配列
  - edge C2: `<project>/.claude/settings.json` の `permissions.deny` 配列
  - edge C3: `<project>/.claude/settings.local.json`（必要 project のみ存在確認）

### 対象外（out-of-scope）

- bypass モード下の `permissions.deny` 実効性（前提タスク `deny-bypass-verification-001` 結論を引用するのみ）
- MCP server / hook の permission 挙動
- `Edit` / `Write` の whitelist 化（元タスク Phase 10 MINOR 保留）
- enterprise managed settings
- 本タスクで変更していないファイル / エントリ全般

## マトリクス様式（`coverage-matrix.md` に展開）

| Concern | Edge | TC-01 | TC-02 | TC-03 | TC-04 | TC-05 | TC-F-01 | TC-F-02 | TC-R-01 | カバー判定 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | A1 (`~/.claude/settings.json` defaultMode) | ✅ | - | - | - | - | ✅ | - | - | Covered |
| A | A2 (`~/.claude/settings.local.json` defaultMode) | - | ✅ | - | - | - | - | - | - | Covered |
| A | A3 (`<project>/.claude/settings.json` defaultMode) | - | - | ✅ | - | - | - | - | - | Covered |
| B | B1 (alias 1 行) | - | - | - | ✅ | - | - | ✅ | - | Covered |
| B | B2 (他 zsh conf 残置なし) | - | - | - | - | - | - | - | ✅ | Covered |
| C | C1 (`permissions.allow`) | - | - | ✅ | - | - | - | - | - | Covered |
| C | C2 (`permissions.deny`) | - | - | ✅ | - | (引用) | - | - | - | Covered（実効性は前提タスク結論引用） |
| C | C3 (`<project>/.claude/settings.local.json` 存在) | - | - | ✅ | - | - | - | - | - | Covered |

> 上記は **template**。実際の○×は Phase 4-6 の確定結果に基づき更新する。

## 手順

1. **対象範囲確定**:
   - Phase 5 `backup-manifest.md` の 4 ファイルおよび Phase 5 で新規作成した `<project>/.claude/settings.local.json` を **in-scope** リストとして `coverage-matrix.md` 冒頭に列挙
   - それ以外は out-of-scope として明示除外
2. **concern と edge の列挙**:
   - 上記「対象」の 3 concern × 8 edge を `coverage-matrix.md` の row として展開
3. **TC マッピング**:
   - Phase 4 / Phase 6 で確定した TC を column に並べ、各 edge × TC で ○ / - を記入
   - TC-05 は前提タスク結論の引用扱いとして「(引用)」マーク
4. **未カバー edge の検出**:
   - すべての edge で最低 1 つの ○ があることを確認
   - ない場合は **Phase 6 にループバック**して fail-path / regression TC を追加注入
5. **out-of-scope 明示**:
   - 「対象外」セクションを `coverage-matrix.md` 末尾に列挙し、根拠（前提タスク委譲 / 元タスク MINOR 保留 等）を併記
6. **サマリ作成**:
   - `main.md` に「全 edge: 8、Covered: N、Uncovered: 0、out-of-scope: 4」のような集計を記載

## 成果物

`artifacts.json` の Phase 7 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-07/main.md` | Phase 7 サマリ。in-scope / out-of-scope 範囲、edge 集計、Uncovered の有無、Phase 8 着手可否 |
| `outputs/phase-07/coverage-matrix.md` | concern × edge × TC マトリクス、in-scope ファイルリスト、out-of-scope 明示、未カバー edge があればループバック先 |

## 完了条件

- [ ] in-scope ファイル / エントリが `coverage-matrix.md` 冒頭に列挙されている
- [ ] 3 concern × 8 edge が row として展開されている
- [ ] TC-01〜TC-05 / TC-F-01 / TC-F-02 / TC-R-01 が column として並んでいる
- [ ] すべての edge で **Covered**（○ が 1 つ以上、または前提タスク引用）が確認されている
- [ ] out-of-scope 4 項目が明示除外されている
- [ ] `main.md` に edge 集計と Phase 8 着手可否が記載されている
- [ ] artifacts.json `phases[6].outputs` と本 Phase 成果物が完全一致

## 検証コマンド

```bash
# in-scope ファイルの存在確認
ls -la ~/.claude/settings.json ~/.claude/settings.local.json 2>/dev/null
ls -la "$PWD/.claude/settings.json" "$PWD/.claude/settings.local.json" 2>/dev/null
ls -la ~/.zshrc

# coverage-matrix.md に Uncovered が無いことを簡易確認
grep -E '\bUncovered\b' outputs/phase-07/coverage-matrix.md && echo "未カバー検出" || echo "全カバー OK"
```

## 依存 Phase

- 上流: Phase 4（test-scenarios / expected-results）/ Phase 5（runbook-execution-log / backup-manifest）/ Phase 6（fail-path-tests）
- 下流: Phase 8（リファクタリング）

## 想定 SubAgent / 並列性

- 単一 agent で直列実行
- coverage-matrix.md と main.md を別 agent で並列作成可（依存薄）

## ゲート判定基準

- すべての in-scope edge が Covered の場合のみ Phase 8 着手可
- Uncovered edge が 1 件でもある場合 → **Phase 6 にループバック**して TC 追加
- in-scope の特定 / out-of-scope 除外に user 観点の判断が必要な場合は本 Phase 内で確認

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Coverage を過大評価し out-of-scope を含めてしまう | [Feedback BEFORE-QUIT-002] 反映として「変更したファイル / エントリ以外は対象外」を冒頭で明文化 |
| TC-05 を Cover 扱いすべきか曖昧 | 「(引用)」マークで前提タスク結論引用とし、独自検証はしない |
| Uncovered 検出忘れで Phase 8 へ進む | 完了条件で全 edge Covered を必須化、検証コマンドで grep |
| 必要 project を見落とす | Phase 5 `backup-manifest.md` を一次ソースとし、それ以外は in-scope に含めない |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
