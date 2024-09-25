<script lang="ts">
    import CodeMirror from "svelte-codemirror-editor";
    import { java } from "@codemirror/lang-java";
    import { Button } from "flowbite-svelte";

    let value = "";

    let output = "";

    async function runCode() {
        const response = await fetch("/execute", {
            method: "POST",
            body: value,
            headers: {
                "Content-Type": "text/x-java",
            },
        });

        output = await response.text();
        console.log(output);
    }
</script>

<h1>Welcome to Bake</h1>
<CodeMirror bind:value lang={java()} />

<Button on:click={runCode}>Run</Button>

<div class="font-mono whitespace-pre-line">{output}</div>
