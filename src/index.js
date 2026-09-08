require("dotenv").config();
const { App } = require("@slack/bolt");
const store = require("./store");
const { buildBranchClaimModal } = require("./branchModal");
const { buildSignoffModal } = require("./signoffModal");
const { buildRouterModal } = require("./routerModal");
const { buildReleaseModal } = require("./releaseModal");
const { formatTimeRemaining, formatClockTime } = require("./helpers");

const CHANNEL = process.env.QA_STATUS_CHANNEL_ID;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
});

// ---------- /qa : open the router modal (choose Branch or Signoff) ----------
app.command("/qa", async ({ ack, body, client }) => {
  await ack();
  const view = buildRouterModal();
  // Remember which channel this was invoked from, so downstream messages
  // (claim announcements, signoffs, release/free notices) post back there.
  view.private_metadata = JSON.stringify({ channelId: body.channel_id });
  await client.views.open({
    trigger_id: body.trigger_id,
    view,
  });
});

// ---------- router dropdown: swap the modal's content in place ----------
app.action("qa_route_select", async ({ ack, body, client, action }) => {
  await ack();
  const choice = action.selected_option.value;

  let view;
  if (choice === "branch") {
    view = buildBranchClaimModal();
  } else if (choice === "release") {
    const myClaims = Object.values(store.getAllClaims()).filter((c) => c.userId === body.user.id);
    view = buildReleaseModal(myClaims);
  } else {
    view = buildSignoffModal();
  }
  view.private_metadata = body.view.private_metadata; // carry the channel context forward
  await client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view,
  });
});

// ---------- /qa-status : list current claims ----------
app.command("/qa-status", async ({ ack, respond }) => {
  await ack();
  const claims = store.getAllClaims();
  const entries = Object.values(claims);
  if (entries.length === 0) {
    await respond({ response_type: "ephemeral", text: "No branches are currently claimed. 🎉" });
    return;
  }
  const lines = entries.map(
    (c) =>
      `• *${c.branch}* — claimed by <@${c.userId}>, free in ${formatTimeRemaining(
        c.expiresAt
      )} (~${formatClockTime(c.expiresAt)})${c.note ? ` — _${c.note}_` : ""}`
  );
  await respond({ response_type: "ephemeral", text: lines.join("\n") });
});

// ---------- branch claim modal submission ----------
app.view("branch_claim_modal", async ({ ack, body, view, client }) => {
  const values = view.state.values;
  const selectedBranches = values.branch_block.branch_select.selected_options.map((o) => o.value);
  const inSyncWithMain = values.sync_block.sync_checkbox.selected_options.length > 0;
  const durationMinutes = parseInt(values.duration_block.duration_select.selected_option.value, 10);
  const note = values.note_block.note_input.value || "";
  const userId = body.user.id;
  const userName = body.user.name;
  const meta = JSON.parse(view.private_metadata || "{}");
  const channelId = meta.channelId || CHANNEL;

  if (selectedBranches.length === 0) {
    await ack({
      response_action: "errors",
      errors: { branch_block: "Choose at least one branch." },
    });
    return;
  }

  const branchKeys = selectedBranches;

  // Check ALL requested branches are free before claiming any of them -
  // avoids partially claiming a batch.
  const conflicts = branchKeys
    .map((key) => store.getClaim(key))
    .filter((existing) => existing && existing.expiresAt > Date.now());

  if (conflicts.length > 0) {
    const conflictLines = conflicts
      .map(
        (c) =>
          `\`${c.branch}\` — claimed by @${c.userName}, free in ${formatTimeRemaining(
            c.expiresAt
          )} (~${formatClockTime(c.expiresAt)})`
      )
      .join("\n");
    await ack({
      response_action: "errors",
      errors: { branch_block: "Some of these are already claimed - see DM for details and try again." },
    });
    await client.chat.postMessage({
      channel: userId,
      text: `Couldn't claim everything you picked - already in use:\n${conflictLines}`,
      blocks: [
        {
          type: "section",
          text: { type: "mrkdwn", text: `Couldn't claim everything you picked — already in use:\n${conflictLines}` },
        },
        {
          type: "actions",
          elements: conflicts.map((c) => ({
            type: "button",
            text: { type: "plain_text", text: `🔔 Notify me: ${c.branch}` },
            action_id: "notify_when_free",
            value: c.branch,
          })),
        },
      ],
    });
    return;
  }

  const claims = branchKeys.map((key) =>
    store.claimBranch(key, userId, userName, durationMinutes, note, channelId, inSyncWithMain)
  );
  await ack();

  const branchList = claims.map((c) => `\`${c.branch}\``).join(", ");
  const syncNote = inSyncWithMain ? "✅ in sync with main" : "⚠️ not confirmed in sync with main";
  const claimText = `<@${userId}> is using ${branchList} for ${durationMinutes} mins (until ~${formatClockTime(
    claims[0].expiresAt
  )}) — ${syncNote}${note ? `\n> ${note}` : ""}`;

  try {
    await client.chat.postMessage({
      channel: channelId,
      text: claimText,
      blocks: [
        {
          type: "section",
          text: { type: "mrkdwn", text: claimText },
        },
        {
          type: "actions",
          elements: claims.map((c) => ({
            type: "button",
            text: { type: "plain_text", text: `🔓 Release ${c.branch}` },
            action_id: "release_branch",
            value: c.branch,
            style: "danger",
          })),
        },
      ],
    });
  } catch (err) {
    console.error(`Failed to post claim announcement to ${channelId}:`, err.data?.error || err.message);
    // Let the claimer know privately so this doesn't fail silently - most likely
    // cause is the bot not being a member of that channel/DM.
    await client.chat.postMessage({
      channel: userId,
      text: `⚠️ I claimed ${branchList} for you, but couldn't post the announcement there (${
        err.data?.error || "unknown error"
      }). This usually means I haven't been added to that channel/conversation yet.`,
    });
  }
});

// ---------- release button ----------
app.action("release_branch", async ({ ack, body, client, action }) => {
  await ack();
  const branch = action.value;
  const claim = store.getClaim(branch);
  const requesterId = body.user.id;

  if (!claim) return;
  if (claim.userId !== requesterId) {
    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: requesterId,
      text: `Only <@${claim.userId}> (who claimed it) can release *${branch}*.`,
    });
    return;
  }

  const released = store.releaseBranch(branch);
  await notifyWaitersAndAnnounceFree(client, released);
});

// ---------- release modal submission (from /qa -> "Release a branch") ----------
app.view("release_branch_modal", async ({ ack, body, view, client }) => {
  const branch = view.state.values.release_branch_block.release_branch_select.selected_option.value;
  const requesterId = body.user.id;
  const claim = store.getClaim(branch);

  // Re-check ownership at submit time in case the claim changed since the modal opened.
  if (!claim) {
    await ack({
      response_action: "errors",
      errors: { release_branch_block: "That branch isn't claimed anymore." },
    });
    return;
  }
  if (claim.userId !== requesterId) {
    await ack({
      response_action: "errors",
      errors: { release_branch_block: `This is now claimed by @${claim.userName}, not you — can't release it.` },
    });
    return;
  }

  await ack();
  const released = store.releaseBranch(branch);
  await notifyWaitersAndAnnounceFree(client, released);
});

// ---------- "notify me when free" button ----------
app.action("notify_when_free", async ({ ack, body, client, action }) => {
  await ack();
  const branch = action.value;
  const userId = body.user.id;
  const userName = body.user.username || body.user.name;
  const claim = store.addWaiter(branch, userId, userName);
  if (claim) {
    await client.chat.postMessage({
      channel: userId,
      text: `Got it — I'll DM you the moment *${branch}* frees up.`,
    });
  } else {
    await client.chat.postMessage({
      channel: userId,
      text: `*${branch}* is already free — go ahead and claim it with /branch.`,
    });
  }
});

// ---------- qa signoff modal submission ----------
app.view("qa_signoff_modal", async ({ ack, body, view, client }) => {
  await ack();
  const v = view.state.values;
  const userId = body.user.id;
  const meta = JSON.parse(view.private_metadata || "{}");
  const channelId = meta.channelId || CHANNEL;

  const title = v.title_block.title_input.value;
  const branch = (v.branch_block.branch_input.value || "").trim();

  const pr = (v.pr_block.pr_input.value || "").trim();
  const linear = (v.linear_block.linear_input.value || "").trim();
  const notion = (v.notion_block.notion_input.value || "").trim();
  const artifact = (v.artifact_block.artifact_input.value || "").trim();
  const testiny = (v.testiny_block.testiny_input.value || "").trim();
  const testPlan = (v.testplan_block.testplan_input.value || "").trim();
  const comments = v.comments_block.comments_input.value || "";

  const lines = [`*Branch:* ${branch}`];
  if (pr) lines.push(`*PR:* ${pr}`);
  if (linear) lines.push(`*Linear:* ${linear}`);
  if (notion) lines.push(`*Notion:* ${notion}`);
  if (artifact) lines.push(`*Artifact:* ${artifact}`);
  if (testiny) lines.push(`*Testiny:* ${testiny}`);
  if (testPlan) lines.push(`*Test Plan:* ${testPlan}`);
  if (comments) lines.push(`*Comments:* ${comments}`);

  try {
    await client.chat.postMessage({
      channel: channelId,
      text: `QA signoff from <@${userId}>: ${title}`,
      blocks: [
        {
          type: "section",
          text: { type: "mrkdwn", text: `📋 *QA Signoff* — ${title}\n_from <@${userId}>_\n\n${lines.join("\n")}` },
        },
      ],
    });
  } catch (err) {
    console.error(`Failed to post signoff to ${channelId}:`, err.data?.error || err.message);
    await client.chat.postMessage({
      channel: userId,
      text: `⚠️ Your signoff was recorded, but I couldn't post it there (${
        err.data?.error || "unknown error"
      }). This usually means I haven't been added to that channel/conversation yet.`,
    });
  }
});

// ---------- expiry scheduler: checks every minute ----------
async function notifyWaitersAndAnnounceFree(client, claim) {
  if (!claim) return;
  try {
    await client.chat.postMessage({
      channel: claim.channelId || CHANNEL,
      text: `🔓 *${claim.branch}* is now free.`,
    });
  } catch (err) {
    console.error(`Failed to announce ${claim.branch} freeing up:`, err.data?.error || err.message);
  }
  for (const w of claim.waiters) {
    try {
      await client.chat.postMessage({
        channel: w.userId,
        text: `🔓 *${claim.branch}* just freed up. Grab it with /branch before someone else does.`,
      });
    } catch (err) {
      console.error(`Failed to notify waiter ${w.userId} for ${claim.branch}:`, err.data?.error || err.message);
    }
  }
}

function startScheduler(client) {
  setInterval(async () => {
    const expired = store.getExpiredBranches();
    for (const claim of expired) {
      const released = store.releaseBranch(claim.branch);
      await notifyWaitersAndAnnounceFree(client, released);
    }
  }, 60 * 1000);
}

(async () => {
  await app.start();
  console.log("⚡️ qa-signoff-bot is running (Socket Mode)");
  startScheduler(app.client);
})();
