<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { ActionIcon, Badge, Box, Center, CloseButton, Paper } from '@svelteuidev/core';
    import { Plus, Update } from 'svelte-radix';
    
    export let vacant = false, nickname = '', online = false, me = false, operator = false, imPlayer = false, xbutton = false, order = 0, virtual = false;
    $: noPlayer = vacant || virtual;
    $: canTakeOperator = /*operator && */!online && imPlayer;  // this flag is only used inside a `if operator` block

    const dispatch = createEventDispatcher();
</script>


<Paper
    style="position: relative; width: 56px; height: 56px; border-color: black; border-radius: 56px; border-width: 1px; box-shadow: none;"
    override={{ borderStyle: virtual ? 'dashed' : 'solid', padding: `${vacant || virtual ? 13 : 12}px` }}
>
    {#if noPlayer}
        <ActionIcon on:click={() => virtual ? dispatch('add') : dispatch('join', { seat: order })}>
            {#if imPlayer}
                <Update size="26px" style="transform: rotate(90deg);" />
            {:else}
                <Plus size="26px" />
            {/if}
        </ActionIcon>
    {:else}
        <Center style="width: 30px; height: 30px; line-height: 30px; font-size: 24px">
            {nickname}
        </Center>
    {/if}
    {#if operator}
        <Badge color="pink" size="sm" style="position: absolute; left: -12px; top: -5px;" on:click={canTakeOperator ? () => dispatch('takeOP') : null}>
            {canTakeOperator ? '抢' : ''}房主
        </Badge>
    {/if}
    {#if me}
        <Badge color="orange" size="sm" style="position: absolute; bottom: -5px; left: -8px;">
            我
        </Badge>
    {:else if !noPlayer}
        <Box css={{
            position: 'absolute',
            left: '2px',
            buttom: '0px',
            height: '10px',
            width: '10px',
            borderRadius: '10px',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#000000',
            backgroundColor: online ? '$green500' : '$gray500',
        }} />
    {/if}
    {#if xbutton}
        <Badge color="red" size="sm" style="position: absolute; top: -5px; right: -5px; padding: 2px;">
            <CloseButton size="xs" iconSize="xs" color="red" variant="transparent" on:click={() => dispatch('remove', { seat: order })} />
        </Badge>
    {/if}
    {#if order > 0}
        <Badge color="blue" size="sm" style="position: absolute; bottom: -5px; right: -5px;">
            {order}
        </Badge>
    {/if}
</Paper>
