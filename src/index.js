import { fetchBreeds, fetchCatByBreed } from './js/cat_api';
import randomImg from './images/random-cat.jpg';
import { numberFilterParams, boolFilterParams, numberFilters, boolFilters, allFilterParams, sortTypes } from './js/create_filter_params';
import Notiflix from 'notiflix';
import Handlebars from 'handlebars';
import { exactBreedTpl, catCardTpl, addFiltersTpl, breedsListTpl, sortListTpl, sortTypesTpl, filterTypesTpl } from './js/templates';

// OBSERVER DATA

const observerOptions = {
  root: null,
  rootMargin: '200px',
  threshold: 1.0,
};

const allBreedsObserver = new IntersectionObserver(onAllBreedsObserve, observerOptions);
const filterObserver = new IntersectionObserver(onFilterObserve, observerOptions);

// HANDLEBARS

Handlebars.registerHelper('normalizeValue', function (value) {
  return normalizeParam(value);
});

// HEAD (REQUEST) DATA

const PARAM_TEMPERAMENT = 'Temperament';
const ASCENDING = 'Asc';
const ALL_BREEDS_STORAGE_KEY = 'breeds';
const CURRENT_FILTER_STORAGE_KEY = 'current_filter';
const SORTED_STORAGE_KEY = 'sorted';
const GET_EXACT_REQUEST = 'get_exact_breed';
const GET_ALL_REQUEST = 'get_all_breeds';
const LIMIT_PER_REQUEST = 10;
const UPDATE_PERIOD = 24 * 60 * 60 * 1000;

let CURRENT_PAGE = 0;
let USED_FILTERS = [];
let FILTERS_CREATED = 0;
let filterApplied;
let sorted;
let totalBreedsNumber;
let currentFilterBreedsNumber;
let totalPages;

let timeMouseDown;
let timeMouseUp;

// DOM DATA

const buttons = document.querySelectorAll('button');

// Radio elems
const getExactBreedsRadio = document.getElementById('get_exact_radio');
const getAllBreedsRadio = document.getElementById('get_all_radio');
const checkedRadio = document.querySelector('input[name="request-type"]:checked');

// Select breeds buttons
const selectBlock = document.querySelector('.breed-select');
const getAllBreedsBtn = document.querySelector('.get-all-breeds-btn');

// Breed info containers
const exactBreedContentBlock = document.querySelector('.exact-breed-info');
const allBreedsContentBlock = document.querySelector('.all-breeds-info');
const allBreedsList = document.querySelector('.breeds-list');

// Threshold for infinite scroll
const thresholdBlock = document.querySelector('.threshold');

// Filters
const filterSection = document.querySelector('.filters-section');
const addFilterButton = document.querySelector('.add-filter-btn');
const applyFilterButton = document.querySelector('.apply-filters-btn');
const resetFiltersButton = document.querySelector('.reset-filters-btn');
const removeFiltersButton = document.querySelector('.remove-filters-btn');
const filtersList = document.querySelector('.filters-list');

// Sort
const sortContainer = document.querySelector('.sort-container');
const selectSortFilter = document.querySelector('.select-sort-filter');
const selectSortType = document.querySelector('.select-sort-type');
const resetSortButton = document.querySelector('.reset-sort-btn');

// Event listeners

buttons.forEach((button) => {
  button.addEventListener('mousedown', onMouseDown);
  button.addEventListener('mouseup', onMouseUp);
});

document.addEventListener('mouseup', onMouseUp);

// header
getExactBreedsRadio.addEventListener('change', onRadio);
getAllBreedsRadio.addEventListener('change', onRadio);
selectBlock.addEventListener('change', onSelectBreed);
getAllBreedsBtn.addEventListener('click', onSelectAll);

// filters
addFilterButton.addEventListener('click', onAddFilter);
filtersList.addEventListener('click', deleteFilter);
filtersList.addEventListener('change', selectFilter);
applyFilterButton.addEventListener('click', applyFilters);
resetFiltersButton.addEventListener('click', resetFilters);
removeFiltersButton.addEventListener('click', removeFilters);

// sort
selectSortFilter.addEventListener('change', onSelectSortFilter);
selectSortType.addEventListener('change', onSelectSortType);
resetSortButton.addEventListener('click', resetSort);

// SUPPLEMENTARY FUNCTIONS

const addHiddenAttr = (obj) => {
  if (!obj.classList.contains('hidden')) {
    obj.classList.add('hidden');
  }
};

const removeHiddenAttr = (obj) => {
  if (obj.classList.contains('hidden')) {
    obj.classList.remove('hidden');
  }
};

const resetGetAllParams = () => {
  CURRENT_PAGE = 0;
};

const resetContent = (elem) => {
  elem.innerHTML = '';
};

const handleCheckedRadio = (target) => {
  const value = target.value;

  if (target.checked && value === GET_EXACT_REQUEST) {
    selectBlock.disabled = false;
    getAllBreedsBtn.disabled = true;
    removeHiddenAttr(exactBreedContentBlock);
    addHiddenAttr(allBreedsContentBlock);
    addHiddenAttr(filterSection);
    addHiddenAttr(sortContainer);
    resetContent(allBreedsList);
    resetGetAllParams();
  } else if (target.checked && value === GET_ALL_REQUEST) {
    selectBlock.disabled = true;
    getAllBreedsBtn.disabled = false;
    addHiddenAttr(exactBreedContentBlock);
    removeHiddenAttr(allBreedsContentBlock);
    removeHiddenAttr(filterSection);
    removeHiddenAttr(sortContainer);
    resetContent(exactBreedContentBlock);
  }
};

const normalizeParam = (param) => {
  param = param.replace(/^./, param[0].toUpperCase()).replace('_', ' ');
  return param;
};

const existFilters = () => {
  if (filtersList.children.length === 0) {
    addFilterButton.disabled = false;
    applyFilterButton.disabled = true;
    resetFiltersButton.disabled = true;
    removeFiltersButton.disabled = true;
  } else if (FILTERS_CREATED === allFilterParams.length) {
    addFilterButton.disabled = true;
  } else {
    addFilterButton.disabled = false;
    applyFilterButton.disabled = false;
    resetFiltersButton.disabled = false;
    removeFiltersButton.disabled = false;
  }
};

const updateCache = () => {
  setInterval(async () => {
    try {
      const breedsData = await fetchBreeds();
      cacheData(breedsData, ALL_BREEDS_STORAGE_KEY);
      createBreedsList(breedsData);
    } catch (err) {
      Notiflix.Notify.failure(`Error ${err.code}: ${err.message}`);
    }
  }, UPDATE_PERIOD);
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

const getAllFiltersData = () => {
  return Array.from(filtersList.children).map((filter) => {
    const filterParam = filter.querySelector('.select-filter').value;
    const filterOperand = filter.querySelector('.select-filter-type').value;
    const filterValue = filter.querySelector('.select-filter-value').value;

    return {
      param: filterParam,
      operand: filterOperand,
      value: filterValue,
    };
  });
};

const isContentBlockEmpty = () => {
  if (allBreedsList.innerHTML) {
    selectSortFilter.disabled = false;
  } else {
    selectSortFilter.disabled = true;
    selectSortType.disabled = true;
    resetSortButton.disabled = true;
  }
};

const renderDefaultBreeds = () => {
  if (filterApplied) {
    scrollToTop();
    setTimeout(() => {
      onSelectAll();
    }, 100);
  }
};

const sortAscending = (filter, normalizedCachedBreeds) => {
  return normalizedCachedBreeds.sort((firstBreed, secondBreed) => firstBreed[filter] - secondBreed[filter]);
};

const sortDescending = (filter, normalizedCachedBreeds) => {
  return normalizedCachedBreeds.sort((firstBreed, secondBreed) => secondBreed[filter] - firstBreed[filter]);
};

// MAIN BUSINESS LOGIC

onLoad();

function onRadio(evt) {
  handleCheckedRadio(evt.target);
}

function onLoad() {
  Notiflix.Loading.dots();
  setTimeout(async () => {
    handleCheckedRadio(checkedRadio);
    const cachedData = JSON.parse(localStorage.getItem(ALL_BREEDS_STORAGE_KEY));
    let breedsData;

    if (!cachedData) {
      try {
        breedsData = await fetchBreeds();
        cacheData(breedsData, ALL_BREEDS_STORAGE_KEY);
      } catch (err) {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure(`Error ${err.code}: ${err.message}`);
      }
    } else {
      breedsData = Object.values(cachedData).flat();
      totalBreedsNumber = breedsData.length;
    }

    createBreedsList(breedsData);
    isContentBlockEmpty();
    createSortList();
    createSortTypes();
    updateCache();
    Notiflix.Loading.remove();
  }, 1000);
}

function cacheData(breedsData, storageKey) {
  totalBreedsNumber = breedsData.length;
  totalPages = Math.ceil(totalBreedsNumber / LIMIT_PER_REQUEST);

  const cache = {};
  for (let i = 0; i < totalPages; i++) {
    cache[i] = breedsData.slice(i * LIMIT_PER_REQUEST, (i + 1) * LIMIT_PER_REQUEST);
  }

  localStorage.setItem(storageKey, JSON.stringify(cache));
}

function createBreedsList(data) {
  const template = Handlebars.compile(breedsListTpl);
  selectBlock.innerHTML = template(data);
}

function createSortList() {
  const template = Handlebars.compile(sortListTpl);
  selectSortFilter.insertAdjacentHTML('beforeend', template(allFilterParams));
}

function createSortTypes() {
  const template = Handlebars.compile(sortTypesTpl);
  selectSortType.insertAdjacentHTML('beforeend', template(sortTypes));
}

// FUNCTIONS TO OPERATE EXACT BREED

function onSelectBreed(evt) {
  const breedId = evt.currentTarget.value;
  Notiflix.Loading.dots();
  setTimeout(async () => {
    addHiddenAttr(exactBreedContentBlock);
    try {
      const data = await fetchCatByBreed(breedId);
      createExactBreedContentBlock(data[0]);
      removeHiddenAttr(exactBreedContentBlock);
      Notiflix.Loading.remove();
    } catch (err) {
      Notiflix.Loading.remove();
      Notiflix.Notify.failure(`Error ${err.code}: ${err.message}`);
    }
  }, 1000);
}

function createExactBreedContentBlock(breedData) {
  const markupData = {
    breedName: breedData.breeds[0].name,
    breedDescription: breedData.breeds[0].description,
    breedTemperament: breedData.breeds[0].temperament,
    imgUrl: breedData.url,
    paramTemperament: PARAM_TEMPERAMENT,
  };

  const template = Handlebars.compile(exactBreedTpl);
  exactBreedContentBlock.innerHTML = template(markupData);
}

// FUNCTIONS TO OPERATE ALL BREEDS

function onSelectAll() {
  Notiflix.Loading.dots();
  setTimeout(() => {
    const data = sorted ? JSON.parse(localStorage.getItem(SORTED_STORAGE_KEY)) : JSON.parse(localStorage.getItem(ALL_BREEDS_STORAGE_KEY));
    totalBreedsNumber = Object.values(data).flat().length;
    resetGetAllParams();
    renderContent(data[CURRENT_PAGE.toString()]);
    filterApplied = false;
    filterObserver.unobserve(thresholdBlock);
    allBreedsObserver.observe(thresholdBlock);
    Notiflix.Loading.remove();
  }, 1000);
}

function onAllBreedsObserve(entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting && allBreedsList.innerHTML !== '') {
      if (totalBreedsNumber <= LIMIT_PER_REQUEST * (CURRENT_PAGE + 1)) {
        observer.unobserve(thresholdBlock);
        resetGetAllParams();
      } else {
        CURRENT_PAGE += 1;
        const data = sorted ? JSON.parse(localStorage.getItem(SORTED_STORAGE_KEY)) : JSON.parse(localStorage.getItem(ALL_BREEDS_STORAGE_KEY));
        createAllBreedsContentBlock(data[CURRENT_PAGE.toString()]);
      }
    }
  });
}

function createAllBreedsContentBlock(breedData) {
  const filter = document.querySelector('.select-sort-filter').value;
  const cardSetMarkup = breedData.map((item) => {
    const filterParam = filter ? `<p class="text params"><span class="param-name">${normalizeParam(filter)}: </span>${item[filter]}</p>` : '';
    let markupData = {
      breedName: item.name,
      breedDescription: item.description,
      breedTemperament: item.temperament,
      imgUrl: item.image?.url ?? randomImg,
      paramTemperament: PARAM_TEMPERAMENT,
      filterParam: filterParam,
    };

    const template = Handlebars.compile(catCardTpl);
    return template(markupData);
  });

  allBreedsList.insertAdjacentHTML('beforeend', cardSetMarkup.join(''));
}

// FUNCTIONS TO OPERATE FILTERS

// Add filter button handlers
function onAddFilter() {
  const filtersListMarkup = createFiltersListMarkup();
  const markupData = {
    filtersListMarkup: filtersListMarkup,
  };
  const template = Handlebars.compile(addFiltersTpl);
  filtersList.insertAdjacentHTML('afterbegin', template(markupData));
  FILTERS_CREATED += 1;
  existFilters();
}

function createFiltersListMarkup(currentValue = null) {
  const defaultOption = currentValue
    ? '<option class="select-option default-option" value="" disabled>Select filter</option>'
    : '<option class="select-option default-option" value="" disabled selected>Select filter</option>';

  const markup =
    '<optgroup label="Number filters">' +
    createFilterOptGroupMarkup(numberFilterParams, currentValue).join('') +
    '</optgroup>' +
    '<optgroup label="Boolean filters">' +
    createFilterOptGroupMarkup(boolFilterParams, currentValue).join('') +
    '</optgroup>';

  return defaultOption + markup;
}

function createFilterOptGroupMarkup(filterParamsList, currentValue) {
  return filterParamsList.map((param) => {
    if (USED_FILTERS.includes(param) && param !== currentValue) {
      return;
    }
    const normalizedParam = normalizeParam(param);
    return param === currentValue
      ? `<option class="select-option" value="${param}" selected>${normalizedParam}</option>`
      : `<option class="select-option" value="${param}">${normalizedParam}</option>`;
  });
}

// Select filter options handlers
function selectFilter(evt) {
  if (evt.target.classList.contains('select-filter')) {
    const filter = evt.target.value;
    USED_FILTERS.push(filter);

    const allFilterSelects = filtersList.querySelectorAll('.select-filter');
    allFilterSelects.forEach((select) => (select.innerHTML = createFiltersListMarkup(select.value)));

    const container = evt.target.closest('.filter-item-container');
    const selectFilterType = container.querySelector('.select-filter-type');
    const selectFilterValue = container.querySelector('.select-filter-value');

    selectFilterType.innerHTML = createFilterTypeOptions(filter);
    selectFilterValue.innerHTML = createFilterValuesOptions(filter);
    removeHiddenAttr(selectFilterType);
    removeHiddenAttr(selectFilterValue);
  }
}

function createFilterTypeOptions(filter) {
  const filterConditions = numberFilterParams.includes(filter) ? numberFilters : boolFilters;
  const template = Handlebars.compile(filterTypesTpl);
  return template(filterConditions);
}

function createFilterValuesOptions(filter) {
  const { minValue, maxValue } = getFilterMinMaxValues(filter);
  const defaultOption = '<option class="select-option default-option" value="" disabled selected>Select condition</option>';

  const markup = [];
  for (let i = minValue; i <= maxValue; i++) {
    markup.push(`<option class="select-option" value="${i}">${i}</option>`);
  }

  return defaultOption + markup.join('');
}

function getFilterMinMaxValues(filter) {
  let allBreeds = JSON.parse(localStorage.getItem(ALL_BREEDS_STORAGE_KEY));
  const values = Object.values(allBreeds)
    .flat()
    .map((breed) => breed[filter]);
  return { minValue: Math.min(...values), maxValue: Math.max(...values) };
}

// Delete, Reset and Apply filters buttons
function deleteFilter(evt) {
  if (evt.target.classList.contains('delete-filter')) {
    const filterItem = evt.target.closest('.filter-item');
    const filterValue = filterItem.querySelector('.select-filter').value;

    if (filterValue) {
      USED_FILTERS.splice(USED_FILTERS.indexOf(filterValue), 1);
    }

    const allFilterSelects = filtersList.querySelectorAll('.select-filter');
    allFilterSelects.forEach((select) => (select.innerHTML = createFiltersListMarkup(select.value)));

    filterItem.remove();

    FILTERS_CREATED -= 1;
    if (!FILTERS_CREATED) {
      renderDefaultBreeds();
    }
    existFilters();
  }
}

function removeFilters() {
  USED_FILTERS = [];
  FILTERS_CREATED = 0;
  filtersList.innerHTML = '';
  existFilters();
  Notiflix.Loading.dots();
  setTimeout(() => {
    renderDefaultBreeds();
    Notiflix.Loading.remove();
  }, 1000);
}

function resetFilters() {
  USED_FILTERS = [];
  const allFilters = filtersList.querySelectorAll('select');
  allFilters.forEach((filter) => (filter.selectedIndex = 0));
  const allFilterSelects = filtersList.querySelectorAll('.select-filter');
  allFilterSelects.forEach((select) => (select.innerHTML = createFiltersListMarkup()));

  if (filterApplied) {
    scrollToTop();
  }
}

function applyFilters() {
  Notiflix.Loading.dots();
  setTimeout(() => {
    const fiterInput = getAllFiltersData();
    const allBreeds = sorted ? JSON.parse(localStorage.getItem(SORTED_STORAGE_KEY)) : JSON.parse(localStorage.getItem(ALL_BREEDS_STORAGE_KEY));
    const filteredBreeds = Object.values(allBreeds)
      .flat()
      .filter((breed) => {
        return fiterInput.every((input) => {
          return eval(breed[input.param] + input.operand + input.value);
        });
      });

    currentFilterBreedsNumber = filteredBreeds.length;
    if (currentFilterBreedsNumber) {
      cacheData(filteredBreeds, CURRENT_FILTER_STORAGE_KEY);
      const cachedCurrentFilter = JSON.parse(localStorage.getItem(CURRENT_FILTER_STORAGE_KEY));
      resetGetAllParams();
      renderContent(cachedCurrentFilter[CURRENT_PAGE.toString()]);
      filterApplied = true;
      allBreedsObserver.unobserve(thresholdBlock);
      filterObserver.observe(thresholdBlock);
      Notiflix.Loading.remove();
    } else {
      Notiflix.Loading.remove();
      Notiflix.Notify.failure('There are no breeds that correspond the given filters!');
    }
  }, 1000);
}

function onFilterObserve(entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting && allBreedsList.innerHTML !== '') {
      if (currentFilterBreedsNumber <= LIMIT_PER_REQUEST * (CURRENT_PAGE + 1)) {
        observer.unobserve(thresholdBlock);
        resetGetAllParams();
      } else {
        CURRENT_PAGE += 1;
        const data = JSON.parse(localStorage.getItem(CURRENT_FILTER_STORAGE_KEY));
        createAllBreedsContentBlock(data[CURRENT_PAGE.toString()]);
      }
    }
  });
}

// SORT
function onSelectSortFilter() {
  selectSortType.disabled = false;
}

function onSelectSortType(evt) {
  Notiflix.Loading.dots();
  setTimeout(() => {
    const sortType = evt.target.value;
    const filter = selectSortFilter.value;
    const typeOfCacheKey = filterApplied ? CURRENT_FILTER_STORAGE_KEY : ALL_BREEDS_STORAGE_KEY;
    const cachedBreeds = JSON.parse(localStorage.getItem(typeOfCacheKey));
    const normalizedCachedBreeds = Object.values(cachedBreeds).flat();
    const sortedContent = sortType === ASCENDING ? sortAscending(filter, normalizedCachedBreeds) : sortDescending(filter, normalizedCachedBreeds);
    cacheData(sortedContent, SORTED_STORAGE_KEY);
    const contentToRender = Object.values(JSON.parse(localStorage.getItem(SORTED_STORAGE_KEY)))
      .slice(0, CURRENT_PAGE + 1)
      .flat();
    renderContent(contentToRender);
    resetSortButton.disabled = false;
    sorted = true;
    Notiflix.Loading.remove();
  }, 1000);
}

function resetSort() {
  selectSortFilter.selectedIndex = 0;
  selectSortType.selectedIndex = 0;
  selectSortType.disabled = true;
  resetSortButton.disabled = true;
  const cachedContent = filterApplied
    ? JSON.parse(localStorage.getItem(CURRENT_FILTER_STORAGE_KEY))
    : JSON.parse(localStorage.getItem(ALL_BREEDS_STORAGE_KEY));
  const contentToRender = Object.values(cachedContent)
    .slice(0, CURRENT_PAGE + 1)
    .flat();
  renderContent(contentToRender);
  sorted = false;
}

// Render
function renderContent(data) {
  addHiddenAttr(allBreedsContentBlock);
  resetContent(allBreedsList);
  createAllBreedsContentBlock(data);
  scrollToTop();
  removeHiddenAttr(allBreedsContentBlock);
  isContentBlockEmpty();
}

// HANDLE BUTTON CLICK

function onMouseDown(evt) {
  timeMouseDown = new Date();
  const { target } = evt;
  target.classList.add('active');
}

function onMouseUp() {
  buttons.forEach((button) => {
    if (button.classList.contains('active')) handleMouseUp(button);
  });
}

function handleMouseUp(button) {
  timeMouseUp = new Date();
  const timeout = timeMouseUp - timeMouseDown < 300 ? 250 : 0;
  setTimeout(() => {
    button.classList.remove('active');
    button.blur();
  }, timeout);
}
