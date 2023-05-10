const path = require('path');
const core = require('@actions/core');
const exec = require('@actions/exec');
const GhostAdminApi = require('@tryghost/admin-api');
const {WebhookClient, EmbedBuilder} = require('discord.js');

(async function main() {
    try {
        const startTime = Date.now();

        const url = core.getInput('api-url');
        const api = new GhostAdminApi({
            url,
            key: core.getInput('api-key'),
            version: 'v5.0'
        });

        const basePath = process.env.GITHUB_WORKSPACE;
        const pkgPath = path.join(process.env.GITHUB_WORKSPACE, 'package.json');

        let zipPath = core.getInput('file');

        // Zip file was not provided - zip everything up!
        if (!zipPath) {
            const themeName = core.getInput('theme-name') || require(pkgPath).name;
            const themeZip = `${themeName}.zip`;
            const exclude = core.getInput('exclude') || '';
            zipPath = themeZip;

            // Create a zip
            await exec.exec(`zip -r ${themeZip} ${core.getInput('working-directory') || '.'} -x *.git* *.zip yarn* npm* node_modules* *routes.yaml *redirects.yaml *redirects.json ${exclude}`, [], {cwd: basePath});
        }

        zipPath = path.join(basePath, zipPath);

        // Deploy it to the configured site
        await api.themes.upload({file: zipPath});
        const endTime = Date.now();
        console.log(`${zipPath} successfully uploaded.`); // eslint-disable-line no-console

        const timeToDeploy = (endTime - startTime) / 1000;
        const themeName = core.getInput('theme-name') || require(pkgPath).name;
        await reportSuccessReportState(themeName, timeToDeploy);
    } catch (err) {
        console.error(JSON.stringify(err, null, 2)); // eslint-disable-line no-console
        process.exit(1);
    }
}());

async function reportSuccessReportState(themeName, timeToDeploy) {
    const url = core.getInput('webhook-url') || undefined;
    if (!url) {
        return;
    }

    const pageUrl = core.getInput('page-url');

    const webhook = new WebhookClient({url});
    const embed = new EmbedBuilder()
        .setTitle('Theme Deployed')
        .setDescription(`Theme ${themeName} was successfully deployed in ${timeToDeploy} seconds.`)
        .setColor('#00ff00')
        .setTimestamp()
        .setURL(pageUrl);

    await webhook.send({
        // eslint-disable-next-line max-lines
        embeds: [embed]
    });
    console.log('Successfully reported deployment to Discord'); // eslint-disable-line no-console
}
