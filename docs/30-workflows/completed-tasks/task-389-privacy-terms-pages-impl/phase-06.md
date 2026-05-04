# Phase 6: 法務レビュー反映フロー — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 6 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

法務レビュー結果を本番文面に反映する経路を固定し、暫定 → 確定の差分管理ルールを定義する。

## レビュー対象

- `/privacy` 6 セクション + 連絡先 + 改定日
- `/terms` 6 セクション + 連絡先 + 改定日

## レビュー観点 (チェックリスト)

| ID | 観点 |
| --- | --- |
| LR-1 | 個人情報保護法 17 条（利用目的の特定）の記載がある |
| LR-2 | 第三者提供の制限（法 27 条）の記載がある |
| LR-3 | 開示・訂正・削除請求の窓口が明示されている |
| LR-4 | Cookie / アクセスログ取扱の言及がある（Cloudflare Analytics 等） |
| LR-5 | 改定通知方法が明示されている |
| LR-6 | 利用規約: 禁止事項 / 免責 / 退会 / 反社条項の有無確認 |
| LR-7 | 連絡先（Form 再回答 URL）が機能している |

## 反映フロー

1. 法務 → 修正コメント受領（`outputs/phase-06/legal-review-feedback.md` に記録）
2. `apps/web/app/{privacy,terms}/page.tsx` を Edit で更新
3. `__tests__/page.test.tsx` の必須セクション期待値を同期更新
4. 改定日を更新（`<p>最終改定日: YYYY-MM-DD</p>`）
5. Phase 5 Step 4-8 を再実行（local test → staging → production deploy）
6. `outputs/phase-11/legal-review-note.md` に「確定文面適用済」を記録

## 暫定 → 確定 の sequence

| 状態 | 期待 evidence |
| --- | --- |
| 暫定文面 deploy 済 | `manual-smoke-log.md` に "interim wording" と注記 |
| 確定文面 deploy 済 | `legal-review-note.md` に法務承認日と reviewer を記録 |

## CONST_007 例外明記

法務確定文面は外部依存（人的レビュー）のため、**暫定文面 deploy（AC-1〜AC-4 達成）**と**確定文面差替**は同一サイクル内の連続 PR として扱う。先送り（別サイクル）にはしない。

## 完了条件

- [ ] レビュー観点が固定されている
- [ ] 反映 sequence が明示されている
- [ ] `outputs/phase-06/main.md` を作成する
