// js/map.js

let svg;
let pathGenerator;
let g; 
let geojsonData;
let tooltip;
const width = 900;
const height = 600;
let zoom;

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  const prevBtn = document.getElementById('prevCountryBtn');
  const nextBtn = document.getElementById('nextCountryBtn');
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      if (window.litCountries.length === 0) return;
      window.currentCountryIndex = (window.currentCountryIndex - 1 + window.litCountries.length) % window.litCountries.length;
      zoomToCountry(window.litCountries[window.currentCountryIndex]);
    });
    nextBtn.addEventListener('click', () => {
      if (window.litCountries.length === 0) return;
      window.currentCountryIndex = (window.currentCountryIndex + 1) % window.litCountries.length;
      zoomToCountry(window.litCountries[window.currentCountryIndex]);
    });
  }
});

async function initMap() {
  tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  svg = d3.select('#mapContainer')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.4]);

  pathGenerator = d3.geoPath().projection(projection);

  geojsonData = await d3.json('data/world.geojson');

  g = svg.append('g');

  g.selectAll('path')
    .data(geojsonData.features)
    .enter()
    .append('path')
    .attr('d', pathGenerator)
    .attr('stroke', '#ccc')
    .attr('stroke-width', 0.5)
    .attr('fill', 'lightgray')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
      tooltip
        .style('opacity', 1)
        .html(`<strong>${d.properties.name}</strong>`);
    })
    .on('mousemove', function(event, d) {
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 20) + 'px');
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 0.5);
      tooltip.style('opacity', 0);
    })
    .on('click', (event, d) => {
      const countryCode = d.properties.iso_a2;
      window.showProvidersForCountry(countryCode);
    });

  zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);
  window.currentCountryIndex = 0;
}

window.updateMapColors = function(filteredData) {
  g.selectAll('path')
    .transition()
    .duration(500)
    .attr('fill', (d) => {
      const countryCode = d.properties.iso_a2;
      return filteredData[countryCode] ? 'green' : 'lightgray';
    });
};

function zoomToCountry(isoCode) {
  const feature = geojsonData.features.find(f => f.properties.iso_a2 === isoCode);
  if (!feature) return;
  const bounds = pathGenerator.bounds(feature);
  const dx = bounds[1][0] - bounds[0][0];
  const dy = bounds[1][1] - bounds[0][1];
  const x = (bounds[0][0] + bounds[1][0]) / 2;
  const y = (bounds[0][1] + bounds[1][1]) / 2;
  const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
  svg.transition().duration(750).call(
    zoom.transform,
    d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(scale)
      .translate(-x, -y)
  );
}









