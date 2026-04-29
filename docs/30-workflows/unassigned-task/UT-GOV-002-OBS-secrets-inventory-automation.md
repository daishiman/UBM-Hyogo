# UT-GOV-002-OBS: secrets inventory automation

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-GOV-002-OBS |
| 種別 | observability / governance |
| 優先度 | medium |
| visualEvidence | NON_VISUAL |
| 上流 | `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-6/failure-cases.md` |

## スコープ

### 含む

- GitHub Secrets / Variables / Cloudflare Secrets の棚卸し手順化
- dry-run mode の自動化方針
- secrets 値をログに出さない検証

### 含まない

- secrets rotate の自動化
- secrets 値の取得や出力
- OIDC 化の本実装

## 苦戦ポイント

- GitHub と Cloudflare の権限モデル差
- 1Password 参照とローカル CLI 実行の境界
- 棚卸し結果のログに秘密値を混ぜないこと

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 自動化スクリプトが secrets 値を出力 | 名前・存在・更新日時だけを扱う dry-run mode に限定 |
| Cloudflare と GitHub の棚卸し結果が混ざる | provider 別の出力テーブルに分離 |
| rotate と棚卸しが混同される | rotate は明示的に別タスク化 |

## 検証方法

- `scripts/with-env.sh` 経由で dry-run
- secrets 値らしき文字列が出力されないことを grep
- provider 別サマリーの生成確認

## 参照

- `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-6/failure-cases.md`
- `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-12/unassigned-task-detection.md`
