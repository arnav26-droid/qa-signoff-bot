// Each linked item (PR, Linear, Notion, Artifact, Testiny, Test Plan) is a single
// textbox - just paste the link (or ticket ref) and it's posted as-is. Slack
// auto-links any bare URL in the posted message, so no separate label field needed.
function linkField(prefix, displayName, { optional = false, placeholder } = {}) {
  return {
    type: "input",
    block_id: `${prefix}_block`,
    optional,
    label: { type: "plain_text", text: displayName },
    element: {
      type: "plain_text_input",
      action_id: `${prefix}_input`,
      placeholder: { type: "plain_text", text: placeholder || "https://..." },
    },
  };
}

function buildSignoffModal() {
  return {
    type: "modal",
    callback_id: "qa_signoff_modal",
    title: { type: "plain_text", text: "QA Signoff" },
    submit: { type: "plain_text", text: "Submit" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "input",
        block_id: "title_block",
        label: { type: "plain_text", text: "Feature / Title" },
        element: {
          type: "plain_text_input",
          action_id: "title_input",
          placeholder: { type: "plain_text", text: "Inventory-Based Dynamic Pricing" },
        },
      },
      {
        type: "input",
        block_id: "branch_block",
        label: { type: "plain_text", text: "Branch" },
        element: {
          type: "plain_text_input",
          action_id: "branch_input",
          placeholder: { type: "plain_text", text: "e.g. omni, db-proxy" },
        },
      },
      { type: "divider" },
      linkField("pr", "PR", { placeholder: "https://github.com/.../pull/742" }),
      linkField("linear", "Linear", { placeholder: "https://linear.app/.../issue/TPV-741" }),
      linkField("notion", "Notion", { optional: true, placeholder: "https://app.notion.com/p/..." }),
      linkField("artifact", "Artifact", { optional: true, placeholder: "https://..." }),
      linkField("testiny", "Testiny", { placeholder: "https://app.testiny.io/.../tc/..." }),
      linkField("testplan", "Test Plan", { optional: true, placeholder: "https://linear.app/.../issue/TPV-778" }),
      { type: "divider" },
      {
        type: "input",
        block_id: "comments_block",
        optional: true,
        label: { type: "plain_text", text: "Comments" },
        element: { type: "plain_text_input", action_id: "comments_input", multiline: true },
      },
    ],
  };
}

module.exports = { buildSignoffModal };
