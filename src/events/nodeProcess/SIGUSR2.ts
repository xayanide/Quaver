import type { onProcessExit } from '#src/lib/util/common.d.js';

export default {
    name: 'SIGUSR2',
    once: false,
    async execute(
        _onProcessExit: onProcessExit,
        signal: string,
    ): Promise<void> {
        await _onProcessExit(signal);
    },
};
