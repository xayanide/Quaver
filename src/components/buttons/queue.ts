import { ForceType } from '#src/lib/ReplyHandler.js';
import type { QuaverInteraction } from '#src/lib/util/common.d.js';
import { data, MessageOptionsBuilderType } from '#src/lib/util/common.js';
import { settings } from '#src/lib/util/settings.js';
import {
    cleanURIForMarkdown,
    getGuildLocaleString,
    getLocaleString,
} from '#src/lib/util/util.js';
import type { Song } from '@lavaclient/plugin-queue';
import { msToTime, msToTimeString, paginate } from '@zptxdev/zptx-lib';
import type {
    ButtonComponent,
    ButtonInteraction,
    MessageActionRowComponentBuilder,
} from 'discord.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    escapeMarkdown,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';

export default {
    name: 'queue',
    async execute(
        interaction: QuaverInteraction<ButtonInteraction>,
    ): Promise<void> {
        const player = await interaction.client.music.players.fetch(
                interaction.guildId,
            ),
            pages = player ? paginate(player.queue.tracks, 5) : [];
        const target = interaction.customId.split(':')[1];
        if (player && target === 'goto' && pages.length !== 0) {
            return interaction.showModal(
                new ModalBuilder()
                    .setTitle(
                        await getGuildLocaleString(
                            interaction.guildId,
                            'CMD.QUEUE.MISC.MODAL_TITLE',
                        ),
                    )
                    .setCustomId('queue:goto')
                    .addComponents(
                        new ActionRowBuilder<TextInputBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId('queue:goto:input')
                                .setLabel(
                                    await getGuildLocaleString(
                                        interaction.guildId,
                                        'CMD.QUEUE.MISC.PAGE',
                                    ),
                                )
                                .setStyle(TextInputStyle.Short),
                        ),
                    ),
            );
        }
        const page = parseInt(target);
        if (!player || pages.length === 0 || page < 1 || page > pages.length) {
            await interaction.replyHandler.locale(
                'CMD.QUEUE.RESPONSE.QUEUE_EMPTY',
                {
                    type: MessageOptionsBuilderType.Error,
                    components: [],
                    force: ForceType.Update,
                },
            );
            return;
        }
        const firstIndex = 5 * (page - 1) + 1;
        const pageSize = pages[page - 1].length;
        const largestIndexSize = (firstIndex + pageSize - 1).toString().length;
        const original = {
            embeds: interaction.message.embeds,
            components: interaction.message.components,
        };
        if (original.embeds.length === 0) {
            await interaction.message.delete();
            return;
        }
        const updated: {
            embeds: EmbedBuilder[];
            components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
        } = { embeds: [], components: [] };
        const guildLocaleCode =
            (await data.guild.get<string>(
                interaction.guildId,
                'settings.locale',
            )) ?? settings.defaultLocaleCode;
        updated.embeds[0] = EmbedBuilder.from(original.embeds[0])
            .setDescription(
                pages[page - 1]
                    .map((track: Song, index: number): string => {
                        const duration = msToTime(track.info.length);
                        let durationString = track.info.isStream
                            ? '∞'
                            : msToTimeString(duration, true);
                        if (durationString === 'MORE_THAN_A_DAY') {
                            durationString = getLocaleString(
                                guildLocaleCode,
                                'MISC.MORE_THAN_A_DAY',
                            );
                        }
                        const uri =
                            track.info.title === track.info.uri
                                ? `**${track.info.uri}**`
                                : `[**${escapeMarkdown(cleanURIForMarkdown(track.info.title))}**](${track.info.uri})`;
                        return `\`${(firstIndex + index)
                            .toString()
                            .padStart(
                                largestIndexSize,
                                ' ',
                            )}.\` ${uri} \`[${durationString}]\` <@${track.requesterId}>`;
                    })
                    .join('\n'),
            )
            .setFooter({
                text: await getGuildLocaleString(
                    interaction.guildId,
                    'MISC.PAGE',
                    page.toString(),
                    pages.length.toString(),
                ),
            });
        updated.components[0] = ActionRowBuilder.from(original.components[0]);
        updated.components[0].components[0] = ButtonBuilder.from(
            original.components[0].components[0] as ButtonComponent,
        )
            .setCustomId(`queue:${page - 1}`)
            .setDisabled(page - 1 < 1);
        updated.components[0].components[2] = ButtonBuilder.from(
            original.components[0].components[2] as ButtonComponent,
        )
            .setCustomId(`queue:${page + 1}`)
            .setDisabled(page + 1 > pages.length);
        await interaction.replyHandler.reply(updated.embeds, {
            components: updated.components,
            force: ForceType.Update,
        });
    },
};
