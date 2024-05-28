<script lang="ts">
    import { ActionIcon, Button, Modal, Stack, TextInput, Title } from '@svelteuidev/core';
    import { QuestionMarkCircled } from 'svelte-radix';
    import { navigate } from "svelte-routing";

    let roomId = '', modalOpened = false, ridError: string | boolean = false;
    $: ridValid = roomId.length === 0 || /^\d{4}$/.test(roomId);
    $: buttonMode = roomId.length === 0 ? '创建' : '进入';

    function enterRoom() {
        if (ridValid) {
            navigate(roomId.length === 0 ? 'xxxx' : roomId);
        }
    }

    function ridChangeHandler() {
        ridError = ridValid ? false : '房间号为四位数字';
    }
</script>


<Stack align="center" style="gap: 32px;">
    <Title order={1} weight="bold" align="center">Dokojong</Title>
    <TextInput bind:value={roomId} on:change={ridChangeHandler} error={ridError} placeholder="四位数房间号，或留空" maxlength=4>
        <ActionIcon slot="rightSection" on:click={() => modalOpened = true}>
            <QuestionMarkCircled size={16} />
        </ActionIcon>
    </TextInput>
    <Button variant="outline" radius="xl" size="lg" on:click={enterRoom}>{buttonMode}房间</Button>
</Stack>
<Modal opened={modalOpened} centered on:close={() => modalOpened = false} title="房间号输入帮助">
    输入由四位数字构成的房间号，以创建或加入指定的房间；或将输入框留空，以创建随机号码的房间。
</Modal>
