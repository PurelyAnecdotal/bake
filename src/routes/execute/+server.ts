import { unlink } from 'fs/promises';

export async function POST({ request }) {
    const code = await request.text();

    console.log(code);

    const execPath =
        process.env.BAKE_EXEC_PATH ??
        ((await runningInContainer()) ? '/exec' : './temp');

    await Bun.write(`${execPath}/Main.java`, code);

    const runProcess = Bun.spawnSync([
        'bwrap',
        '--ro-bind',
        '/',
        '/',
        '--unshare-all',
        'java',
        `${execPath}/Main.java`
    ]);

    await unlink(`${execPath}/Main.java`);

    if (runProcess.exitCode !== 0) {
        console.error(`Execution Error: ${runProcess.stderr.toString()}`);

        return new Response(runProcess.stderr, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    console.log(runProcess.stdout.toString());
    // Reset terminal colors
    console.log('\x1b[0m');

    return new Response(runProcess.stdout, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
    });
}

let inContainer: boolean;
async function runningInContainer() {
    if (inContainer === undefined)
        inContainer = await Bun.file('/.dockerenv').exists();

    return inContainer;
}
