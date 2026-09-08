// Modal for releasing a branch directly from /qa, instead of hunting for the
// original claim message. `myClaims` is an array of claim objects (already
// filtered to the requesting user's own active claims).

function buildReleaseModal(myClaims) {
  if (myClaims.length === 0) {
    return {
      type: "modal",
      callback_id: "release_branch_modal_empty",
      title: { type: "plain_text", text: "Release a branch" },
      close: { type: "plain_text", text: "Close" },
      blocks: [
        {
          type: "section",
          text: { type: "mrkdwn", text: "You don't have any branches currently claimed. Nothing to release." },
        },
      ],
    };
  }

  return {
    type: "modal",
    callback_id: "release_branch_modal",
    title: { type: "plain_text", text: "Release a branch" },
    submit: { type: "plain_text", text: "Release" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "input",
        block_id: "release_branch_block",
        label: { type: "plain_text", text: "Which branch?" },
        element: {
          type: "static_select",
          action_id: "release_branch_select",
          placeholder: { type: "plain_text", text: "Choose a branch" },
          options: myClaims.map((c) => ({
            text: { type: "plain_text", text: c.branch },
            value: c.branch,
          })),
        },
      },
    ],
  };
}

module.exports = { buildReleaseModal };
