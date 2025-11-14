import type { Socket } from 'socket.io';
import type { QuaverClient } from '#src/lib/util/common.d.js';
import {
    getDirname,
    loadEventHandlers,
} from '#src/lib/util/moduleLoaderUtils.js';
import * as nodePath from 'node:path';

const dirname = getDirname(import.meta.url);

export default {
    name: 'connection',
    once: false,
    async execute(
        _discordClient: QuaverClient,
        socket: Socket & { discordClient: QuaverClient },
    ): Promise<void> {
        const io = _discordClient.io;
        if (!io) {
            return;
        }
        socket.discordClient = _discordClient;
        await loadEventHandlers(nodePath.join(dirname, 'socket'), socket);
    },
};
