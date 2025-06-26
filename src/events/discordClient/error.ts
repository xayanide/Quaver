import { logger } from '#src/lib/util/common.js';
import type { QuaverClient, onProcessExit } from '#src/lib/util/common.d.js';
import { Events } from 'discord.js';

export default {
    name: Events.Error,
    isOnce: false,
    execute(
        _onProcessExit: onProcessExit,
        _discordClient: QuaverClient,
        err: Error,
    ): void {
        logger.error({
            message: `${err.message}\n${err.stack}`,
            label: 'Quaver',
        });
    },
};
