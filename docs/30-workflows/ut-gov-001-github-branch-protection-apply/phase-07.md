# Phase 7: AC マトリクス（受入条件 × Phase 1-13 マッピング）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化 (ut-gov-001-github-branch-protection-apply) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス（親仕様 AC-1〜8 + 設計追加 AC を Phase 1-13 にマッピング） |
| 作成日 | 2026-04-28 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending（仕様化のみ完了） |
| タスク種別 | implementation / NON_VISUAL / github_governance |

## 目的

親仕様 §2.2 の AC-1〜8（snapshot / payload 正規化 / contexts 同期 / dry-run / dev・main 独立 PUT / rollback double-apply / enforce_admins rollback / CLAUDE.md 整合）と、Phase 1〜3 の設計確定で追加した AC-9〜14（branch サフィックス分離 / lock_branch=false / GET→PUT 差異 / UT-GOV-004 3 重明記 / 4 条件 PASS / Phase 1-13 完全一致）を、Phase 1〜13 のどこで・どの T（Phase 4 / 6 由来）/ どの成果物で・どう満たすかを **マトリクスとして固定する**。本 Phase は AC の追跡可能性確保のみで、実走を伴わない。

## 実行タスク

- タスク1: AC-1〜14 を一覧化し、対応 Phase / 成果物 / T を 1:N でマッピングする。
- タスク2: 親仕様 AC-1〜8 と設計追加 AC-9〜14 を出典付きで分離する。
- タスク3: Phase 7 で「空セルなし」「未消化 AC なし」を確認する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md §2.2 | 親仕様 AC-1〜8 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/index.md §受入条件 | AC-1〜14（追加 AC 含む） |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-04.md | T1〜T5（happy path） |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-06.md | T6〜T11（fail path） |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-02/main.md | adapter / state ownership |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-07.md | フォーマット参照 |

## 実行手順

1. 親仕様 §2.2 の AC-1〜8 を写経する。
2. index.md の AC-9〜14（設計追加分）を写経する。
3. AC × Phase × T × 成果物 を 1:N で表にする（空セル無し）。
4. 未消化 AC が無いことを Phase 9 / 10 ゲート入力として確認する。

## 統合テスト連携

Phase 9（品質保証）/ Phase 10（最終レビュー）の GO/NO-GO 判定で、本 Phase の AC マトリクスを再利用する。AC ↔ T ↔ 成果物の 3 軸対応関係が空欄なく埋まっていることが Phase 10 通過条件。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-07/main.md | AC-1〜14 × Phase 1〜13 × T1〜T11 × 成果物 マッピング |
| メタ | artifacts.json `phases[6].outputs` | `outputs/phase-07/main.md` |

## AC 一覧（出典付き）

### 親仕様 AC（UT-GOV-001-github-branch-protection-apply.md §2.2）

| ID | 内容 |
| --- | --- |
| AC-1 | 適用前の dev / main 現行 protection が `gh api` で取得され、snapshot として保全 |
| AC-2 | 草案 JSON が PUT schema に正規化された adapter 出力として保存 |
| AC-3 | `required_status_checks.contexts` には UT-GOV-004 同期済みのみ含まれる |
| AC-4 | dry-run（差分プレビュー）で intended diff がレビュー承認 |
| AC-5 | dev / main それぞれ PUT 成功 / 応答 JSON が applied として保存 |
| AC-6 | rollback リハーサル（double-apply）完了 |
| AC-7 | `enforce_admins=true` 適用時の rollback 担当者・経路が記録 |
| AC-8 | CLAUDE.md ブランチ戦略と GitHub 実値が一致 |

### 設計追加 AC（index.md §受入条件）

| ID | 内容 |
| --- | --- |
| AC-9 | payload / snapshot / rollback / applied が `{branch}` サフィックス分離（bulk 化禁止 / §8.5） |
| AC-10 | `lock_branch=false` 明示 / 有効化は別タスクで freeze runbook とセット（§8.3） |
| AC-11 | GET 応答 ↔ PUT payload field 差異が adapter で正規化（§8.1） |
| AC-12 | UT-GOV-004 完了が Phase 1 / 2 / 3 の 3 箇所で重複明記 |
| AC-13 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 と Phase 3 で PASS |
| AC-14 | Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致（Phase 1〜3 = completed / Phase 4〜13 = pending） |

## 完了条件

- [ ] AC-1〜14 が `outputs/phase-07/main.md` に写経されている
- [ ] AC × Phase の対応マトリクスが空セル 0
- [ ] AC × T（T1〜T11）の対応マトリクスで全 AC が最低 1 件の T で被覆
- [ ] AC × 成果物の対応マトリクスで全 AC が最低 1 件の成果物に紐付く
- [ ] 親仕様 AC-1〜8 と設計追加 AC-9〜14 が出典付きで分離記述

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
test -f docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-07/main.md
rg -c "^\| AC-(1[0-4]|[1-9]) " docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-07/main.md
# => 14 以上（AC-1〜14 の行が全件存在）
```

## 苦戦防止メモ

1. **空セルゼロを機械チェック**: 1 セルでも空だと Phase 9 / 10 で再掘り起こしが発生する。Phase 7 完了時に `rg "\| - \|"` 等で「-」セルを再点検。
2. **AC-12（3 重明記）の自己検証**: 本 Phase 自身は明記対象ではないが、Phase 1 / 2 / 3 で重複明記された箇所を 3 行とも引用する。
3. **AC-3 / AC-11 は T2 と T7 / T11 で挟む**: happy path（T2）+ fail path（T7 / T11）の両側で被覆していることを表で示す。
4. **AC-7 は T8 + apply-runbook.md 記載**: テスト被覆だけでなく runbook 記載が要件。マトリクスで両者を併記。
5. **本 Phase は実走しない**: マッピング作業のみ。

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC-1〜14 × Phase 1-13 × T1〜T11 × 成果物 の対応マトリクスを Phase 9 / 10 GO/NO-GO 判定の根拠に再利用
  - 未消化 AC が無いことを Phase 8 DRY 化レビューでも再確認
- ブロック条件:
  - AC × Phase / AC × T / AC × 成果物 のいずれかで空セル
  - 親仕様 AC-1〜8 のうち被覆漏れ
  - AC-12（3 重明記）の引用箇所が 3 箇所揃わない
