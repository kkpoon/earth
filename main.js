export class EarthWebComponent extends HTMLElement {
  static get observedAttributes() {
    return ["center", "zoom"];
  }

  constructor() {
    super();
    let root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
      :host {
        display: inline-block;
        width: 100%;
        height: 100%;
      }
      </style>
      <div id="container" style="display: block; width: 100%; height: 100%;"></div>
    `;
  }

  connectedCallback() {
    this._earth = CreateEarth(this.shadowRoot, {
      center: JSON.parse(this.getAttribute("center")),
      zoom: JSON.parse(this.getAttribute("zoom"))
    });
  }

  disconnectedCallBack() {}

  attributeChangedCallback(name, oldValue, newValue) {
    if (this._earth) {
      if (name == "center") {
        this._earth.setCenter(JSON.parse(newValue));
      } else if (name == "zoom") {
        this._earth.setZoom(JSON.parse(newValue));
      }
    }
  }

  set center(val) {
    this.setAttribute("center", val);
  }

  get center() {
    return this.getAttribute("center");
  }

  set zoom(val) {
    this.setAttribute("zoom", val);
  }

  get zoom() {
    return this.getAttribute("zoom");
  }
}

function CreateEarth(el, options) {
  let container = d3.select(el).select("#container");

  options = options || {};
  let width = options.width || container.node().offsetWidth || 500;
  let height = options.height || container.node().offsetHeight || 500;
  let center = options.center || [0, 0];
  function calcDefaultZoom(node) {
    if (node.offsetWidth && node.offsetHeight) {
      return Math.min(node.offsetWidth, node.offsetHeight) / 2;
    } else if (node.offsetWidth) {
      return node.offsetWidth / 2;
    } else if (node.offsetHeight) {
      return node.offsetHeight / 2;
    } else {
      return 250;
    }
  }
  let defaultZoom = options.zoom || calcDefaultZoom(container.node());

  let graticule = d3.geoGraticule();

  let projection = d3
    .geoOrthographic()
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .rotate(
      center.map(function(d) {
        return -1 * d;
      })
    );

  let path = d3.geoPath().projection(projection);

  let zoom = d3
    .zoom()
    .touchable(function() {
      return "ontouchstart" in this;
    })
    .on("zoom", function() {
      let earth = d3.select(this);
      projection.scale(d3.event.transform.k);
      earth.selectAll("path").attr("d", path);
      earth.selectAll("circle.earth").attr("r", projection.scale());
    });

  let drag = d3
    .drag()
    .touchable(function() {
      return "ontouchstart" in this;
    })
    .on("start", function() {
      let earth = d3.select(this);
      d3.event.on("drag", function() {
        let t = projection.translate();
        let m = [d3.event.dx, d3.event.dy];
        let c = projection.invert([t[0] - m[0], t[1] - m[1]]);
        projection.rotate([-c[0], -c[1]]);
        earth.selectAll("path").attr("d", path);
        earth.selectAll("circle.earth").attr("r", projection.scale());
      });
    });

  let earth = container
    .append("svg:svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .call(drag)
    .call(zoom)
    .call(zoom.transform, d3.zoomIdentity.scale(defaultZoom));

  let ocean_fill = earth
    .append("defs")
    .append("radialGradient")
    .attr("id", "ocean_fill")
    .attr("cx", "75%")
    .attr("cy", "25%");
  ocean_fill
    .append("stop")
    .attr("offset", "5%")
    .attr("stop-color", "#fff");
  ocean_fill
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#6699ff");

  let globe_highlight = earth
    .append("defs")
    .append("radialGradient")
    .attr("id", "globe_highlight")
    .attr("cx", "75%")
    .attr("cy", "25%");
  globe_highlight
    .append("stop")
    .attr("offset", "5%")
    .attr("stop-color", "#fff")
    .attr("stop-opacity", "1");
  globe_highlight
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#669933")
    .attr("stop-opacity", "1");

  let globe_shading = earth
    .append("defs")
    .append("radialGradient")
    .attr("id", "globe_shading")
    .attr("cx", "55%")
    .attr("cy", "45%");
  globe_shading
    .append("stop")
    .attr("offset", "30%")
    .attr("stop-color", "#fff")
    .attr("stop-opacity", "0");
  globe_shading
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#363636")
    .attr("stop-opacity", "0.3");

  earth
    .append("circle")
    .attr("class", "earth")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", projection.scale())
    .style("fill", "url(#ocean_fill)");

  earth
    .append("circle")
    .attr("class", "earth")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", projection.scale())
    .style("fill", "url(#globe_shading)");

  d3.json("world-110m.json").then(function(topo) {
    let land = topojson.feature(topo, topo.objects.land);
    let boundary = topojson.mesh(topo, topo.objects.countries, function(a, b) {
      return a !== b;
    });

    earth
      .append("path")
      .datum(land)
      .attr("class", "country")
      .attr("d", path)
      .style("fill", "url(#globe_highlight)")
      .style("stroke", "#000000")
      .style("stroke-width", "1px")
      .style("stroke-opacity", "1.0");

    earth
      .append("path")
      .datum(boundary)
      .attr("class", "province")
      .attr("d", path)
      .style("fill", "none")
      .style("stroke", "#666")
      .style("stroke-width", "1px")
      .style("stroke-opacity", "1.0");

    earth
      .append("path")
      .datum(graticule())
      .attr("class", "graticule")
      .attr("d", path)
      .style("fill", "none")
      .style("stroke", "#666")
      .style("stroke-width", "1px")
      .style("stroke-opacity", "0.3");
  });

  function setCenter(center) {
    projection.rotate(
      center.map(function(d) {
        return -1 * d;
      })
    );
    earth.selectAll("path").attr("d", path);
    earth.selectAll("circle.earth").attr("r", projection.scale());
  }

  function setZoom(val) {
    projection.scale(val);
    earth.selectAll("path").attr("d", path);
    earth.selectAll("circle.earth").attr("r", projection.scale());
  }

  return {
    setCenter: setCenter,
    setZoom: setZoom
  };
}
