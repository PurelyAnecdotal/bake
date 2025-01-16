<script lang="ts">
    import { browser } from '$app/environment';

    import {
        Button,
        Indicator,
        Listgroup,
        ListgroupItem,
        Spinner
    } from 'flowbite-svelte';

    import { java } from '@codemirror/lang-java';
    import { oneDark } from '@codemirror/theme-one-dark';
    import CodeMirror from 'svelte-codemirror-editor';

    import {
        type FitAddon,
        type ITerminalInitOnlyOptions,
        type ITerminalOptions,
        type Terminal,
        Xterm,
        XtermAddon
    } from '@battlefieldduck/xterm-svelte';

    let value = '';

    if (browser) value = localStorage.getItem('code') ?? '';

    let terminal: Terminal;

    let output = '';

    let options: ITerminalOptions & ITerminalInitOnlyOptions = {
        fontFamily: 'monospace',
        convertEol: true
    };

    let running = false;

    type Version = {
        name: string;
        time: Date;
        successful: boolean;
        code: string;
        output: string;
    };
    let versions: Version[] = [];

    let currentVersion: Version;

    const formatter = new Intl.DateTimeFormat('en', {
        dateStyle: 'short',
        timeStyle: 'short'
    });

    async function runCode() {
        localStorage.setItem('code', value);

        running = true;

        const response = await fetch('/execute', {
            method: 'POST',
            body: value,
            headers: {
                'Content-Type': 'text/x-java'
            }
        });

        output = await response.text();

        terminal.reset();
        terminal.write(output);

        running = false;

        versions = [
            {
                name: `Version ${versions.length + 1}`,
                time: new Date(),
                successful: response.ok,
                code: value,
                output
            },
            ...versions
        ];

        currentVersion = versions[0];
    }

    let fitAddon: FitAddon | undefined = undefined;

    XtermAddon.FitAddon().then(({ FitAddon }) => {
        fitAddon = new FitAddon();
    });
</script>

<div class="flex h-full p-4 gap-4 min-h-screen max-h-screen">
    <div class="w-2/3 min-h-full flex flex-col gap-4">
        <CodeMirror
            bind:value
            lang={java()}
            theme={oneDark}
            on:ready={() => fitAddon?.fit()}
            on:change={() => fitAddon?.fit()}
            class="overflow-y-auto"
        />
        <div
            class="p-4 rounded bg-black flex-auto shrink min-h-64 overflow-hidden"
        >
            <Xterm
                {options}
                on:load={async (event) => {
                    terminal = event.detail.terminal;

                    if (!fitAddon) return;
                    terminal.loadAddon(fitAddon);
                    fitAddon.fit();
                }}
                class="h-full"
            />
        </div>
    </div>
    <div>
        <Button on:click={runCode} disabled={running} color="green">Run</Button>

        {#if running}
            <Spinner />
        {/if}
        <Listgroup active class="w-32">
            {#each versions as version}
                <ListgroupItem
                    on:click={() => {
                        value = version.code;
                        terminal.reset();
                        terminal.write(version.output);
                        currentVersion = version;
                    }}
                    class="flex justify-between items-center"
                    current={version === currentVersion}
                >
                    <span>{formatter.format(version.time)}</span>
                    <Indicator color={version.successful ? 'green' : 'red'} />
                </ListgroupItem>
            {/each}
            {#if versions.length === 0}
                <ListgroupItem active={false}>No versions</ListgroupItem>
            {/if}
        </Listgroup>
    </div>
</div>
