import { logger } from '#src/lib/util/common.js';
import { Events, type Guild } from 'discord.js';
import type { onProcessExit, QuaverClient } from '#src/lib/util/common.d.js';

export default {
    name: Events.GuildCreate,
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
