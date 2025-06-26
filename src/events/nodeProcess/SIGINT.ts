import type { onProcessExit } from '#src/lib/util/common.d.js';

export default {
    name: 'SIGINT',
    isOnce: false,
    async execute(
        _onProcessExit: onProcessExit,
        signal: string,
    ): Promise<void> {
        await _onProcessExit(signal);
    },
};
