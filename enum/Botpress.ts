export interface IBotpressMessage {
    text: string | IBotpressQuickReplies;
    sessionId: string;
}

export interface IBotpressQuickReplies {
    text: string;
    quickReplies: Array<IBotpressQuickReply>;
}

export interface IBotpressQuickReply {
    title: string;
    value: string;
}