import { fetchBreeds, fetchCatByBreed } from './js/cat_api';
import randomImg from './images/random-cat.jpg';
import { numberFilterParams, boolFilterParams, numberFilters, boolFilters, allFilterParams, sortTypes } from './js/create_filter_params';

// OBSERVER DATA

const observerOptions = {
  root: null,
  rootMargin: '200px',
  threshold: 1.0,
};

const observer = new IntersectionObserver(onObserve, observerOptions);

// HEAD (REQUEST) DATA

const PARAM_TEMPERAMENT = 'Temperament';
const ALL_BREEDS_STORAGE_KEY = 'breeds';
const LOCAL_STORAGE_KEY_ALL_BREEDS = 'all_breeds';
const GET_EXACT_REQUEST = 'get_exact_breed';
const GET_ALL_REQUEST = 'get_all_breeds';
const LIMIT_PER_REQUEST = 10;
const SELECT_ALL_PARAMS = {
  limit: 10,
  page: 0,
};
let CURRENT_PAGE = 0;
let USED_FILTERS = [];
let FILTERS_CREATED = 0;
let totalBreedsNumber;
let totalPages;

// DOM DATA

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

// Main wrapper
const mainWrapper = document.querySelector('.main-wrapper');

// Filters
const filterSection = document.querySelector('.filters-section');
const filtersContainer = document.querySelector('.filters-container');
const addFilterButton = document.querySelector('.add-filter-btn');
const applyFilterButton = document.querySelector('.apply-filters-btn');
const resetFiltersButton = document.querySelector('.reset-filters-btn');
const removeFiltersButton = document.querySelector('.remove-filters-btn');
const filtersList = document.querySelector('.filters-list');

// Sort
const sortContainer = document.querySelector('.sort-container');
const selectSortFilter = document.querySelector('.select-sort-filter');
const selectSortType = document.querySelector('.select-sort-type');
const applySortButton = document.querySelector('.apply-sort-btn');
const resetSortButton = document.querySelector('.reset-sort-btn');

// Event listeners
getExactBreedsRadio.addEventListener('change', onRadio);
getAllBreedsRadio.addEventListener('change', onRadio);
selectBlock.addEventListener('change', onSelectBreed);
getAllBreedsBtn.addEventListener('click', onSelectAll);
addFilterButton.addEventListener('click', onAddFilter);
filtersList.addEventListener('click', deleteFilter);
filtersList.addEventListener('change', selectFilter);
applyFilterButton.addEventListener('click', applyFilters);
resetFiltersButton.addEventListener('click', resetFilters);
removeFiltersButton.addEventListener('click', removeFilters);

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
  SELECT_ALL_PARAMS.page = 0;
};

const resetContent = (elem) => {
  elem.innerHTML = '';
};

const handleErrors = (err) => {
  //   addHiddenAttr(loaderMessage);
  //   removeHiddenAttr(errorMessage);

  console.log('Code: ', err.code);
  console.log('Message: ', err.message);

  if (err.response) {
    console.log('Response message: ', err.response.data.message);
  }
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

const setFilterSticky = () => {
  if (filtersContainer.clientHeight < filterSection.clientHeight) {
    filtersContainer.style.position = 'sticky';
    filtersContainer.style.top = 0;
  }
};

// MAIN BUSINESS LOGIC

onLoad();

function onRadio(evt) {
  handleCheckedRadio(evt.target);
}

async function onLoad() {
  handleCheckedRadio(checkedRadio);
  setFilterSticky();
  const cachedData = JSON.parse(localStorage.getItem(ALL_BREEDS_STORAGE_KEY));
  let breedsData;

  if (!cachedData) {
    try {
      breedsData = await fetchBreeds();
      cacheData(breedsData);
    } catch (err) {
      handleErrors(err);
    }
  } else {
    breedsData = Object.values(cachedData).flat();
  }

  createBreedsList(breedsData);
  createSortList();
  createSortTypes();
  // addHiddenAttr(loaderMessage);
  removeHiddenAttr(selectBlock);
}

function cacheData(breedsData) {
  totalBreedsNumber = breedsData.length;
  totalPages = Math.ceil(totalBreedsNumber / LIMIT_PER_REQUEST);

  const cache = {};
  for (let i = 0; i < totalPages; i++) {
    cache[i] = breedsData.slice(i * LIMIT_PER_REQUEST, (i + 1) * LIMIT_PER_REQUEST);
  }

  localStorage.setItem(ALL_BREEDS_STORAGE_KEY, JSON.stringify(cache));
}

function createBreedsList(data) {
  const defaultOption = '<option class="select-item default-option" value="" disabled selected>Select the breed</option>';
  const markup = defaultOption + data.map((cat) => `<option class="select-item" value=${cat.id}>${cat.name}</option>`).join('');
  selectBlock.insertAdjacentHTML('beforeend', markup);
}

function createSortList() {
  const defaultOption = '<option class="select-item default-option" value="" disabled selected>Select sort param</option>';
  const markup = defaultOption + allFilterParams.map((param) => `<option class="select-item" value=${param}>${param}</option>`).join('');
  selectSortFilter.insertAdjacentHTML('beforeend', markup);
}

function createSortTypes() {
  const defaultOption = '<option class="select-item default-option" value="" disabled selected>Select sort type</option>';
  const markup = defaultOption + sortTypes.map((type) => `<option class="select-item" value=${type}>${type}</option>`).join('');
  selectSortType.insertAdjacentHTML('beforeend', markup);
}

// FUNCTIONS TO OPERATE EXACT BREED

async function onSelectBreed(evt) {
  const breedId = evt.currentTarget.value;

  addHiddenAttr(exactBreedContentBlock);
  //   removeHiddenAttr(loaderMessage);
  //   addHiddenAttr(errorMessage);

  try {
    const data = await fetchCatByBreed(breedId);
    createExactBreedContentBlock(data[0]);
    // addHiddenAttr(loaderMessage);
    removeHiddenAttr(exactBreedContentBlock);
  } catch (err) {
    handleErrors(err);
  }
}

function createExactBreedContentBlock(breedData) {
  const breedName = breedData.breeds[0].name;
  const breedDescription = breedData.breeds[0].description;
  const breedTemperament = breedData.breeds[0].temperament;
  const imgUrl = breedData.url;

  const markup = `
    <div class="img-content">
        <img class="cat-img" src="${imgUrl}" alt="${breedName}" />
    </div>
    <div class="text-content">
        <h2 class="subtitle">${breedName}</h2>
        <p class="text description">${breedDescription}</p>
        <p class="text params"><span class="param-name">${PARAM_TEMPERAMENT}: </span>${breedTemperament}</p>
    </div>`;

  exactBreedContentBlock.innerHTML = markup;
}

// FUNCTIONS TO OPERATE ALL BREEDS

function onSelectAll() {
  addHiddenAttr(allBreedsContentBlock);
  addHiddenAttr(filtersContainer);
  //   removeHiddenAttr(loaderMessage);
  //   addHiddenAttr(errorMessage);
  resetContent(allBreedsList);
  resetGetAllParams();

  const data = JSON.parse(localStorage.getItem(ALL_BREEDS_STORAGE_KEY));
  createAllBreedsContentBlock(data[CURRENT_PAGE.toString()]);
  removeHiddenAttr(filtersContainer);
  removeHiddenAttr(allBreedsContentBlock);
  observer.observe(thresholdBlock);
}

function onObserve(entries, observer) {
  entries.forEach(async (entry) => {
    if (entry.isIntersecting && allBreedsList.innerHTML !== '') {
      CURRENT_PAGE += 1;

      const data = JSON.parse(localStorage.getItem(ALL_BREEDS_STORAGE_KEY));
      createAllBreedsContentBlock(data[CURRENT_PAGE.toString()]);
      removeHiddenAttr(allBreedsContentBlock);

      if (totalBreedsNumber <= SELECT_ALL_PARAMS.limit * (SELECT_ALL_PARAMS.page + 1)) {
        observer.unobserve(thresholdBlock);
        resetGetAllParams();
      }
    }
  });
}

function createAllBreedsContentBlock(breedData) {
  const cardSetMarkup = breedData.map((item) => {
    const breedName = item.name;
    const breedDescription = item.description;
    const breedTemperament = item.temperament;
    const imgUrl = item.image?.url ?? randomImg;

    const cardMarkup = `
      <li class="card-item">
        <div class="img-content">
            <img class="cat-img" src="${imgUrl}" alt="${breedName}" />
        </div>
        <div class="text-content">
            <h2 class="subtitle">${breedName}</h2>
            <p class="text description">${breedDescription}</p>
            <p class="text params"><span class="param-name">${PARAM_TEMPERAMENT}: </span>${breedTemperament}</p>
        </div>
      </li>`;

    return cardMarkup;
  });

  allBreedsList.insertAdjacentHTML('beforeend', cardSetMarkup.join(''));
}

// FUNCTIONS TO OPERATE FILTERS

// Add filter button handlers
function onAddFilter() {
  const markup = `
      <li class="filter-item">
        <div class="filter-item-container">
          <div class="main-filter-signature">
            <select class="select-filter filter-signature-item">
              ${createFiltersListMarkup()}
            </select>
            <button class="delete-filter filter-signature-item">Del</button>
          </div>
          <div class="secondary-filter-signature">
            <select class="select-filter-type filter-signature-item hidden"></select>
            <select class="select-filter-value filter-signature-item hidden"></select>
          </div>
        </div>
      </li>
    `;
  filtersList.insertAdjacentHTML('afterbegin', markup);
  FILTERS_CREATED += 1;
  existFilters();
}

function createFiltersListMarkup(currentValue = null) {
  const defaultOption = currentValue
    ? '<option class="select-option default-option" value="" disabled>Select filter</option>'
    : '<option class="select-option default-option" value="" disabled selected>Select filter</option>';

  const markup =
    '<optgroup label="Number filters">' +
    numberFilterParams
      .map((param) => {
        if (USED_FILTERS.includes(param) && param !== currentValue) {
          return;
        }
        const normalizedParam = normalizeParam(param);
        return param === currentValue
          ? `<option class="select-option" value="${param}" selected>${normalizedParam}</option>`
          : `<option class="select-option" value="${param}">${normalizedParam}</option>`;
      })
      .join('') +
    '</optgroup>' +
    '<optgroup label="Boolean filters">' +
    boolFilterParams
      .map((param) => {
        if (USED_FILTERS.includes(param) && param !== currentValue) {
          return;
        }
        const normalizedParam = normalizeParam(param);
        return param === currentValue
          ? `<option class="select-option" value="${param}" selected>${normalizedParam}</option>`
          : `<option class="select-option" value="${param}">${normalizedParam}</option>`;
      })
      .join('') +
    '</optgroup>';

  return defaultOption + markup;
}

// Select filter options handlers
async function selectFilter(evt) {
  if (evt.target.classList.contains('select-filter')) {
    const filter = evt.target.value;
    USED_FILTERS.push(filter);

    const container = evt.target.closest('.filter-item-container');
    const allFilterSelects = filtersList.querySelectorAll('.select-filter');
    allFilterSelects.forEach((select) => (select.innerHTML = createFiltersListMarkup(select.value)));

    const selectFilterType = container.querySelector('.select-filter-type');
    const selectFilterValue = container.querySelector('.select-filter-value');
    selectFilterType.innerHTML = createFilterTypeOptions(filter);
    removeHiddenAttr(selectFilterType);

    try {
      selectFilterValue.innerHTML = await createFilterValuesOptions(filter);
      removeHiddenAttr(selectFilterValue);
    } catch (err) {
      handleErrors(err);
    }
  }
}

function createFilterTypeOptions(filter) {
  const filterConditions = numberFilterParams.includes(filter) ? numberFilters : boolFilters;
  const defaultOption = '<option class="select-option default-option" value="" disabled selected>Select condition</option>';
  const markup = filterConditions
    .map((condition) => {
      return `<option class="select-option" value="${condition}">${condition}</option>`;
    })
    .join('');

  return defaultOption + markup;
}

async function createFilterValuesOptions(filter) {
  try {
    const { minValue, maxValue } = await getFilterMinMaxValues(filter);
    const defaultOption = '<option class="select-option default-option" value="" disabled selected>Select condition</option>';

    const markup = [];
    for (let i = minValue; i <= maxValue; i++) {
      markup.push(`<option class="select-option" value="${i}">${i}</option>`);
    }

    return defaultOption + markup.join('');
  } catch (err) {
    handleErrors(err);
  }
}

async function getFilterMinMaxValues(filter) {
  let allBreeds = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_ALL_BREEDS));

  if (!allBreeds) {
    try {
      allBreeds = await fetchBreeds();
      localStorage.setItem(LOCAL_STORAGE_KEY_ALL_BREEDS, JSON.stringify(allBreeds));
    } catch (err) {
      handleErrors(err);
    }
  }

  const values = allBreeds.map((item) => item[filter]);
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
    FILTERS_CREATED -= 1;

    const allFilterSelects = filtersList.querySelectorAll('.select-filter');
    allFilterSelects.forEach((select) => (select.innerHTML = createFiltersListMarkup(select.value)));

    filterItem.remove();
    existFilters();
  }
}

function removeFilters() {
  USED_FILTERS = [];
  FILTERS_CREATED = 0;
  filtersList.innerHTML = '';
  existFilters();
}

function resetFilters() {
  USED_FILTERS = [];
  const allFilters = filtersList.querySelectorAll('select');
  allFilters.forEach((filter) => (filter.selectedIndex = 0));

  const allFilterSelects = filtersList.querySelectorAll('.select-filter');
  allFilterSelects.forEach((select) => (select.innerHTML = createFiltersListMarkup()));
}

async function applyFilters() {
  const fiterInput = Array.from(filtersList.children).map((filter) => {
    const filterParam = filter.querySelector('.select-filter').value;
    const filterOperand = filter.querySelector('.select-filter-type').value;
    const filterValue = filter.querySelector('.select-filter-value').value;

    return {
      param: filterParam,
      operand: filterOperand,
      value: filterValue,
    };
  });

  const allBreeds = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_ALL_BREEDS));
  const filteredBreeds = allBreeds.filter((breed) => {
    return fiterInput.every((input) => {
      return eval(breed[input.param] + input.operand + input.value);
    });
  });

  renderFiltered(filteredBreeds);
}

function renderFiltered(data) {
  addHiddenAttr(allBreedsContentBlock);
  resetContent(allBreedsList);
  resetGetAllParams();
  createAllBreedsContentBlock(data);
  removeHiddenAttr(allBreedsContentBlock);
  observer.unobserve(thresholdBlock);
}
