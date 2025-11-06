<script lang="ts">
    import { fishtopiaSplits } from "../constants";
    import type { SplitsData } from "../types";
    import FishtopiaToggles from "./SplitsToggles.svelte";
    import FullGame from "./FullGame.svelte";

    export let data: SplitsData;
</script>

<FullGame splits={fishtopiaSplits} {data} category="fishtopia" />
<hr>
<FishtopiaToggles {data} />
