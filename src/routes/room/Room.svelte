<script lang="ts">
    import { onDestroy, onMount } from 'svelte';

    import Header from './Header.svelte';
    import GameBoard from './GameBoard.svelte';
    import WaitingHall from './WaitingHall.svelte'
    import WebSocket from './WebSocket.svelte';
    import type { DokojongWebSocket } from './websocket';

    export let roomId: string;

    let websocket: DokojongWebSocket;
    
    let myRole: 'OB' | 'P' | 'OP' = 'OB',
        gaming: boolean | undefined = undefined;

    onMount(() => {
        websocket.addHandler('room.status', (data) => gaming = data.gaming);
    });

    onDestroy(() => {
        websocket.removeHandler('room.status');
        websocket.close();
    });

</script>

<WebSocket initWebSocket={(ws) => websocket = ws} />
{#if gaming !== undefined}
    <Header {websocket} {roomId} {gaming} imOperator={myRole === 'OP'} />
    {#if gaming}
        <GameBoard {websocket} />
    {:else}
        <WaitingHall {websocket} changeRole={(role) => myRole = role} />
    {/if}
{/if}
