<script lang="ts">
  import { onMount } from 'svelte';
    import type { DokojongWebSocket } from './websocket';

    export let websocket: DokojongWebSocket;

    let welcome = '';

    onMount(() => {
        websocket.addHandler('game.setup', (data) => {
            welcome = data.welcome;
        });
        websocket.send({ type: 'stage.init' });
    });
</script>


<div>{welcome}</div>