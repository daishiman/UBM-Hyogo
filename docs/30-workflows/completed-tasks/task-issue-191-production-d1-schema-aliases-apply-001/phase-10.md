# Phase 10: GO / NO-GO

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |

## 目的

Phase 9 までの結果を集約し、production apply に進む GO 判定 / NO-GO 判定を確定する。

## 実行タスク

- Phase 1〜9 の Design GO 条件を確認する。
- Phase 13 直前の Runtime GO 条件を Design GO から分離する。
- NO-GO 時の戻し先を Phase / exception ID と接続する。

## 判定チェックリスト

### Design GO（Phase 11/12 へ進む条件）

- [ ] Phase 1 AC-1〜AC-8 全て定義済み
- [ ] Phase 2 6 ステップ operation flow 確定
- [ ] Phase 3 5 観点レビュー全て OK
- [ ] Phase 4 検証戦略 (S-* / L-* / P-*) 確定
- [ ] Phase 6 異常系 E-1〜E-9 + rollback DDL 確定
- [ ] Phase 7 AC × 検証 × 異常系 マトリクス完成
- [ ] Phase 8 隣接タスク責務分担確認済み
- [ ] Phase 9 静的検査 / local D1 / typecheck / lint 全 PASS

→ 全 PASS で **Design GO**

### Runtime GO（Phase 13 で production apply に進む条件）

- [ ] Design GO 達成済み
- [ ] Phase 11 NON_VISUAL evidence 一式取得完了
- [ ] Phase 12 SSOT 更新ドラフト準備済み
- [ ] **ユーザーから明示的な production apply 承認** が取得済み（テキスト記録）
- [ ] `bash scripts/cf.sh whoami` で認証 OK
- [ ] `migrations-list-before.txt` で unapplied migration が `0008_create_schema_aliases.sql` のみ（target 以外 pending は NO-GO）
- [ ] git status clean / 作業ブランチ確定

→ 全 PASS で **Runtime GO**（Phase 13 の apply step を実行）

## NO-GO 判定基準

| 状況 | 対応 |
| --- | --- |
| 静的検査で migration drift 検出 | Phase 1 / 4 へ戻り migration ファイル原因調査 |
| DDL static evidence で column / index 不一致 | migration DDL drift。先行実装タスクへエスカレーション |
| ユーザー承認未取得 | Phase 13 着手不可。承認待機 |
| `bash scripts/cf.sh whoami` 失敗 | 認証復旧まで apply 不可（E-1） |
| target 以外の pending migration が存在 | apply 不可（E-9）。対象外 migration の扱いを別判断 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| AC matrix | `phase-07.md` | Design GO の coverage |
| quality result | `phase-09.md` | static / local / typecheck 結果 |
| approval gate | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` | Runtime GO の承認境界 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| GO/NO-GO result | `phase-10.md` | Design GO / Runtime GO / NO-GO 判定 |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 11 | Design GO 後の evidence 整備 | `outputs/phase-11/production-apply-readiness.md` |
| Phase 13 | Runtime GO 後の production apply 実行 | `outputs/phase-13/*` |

## 完了条件

- [ ] Design GO チェックリストが全て埋まる
- [ ] Runtime GO チェックリストが Phase 13 直前に再確認されることが明記されている
- [ ] 本Phase内の全タスクを100%実行完了

## 次Phase

Phase 11: NON_VISUAL evidence
