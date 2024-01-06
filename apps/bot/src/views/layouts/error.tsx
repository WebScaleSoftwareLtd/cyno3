import { Embed } from "reacord";
import { reacord } from "../../state";
import type { CommandInteraction } from "discord.js";

export default (interaction: CommandInteraction, reason: string, description: string) => {
    const embed = <Embed
        title={reason}
        description={description}
        color={0xff0000}
    />;
    return reacord.createInteractionReply(interaction, { ephemeral: true }).render(embed);
};