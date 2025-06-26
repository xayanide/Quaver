import type { QuaverClient, QuaverPlayer } from '#src/lib/util/common.d.js';
import {
    data,
    logger,
    MessageOptionsBuilderType,
} from '#src/lib/util/common.js';
import { settings } from '#src/lib/util/settings.js';
import { getGuildLocaleString } from '#src/lib/util/util.js';
import { load as effectsLoad } from '@lavaclient/plugin-effects';
import { load as queueLoad } from '@lavaclient/plugin-queue';
import {
    AttachmentBuilder,
    Client,
    Collection,
    EmbedBuilder,
    GatewayIntentBits,
} from 'discord.js';
import { writeFile } from 'fs/promises';
import { Node } from 'lavaclient';
import { createInterface } from 'node:readline';
import type { InteractionHandlerMapsFlat } from './events/discordClient/interactionCreate.d.js';
import * as nodePath from 'node:path';
import { getDirname, loadEventHandlers } from './lib/util/moduleLoaderUtils.js';
import { Server } from 'socket.io';
import express from 'express';
import type { Express } from 'express';
import * as http from 'node:http';
import * as https from 'node:https';
import { readFileSync } from 'node:fs';
import { getAbsoluteFileURL } from '@zptxdev/zptx-lib';
import { version } from './lib/util/version.js';

const dirname = getDirname(import.meta.url);

const NORMAL_PROCESS_EXIT_EVENTS = ['exit', 'SIGINT', 'SIGTERM'];
const TRACK_UPDATE_INTERVAL = 500;

let isProcessExiting = false;

const eventHandlersPath = nodePath.join(dirname, 'events');

/**
 * Listen to the process events first for the process to be able to catch potential errors
 * on the operations that follow it as early as possible.
 */
const nodeProcessEventsPath = nodePath.join(eventHandlersPath, 'nodeProcess');
await loadEventHandlers(nodeProcessEventsPath, process, {
    listenerPrependedArgs: [onProcessExit],
});

const readlineInterface = createInterface({
    input: process.stdin,
    output: process.stdout,
});
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

effectsLoad();
queueLoad();
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

function createHttpsServer(app: Express): https.Server {
    const keyPath = getAbsoluteFileURL(import.meta.url, [
        '..',
        ...settings.features.web.https.key.split('/'),
    ]);
    const certPath = getAbsoluteFileURL(import.meta.url, [
        '..',
        ...settings.features.web.https.cert.split('/'),
    ]);
    const credentials = {
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
    };
    return https.createServer(credentials, app);
}

function createIoServer(): Server | undefined {
    if (!settings.features.web.enabled) {
        return;
    }
    const app = express();
    if (settings.grafanaLogging) {
        app.get('/stats', async (req, res): Promise<void> => {
            const playersCache = lavaclientNode.players.cache;
            const playersValues = Array.from(playersCache.values());
            const totalSessions = playersCache.size;
            const activeSessions = playersValues.filter(
                (player: QuaverPlayer): boolean =>
                    !player.timeout && !player.pauseTimeout,
            ).length;
            const totalQueued = playersValues.reduce(
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
    const server = settings.features.web.https.enabled
        ? createHttpsServer(app)
        : http.createServer(app);
    server.listen(settings.features.web.port);
    return new Server(server, {
        cors: { origin: settings.features.web.allowedOrigins },
    });
}

const io = createIoServer();
discordClient.io = io;

function startPeriodicTrackUpdates(): void {
    if (!settings.features.web.enabled) return;
    setInterval(
        (): boolean => discordClient.emit('timer'),
        TRACK_UPDATE_INTERVAL,
    );
}

/**
 * Handles the exiting of process gracefully.
 * @param eventType - The event type triggering the exit. This determines if the exit was caused by a crash.
 * @param err - The error object, if any.
 */
async function onProcessExit(eventType: string, err?: Error): Promise<void> {
    if (isProcessExiting) return;
    isProcessExiting = true;
    logger.info({
        message: `Process is exiting${eventType ? ` due to ${eventType}` : ''}...`,
        label: 'Quaver',
    });
    try {
        if (!discordClient.isReady()) {
            return;
        }
        const players = lavaclientNode.players;
        const playersCache = players.cache;
        if (playersCache.size < 1) return;
        logger.info({
            message: 'Disconnecting from all guilds...',
            label: 'Quaver',
        });
        for (const pair of playersCache) {
            const player: QuaverPlayer = pair[1];
            const playerId = player.id;
            const playerQueue = player.queue;
            const queueTracks = playerQueue.tracks;
            logger.info({
                message: `[G ${playerId}] Disconnecting (restarting)`,
                label: 'Quaver',
            });
            const fileBuffer = [];
            if (playerQueue.current && (player.playing || player.paused)) {
                fileBuffer.push(
                    `${await getGuildLocaleString(playerId, 'MISC.CURRENT')}:`,
                );
                fileBuffer.push(playerQueue.current.info.uri);
            }
            if (queueTracks.length > 0) {
                fileBuffer.push(
                    `${await getGuildLocaleString(playerId, 'MISC.QUEUE')}:`,
                );
                fileBuffer.push(
                    queueTracks
                        .map((track): string => track.info.uri)
                        .join('\n'),
                );
            }
            await player.handler.disconnect();
            await player.handler.send(
                new EmbedBuilder()
                    .setDescription(
                        `${await getGuildLocaleString(
                            playerId,
                            [
                                ...NORMAL_PROCESS_EXIT_EVENTS,
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
                    .setFooter({
                        text: await getGuildLocaleString(
                            player.id,
                            'MUSIC.PLAYER.RESTARTING.APOLOGY',
                        ),
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
    } catch (error) {
        if (error instanceof Error) {
            logger.error({
                message: 'Encountered error while exiting process.',
                label: 'Quaver',
            });
            logger.error({
                message: `${error.message}\n${error.stack}`,
                label: 'Quaver',
            });
        }
    } finally {
        if (
            !NORMAL_PROCESS_EXIT_EVENTS.includes(eventType) &&
            err instanceof Error
        ) {
            logger.error({
                message: `${err.message}\n${err.stack}`,
                label: 'Quaver',
            });
            logger.info({
                message: 'Logging additional output to error.log.',
                label: 'Quaver',
            });
            try {
                await writeFile(
                    'error.log',
                    `${eventType}${err.message ? `\n${err.message}` : ''}${
                        err.stack ? `\n${err.stack}` : ''
                    }`,
                );
            } catch (e) {
                if (e instanceof Error) {
                    logger.error({
                        message:
                            'Encountered error while writing to error.log.',
                        label: 'Quaver',
                    });
                    logger.error({
                        message: `${e.message}\n${e.stack}`,
                        label: 'Quaver',
                    });
                }
            }
        }
        await discordClient.destroy();
        process.exit();
    }
}

// const commandsPath = nodePath.join('./', 'commands');
// const contextMenuCommandsPath = nodePath.join(
//     commandsPath,
//     'contextMenuCommands',
// );
// const componentsPath = nodePath.join('./', 'components');
// const selectMenusPath = nodePath.join(componentsPath, 'selectMenus');

// const flatAutocompletePaths = [nodePath.join('./', 'autocompletes')];
// const flatCommandPaths = [
//     nodePath.join(commandsPath, 'chatInputCommands'),
//     nodePath.join(contextMenuCommandsPath, 'messageContextMenuCommands'),
//     nodePath.join(contextMenuCommandsPath, 'userContextMenuCommands'),
// ];
// const flatComponentPaths = [
//     nodePath.join(componentsPath, 'buttons'),
//     nodePath.join(componentsPath, 'modalSubmits'),
//     nodePath.join(selectMenusPath, 'channelSelectMenus'),
//     nodePath.join(selectMenusPath, 'mentionableSelectMenus'),
//     nodePath.join(selectMenusPath, 'roleSelectMenus'),
//     nodePath.join(selectMenusPath, 'stringSelectMenus'),
//     nodePath.join(selectMenusPath, 'userSelectMenus'),
// ];

const readlineInterfaceEventsPath = nodePath.join(
    eventHandlersPath,
    'readlineInterface',
);
const keyvEventsPath = nodePath.join(eventHandlersPath, 'keyv');
const discordClientEventsPath = nodePath.join(
    eventHandlersPath,
    'discordClient',
);
const ioEventsPath = nodePath.join(eventHandlersPath, 'io');
const discordClientWsEventsPath = nodePath.join(discordClientEventsPath, 'ws');
const lavaclientNodeEventsPath = nodePath.join(eventHandlersPath, 'music');

await loadEventHandlers(readlineInterfaceEventsPath, readlineInterface, {
    listenerPrependedArgs: [onProcessExit, discordClient],
});
await loadEventHandlers(discordClientEventsPath, discordClient, {
    listenerPrependedArgs: [onProcessExit, discordClient],
});
// @ts-expect-error - Because of the Keyv instance's type having inconsistent EventEmitter typings.
await loadEventHandlers(keyvEventsPath, data.guild.instance, {
    listenerPrependedArgs: [onProcessExit],
});
if (io) {
    await loadEventHandlers(ioEventsPath, io, {
        listenerPrependedArgs: [discordClient],
    });
}
await loadEventHandlers(discordClientWsEventsPath, discordClient.ws, {
    listenerPrependedArgs: [lavaclientNode],
});
await loadEventHandlers(lavaclientNodeEventsPath, lavaclientNode, {
    listenerPrependedArgs: [onProcessExit, discordClient],
});

/**
 * By at this point in execution, once the features, modules and functions have been set up and ready,
 * it's a good time for the bot to login to Discord without any other hindrance.
 */
await discordClient.login(settings.token);

startPeriodicTrackUpdates();
