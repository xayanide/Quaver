import type {
    onProcessExit,
    QuaverClient,
    QuaverPlayer,
} from '#src/lib/util/common.d.js';

export default {
    name: 'timer',
    once: false,
    async execute(
        _onProcessExit: onProcessExit,
        _discordClient: QuaverClient,
    ): Promise<void> {
        const { io } = _discordClient;
        _discordClient.music.players.cache.forEach(
            (player: QuaverPlayer): void => {
                if (!player.queue?.current) return;
                const user = _discordClient.users.cache.get(
                    player.queue.current.requesterId,
                );
                player.queue.current.requesterTag = user?.tag;
                player.queue.current.requesterAvatar = user?.avatar;
                io.to(`guild:${player.id}`).emit('intervalTrackUpdate', {
                    elapsed: player.position ?? 0,
                    duration: player.queue.current.info.length,
                    track: player.queue.current,
                    skip: player.skip,
                    nothingPlaying:
                        !player.queue.current ||
                        (!player.playing && !player.paused),
                });
            },
        );
    },
};
