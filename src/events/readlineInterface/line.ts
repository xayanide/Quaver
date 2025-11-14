import type {
    QuaverClient,
    WhitelistedFeatures,
    onProcessExit,
} from '#src/lib/util/common.d.js';
import { data } from '#src/lib/util/common.js';
import { settings } from '#src/lib/util/settings.js';
import { msToTime, msToTimeString, parseTimeString } from '@zptxdev/zptx-lib';
import { inspect } from 'node:util';

export default {
    name: 'line',
    once: false,
    async execute(
        _onProcessExit: onProcessExit,
        _discordClient: QuaverClient,
        input: string,
    ): Promise<void> {
        const command = input.split(' ')[0].toLowerCase();
        const isReady =
            _discordClient.appStatus.isReady || _discordClient.isReady();
        if (['sessions', 'whitelist'].includes(command) && !isReady) {
            console.log('Quaver is not initialized yet.');
            return;
        }
        switch (command) {
            case 'exit':
                await _onProcessExit('exit');
                break;
            case 'sessions':
                console.log(
                    `There are currently ${_discordClient.music.players.cache.size} active session(s).`,
                );
                break;
            case 'stats': {
                const uptime = msToTime(_discordClient.uptime);
                const uptimeString = msToTimeString(uptime);
                console.log(
                    `Statistics:\nGuilds: ${_discordClient.guilds.cache.size}\nUptime: ${uptimeString}`,
                );
                break;
            }
            case 'whitelist': {
                const guildId = input.split(' ')[1];
                const feature = input.split(' ')[2];
                const duration = input.split(' ')[3];
                let durationMs = -1;
                if (!guildId || !feature) {
                    console.log(
                        'Usage: whitelist <guildId> <feature> [duration]',
                    );
                    break;
                }
                const guild = await _discordClient.guilds.fetch(guildId);
                if (!guild) {
                    console.log('Guild not found.');
                    break;
                }
                if (!['stay', 'autolyrics', 'smartqueue'].includes(feature)) {
                    console.log(
                        'Available features: stay, autolyrics, smartqueue',
                    );
                    break;
                }
                let featureName = '';
                switch (feature) {
                    case 'stay':
                        featureName = '24/7';
                        break;
                    case 'autolyrics':
                        featureName = 'Auto Lyrics';
                        break;
                    case 'smartqueue':
                        featureName = 'Smart Queue';
                }
                if (
                    !settings.features[feature as WhitelistedFeatures].whitelist
                ) {
                    console.log(`The ${featureName} whitelist is not enabled.`);
                    break;
                }
                if (duration) {
                    if (!parseTimeString(duration)) {
                        console.log('Duration example: 5d1h, 1h30m, 10s');
                        break;
                    }
                    durationMs = parseTimeString(duration);
                }
                const whitelisted = !!(await data.guild.get<number>(
                    guildId,
                    `features.${feature}.whitelisted`,
                ));
                if (whitelisted && !duration) {
                    await data.guild.unset(
                        guildId,
                        `features.${feature}.whitelisted`,
                    );
                    console.log(
                        `Removed ${guild.name} from the ${featureName} whitelist.`,
                    );
                    break;
                }
                await data.guild.set(
                    guildId,
                    `features.${feature}.whitelisted`,
                    durationMs === -1 ? durationMs : Date.now() + durationMs,
                );
                console.log(
                    `Added ${guild.name} to the ${featureName} whitelist ${
                        durationMs === -1
                            ? 'permanently'
                            : `for ${msToTimeString(msToTime(durationMs))}`
                    }.`,
                );
                break;
            }
            case 'eval': {
                if (!settings.developerMode) {
                    console.log('Developer mode is not enabled.');
                    break;
                }
                if (!input.substring(command.length + 1)) {
                    console.log('No input provided.');
                    break;
                }
                let output: string;
                try {
                    output = await eval(input.substring(command.length + 1));
                    if (typeof output !== 'string') {
                        output = inspect(output, { depth: 1 });
                    }
                } catch (error) {
                    output = error;
                }
                if (!output) output = '[no output]';
                console.log(output);
                break;
            }
            default:
                console.log(
                    'Available commands: exit, sessions, whitelist, stats',
                );
                break;
        }
    },
};
