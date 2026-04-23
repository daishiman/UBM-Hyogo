# UBM兵庫支部会 メンバープロフィール - 作成結果

作成日時: 2026-04-09

## フォーム情報

| 項目 | 値 |
|------|-----|
| タイトル | UBM兵庫支部会 メンバープロフィール |
| フォームID | 119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg |
| 回答用URL | https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform |
| 編集用URL | https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit |
| 保存先フォルダ | 1dThvcML6spp0ndyA1X10YXPXcrL2A_0p |
| ステータス | 公開・回答受付中 |

## 次のステップ

- [ ] 回答用URLをメンバーに共有する
- [ ] 回答集計後、Next.jsサイト連携を検討
- [ ] スプレッドシート連携：フォーム編集画面の「回答」タブから設定可能
- [ ] ホームページ掲載同意と勧誘ルール同意を含む最新 schema を前提にする

## Google Sheets API連携メモ（将来のNext.js統合向け）

フォームの回答はGoogle Forms APIで取得可能:
```
GET https://forms.googleapis.com/v1/forms/{formId}/responses
```

フォームID: `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`
