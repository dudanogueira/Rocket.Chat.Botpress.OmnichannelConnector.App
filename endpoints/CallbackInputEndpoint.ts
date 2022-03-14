import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { Headers, Response } from '../enum/Http';
import { Logs } from '../enum/Logs';
import { IBotpressMessage } from '../enum/Botpress';
import { createHttpResponse } from '../lib/Http';
import { createBotpressMessage } from '../lib/Message';
import { parseSingleBotpressMessage } from '../lib/Botpress';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';

export class CallbackInputEndpoint extends ApiEndpoint {
    public path = 'callback';

    public async post(app: IApp,
                      request: IApiRequest,
                      endpoint: IApiEndpointInfo,
                      read: IRead,
                      modify: IModify,
                      http: IHttp,
                      persis: IPersistence): Promise<IApiResponse> {
        this.app.getLogger().info(Logs.ENDPOINT_RECEIVED_REQUEST);

        try {
            await this.processRequest(app, read, modify, persis, request.content);
            return createHttpResponse(HttpStatusCode.OK, { 'Content-Type': Headers.CONTENT_TYPE_JSON }, { result: Response.SUCCESS });
        } catch (error) {
            return createHttpResponse(HttpStatusCode.INTERNAL_SERVER_ERROR, { 'Content-Type': Headers.CONTENT_TYPE_JSON }, { error: error.message });
        }
    }

    private async processRequest(app: IApp, read: IRead, modify: IModify, persis: IPersistence, endpointContent: any) {
        const message: IBotpressMessage  = parseSingleBotpressMessage(app, endpointContent);

        await createBotpressMessage(app, message.sessionId, read, modify, message);
    }
}
