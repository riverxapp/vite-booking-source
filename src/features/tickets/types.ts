/** One entry in a conversation, in the shape both the agent view and the portal render. */
export type ThreadMessage = {
  id: number;
  senderType: "customer" | "agent";
  senderName: string;
  senderAvatar: string | null;
  message: string;
  isInternal: boolean;
  createdAt: Date | string;
};
