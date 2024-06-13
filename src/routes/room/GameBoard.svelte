<script lang="ts">
    import { onMount } from 'svelte';
    import { ActionIcon, Box, Center, Group, Stack, Switch, Text, Title } from '@svelteuidev/core';
    import { Check, EyeClosed, EyeOpen, Shuffle } from 'svelte-radix';

    import type { DokojongWebSocket } from './websocket';

    import Seat from './Seat.svelte';

    export let websocket: DokojongWebSocket;
    
    const doorColors = ['teal', 'orange', 'pink', 'blue', 'grape'];

    let gameLog = '',
        instruction = '',
        setupStage = true;

    let seatStatusList: { nickname: string; online: boolean; me: boolean; operator: boolean; }[] = [],
        mySeat = -2,  // -2: not determined, -1: observer, >-1: player
        scoreList: [number, number][] = [],
        tileStatusList: [boolean | null, boolean | null, boolean | null, boolean | null, boolean | null][] = [],
        doorsOpened = [false, false, false, false, false];
    $: playerIterator = seatStatusList.length === scoreList.length &&
                        scoreList.length === tileStatusList.length &&
                        tileStatusList.length > 0
                            ? Array.from({ length: scoreList.length }, (_, i) => i)
                            : [];

    let playerActive: boolean[] = [];

    let tilesVisible = true,
        dogPosition = -1,
        dogPositionInput = -1,
        dogPositionSending = false;

    onMount(() => {
        websocket.addHandler('seat.status', (data) => {
            seatStatusList = data.status;
            if (mySeat === -2) {
                mySeat = -1;
                for (let i = 0; i < seatStatusList.length; i++) {
                    if (seatStatusList[i].me) {
                        mySeat = i;
                        break;
                    }                
                }
            }
        });
        websocket.addHandler('game.status', (data) => {
            scoreList = data.scores;
            tileStatusList = data.tiles;
            doorsOpened = data.doors;
        });
        websocket.addHandler('tiles.setup', (data) => {
            playerActive = data.active;
            setupStage = true;
            gameLog = `玩家${activeSeats(playerActive)}正在隐藏狗狗`;
            instruction = playerActive[mySeat] ? '请点击自己面前的按钮，或点击随机按钮' : '';
        });
        websocket.addHandler('dog.place', (data) => {
            dogPositionSending = false;
            dogPosition = data.position;
        })
        websocket.send({ type: 'board.init' });
    });

    function activeSeats(playerActive: boolean[]) {
        return playerActive.map((active, i) => active ? i + 1 : 0).filter((i) => i > 0).join('、');
    }

    function placeDog(position: number) {
        if (dogPositionInput > -1) {
            tileStatusList[mySeat][dogPositionInput] = null;
        }
        dogPositionInput = position;
        tileStatusList[mySeat][dogPositionInput] = true;
    }

    function randomPosition() {
        const position = Math.floor(Math.random() * 5);
        return position === dogPositionInput ? (position + 1) % 5 : position;
    }

    function sendDogPosition() {
        dogPositionSending = true;
        websocket.send({ type: 'dog.place', position: dogPositionInput });
    }
</script>

<Group position="center" spacing="xs" style="margin-top: 32px;">
    {#each doorsOpened as opened, i (i)}
        <Stack align="center" spacing="xs" style="border-style: solid; border-width: 1px; border-radius: 8px; padding: 10px 5px;">
            <Text root="span">{i + 1}</Text>
            <Switch checked={opened} color={doorColors[i]} />
        </Stack>
    {/each}
</Group>
<Stack align="center" style="margin-top: 32px;">
    <Title order={3}>{gameLog}</Title>
    <Text>{instruction}</Text>
</Stack>

<Stack align="center" spacing="xl" style="margin-top: 32px;">
    {#each playerIterator as i (i)}
        <Group>
            <Stack align="center" spacing="xs">
                <Seat order={i + 1} {...seatStatusList[i]} active={playerActive[i]} />
            </Stack>
            <Group style="gap: 8px;">
                <Stack align="center" spacing="md" style="margin-right: 5px;">
                    <Text root="span" color="$green500">{scoreList[i][0]}</Text>  <!-- Score -->
                    <Text root="span" color="$red500">{scoreList[i][1]}</Text>  <!-- Penalty -->
                </Stack>
                {@const isMe = i === mySeat}
                {#each tileStatusList[i] as tileStatus, j (j)}
                    <Stack align="center" style="gap: 5px;">
                        <Text root="span" style="height: 28px; line-height: 28px;">{j + 1}</Text>
                        <ActionIcon
                            size="md"
                            variant="outline"
                            on:click={() => placeDog(j)}
                            disabled={!isMe || !playerActive[mySeat]}
                            override={tileStatus !== null ? { borderColor: 'orange', borderWidth: '2px' } : {}}
                        >
                            <Text root="span" style="font-size: 18px;">{
                                tileStatus === null && (!tilesVisible || !isMe)
                                    ? '❔'
                                    : tileStatus || j === dogPosition
                                        ? '🐶'
                                        : '✖️'
                            }</Text>
                        </ActionIcon>
                    </Stack>
                {/each}
                <Stack align="center" style="gap: 5px;">
                    {#if setupStage && isMe && !dogPositionSending && playerActive[mySeat]}
                        <ActionIcon size="md" on:click={() => placeDog(randomPosition())}>
                            <Shuffle size="18px" />
                        </ActionIcon>
                    {:else}
                        <div style="height: 28px; width: 28px;"></div>
                    {/if}
                    {#if isMe}
                        {#if setupStage && playerActive[mySeat]}
                            <ActionIcon size="md" on:click={() => sendDogPosition()} loading={dogPositionSending}>
                                <Check size="18px" style="transform-origin: center; transform: scale(1.7);" />
                            </ActionIcon>
                        {:else}
                            <ActionIcon size="md" on:click={() => tilesVisible = !tilesVisible}>
                                {#if tilesVisible}
                                    <EyeClosed size="18px" />
                                {:else}
                                    <EyeOpen size="18px" />
                                {/if}
                            </ActionIcon>
                        {/if}
                    {:else}
                        <div style="height: 28px; width: 28px;"></div>
                    {/if}
                </Stack>
            </Group>
        </Group>
    {/each}
</Stack>
