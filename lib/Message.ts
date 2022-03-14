import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { BlockElementType, BlockType, IActionsBlock, IBlock, IButtonElement, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSetting } from '../config/Settings';
import { Logs } from '../enum/Logs';
import { IBotpressMessage, IBotpressQuickReplies, IBotpressQuickReply, IBotpressQuickReplyOptions } from '../enum/Botpress';
import { getAppSettingValue } from './Setting';
import { uuid } from './Helper';
import { ActionIds } from '../enum/ActionIds';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IMessageParam } from '../types/misc';

export const createBotpressMessage = async (
    app: IApp,
    rid: string,
    read: IRead,
    modify: IModify,
    botpressMessage: IBotpressMessage
    ): Promise<any> => {
    const { text, options } = botpressMessage.message as IBotpressQuickReplies;

    if (text && options) {
        // botpressMessage is instanceof IBotpressQuickReplies
        const elements: Array<IButtonElement> = options.map(
            (payload: IBotpressQuickReplyOptions) => {
                const buttonElement: IButtonElement = {
                    type: BlockElementType.BUTTON,
                    actionId: payload.actionId || uuid(),
                    text: {
                        text: payload.text,
                        type: TextObjectType.PLAINTEXT,
                    },
                    value: payload.text,
                    ...(payload.buttonStyle && {
                        style: payload.buttonStyle,
                    }),
                };

                if (
                    payload.actionId &&
                    payload.actionId === ActionIds.PERFORM_HANDOVER
                ) {
                    buttonElement.value =
                        payload.data && payload.data.departmentName
                            ? payload.data.departmentName
                            : undefined;
                }

                return buttonElement;
            },
        );

        const blocks = modify.getCreator().getBlockBuilder();

        blocks.addSectionBlock({
            text: blocks.newMarkdownTextObject(text),
        });

        blocks.addActionsBlock({
            elements,
        });

        const blockArray = blocks.getBlocks();

        await createMessage(app, rid, read, modify, { blocks: blockArray });
    } else {
        // botpressMessage is instanceof string
        await createMessage(app, rid, read, modify, { text: botpressMessage.message as string });
    }
};

export const createMessage = async (app: IApp, rid: string, read: IRead,  modify: IModify, message: IMessageParam ): Promise<any> => {
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
	const { text, blocks, attachment } = message;

    if (text) {
        msg.setText(text);
    }

    if (attachment) {
		msg.addAttachment(attachment);
	}


    if (blocks) {
		msg.addBlocks(blocks);
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

export const deleteAllActionBlocks = async (
	modify: IModify,
	appUser: IUser,
	msgId: string,
): Promise<void> => {
	const msgBuilder = await modify.getUpdater().message(msgId, appUser);

	const withoutActionBlocks: Array<IBlock> = msgBuilder
		.getBlocks()
		.filter(
			(block) =>
				!(
					block.type === BlockType.ACTIONS &&
					(block as IActionsBlock).elements.some(
						(element) => element.type === BlockElementType.BUTTON,
					)
				),
		);

	msgBuilder.setEditor(appUser).setBlocks(withoutActionBlocks);
	return modify.getUpdater().finish(msgBuilder);
};

