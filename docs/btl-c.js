import Papa from './papaparse.js';

const parties = await fetch('parties.json').then(r => r.json());
const senateCSV = await fetch('senate.csv').then(r => r.text());
const senate = Papa.parse(senateCSV, {
  header: true,
  skipEmptyLines: true,
  fastMode: false
}).data;

const states = {};

senate.forEach(candidate => {
  if (! states[candidate.state]) states[candidate.state] = new Map();
  const columns = states[candidate.state];

  if (! columns.has(candidate.column)) columns.set(candidate.column, {
    group: candidate.groupName,
    candidates: []
  });
  const column = columns.get(candidate.column).candidates;

  column.push({
    position: candidate.ballotPosition,
    surname: candidate.surname,
    givenName: candidate.ballotGivenName,
    group: candidate.groupName,
    party: candidate.partyBallotName,
  })
});

const stateSelect = document.getElementById('state');
Object.keys(states).forEach(s => {
  const o = document.createElement('option');
  o.text = s;
  stateSelect.appendChild(o);
})
stateSelect.addEventListener('change', event => {
  const state = stateSelect.value;
  console.log(`Selected state is: ${state}!`);
  generateBallot(state);
})

function generateBallot (state) {
  const ballot = document.getElementById('senate-ballot');
  const columnTemplate = document.getElementById('column-template');
  const candidateTemplate = document.getElementById('senate-candidate-template');
  const columns = states[state];
  let columnCount = 0, candidateCount = 0;

  ballot.innerHTML = '';

  columns.forEach(({group, candidates}, label) => {
    const column = columnTemplate.content.cloneNode(true);
    const candidatesContainer = column.querySelector('.candidates');
    let party = group, columnName = group;
    if (label === 'UG' && group === '') {
      label = '\u00A0';
      party = '';
      columnName = 'UNGROUPED';
      column.querySelector('.above input').remove();
      column.querySelector('.above .box').classList.add('hidden');
    } else columnCount++;
    column.querySelector('.label').textContent = label;
    column.querySelector('.above .party').textContent = party;
    column.querySelector('.below .party').textContent = columnName;

    ballot.appendChild(column);

    candidates.forEach(({surname, givenName, party}) => {
      const candidate = candidateTemplate.content.cloneNode(true);
      candidate.querySelector('.surname').textContent = surname;
      candidate.querySelector('.given-names').textContent = givenName;
      candidate.querySelector('.party').textContent = parties[party]?.abbreviation || party;

      candidatesContainer.appendChild(candidate);
      candidateCount++;
    })
  });

  const abovePreferences = [];
  const belowPreferences = [];
  const aboveBoxInputs = ballot.querySelectorAll('input.above');
  const belowBoxInputs = ballot.querySelectorAll('input.below');
  const clear = document.getElementById('clear');
  aboveBoxInputs.forEach(i => i.max = columnCount);
  belowBoxInputs.forEach(i => i.max = candidateCount);

  function refreshAbove () {
    console.log('above prefs', abovePreferences);
    abovePreferences.forEach((input, idx) => { if (input) input.value = idx + 1 });
    belowBoxInputs.forEach(i => i.value = '');
  }
  function refreshBelow () {
    console.log('below prefs', belowPreferences);
    belowPreferences.forEach((input, idx) => { if (input) input.value = idx + 1 });
    aboveBoxInputs.forEach(i => i.value = '');
  }

  ballot.addEventListener('change', event => {
    const value = event.target.value;
    if (event.target.matches('input.above')) {
      console.log('Above!');
      if (abovePreferences[value - 1]) {
        let idx = abovePreferences.indexOf(event.target)
        while ( idx > -1 ) {
          abovePreferences.splice(idx, 1);
          idx = abovePreferences.indexOf(event.target)
        }
        abovePreferences.splice(value - 1, 0, event.target);
      } else {
        let idx = abovePreferences.indexOf(event.target)
        while ( idx > -1 ) {
          abovePreferences.splice(idx, 1);
          idx = abovePreferences.indexOf(event.target)
        }
        abovePreferences[value - 1] = event.target;
      }
      refreshAbove();
    } else if (event.target.matches('input.below')) {
      console.log('Below!');
      if (belowPreferences[value - 1]) {
        let idx = belowPreferences.indexOf(event.target)
        while ( idx > -1 ) {
          belowPreferences.splice(idx, 1);
          idx = belowPreferences.indexOf(event.target)
        }
        belowPreferences.splice(value - 1, 0, event.target);
      } else {
        let idx = belowPreferences.indexOf(event.target)
        while ( idx > -1 ) {
          belowPreferences[idx] = null;
          idx = belowPreferences.indexOf(event.target)
        }
        belowPreferences[value - 1] = event.target;
      }
      refreshBelow();
    }
  });
  ballot.addEventListener('click', event => {
    const above = event.target.closest('.above');
    const below = event.target.closest('label.candidate');
    if (above) {
      const input = above.querySelector('input');
      if (input && abovePreferences.indexOf(input) < 0) {
        const idx = abovePreferences.indexOf(null);
        if (idx > -1) abovePreferences.splice(idx, 1, input);
        else abovePreferences.push(input);
      }
      refreshAbove();
    } else if (below) {
      const input = below.querySelector('input');
      if (belowPreferences.indexOf(input) < 0) {
        const idx = belowPreferences.indexOf(null);
        if (idx > -1) belowPreferences.splice(idx, 1, input);
        else belowPreferences.push(input);
      }
      refreshBelow();
    }
  });

  clear.addEventListener('click', event => {
    abovePreferences.splice(0);
    belowPreferences.splice(0);
    belowBoxInputs.forEach(i => i.value = '');
    aboveBoxInputs.forEach(i => i.value = '');
  })
}

generateBallot('ACT');