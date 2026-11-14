export interface OpenChatDetail {
  topic:     'membership' | 'ticket' | 'general';
  ticketId?: string;
}

export const OPEN_CHAT_EVENT = 'ic:open-chat';

/** Open the concierge chat from anywhere (e.g. "Cancel membership", "Can't make it?"). */
export function openChat(detail: OpenChatDetail) {
  window.dispatchEvent(new CustomEvent<OpenChatDetail>(OPEN_CHAT_EVENT, { detail }));
}
