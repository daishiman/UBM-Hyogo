# page tree（apps/web/app）

```
apps/web/app/
├── login/
│   ├── page.tsx                     # Server: gate-state を query から決定 + UI render
│   ├── _components/
│   │   ├── LoginPanel.client.tsx    # Client: form + state 切替
│   │   └── MagicLinkForm.client.tsx # Client: email + submit + cooldown
│   └── error.tsx                    # error boundary
├── profile/
│   ├── page.tsx                     # Server: session 必須 + 04b /me + /me/profile fetch
│   ├── _components/
│   │   ├── StatusSummary.tsx        # Server: rulesConsent / publicConsent / publishState
│   │   ├── ProfileFields.tsx        # Server: stableKey 経由参照のみ
│   │   ├── EditCta.tsx              # Server: editResponseUrl button + responderUrl link
│   │   └── AttendanceList.tsx       # Server: 参加履歴
│   ├── loading.tsx                  # streaming
│   ├── error.tsx                    # error boundary
│   └── not-found.tsx                # session あるが member 未解決時
└── api/auth/
    └── callback/
        ├── email/route.ts           # 05b の magic link 検証 callback
        └── google/route.ts          # 05a の Google OAuth callback
```

## Server / Client 境界

| route | Server | Client |
| --- | --- | --- |
| `/login` | gate-state 解決、UI shell | LoginPanel（state 切替）、MagicLinkForm（cooldown） |
| `/profile` | session lookup + 04b fetch | なし（profile は表示専用） |
