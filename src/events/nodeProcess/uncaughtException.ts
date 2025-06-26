import type { onProcessExit } from '#src/lib/util/common.d.js';

export default {
    name: 'uncaughtException',
    isOnce: false,
    async execute(_onProcessExit: onProcessExit, err: Error): Promise<void> {
        await _onProcessExit('uncaughtException', err);
    },
};
