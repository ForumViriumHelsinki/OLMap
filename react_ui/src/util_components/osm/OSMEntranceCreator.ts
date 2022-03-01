import {Location} from "util_components/types";
import {overpassQuery} from "util_components/osm/utils";
import {OSMFeature} from "util_components/osm/types";
import osmtogeojson from "osmtogeojson";
import {nearestPointOnLine, point, polygonToLineString} from "@turf/turf";
import {Point, Feature, LineString, Polygon} from 'geojson'

type GeoJSONPoint = any;
type GeoJSONPolygon = any;

export default class OSMEntranceCreator {
  query = 'way[building];relation[building];way[highway]';
  point: Feature<Point>;
  searchRadius = 10;
  coord: Location;

  building?: OSMFeature;
  entrancePoint?: Feature<Point>;
  road?: OSMFeature;
  accessPoint?: Feature<Point>;

  constructor(coord: Location) {
    const {lat, lon} = coord;
    this.coord = coord;
    // @ts-ignore
    this.point = point([lon, lat]);
  }

  findNearestFeature(elements: OSMFeature[], filter: (f: GeoJSONPolygon) => any, p: GeoJSONPoint) {
    const filtered: (OSMFeature & {nearest?: Feature<Point>})[] = elements.filter(filter);
    if (!filtered.length) return [undefined, undefined];
    const {features} = osmtogeojson({elements: filtered});
    // @ts-ignore
    features.forEach((b, i) => {
      // @ts-ignore
      let lineString: Feature<LineString>;
      if (b.geometry.type == 'Polygon') {
        lineString = polygonToLineString(b as Feature<Polygon>) as Feature<LineString>;
        lineString.geometry.coordinates.reverse(); // evil osmtogeojson reverses the coords for polys...
      } else lineString = b as Feature<LineString>;
      filtered[i].nearest = nearestPointOnLine(lineString, p)
    });
    filtered.sort((a, b) =>
      // @ts-ignore
      a.nearest.properties.dist - b.nearest.properties.dist);

    const {nearest, ...nearestFeature} = filtered[0];
    return [nearestFeature, nearest] as [OSMFeature, Feature<Point>]
  }

  findPointsToAdd() {
    // @ts-ignore
    return overpassQuery(this.coord, this.searchRadius, this.query).then((elements: OSMFeature[]) => {
      [this.building, this.entrancePoint] =
        this.findNearestFeature(elements, f => f.tags.building, this.point);
      if (!this.entrancePoint) this.entrancePoint = this.point;
      [this.road, this.accessPoint] =
        this.findNearestFeature(elements, f => f.tags.highway, this.entrancePoint);
      return this
    })

  }
}