import * as d3 from 'd3';
import * as topojson from 'topojson';
import * as scaleChromatic from 'd3-scale-chromatic';
import 'file-loader?name=[name].[ext]!./index.html';

const svg = d3.select('svg');

// geographic path generator
const path = d3.geoPath();

d3.queue()
    .defer(d3.json, '../data/counties.json')
    .await(ready);

function ready(error, counties) {
  if (error) throw error;

  svg.append('g')
    .attr('class', 'counties')
    .selectAll('path')
      .data(topojson.feature(counties, counties.objects.counties).features)
      .enter().append('path')
        .attr('fill', 'rebeccapurple')
        .attr('d', path);

  svg.append('path')
      .datum(topojson.mesh(counties, counties.objects.states, (a, b) => a !== b))
      .attr('class', 'states')
      .attr('d', path);
}
