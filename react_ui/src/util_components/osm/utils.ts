import {OSMFeature, osmFeatureTypes} from "./types";
import {capitalize} from "utils";
import {apiUrl} from "util_components/osm/urls";
import {renderToStaticMarkup} from "react-dom/server";
import React from "react";
import {OSMEditContextType} from "components/types";
import {getBoundsOfDistance} from "geolib";
import {overpassInterpreterPath} from "settings.json";
import _ from "lodash";

export const osmFeatureLabel = (osmFeature: OSMFeature) => {
  const {tags} = osmFeature;
  let label = '';

  osmFeatureTypes.forEach((osmFeatureType) => {
    if (!label && tags[osmFeatureType.requiredTag]) label = osmFeatureType.label(tags);
  });
  return label && capitalize(label).replace('_', ' ');
};

let contextString;
try {
  contextString = localStorage.getItem('osmEditContext');
} catch (DOMException) {}

export var osmEditContext = contextString ? JSON.parse(contextString) : undefined;

export const setOSMContext = (context: OSMEditContextType) => {
  osmEditContext = context;
  localStorage.setItem('osmEditContext', JSON.stringify(osmEditContext));
};

export const osmApiCall = (url: string, BodyComponent: any, props: any, context: OSMEditContextType) => {
  const _url = apiUrl(url);
  const {username, password} = context;

  // ref attribute gets replaced by React, therefore substitution:
  const body = renderToStaticMarkup(React.createElement(BodyComponent, props))
               .replace(/replaceWithRef/g, 'ref');

  const Authorization = `Basic ${btoa(username + ':' + password)}`;

  return fetch(_url, {body, method: 'PUT', headers: {'Content-Type': 'application/xml', Authorization}})
  .then(response => response.text().then(text => ({response, text})));
};

export const overpassQuery = (query: string, location?: any, distance?: number) => {
  let overpassBounds: any;

  if (location && distance) {
    // @ts-ignore
    const bounds = getBoundsOfDistance(location, distance);
    overpassBounds = [bounds[0].latitude, bounds[0].longitude, bounds[1].latitude, bounds[1].longitude];
  }
  const bbox = overpassBounds ? `[bbox:${overpassBounds.join(',')}]` : '';
  const body = `[out:json]${bbox}; (${query};)->.result; .result out body geom qt;`;
  return fetch(overpassInterpreterPath, {method: 'POST', body})
    .then(response => response.json())
    .then(({elements}) => elements)
};