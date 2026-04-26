# Phase 7 出力: main.md
# 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 7 / 13 (検証項目網羅性) |
| 作成日 | 2026-04-23 |
| 状態 | completed |
| 入力 | outputs/phase-06/main.md (異常系検証 / 全7シナリオ PASS) |

---

## 1. AC × 検証項目マトリクス

各受入条件 (AC) がどの Phase で、どの検証観点と検証方法によってカバーされているかを示す。

### AC-1: web/api/db/input source の責務境界が一意に説明できる

| 検証観点 | 検証方法 | 担当 Phase | 判定 |
| --- | --- | --- | --- |
| 責務境界の一意性 | canonical-baseline.md セクション3 の責務定義 (各層1行) が矛盾なく記載されていることを確認 | Phase 2, Phase 3 | PASS |
| Web 層の DB 直接アクセス禁止 | 責務定義の「DB への直接アクセス禁止」の記述確認 | Phase 2 | PASS |
| API 層が D1 への唯一のゲートウェイ | 責務定義の「D1 への唯一のアクセス口」の記述確認 | Phase 2 | PASS |
| Sheets が non-canonical であること | 責務定義の「canonical でない」の記述確認 / 異常系 A3 検証 | Phase 2, Phase 6 | PASS |
| 責務逸脱の防止 | Phase 5 sanity check 2 にて scope 外サービス未追加を確認 | Phase 5, Phase 6 | PASS |

**AC-1 カバレッジ: Phase 2, 3, 5, 6 でカバー済み / PASS**

---

### AC-2: feature→dev→main と local/staging/production の対応表が確定している

| 検証観点 | 検証方法 | 担当 Phase | 判定 |
| --- | --- | --- | --- |
| 対応表の存在 | canonical-baseline.md セクション2 にブランチ/環境対応表が存在することを確認 | Phase 2, Phase 3 | PASS |
| ブランチ名の統一 | `dev` / `main` / `feature/*` のみ使用。`develop` `master` の不使用を確認 | Phase 4 (V-04), Phase 6 (A1), Phase 8 | PASS |
| 環境名の統一 | `local` / `staging` / `production` の3種類のみ使用を確認 | Phase 5 sanity check 2 | PASS |
| force push 禁止の明示 | 対応表に force push 禁止が記載されていることを確認 | Phase 2, Phase 3 | PASS |
| デプロイトリガーの明示 | 対応表に Cloudflare プロジェクトとデプロイトリガーが記載されていることを確認 | Phase 2 | PASS |

**AC-2 カバレッジ: Phase 2, 3, 4, 5, 6, 8 でカバー済み / PASS**

---

### AC-3: Google Sheets input / D1 canonical の判断根拠が残っている

| 検証観点 | 検証方法 | 担当 Phase | 判定 |
| --- | --- | --- | --- |
| DL-03 (D1 採用理由) の存在 | decision-log.md DL-03 に D1 採用理由が記載されていることを確認 | Phase 2, Phase 3 | PASS |
| DL-04 (Sheets 採用理由) の存在 | decision-log.md DL-04 に Sheets 入力源採用理由が記載されていることを確認 | Phase 2, Phase 3 | PASS |
| NA-01 (Sheets canonical 棄却) の根拠 | decision-log.md NA-01 に Sheets を canonical とする案の棄却根拠 (5件) が記載されていることを確認 | Phase 2, Phase 3 | PASS |
| 判断根拠の永続性 | decision-log.md がバージョン管理下にあり、変更履歴が残ることを確認 | Phase 1 (インベントリ), Phase 9 | PASS |
| source-of-truth 競合の不在 | 異常系 A3 検証にて Sheets が canonical と記述された箇所がないことを確認 | Phase 6 | PASS |

**AC-3 カバレッジ: Phase 2, 3, 6, 9 でカバー済み / PASS**

---

### AC-4: scope 外項目と未タスク候補が分離されている

| 検証観点 | 検証方法 | 担当 Phase | 判定 |
| --- | --- | --- | --- |
| OOS リストの存在 | decision-log.md セクション3 に OOS-01〜OOS-08 が記載されていることを確認 | Phase 2, Phase 3 | PASS |
| OOS リストの完全性 | 通知基盤・モニタリング・本番デプロイ・CI/CD実装・実コード実装が OOS に含まれていることを確認 | Phase 2 | PASS |
| 未タスク候補への委譲 | 各 OOS の「未タスク候補パス」が下流タスクまたは Wave 2 以降に割り当てられていることを確認 | Phase 2, Phase 3 | PASS |
| scope 外の先行記述なし | 異常系 A6 検証にて canonical-baseline.md に scope 外サービスが混入していないことを確認 | Phase 6 | PASS |
| Phase 12 での最終分離確認 | 未タスク候補の一覧表を Phase 12 outputs に作成することで最終確認 | Phase 12 | 予定 |

**AC-4 カバレッジ: Phase 2, 3, 6, 12 でカバー済み / PASS (Phase 12 は予定)**

---

### AC-5: 価値性/実現性/整合性/運用性の4条件を PASS と判定できる

| 検証観点 | 検証方法 | 担当 Phase | 判定 |
| --- | --- | --- | --- |
| 価値性 PASS | phase-03/main.md セクション1 の価値性判定が PASS であることを確認 | Phase 3 | PASS |
| 実現性 PASS | phase-03/main.md セクション1 の実現性判定が PASS であることを確認 | Phase 3 | PASS |
| 整合性 PASS | phase-03/main.md セクション1 の整合性判定が PASS であることを確認 | Phase 3 | PASS |
| 運用性 PASS | phase-03/main.md セクション1 の運用性判定が PASS であることを確認 | Phase 3 | PASS |
| 4条件の判断根拠の記録 | 各条件の判断根拠が phase-03/main.md に記録されていることを確認 | Phase 3 | PASS |
| Phase 10 での最終確認 | AC 全項目 PASS 判定表を Phase 10 outputs に作成して最終確認 | Phase 10 | 予定 |
| Phase 12 での最終確認 | Phase 12 compliance check にて4条件最終確認を実施 | Phase 12 | 予定 |

**AC-5 カバレッジ: Phase 3, 10, 12 でカバー済み / PASS (Phase 10, 12 は予定)**

---

## 2. カバレッジ確認

### AC × Phase カバレッジマトリクス

| AC | Ph1 | Ph2 | Ph3 | Ph4 | Ph5 | Ph6 | Ph7 | Ph8 | Ph9 | Ph10 | Ph11 | Ph12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | - | COVER | COVER | - | COVER | COVER | - | - | - | - | - | - |
| AC-2 | - | COVER | COVER | COVER | COVER | COVER | - | COVER | - | - | - | - |
| AC-3 | COVER | COVER | COVER | - | - | COVER | - | - | COVER | - | - | - |
| AC-4 | - | COVER | COVER | - | - | COVER | - | - | - | - | - | COVER |
| AC-5 | - | - | COVER | - | - | - | - | - | - | COVER | - | COVER |

**全 AC が複数 Phase でカバーされており、単一 Phase への依存リスクなし**

### 異常系シナリオ × AC カバレッジ

| 異常系シナリオ | 対処する AC | 対処 Phase |
| --- | --- | --- |
| A1: branch drift | AC-2 | Phase 6, Phase 8 |
| A2: secret placement ミス | AC-1, AC-5 (整合性) | Phase 6, Phase 9 |
| A3: source-of-truth 競合 | AC-1, AC-3 | Phase 6 |
| A4: downstream blocker 漏れ | AC-4 | Phase 6 |
| A5: 無料枠逸脱前提 | AC-5 (実現性) | Phase 6, Phase 9 |
| A6: scope 外サービスの先行記述 | AC-4 | Phase 6 |
| A7: 実値シークレットの混入 | AC-5 (運用性) | Phase 6, Phase 9 |

---

## 3. 未カバー AC への対処方針

現時点では全 AC (AC-1〜AC-5) が少なくとも1つの Phase でカバーされている。**未カバーの AC は存在しない。**

ただし、以下の AC は「予定」の Phase で最終確認が行われるため、それらの Phase の完了をもって完全カバーとなる:

| AC | 残り確認 Phase | 確認内容 |
| --- | --- | --- |
| AC-4 | Phase 12 | unassigned-task-detection.md で未タスク候補の最終リストを確定 |
| AC-5 | Phase 10, 12 | 最終 PASS 判定表と compliance check |

これらは既に Phase 3 で PASS と判定されており、Phase 10/12 は「最終確認の形式化」が目的である。

---

## 4. Phase 8 への引き継ぎ

### Blockers

なし。全 AC が適切に Phase でカバーされていることを確認した。Phase 8 (設定 DRY 化) に進行可能。

### Open Questions

なし。

### Phase 8 実行時の注意事項

- Phase 8 では `develop` → `dev` のブランチ記法統一 (A1 対策) を Before/After 表で記録すること
- `OpenNext` → `Pages/Workers 分離` の表記統一 (A2/A3 対策に関連) も記録すること
- DRY 化の対象は本タスクのドキュメント内の記述の統一に限定し、コードファイルへの変更は行わないこと

---

## 完了確認

- [x] AC × 検証項目マトリクス作成済み (AC-1〜AC-5 × 全検証観点)
- [x] AC × Phase カバレッジマトリクス作成済み
- [x] 異常系シナリオ × AC カバレッジ確認済み
- [x] 未カバー AC なし / 全 AC カバー済み
- [x] Phase 8 への引き継ぎ記載済み (blockers なし)
