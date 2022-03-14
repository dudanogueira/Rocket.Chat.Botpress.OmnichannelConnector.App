import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";

export interface IBotpressMessage {
    message: string | any;
    sessionId: string;
}

export interface IBotpressQuickReplies {
    text: string;
    options: Array<IBotpressQuickReplyOptions>;
}

export interface IBotpressQuickReply {
    text: string;
    payload: string;
}

export interface IBotpressQuickReplyOptions {
	text: string;
	actionId?: string;
	buttonStyle?: ButtonStyle;
	data?: {
		[prop: string]: string;
	};
}

