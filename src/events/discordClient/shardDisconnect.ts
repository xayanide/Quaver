import { logger } from '#src/lib/util/common.js';
import { Events } from 'discord.js';

export default {
    name: Events.ShardDisconnect,
    once: false,
    execute(): void {
        logger.warn({ message: 'Disconnected.', label: 'Discord' });
    },
};
