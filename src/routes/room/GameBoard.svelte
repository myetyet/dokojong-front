<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { ActionIcon, Button, Group, Stack, Switch, Text, Title } from '@svelteuidev/core';
    import { Check, EyeClosed, EyeOpen, Shuffle } from 'svelte-radix';

    import type { DokojongWebSocket } from './websocket';

    import Seat from './Seat.svelte';

    export let websocket: DokojongWebSocket;
    
    const doorColors = ['teal', 'orange', 'pink', 'blue', 'grape'];
    const doorsIterator = [0, 1, 2, 3, 4];
    const fiveFalse = [false, false, false, false, false];

    let gameLog = '',
        instruction = '',
        setupStage = true;

    let seatStatusList: { nickname: string; online: boolean; me: boolean; operator: boolean; }[] = [],
        mySeat = -2,  // -2: not determined, -1: observer, >-1: player
        leaderSeat = -1,
        scoreList: [number, number][] = [],
        tileStatusList: [boolean | null, boolean | null, boolean | null, boolean | null, boolean | null][] = [];
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

    // action button enabled (abe) flags
    let abeOK = false,
        abeAdd = false,
        abeReverse = false,
        abeFinger = false;

    // doors status and their inputs
    let doorsOpened = [false, false, false, false, false],
        doorsOpenedInput = [false, false, false, false, false],
        doorsDisabled = [true, true, true, true, true],
        doorsDisabledInput = [true, true, true, true, true];

    let doorsSelectionMode: 'add' | 'reverse' | null = null;

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
            leaderSeat = data.leader;
            scoreList = data.scores;
            tileStatusList = data.tiles;
            doorsOpened = Array.from(data.doors);
            doorsOpenedInput = Array.from(data.doors);
            doorsDisabled = Array.from(data.doors);
            doorsDisabledInput = Array.from(data.doors);
            updateGameLog(data.log);
        });
        websocket.addHandler('tiles.setup', (data) => {
            playerActive = data.active;
            setupStage = true;
            instruction = playerActive[mySeat] ? '请点击自己面前的按钮，或点击随机按钮' : '';
            disableButtons();
        });
        websocket.addHandler('dog.place', (data) => {
            dogPositionSending = false;
            dogPosition = data.position;
        })
        websocket.addHandler('player.act', (data) => {
            playerActive = data.active;
            setupStage = false;
            if (playerActive[mySeat]) {
                instruction = '轮到你了，请点击下方的行动按钮';
                updateButton();
            } else {
                instruction = '';
                disableButtons();
            }
        });
        websocket.send({ type: 'board.init' });
    });

    onDestroy(() => {
        websocket.removeHandler('seat.status');
        websocket.removeHandler('game.status');
        websocket.removeHandler('tiles.setup');
        websocket.removeHandler('dog.place');
        websocket.removeHandler('player.act');
        websocket.removeHandler('player.ok');
        websocket.removeHandler('board.init');
    });

    function disableButtons() {
        abeOK = false;
        abeAdd = false;
        abeReverse = false;
        abeFinger = false;
    }

    function updateButton() {
        const openedDoorsNumber = doorsOpened.filter((opened) => opened).length;
        abeOK = openedDoorsNumber > 0;
        abeAdd = openedDoorsNumber < 5;
        abeReverse = openedDoorsNumber > 0 && openedDoorsNumber < 3;
        abeFinger = leaderSeat != mySeat;
    }

    function updateGameLog(log: { action: string; [key: string]: any }) {
        switch (log.action) {
            case 'start':
                gameLog = '游戏开始，请隐藏自己的狗狗';
                break;
            case 'place':
                gameLog = `玩家${log.player}已经隐藏好了自己的狗狗`;
                break;
            case 'ok':
                gameLog = `玩家${log.player}表示ＯＫ`;
                break;
            case 'add':
                gameLog = `玩家${log.player}打开了第${log.door}扇门`;
                break;
            case 'reverse':
                const openedDoors: number[] = log.doors;
                const closedDoors = [0, 1, 2, 3, 4].filter((door) => !openedDoors.includes(door));
                gameLog = `玩家${log.player}关闭了第${closedDoors.join('、')}扇门，打开了第${openedDoors.join('、')}扇门`
                break;
            case 'finger':
                gameLog = `玩家${log.player}翻开了领袖的第${log.tile}张牌`;
                break;
        }
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
        if (dogPositionInput > -1) {
            dogPositionSending = true;
            websocket.send({ type: 'dog.place', position: dogPositionInput });
        }
    }

    function actOK() {
        websocket.send({ type: 'player.ok' });
    }

    function actAdd() {
        disableButtons();
        doorsSelectionMode = 'add';
        instruction = '再开启一扇门后点击确定';
    }

    function actReverse() {

    }

    function actFinger() {

    }

    function sendDoorsStatus() {

    }

    function cancelDoorsSetting() {
        doorsSelectionMode = null;
        doorsOpenedInput = Array.from(doorsOpened);
        doorsDisabledInput = Array.from(doorsDisabled);
        instruction = '';
        updateButton();
    }

</script>

<Group position="center" spacing="xs" style="margin-top: 32px;">
    {#each doorsIterator as i (i)}
        <Stack
            align="center"
            spacing="xs"
            style="border-style: solid; border-width: 1px; border-radius: 8px; padding: 10px 5px;"
            override={doorsOpenedInput[i] !== doorsOpened[i] ? { borderColor: 'orange' } : {}}
        >
            <Text root="span">{i + 1}</Text>
            <div style="position: relative;">
                {#if doorsDisabledInput[i]}
                    <div style="position: absolute; width: 100%; height: 100%; z-index: 200;"></div>
                {/if}
                <Switch bind:checked={doorsOpenedInput[i]} color={doorColors[i]} />
            </div>
        </Stack>
    {/each}
</Group>
<Stack align="center" style="margin-top: 32px;">
    <Title order={3}>{gameLog}</Title>
    <Text>{instruction}</Text>
</Stack>
<Group position="center" style="margin-top: 24px; gap: 8px;">
    <Button variant="outline" compact disabled={!abeOK} on:click={() => actOK()}>👍&nbsp;ＯＫ</Button>
    <Button variant="outline" compact disabled={!abeAdd} on:click={() => actAdd()}>➕&nbsp;增加</Button>
    <Button variant="outline" compact disabled={!abeReverse} on:click={() => actReverse()}>🔃&nbsp;反转</Button>
    <Button variant="outline" compact disabled={!abeFinger} on:click={() => actFinger()}>🫵&nbsp;指认</Button>
</Group>
{#if doorsSelectionMode !== null}
    <Group position="center" spacing="xl" style="margin-top: 12px;">
        <Button variant="outline" compact on:click={() => sendDoorsStatus()}>✅&nbsp;确认</Button>
        <Button variant="outline" compact on:click={() => cancelDoorsSetting()}>❎&nbsp;取消</Button>
    </Group>
{/if}
<Stack align="center" spacing="xl" style="margin-top: 32px;">
    {#each playerIterator as i (i)}
        <Group>
            <Stack align="center" spacing="xs">
                <Seat order={i + 1} {...seatStatusList[i]} active={playerActive[i]} leader={i === leaderSeat} />
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
                            override={tileStatus !== null && !setupStage ? { borderColor: 'orange', borderWidth: '2px' } : {}}
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
