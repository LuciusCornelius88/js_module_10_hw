const exactBreedTpl = `
  <div class='img-content'>
    <img class='cat-img' src='{{imgUrl}}' alt='{{breedName}}' />
  </div>
  <div class='text-content'>
    <h2 class='subtitle'>{{breedName}}</h2>
    <p class='text description'>{{breedDescription}}</p>
    <p class='text params'><span class='param-name'>{{paramTemperament}}: </span>{{breedTemperament}}</p>
  </div>`;

const catCardTpl = `
  <li class="card-item">
    <div class="img-content">
        <img class="cat-img" src="{{imgUrl}}" alt="{{breedName}}" />
    </div>
    <div class="text-content">
        <h2 class="subtitle">{{breedName}}</h2>
        <p class="text description">{{breedDescription}}</p>
        <p class="text params"><span class="param-name">{{paramTemperament}}: </span>{{breedTemperament}}</p>
        {{filterParam}}
    </div>
  </li>`;

const addFiltersTpl = `
  <li class="filter-item">
    <div class="filter-item-container">
      <div class="main-filter-signature">
        <select class="select-filter filter-signature-item">
          {{{filtersListMarkup}}}
        </select>
        <button class="delete-filter filter-signature-item">Del</button>
      </div>
      <div class="secondary-filter-signature">
        <select class="select-filter-type filter-signature-item hidden"></select>
        <select class="select-filter-value filter-signature-item hidden"></select>
      </div>
    </div>
  </li>`;

const breedsListTpl = `
  <option class="select-item default-option" value="" disabled selected>Select the breed</option>
  {{#each this}}
    <option class="select-item" value={{this.id}}>{{this.name}}</option>
  {{/each}}`;

const sortListTpl = `
<option class="select-item default-option" value="" disabled selected>Select the breed</option>
{{#each this}}
  <option class="select-item" value={{this}}>{{normalizeValue this}}</option>
{{/each}}
`;

const sortTypesTpl = `
  <option class="select-item default-option" value="" disabled selected>Select sort type</option>
  {{#each this}}
    <option class="select-item" value={{this}}>{{this}}</option>
  {{/each}}`;

const filterTypesTpl = `
  <option class="select-option default-option" value="" disabled selected>Select condition</option>
  {{#each this}}
    <option class="select-option" value="{{this}}">{{this}}</option>
  {{/each}}
`;

export { exactBreedTpl, catCardTpl, addFiltersTpl, breedsListTpl, sortListTpl, sortTypesTpl, filterTypesTpl };
