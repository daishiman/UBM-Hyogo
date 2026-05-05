# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker 名分離に伴う route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-04-30 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト作成 / 縮退: doc レビュー観点設計) |
| 状態 | spec_created |
| user_approval_required | true |
| タスク分類 | docs-only / infrastructure-verification（design review） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 要件（4 領域 R1〜R4 の AC マトリクス・スコープ・制約）と Phase 2 設計（Worker inventory / route / secret / observability / 旧 Worker 処遇 / runbook 配置 / 検証コマンド一覧 / テスト縮退方針）を、以下 5 観点でレビューし、Phase 4 以降に進めるかをユーザー承認付きでゲートする。

1. AC カバレッジ（AC-1〜AC-5 が Phase 2 設計でどの章に対応しているか）
2. CLAUDE.md `Cloudflare 系 CLI 実行ルール` 整合（`wrangler` 直接実行禁止）
3. aiworkflow-requirements `deployment-cloudflare.md` 整合
4. production deploy 実行 / DNS 切替 / 旧 Worker 物理削除を **含まない** スコープ境界
5. rollback 余地（旧 Worker 早期削除禁止）

## 実行タスク

1. Phase 1 AC と Phase 2 設計の対応をレビューする。
2. Cloudflare CLI wrapper / secret hygiene / production mutation 禁止の境界を確認する。
3. Phase 4 以降へ進めるかを GO / NO-GO で判定する。
4. ユーザー承認が必要な実オペレーションを Phase 10 / Phase 13 へ引き渡す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 入力 | `phase-01.md` | AC / scope |
| 入力 | `phase-02.md` | design details |
| 正本 | `.claude/skills/task-specification-creator/references/phase-templates.md` | review gate structure |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | approved design を検証ケースへ展開 |
| Phase 10 | final review gate で同じ承認境界を再確認 |

## レビュー観点

### O-1: AC カバレッジ

| AC | Phase 2 対応章 | カバレッジ判定 |
| --- | --- | --- |
| AC-1: 4 領域 checklist の runbook 追記 | §7 runbook 配置設計 + §1〜§4 各章雛形 | 完全カバー |
| AC-2: secret list snapshot + 想定差分 0 | §3 secret snapshot / 再注入設計 | 完全カバー |
| AC-3: route が新 Worker を指す確認 | §2 route / custom domain 突合設計 | 完全カバー |
| AC-4: deploy 直後 tail 手順 | §4.1 Tail（deploy はユーザー承認後別タスク） | 完全カバー |
| AC-5: 旧 Worker 処遇判断記録 + rollback 余地原則 | §5 旧 Worker 処遇判断フロー | 完全カバー |

### O-2: CLAUDE.md `Cloudflare 系 CLI 実行ルール` 整合

| チェック項目 | 期待 | Phase 2 反映箇所 | 判定 |
| --- | --- | --- | --- |
| `wrangler` 直接実行禁止 | 全コマンドが `bash scripts/cf.sh` 経由 | §8 検証コマンド一覧 / §1〜§4 全コマンド | PASS |
| `wrangler login` 禁止 | op 経由 API Token のみ | §10 セキュリティ | PASS |
| `.env` 実値の Read 禁止 | op 参照のみ | §10 セキュリティ | PASS |
| API Token / OAuth Token 転記禁止 | 出力に値を残さない | §10 セキュリティ + §3.5 値漏洩防止 | PASS |

### O-3: aiworkflow-requirements `deployment-cloudflare.md` 整合

| チェック項目 | 期待 | Phase 2 反映箇所 | 判定 |
| --- | --- | --- | --- |
| デプロイは `bash scripts/cf.sh deploy` 経由 | runbook 例も全て ラッパー記法 | §8 #5 / §7.2 章立て note | PASS |
| migration / secret / tail も ラッパー経由 | 全コマンド ラッパー記法 | §8 検証コマンド一覧 | PASS |
| 旧 Worker rename 時の検証手順は規約に従う | 4 領域チェックリスト形式 | §1〜§4 設計 | PASS |

### O-4: スコープ境界

| 含まない項目 | Phase 2 / Phase 1 反映箇所 | 判定 |
| --- | --- | --- |
| production deploy 実行 | §8 #5 のコメントアウト記述 + Phase 1 C-4 | PASS |
| DNS 切替 | Phase 1 スコープ「含まないもの」+ §5 判断フロー備考 | PASS |
| staging 同等確認 | Phase 1 スコープ「含まないもの」 | PASS |
| secret 値の新規発行 | Phase 1 スコープ「含まないもの」+ §3 「再注入のみ」 | PASS |
| 旧 Worker 物理削除実行 | Phase 1 C-5 + §5 判断フロー（実行は別承認） | PASS |

### O-5: rollback 余地

| チェック項目 | 期待 | Phase 2 反映箇所 | 判定 |
| --- | --- | --- | --- |
| 旧 Worker の早期削除禁止 | 「新 Worker 安定確認まで残置」原則 | §5 判断フロー + Phase 1 C-5 | PASS |
| 削除実行の責任分離 | 別承認・別タスクへ委譲 | §5 + AC-5 | PASS |
| route 移譲計画と実行の分離 | 計画は本タスク / 実行は別承認 | §2.2 / §5 | PASS |

## レビュー結果テーブル

### Phase 1（要件）レビュー結果

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| O-1 AC カバレッジ | PASS | AC-1〜AC-5 は正本 §2.2 と完全一致し index.md と整合 |
| O-2 CLAUDE.md 整合 | PASS | C-1〜C-3 が `bash scripts/cf.sh` 一本化を明記 |
| O-3 deployment-cloudflare.md 整合 | PASS | 依存境界に上流参照として登録 |
| O-4 スコープ境界 | PASS | 「含まないもの」5 件が正本 §2.3 と一致 |
| O-5 rollback 余地 | PASS | C-5 で旧 Worker 物理削除を本タスクから除外 |

### Phase 2（設計）レビュー結果

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| O-1 AC カバレッジ | PASS | 上記 O-1 マトリクスで 5 件すべてカバー |
| O-2 CLAUDE.md 整合 | PASS | §8 検証コマンド一覧が全件 ラッパー経由 |
| O-3 deployment-cloudflare.md 整合 | PASS | デプロイ・secret・tail いずれも ラッパー記法 |
| O-4 スコープ境界 | PASS | deploy 実行はコメントアウト記述のみ |
| O-5 rollback 余地 | PASS | §5 判断フローで残置を推奨。削除は別承認 |

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の観点を満たす。block にならず Phase 4 へ進める |
| MINOR | 警告レベル。runbook 追記時の補足対応で吸収可。Phase 4 への移行は許可 |
| MAJOR | block。Phase 1 / Phase 2 へ差し戻す。GO 不可 |

## base case 最終判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| O-1 AC カバレッジ | PASS | 5 AC すべてに Phase 2 章が対応 |
| O-2 CLAUDE.md 整合 | PASS | 全コマンド ラッパー経由・値転記禁止明記 |
| O-3 aiworkflow-requirements 整合 | PASS | deployment-cloudflare.md の規約に違反なし |
| O-4 スコープ境界 | PASS | deploy 実行 / DNS 切替 / 削除実行を全て対象外として明示 |
| O-5 rollback 余地 | PASS | 旧 Worker 残置原則を runbook と Phase 仕様の双方で固定 |
| テスト縮退方針 | PASS | docs-only タスクとして Phase 4-7 の縮退方針が Phase 2 で明示 |

## 矛盾・不明点の検出と確認事項

| # | 確認事項 | 想定回答 / 受け皿 |
| --- | --- | --- |
| 1 | runbook 追記先パスの第一候補（`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-XX/production-deploy-preflight.md`）でユーザー承認可か | ユーザー承認時に確定。第二候補（既存 runbook 章追記）に変更可 |
| 2 | 想定 secret 一覧の出典（1Password Vault / Item path）が確定済みか | 未確定であれば Phase 5 実施時に親タスク runbook 側に出典を明記 |
| 3 | `bash scripts/cf.sh` に Workers list / route list の subcommand が未整備の場合、ダッシュボード参照を正本としてよいか | Phase 2 §1.2 で「ダッシュボード参照を正本」と暫定決定済み。承認時に追認 |
| 4 | 旧 Worker 名の特定方法（過去 wrangler.toml 履歴 / ダッシュボード列挙のどちら） | Phase 5 実施時に inventory で確認 |
| 5 | 親タスク UT-06-FU-A の既存 runbook ファイル名が確定しているか | Phase 5 着手時に確認。未整備なら新規作成 |

## ユーザー承認ゲート

> **本 Phase は user_approval_required: true**

### 承認条件（GO 条件・全て満たすこと）

- [ ] base case 最終判定が全観点 PASS
- [ ] MAJOR がゼロ
- [ ] 確認事項 #1（runbook 追記先パス）にユーザー承認が得られている
- [ ] テスト縮退方針（Phase 4-7 を doc レビュー + checklist 整合 + 異常系シナリオ列挙 + AC matrix に置換）にユーザー承認が得られている
- [ ] スコープ境界（deploy 実行 / DNS 切替 / 旧 Worker 削除を含まない）が再確認されている
- [ ] CLAUDE.md `Cloudflare 系 CLI 実行ルール` への適合が確認されている

### NO-GO 条件（一つでも該当）

- いずれかの観点で MAJOR 残存
- `wrangler` 直接実行が Phase 2 設計に混入
- secret 値貼付ルールが曖昧
- 旧 Worker 物理削除を本タスクで実行する設計
- production deploy 実行を本タスクで行う設計
- runbook 追記先が UT-06-FU-A 配下以外

## MAJOR 検出時の Phase 1 への戻りフロー

```
MAJOR 検出
  ↓
Phase 3 を `pending_user_approval` のままで停止
  ↓
ユーザーに差し戻し範囲を提示（Phase 1 要件 / Phase 2 設計 / 両方）
  ↓
該当 Phase の `status` を `spec_created` に戻し再着手
  ↓
再 Phase 3 ゲートで再判定
```

> 戻りループの記録は本ファイル末尾の「変更履歴」セクション（必要時に追加）に追記する。

## 完了条件

- [ ] O-1〜O-5 のすべての観点で PASS 判定が記録されている
- [ ] Phase 1 / Phase 2 のレビュー結果テーブルに空セルが無い
- [ ] base case 最終判定が全観点 PASS
- [ ] 矛盾・不明点 5 件すべてに受け皿（承認 / 後続 Phase / 既存決定）が割り当てられている
- [ ] ユーザー承認ゲート GO 条件 6 件をすべて満たすか、NO-GO で停止
- [ ] テスト縮退方針が承認されている
- [ ] artifacts.json の `phases[2].status` が承認後に `completed` 相当に更新できる状態

## 多角的チェック観点

- AC カバレッジ: AC-1〜AC-5 が Phase 2 設計章に 1:1 で紐付いているか。
- CLAUDE.md ルール: `wrangler` 直接実行が混入していないか / secret 値漏洩防止規約が明示されているか。
- aiworkflow-requirements 整合: deployment-cloudflare.md の規約と矛盾しないか。
- スコープ境界: deploy 実行 / DNS 切替 / 旧 Worker 削除実行が全て対象外と明示されているか。
- rollback 余地: 旧 Worker 残置原則が Phase 1 / Phase 2 / 本 Phase で重複明示されているか。
- docs-only 整合: 成果物が markdown のみで、コード変更を要求していないか。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビュー観点 5 件 + Phase 1/2 レビュー結果 + base case 判定 + ユーザー承認ゲート結果 |
| メタ | artifacts.json | Phase 3 状態の更新（user_approval_required: true） |

## 次 Phase への引き渡し

- 次 Phase: 4（縮退: doc レビュー観点 + checklist 整合確認の設計）
- 引き継ぎ事項:
  - base case = Phase 2 §1〜§10 全章 + テスト縮退方針
  - runbook 追記先パス（ユーザー承認で確定したもの）
  - 確認事項 #2〜#5 の受け皿（後続 Phase / 親タスク runbook）
  - スコープ境界の継続維持（deploy 実行 / DNS 切替 / 旧 Worker 削除を含まない）
- ブロック条件:
  - ユーザー承認が得られていない
  - MAJOR が残っている
  - runbook 追記先パスが未確定
  - テスト縮退方針が未承認
