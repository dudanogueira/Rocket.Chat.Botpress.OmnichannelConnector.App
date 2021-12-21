import { IHttp, IHttpRequest, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AppSetting } from '../config/Settings';
import { Headers } from '../enum/Http';
import { Logs } from '../enum/Logs';
import { IBotpressMessage, IBotpressQuickReplies, IBotpressQuickReply } from '../enum/Botpress';
import { createHttpRequest } from './Http';
import { getAppSettingValue } from './Setting';
import { performHandover } from './Room';

export const sendMessage = async (read: IRead, http: IHttp, sender: string, text: string): Promise<Array<IBotpressMessage> | null> => {
	const botpressServerUrl = await getAppSettingValue(read, AppSetting.BotpressServerUrl);
	const BotpressBotId = await getAppSettingValue(read, AppSetting.BotpressBotId);
	if (!botpressServerUrl) { throw new Error(Logs.INVALID_BOTPRESS_SERVER_URL_SETTING); }
	const callbackEnabled: boolean = false

	const httpRequestContent: IHttpRequest = createHttpRequest(
		{ 'Content-Type': Headers.CONTENT_TYPE_JSON },
		{ text },
	);

	const botpressWebhookUrl = `${botpressServerUrl}/api/v1/bots/${BotpressBotId}/converse/${sender}`;
	const response = await http.post(botpressWebhookUrl, httpRequestContent);
	if (response.statusCode !== 200) {
		throw Error(`${ Logs.BOTPRESS_REST_API_COMMUNICATION_ERROR } ${ response.content } ${botpressServerUrl}`); 
	}

	if (!callbackEnabled) {

		const parsedMessage = parseBotpressResponse(response.data);
		return parsedMessage;
	}
	return null;
};

export const parseBotpressResponse = (response: any): Array<IBotpressMessage> => {
	if (!response) { throw new Error(Logs.INVALID_RESPONSE_FROM_BOTPRESS_CONTENT_UNDEFINED); }

	const messages: Array<IBotpressMessage> = [];
	response.responses.forEach((text) => {
		messages.push(parseSingleBotpressMessage(text));
	});


	return messages;
};

export const parseSingleBotpressMessage = (message: any): IBotpressMessage => {
	const { text, choices, actionId, data } = message;
	if (choices) {
		const quickReplyMessage: IBotpressQuickReplies = {
			text,
			quickReplies: choices
		};
		return {
			text: quickReplyMessage,
			sessionId: message.sessionId
		};
	} else {
		return {
			text: text,
			sessionId: message.sessionId
		};
	}
};
