// TMDb API Key
const TMDB_API_KEY = '03d2df4d3ea6faca84abadc1a6811e0c';

// Elementi HTML
const searchInput = document.getElementById('searchInput');
const searchType = document.getElementById('searchType');
const suggestionsList = document.getElementById('suggestions');
const providersInfo = document.getElementById('providersInfo');

// Modalità corrente: 'movie' o 'director'
let currentMode = null;

// Dati globali per il film singolo e per il regista
window.lastFilmProviders = null;
window.directorData = { movies: [], combinedProviders: {} };

// Paesi "illuminati" per il prev/next
window.litCountries = [];

// Al cambio del checkbox "Only Streaming" ricalcola i filtri
document.getElementById('onlyStreamingCheckbox').addEventListener('change', () => {
  applyCurrentFiltersAndUpdateMap();
});

document.addEventListener("DOMContentLoaded", () => {
  // Video casuale e partenza casuale
  const publicDomainClips = ['video/intro1.mp4','video/intro2.mp4','video/intro3.mp4','video/intro4.mp4'];
  const randomIndex = Math.floor(Math.random() * publicDomainClips.length);
  const randomClip = publicDomainClips[randomIndex];
  const introVideo = document.getElementById("intro-video");
  introVideo.querySelector('source').src = randomClip;
  introVideo.load();
  introVideo.addEventListener('loadedmetadata', () => {
    if (introVideo.duration) {
      const randomTime = Math.random() * introVideo.duration;
      introVideo.currentTime = randomTime;
    }
    introVideo.play().catch(err => console.warn('Autoplay bloccato:', err));
  });

  // Intro Screen Fade
  const enterBtn = document.getElementById("enter-btn");
  const introScreen = document.getElementById("intro-screen");
  const mainContent = document.getElementById("main-content");
  if (enterBtn) {
    enterBtn.addEventListener("click", () => {
      introScreen.style.opacity = "0";
      setTimeout(() => {
        introScreen.style.display = "none";
        mainContent.style.display = "block";
        mainContent.style.opacity = "0";
        setTimeout(() => {
          mainContent.style.opacity = "1";
          mainContent.style.transition = "opacity 1s ease-in-out";
        }, 100);
        introVideo.play().catch(err => console.warn(err));
      }, 500);
    });
  } else {
    console.error("Pulsante ENTER non trovato!");
  }

  // Event listener per "World View"
  document.getElementById('worldViewBtn').addEventListener('click', worldView);
});

/********************************************
 * RICERCA UNIFICATA (film o regista)
 ********************************************/
searchInput.addEventListener('input', async (e) => {
  const query = e.target.value.trim();
  if (query.length < 2) {
    suggestionsList.style.display = 'none';
    return;
  }
  const type = searchType.value; // 'movie' o 'director'
  if (type === 'movie') {
    currentMode = 'movie';
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.results) {
        populateMovieSuggestions(data.results);
      } else {
        suggestionsList.style.display = 'none';
      }
    } catch (error) {
      console.error('Errore nella ricerca film:', error);
    }
  } else if (type === 'director') {
    currentMode = 'director';
    try {
      const url = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.results) {
        populateDirectorSuggestions(data.results);
      } else {
        suggestionsList.style.display = 'none';
      }
    } catch (error) {
      console.error('Errore nella ricerca del regista:', error);
    }
  }
});

function populateMovieSuggestions(movies) {
  suggestionsList.innerHTML = '';
  if (movies.length === 0) {
    suggestionsList.style.display = 'none';
    return;
  }
  movies.forEach(movie => {
    const li = document.createElement('li');
    if (movie.poster_path) {
      const posterUrl = `https://image.tmdb.org/t/p/w92${movie.poster_path}`;
      const img = document.createElement('img');
      img.src = posterUrl;
      img.alt = movie.title;
      li.appendChild(img);
    }
    const spanTitle = document.createElement('span');
    spanTitle.textContent = movie.title + ' (' + (movie.release_date || '').slice(0, 4) + ')';
    li.appendChild(spanTitle);
    li.addEventListener('click', () => {
      searchInput.value = movie.title;
      suggestionsList.style.display = 'none';
      loadWatchProvidersForMovie(movie.id);
    });
    suggestionsList.appendChild(li);
  });
  suggestionsList.style.display = 'block';
}

function populateDirectorSuggestions(directors) {
  suggestionsList.innerHTML = '';
  if (directors.length === 0) {
    suggestionsList.style.display = 'none';
    return;
  }
  directors.forEach(person => {
    const li = document.createElement('li');
    if (person.profile_path) {
      const profileUrl = `https://image.tmdb.org/t/p/w92${person.profile_path}`;
      const img = document.createElement('img');
      img.src = profileUrl;
      img.alt = person.name;
      li.appendChild(img);
    }
    const spanName = document.createElement('span');
    spanName.textContent = person.name;
    li.appendChild(spanName);
    li.addEventListener('click', () => {
      searchInput.value = person.name;
      suggestionsList.style.display = 'none';
      loadDirectorMovies(person.id);
    });
    suggestionsList.appendChild(li);
  });
  suggestionsList.style.display = 'block';
}

/********************************************
 * WATCH PROVIDERS PER FILM SINGOLO
 ********************************************/
async function loadWatchProvidersForMovie(movieId) {
  try {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    window.lastFilmProviders = data.results || {};
    applyCurrentFiltersAndUpdateMap();
    providersInfo.innerHTML = `<p>Select a country on the map to see available services</p>`;
  } catch (error) {
    console.error('Errore nel caricamento watch providers:', error);
  }
}

/********************************************
 * FILM DEL REGISTA
 ********************************************/
async function loadDirectorMovies(directorId) {
  try {
    const creditsUrl = `https://api.themoviedb.org/3/person/${directorId}/movie_credits?api_key=${TMDB_API_KEY}`;
    const creditsRes = await fetch(creditsUrl);
    const creditsData = await creditsRes.json();
    const directedMovies = creditsData.crew.filter(c => c.job === "Director");
    window.directorData.movies = directedMovies;
    window.directorData.combinedProviders = {};
    const promises = directedMovies.map(movie => {
      return fetch(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=${TMDB_API_KEY}`)
        .then(r => r.json())
        .then(data => {
          const results = data.results || {};
          for (let countryCode in results) {
            if (!window.directorData.combinedProviders[countryCode]) {
              window.directorData.combinedProviders[countryCode] = [];
            }
            window.directorData.combinedProviders[countryCode].push({
              movieId: movie.id,
              movieTitle: movie.title,
              releaseDate: movie.release_date,
              providers: results[countryCode]
            });
          }
        });
    });
    await Promise.all(promises);
    applyCurrentFiltersAndUpdateMap();
    providersInfo.innerHTML = `<p>Select a country on the map to see the director's films</p>`;
  } catch (error) {
    console.error('Errore nella ricerca del regista:', error);
  }
}

/********************************************
 * FILTRI & AGGIORNA MAPPA
 ********************************************/
document.getElementById('applyFilterBtn').addEventListener('click', () => {
  applyCurrentFiltersAndUpdateMap();
});

function applyCurrentFiltersAndUpdateMap() {
  if (!currentMode) {
    console.warn('Nessun contenuto selezionato (film o regista).');
    return;
  }
  const filters = getSelectedProviders();
  if (currentMode === 'movie') {
    if (!window.lastFilmProviders) return;
    const filtered = filterCountriesByProviders_OR(window.lastFilmProviders, filters);
    updateMap(filtered);
  } else if (currentMode === 'director') {
    if (!window.directorData.combinedProviders) return;
    const filtered = filterDirectorCountries_OR(window.directorData.combinedProviders, filters);
    updateMap(filtered);
  }
}

function getSelectedProviders() {
  // Leggiamo i checkbox dal container .services-filter
  const checkboxes = document.querySelectorAll('.services-filter input[type="checkbox"]');
  let selectedIds = [];
  checkboxes.forEach((cb) => {
    if (cb.checked) {
      selectedIds.push(parseInt(cb.value));
    }
  });
  const onlyStreaming = document.getElementById('onlyStreamingCheckbox').checked;
  return { selectedIds, onlyStreaming };
}

/********************************************
 * FUNZIONI DI FILTRO
 ********************************************/
function filterCountriesByProviders_OR(watchProviders, { selectedIds, onlyStreaming }) {
  if (!watchProviders) return {};
  if (selectedIds.length === 0 && !onlyStreaming) return watchProviders;
  let filtered = {};
  for (let countryCode in watchProviders) {
    const countryData = watchProviders[countryCode];
    const flatrate = countryData.flatrate || [];
    const rent = countryData.rent || [];
    const buy = countryData.buy || [];
    const allProviders = [...flatrate, ...rent, ...buy];
    if (onlyStreaming && flatrate.length === 0) continue;
    if (selectedIds.length > 0) {
      const foundSome = selectedIds.some(id => allProviders.some(p => p.provider_id === id));
      if (!foundSome) continue;
    }
    filtered[countryCode] = countryData;
  }
  return filtered;
}

function filterDirectorCountries_OR(combinedProviders, { selectedIds, onlyStreaming }) {
  if (!combinedProviders) return {};
  let filtered = {};
  for (let countryCode in combinedProviders) {
    const movieArray = combinedProviders[countryCode];
    const passingFilms = [];
    movieArray.forEach(filmObj => {
      const { flatrate = [], rent = [], buy = [] } = filmObj.providers;
      const allProv = [...flatrate, ...rent, ...buy];
      if (onlyStreaming && flatrate.length === 0) return;
      if (selectedIds.length > 0) {
        const foundSome = selectedIds.some(id => allProv.some(p => p.provider_id === id));
        if (!foundSome) return;
      }
      passingFilms.push(filmObj);
    });
    if (passingFilms.length > 0) filtered[countryCode] = passingFilms;
  }
  return filtered;
}

/********************************************
 * WORLD VIEW (Nuovo design)
 ********************************************/
function worldView() {
  if (!currentMode) {
    providersInfo.innerHTML = `<p>No data available. Please search for a movie or a director first.</p>`;
    return;
  }
  const filters = getSelectedProviders();
  let aggregated = {};
  if (currentMode === 'movie') {
    if (!window.lastFilmProviders) {
      providersInfo.innerHTML = `<p>No data available.</p>`;
      return;
    }
    aggregated = filterCountriesByProviders_OR(window.lastFilmProviders, filters);

    // Single movie => "This movie is available in: US, IT, FR..."
    const countryCodes = Object.keys(aggregated).sort();
    if (countryCodes.length === 0) {
      providersInfo.innerHTML = `<p>This movie is not available in any country with the current filters.</p>`;
      return;
    }
    providersInfo.innerHTML = `<h3>World View</h3><p>This movie is available in:</p>`;

// Crea un contenitore per le bandiere
const flagContainer = document.createElement('div');
flagContainer.style.display = 'flex';
flagContainer.style.flexWrap = 'wrap';
flagContainer.style.gap = '0.5rem';

countryCodes.forEach(cc => {
  const flagImg = document.createElement('img');
  flagImg.src = `https://flagcdn.com/h40/${cc.toLowerCase()}.png`;
  flagImg.alt = cc;
  flagImg.classList.add('world-flag');
  flagImg.style.cursor = 'pointer';
  flagImg.addEventListener('click', () => {
    window.showProvidersForCountry(cc);
  });
  flagContainer.appendChild(flagImg);
});

providersInfo.appendChild(flagContainer);

  } else if (currentMode === 'director') {
    if (!window.directorData.combinedProviders) {
      providersInfo.innerHTML = `<p>No data available.</p>`;
      return;
    }
    // aggregated => { US: [ {movieId, ...}, {..} ], IT: [...], ... }
    aggregated = filterDirectorCountries_OR(window.directorData.combinedProviders, filters);

    // Per ogni film, trova la lista di paesi
    const filmCountryMap = {}; 
    // { movieId: { title, year, countries: [] } }
    window.directorData.movies.forEach(m => {
      filmCountryMap[m.id] = {
        title: m.title,
        year: (m.release_date || '').slice(0,4),
        countries: []
      };
    });
    for (let cCode in aggregated) {
      const filmArray = aggregated[cCode];
      filmArray.forEach(fObj => {
        if (!filmCountryMap[fObj.movieId]) {
          filmCountryMap[fObj.movieId] = {
            title: fObj.movieTitle,
            year: (fObj.releaseDate || '').slice(0,4),
            countries: []
          };
        }
        filmCountryMap[fObj.movieId].countries.push(cCode);
      });
    }
    // Ora costruiamo l'HTML
    let html = `<h3>World View</h3><p>Films by this director:</p>`;
    const filmIds = Object.keys(filmCountryMap);
    // Filtra i film con almeno 1 paese
    const availableFilms = filmIds.filter(id => filmCountryMap[id].countries.length > 0);
    if (availableFilms.length === 0) {
      providersInfo.innerHTML = `<p>No films available with the current filters.</p>`;
      return;
    }
    html += `<ul class="world-view-list">`;
    availableFilms.forEach(fid => {
      const info = filmCountryMap[fid];
      html += `
        <li>
          <strong>${info.title} (${info.year})</strong>: 
          <div class="flags-container">`;
          info.countries.sort().forEach(cc => {
            html += `<img src="https://flagcdn.com/h40/${cc.toLowerCase()}.png" 
                            alt="${cc}" 
                            class="world-flag" 
                            data-country="${cc}" />`;
          });
          html +=   `</div>
                   </li>`;
        });
        html += `</ul>`;
    providersInfo.innerHTML = html;

    // Dopo aver assegnato l'HTML alla world view per il regista:
    document.querySelectorAll('.flags-container img').forEach(img => {
      img.addEventListener('click', () => {
        const cc = img.getAttribute('data-country');
        window.showProvidersForCountry(cc);
    });
  });

  }
}

/********************************************
 * UPDATE MAP
 ********************************************/
function updateMap(filteredData) {
  window.litCountries = Object.keys(filteredData).sort();
  if (typeof window.updateMapColors === 'function') {
    window.updateMapColors(filteredData);
  }
}

/********************************************
 * CLICK SU PAESE: MOSTRARE DETTAGLI
 ********************************************/
window.showProvidersForCountry = function(countryCode) {
  providersInfo.innerHTML = '';
  if (currentMode === 'movie') {
    if (!window.lastFilmProviders) {
      providersInfo.innerHTML = `<p>No data available.</p>`;
      return;
    }
    const filters = getSelectedProviders();
    const filtered = filterCountriesByProviders_OR(window.lastFilmProviders, filters);
    const countryData = filtered[countryCode];
    if (!countryData) {
      providersInfo.innerHTML = `<p>No providers found in <strong>${countryCode}</strong></p>`;
      return;
    }
    providersInfo.innerHTML = buildSingleMovieCountryHTML(countryCode, countryData);
  } else if (currentMode === 'director') {
    if (!window.directorData.combinedProviders) {
      providersInfo.innerHTML = `<p>No data available.</p>`;
      return;
    }
    const filters = getSelectedProviders();
    const filtered = filterDirectorCountries_OR(window.directorData.combinedProviders, filters);
    const movieArray = filtered[countryCode];
    if (!movieArray) {
      providersInfo.innerHTML = `<p>No films found in <strong>${countryCode}</strong></p>`;
      return;
    }
    providersInfo.innerHTML = buildDirectorCountryHTML(countryCode, movieArray);
  }
};

function buildSingleMovieCountryHTML(countryCode, providers) {
  const flagUrl = `https://flagcdn.com/h40/${countryCode.toLowerCase()}.png`;
  const flatrateHTML = buildProviderLogos(providers.flatrate);
  const rentHTML = buildProviderLogos(providers.rent);
  const buyHTML = buildProviderLogos(providers.buy);
  return `
    <h3>
      <img src="${flagUrl}" class="country-flag" alt="Flag ${countryCode}" />
      Country: ${countryCode}
    </h3>
    ${providers.link ? `<p><a href="${providers.link}" target="_blank" style="color: white">TMDB Link</a></p>` : ''}
    <p><strong>Streaming:</strong></p>
    <div class="provider-list">${flatrateHTML}</div>
    <p><strong>Rent:</strong></p>
    <div class="provider-list">${rentHTML}</div>
    <p><strong>Buy:</strong></p>
    <div class="provider-list">${buyHTML}</div>
  `;
}

function buildDirectorCountryHTML(countryCode, movieArray) {
  const flagUrl = `https://flagcdn.com/h40/${countryCode.toLowerCase()}.png`;
  let html = `
    <h3>
      <img src="${flagUrl}" class="country-flag" alt="Flag ${countryCode}" />
      Country: ${countryCode}
    </h3>
  `;
  html += `<div class="country-movie-list">`;
  movieArray.forEach(movieObj => {
    html += `
      <div class="country-movie-item" data-movie-id="${movieObj.movieId}">
        <div class="country-movie-title">
          <h5>${movieObj.movieTitle} (${(movieObj.releaseDate || '').slice(0,4)})</h5>
          <span class="country-movie-toggle">+</span>
        </div>
        <div class="movie-provider-list">
          ${buildDirectorMovieProviderSection(movieObj.providers)}
        </div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function buildDirectorMovieProviderSection(prov) {
  const flatrateHTML = buildProviderLogos(prov.flatrate);
  const rentHTML = buildProviderLogos(prov.rent);
  const buyHTML = buildProviderLogos(prov.buy);
  return `
    ${prov.link ? `<p><a href="${prov.link}" target="_blank" style="color: white">TMDB Link</a></p>` : ''}
    <p><strong>Streaming:</strong></p>
    <div class="provider-list">${flatrateHTML}</div>
    <p><strong>Rent:</strong></p>
    <div class="provider-list">${rentHTML}</div>
    <p><strong>Buy:</strong></p>
    <div class="provider-list">${buyHTML}</div>
  `;
}

function buildProviderLogos(providerArray) {
  if (!providerArray || providerArray.length === 0) return '';
  return providerArray.map(p => {
    const logoUrl = `https://image.tmdb.org/t/p/w45${p.logo_path}`;
    return `
      <div class="provider-item">
        <img src="${logoUrl}" alt="${p.provider_name}" title="${p.provider_name}" class="provider-logo">
      </div>
    `;
  }).join('');
}

/********************************************
 * ESPANDI/CHIUDI DETTAGLI (per film regista)
 ********************************************/
providersInfo.addEventListener('click', (e) => {
  if (e.target.classList.contains('country-movie-toggle')) {
    const parentItem = e.target.closest('.country-movie-item');
    const providerList = parentItem.querySelector('.movie-provider-list');
    if (providerList.style.display === 'block') {
      providerList.style.display = 'none';
      e.target.textContent = '+';
    } else {
      providerList.style.display = 'block';
      e.target.textContent = '-';
    }
  }
});





