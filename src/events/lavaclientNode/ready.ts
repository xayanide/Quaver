import { data, logger } from '#src/lib/util/common.js';
import type {
    QuaverChannels,
    QuaverPlayer,
    onProcessExit,
    QuaverClient,
} from '#src/lib/util/common.d.js';
import { get } from 'lodash-es';
import PlayerHandler from '#src/lib/PlayerHandler.js';
import type { LavalinkWSClientReadyEvent } from 'lavalink-ws-client';

export default {
    name: 'ready',
    once: false,
    async execute(
        _onProcessExit: onProcessExit,
        _discordClient: QuaverClient,
        event: LavalinkWSClientReadyEvent,
    ): Promise<void> {
        if (!_discordClient.music.ws.session) {
            logger.warn({
                message:
                    'Waiting 5 seconds before re-triggering ready event for Lavalink WS session...',
                label: 'Quaver',
            });
            setTimeout((): void => {
                _discordClient.music.emit('ready', event);
            }, 5_000);
            return;
        }
        logger.info({ message: 'Ready.', label: 'Lavalink' });
        for await (const [
            guildId,
            guildData,
        ] of data.guild.instance.iterator()) {
            if (get(guildData, 'settings.stay.enabled')) {
                const guild = _discordClient.guilds.cache.get(guildId);
                if (!guild) continue;
                const player = _discordClient.music.players.create(
                    guildId,
                ) as QuaverPlayer;
                player.handler = new PlayerHandler(_discordClient, player);
                player.queue.channel = guild.channels.cache.get(
                    get(guildData, 'settings.stay.text'),
                ) as QuaverChannels;
                player.voice.connect(get(guildData, 'settings.stay.channel'), {
                    deafened: true,
                });
            }
        }
    },
};
