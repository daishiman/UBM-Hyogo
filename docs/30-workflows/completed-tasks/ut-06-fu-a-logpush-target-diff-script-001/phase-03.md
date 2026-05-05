# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production observability target diff script (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-05-01 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト作成) |
| 状態 | spec_created |
| user_approval_required | true |
| タスク分類 | implementation / observability-automation（design review） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 要件（4 軸 R1〜R4 × AC-1〜AC-5 × スコープ × 制約）と Phase 2 設計（inventory / 抽出 / redaction / interface / runbook 導線）を、以下 6 観点でレビューし、Phase 4 以降に進めるかをユーザー承認付きでゲートする。

1. AC カバレッジ（AC-1〜AC-5 が Phase 2 設計章に 1:1 で対応しているか）
2. CLAUDE.md `Cloudflare 系 CLI 実行ルール` 整合（`wrangler` 直叩き禁止）
3. read-only 原則（HTTP method GET のみ / mutation 禁止）
4. redaction 完全性（token / OAuth / URL credential / dataset key / AWS key 網羅）
5. 取得不可耐性（plan 制限時 fallback で exit 0 維持）
6. runbook 導線（親タスク `completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` への追記先確定）

## 実行タスク

1. Phase 1 AC と Phase 2 設計の対応をレビューする。
2. Cloudflare CLI wrapper / read-only / redaction の境界を確認する。
3. Phase 4 以降へ進めるかを GO / NO-GO で判定する。
4. ユーザー承認が必要な実装上の決定事項（subcommand 名 / runbook 追記先）を明示する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 入力 | `phase-01.md` | AC / scope |
| 入力 | `phase-02.md` | design details |
| 正本 | `.claude/skills/task-specification-creator/references/phase-templates.md` | review gate structure |
| 正本 | `CLAUDE.md` `Cloudflare 系 CLI 実行ルール` | wrapper 一本化 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | approved design を unit / contract / golden / redaction test の入力に展開 |
| Phase 10 | final review gate で同じ承認境界を再確認 |

## レビュー観点

### O-1: AC カバレッジ

| AC | Phase 2 対応章 | カバレッジ判定 |
| --- | --- | --- |
| AC-1: 新旧 Worker 両方の inventory | §1 Worker target inventory 設計 | 完全カバー |
| AC-2: token / sink credential / dataset key 完全 redaction | §3 redaction logic 設計 + §6 テスト戦略 redaction 検証 | 完全カバー |
| AC-3: 4 軸 (Workers Logs / Tail / Logpush / Analytics) 網羅 | §2 API/CLI 抽出 matrix R1〜R4 | 完全カバー |
| AC-4: 親タスク runbook からの導線 | §5 runbook 導線設計 | 完全カバー |
| AC-5: `bash scripts/cf.sh` 経由のみ | §4.1 配置先（cf.sh subcommand） + §7 セキュリティ | 完全カバー |

### O-2: CLAUDE.md `Cloudflare 系 CLI 実行ルール` 整合

| チェック項目 | 期待 | Phase 2 反映箇所 | 判定 |
| --- | --- | --- | --- |
| `wrangler` 直接実行禁止 | 全 Cloudflare 呼び出しが `bash scripts/cf.sh` 経由 | §4.1 / §7 / §2.2 | PASS |
| `wrangler login` 禁止 | op 経由 API Token のみ | §7 セキュリティ | PASS |
| `.env` 実値の Read 禁止 | op 参照のみ | §7 セキュリティ | PASS |
| API Token / OAuth Token 出力禁止 | redaction layer で消去 | §3.2 redaction denylist | PASS |

### O-3: read-only 原則

| チェック項目 | 期待 | Phase 2 反映箇所 | 判定 |
| --- | --- | --- | --- |
| HTTP method GET のみ | mutation 禁止 | §2.2 / §4.4 | PASS |
| Logpush job mutation 禁止 | 作成 / 削除 / 変更を実装に含めない | Phase 1 スコープ「含まないもの」+ §2.2 | PASS |
| Analytics dataset mutation 禁止 | 作成 / 削除 / 変更を実装に含めない | Phase 1 スコープ「含まないもの」+ §2.2 | PASS |
| 旧 Worker 削除導線非接続 | 削除示唆文言を出力しない | Phase 1 C-5 + §1.3 inventory（事実列挙のみ） | PASS |

### O-4: redaction 完全性

| チェック項目 | 期待 | Phase 2 反映箇所 | 判定 |
| --- | --- | --- | --- |
| Cloudflare API token redaction | `[A-Za-z0-9_-]{40,}` 検出 | §3.2 | PASS |
| Bearer / Authorization redaction | header 値除去 | §3.2 | PASS |
| URL credential / path redaction | host のみ残す | §3.2 | PASS |
| AWS Access / Secret key redaction | AKIA + secret 検出 | §3.2 | PASS |
| OAuth token redaction | `ya29.*` 検出 | §3.2 | PASS |
| Logpush destination_conf 全削除 | フィールド単位除去 | §3.2 | PASS |
| Analytics dataset write key 削除 | フィールド単位除去 | §3.2 | PASS |
| stdout / stderr 両方適用 | redaction layer 共通 | §3.3 | PASS |

### O-5: 取得不可耐性

| チェック項目 | 期待 | Phase 2 反映箇所 | 判定 |
| --- | --- | --- | --- |
| plan 制限 (4xx) 時 fail しない | exit 0 + N/A 出力 | §2.3 fallback flow | PASS |
| ネットワーク / 5xx fail | exit 2 | §2.3 / §4.3 | PASS |
| 認証失敗 fail | exit 3 | §2.3 / §4.3 | PASS |
| dashboard fallback 経路明示 | UI ナビゲーション付き N/A | §2.1 matrix | PASS |

### O-6: runbook 導線

| チェック項目 | 期待 | Phase 2 反映箇所 | 判定 |
| --- | --- | --- | --- |
| 追記先パス確定 | UT-06-FU-A 配下 | §5.1（第一候補: 新規 markdown） | PASS（ユーザー承認待ち） |
| 章立て明示 | 実行コマンド / 期待出力 / トラブルシュート | §5.2 | PASS |
| 親タスク既存 runbook との関係 | 補完関係を明示 | §5.1 第二候補との比較 | PASS |

## レビュー結果テーブル

### Phase 1（要件）レビュー結果

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| O-1 AC カバレッジ | PASS | AC-1〜AC-5 が起源 spec と一致 |
| O-2 CLAUDE.md 整合 | PASS | C-1〜C-3 が `bash scripts/cf.sh` 一本化を明記 |
| O-3 read-only | PASS | C-4 / C-5 で mutation・削除導線を禁止 |
| O-4 redaction 完全性 | PASS | C-2 / C-6 で credential / token 出力禁止 |
| O-5 取得不可耐性 | PASS | C-7 で dashboard fallback を許容 |
| O-6 runbook 導線 | PASS | AC-4 で親タスク runbook 追記を要求 |

### Phase 2（設計）レビュー結果

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| O-1 AC カバレッジ | PASS | 5 AC が §1〜§5 に 1:1 対応 |
| O-2 CLAUDE.md 整合 | PASS | 全 Cloudflare 呼び出しが `bash scripts/cf.sh` 経由 |
| O-3 read-only | PASS | §2.2 / §4.4 で GET only を宣言 |
| O-4 redaction 完全性 | PASS | §3.2 denylist が token / OAuth / URL / AWS key 網羅 |
| O-5 取得不可耐性 | PASS | §2.3 で 4xx は N/A、5xx / auth は exit 別コード |
| O-6 runbook 導線 | PASS（ユーザー承認待ち） | §5.1 で第一候補確定 |

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の観点を満たす。block にならず Phase 4 へ進める |
| MINOR | 警告レベル。Phase 4 着手時の補足対応で吸収可 |
| MAJOR | block。Phase 1 / Phase 2 へ差し戻す。GO 不可 |

## base case 最終判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| O-1 AC カバレッジ | PASS | 5 AC すべてに Phase 2 章が対応 |
| O-2 CLAUDE.md 整合 | PASS | wrangler 直叩き 0 件 |
| O-3 read-only | PASS | GET only / mutation / 削除導線禁止 |
| O-4 redaction 完全性 | PASS | denylist 7 種 + allowlist 7 項目 |
| O-5 取得不可耐性 | PASS | exit code 4 種で plan 制限を吸収 |
| O-6 runbook 導線 | PASS | 第一候補（新規 markdown）で確定 |
| テスト戦略の枠組み | PASS | unit / contract / golden / redaction の 4 レイヤーが Phase 2 §6 で明示 |

## 矛盾・不明点の検出と確認事項

| # | 確認事項 | 想定回答 / 受け皿 |
| --- | --- | --- |
| 1 | script の配置を `scripts/cf.sh` の subcommand `observability-diff` とすることでユーザー承認可か | ユーザー承認時に確定。第二候補（スタンドアロン `scripts/observability-target-diff.sh`）に変更可 |
| 2 | runbook 追記先の第一候補（`docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-XX/observability-diff-runbook.md` 新規作成）でユーザー承認可か | ユーザー承認時に確定。第二候補（`route-secret-observability-design.md` 章追記）に変更可 |
| 3 | 旧 Worker 名 `ubm-hyogo-web` の特定が親タスク `route-secret-observability-design.md` の記録で十分か | 親タスク完了済みのため記録あり前提。Phase 5 着手時に再確認 |
| 4 | Cloudflare 無料プランで Logpush API が呼べない場合、N/A fallback で AC-3 を満たしたとみなしてよいか | Phase 1 C-7 / Phase 2 §2.3 で許容済み。承認時に追認 |
| 5 | golden output の生成元 (Phase 2 §3.4) を Phase 4 の正本として固定してよいか | 承認時に確定。差分があれば Phase 4 開始時に再生成 |
| 6 | redaction の正規表現を Phase 4 で実装言語に合わせて軽微調整することを許容するか | 軽微調整は許容（denylist の意味論を保持する範囲）。Phase 3 で容認 |

## ユーザー承認ゲート

> **本 Phase は user_approval_required: true**

### 承認条件（GO 条件・全て満たすこと）

- [ ] base case 最終判定が全観点 PASS
- [ ] MAJOR がゼロ
- [ ] 確認事項 #1（script 配置 = cf.sh subcommand）にユーザー承認が得られている
- [ ] 確認事項 #2（runbook 追記先 = 新規 markdown）にユーザー承認が得られている
- [ ] read-only / mutation 禁止 / 削除導線非接続が再確認されている
- [ ] CLAUDE.md `Cloudflare 系 CLI 実行ルール` への適合が確認されている
- [ ] redaction の denylist 7 種 + allowlist 7 項目が承認されている

### NO-GO 条件（一つでも該当）

- いずれかの観点で MAJOR 残存
- `wrangler` 直叩きが Phase 2 設計に混入
- mutation 系 HTTP method を含む設計
- redaction allowlist に token / credential が混入
- runbook 追記先が UT-06-FU-A 配下以外
- script 配置先が `scripts/` 配下以外

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

## 完了条件

- [ ] O-1〜O-6 のすべての観点で PASS 判定が記録されている
- [ ] Phase 1 / Phase 2 のレビュー結果テーブルに空セルが無い
- [ ] base case 最終判定が全観点 PASS
- [ ] 矛盾・不明点 6 件すべてに受け皿が割り当てられている
- [ ] ユーザー承認ゲート GO 条件 7 件をすべて満たすか、NO-GO で停止
- [ ] artifacts.json の `phases[2].status` が承認後に `completed` 相当に更新できる状態

## 多角的チェック観点

- AC カバレッジ: AC-1〜AC-5 が Phase 2 設計章に 1:1 で紐付いているか。
- CLAUDE.md ルール: `wrangler` 直叩きが混入していないか / token 出力禁止規約が明示されているか。
- read-only: HTTP method が GET のみであることが宣言されているか。
- redaction: denylist が token / OAuth / URL credential / AWS key / dataset write key を網羅しているか。
- 取得不可耐性: plan 制限時に fail せず exit 0 で fallback できるか。
- runbook 導線: 親タスク runbook への追記先が確定しているか。
- 実装可能性: Phase 4 が unit / contract / golden / redaction test を一意に書ける粒度になっているか。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-03/main.md` | レビュー観点 6 件 + Phase 1/2 レビュー結果 + base case 判定 + ユーザー承認ゲート結果 |
| メタ | `artifacts.json` | Phase 3 状態の更新（user_approval_required: true） |

## 次 Phase への引き渡し

- 次 Phase: 4（テスト作成 / unit / contract / golden output / redaction）
- 引き継ぎ事項:
  - base case = Phase 2 §1〜§7 全章
  - script 配置決定（`scripts/cf.sh` subcommand `observability-diff`）
  - runbook 追記先決定（新規 markdown）
  - 確認事項 #3〜#6 の受け皿（後続 Phase / 親タスク runbook）
  - read-only / mutation 禁止 / 削除導線非接続の継続維持
- ブロック条件:
  - ユーザー承認が得られていない
  - MAJOR が残っている
  - script 配置先 / runbook 追記先が未確定
  - redaction denylist に欠落あり
