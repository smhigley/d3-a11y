import * as d3 from 'd3';
import * as topojson from 'topojson';
import * as scaleChromatic from 'd3-scale-chromatic';
import 'file-loader?name=[name].[ext]!./index.html';

const svg = d3.select('svg'),
    width = +svg.attr('width'),
    height = +svg.attr('height');

const population = d3.map();

const path = d3.geoPath();

const x = d3.scaleLinear()
    .domain([1, 10])
    .rangeRound([600, 860]);

const popFormat = d3.format(',');

d3.queue()
    .defer(d3.json, '../data/counties.json')
    .defer(d3.csv, '../data/county-population.csv', function(d) {
			population.set(d.id, {
        name: d.name,
        state: d.abbr,
        population: parseInt(d.pop2016.replace(/,/g,''))
      });
		})
    .await(ready);

function ready(error, counties) {
  if (error) throw error;

	const popScale = d3.scaleLog()
			.domain([1,2000000])
			.range([0,1]);
	const color = d3.scaleQuantize()
	    .domain([0,1])
	    .range(scaleChromatic.schemeGnBu[9]);

  svg.append('g')
      .attr('class', 'counties')
    .selectAll('path')
    .data(topojson.feature(counties, counties.objects.counties).features)
    .enter().append('path')
      .attr('fill', function(d) {
				return color(popScale(population.get(d.id).population));
			})
      .attr('d', path)
    .append('title')
      .text(function(d) { return population.get(d.id).name; });

  svg.append('path')
      .datum(topojson.mesh(counties, counties.objects.states, function(a, b) { return a !== b; }))
      .attr('class', 'states')
      .attr('d', path);

	// let's add key events
	const searchInput = document.getElementById('search');
	const tooltip = document.querySelector('.tooltip');
	searchInput.addEventListener('change', (e) => {
		const terms = e.target.value.split(',');
    const county = population.values().find((c) => {
      // Check if a state has been included
      if (terms.length > 1) {
        return terms[0].trim() === c.name && terms[1].trim() === c.state;
      }
      // otherwise, just search county name
      return terms[0].trim() === c.name;
    });
		if (county !== undefined) {
			tooltip.innerHTML = `The population of ${county.name}, ${county.state} is ${popFormat(county.population)}`;
		}
		else {
			tooltip.innerHTML = `We could not find a county matching ${e.target.value}`;
		}
	});
}
