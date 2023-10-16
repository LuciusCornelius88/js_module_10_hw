import { fetchBreeds, fetchCatByBreed } from './js/cat_api';
import randomImg from './images/random-cat.jpg';
import { numberFilterParams, boolFilterParams, numberFilters, boolFilters, allFilterParams } from './js/create_filter_params';

// OBSERVER DATA

const observerOptions = {
  root: null,
  rootMargin: '200px',
  threshold: 1.0,
};

const observer = new IntersectionObserver(onObserve, observerOptions);

// HEAD (REQUEST) DATA

const LOCAL_STORAGE_KEY_ALL_BREEDS = 'all_breeds';
const GET_EXACT_REQUEST = 'get_exact_breed';
const GET_ALL_REQUEST = 'get_all_breeds';
const SELECT_ALL_PARAMS = {
  limit: 10,
  page: 0,
};
let USED_FILTERS = [];
let FILTERS_CREATED = 0;
let totalBreedsNumber;

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

// Messages
const loaderMessage = document.querySelector('.loader');
const errorMessage = document.querySelector('.error');

// Threshold for infinite scroll
const thresholdBlock = document.querySelector('.threshold');

// Filters
const filtersContainer = document.querySelector('.filters');
const addFilterButton = document.querySelector('.add-filter-btn');
const applyFilterButton = document.querySelector('.apply-filters-btn');
const resetFiltersButton = document.querySelector('.reset-filters-btn');
const removeFiltersButton = document.querySelector('.remove-filters-btn');
const filtersList = document.querySelector('.filters-list');

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

const incrementPages = () => {
  SELECT_ALL_PARAMS.page += 1;
};

const resetContent = (elem) => {
  elem.innerHTML = '';
};

const handleErrors = (err) => {
  addHiddenAttr(loaderMessage);
  removeHiddenAttr(errorMessage);

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
    addHiddenAttr(filtersContainer);
    resetContent(allBreedsList);
    resetGetAllParams();
  } else if (target.checked && value === GET_ALL_REQUEST) {
    selectBlock.disabled = true;
    getAllBreedsBtn.disabled = false;
    addHiddenAttr(exactBreedContentBlock);
    removeHiddenAttr(allBreedsContentBlock);
    removeHiddenAttr(filtersContainer);
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

// MAIN BUSINESS LOGIC

onLoad();

function onRadio(evt) {
  handleCheckedRadio(evt.target);
}

async function onLoad() {
  handleCheckedRadio(checkedRadio);

  try {
    const data = await fetchBreeds();
    totalBreedsNumber = data.length;
    const defaultOption = '<option class="select-item default-option" value="" disabled selected>Select the breed</option>';
    const markup = defaultOption + data.map((cat) => `<option class="select-item" value=${cat.id}>${cat.name}</option>`).join('');
    selectBlock.insertAdjacentHTML('beforeend', markup);

    addHiddenAttr(loaderMessage);
    removeHiddenAttr(selectBlock);
  } catch (err) {
    handleErrors(err);
  }
}

// FUNCTIONS TO OPERATE EXACT BREED

async function onSelectBreed(evt) {
  const breedId = evt.currentTarget.value;

  addHiddenAttr(exactBreedContentBlock);
  removeHiddenAttr(loaderMessage);
  addHiddenAttr(errorMessage);

  try {
    const data = await fetchCatByBreed(breedId);
    createExactBreedContentBlock(data[0]);
    addHiddenAttr(loaderMessage);
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

  let paramTemperament = Object.keys(breedData.breeds[0])
    .filter((item) => item === 'temperament')
    .toString();
  paramTemperament = paramTemperament.replace(/^./, paramTemperament[0].toUpperCase());

  const markup = `
    <div class="img-content">
        <img class="cat-img" src="${imgUrl}" alt="${breedName}" />
    </div>
    <div class="text-content">
        <h2 class="subtitle">${breedName}</h2>
        <p class="text description">${breedDescription}</p>
        <p class="text params"><span class="param-name">${paramTemperament}: </span>${breedTemperament}</p>
    </div>`;

  exactBreedContentBlock.innerHTML = markup;
}

// FUNCTIONS TO OPERATE ALL BREEDS

async function onSelectAll() {
  addHiddenAttr(allBreedsContentBlock);
  addHiddenAttr(filtersContainer);
  removeHiddenAttr(loaderMessage);
  addHiddenAttr(errorMessage);
  resetContent(allBreedsList);
  resetGetAllParams();

  try {
    const data = await fetchBreeds(SELECT_ALL_PARAMS);
    createAllBreedsContentBlock(data);
    addHiddenAttr(loaderMessage);
    removeHiddenAttr(filtersContainer);
    removeHiddenAttr(allBreedsContentBlock);
    observer.observe(thresholdBlock);
  } catch (err) {
    handleErrors(err);
  }
}

function onObserve(entries, observer) {
  entries.forEach(async (entry) => {
    if (entry.isIntersecting && allBreedsList.innerHTML !== '') {
      incrementPages();

      try {
        const data = await fetchBreeds(SELECT_ALL_PARAMS);
        createAllBreedsContentBlock(data);
        addHiddenAttr(loaderMessage);
        removeHiddenAttr(allBreedsContentBlock);

        if (totalBreedsNumber <= SELECT_ALL_PARAMS.limit * (SELECT_ALL_PARAMS.page + 1)) {
          observer.unobserve(thresholdBlock);
          resetGetAllParams();
        }
      } catch (err) {
        handleErrors(err);
      }
    }
  });
}

function createAllBreedsContentBlock(breedData) {
  const paramTemperament = 'Temperament';
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
            <p class="text params"><span class="param-name">${paramTemperament}: </span>${breedTemperament}</p>
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
          <select class="select-filter">
            ${createFiltersListMarkup()}
          </select>
          <select class="select-filter-type hidden"></select>
          <select class="select-filter-value hidden"></select>
          <button class="delete-filter">Del</button>
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
