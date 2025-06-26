import type { onProcessExit } from '#src/lib/util/common.d.js';

export default {
    name: 'unhandledRejection',
    isOnce: false,
    async execute(_onProcessExit: onProcessExit, reason: Error): Promise<void> {
        await _onProcessExit('unhandledRejection', reason);
    },
};
