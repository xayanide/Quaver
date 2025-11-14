import * as nodeFs from 'node:fs';
import * as nodeFsPromises from 'node:fs/promises';
import * as nodeHttp from 'node:http';
import * as nodeHttps from 'node:https';
import * as nodePath from 'node:path';
import * as nodeReadline from 'node:readline';
import type {
    QuaverClient,
    QuaverPlayer,
    QuaverAppStatus,
} from '#src/lib/util/common.d.js';
import {
    data,
    logger,
    MessageOptionsBuilderType,
} from '#src/lib/util/common.js';
import { settings } from '#src/lib/util/settings.js';
import {
    getGuildLocaleString,
    updateAcceptableSources,
    updateQueryOverrides,
    updateSourceManagers,
} from '#src/lib/util/util.js';
import { load as loadLavaclientPluginEffects } from '@lavaclient/plugin-effects';
import { load as loadLavaclientPluginQueue } from '@lavaclient/plugin-queue';
import { getAbsoluteFileURL } from '@zptxdev/zptx-lib';
import {
    AttachmentBuilder,
    Client,
    Collection,
    ContainerBuilder,
    FileBuilder,
    GatewayIntentBits,
    SeparatorBuilder,
    TextDisplayBuilder,
} from 'discord.js';
import type { Express } from 'express';
import express from 'express';
import { Node } from 'lavaclient';
import { Server } from 'socket.io';
import { version } from './lib/util/version.js';
import type { InteractionHandlerMapsFlat } from './events/discordClient/interactionCreate.d.js';
import createYoctoSpinner from 'yocto-spinner';
import colors from 'yoctocolors';
import {
    loadAllEventHandlers,
    getDirname,
    loadEventHandlers,
} from './lib/util/moduleLoaderUtils.js';
import type EventEmitter from 'node:events';
import type Keyv from 'keyv';

const NORMAL_PROCESS_EXIT_EVENTS = ['exit', 'SIGINT', 'SIGTERM'];
const EXCLUDE_EVENT_HANDLERS = ['nodeProcess', 'keyv', 'readlineInterface'];
const TRACK_UPDATE_INTERVAL = 500;

const appStatus: QuaverAppStatus = {
    startTime: Date.now(),
    isReady: false,
    isExiting: false,
};

const dirname = getDirname(import.meta.url);

logger.info({
    message: `Starting ${colors.magenta(`Quaver ${version}`)}...`,
    label: 'Quaver',
});

const eventHandlersPath = nodePath.join(dirname, 'events');
const nodeProcessEventsPath = nodePath.join(eventHandlersPath, 'nodeProcess');
const keyvEventsPath = nodePath.join(eventHandlersPath, 'keyv');
const readlineInterfaceEventsPath = nodePath.join(
    eventHandlersPath,
    'readlineInterface',
);

const spinner = createYoctoSpinner();

/**
 * Listen to the process and keyv events first for the process to be able to catch potential errors
 * on the operations that follow it as early as possible.
 */
spinner.start(`Loading eventHandlers: ${colors.cyan('nodeProcess')}`);
await loadEventHandlers(nodeProcessEventsPath, process, {
    listenerPrependedArgs: [onProcessExit],
});
spinner.success();

spinner.start(`Loading eventHandlers: ${colors.cyan('keyv')}`);
await loadEventHandlers(
    keyvEventsPath,
    data.guild.instance as Keyv & EventEmitter,
    {
        listenerPrependedArgs: [onProcessExit],
    },
);
spinner.success();

spinner.start(`Setting up: ${colors.cyan('readlineInterface')}`);
const readlineInterface = nodeReadline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
spinner.success();

spinner.start(`Setting up: ${colors.cyan('discordClient')}`);
const discordClient: QuaverClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
    ],
});
const interactionHandlerMaps: InteractionHandlerMapsFlat = {
    autocompletes: new Collection(),
    buttons: new Collection(),
    channelSelectMenus: new Collection(),
    chatInputCommands: new Collection(),
    mentionableSelectMenus: new Collection(),
    messageContextMenuCommands: new Collection(),
    modalSubmits: new Collection(),
    roleSelectMenus: new Collection(),
    stringSelectMenus: new Collection(),
    userContextMenuCommands: new Collection(),
    userSelectMenus: new Collection(),
};
discordClient.interactionHandlerMaps = interactionHandlerMaps;
discordClient.appStatus = appStatus;
spinner.success();

spinner.start(`Loading plugins: ${colors.cyan('lavaclient')}`);
loadLavaclientPluginEffects();
loadLavaclientPluginQueue();
spinner.success();

spinner.start(`Setting up: ${colors.cyan('lavaclientNode')}`);
const lavaclientNode = new Node({
    info: {
        host: settings.lavalink.host,
        port: settings.lavalink.port,
        auth: settings.lavalink.password,
        tls: !!settings.lavalink.secure,
    },
    ws: {
        reconnecting: {
            delay: settings.lavalink.reconnect.delay ?? 3000,
            tries: settings.lavalink.reconnect.tries ?? 5,
        },
    },
    discord: {
        sendGatewayCommand: (guildId, gatewayData): void =>
            discordClient.guilds.cache.get(guildId)?.shard?.send(gatewayData),
    },
});
discordClient.music = lavaclientNode;
spinner.success();

function createHttpsServer(app: Express): nodeHttps.Server {
    const keyPath = getAbsoluteFileURL(import.meta.url, [
        '..',
        ...settings.features.web.https.key.split('/'),
    ]);
    const certPath = getAbsoluteFileURL(import.meta.url, [
        '..',
        ...settings.features.web.https.cert.split('/'),
    ]);
    const options = {
        key: nodeFs.readFileSync(keyPath),
        cert: nodeFs.readFileSync(certPath),
    };
    return nodeHttps.createServer(options, app);
}

function createIoServer(): Server | undefined {
    if (!settings.features.web.enabled) {
        return;
    }
    logger.info({
        message: `Web integration is ${colors.green('enabled')}. For more information, visit ${colors.underline(colors.cyan('https://github.com/ZPTXDev/Quaver-Web'))}`,
        label: 'Quaver',
    });
    spinner.start(`Setting up: ${colors.cyan('ioServer')}`);
    const app = express();
    if (settings.grafanaLogging) {
        logger.info({
            message: `Grafana logging is ${colors.green('enabled')}. Statistics will be accessible through the /stats endpoint.`,
            label: 'Quaver',
        });
        app.get('/stats', async (_req, res): Promise<void> => {
            const playersCache = lavaclientNode.players.cache;
            const totalSessions = playersCache.size;
            const players = Array.from(playersCache.values());
            const activeSessions = players.filter(
                (player: QuaverPlayer): boolean =>
                    !player.timeout && !player.pauseTimeout,
            ).length;
            const totalQueued = players.reduce(
                (total: number, player: QuaverPlayer): number =>
                    total + player.queue?.tracks.length,
                0,
            );
            res.send({
                sessions: {
                    total: totalSessions,
                    active: activeSessions,
                    idle: totalSessions - activeSessions,
                },
                tracks: {
                    totalQueued: totalQueued,
                },
                versions: {
                    node: process.version,
                    quaver: version,
                },
                cache: {
                    guilds: discordClient.guilds.cache.size,
                    users: discordClient.users.cache.size,
                },
                memory: process.memoryUsage(),
            });
        });
    }
    const isWebHttpsEnabled = settings.features.web.https.enabled;
    const server = isWebHttpsEnabled
        ? createHttpsServer(app)
        : nodeHttp.createServer(app);
    server.listen(settings.features.web.port);
    const ioServer = new Server(server, {
        cors: { origin: settings.features.web.allowedOrigins },
    });
    spinner.success();
    return ioServer;
}

function startPeriodicTrackUpdates(): void {
    if (!settings.features.web.enabled) {
        return;
    }
    setInterval(
        (): boolean => discordClient.emit('timer'),
        TRACK_UPDATE_INTERVAL,
    );
}

const io = createIoServer();
discordClient.io = io;

const coreArgs = [onProcessExit, discordClient];

spinner.start(`Loading eventHandlers: ${colors.cyan('readlineInterface')}`);
await loadEventHandlers(readlineInterfaceEventsPath, readlineInterface, {
    listenerPrependedArgs: coreArgs,
});
spinner.success();

spinner.start(`Verifying ${colors.cyan('Lavalink plugins and sources')}`);
const requiredPlugins = [
    'lavasrc-plugin',
    'lavalyrics-plugin',
    'youtube-plugin',
    'java-lyrics-plugin',
];
const info = await lavaclientNode.api.info();
if (
    info.plugins.length === 0 ||
    !info.plugins
        .map((plugin): string => plugin.name)
        .every((plugin): boolean => requiredPlugins.includes(plugin))
) {
    logger.warn({
        message: 'Required plugins are not loaded. Some features may not work.',
        label: 'Lavalink',
    });
}
updateQueryOverrides(info.sourceManagers);
spinner.success();

spinner.start(`Configuring ${colors.cyan('Lavalink sources')}`);
const acceptableSources = {
    youtubemusic: 'ytmsearch:',
    youtube: 'ytsearch:',
    deezer: 'dzsearch:',
    soundcloud: 'scsearch:',
    yandexmusic: 'ymsearch:',
    vkmusic: 'vksearch:',
    tidal: 'tdsearch:',
};
if (
    info.sourceManagers.length === 0 ||
    !info.sourceManagers.some((source): boolean =>
        Object.keys(acceptableSources).includes(source),
    )
) {
    logger.warn({
        message:
            'No acceptable sources were found. It is HIGHLY unlikely that this instance will work as intended.',
        label: 'Lavalink',
    });
}
const sm = [...info.sourceManagers];
if (info.sourceManagers.includes('youtube')) sm.push('youtubemusic');
for (const source of Object.keys(acceptableSources)) {
    if (sm.includes(source)) continue;
    // @ts-expect-error - expected behaviour with check above
    delete acceptableSources[source];
}
updateSourceManagers(info.sourceManagers);
updateAcceptableSources(acceptableSources);
spinner.success();

/**
 * Shuts down Quaver and handles the exiting of process gracefully.
 * @param eventType - The event type triggering the exit. This determines if the exit was caused by a crash.
 * @param exitErr - The error object that's initially causing the exit of the process, if any.
 */
export async function onProcessExit(
    eventType: string,
    exitErr?: Error,
): Promise<void> {
    if (appStatus.isExiting) {
        return;
    }
    appStatus.isExiting = true;
    logger.info({
        message: `Process exiting${eventType ? ` due to ${eventType}` : ''}...`,
        label: 'Quaver',
    });
    const isReady = appStatus.isReady || discordClient.isReady();
    try {
        // Use appStatus first instead of direct property access to discordClient to prevent an uninitialization error
        // if the process encountered something and invoked this function before discordClient is initialized
        if (!isReady) {
            return;
        }
        const players = lavaclientNode.players;
        const playersCache = players.cache;
        if (playersCache.size < 1) {
            return;
        }
        logger.info({
            message: 'Disconnecting from all guilds...',
            label: 'Quaver',
        });
        for (const pair of playersCache) {
            const player: QuaverPlayer = pair[1];
            logger.info({
                message: `[G ${player.id}] Disconnecting (restarting)`,
                label: 'Quaver',
            });
            const fileBuffer = [];
            const playerQueue = player.queue;
            const queueCurrent = playerQueue.current;
            if (queueCurrent && (player.playing || player.paused)) {
                fileBuffer.push(
                    `${await getGuildLocaleString(player.id, 'MISC.CURRENT')}:`,
                );
                fileBuffer.push(queueCurrent.info.uri);
            }
            const queueTracks = playerQueue.tracks;
            if (queueTracks.length > 0) {
                fileBuffer.push(
                    `${await getGuildLocaleString(player.id, 'MISC.QUEUE')}:`,
                );
                fileBuffer.push(
                    queueTracks
                        .map((track): string => track.info.uri)
                        .join('\n'),
                );
            }
            const playerHandler = player.handler;
            await playerHandler.disconnect();
            await playerHandler.send(
                new ContainerBuilder({
                    components: [
                        new TextDisplayBuilder()
                            .setContent(
                                `${await getGuildLocaleString(
                                    player.id,
                                    [
                                        'exit',
                                        'SIGINT',
                                        'SIGTERM',
                                        'lavalink',
                                    ].includes(eventType)
                                        ? 'MUSIC.PLAYER.RESTARTING.DEFAULT'
                                        : 'MUSIC.PLAYER.RESTARTING.CRASHED',
                                )}${
                                    fileBuffer.length > 0
                                        ? `\n${await getGuildLocaleString(
                                              player.id,
                                              'MUSIC.PLAYER.RESTARTING.QUEUE_DATA_ATTACHED',
                                          )}`
                                        : ''
                                }`,
                            )
                            .toJSON(),
                        new TextDisplayBuilder()
                            .setContent(
                                await getGuildLocaleString(
                                    player.id,
                                    'MUSIC.PLAYER.RESTARTING.APOLOGY',
                                ),
                            )
                            .toJSON(),
                        ...(fileBuffer.length > 0
                            ? [
                                  new SeparatorBuilder().toJSON(),
                                  new FileBuilder()
                                      .setURL('attachment://queue.txt')
                                      .toJSON(),
                              ]
                            : []),
                    ],
                }),
                {
                    type: MessageOptionsBuilderType.Warning,
                    files:
                        fileBuffer.length > 0
                            ? [
                                  new AttachmentBuilder(
                                      Buffer.from(fileBuffer.join('\n')),
                                      { name: 'queue.txt' },
                                  ),
                              ]
                            : [],
                },
            );
        }
    } catch (cleanupErr) {
        if (!(cleanupErr instanceof Error)) {
            return;
        }
        logger.error({
            message: 'Encountered error while shutting down.',
            label: 'Quaver',
        });
        logger.error({
            message: `${cleanupErr.message}\n${cleanupErr.stack}`,
            label: 'Quaver',
        });
    } finally {
        await writeExitErrorToFile(eventType, exitErr);
        if (isReady) {
            await discordClient.destroy();
        }
        process.exit();
    }
}

async function writeExitErrorToFile(
    eventType: string,
    exitErr?: Error,
): Promise<void> {
    if (
        NORMAL_PROCESS_EXIT_EVENTS.includes(eventType) ||
        !(exitErr instanceof Error)
    ) {
        return;
    }
    logger.error({
        message: `${exitErr.message}\n${exitErr.stack}`,
        label: 'Quaver',
    });
    logger.info({
        message: 'Logging additional output to error.log.',
        label: 'Quaver',
    });
    try {
        await nodeFsPromises.writeFile(
            'error.log',
            `${eventType}${exitErr.message ? `\n${exitErr.message}` : ''}${
                exitErr.stack ? `\n${exitErr.stack}` : ''
            }`,
        );
    } catch (writeErr) {
        if (!(writeErr instanceof Error)) {
            return;
        }
        logger.error({
            message: 'Encountered error while writing to error.log.',
            label: 'Quaver',
        });
        logger.error({
            message: `${writeErr.message}\n${writeErr.stack}`,
            label: 'Quaver',
        });
    }
}

spinner.start(`Loading ${colors.cyan('locales')}`);
spinner.success();

// spinner.start(`Loading interactionHandlers: ${colors.cyan('command')}`);
// spinner.success();

// spinner.start(`Loading interactionHandlers: ${colors.cyan('autocomplete')}`);
// spinner.success();

// spinner.start(`Loading interactionHandlers: ${colors.cyan('component')}`);
// spinner.success();

await loadAllEventHandlers(
    nodePath.join(dirname, 'events'),
    {
        discordClient,
        lavaclientNode,
        io,
    },
    {
        discordClient: coreArgs,
        lavaclientNode: coreArgs,
        io: [discordClient],
    },
    {
        onProcess: async (
            bindingName: string,
            relativePath: string,
        ): Promise<boolean | void> => {
            if (EXCLUDE_EVENT_HANDLERS.includes(bindingName)) {
                return false;
            }
            if (relativePath === 'io/socket') {
                return false;
            }
            spinner.start(`Loading eventHandlers: ${colors.cyan(bindingName)}`);
        },
        onFinish: async (
            _bindingName: string,
            _relativePath: string,
            error: Error,
        ): Promise<void> => {
            if (error) {
                spinner.error(error.message);
            }
            spinner.success();
        },
    },
);

/**
 * By at this point in execution, once the features, modules and functions have been set up and ready,
 * it's a good time for the Discord client to login to Discord without any other hindrance.
 */
spinner.start(`Logging in to ${colors.cyan('Discord')}`);
await discordClient.login(settings.token);
spinner.success();

spinner.start(`Starting ${colors.cyan('periodic track updates')}`);
startPeriodicTrackUpdates();
spinner.success();
