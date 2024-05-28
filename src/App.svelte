<script lang="ts">
  import { SvelteUIProvider } from '@svelteuidev/core';
  import { Router, Route } from 'svelte-routing';

  import Index from './routes/index/Index.svelte';
  import Room from './routes/room/Room.svelte';
</script>

<Router basepath="/">
  <SvelteUIProvider>
    <Route path="/"><Index /></Route>
    <Route path=/:rid let:params><Room roomId={params.rid}/></Route>
  </SvelteUIProvider>
</Router>
