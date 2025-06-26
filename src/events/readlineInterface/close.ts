import type { onProcessExit } from '#src/lib/util/common.d.js';

export default {
    name: 'close',
    isOnce: false,
    async execute(_onProcessExit: onProcessExit): Promise<void> {
        await _onProcessExit('SIGINT');
    },
};
