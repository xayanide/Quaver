import { logger } from '#src/lib/util/common.js';
import type { onProcessExit, QuaverClient } from '#src/lib/util/common.d.js';
import { Events } from 'discord.js';

export default {
    name: Events.ShardError,
    once: false,
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
