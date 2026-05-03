# Phase 3: 設計レビュー — 実行記録（実装済 reflect）

## 状態
実施済み。代替案評価と不変条件 touch 検証、設計差分 ADR を確定済。

## 不変条件チェック

| 不変条件 | 確認 | 根拠 |
| --- | --- | --- |
| #1 schema 固定回避 | OK | identity merge メタは admin-managed の独立 3 テーブル。Google Form schema 外。 |
| #3 PII 取扱 | OK | API 応答で `maskResponseEmail()` を使い `u***@example.com` 形式に。merge `reason` は email + 電話 regex で `[redacted]` 置換し最大 500 文字に切り詰め。 |
| #5 D1 直アクセス apps/api 限定 | OK | apps/web は既存 generic proxy `[...path]` 経由のみ。`page.tsx` は `fetchAdmin` server-fetch を使用。 |
| #11 管理者も他人本文を直接編集しない | OK | merge は `identity_aliases` / `identity_merge_audit` への append のみ。`member_responses.*` / `response_fields.*` / `member_status.*` への UPDATE 一切なし（実コード grep で確認）。 |
| #13 admin audit logging | OK | `identity_merge_audit` への独立永続化に加え、`audit_log` にも `identity.merge` を append。dismiss は `identity_conflict_dismissals` に永続化。 |

## 採用案サマリ（PASS）
- 判定基準: `name` + `affiliation` 完全一致 / `trim` + `NFKC` 正規化
- merge tx: `db.batch` で `identity_aliases` + `identity_merge_audit` + `audit_log` を atomic 適用、mock fallback なし
- UI: 二段階確認（`merge-confirm` → `merge-final`） + 別人マーク
- conflict row: 動的 `${source}__${target}` ID、永続テーブルなし
- proxy: generic `[...path]` 流用

## ADR（実装時に発生した設計差分）
- **ADR-01**: conflictId は動的生成、専用テーブルなし → drift 回避 / PK 設計不要
- **ADR-02**: list 入力源を `sync_jobs.error_json` から `member_identities × response_fields` に変更 → 実機データ整合
- **ADR-03**: 二段階確認モーダルを Row 内 stage state に統合 → コンポーネント数削減
- **ADR-04**: web → api proxy は generic `[...path]` 流用 → ファイル数削減
- **ADR-05**: `db.batch` 未対応環境は fail closed → atomic contract 優先

## blocker / approval gate
- 実機 D1 への migration apply は本タスク外（Phase 5 / 11 で扱う）
- production deploy / commit / PR は user 指示まで保留

## 引き渡し
- Phase 4 へ: verify suite と E2E 見送り背景
