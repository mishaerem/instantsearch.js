import React from 'react';
import {storiesOf} from '@kadira/storybook';
import {Configure, InstantSearch,
  MultiIndexContext, Highlight, SortBy, Pagination, CurrentRefinements, ClearAll} from '../packages/react-instantsearch/dom';
import {connectHits, connectMultiHits} from '../packages/react-instantsearch/connectors';
import {WrapWithHits} from './util';
import Autosuggest from 'react-autosuggest';

const stories = storiesOf('MultiIndex', module);

stories.add('MultiHits', () =>
  <InstantSearch
    appId="latency"
    apiKey="6be0576ff61c053d5f9a3225e2a90f76"
    onSearchStateChange={searchState => console.log('searchState', searchState)}
    indexName="ikea">
    <CurrentRefinements />
    <ClearAll />
    <MultiIndexContext indexName="ikea">
      <Configure hitsPerPage={1} />
      <Pagination />
      <CustomHits />
    </MultiIndexContext>
    <MultiIndexContext indexName="bestbuy">
      <Configure hitsPerPage={1}/>
      <Pagination />
      <CustomHits />
      <SortBy
        items={[
          {value: 'instant_search', label: 'Featured'},
          {value: 'instant_search_price_asc', label: 'Price asc.'},
          {value: 'instant_search_price_desc', label: 'Price desc.'},
        ]}
        defaultRefinement="instant_search"
      />
    </MultiIndexContext>
    <MultiIndexContext indexName="airbnb">
      <Configure hitsPerPage={1} />
      <CustomHits />
    </MultiIndexContext>
  </InstantSearch>
).add('AutoComplete', () =>
  <WrapWithHits>
    <AutoComplete />
    <MultiIndexContext indexName="bestbuy">
      <VirtualAutoComplete />
    </MultiIndexContext>
    <MultiIndexContext indexName="airbnb">
      <VirtualAutoComplete />
    </MultiIndexContext>
  </WrapWithHits >);

const VirtualAutoComplete = connectMultiHits(() => null);

const AutoComplete = connectMultiHits(({hits, query, refine}) => <Autosuggest
  suggestions={hits}
  multiSection={true}
  onSuggestionsFetchRequested={({value}) => refine(value)}
  onSuggestionsClearRequested={() => refine('')}
  getSuggestionValue={hit => hit.name}
  renderSuggestion={hit =>
    <div>
      <div>{hit.name}</div>
    </div>
  }
  inputProps={{
    placeholder: 'Type a product',
    value: query,
    onChange: () => {
    },
  }}
  renderSectionTitle={section => section.index}
  getSectionSuggestions={section => section.hits}
/>);

const CustomHits = connectHits(({hits}) =>
  <div className="hits">
    {hits.map((hit, idx) => {
      const image = hit.image ? hit.image : hit.picture_url;
      return <div key={idx} className="hit">
          <div>
            <div className="hit-picture"><img src={`${image}`} /></div>
          </div>
          <div className="hit-content">
            <div>
              <Highlight attributeName="name" hit={hit} />
              <span> - ${hit.price}</span>
              <span> - {hit.rating} stars</span>
            </div>
            <div className="hit-type">
              <Highlight attributeName="type" hit={hit} />
            </div>
            <div className="hit-description">
              <Highlight attributeName="description" hit={hit} />
            </div>
          </div>
        </div>;
    }
    )}
  </div>);
