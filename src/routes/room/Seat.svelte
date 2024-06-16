<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { ActionIcon, Badge, Box, Center, CloseButton, Loader } from '@svelteuidev/core';
    import { Plus, Update } from 'svelte-radix';
    
    export let vacant = false, nickname = '', online = false, me = false, operator = false, imPlayer = false, xbutton = false, order = 0, virtual = false, active = false, leader = false;
    $: noPlayer = vacant || virtual;
    $: canTakeOperator = /*operator && */!online && imPlayer;  // this flag is only used inside a `if operator` block

    const dispatch = createEventDispatcher();
</script>

<style>
    .avatar-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 56px;
        width: 56px;
        position: relative;
    }
    .avatar-container::before {
        content: "";
        border-radius: 28px;
        border-width: 1px;
        border-style: solid;
        position: absolute;
        width: 100%;
        height: 100%;
    }
    .avatar-border-rotating::before {
        border-color: orange;
        clip-path: polygon(0% 0%, 40% 0%, 50% 50%, 60% 0%, 100% 0%, 100% 100%, 60% 100%, 50% 50%, 40% 100%, 0 100%);
        animation: rotate 3s infinite linear;
    }
    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>

<div class={`avatar-container ${leader ? 'avatar-border-rotating' : ''}`}>
    {#if noPlayer}
        <ActionIcon on:click={() => virtual ? dispatch('add') : dispatch('join', order)}>
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
        <Badge color="orange" size="sm" style="position: absolute; left: -8px; bottom: -5px;">
            我
        </Badge>
    {:else if !noPlayer}
        <Box css={{
            position: 'absolute',
            left: '2px',
            bottom: '0px',
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
        <Badge color="red" size="sm" style="position: absolute; right: -5px; top: -5px; padding: 2px;">
            <CloseButton size="xs" iconSize="xs" color="red" variant="transparent" on:click={() => dispatch('remove', order)} />
        </Badge>
    {/if}
    {#if active}
        <div style="position: absolute; right: -5px; top: -5px;">
            <Loader size={16} variant="bars" color={online ? 'blue' : 'gray'} />
        </div>
    {/if}
    {#if order > 0}
        <Badge color="blue" size="sm" style="position: absolute; right: -5px; bottom: -5px;">
            {order}
        </Badge>
    {/if}
</div>
