import type {
    onProcessExit,
    QuaverClient,
    QuaverPlayer,
} from '#src/lib/util/common.d.js';

export default {
    name: 'timer',
    isOnce: false,
    async execute(
        _onProcessExit: onProcessExit,
        _discordClient: QuaverClient,
    ): Promise<void> {
        _discordClient.music.players.cache.forEach(
            (player: QuaverPlayer): void => {
                if (!player.queue?.current) return;
                const user = _discordClient.users.cache.get(
                    player.queue.current.requesterId,
                );
                player.queue.current.requesterTag = user?.tag;
                player.queue.current.requesterAvatar = user?.avatar;
                _discordClient.io
                    .to(`guild:${player.id}`)
                    .emit('intervalTrackUpdate', {
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
