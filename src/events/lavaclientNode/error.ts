import { logger } from '#src/lib/util/common.js';
import type { onProcessExit, QuaverClient } from '#src/lib/util/common.d.js';

export default {
    name: 'error',
    once: false,
    async execute(
        _onProcessExit: onProcessExit,
        _discordClient: QuaverClient,
        err: Error,
    ): Promise<void> {
        logger.error({
            message:
                'An error occurred. Quaver will now shut down to prevent any further issues.',
            label: 'Lavalink',
        });
        return _onProcessExit('lavalink', err);
    },
};
