import {OSMFeature, osmFeatureTypes} from "./types";
import {capitalize} from "utils";
import {apiUrl} from "util_components/osm/urls";
import {renderToStaticMarkup} from "react-dom/server";
import React from "react";
import {OSMEditContextType} from "components/types";
import {getBoundsOfDistance} from "geolib";
import {overpassInterpreterPath} from "settings.json";
import _ from "lodash";
// @ts-ignore
import OverpassFrontend from 'overpass-frontend';

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
  const body = renderToStaticMarkup(React.createElement(BodyComponent, props));
  const Authorization = `Basic ${btoa(username + ':' + password)}`;

  return fetch(_url, {body, method: 'PUT', headers: {'Content-Type': 'application/xml', Authorization}})
  .then(response => response.text().then(text => ({response, text})));
};

export const overpassQuery = (location: any, distance: number, query: string) => {
  // @ts-ignore
  const bounds = getBoundsOfDistance(location, distance);
  const overpassBounds = {
    minlat: bounds[0].latitude, maxlat: bounds[1].latitude,
    minlon: bounds[0].longitude, maxlon: bounds[1].longitude
  };

  const overpassFrontend = new OverpassFrontend(overpassInterpreterPath);

  const features: OSMFeature[] = [];

  return new Promise((resolve) =>
    overpassFrontend.BBoxQuery(query, overpassBounds, {properties: OverpassFrontend.ALL},
      (err: any, response: any) => {
        if (err) console.error(err);
        features.push(response.data);
      },
      (err: any) => {
        resolve(features);
      }
    )
  );
};