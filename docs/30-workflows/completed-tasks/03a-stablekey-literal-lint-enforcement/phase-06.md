# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-05-01 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (統合検証) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

ESLint custom rule（または ts-morph 静的検査）の運用で起きうる failure case を列挙し、**検出 / 期待挙動 / recovery / blocked 化基準** を確定する。
特に false positive と allow-list 経年劣化に対する fallback を明文化する。

## failure case 一覧

| # | 状況 | 検出 | 期待挙動 | recovery |
| --- | --- | --- | --- | --- |
| F-1 | stableKey が他 enum / 定数と命名衝突（例: `'q_full_name'` がフィールド名以外の意味で使われる） | rule report が出るが意味的には正しいコード | 開発者が allow-list 例外申請、または命名衝突回避の rename | Phase 8（運用）の suppression 申請フローで個別判定。allow-list は最小限に保つ |
| F-2 | allow-list ファイルが renamed / 移動された | CI lint で「allow-list 内ファイル不在」エラー | rule loader が glob 解決失敗を検知して fail-fast | rule オプションの allow-list 配列を新パスに更新、PR で同時反映 |
| F-3 | fixture 配置外で literal が必要な edge case（migration 実行スクリプト等） | 故意の違反 PR で rule fail | inline suppression は使わず、Phase 8 の allow-list 追加レビューを通して正本モジュールまたは例外 glob に昇格する | suppression 0 件を維持し、例外は設定ファイルで監査可能にする |
| F-4 | rule 実行時間超過（巨大ファイル / 大量ファイルで lint job が timeout） | CI duration が baseline +20% 超過 | rule の AST visitor を `Literal` / `TemplateLiteral` のみに限定し全 Node 走査を避ける | Phase 8 のパフォーマンス監視で検知し、parser cache / `parserOptions.cacheLifetime` 調整タスクへ切り分ける |
| F-5 | TypeScript parser version mismatch（`@typescript-eslint/parser` の major 差で AST shape 変動） | rule unit test が突然 fail | parser version を pin、CI で `pnpm why @typescript-eslint/parser` を確認 | parser pin を更新し snapshot を再生成 |
| F-6 | ESLint flat config と legacy config 共存問題（apps/api 側が legacy を残している場合） | `apps/api` で rule が読まれない | flat config 側にのみ rule を登録した場合の漏れを CI gate で検知 | 全 package を flat config に統一するまで legacy 側にも `extends` 経由で rule を伝播 |
| F-7 | allow-list 内の正本モジュールに **意図しない非 stableKey 文字列** が混入 | allow-list 経由で全 literal が allow されてしまうため検知不能 | 正本モジュールは「stableKey 定数の export 専用」とし、それ以外の文字列を含めないレビュー基準で防御 | 正本モジュールに lint rule の **逆方向チェック**（stableKey 定数のみ許容）を追加検討（別タスク） |
| F-8 | `// eslint-disable` コメントの濫用 | grep で disable コメント数が baseline 超過 | Phase 8 監視で disable 数を CI で集計、しきい値超過で warning | disable 削減タスクを別 issue で起票 |
| F-9 | rule の false negative（命名規則を外れる stableKey が将来追加される） | unit test U-7 / U-8 で検出漏れ | 命名規則を allow-list モジュールから動的算出する設計（Phase 5 Step ②）により回避 | regex を更新し snapshot 再生成 |
| F-10 | CI rule fail を `--no-verify` 等で迂回 | merge 後 main で違反コードが残る | branch protection の `required_status_checks` に lint job を含めて bypass 不可化 | branch protection を更新（governance 側タスク） |

## 不変条件 ↔ 異常系マッピング

| 不変条件 | 関連 failure case |
| --- | --- |
| #1 stableKey 直書き禁止 | F-1, F-3, F-7, F-9, F-10 |
| 補助: lint 基盤健全性 | F-2, F-4, F-5, F-6 |
| 補助: 運用規律 | F-8, F-10 |

## fallback 設計

| 観点 | fallback |
| --- | --- |
| rule が一時的に動かない | `eslint-config` 側で rule entry を `warn` に格下げ、main merge を継続しつつ修復 |
| allow-list 解決不能 | デフォルトで `[]`（全箇所 error）にせず、解決失敗時は `fail-fast` で CI fail（silently skip しない） |
| disable コメント濫用 | Phase 8 監視で集計、しきい値超過で別 issue 起票 |
| flat / legacy 共存 | 共通 `packages/eslint-config` を経由させ、両 config から同じ rule entry を参照させる |
| parser version 差異 | `pnpm` workspace で `@typescript-eslint/parser` を root pin、CI で `pnpm why` を gate に追加 |

## 検出ゲートの設計

各 failure case に対する **CI 上の検出責務** を明確化する。

| failure case | 検出ゲート | 配置先 |
| --- | --- | --- |
| F-2 (allow-list ファイル消失) | rule loader の fail-fast | rule 起動時 |
| F-4 (実行時間超過) | CI duration 監視 | Phase 8 monitoring |
| F-5 (parser version mismatch) | `pnpm why` チェック | CI workflow（事前 step） |
| F-6 (config 共存) | flat config / legacy config 双方で rule が読まれていることを smoke test | unit test + monorepo lint |
| F-8 (disable 濫用) | `git grep -c` の baseline 比 | Phase 8 monitoring |
| F-10 (CI gate 迂回) | branch protection の `required_status_checks` | governance 側 |

## blocked 化基準

以下に該当する場合は本タスクの Phase 11 を blocked とし、責務元 owner に escalate する。

- F-2 で allow-list 正本モジュール自体が renamed されており、rename 元タスク owner と命名衝突する
- F-6 で flat config / legacy config の方針が wave 8b 側で確定していない
- F-10 で branch protection 変更が governance 側で reject される

## 実行タスク

- [ ] failure case 表 10 件を `outputs/phase-06/main.md` に記録
- [ ] 各 case の検出 / recovery / blocked 化基準を明示
- [ ] 不変条件マッピング記述
- [ ] fallback 設計表配置

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | 運用手順 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1 |
| 推奨 | docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md | AC-7 元文脈 |

## 完了条件

- [ ] 10 failure case 列挙
- [ ] recovery / blocked 基準明示
- [ ] 不変条件 #1 とのマッピング記述
- [ ] fallback 設計表配置

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 6 を completed

## 次 Phase

- 次: Phase 7 (統合検証)
- 引き継ぎ: failure case を AC × 不変条件 × evidence のトレース表に転記

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-06/main.md` | failure case 一覧 |
| `outputs/phase-06/violation-fixture-spec.md` | 故意違反 fixture 仕様 |

## 統合テスト連携

Phase 7 / Phase 11 は本 Phase の failure case を使い、red/green evidence と bypass 経路の閉塞を確認する。
