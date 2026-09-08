# qa-signoff-bot

One command, **`/qa`**, opens a small picker with a single dropdown: choose **"/branch
— Claim or release a branch"**, **"Release a branch you've claimed"**, or **"/qa-signoff
— Submit a QA signoff"**, and the modal immediately swaps into the full form for that
flow — no separate slash commands to remember. `/qa-status` stays as its own quick,
read-only command since it doesn't need a form at all.

**All messages post back to whichever channel you ran `/qa` in** — claim announcements,
release/free notices, and signoffs. So the bot needs to be invited into every channel
where people will actually use it, not just one central channel.

1. **`/qa` → Branch** — pick one or more branches from a curated, searchable
   multi-select (edit the list in `config.js`) to claim at once, for 15/30/45/60
   minutes, and optionally check **"Is your branch in sync with main?"** — that status
   shows up in the posted claim message. If any of your picks are already claimed, none
   of them get claimed — you're DM'd exactly which ones are taken, by whom, and for how
   long, with a **"Notify me"** button per conflicting branch. Otherwise everything you
   picked gets locked together and announced with one **Release [branch]** button per
   branch. **Only the person who claimed a branch can release it** — anyone else who
   clicks gets a private "only @X can release this" reply instead. Unreleased claims
   auto-expire (checked every minute). If you can't find the original claim message,
   `/qa` → **"Release a branch you've claimed"** shows a dropdown of just your own
   active claims and releases whichever one you pick — no need to scroll for the
   message.
2. **`/qa-status`** — see every currently claimed branch and time remaining.
3. **`/qa` → QA Signoff** — structured signoff form: Feature/Title, Branch, and single
   textboxes for PR, Linear, Notion, Artifact, Testiny, and Test Plan — just paste the
   link (Slack auto-links any bare URL when the message posts), e.g.:

   > 📋 **QA Signoff** — Inventory-Based Dynamic Pricing
   > *Branch:* db-proxy
   > *PR:* https://github.com/.../pull/742
   > *Linear:* https://linear.app/.../issue/TPV-741
   > *Notion:* https://app.notion.com/p/...
   > *Artifact:* https://...
   > *Testiny:* https://app.testiny.io/.../tc/...
   > *Test Plan:* https://linear.app/.../issue/TPV-778

## 1. Create the Slack app

1. Go to https://api.slack.com/apps → **Create New App** → **From an app manifest**.
2. Pick your workspace, paste in `manifest.yml`, and create the app.
3. Under **Basic Information** → **App-Level Tokens**, generate a token with the
   `connections:write` scope (this is `SLACK_APP_TOKEN`).
4. Under **OAuth & Permissions**, click **Install to Workspace**, then copy the **Bot
   User OAuth Token** (`SLACK_BOT_TOKEN`).
5. Under **Basic Information**, copy the **Signing Secret**.
6. Invite the bot to your target channel: `/invite @qa-signoff-bot`.
7. Get that channel's ID (right-click → View channel details → copy the ID at the
   bottom) for `QA_STATUS_CHANNEL_ID` — this is only used as a fallback if the invoking
   channel can't be determined; in normal use every message posts to wherever `/qa` was
   run, not this fixed channel.

## 2. Configure

```bash
cp .env.example .env
# fill in SLACK_BOT_TOKEN, SLACK_APP_TOKEN, SLACK_SIGNING_SECRET, QA_STATUS_CHANNEL_ID
```

Edit `config.js` to add/remove branches from the picker's list, or change the claim
duration options.

## 3. Run

```bash
npm install
npm start
```

Runs in Socket Mode — no public URL/tunnel needed. For always-on use, run under `pm2`,
`systemd`, or a small background service.

## Notes

- **Persistence** is a flat `data.json` next to the app — fine for a single instance.
  Swap `src/store.js` for a real DB if you need multi-instance or historical reporting.
- **Signoff link fields** are optional except PR, Linear, and Testiny — Notion, Artifact,
  and Test Plan are optional since not every feature has those. Any field left fully
  blank is just omitted from the posted message rather than showing an empty line.
- If you want the full signoff also generated as a Slack Canvas artifact (like the
  qa-status-bot project), that's a straightforward addition — just say the word.
