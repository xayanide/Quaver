import { logger } from '#src/lib/util/common.js';
import type { Guild } from 'discord.js';
import type { onProcessExit, QuaverClient } from '#src/lib/util/common.d.js';

export default {
    name: 'guildCreate',
    once: false,
    execute(
        _onProcessExit: onProcessExit,
        _discordClient: QuaverClient,
        guild: Guild,
    ): void {
        logger.info({
            message: `[G ${guild.id}] Joined guild ${guild.name}`,
            label: 'Discord',
        });
    },
};
