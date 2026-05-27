# H3 修復 — 公開フィルタ UX 改修 - タスク指示書

## メタ情報

| 項目         | 内容                                                                 |
| ------------ | -------------------------------------------------------------------- |
| タスクID     | google-form-reflection-diagnostics-fu-003-h3-public-filter-ux        |
| タスク名     | H3 修復 — 公開フィルタ UX 改修 (publicConsent CTA + admin 一括 republish) |
| 分類         | 実装 (UX 改修)                                                       |
| 対象機能     | `apps/web/app/(public)/members/*` / profile publicConsent CTA / admin 一括 republish flow |
| 優先度       | 中                                                                   |
| 見積もり規模 | 中                                                                   |
| ステータス   | 未実施                                                               |
| 発見元       | google-form-reflection-diagnostics Phase 12 unassigned-task-detection.md (Spec-B-3) |
| 発見日       | 2026-05-26                                                           |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

google-form-reflection-diagnostics の Phase 01 仮説 H3（「Google Form 回答は D1 に正しく取り込まれているが、`publicConsent=false` または `published=false` のフィルタが全件にかかり、公開 members 一覧で可視数 0 になっている」）を裏付ける指標として、`publicVisibility.allHiddenByPublishState === true` または `publicConsentTrue / totalMembers` の比率が極端に低い状態が観測される起票条件となっている。

### 1.2 問題点・課題

- 会員自身が「自分が公開対象に含まれているか」を profile 画面から確認できず、`publicConsent=false` の状態が放置される
- `publicConsent=false` の修正導線が UI に存在せず、MVP 仕様（Google Form 再回答が正式更新経路）だけでは UX として遠回り
- admin 側に「公開状態が一括で非公開化している場合に、一覧で一括 republish する」flow が無く、運用負荷が高い
- public members 一覧が空の状態が来訪ユーザに「会員が存在しない / サイトが壊れている」と誤認させる

### 1.3 放置した場合の影響

- public ディレクトリの本来目的（会員可視化）が達成されないまま運用が固定化する
- publicConsent 同意状態のメンテナンス手段が「Google Form 再回答」のみで、軽微な変更ですらユーザに大きな手間を強いる
- admin が個別 member を 1 件ずつ操作するしか手段が無く、復旧作業時間がスケールしない

---

## 2. 何を達成するか（What）

### 2.1 目的

H3 仮説で識別された「publicConsent / published が全件 false 寄りで公開 visible 0 件」状態を、UI から検知・修復できるようにする。

### 2.2 最終ゴール

- `publicVisibility.allHiddenByPublishState === false`
- 公開 members 一覧で可視数 > 0（少なくとも publicConsent=true の member は表示される）
- profile から publicConsent 状態を確認・変更できる
- admin から一括 publish / republish 操作が可能

### 2.3 スコープ

#### 含むもの

- profile 画面への publicConsent 状態表示 + toggle CTA
- admin 画面への members 一括 publish / republish flow 追加
- public members 一覧での「公開対象 0 件時」のフォールバック表示（CTA リンク含む）
- 既存 API endpoint surface のみを利用した adapter 層の追加（必要な場合）

#### 含まないもの

- Google Form 再回答経路自体の改修（不変条件 #7 維持）
- 新規 D1 schema の追加（不変条件: D1 schema 変更禁止）
- 新規 API endpoint の追加（不変条件: 既存 API のみ接続）
- publicConsent を Google Form 正本に書き戻す writeback 経路の実装

### 2.4 成果物

- profile publicConsent CTA 実装
- admin 一括 republish 画面 + 操作ログ（audit trail）
- public members 一覧の空状態 UX
- 受け入れ基準で示した metrics 反映確認の evidence

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- google-form-reflection-diagnostics Phase 01 / Phase 12 の仮説整理が main に取り込まれている
- 既存 admin members API / public members API が稼働しており shape が既知
- task-09 OKLch tokens / task-10 ui-primitives が利用可能

### 3.2 依存タスク

- 親: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/phase-01-requirements.md`（H3 仮説）
- 候補定義: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/outputs/phase-12/unassigned-task-detection.md`（Spec-B-3）

### 3.3 必要な知識

- `apps/web/app/(public)/members/*` の現行構成と SSR fetch 経路
- profile page の現行データソース（safeServerFetch 経由）
- admin mutation 経路（`@/features/admin/hooks/useAdminMutation` 標準）
- publicConsent / published / responseEmail の正本ソースと不変条件 #2 #3 #4
- OKLch tokens（HEX 直書き禁止）

### 3.4 推奨アプローチ

1. publicConsent toggle の reconcile 戦略を最初に設計フェーズで確定する（admin-managed data として分離 or Google Form 正本同期）
2. profile CTA は read-only 表示 + 注意書きから始め、toggle 動作は方針確定後に有効化する 2 段階リリース
3. admin 一括 republish は既存 admin mutation hook 経由で実装し、audit trail（who / when / 件数 / 対象 id 配列）を必ず残す
4. public 一覧の空状態 UX は既存 primitives で実装し、新規 primitive を生やさない（不変条件: プロトタイプ正本順位）

---

## 4. 実行手順

### Phase構成

1. publicConsent reconcile 戦略確定（設計）
2. profile publicConsent CTA 実装
3. admin 一括 republish flow 実装
4. public members 空状態 UX 実装
5. 受け入れ基準の検証

### Phase 1: publicConsent reconcile 戦略確定

#### 目的
不変条件 #4（Google Form schema 外は admin-managed data として分離）と #7（Form 再回答が正式更新経路）の衝突点を明文化し、UI toggle の意味論を確定する。

#### 手順
1. 既存 admin-managed data layer の有無を `apps/api/src/routes/` 配下で確認
2. publicConsent を「admin-managed override」として分離するか、Form 再回答 reconcile に揃えるかを ADR / decision-log として明記
3. profile toggle 後に Form 正本が上書きするケースの挙動を仕様化

#### 完了条件
decision-log に方針が記録され、後続 Phase の前提として参照可能

### Phase 2: profile publicConsent CTA 実装

#### 目的
会員が自身の publicConsent 状態を確認・変更できる導線を提供する。

#### 手順
1. profile page に publicConsent の現状表示（read-only）を追加
2. Phase 1 で確定した方針に従い toggle CTA を実装
3. 既存 OKLch tokens / ui-primitives のみで構成

#### 完了条件
profile から publicConsent 状態が確認でき、必要なら変更操作が UI 上で完結する

### Phase 3: admin 一括 republish flow 実装

#### 目的
admin が複数 member の publish / republish を一括で実行できる。

#### 手順
1. admin members 画面に bulk action UI（選択 + 一括操作ボタン）を追加
2. `@/features/admin/hooks/useAdminMutation` 経由で既存 admin members PATCH endpoint を呼ぶ adapter を作成
3. audit log（誰が / いつ / 件数 / 対象 id 配列 / 結果）を残す（既存 audit endpoint がある場合はそれを利用）

#### 完了条件
admin 1 操作で N 件の publish 状態を更新でき、audit trail が残る

### Phase 4: public members 空状態 UX 実装

#### 目的
可視 0 件のときにユーザの認知を改善し、必要な導線（profile / 会員登録）に誘導する。

#### 手順
1. `apps/web/app/(public)/members/*` で `allHiddenByPublishState` 相当の状態を判定
2. 既存 primitives で空状態カード + CTA を表示

#### 完了条件
0 件時にも壊れて見えず、何をすればよいか UX で示されている

### Phase 5: 受け入れ基準の検証

#### 目的
H3 仮説の解消を実機で確認する。

#### 手順
1. `publicVisibility.allHiddenByPublishState === false` を staging で確認
2. 公開 members 一覧で可視数 > 0 を確認
3. profile からの publicConsent 変更 e2e
4. admin 一括 republish e2e と audit trail 確認

#### 完了条件
受け入れ基準（§5）が全て充足

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `publicVisibility.allHiddenByPublishState === false`
- [ ] 公開 members 一覧で可視数 > 0
- [ ] profile から publicConsent 状態が確認・変更可能
- [ ] admin から一括 republish 操作が可能
- [ ] 一括 republish の audit trail（who / when / count / ids）が残る

### 品質要件

- [ ] OKLch tokens のみ使用（HEX 直書き 0 件、`verify-design-tokens` green）
- [ ] 既存 API endpoint surface のみ利用（新 endpoint 追加 0 件）
- [ ] D1 schema 変更 0 件
- [ ] admin form input は `FormField` 経由、admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #9 #10）

### ドキュメント要件

- [ ] Phase 1 の reconcile 戦略が decision-log として残る
- [ ] 苦戦箇所が §9 に記録

---

## 苦戦箇所・予測される困難

- **publicConsent の正本所在の方針確定**: 不変条件 #4 では Google Form schema 外データは admin-managed data として分離する。一方、不変条件 #7 では Google Form 再回答が本人更新の正式経路。publicConsent をフォーム正本に書き戻すか admin-managed data として分離するかを Phase 1 で明示的に決めないと、profile toggle の意味論が固定できず実装が手戻りする
- **UI toggle と Form 再回答の reconcile**: UI で publicConsent=true に変更した後にユーザが Form を再回答すると、Form 側の値で上書きされる可能性がある。reconcile 規則（最終更新優先 / admin override 優先 / Form 優先 のいずれか）を明確化しないと、ユーザの意図が消える事故が起きる
- **一括 republish の audit trail**: 誰が・いつ・何件・どの id を republish したかの監査記録が必須。既存 audit endpoint の shape を流用するか、admin-managed data 層に独自テーブルを用意するかは D1 schema 変更禁止条件と衝突する可能性があり、既存 endpoint で表現可能な範囲に収める設計判断が必要
- **OKLch tokens / primitive 流用整合**: task-09 / task-10 の primitive を流用し、新規 primitive を生やさない（不変条件: プロトタイプ正本順位）。空状態 UX や bulk action UI を既存 primitives だけで成立させる制約が苦戦点
- **public 一覧と profile / admin の 3 surface 同時改修**: 単一 PR で 3 surface を変更するため diff が膨らみやすく、レビュアビリティを保つために surface 単位の commit 分割が必要

---

## 6. 検証方法

### テストケース

- profile を開くと publicConsent 状態が表示される
- profile から publicConsent を true → false → true に変更しても整合する
- admin 一括 republish で複数件選択 → 操作後の published 状態が更新される
- 一括操作後に audit log が記録される
- public 一覧で可視 0 件のときに空状態 UX が表示される

### 検証手順

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test
# staging で実機
# 1. /profile で publicConsent 表示確認
# 2. /admin/members で bulk republish 実行
# 3. /(public)/members の visible 件数確認
# 4. publicVisibility metric の allHiddenByPublishState が false に遷移することを確認
```

---

## 7. リスクと対策

| リスク                                                                 | 影響度 | 発生確率 | 対策                                                                 |
| ---------------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------- |
| publicConsent 正本所在の方針未確定で実装が手戻り                      | 高     | 中       | Phase 1 を必ず最初に完了させ decision-log として残す                  |
| Form 再回答での上書き事故                                              | 中     | 中       | reconcile 規則を明文化し profile UI に注意書きを表示                   |
| 一括 republish で意図しない member を republish してしまう              | 高     | 低       | 確認ダイアログ + 対象件数明示 + dry-run preview                       |
| 新規 primitive を増やしてしまう                                        | 中     | 中       | コードレビューで primitive 増加 0 件を gate                           |
| HEX 直書きの混入                                                       | 中     | 低       | `verify-design-tokens` CI gate                                       |

---

## 8. 参照情報

### 関連ドキュメント

- 親仕様: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/phase-01-requirements.md`
- 候補定義: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/outputs/phase-12/unassigned-task-detection.md`（Spec-B-3）
- CLAUDE.md 不変条件 #2 (consent キー統一) / #4 (admin-managed data 分離) / #7 (Form 再回答が正式更新経路)
- `docs/00-getting-started-manual/claude-design-prototype/`（primitive / tokens / rhythm 正本）
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/02-auth.md`

### 参考資料

- H3 仮説起票トリガ: `publicVisibility.allHiddenByPublishState === true` または `publicConsentTrue / totalMembers` 比率が極端に低い

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 公開 members 一覧で可視数 0 件、profile から publicConsent 状態が見えない、admin に一括 republish 手段がない                                                          |
| 原因     | publicConsent / published フィルタが全件 false 寄りで、修正導線が Google Form 再回答のみ。MVP 仕様（Form 再回答正式経路）と admin-managed data 分離の境界が UI に出ていない |
| 対応     | profile に publicConsent CTA、admin に一括 republish flow、public 一覧に空状態 UX を導入。reconcile 戦略は Phase 1 で先行確定                                          |
| 再発防止 | publicConsent / published の reconcile 規則を decision-log として正本化し、後続 surface 追加時の参照を強制                                                              |

### レビュー指摘の原文（該当する場合）

```
google-form-reflection-diagnostics Phase 12 unassigned-task-detection.md にて
Spec-B-3 (H3 修復: 公開フィルタ UX 改修) を未実施タスクとして識別
```

### 補足事項

- 本タスクは H3 仮説の修復に絞り、H1 / H2（Form 取り込み経路自体の問題）には踏み込まない
- 新 endpoint 追加 / D1 schema 変更 / Google Form 仕様変更は本タスクの範囲外
- 実装着手前に Phase 1 の reconcile 戦略 decision-log が必須前提
