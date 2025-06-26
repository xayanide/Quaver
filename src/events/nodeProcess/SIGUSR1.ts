import type { onProcessExit } from '#src/lib/util/common.d.js';

export default {
    name: 'SIGUSR1',
    isOnce: false,
    async execute(
        _onProcessExit: onProcessExit,
        signal: string,
    ): Promise<void> {
        await _onProcessExit(signal);
    },
};
