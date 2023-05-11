const path = require('path');
const core = require('@actions/core');
const exec = require('@actions/exec');
const GhostAdminApi = require('@tryghost/admin-api');
const fetch = require('cross-fetch')

// eslint-disable-next-line no-unexpected-multiline
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
        console.log('Error uploading theme to Ghost:'); // eslint-disable-line no-console
        core.error(err);
        console.error(JSON.stringify(err, null, 2)); // eslint-disable-line no-console
        process.exit(1);
    }
}());

async function reportSuccessReportState(themeName, timeToDeploy) {
    const url = core.getInput('webhook-url') || undefined;
    if (!url) {
        core.debug('No webhook URL provided, skipping Discord notification');
        return;
    }

    const pageUrl = core.getInput('page-url');
    core.debug(`Page URL: ${pageUrl}`);

    const embed = {
        title: 'Theme Deployed',
        description: `Theme ${themeName} was successfully deployed in ${timeToDeploy} seconds.`,
        color: 0x00ff00,
        // eslint-disable-next-line max-lines
        timestamp: new Date().toISOString(),
        // eslint-disable-next-line max-lines
        url: pageUrl
        // eslint-disable-next-line max-lines
    };

    // eslint-disable-next-line max-lines
    core.debug(JSON.stringify(embed, null, 2));
    core.debug(`Sending Discord notification to ${url}`);
    core.debug(`Theme ${themeName} was successfully deployed in ${timeToDeploy} seconds.`);
    core.debug(`Page URL: ${pageUrl}`);

    await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            embeds: [embed]
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
