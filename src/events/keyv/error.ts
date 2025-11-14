import { logger } from '#src/lib/util/common.js';
import type { onProcessExit } from '#src/lib/util/common.d.js';

export default {
    name: 'error',
    once: false,
    async execute(_onProcessExit: onProcessExit, err: Error): Promise<void> {
        logger.error({
            message: 'Failed to connect to database.',
            label: 'Keyv',
        });
        await _onProcessExit('keyv', err);
    },
};
