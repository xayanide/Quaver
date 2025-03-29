import { settings } from './settings.js';

export enum Check {
    /**
     * Only allowed in guild
     */
    GuildOnly = 'CHECK.GUILD_ONLY',
    /**
     * Must have an active session
     */
    ActiveSession = 'CHECK.ACTIVE_SESSION',
    /**
     * Must be in a voice channel
     */
    InVoice = 'CHECK.IN_VOICE',
    /**
     * Must be in the same voice channel (will not fail if the bot is not in a voice channel)
     */
    InSessionVoice = 'CHECK.IN_SESSION_VOICE',
    /**
     * (Components only) Must be the user who started the interaction
     */
    InteractionStarter = 'CHECK.INTERACTION_STARTER',
}

export enum Language {
    ceb = 'Cebuano',
    en = 'English',
    fil = 'Filipino',
}

export const settingsOptions = [
    ...(settings.premiumURL ? ['premium'] : []),
    'language',
    'format',
    'dj',
    'autolyrics',
    'smartqueue',
];
export const queryOverrides = [
    'https://',
    'http://',
    'spsearch:',
    'sprec:',
    'amsearch:',
    'dzsearch:',
    'dzisrc:',
    'dzrec:',
    'ymsearch:',
    'ymrec:',
    'ftts://',
    'vksearch:',
    'vkrec:',
    'tdsearch:',
    'tdrec:',
    'ytsearch:',
    'ytmsearch:',
];
