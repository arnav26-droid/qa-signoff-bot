const { REPOS, DURATIONS } = require("../config");

function buildBranchClaimModal() {
  return {
    type: "modal",
    callback_id: "branch_claim_modal",
    title: { type: "plain_text", text: "Claim a branch" },
    submit: { type: "plain_text", text: "Claim" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "input",
        block_id: "branch_block",
        label: { type: "plain_text", text: "Branch" },
        element: {
          type: "multi_static_select",
          action_id: "branch_select",
          placeholder: { type: "plain_text", text: "Search and choose one or more" },
          options: REPOS.map((r) => ({
            text: { type: "plain_text", text: r },
            value: r,
          })),
        },
      },
      {
        type: "input",
        block_id: "sync_block",
        optional: true,
        label: { type: "plain_text", text: "Branch status" },
        element: {
          type: "checkboxes",
          action_id: "sync_checkbox",
          options: [
            {
              text: { type: "plain_text", text: "Is your branch in sync with main?" },
              value: "in_sync",
            },
          ],
        },
      },
      {
        type: "input",
        block_id: "duration_block",
        label: { type: "plain_text", text: "For how long?" },
        element: {
          type: "static_select",
          action_id: "duration_select",
          placeholder: { type: "plain_text", text: "Choose duration" },
          options: DURATIONS.map((d) => ({
            text: { type: "plain_text", text: d.label },
            value: d.value,
          })),
        },
      },
      {
        type: "input",
        block_id: "note_block",
        optional: true,
        label: { type: "plain_text", text: "What are you testing? (optional)" },
        element: {
          type: "plain_text_input",
          action_id: "note_input",
          placeholder: { type: "plain_text", text: "e.g. inventory pricing regression" },
        },
      },
    ],
  };
}

module.exports = { buildBranchClaimModal };
