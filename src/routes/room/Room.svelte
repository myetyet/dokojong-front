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
        roomStage: 'waiting' | 'gaming' | undefined = undefined;
    $: gameStart = roomStage === 'gaming';

    onMount(() => {
        websocket.addHandler('room.stage', (data) => roomStage = data.stage);
    });

    onDestroy(() => {
        websocket.removeHandler('room.stage');
        websocket.close();
    });

</script>

<WebSocket initWebSocket={(ws) => websocket = ws} />
{#if roomStage !== undefined}
    <Header {websocket} {roomId} {gameStart} imOperator={myRole === 'OP'} />
    {#if gameStart}
        <GameBoard {websocket} />
    {:else}
        <WaitingHall {websocket} changeRole={(role) => myRole = role} />
    {/if}
{/if}
