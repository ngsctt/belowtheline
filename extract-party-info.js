tables.forEach(t => {
	let name, abbreviation, officer, correspondence, deputies, logo;
	const headers = t.querySelectorAll('th');
	headers.forEach(h => {
		switch (h.textContent) {
			case 'Name of party': name = h.nextElementSibling.textContent; break;
			case 'Registered abbreviation': abbreviation = h.nextElementSibling.textContent; break;
			case 'Registered logo:': logo = h.nextElementSibling.firstChild.src; break;
		}
	});
	parties[name] = {name, abbreviation, logo};
});
console.log(JSON.stringify(parties));