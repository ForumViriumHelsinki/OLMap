import {OSMFeature, osmFeatureTypes} from "./types";
import {capitalize} from "utils";

export const osmFeatureLabel = (osmFeature: OSMFeature) => {
  const {tags} = osmFeature;
  let label = '';

  osmFeatureTypes.forEach((osmFeatureType) => {
    if (!label && tags[osmFeatureType.requiredTag]) label = osmFeatureType.label(tags);
  });
  return label && capitalize(label).replace('_', ' ');
};
