function buildRouterModal() {
  return {
    type: "modal",
    callback_id: "qa_router_modal",
    title: { type: "plain_text", text: "QA Tools" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: "What do you want to do?" },
        accessory: {
          type: "static_select",
          action_id: "qa_route_select",
          placeholder: { type: "plain_text", text: "Choose an action" },
          options: [
            {
              text: { type: "plain_text", text: "🔀  /branch — Claim or release a branch" },
              value: "branch",
            },
            {
              text: { type: "plain_text", text: "🔓  Release a branch you've claimed" },
              value: "release",
            },
            {
              text: { type: "plain_text", text: "📋  /qa-signoff — Submit a QA signoff" },
              value: "signoff",
            },
          ],
        },
      },
    ],
  };
}

module.exports = { buildRouterModal };
