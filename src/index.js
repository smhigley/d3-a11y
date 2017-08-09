import * as d3 from 'd3';
import * as topojson from 'topojson';
import * as scaleChromatic from 'd3-scale-chromatic';
import 'file-loader?name=[name].[ext]!./index.html';

const svg = d3.select('svg'),
    width = +svg.attr('width'),
    height = +svg.attr('height');

// save reference to DOM elements
const tooltip = document.querySelector('.tooltip');

// set up empty map
const population = d3.map();

// geographic path generator
const path = d3.geoPath();

// use to format large numbers
const popFormat = d3.format(',');

// d3 scales we'll use later
const popScale = d3.scaleLog()
    .domain([1,2000000])
    .range([0,1]);
const color = d3.scaleQuantize()
    .domain([0,1])
    .range(scaleChromatic.schemeGnBu[9]);

d3.queue()
    .defer(d3.json, '../data/counties.json')
    .defer(d3.csv, '../data/county-population.csv', (d) => {
			population.set(d.id, {
        id: d.id,
        name: d.name,
        state: d.abbr,
        population: parseInt(d.pop2016.replace(/,/g,''))
      });
		})
    .await(ready);

function updateTooltip(county) {
  tooltip.innerHTML = `The population of ${county.name}, ${county.state} is ${popFormat(county.population)}`;
}

function ready(error, counties) {
  if (error) throw error;

  svg.append('g')
    .attr('class', 'counties')
    .selectAll('path')
      .data(topojson.feature(counties, counties.objects.counties).features)
      .enter().append('path')
        .attr('fill', (d) => color(popScale(population.get(d.id).population)))
        .attr('d', path)
        .on('click', (e) => {
          updateTooltip(population.get(e.id))
        })
      .append('title')
        .text((d) => population.get(d.id).name);

  svg.append('path')
      .datum(topojson.mesh(counties, counties.objects.states, (a, b) => a !== b))
      .attr('class', 'states')
      .attr('d', path);
}
