import type { onProcessExit } from '#src/lib/util/common.d.js';

// 'close' event catches CTRL+C
export default {
    name: 'close',
    once: false,
    async execute(_onProcessExit: onProcessExit): Promise<void> {
        await _onProcessExit('SIGINT');
    },
};
