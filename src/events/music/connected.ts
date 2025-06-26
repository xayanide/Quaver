import PlayerHandler from '#src/lib/PlayerHandler.js';
import type {
    onProcessExit,
    QuaverChannels,
    QuaverClient,
    QuaverPlayer,
} from '#src/lib/util/common.d.js';
import { data, logger } from '#src/lib/util/common.js';
import {
    updateAcceptableSources,
    updateQueryOverrides,
    updateSourceManagers,
} from '#src/lib/util/util.js';
import type { LavalinkWSClientConnectedEvent } from 'lavalink-ws-client';
import { get } from 'lodash-es';

const LAVALINK_REQUIRED_PLUGINS = [
    'lavasrc-plugin',
    'lavalyrics-plugin',
    'youtube-plugin',
    'java-lyrics-plugin',
];

export default {
    name: 'connected',
    isOnce: false,
    async execute(
        _onProcessExit: onProcessExit,
        _discordClient: QuaverClient,
        connectionData: LavalinkWSClientConnectedEvent,
    ): Promise<void> {
        const lavalinkAcceptableSources = {
            youtubemusic: 'ytmsearch:',
            youtube: 'ytsearch:',
            deezer: 'dzsearch:',
            soundcloud: 'scsearch:',
            yandexmusic: 'ymsearch:',
            vkmusic: 'vksearch:',
            tidal: 'tdsearch:',
        };

        logger.info({
            message: connectionData.reconnected ? 'Reconnected.' : 'Connected.',
            label: 'Lavalink',
        });
        const lavalinkApiInfo = await _discordClient.music.api.info();
        const lavalinkPlugins = lavalinkApiInfo.plugins;
        const lavalinkSourceManagers = lavalinkApiInfo.sourceManagers;
        if (
            lavalinkPlugins.length === 0 ||
            !lavalinkPlugins
                .map((plugin): string => plugin.name)
                .every((plugin): boolean =>
                    LAVALINK_REQUIRED_PLUGINS.includes(plugin),
                )
        ) {
            logger.warn({
                message:
                    'Required plugins are not loaded. Some features may not work.',
                label: 'Lavalink',
            });
        }
        updateQueryOverrides(lavalinkSourceManagers);
        if (
            lavalinkSourceManagers.length === 0 ||
            !lavalinkSourceManagers.some((source): boolean =>
                Object.keys(lavalinkAcceptableSources).includes(source),
            )
        ) {
            logger.warn({
                message:
                    'No acceptable sources were found. It is HIGHLY unlikely that this instance will work as intended.',
                label: 'Lavalink',
            });
        }
        const activeSourceManagers = [...lavalinkSourceManagers];
        if (lavalinkSourceManagers.includes('youtube')) {
            activeSourceManagers.push('youtubemusic');
        }
        for (const source of Object.keys(lavalinkAcceptableSources)) {
            if (activeSourceManagers.includes(source)) continue;
            // @ts-expect-error - expected behaviour with check above
            delete lavalinkAcceptableSources[source];
        }
        updateSourceManagers(lavalinkSourceManagers);
        updateAcceptableSources(lavalinkAcceptableSources);
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
                player.handler = new PlayerHandler(
                    _discordClient as QuaverClient,
                    player,
                );
                player.queue.channel = guild.channels.cache.get(
                    get(guildData, 'settings.stay.text'),
                ) as QuaverChannels;
                await player.voice.connect(
                    get(guildData, 'settings.stay.channel'),
                    {
                        deafened: true,
                    },
                );
            }
        }
    },
};
