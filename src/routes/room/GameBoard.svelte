<script lang="ts">
    import { onMount } from 'svelte';
    import { ActionIcon, Box, Center, Group, Stack, Switch, Text, Title } from '@svelteuidev/core';
    import { EyeClosed, EyeOpen } from 'svelte-radix';

    import type { DokojongWebSocket } from './websocket';

    import Seat from './Seat.svelte';

    export let websocket: DokojongWebSocket;
    
    const doorColors = ['teal', 'orange', 'pink', 'blue', 'grape'];

    let tilesVisible = true;

    let instruction = '游戏开始',
        description = '等待玩家1、2隐藏狗狗';

    let doorsOpened = [false, false, false, false, false],
        seatStatusList: { nickname: string; online: boolean; me: boolean; operator: boolean; }[] = [],
        scores: { score: number, penalty: number }[] = [];

    onMount(() => {
        websocket.addHandler('seat.status', (data) => seatStatusList = data.status);
        websocket.addHandler('game.scores', (data) => scores = data.scores);
        websocket.addHandler('tiles.setup', (data) => {

        });
        websocket.send({ type: 'stage.init' });
    });
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
    <Title order={3}>{instruction}</Title>
    <Text >{description}</Text>
</Stack>
<Stack align="center" spacing="xl" style="margin-top: 32px; width: 95%;">
    {#each seatStatusList as seatStatus, i}
        <Group>
            <Stack align="center" spacing="xs">
                <Seat order={i + 1} {...seatStatus} />
            </Stack>
            <Group spacing="xs">
                <Stack align="center" spacing="md" style="margin-right: 5px;">
                    <Text root="span" color="$green500">{scores[i].score}</Text>
                    <Text root="span" color="$red500">{scores[i].penalty}</Text>
                </Stack>
                {#each doorsOpened as _, i}
                    <Stack align="center" spacing="xs">
                        <Text root="span">{i + 1}</Text>
                        <ActionIcon size="md" variant="outline">
                            <Text root="span" style="font-size: 18px;">❔</Text>
                        </ActionIcon>
                    </Stack>
                {/each}
            </Group>
        </Group>
    {/each}
</Stack>
