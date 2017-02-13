/* eslint-env jest, jasmine */

import connect from './connectHits.js';
jest.mock('../core/createConnector');

const {getSearchParameters} = connect;
const context = {context: {multiIndexContext: {targettedIndex: 'index'}}};
const getProvidedProps = connect.getProvidedProps.bind(context);

describe('connectHits', () => {
  it('provides the current hits to the component', () => {
    const hits = [{}];
    const props = getProvidedProps(null, null, {results: {index: {hits}}});
    expect(props).toEqual({hits});
  });

  it('doesn\'t render when no hits are available', () => {
    const props = getProvidedProps(null, null, {results: {index: null}});
    expect(props).toEqual({hits: []});
  });

  it('should return the searchParameters unchanged', () => {
    const searchParameters = getSearchParameters({hitsPerPage: 10});
    expect(searchParameters).toEqual({hitsPerPage: 10});
  });
});
