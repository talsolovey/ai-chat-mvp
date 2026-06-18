export type MessageCursor = {
  sentAt: string;
  id: string;
};

export function encodeMessageCursor(cursor: MessageCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeMessageCursor(raw: string): MessageCursor | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(raw, 'base64url').toString('utf8'),
    );
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Record<string, unknown>).sentAt === 'string' &&
      typeof (parsed as Record<string, unknown>).id === 'string'
    ) {
      const { sentAt, id } = parsed as MessageCursor;
      return { sentAt, id };
    }
    return null;
  } catch {
    return null;
  }
}
