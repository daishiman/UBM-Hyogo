# Phase 03: 設計レビュー

## サマリ

Phase 2 が確定した章立て（§1〜§10）に対し、alternative 3 案を比較し PASS / MINOR / MAJOR 判定を実施。GO 判定で Phase 4 へ進む。

## Alternative 3 案

### 案 A: routes 軸主従（採用）

- §2 を 19 routes × 10 列で書き切る。§3 component 契約は補助。
- 視覚詳細は §2 の「視覚詳細 link」列で 09a へ完全委譲。
- token は §6.3 の prefix 8 種のみ参照。

判定: **PASS**

理由:
- grep 起点（`grep -n "^### 2\." 09-ui-ux.md`）で 19 routes が一意取得できる
- 1 routes = 1 行 + 1 表 = 後続 task-11..17 の参照点が決定論的
- contract と視覚詳細の物理分離が確実

### 案 B: component 軸主従

- §3 を主軸にし、§2 routes は component の組み合わせを列挙する補助とする。

判定: **MAJOR**

理由:
- 後続 task-11..17（routes 別画面実装）が逆引きを強いられる
- 19 routes × N components の組み合わせ explosion で grep 一意性が低下
- API 接続表（route × endpoint × method）を主軸にできない（既存 phase-3.md と乖離）

### 案 C: 状態軸主従

- §4 状態列挙を主軸にし、routes / component を状態の派生として記述。

判定: **MINOR**

理由:
- a11y / login 5 状態 / pending state など状態軸の記述は強化されるが、画面実装タスクの参照点として弱い
- 採用すると §2 / §3 が二次情報になり、不変条件 #2 / #3 / #5 の routes 単位確認が grep 不可
- §4.2 / §5 を独立章として残す部分採用は案 A 内で実現可能

## GO/NO-GO 判定

**判定: GO（案 A 採用）**

| 評価軸 | 案 A | 案 B | 案 C |
| --- | :---: | :---: | :---: |
| grep 一意性 | OK | NG | 部分 OK |
| 後続 task 参照点の決定論性 | OK | NG | NG |
| API 接続表との整合 | OK | NG | OK |
| 不変条件 #2/#3/#5/#6 の grep 検証容易性 | OK | NG | NG |
| 1 サイクル完了可能性 | OK | OK | OK |
| 総合 | **PASS** | MAJOR | MINOR |

## レビュー観点（§4 / §5 / §6 補強）

案 A 採用にあたり、案 C の良い特性（a11y / 状態列挙の独立章化）を取り込む:

- §4 状態列挙の規範を独立章として配置（idle/loading/empty/error/success の 5 値、login 5 状態、申請 server-pending）
- §5 a11y を独立章に昇格（5.1 共通 / 5.2 dialog / 5.3 form / 5.4 live region）
- §6 token 参照規則を独立章に昇格（6.1 決定権委譲 / 6.2 CSS 変数経由 / 6.3 prefix 8 種）

## サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | :---: |
| 1 | alternative A 評価 | completed |
| 2 | alternative B 評価 | completed |
| 3 | alternative C 評価 | completed |
| 4 | GO/NO-GO 判定 | completed |
| 5 | 案 A 採用と補強観点記録 | completed |

## 次 Phase

Phase 4（テスト戦略）へ。AC-1〜AC-14 と verify suite（grep gate / markdown lint / trace check）の対応表作成へ進む。
