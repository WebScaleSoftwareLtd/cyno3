import getDiscordGuilds from "@/utils/getDiscordGuilds";
import getUser from "./getUser";
import { client } from "database";
import { cache } from "react";
import adminUsers from "@/utils/adminUsers";

// I'm not a big fan of where this lives, but it serves a weird role.

async function getGuild(guildId: string) {
    // Spawn a promise we might need to get the user. Do not await it.
    const userPromise = getUser().catch(() => null);

    // Get the guild.
    const guild = (await getDiscordGuilds())?.find((g) => g.id === guildId);

    // If the guild does not exist, return null.
    if (!guild) return null;

    // Check if the guild exists in the database.
    const exists = !!(await client.query.guilds
        .findFirst({
            columns: { guildId: true },
            where: (guilds, { and, eq, isNull }) =>
                and(
                    eq(guilds.guildId, BigInt(guild.id)),
                    isNull(guilds.destroyAt),
                ),
        })
        .execute());
    if (!exists) return null;

    // Check if the user is a dashboard admin.
    const isAdmin = async (guildId: bigint) => {
        // Get the user so we can get their ID.
        const user = await userPromise;
        if (!user) return false;

        // Check if the user is a dashboard admin.
        if (adminUsers(user.id)) return true;

        // Check if the user is an admin.
        return !!(await client.query.dashboardAdmins.findFirst({
            columns: { userId: true },
            where: (admins, { and, eq }) =>
                and(
                    eq(admins.userId, BigInt(user.id)),
                    eq(admins.guildId, guildId),
                ),
        }));
    };

    // If the guild is not configurable, return null.
    if (
        !guild.owner && // Owner cannot manage the server.
        !(BigInt(guild.permissions) & BigInt(0x20)) && // Cannot Manage Server
        !(await isAdmin(BigInt(guild.id))) // Is not a dashboard admin.
    )
        return null;

    // We are okay to do things in this guild. Return it.
    return guild;
}

export default cache(getGuild);
