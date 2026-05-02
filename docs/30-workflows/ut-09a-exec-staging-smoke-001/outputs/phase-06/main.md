# Phase 6: 異常系検証 — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| phase | 6 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

staging smoke / Forms sync 実行で起こりうる異常系を網羅的に列挙し、各々の
判定基準・evidence 化方針・再実行条件を確定する。

## 実行タスク

1. UI smoke 異常系の列挙とハンドリング定義
2. Forms sync 異常系（409 / schema mismatch / 認証失敗 / lock）の定義
3. Workers tail 取得失敗ケースの定義
4. secret 不足時の中止判断基準
5. 個人情報露出時の即時停止 / redaction 再実行ルール

## 参照資料

- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md
- docs/30-workflows/ut-09a-exec-staging-smoke-001/phase-05.md
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

## 統合テスト連携

- UI / Forms / tail の異常系は Phase 7 AC matrix と Phase 11 evidence path に接続する
- FAIL 時は 09c blocker を維持し、後続 production deploy に進めない

## 異常系一覧

### UI smoke 系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| 公開ルート 5xx | HTTP 5xx / Playwright timeout | trace 保存 → 原因切り分け → 09c blocker 維持 |
| 認証導線失敗 | Magic Link / Google OAuth エラー | screenshot 保存 → ut-05a / ut-27 secret 確認 |
| 認可境界の漏れ | 非管理者で admin route 200 | 即時 FAIL → 09c blocker 維持 → 上位 Issue 起票 |

### Forms sync 系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| 409 重複 | sync_jobs に running record | evidence として記録 → 完了後再実行 |
| lock 解除不能 | lock TTL 超過後も 409 | manual unlock 手順を別タスクで起票 |
| schema mismatch | response_fields 不整合 | 07b schema alias workflow を参照、本タスクは evidence 記録のみ |
| 認証失敗 | 401 / 403 | secret / role 確認、ut-27 へ差し戻し |

### Workers tail 系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| tail 接続不能 | cf.sh tail エラー | 取得不能理由を `wrangler-tail.log` 冒頭に記録 |
| 30 分待てない | 時間制約 | 観測時間を log に明記し、09c は短縮ログを暫定参照 |

### Secret / 個人情報

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| secret 不足 | 必要 secret 未設定 | 即時中止 → ut-27 に差し戻し |
| 個人情報露出 | screenshot に実名 / 連絡先 | 即時削除 → redaction 後に再取得 |
| log に token | tail log に Bearer トークン | log 全体破棄 → redaction script 適用後再取得 |

## 多角的チェック観点

- 異常系を「失敗」ではなく「evidence 化対象」として扱う
- 個人情報露出時は PASS / FAIL 判定より優先で停止する
- secret 不足は 09c GO の前提を崩すため即時中止

## サブタスク管理

- [ ] 各異常系の検出条件と evidence 化フォーマットを記述
- [ ] 09c blocker への影響を case 単位で記述
- [ ] 個人情報露出時の即時停止フローを記述
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md

## 完了条件

- UI / Forms sync / tail / secret / PII の異常系が網羅されている
- 各 case の evidence 化と再実行条件が定義されている
- 09c blocker への影響が case 単位で記述されている

## タスク100%実行確認

- [ ] 異常系を PASS と誤認するルートが残っていない
- [ ] PII 露出時の停止が他判定より優先されている

## 次 Phase への引き渡し

Phase 7 へ、AC マトリクスの前提（異常系含む）を渡す。
