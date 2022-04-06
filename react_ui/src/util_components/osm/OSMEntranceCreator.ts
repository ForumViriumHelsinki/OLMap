import {Location} from "util_components/types";
import {osmApiCall, overpassQuery} from "util_components/osm/utils";
import {OSMFeature} from "util_components/osm/types";
import osmtogeojson from "osmtogeojson";
import {nearestPointOnLine, point, polygonToLineString} from "@turf/turf";
import {Point, Feature, LineString, Polygon} from 'geojson'
import CreateNode from "util_components/osm/api/CreateNode";
import UpdateWay from "util_components/osm/api/UpdateWay";
import CreateWay from "util_components/osm/api/CreateWay";
import {OSMEditContextType} from "components/types";

type GeoJSONPoint = any;
type GeoJSONPolygon = any;

/**
 * Class for handling all the necessary logic for creating a new OSM entrance as close as feasible to a given
 * point on the map, i.e.:
 *
 *  - Find out if the point is close to a building outline; if so, find the point on the building outline closest
 *    to the given input point.
 *  - Find out if the identified entrance point is close to a road or other OSM path ("highway"); if so, find the
 *    point on the path closest to the entrance point.
 *  - Add the entrance as a new OSM node; if a building was found, modify the building to include the added node.
 *  - If a path was found, create a new node on the path as close to the entrance as possible and connect the added
 *    entrance node to the path with a new OSM way.
 */
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
    return overpassQuery(this.query, this.coord, this.searchRadius).then((elements: OSMFeature[]) => {
      [this.building, this.entrancePoint] =
        this.findNearestFeature(elements, f => f.tags.building, this.point);
      if (!this.entrancePoint) this.entrancePoint = this.point;
      [this.road, this.accessPoint] =
        this.findNearestFeature(elements, f => f.tags.highway, this.entrancePoint);
      return this
    })
  }

  /**
   * Add the entrance as a new OSM node; delegate additional changes to building and/or path to addToBuilding and
   * connectRoad respectively.
   *
   * Return a promise for the created entrance.
   */
  createEntrance(osmEditContext: OSMEditContextType, entranceTags: any, pathTags: any): Promise<OSMFeature> {
    if (!this.entrancePoint) return Promise.reject(new Error('Could not determine entrance point.'));
    if (!osmEditContext.changeset) return Promise.reject(new Error('No active changeset.'));

    const tags = {...entranceTags};

    // If entrance address is the same as building address, do not duplicate the address information in the
    // entrance node; if building address is not set, set it based on entrance:
    if (tags['addr:housenumber'] || tags['addr:street'])
      if (this.building)
        if (this.building.tags['addr:housenumber'] || this.building.tags['addr:street']) {
          if ((tags['addr:housenumber'] == this.building.tags['addr:housenumber']) &&
            (tags['addr:street'] == this.building.tags['addr:street'])) {
            delete tags['addr:housenumber'];
            delete tags['addr:street'];
          }
        } else {
          this.building.tags['addr:housenumber'] = tags['addr:housenumber'];
          this.building.tags['addr:street'] = tags['addr:street'];
          delete tags['addr:housenumber'];
          delete tags['addr:street'];
        }

    const [lon, lat] = this.entrancePoint.geometry.coordinates;
    const props = {changesetId: osmEditContext.changeset.id, lat, lon, tags};

    return osmApiCall(`node/create`, CreateNode, props, osmEditContext)
      .then(({response, text}) => {
        if (!response.ok) throw new Error(text);
        const osmId = parseInt(text);
        const entrance: OSMFeature = {id: osmId, lat, lon, type: 'node', tags};
        return this.addToBuilding(osmEditContext, entrance)
          .then(() => this.connectRoad(osmEditContext, entrance, pathTags))
          .then(() => entrance)
      })
  }

  /**
   * If a building was found, modify the building to include the passed entrance.
   *
   * Return a promise for the entrance.
   */
  addToBuilding(osmEditContext: OSMEditContextType, entrance: OSMFeature): Promise<any> {
    if (!this.entrancePoint) return Promise.reject(new Error('Could not determine entrance point.'));
    if (!osmEditContext.changeset) return Promise.reject(new Error('No active changeset.'));
    if (!this.building) return Promise.resolve(entrance);

    // @ts-ignore
    const {index} = this.entrancePoint.properties;
    (this.building.nodes as number[]).splice(index + 1, 0, entrance.id);
    const props = {changesetId: osmEditContext.changeset.id, way: this.building};

    return osmApiCall(`way/${this.building.id}`, UpdateWay, props, osmEditContext)
      .then(({response, text}) => {
        if (!response.ok) throw new Error(text);
        return entrance;
      });
  }

  /**
   * If a path was found near the entrance, connect the entrance to the path with a new OSM way.
   *
   * Return a promise for the entrance.
   */
  connectRoad(osmEditContext: OSMEditContextType, entrance: OSMFeature, tags: any) {
    if (!osmEditContext.changeset) return Promise.reject(new Error('No active changeset.'));
    if (!this.road || !this.accessPoint) return Promise.resolve(entrance);

    const {properties, geometry} = this.accessPoint;
    // @ts-ignore
    const {index} = properties;
    const [lon, lat] = geometry.coordinates;
    const props = {changesetId: osmEditContext.changeset.id, lat, lon, tags: {}};

    return osmApiCall(`node/create`, CreateNode, props, osmEditContext)
      .then(({response, text}) => {
        if (!response.ok) throw new Error(text);
        const osmId = parseInt(text);
        // @ts-ignore
        (this.road.nodes as number[]).splice(index + 1, 0, osmId);
        // @ts-ignore
        const props = {changesetId: osmEditContext.changeset.id, way: this.road};
        // @ts-ignore
        return osmApiCall(`way/${this.road.id}`, UpdateWay, props, osmEditContext)
          .then(({response, text}) => {
            if (!response.ok) throw new Error(text);
            const props = {
              // @ts-ignore
              changesetId: osmEditContext.changeset.id,
              way: {nodes: [osmId, entrance.id], tags}
            };
            return osmApiCall(`way/create`, CreateWay, props, osmEditContext)
          });
      }).then(({response, text}) => {
        if (!response.ok) throw new Error(text);
        return entrance;
      })
  }
}