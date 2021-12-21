import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatMessage, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting, DefaultMessage } from '../config/Settings';
import { Logs } from '../enum/Logs';
import { IBotpressMessage } from '../enum/Botpress';
import { createMessage, createBotpressMessage } from '../lib/Message';
import { sendMessage } from '../lib/Botpress';
import { getAppSettingValue } from '../lib/Setting';

export class PostMessageSentHandler {
    constructor(private app: IApp,
                private message: ILivechatMessage,
                private read: IRead,
                private http: IHttp,
                private persis: IPersistence,
                private modify: IModify) {}

    public async run() {

        const { text, editedAt, room, token, sender } = this.message;
        const livechatRoom = room as ILivechatRoom;

        const { id: rid, type, servedBy, isOpen } = livechatRoom;

        const BotpressBotUsername: string = await getAppSettingValue(this.read, AppSetting.BotpressBotUsername);

        if (!type || type !== RoomType.LIVE_CHAT) {
            return;
        }

        if (!isOpen || !token || editedAt || !text) {
            return;
        }

        if (!servedBy || servedBy.username !== BotpressBotUsername) {
            return;
        }

        if (sender.username === BotpressBotUsername) {
            return;
        }

        if (!text || (text && text.trim().length === 0)) {
            return;
        }

        let response: Array<IBotpressMessage> | null;
        try {
            response = await sendMessage(this.read, this.http, rid, text);

        } catch (error) {
            const serviceUnavailable: string = await getAppSettingValue(this.read, AppSetting.BotpressServiceUnavailableMessage);
            await createMessage(rid, this.read, this.modify, {
                text: serviceUnavailable ? serviceUnavailable : DefaultMessage.DEFAULT_BotpressServiceUnavailableMessage,
            });

            return;
        }

        if (response) {
            for (const message of response) {
                await createBotpressMessage(rid, this.read, this.modify, message);
            }
        }
    }
}