# issue-402 follow-up: approve email テンプレへの retention 文言反映

## メタ情報

```yaml
issue_number: 402
```

| 項目         | 内容                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| タスクID     | task-issue-402-approve-email-template-001                                  |
| タスク名     | approve email 通知に retention purge schedule / 7 日復旧境界文言を反映     |
| 分類         | follow-up / user-communication                                             |
| 対象機能     | admin approve 時のユーザー宛 email 通知文言                                |
| 優先度       | Medium                                                                     |
| 見積もり規模 | 小規模                                                                     |
| ステータス   | 未実施                                                                     |
| 発見元       | issue-402 Phase 12 (DF-2 documentation flow / no-op 判定後の文言反映分離)  |
| 発見日       | 2026-05-06                                                                 |

---

## 1. 概要

issue-402 の retention purge 実装で **approve handler は `retentionPurgeScheduledAt` を保持し、7 日後に物理削除** する仕様が確定した。一方、approve 時にユーザーへ送信される email 通知のテンプレートには **retention schedule と 7 日以内なら復旧可能である旨** が未反映。Phase 12 の DF-2 (documentation flow) では「文書面の no-op 判定」のみ行われ、テンプレ文言反映は別タスクとして分離した。

## 2. 背景

approve 後にユーザーが「いつ完全に消えるのか」「キャンセル可能か」を知る経路が email のみ（管理画面はユーザーには見えない）であるため、retention の意味と 7 日復旧境界が文言に含まれていないと運用問い合わせの起点になる。

approve email テンプレの **SSOT パスは未確認**。`apps/api/src/templates/` ディレクトリは現時点で存在しないため、本タスクの先頭で実体配置箇所を特定する必要がある（候補: `apps/api/src/use-cases/`, `apps/api/src/_shared/`, `apps/web/src/...` の Auth.js magic-link テンプレ周辺等）。

## 3. 目的

- approve 時に送信される email テンプレを特定し、
- `retentionPurgeScheduledAt` (= approve 時刻 + 7 日) と「7 日以内なら復旧申請が可能」である旨を文言に追加し、
- ユーザーへの説明責任を満たす。

## 4. スコープ

### 含むもの (in)

- approve email テンプレの実体パス特定（`apps/api/src/` 以下を grep し、`templates/` を新設するか既存ファイルに追記するか判断）
- 文言追加: `retentionPurgeScheduledAt` (ISO 8601 / JST 表記) と 7 日復旧境界
- i18n（日本語のみで運用なら追加不要、英語版があれば両対応）
- email 送信経路の単体/統合テスト更新
- 文言の SSOT 反映（`data-retention-policy.md` §10 もしくは別 §「ユーザー通知文言」節）

### 含まないもの (out)

- retention 期間値の変更（policy 側で確定済）
- approve handler の API contract 変更
- staging / production runtime evidence 取得（別タスク）

## 5. 苦戦箇所として想定される観点

| 項目              | 内容                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSOT 同期         | data-retention-policy.md / approve handler 実装 / email テンプレの 3 点で文言の意味整合が取れる必要がある。期間値が変わったときに連動更新できる設計       |
| 実体配置の未確認  | `apps/api/src/templates/` が存在せず、現状 email 送信経路が user-cases 内のインライン文字列か Auth.js 経由か未確定。先頭フェーズで特定が必要               |
| no-op 判定との境界 | DF-2 で「ドキュメント上は no-op」と判定したが「ユーザー向け通知文言」は別レイヤとして分離した境界条件。本タスクで文言反映の SSOT 化を完成させる              |
| 日付フォーマット  | `retentionPurgeScheduledAt` を UTC ISO のまま見せると一般ユーザーには分かりにくい。JST + 自然文表記（例: 2026年5月13日 12:00 JST まで）が適切            |
| approve 取消経路  | 「7 日以内なら復旧申請が可能」と謳うなら、その申請経路（admin queue 経由 / フォーム経由）を文言で明示する必要がある。経路が未整備なら本タスクの前提崩れ   |

## 6. リスクと対策

| リスク                                                            | 影響度 | 発生確率 | 対策                                                                                                                       |
| ----------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| 文言と policy 期間がズレる                                        | 中     | 中       | テンプレ内で期間を ENV / config から差し込み、policy 側 SSOT を single source とする                                       |
| 復旧経路が文言で謳われているが運用で機能していない                | 高     | 低       | 復旧経路（admin queue or フォーム再送）の現状運用を user 確認のうえ文言化、未整備なら別タスクで先に経路整備                |
| email 送信経路が複数ある（admin manual approve / cron 等）        | 中     | 中       | grep で send の呼び出し箇所を網羅し、approve 経由のみ対象とする境界を明示                                                  |
| 日時表記の time zone 誤り                                         | 中     | 低       | `Asia/Tokyo` 固定の formatter を 1 箇所に置き、テンプレ全体で再利用                                                        |
| i18n 構造を破壊                                                   | 低     | 低       | 既存テンプレが i18n 構造を持つか先に確認し、JA-only ならそのまま、両言語ならキー追加で対応                                 |

## 7. 検証方法

### 受け入れ基準

- approve email テンプレの実体パスが PR で明記されている
- approve email 本文に `retentionPurgeScheduledAt` 相当の日時 (JST 表記) と「7 日以内なら復旧申請可能」旨が含まれる
- テンプレレンダリングの単体テストで文言と日時差し込みが検証される
- `data-retention-policy.md` の通知節と email テンプレの文言が一致
- staging で実 send までは行わなくとも render snapshot が PR に添付されている

### 実行手順（概要）

```bash
# 1. approve email テンプレ実体探索
rg -n "approve|approved" apps/api/src --glob '*.ts' | rg -i "mail|email|sendEmail|notify"
rg -n "retentionPurgeScheduledAt" apps/api/src

# 2. テンプレ実装更新 → 単体テスト追加 → snapshot
mise exec -- pnpm --filter @repo/api test
```

## 8. 関連

- `docs/30-workflows/issue-402-admin-request-retention-physical-delete/outputs/phase-12/documentation-changelog.md`
- `docs/30-workflows/issue-402-admin-request-retention-physical-delete/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/src/routes/admin/requests.ts` (approve handler)
- `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md`
- `apps/api/src/templates/`（実体未確認、本タスク先頭で特定）

## 9. 備考

| 項目 | 内容 |
| ---- | ---- |
| 苦戦箇所 | DF-2 で「ドキュメント面 no-op」と判定した一方で、ユーザー向け文言反映が必要な境界条件があり、no-op だけでは不十分と Phase 12 で再認識した |
| 原因 | documentation flow と user-communication flow の境界が SSOT で分離されていなかった |
| 対応 | 本 follow-up を新設し、user-communication を独立タスクとして起票 |
| 再発防止 | data-retention-policy.md に「ユーザー通知文言」節を新設し、policy 変更時に email テンプレ反映を必須レビュー項目化する |
