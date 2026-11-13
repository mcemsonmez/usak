import "server-only";
import type { Repairer } from "./find-repairers";

export type ContactChannel = "email" | "sms";

export type ContactResult = {
  sent: false;
  channel: ContactChannel;
  message: string;
};

/**
 * Placeholder: email/SMS sending is not implemented yet.
 * Returns the message that would be sent instead of sending it.
 */
export function contactRepairer(params: {
  repairer: Repairer;
  channel: ContactChannel;
  issue: string;
  propertyAddress: string;
}): ContactResult {
  const { repairer, channel, issue, propertyAddress } = params;
  const target = channel === "sms" ? (repairer.phone ?? "no phone number") : repairer.name;
  return {
    sent: false,
    channel,
    message:
      `[Not sent: ${channel} sending is not implemented yet] ` +
      `To ${repairer.name} (${target}): We have a maintenance request at ${propertyAddress}: ` +
      `"${issue}". Are you available, and what is your earliest date?`,
  };
}
