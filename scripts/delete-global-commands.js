import { Routes } from "discord.js";
import { rest } from "./modules/restHandler.js";
import { rootSettingsJson } from "./modules/configHandler.js"

const clientId = rootSettingsJson.applicationId

try {
    console.warn("Warning: Application global commands should only be deleted once. The changes may take time to propagate across all guilds.");
    const applicationGlobalCommandsRoute = Routes.applicationCommands(clientId);
    const applicationGlobalCommands = await rest.get(applicationGlobalCommandsRoute);
    console.log(`[GLOBAL | U ${clientId}] Concurrently deleting ${applicationGlobalCommands.length} application global commands...`);
    const deletedCommands = await Promise.all(
        applicationGlobalCommands.map(async function (command) {
            console.log(`[GLOBAL | U ${clientId}] Deleting command: ${command.id} (${command.name})`);
            return await rest.delete(`${applicationGlobalCommandsRoute}/${command.id}`);
        }),
    );
    console.log(`[GLOBAL | U ${clientId}] Successfully deleted ${deletedCommands.length} application global commands.`);
} catch (error) {
    console.error(error);
    process.exit(1);
}
