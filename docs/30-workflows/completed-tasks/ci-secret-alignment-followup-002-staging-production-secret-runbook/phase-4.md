# Phase 4: Open Questions 解決

## 目的

未確定事項を実装前に閉じ、runbook 作成をブロックしない状態にする。

## OQ-1: 1Password Item 名の正本

| 項目 | 内容 |
|------|------|
| 質問 | `op://UBM-Hyogo/Cloudflare API Token (staging)/credential` の Item 名は実 Vault と一致するか |
| 確認方法 | `op item list --vault UBM-Hyogo | grep -i cloudflare` を実装時に実行 |
| デフォルト方針 | Item が `Cloudflare API Token (staging)` / `Cloudflare API Token (production)` と命名されていない場合は、`scripts/cf.sh` が参照する正本 Item 名（`apps/api/.dev.vars.example` または `.env` の op 参照）に合わせる |
| 解決時期 | 実装サイクル Phase 1（runbook 起草開始時） |

## OQ-2: `gh secret set` の正規入力経路

| 項目 | 内容 |
|------|------|
| 質問 | 本 runbook で推奨する正規経路を `op read | gh secret set` の stdin 直結のみにするか、prompt 経路も併記するか |
| 解決 | 正規経路は `op read 'op://...' | gh secret set CLOUDFLARE_API_TOKEN --env <env>`。`gh secret set` は body 未指定時に stdin を読む。prompt 経路は user-only fallback として残すが、値の取得元は 1Password のままにし、実値を shell history / docs / AI chat に残さない注意を付ける |

## OQ-3: `staging-runtime-smoke` 環境との取り違え防止

| 項目 | 内容 |
|------|------|
| 質問 | `staging-runtime-smoke` Environment と `staging` Environment が両方存在することで「`staging-runtime-smoke` に `CLOUDFLARE_API_TOKEN` を投入」「`staging` に runtime smoke 用 5 secret を投入」の誤投入リスクをどう抑止するか |
| 解決 | 各 runbook 冒頭に「対象 environment と参照 workflow」マトリクスを明示し、不要 secret の例として「本 environment では投入してはいけない secret」リストを禁止事項に追加する |

## OQ-4: token scope の最小権限

| 項目 | 内容 |
|------|------|
| 質問 | Cloudflare API Token に与える scope を runbook に書くか |
| 解決 | 書く。`Workers Scripts:Edit` / `Pages:Edit` / `Account:Read` を最小権限として明記。account 範囲は staging / production それぞれの Cloudflare アカウントに限定する |

## OQ-5: rotation 頻度

| 項目 | 内容 |
|------|------|
| 質問 | rotation 推奨頻度を runbook に書くか |
| 解決 | 「定期: 90 日ごと / 即時: 漏洩疑いがある場合」とのみ記載。schedule 化はしない（運用負荷の合意が無いため別 task） |

## OQ-6: 親 `index.md` への追記範囲

| 項目 | 内容 |
|------|------|
| 質問 | 親 workflow は `completed-tasks/` 配下のため、`index.md` 編集が completed-tasks immutability に抵触するか |
| 解決 | 親 `index.md` の In-scope 表に runbook 2 本のリンクを 2 行追加するのみ。spec 内容の変更ではないため immutability 対象外。git diff で 2 行追加のみであることを Phase 11 evidence で示す |

## 残課題

なし。すべての OQ が本 Phase で解決方針を確定済。

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 4 |
| 状態 | completed |

## 実行タスク

- OQ-1 から OQ-6 の解決方針を確定する。

## 参照資料

- `gh secret set --help`
- `.github/workflows/web-cd.yml`

## 成果物/実行手順

- Open Questions 解決表。

## 統合テスト連携

- CLI と workflow trigger の整合は Phase 11 evidence で確認する。

- 全 OQ に解決方針または確認手順が記述されている
- 実装サイクルが Open Questions 由来でブロックされない
