import {OSMFeature, osmFeatureTypes} from "./types";
import {capitalize} from "utils";
import {apiUrl} from "util_components/osm/urls";
import {renderToStaticMarkup} from "react-dom/server";
import React from "react";
import {OSMEditContextType} from "components/types";

export const osmFeatureLabel = (osmFeature: OSMFeature) => {
  const {tags} = osmFeature;
  let label = '';

  osmFeatureTypes.forEach((osmFeatureType) => {
    if (!label && tags[osmFeatureType.requiredTag]) label = osmFeatureType.label(tags);
  });
  return label && capitalize(label).replace('_', ' ');
};

export const osmApiCall = (url: string, BodyComponent: any, props: any, context: OSMEditContextType) => {
  const _url = apiUrl(url);
  const {username, password} = context;
  const body = renderToStaticMarkup(React.createElement(BodyComponent, props));
  const Authorization = `Basic ${btoa(username + ':' + password)}`;

  return fetch(_url, {body, method: 'PUT', headers: {'Content-Type': 'application/xml', Authorization}})
  .then(response => response.text().then(text => ({response, text})));
};
