# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Google OAuth Staging Smoke + Production Verification 統合 (UT-05A-FOLLOWUP-OAUTH) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート |
| 作成日 | 2026-04-30 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test: staging + production) |
| 状態 | spec_created |
| ゲート種別 | PASS / MINOR / MAJOR の 3 値判定 |
| visualEvidence | VISUAL |
| user_approval_required | false |

## 目的

Phase 1〜9 の全成果物（要件・4 設計成果物・設計レビュー・テスト戦略・実装 runbook・異常系・AC マトリクス・DRY 化・QA）を横断レビューし、**Phase 11 の段階適用 A→B→C を実機で開始してよいか**を最終判定する。MAJOR が 1 件でもあれば Phase 5 runbook へ差し戻し。MINOR は記録の上 Phase 11 へ進めるが Phase 12 の `unassigned-task-detection.md` で必ず追従する。

## 実行タスク

1. Phase 1 true issue と AC-1〜AC-12 が Phase 2〜9 に分解済みか確認する。
2. Phase 5 runbook、Phase 6 failure cases、Phase 7 AC matrix、Phase 8 DRY、Phase 9 security/free-tier 判定を統合評価する。
3. Phase 11 着手前 blocker と open question を整理する。
4. GO / NO-GO / 戻り先 Phase を確定し、Phase 11 へ渡す前提条件を記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 5 | `phase-05.md` | Stage A/B/C runbook |
| Phase 6 | `phase-06.md` | 異常系 / rollback 条件 |
| Phase 7 | `phase-07.md` | AC matrix |
| Phase 8 | `phase-08.md` | DRY / 単一正本確認 |
| Phase 9 | `phase-09.md` | 品質 / free tier / secret hygiene |
| skill | `.claude/skills/task-specification-creator/references/phase-template-phase8-10.md` | Phase 10 最終レビュー gate |

## 真の論点との整合確認

- 「screenshot を取得すること」「verification を申請すること」が目的ではなく、**「`secrets / redirect URI / consent screen / privacy policy / scope` を staging と production で 1 つの正本に統合し、testing user 以外で `/login → /admin/*` まで到達できる状態を再現可能 runbook で固定すること」** が達成可能な状態にあるかを判定する。

## 4条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | B-03 解除と外部 Gmail account login が達成可能。staging smoke の OAuth flow evidence が production 公開前に取得される設計 |
| 実現性 | PASS | 単一 OAuth client / 単一 consent screen 方針が Phase 2 で確定、Cloudflare Secrets 注入は `scripts/cf.sh` で再現可能、verification は project 単位で一回の申請 |
| 整合性 | PASS | 不変条件（D1 直アクセス禁止 / consent キー統一 / responseEmail system field / admin-managed data 分離 / `apps/web` から D1 直アクセス禁止 / GAS prototype 非昇格 / Form 再回答が本人更新の正式経路）すべてに違反しない。本タスクは OAuth 設定のみで D1 / Sheets schema には触らない |
| 運用性 | PASS | runbook 化により dev / staging / production で同手順を再現。verification 待機状態（解除条件 b）も `13-mvp-auth.md` から読み取れる設計 |

**最終判定: GO（PASS）**

## AC × 達成状態（spec_created 視点）

> spec_created 段階の評価基準: 「Phase 1〜9 で具体的に確定し、Phase 5 / Phase 11 で実機実行可能な粒度に分解されているか」。実 staging smoke / production verification は Phase 11 で着手。

| AC | 内容 | 達成状態（spec_created） | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | OAuth client（staging / production）が同一 project / 同一 consent screen / redirect URI matrix と一致 | 仕様確定 | phase-02 §設計成果物 1 | PASS |
| AC-2 | Cloudflare Secrets 3 種が staging / production で `scripts/cf.sh` 経由のみ設定 | 仕様確定 | phase-02 §設計成果物 2 / phase-05 runbook | PASS |
| AC-3 | secrets-placement-matrix.md が `02-auth.md` / `13-mvp-auth.md` から参照 | 仕様確定 | phase-02 §設計成果物 2 / phase-12 Step 1-A | PASS |
| AC-4 | staging smoke 9 ケース（M-01〜M-11 / F-09 / F-15 / F-16 / B-01）PASS + 9 種 evidence 配置 | 未実施だが仕様確定 | phase-11 Stage A | PASS（Phase 11 で確証） |
| AC-5 | `/login?gate=...` redirect / `/admin/*` 非管理者 redirect / admin_users.active 一致時のみ `/admin` 進行 | 未実施だが仕様確定 | phase-11 Stage A の M-04 / F-15 / F-16 | PASS（Phase 11 で確証） |
| AC-6 | consent screen が production publishing / verification submitted（or verified）で screenshot 保存 | 未実施だが仕様確定 | phase-11 Stage B | PASS（Phase 11 で確証） |
| AC-7 | testing user 以外の Gmail account で本番 login smoke PASS | 未実施だが仕様確定 | phase-11 Stage C | PASS（Phase 11 で確証） |
| AC-8 | privacy / terms / homepage URI が production domain で 200 | 仕様確定 | phase-02 §設計成果物 3 / phase-05 runbook 200 確認 | PASS |
| AC-9 | `wrangler login` 不在 / 平文 token 不在 | 仕様確定 | phase-05 / phase-09 secret hygiene | PASS |
| AC-10 | B-03 解除済 or submitted で待機中の状態が `13-mvp-auth.md` から読める | 仕様確定 | phase-12 Task 12-2 Step 1-B | PASS |
| AC-11 | 無料枠運用（Google Cloud / Cloudflare 共に課金 product 非有効化） | 仕様確定 | phase-09 free-tier-estimation.md | PASS |
| AC-12 | 05a Phase 11 placeholder（main.md 等）を本タスク成果物リンクで上書き | 仕様確定 | phase-12 Task 12-2 / Task 12-3 | PASS |

## 代替案の最終確認（Phase 3 継承）

- 案 1（採用）: 単一 OAuth client + 段階適用 A→B→C — **採用継続**
- 案 2（不採用）: staging / production で別 OAuth client / 別 consent screen — verification 二重申請が project 単位制約と整合せず MAJOR
- 案 3（不採用）: testing user 拡大運用のみで verification 申請保留 — B-03 解除されず本番公開不可で MAJOR
- → 採用案に変更なし。Phase 11 は案 1 の段階適用フローで実行する。

## blocker 一覧（Phase 11 実機着手前提）

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| BL-01 | 05a タスク（Auth.js Google provider / admin gate 実装）が completed | 上流タスク | `apps/api/src/routes/auth/*` / admin gate middleware が main 取り込み済み | `git log` / `apps/api/` の存在 |
| BL-02 | Cloudflare staging / production の host 名確定 | 環境 | `apps/web/wrangler.toml` / `apps/api/wrangler.toml` で `[env.staging]` / `[env.production]` の routes が定義済 | wrangler.toml 確認 |
| BL-03 | Google Cloud Console プロジェクトの編集権限 | 権限 | OAuth client / consent screen を編集可能な GCP project 上の admin 権限 | GCP IAM 確認（手動） |
| BL-04 | 1Password に `AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` 登録済 | 環境 | `op://Vault/UBM-Auth/*` パスが解決可能 | `op read` 確認（実値は出力しない） |
| BL-05 | `scripts/cf.sh whoami` が成功 | CLI 環境 | Cloudflare API token が op 経由で注入される状態 | `bash scripts/cf.sh whoami` |
| BL-06 | privacy / terms / homepage が production domain で 200 を返す | サイト | `apps/web` の対応ページが本番 deploy 済 | `curl -I` で 200 確認（Phase 11 Stage B 開始前） |
| BL-07 | 外部 Gmail account（testing user 未登録のもの）が用意されている | テスト前提 | Stage C 用に testing user に含めない Gmail | Phase 11 Stage C 直前確認 |

> BL-01〜BL-06 のいずれかが未充足の場合、Phase 11 の該当 Stage に進めない。BL-07 は Stage C 着手前のみ必要。

## ゲート判定基準

| 判定 | 条件 | 動作 |
| --- | --- | --- |
| MAJOR | 上記 4 条件 / AC / blocker のいずれかで MAJOR | Phase 5（実装 runbook）へ戻す |
| MINOR | MAJOR 0 / MINOR 1 件以上 | Phase 11 へ進めるが Phase 12 `unassigned-task-detection.md` に必ず転記 |
| PASS | MAJOR 0 / MINOR 0 | Phase 11 へ進む |

## Phase 11 進行 GO / NO-GO

### GO 条件（すべて満たすこと）

- [ ] AC-1〜AC-12 すべて PASS（spec_created 視点）
- [ ] 4条件最終判定が PASS
- [ ] blocker BL-01〜BL-06 が解消（BL-07 は Stage C 着手時に再確認）
- [ ] MAJOR が一つもない
- [ ] open question すべてに受け皿 Phase が指定済み
- [ ] 段階適用 A→B→C のゲート条件が phase-02 / phase-11 で一貫

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- AC で PASS でないものがある
- blocker BL-01〜BL-06 の解消条件が未記述または未充足
- MINOR を未タスク化せず本タスク内に抱え込む
- B-03 解除条件 a/b/c の優先順位が確定していない
- 段階適用ゲート条件（A→B→C）が drift している

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | verification verified までの審査期間が本番公開時期に間に合うか | Phase 11 Stage B + Phase 12 changelog | submitted 暫定運用（B-03 解除条件 b）で吸収 |
| 2 | Magic Link provider 追加時の secrets-placement-matrix DRY 化 | Phase 12 unassigned-task-detection | 派生タスク候補 |
| 3 | verification verified 後の B-03 状態クリーンアップ（submitted → verified への記述更新） | Phase 12 unassigned-task-detection | 派生タスク候補 |
| 4 | Cloudflare Workers staging host が production と異なる root domain だった場合の authorized domain 追加 | Phase 11 Stage A 着手時に再確認 | runbook で吸収 |
| 5 | OAuth scope 追加要望（calendar / drive 等）発生時の verification 再申請手順 | 別タスクへ formalize | 本タスクスコープ外 |

## 多角的チェック観点

- 価値性: 段階適用が staging で確証 → production 公開という運用順序として妥当か。
- 実現性: 1 OAuth client / 1 consent screen で staging + production を扱う設計が Google Cloud Console 制約と整合しているか。
- 整合性: secrets-placement-matrix の `op://` 参照が `02-auth.md` / `13-mvp-auth.md` / `environment-variables.md` と一貫しているか。
- 運用性: B-03 解除条件 a > b > c の優先順位が runbook で読み取れるか。
- 認可境界: `/admin/*` gate と admin_users.active が Phase 11 Stage A で実機検証される設計か。
- Secret hygiene: screenshot に token / client_secret が映らない撮影方針が Phase 11 で再掲されているか。

## 統合テスト連携

| 連携先 | 本 Phase の扱い |
| --- | --- |
| Phase 11 manual smoke | GO 判定時のみ Stage A/B/C の実機検証へ進める |
| Phase 12 unassigned detection | NO-GO / open question は Phase 12 の未タスク候補へ引き渡す |
| validator | `validate-phase-output.js` / `verify-all-specs.js` の構造 PASS を Phase 11 前提にする |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-12 達成状態評価 | 10 | spec_created | 12 件すべて PASS |
| 2 | 4条件最終判定 | 10 | spec_created | PASS |
| 3 | blocker BL-01〜BL-07 列挙 | 10 | spec_created | 7 件 |
| 4 | 代替案の最終確認 | 10 | spec_created | 案 1 採用継続 |
| 5 | 段階適用 A→B→C のゲート整合 | 10 | spec_created | phase-02 と一貫 |
| 6 | open question 受け皿 Phase 指定 | 10 | spec_created | 5 件 |
| 7 | GO/NO-GO 判定 | 10 | spec_created | GO |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・AC マトリクス・blocker・4条件・open question |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC-1〜AC-12 全件に達成状態が付与されている
- [ ] 4条件最終判定が PASS
- [ ] blocker 一覧に 7 件すべて解消条件付きで記述
- [ ] 段階適用 A→B→C のゲート条件が phase-02 と一貫
- [ ] MAJOR が一つもないことを確認
- [ ] open question 5 件すべてに受け皿 Phase が指定
- [ ] outputs/phase-10/go-no-go.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` が配置予定
- AC × 4条件 × blocker × 段階適用整合 × open question × GO/NO-GO の 6 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test: staging + production)
- 引き継ぎ事項:
  - GO 判定（spec_created 段階）
  - blocker 7 件（Stage A / B / C 着手前に再確認必須）
  - 段階適用 A→B→C のゲート条件と失敗時 Phase 5 戻り路
  - B-03 解除条件 a > b > c の優先順位
  - open question #1〜#5 を Phase 11 / 12 で消化
  - VISUAL タスクであり screenshot 撮影が一次証跡
- ブロック条件:
  - 4条件のいずれかが MAJOR
  - AC で PASS でないものが残る
  - blocker BL-01〜BL-06 の解消条件が未記述
  - 段階適用ゲートが drift
