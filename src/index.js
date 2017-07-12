import * as d3 from 'd3';
import * as topojson from 'topojson';
import * as scaleChromatic from 'd3-scale-chromatic';
import 'file-loader?name=[name].[ext]!./index.html';

var svg = d3.select('svg'),
    width = +svg.attr('width'),
    height = +svg.attr('height');

var population = d3.map();

var path = d3.geoPath();

var x = d3.scaleLinear()
    .domain([1, 10])
    .rangeRound([600, 860]);

d3.queue()
    .defer(d3.json, '../data/counties.json')
    .defer(d3.csv, '../data/county-population.csv', function(d) {
			population.set(d.id, parseInt(d.pop2016.replace(',','')));
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
				return color(popScale(population.get(d.id)));
			})
      .attr('d', path)
    .append('title')
      .text(function(d) { return population.get(d.id); });

  svg.append('path')
      .datum(topojson.mesh(counties, counties.objects.states, function(a, b) { return a !== b; }))
      .attr('class', 'states')
      .attr('d', path);
}
