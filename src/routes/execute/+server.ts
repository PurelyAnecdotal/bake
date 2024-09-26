export async function POST({ request }) {
    const code = await request.text();

    console.log(code);

    await Bun.write("/temp/Main.java", code);

    console.log("Running");

    const runProcess = Bun.spawnSync([
        "su",
        "-",
        "unprivileged",
        "-c",
        "bwrap --ro-bind / / --unshare-all java /temp/Main.java",
    ]);
    if (runProcess.exitCode !== 0) {
        console.error(`Execution Error: ${runProcess.stderr.toString()}`);
        return new Response(runProcess.stderr.toString(), {
            status: 500,
            headers: {
                "Content-Type": "text/plain",
            },
        });
    }

    const output = runProcess.stdout.toString();

    return new Response(output, {
        status: 200,
        headers: {
            "Content-Type": "text/plain",
        },
    });
}
