## Summary

Ships a single-page chat UI built on **React 19 + Vite + TypeScript ** against an in-browser **MSW** mock that implements the [API contract](../API_CONTRACT.md) the Week-3 backend will need to satisfy. The user picks an identity, sees their conversations on the left, opens a thread on the right, and sends messages with optimistic rendering + rollback on simulated failure.

## Components

```
features/
├── auth/
│   ├── components/AuthScreen      ← user picker (loading / error / empty / list states)
│   └── hooks/useAvailableUsers    ← reducer-backed users fetch
└── chat/
    ├── hooks/
    │   ├── useConversations       ← reducer-backed list, filtered by participant + sorted desc
    │   ├── useMessages            ← reducer-backed thread + optimistic send/rollback
    │   └── messageThreadReducer   ← load/start, load/success, load/error,
    │                                send/optimistic, send/success, send/error
    └── components/
        ├── ChatApp                ← two-pane layout, owns selectedConversationId + draft
        ├── ConversationList       ← sidebar, aria-pressed selection
        ├── MessageThread          ← scrollable list, auto-scroll to bottom
        └── MessageComposer        ← controlled textarea, Enter sends, Shift+Enter newlines
components/
├── Skeleton                       ← shimmer placeholder
└── Toast                          ← auto-dismissing alert for send errors
```

## States handled

Every async surface renders all four branches
| Surface | Loading | Empty | Error | Success |
|---|---|---|---|---|
| **`AuthScreen`** | "Loading users…" | "No users available." | inline alert with `error.message` | one `<button>` per user |
| **`ConversationList`** | three `<Skeleton>` rows | "No conversations yet." (`data-testid="conversations-empty"`) | `role="alert"` with `error.message` | sorted list, `aria-pressed` on the selected row |
| **`MessageThread`** (no selection) | — | "Select a conversation to start chatting." | — | — |
| **`MessageThread`** (selected) | three `<Skeleton>` bubbles | "No messages yet. Say hi." | `role="alert"` | `<ul>` of bubbles, outgoing vs. incoming styling |
| **Send** | `isSending: true`, optimistic bubble visible | — | rollback + `<Toast role="alert">` | temp message swapped for server-generated `Message` |
