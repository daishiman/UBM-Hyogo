# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 の設計に対して 3 件以上の代替案を比較し、PASS-MINOR-MAJOR で判定する。`/no-access` 不採用方針の妥当性、EmailProvider 不採用 + 自前 magic_tokens verify + 後続 Credentials bridge、gate-state を public endpoint にする是非を扱う。

## 実行タスク

1. 代替案 3 件以上の整理（completion: outputs/phase-03/main.md）
2. PASS-MINOR-MAJOR 判定（completion: 各案に判定）
3. 採用案の理由と未解決事項を残す
4. Phase 1 AC との整合確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-02/architecture.md | 採用案の構造 |
| 必須 | outputs/phase-02/api-contract.md | API I/O |
| 参考 | doc/00-getting-started-manual/specs/02-auth.md | `/no-access` 不採用根拠 |

## 実行手順

### ステップ 1: 代替案の整理

| 案 | 概要 | PASS-MINOR-MAJOR | 理由 |
| --- | --- | --- | --- |
| A: 採用案（gate-state を public + magic-link は POST） | 状態判定と token 発行を分離。GET でアクセスし、UI が判定結果を即座に反映 | PASS | UI 体験良好、責務分離明確 |
| B: gate-state を含めて POST 一本化 | `POST /auth/magic-link` のみ。state を response に必ず含む | MINOR | UI の preflight 判定に追加往復が必要、UX 微悪化 |
| C: 専用 `/no-access` 画面復活 | エラー専用画面に redirect | MAJOR | 不変条件 #9 違反、保守 1 ルート増 |
| D: Auth.js 標準 EmailProvider のみ（gate state なし） | Auth.js が send → callback を自動処理。事前判定なし | MAJOR | 未登録 user にもメール送ってしまい不要送信、AC-1〜AC-3 を満たせない |
| E: 自前 magic_tokens + 自前 verify（Auth.js 不使用） | 完全自作 | MINOR | 開発工数大、05a の Google OAuth と session 統合困難 |

### ステップ 2: PASS-MINOR-MAJOR 集計

| 判定 | 件数 | 該当案 |
| --- | --- | --- |
| PASS | 1 | A（採用） |
| MINOR | 2 | B, E |
| MAJOR | 2 | C, D |

### ステップ 3: 採用理由

A 案を採用。理由:
- `/login` 画面が単一 fetch で 5 状態を判定できる
- token 発行と state 判定を分離することで列挙攻撃に対するレートリミットを判定側だけに掛けやすい
- Auth.js 本体は 06b に委譲し、05b は verify / resolve-session bridge を確定する

### ステップ 4: 未解決事項

| # | 論点 | 仮決定 | 確定 Phase |
| --- | --- | --- | --- |
| Q1 | gate-state public endpoint のレートリミット手段 | MVP は isolate memory、厳密化は U-02 で KV/DO/WAF へ昇格 | 4 / 5 |
| Q2 | mail provider の選定（Resend / SendGrid / Mailtrap） | Resend を第一候補 | 5 |
| Q3 | token TTL を 10 分にすべきか 15 分か | 15 分（spec で固定） | - |
| Q4 | session strategy は JWT か database か | JWT（Workers ステートレス） | 2 で確定済み |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案 A の test 設計 |
| Phase 6 | 不採用案の漏洩を防ぐ異常系（D 案的に「不正な token でも session 作る」等） |
| Phase 7 | AC との整合再確認 |

## 多角的チェック観点

- 不変条件 #9: C 案不採用が妥当
- 不変条件 #2: A / B / D / E すべて publicConsent / rulesConsent キー名を維持
- 認可境界: gate-state の public 公開で email 列挙が起きない設計か（レートリミット必須）
- 無料枠: D 案では未登録メールにも送信が走るため Resend 100 通/日制約に抵触する可能性

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案列挙 | 3 | pending | 5 案 |
| 2 | PASS-MINOR-MAJOR 判定 | 3 | pending | 表に集計 |
| 3 | 採用理由文書化 | 3 | pending | 主成果物 |
| 4 | 未解決事項残し | 3 | pending | 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案、判定、採用理由、未解決事項 |
| メタ | artifacts.json | phase 3 status |

## 完了条件

- [ ] 代替案 3 件以上
- [ ] PASS-MINOR-MAJOR が全案に付与
- [ ] 採用案 A の理由が明記
- [ ] 未解決事項が確定 Phase 付きで残る

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- outputs/phase-03/main.md が配置
- 全完了条件にチェック
- 不変条件 #9 違反案（C）が MAJOR と判定
- 次 Phase へ Q1〜Q4 を引継ぎ

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ事項: 採用案 A の API 契約と Mermaid を test 設計の入力に
- ブロック条件: 採用案が確定していない場合は進まない
