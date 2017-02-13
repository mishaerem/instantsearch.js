import {omit, has} from 'lodash';

import createConnector from '../core/createConnector';

function getId() {
  return 'page';
}

function getIndex(context) {
  return context && context.multiIndexContext ? context.multiIndexContext.targettedIndex : context.ais.mainTargettedIndex;
}

function hasMultipleIndex(context) {
  return context && context.multiIndexContext;
}

function getCurrentRefinement(props, searchState, context) {
  const id = getId();
  const index = getIndex(context);
  const refinements = hasMultipleIndex(context) && has(searchState, `indices.${index}.${id}`)
    || !hasMultipleIndex(context) && has(searchState, id);
  let page = 1;

  if (refinements) {
    const subState = hasMultipleIndex(context) ? searchState.indices[index] : searchState;
    page = subState[id];
    if (typeof page === 'string') {
      page = parseInt(page, 10);
    }
  }

  if (props.defaultRefinement) {
    return props.defaultRefinement;
  }

  return page;
}

function refine(props, searchState, nextPage, context) {
  const id = getId();
  const nextValue = {[id]: nextPage};
  const index = getIndex(context);
  if (hasMultipleIndex(context)) {
    const state = has(searchState, `indices.${index}`)
      ? {...searchState.indices, [index]: {...searchState.indices[index], ...nextValue}}
      : {...searchState.indices, ...{[index]: nextValue}};
    return {...searchState, indices: state};
  } else {
    return {...searchState, ...nextValue};
  }
}

function cleanUp(props, searchState, context) {
  const index = getIndex(context);
  const id = getId();
  const here = hasMultipleIndex(context)
    ? omit(searchState, `indices.${index}.${id}`)
    : omit(searchState, id);
  return here;
}

/**
 * connectPagination connector provides the logic to build a widget that will
 * let the user displays hits corresponding to a certain page.
 * @name connectPagination
 * @kind connector
 * @propType {string} id - widget id, URL searchState serialization key. The searchState of this widget takes the shape of a `number`.
 * @propType {boolean} [showFirst=true] - Display the first page link.
 * @propType {boolean} [showLast=false] - Display the last page link.
 * @propType {boolean} [showPrevious=true] - Display the previous page link.
 * @propType {boolean} [showNext=true] - Display the next page link.
 * @propType {number} [pagesPadding=3] - How many page links to display around the current page.
 * @propType {number} [maxPages=Infinity] - Maximum number of pages to display.
 * @providedPropType {function} refine - a function to remove a single filter
 * @providedPropType {function} createURL - a function to generate a URL for the corresponding search state
 * @providedPropType {number} nbPages - the total of existing pages
 * @providedPropType {number} currentRefinement - the page refinement currently applied
 */
export default createConnector({
  displayName: 'AlgoliaPagination',

  getProvidedProps(props, searchState, searchResults) {
    const index = getIndex(this.context);
    if (!searchResults.results || !searchResults.results[index]) {
      return null;
    }

    const nbPages = searchResults.results[index].nbPages;
    return {
      nbPages,
      currentRefinement: getCurrentRefinement(props, searchState, this.context),
      canRefine: nbPages > 1,
    };
  },

  refine(props, searchState, nextPage) {
    return refine(props, searchState, nextPage, this.context);
  },

  cleanUp(props, searchState) {
    return cleanUp(props, searchState, this.context);
  },

  getSearchParameters(searchParameters, props, searchState) {
    return searchParameters.setPage(getCurrentRefinement(props, searchState, this.context) - 1);
  },

  getMetadata() {
    return {id: getId()};
  },
});
