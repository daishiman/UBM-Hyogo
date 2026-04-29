# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-28 |
| 上流 | Phase 2 |
| 下流 | Phase 4 (テスト作成) |
| 状態 | pending |
| user_approval_required | **true** |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |
| 元タスク | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/` |

## 目的

Phase 2 で確定した topology / validation-path を、**実機反映前の最終ゲート**としてレビューする。
特に:

1. 必須前提タスク 2 件の完了結果を取り込み、`bypassPermissions` + `permissions.deny` 併用の **実効性結論**を確定
2. グローバル `~/.claude/settings.json` 変更が他 project / 他 worktree に与える **波及範囲**を網羅評価
3. Phase 4 着手の Go/No-Go を user 承認込みで決める

## 入力

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 2 topology | `outputs/phase-02/topology.md` | レビュー対象 diff |
| Phase 2 validation-path | `outputs/phase-02/validation-path.md` | レビュー対象検証パス |
| Phase 1 inventory | `outputs/phase-01/inventory.md` | 他 project 影響範囲の元データ |
| Phase 1 carry-over | `outputs/phase-01/carry-over.md` | 必須前提タスク状態 |
| 必須前提タスク #1 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001*` | bypass + deny 実効性の確定結果 |
| 必須前提タスク #2 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001*` | project-local-first 比較結論 |
| 元タスク Phase 3 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/phase-03.md` | レビュー観点 R-1〜R-4 の継承元 |

## レビュー観点

### R-1: グローバル settings 変更の波及範囲

| 確認項目 | 判定基準 |
| --- | --- |
| 他 project / 他 worktree で `defaultMode` を override しているか | Phase 1 inventory の grep 結果を全件レビュー |
| `defaultMode` 未定義の他リポジトリで bypass が常時適用される副作用 | リスト化し、許容可否を user 承認として記録 |
| `permissions.allow` / `deny` がグローバル `~/.claude/settings.json` に **追記されていない**こと | 案 A でも whitelist は project 層のみ |

### R-2: `--dangerously-skip-permissions` + `permissions.deny` 実効性

- 必須前提タスク `task-claude-code-permissions-deny-bypass-verification-001` の結論を取り込む
- 実効する場合: 「deny は保険として機能する」と明示
- 実効しない場合: 「deny を保険前提とする記述」を `topology.md` から削除し、案 B（project-local-first）にフォールバック判定

### R-3: project-local-first 比較

- 必須前提タスク `task-claude-code-permissions-project-local-first-comparison-001` の結論を取り込み、案 A 採用で問題ないかを再確認
- project-local-first が優位と判定された場合は **案 A 棄却 → 元タスク Phase 2 にループバック**

### R-4: whitelist 衝突

- Phase 1 inventory の既存 `permissions.allow` / `deny` と Phase 2 設計の差分が 0 件、または全衝突に解消方針が決まっていること

### R-5: 不変条件レビュー（CLAUDE.md 準拠）

- [ ] グローバル変更の波及が `impact-analysis.md` に明文化されている
- [ ] 平文 `.env` / API token / OAuth token がドキュメント・log に記録されていない
- [ ] `wrangler` 直接実行禁止ルールに違反していない（本タスクでは Cloudflare CLI を実行しない。不変条件として grep で確認）
- [ ] `~/Library/Preferences/.wrangler/config/default.toml` の OAuth トークン残置を持ち込まない

## 手順

1. **必須前提タスク完了確認**:
   - `deny-bypass-verification-001` / `project-local-first-comparison-001` の最終結論セクションを読み、`impact-analysis.md` の「前提タスク結論サマリ」に転記
   - **未完了の場合は本 Phase で No-Go 判定**（Phase 4 へ進めない）
2. **R-1 波及範囲評価**:
   - Phase 1 inventory の他 project `defaultMode` 走査結果を `impact-analysis.md` の「他 project 影響範囲」表に展開
   - 各 project ごとに「現値」「案 A 適用後の実効値」「許容/不許容」を判定
3. **R-2 実効性結論**:
   - `deny-bypass-verification-001` 結論を取り込み、`impact-analysis.md` に「deny 実効性: 実効する / しない」を記録
   - 実効しない場合は案 B フォールバック判定を `go-no-go.md` に Note
4. **R-3 project-local-first 結論**:
   - `project-local-first-comparison-001` 結論を取り込み、`impact-analysis.md` に「採用案 A 維持 / 案 B フォールバック」を記録
5. **R-4 whitelist 衝突確認**:
   - Phase 1 inventory の現値と Phase 2 設計の diff を取り、衝突件数を `impact-analysis.md` に記録
6. **R-5 不変条件チェック**:
   - 上記チェックリスト 4 項目をすべて確認し `impact-analysis.md` に PASS/FAIL を記載
7. **Go/No-Go 判定** (`go-no-go.md`):
   - 必須前提タスク 2 件: 完了 (Y/N)
   - R-1〜R-5: PASS/FAIL
   - user 承認: 取得 (Y/N)
   - 上記すべて Y / PASS の場合のみ **Go**
   - 1 件でも N / FAIL ならば **No-Go** とし、ループバック先 Phase（1 or 2）を明示
8. **user 承認の取得**:
   - `go-no-go.md` の最終判定を user に提示し、明示承認を得る（artifacts.json の `user_approval_required: true` と整合）

## 成果物

`artifacts.json` の Phase 3 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-03/main.md` | レビュー結論サマリ。R-1〜R-5 の判定一覧、採用案最終確定、Phase 4 着手可否 |
| `outputs/phase-03/impact-analysis.md` | 必須前提タスク 2 件の結論サマリ、他 project 影響範囲表、R-1〜R-5 判定詳細、不変条件チェックリスト結果 |
| `outputs/phase-03/go-no-go.md` | 必須前提タスク完了状態 / R-1〜R-5 PASS-FAIL / user 承認 の 3 軸マトリクスと最終 Go/No-Go 判定。No-Go の場合はループバック先 Phase を明示 |

## 完了条件

- [ ] `impact-analysis.md` に必須前提タスク 2 件の結論が転記されている
- [ ] `impact-analysis.md` に他 project 影響範囲が全件評価されている
- [ ] R-1〜R-5 すべてに PASS/FAIL 判定が記録されている
- [ ] R-5 不変条件チェック（グローバル波及 / `.env` 平文禁止 / wrangler 直接実行禁止 / OAuth トークン残置禁止）がすべて PASS
- [ ] `go-no-go.md` に Go/No-Go の最終判定が明示されている
- [ ] **user 承認**が取得されている（`go-no-go.md` 末尾に承認記録）
- [ ] artifacts.json の `phases[2].outputs` および `user_approval_required: true` と本 Phase 成果物が完全一致する

## 検証コマンド

```bash
# 必須前提タスクの完了確認（completed-tasks 配下に存在するか）
ls docs/30-workflows/completed-tasks/ | grep -E 'deny-bypass-verification-001|project-local-first-comparison-001'

# 他 project 影響範囲の再走査（Phase 1 と整合確認）
grep -rln '"defaultMode"' ~/dev 2>/dev/null | wc -l

# Phase 2 設計成果物の存在確認
test -f outputs/phase-02/topology.md && test -f outputs/phase-02/validation-path.md && echo "Phase 2 成果物 OK"
```

## 依存 Phase

- 上流: Phase 2（topology.md / validation-path.md）
- 上流（参照）: Phase 1（inventory.md / carry-over.md）
- 上流（外部）: 必須前提タスク 2 件の completed 状態
- 下流: Phase 4（Go 判定された場合のみ）

## 想定 SubAgent / 並列性

- 単一 agent で直列実行（レビューゲートのため並列化不可）
- 必須前提タスク 2 件の結論読み取りのみ並列化可

## ゲート判定基準

- 必須前提タスク 2 件が **両方 completed** かつ R-1〜R-5 全 PASS かつ user 承認済の場合のみ **Phase 4 着手 Go**
- いずれか欠ける場合は **No-Go**:
  - 必須前提タスク未完了 → 当該タスク完了まで block（本タスク pending）
  - R-1〜R-4 FAIL → Phase 2 にループバック
  - R-5 FAIL → 設計修正のため Phase 2 にループバック
  - user 承認なし → 提示 + 待機

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 必須前提タスク未完了で見切り発車 | `go-no-go.md` の判定マトリクスで明示的に block |
| グローバル波及の見落とし | Phase 1 inventory の grep 結果を全件 `impact-analysis.md` に転記し、各 project ごとに許容/不許容を user に確認 |
| `permissions.deny` 実効性誤認 | `deny-bypass-verification-001` の **実機検証結論**を一次ソースにする。推測で「実効する」と書かない |
| user 承認の取り漏れ | `go-no-go.md` 末尾に承認欄を必須化、未承認なら Phase 4 着手を block |
| 不変条件違反（`.env` 実値混入等） | R-5 チェックリストを Phase 3 完了条件に組み込み、漏れた場合は Phase 2 にループバック |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
