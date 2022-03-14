import { IHttp, IHttpRequest, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AppSetting } from '../config/Settings';
import { Headers } from '../enum/Http';
import { Logs } from '../enum/Logs';
import { IBotpressMessage, IBotpressQuickReplies, IBotpressQuickReply } from '../enum/Botpress';
import { createHttpRequest } from './Http';
import { getAppSettingValue } from './Setting';
import { performHandover } from './Room';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';

export const sendMessage = async (app: IApp, read: IRead, http: IHttp, sender: string, text: string): Promise<Array<IBotpressMessage> | null> => {
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

		const parsedMessage = parseBotpressResponse(app,response.data);
		return parsedMessage;
	}
	return null;
};

export const parseBotpressResponse = (app: IApp, response: any): Array<IBotpressMessage> => {
	if (!response) { throw new Error(Logs.INVALID_RESPONSE_FROM_BOTPRESS_CONTENT_UNDEFINED); }

	const messages: Array<IBotpressMessage> = [];
	response.responses.forEach((text) => {
		messages.push(parseSingleBotpressMessage(app, text));
	});


	return messages;
};

export const parseSingleBotpressMessage = (app: IApp, message: any): IBotpressMessage => {

    app.getLogger().error(`response! ${JSON.stringify(message)}`);

    const { sessionId, text, choices } = message;


    app.getLogger().error(`choices! ${JSON.stringify(choices)}`);

    let options: any = []


	if (choices) {

        choices.forEach(choice => {
            options.push(
                {
                    'text': choice.title,
                    'actionId': choice.value,
                    'buttonStyle': choice.buttonStyle,
                    'data': {
                        'department': choice.department
                    }
                })
        });

		const quickReplyMessage = {
			text,
			options: options
		};
		return {
			message: quickReplyMessage,
			sessionId: sessionId
		};
	} else {
		return {
			message: text,
			sessionId: sessionId
		};
	}
};
