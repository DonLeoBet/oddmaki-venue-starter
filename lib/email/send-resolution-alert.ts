export type ResolutionAlertKind = "assertion" | "dispute";

export interface ResolutionAlertPayload {
  kind: ResolutionAlertKind;
  assertionId: string;
  marketId: string;
  marketQuestion: string;
  proposedOutcome: string;
  asserter: string;
  operatorAddress?: string;
  matchUrl?: string;
  isForeignAsserter: boolean;
}

function alertSubject(payload: ResolutionAlertPayload): string {
  if (payload.kind === "dispute") {
    return `[DISPUTE] ${payload.proposedOutcome} — ${payload.marketQuestion.slice(0, 60)}`;
  }

  const flag = payload.isForeignAsserter ? "[ACTION NEEDED] " : "";

  return `${flag}Resolution asserted: ${payload.proposedOutcome} — ${payload.marketQuestion.slice(0, 60)}`;
}

function alertBody(payload: ResolutionAlertPayload): string {
  if (payload.kind === "dispute") {
    return [
      "An assertion on this venue was disputed and escalated to UMA DVM.",
      "Review promptly — settlement is paused until the vote completes (~48h typical).",
      "",
      `Market: ${payload.marketQuestion}`,
      `Market ID: ${payload.marketId}`,
      `Proposed outcome: ${payload.proposedOutcome}`,
      `Original asserter: ${payload.asserter}`,
      `Assertion ID: ${payload.assertionId}`,
      "",
      payload.matchUrl ? `Open match: ${payload.matchUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const lines = [
    payload.isForeignAsserter ?
      "Someone other than your operator wallet asserted this market. Review within the 24h challenge window."
    : "Your venue received a new resolution assertion.",
    "",
    `Market: ${payload.marketQuestion}`,
    `Market ID: ${payload.marketId}`,
    `Proposed outcome: ${payload.proposedOutcome}`,
    `Asserter: ${payload.asserter}`,
    `Assertion ID: ${payload.assertionId}`,
    "",
    "Timeline:",
    "- Correct results are usually posted within about an hour after full time.",
    "- The on-chain challenge window is 24 hours before final settlement.",
    "- If the result looks wrong, dispute in OddMaki before the window ends.",
    "",
    payload.matchUrl ? `Open match: ${payload.matchUrl}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}

/** Sends via [Resend](https://resend.com) — works with Hostinger DNS on your domain. */
export async function sendResolutionAlertEmail(
  payload: ResolutionAlertPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.RESOLUTION_ALERT_EMAIL?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  if (!to) {
    throw new Error("RESOLUTION_ALERT_EMAIL is not set");
  }

  const from =
    process.env.RESOLUTION_ALERT_FROM?.trim() ??
    "Poly.Football Alerts <alerts@poly.football>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: alertSubject(payload),
      text: alertBody(payload),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();

    throw new Error(`Resend error ${response.status}: ${detail}`);
  }
}
