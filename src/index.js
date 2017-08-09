import * as d3 from 'd3';
import * as topojson from 'topojson';
import * as scaleChromatic from 'd3-scale-chromatic';
import 'file-loader?name=[name].[ext]!./index.html';

const svg = d3.select('svg'),
    width = +svg.attr('width'),
    height = +svg.attr('height');

// save reference to DOM elements
const dataTypeSelect = document.getElementById('select-data');
const searchInput = document.getElementById('search');
const tooltip = document.querySelector('.tooltip');

let dataType = dataTypeSelect.value;

// set up empty maps for our two datasets
const population = d3.map();
const vote_count = d3.map();

// geographic path generator
const path = d3.geoPath();

// use to format large numbers
const popFormat = d3.format(',');

// d3 scales we'll use later
const popScale = d3.scaleLog()
    .domain([1,2000000])
    .range([0,1]);
const turnoutScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, 1]);
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
    .defer(d3.csv, '../data/votes.csv', (d) => {
      vote_count.set(d.id, d.votes);
    })
    .await(ready);

// get either population or turnout data
function getScaledValue(data) {
  const county_population = population.get(data.id).population;
  if (dataType === 'population') {
    return popScale(county_population);
  }
  else {
    var turnout = vote_count.get(data.id)/county_population * 100;
    return turnoutScale(turnout);
  }
}

function updateTooltip(county) {
  console.log('updating tooltip with county', county);
  let value;
  if (dataType === 'population') {
    value = popFormat(county.population);
  }
  else {
    const county_votes = vote_count.get(county.id);
    value = Math.round(parseInt(county_votes)/county.population * 100) + '%';
  }

  tooltip.innerHTML = `The ${dataType} of ${county.name}, ${county.state} is ${value}`;
}

function ready(error, counties) {
  if (error) throw error;

  svg.append('g')
    .attr('class', 'counties')
    .selectAll('path')
      .data(topojson.feature(counties, counties.objects.counties).features)
      .enter().append('path')
        .attr('fill', (d) => color(getScaledValue(d)))
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

	// add search event listener
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

    if (county === undefined) {
      tooltip.innerHTML = `We could not find a county matching ${e.target.value}`;
      return;
    }

		updateTooltip(county);
	});

  // add select change listener
  dataTypeSelect.addEventListener('change', (e) => {
    dataType = dataTypeSelect.value;
    const paths = svg.selectAll('.counties path').attr('fill', (d) => color(getScaledValue(d)));
  });
}
