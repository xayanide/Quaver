import { GatewayDispatchEvents } from 'discord.js';
import type { Node } from 'lavaclient';

export default {
    name: GatewayDispatchEvents.VoiceServerUpdate,
    isOnce: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute(_lavaclientNode: Node, data: any): Promise<void> {
        await _lavaclientNode.players.handleVoiceUpdate(data);
    },
};
