<script lang="ts">
  import { onMount } from 'svelte';
    import type { DokojongWebSocket } from './websocket';

    export let websocket: DokojongWebSocket;

    let welcome = '';

    onMount(() => {
        websocket.addHandler('game.setup', (data) => {
            welcome = data.welcome;
        });
        websocket.send({ type: 'user.register', stage: 'board' });
    });
</script>


<div>{welcome}</div>