const stateSelect = document.getElementById('state');
const divisionSelect = document.getElementById('division');
// const styles = document.querySelector('style').sheet;
const dynamicStyleState = document.getElementById('dynamic-style-state');
const dynamicStyleDivision = document.getElementById('dynamic-style-division');
const selections = {};
window.preferences = {};

// let newStyleIndex = undefined;
// stateSelect.addEventListener('change', event => {
//   console.log('newStyleIndex', newStyleIndex);
//   if (newStyleIndex !== undefined) styles.deleteRule(newStyleIndex);
//   newStyleIndex = styles.insertRule(`#division option[data-state=${stateSelect.value}] {display: initial !important;}`);
//   console.log(styles);
// })

class State {}

class Division {}

function initialise () {
  console.log('Initialising...');
  dynamicStyleState.textContent = `[data-state] { display: none; }`;
  dynamicStyleDivision.textContent = `[data-division] { display: none; }`;
  Object.assign(selections, JSON.parse(localStorage.getItem('selections')));
  stateSelect.value = selections.state || '';
  divisionSelect.value = selections.division || '';
  if (divisionSelect.value !== '' && divisionSelect.selectedOptions[0].dataset.state !== selections.state) {
    selections.division = undefined;
    divisionSelect.value = '';
  }
  updateVisible();
  retrievePreferences();
  parsePreferencesFragment();
  renderPreferences();
}

function aboveToBelow () {}

function belowToAbove () {}

function retrievePreferences () {
  window.preferences = JSON.parse(localStorage.getItem('cth-2022')) || {};
}

function parsePreferencesFragment () {
  if (window.location.hash) {
    const states = Array.from(stateSelect.options).map(o => o.value);
    const divisions = Array.from(divisionSelect.options).map(o => o.value.toUpperCase());
    console.log(divisions);
    console.log('Parsing hash...');
    const prefs = window.location.hash.replace(/^#?/,'').split(';');
    prefs.forEach(p => {
      const [jx, cc] = p.split(':');
      const candidates = cc.split(',');
      window.preferences[jx] = candidates;
      if (states.indexOf(jx) > -1) selectState(jx);
      else if (divisions.indexOf(jx) > -1) selectDivision(jx);
    });
    updateVisible();
  }
}

function commitPreferences () {
  const ballots = document.querySelectorAll('.senate-ballot, .house-ballot');
  ballots.forEach(ballot => {
    const jx = ballot.id;
    const preferenceOrder = new Map();
    const candidates = ballot.querySelectorAll('.candidate');
    candidates.forEach(candidate => {
      const key = (candidate.dataset.column ? `${candidate.dataset.column}-` : '') + `${candidate.dataset.position}`
      const input = candidate.querySelector('input');
      if (input.value && !isNaN(input.value)) {
        if (preferenceOrder.has(input.value)) {
          console.warn(`Ballot for ${jx} already has a preference for position ${input.value}: skipping ${candidate}`);
        } else preferenceOrder.set(input.value, key);
      }
    });
    if (preferenceOrder.size > 0) {
      window.preferences[jx] = [...preferenceOrder.entries()].sort(([p1, k1], [p2, k2]) => p1 - p2).map(([p, k]) => k);
    }
  })
}

function savePreferences () {
  localStorage.setItem('cth-2022', JSON.stringify(window.preferences));
}

function validatePreferences () {}

function renderPreferences () {
  Object.entries(window.preferences).forEach(([ballot, candidates]) => {
    const bElem = document.getElementById(ballot);
    candidates.forEach((c, index) => {
      const id = `${ballot}-${c}`;
      const cElem = document.getElementById(id);
      const input = cElem.querySelector('input');
      input.value = index + 1;
    })
  })
}

function switchLayouts () {}

function selectState (state) {
  state = state || stateSelect.value;
  stateSelect.value = state;
  if (!state || state === '') {
    console.warn('No valid state selected!');
    selections.state = undefined;
    divisionSelect.disabled = true;
  } else {
    divisionSelect.disabled = false;
    selections.state = state;
    if (divisionSelect.value !== '' && divisionSelect.selectedOptions[0].dataset.state !== state) {
      selections.division = undefined;
      divisionSelect.value = '';
    }
  }
  localStorage.setItem('selections', JSON.stringify(selections));
  updateVisible();
}

function selectDivision (division) {
  division = division || divisionSelect.value;
  divisionSelect.value = division;
  if (!division || division === '') {
    selections.division = undefined;
  } else selections.division = division;
  localStorage.setItem('selections', JSON.stringify(selections));
  updateVisible();
}

function updateVisible () {
  dynamicStyleState.textContent = selections.state ? `.ballot[data-state]:not([data-state=${selections.state}]) { display: none; }` : `[data-state] { display: none; }`;
  dynamicStyleDivision.textContent = selections.division ? `.ballot[data-division]:not([data-division=${selections.division}]) { display: none; }` : `[data-division] { display: none; }`;
}

function exportPermalink () {
  const prefs = []
  if (window.preferences[selections.state]) prefs.push(`${selections.state}:${window.preferences[selections.state].join(',')}`);
  if (window.preferences[selections.division.toUpperCase()]) prefs.push(`${selections.division.toUpperCase()}:${window.preferences[selections.division.toUpperCase()].join(',')}`);
  const link = new URL(window.location)
  link.hash = prefs.join(';');
  console.log(link.href);
}

window.addEventListener('load', initialise);
stateSelect.addEventListener('change', selectState);
divisionSelect.addEventListener('change', selectDivision);

window.retrievePreferences = retrievePreferences;
window.renderPreferences = renderPreferences;
window.commitPreferences = commitPreferences;
window.savePreferences = savePreferences;
window.exportPermalink = exportPermalink;