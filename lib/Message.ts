import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { BlockElementType, BlockType, IActionsBlock, IButtonElement, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSetting } from '../config/Settings';
import { Logs } from '../enum/Logs';
import { IBotpressMessage, IBotpressQuickReplies, IBotpressQuickReply } from '../enum/Botpress';
import { getAppSettingValue } from './Setting';
import { uuid } from './Helper';

export const createBotpressMessage = async (rid: string, read: IRead,  modify: IModify, botpressMessage: IBotpressMessage): Promise<any> => {
    const { text, quickReplies } = botpressMessage.text as IBotpressQuickReplies;

    if (text && quickReplies) {
        // botpressMessage is instanceof IBotpressQuickReplies
        const elements: Array<IButtonElement> = quickReplies.map((payload: IBotpressQuickReply) => ({
            type: BlockElementType.BUTTON,
            text: {
                type: TextObjectType.PLAINTEXT,
                text: payload.title,
            },
            value: payload.value,
            actionId: uuid(),
        } as IButtonElement));

        const actionsBlock: IActionsBlock = { type: BlockType.ACTIONS, elements };

        await createMessage(rid, read, modify, { text });
        await createMessage(rid, read, modify, { actionsBlock });
    } else {
        // botpressMessage is instanceof string
        await createMessage(rid, read, modify, { text: botpressMessage.text });
    }
};

export const createMessage = async (rid: string, read: IRead,  modify: IModify, message: any ): Promise<any> => {
    if (!message) {
        return;
    }

    const botUserName = await getAppSettingValue(read, AppSetting.BotpressBotUsername);
    if (!botUserName) {
        return new Error(Logs.EMPTY_BOT_USERNAME_SETTING);
    }

    const sender = await read.getUserReader().getByUsername(botUserName);
    if (!sender) {
        return new Error(Logs.INVALID_BOT_USERNAME_SETTING);
    }

    const room = await read.getRoomReader().getById(rid);
    if (!room) {
        return new Error(Logs.INVALID_ROOM_ID);
    }

    const msg = modify.getCreator().startMessage().setRoom(room).setSender(sender);
    const { text, actionsBlock } = message;

    if (text) {
        msg.setText(text);
    }

    if (actionsBlock) {
        const { elements } = actionsBlock as IActionsBlock;
        msg.addBlocks(modify.getCreator().getBlockBuilder().addActionsBlock({ elements }));
    }

    return new Promise(async (resolve) => {
        modify.getCreator().finish(msg)
        .then((result) => resolve(result))
        .catch((error) => console.error(error));
    });
};

export const createLivechatMessage = async (rid: string, read: IRead,  modify: IModify, message: any, visitor: IVisitor ): Promise<any> => {
    if (!message) {
        return;
    }

    const botUserName = await getAppSettingValue(read, AppSetting.BotpressBotUsername);
    if (!botUserName) {
        return new Error(Logs.EMPTY_BOT_USERNAME_SETTING);
    }

    const room = await read.getRoomReader().getById(rid);
    if (!room) {
        return new Error(`${ Logs.INVALID_ROOM_ID } ${ rid }`);
    }

    const msg = modify.getCreator().startLivechatMessage().setRoom(room).setVisitor(visitor);

    const { text, attachment } = message;

    if (text) {
        msg.setText(text);
    }

    if (attachment) {
        msg.addAttachment(attachment);
    }

    return new Promise(async (resolve) => {
        modify.getCreator().finish(msg)
        .then((result) => resolve(result))
        .catch((error) => console.error(error));
    });
};

export const deleteAllActionBlocks = async (modify: IModify, appUser: IUser, msgId: string): Promise<void> => {
    const msgBuilder = await modify.getUpdater().message(msgId, appUser);
    msgBuilder.setEditor(appUser).setBlocks(modify.getCreator().getBlockBuilder().getBlocks());
    return modify.getUpdater().finish(msgBuilder);
};