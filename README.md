# earth
A WebComponent to display an earth

## Usage

```html
<my-earth center="[114,0]" style="width: 100%; height: 980px;"></my-earth>
<script src="https://d3js.org/d3.v5.js"></script>
<script src="https://unpkg.com/topojson"></script>
<script src="https://unpkg.com/@webcomponents/webcomponentsjs"></script>
<script type="module">
    import { EarthWebComponent } from "./main.js";
    window.addEventListener("WebComponentsReady", function(e) {
    window.customElements.define("my-earth", EarthWebComponent);
    });
</script>
```
