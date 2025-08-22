import { Location } from "util_components/types";
import { osmApiCall, overpassQuery } from "util_components/osm/utils";
import { OSMFeature } from "util_components/osm/types";
import { nearestPointOnLine, point, lineString } from "@turf/turf";
import { Point, Feature } from "geojson";
import CreateNode from "util_components/osm/api/CreateNode";
import UpdateWay from "util_components/osm/api/UpdateWay";
import CreateWay from "util_components/osm/api/CreateWay";
import { OSMEditContextType } from "components/types";

type GeoJSONPoint = any;
type GeoJSONPolygon = any;

const osmCache: any = {};

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
  point: Feature<Point>;
  searchRadius = 10;
  coord: Location;
  layer?: any;

  building?: OSMFeature;
  entrancePoint?: Feature<Point>;
  road?: OSMFeature;
  accessPoint?: Feature<Point>;

  constructor(coord: Location, layer?: any) {
    const { lat, lon } = coord;
    this.coord = coord;
    this.layer = layer;
    // @ts-ignore
    this.point = point([lon, lat]);
  }

  query() {
    return `relation[building]; (way(r);way[building];way[highway][layer${
      this.layer ? "=" + this.layer : '!~".*"'
    }];)->.result;`;
  }

  findNearestFeature(
    elements: OSMFeature[],
    filter: (f: GeoJSONPolygon) => any,
    p: GeoJSONPoint,
  ): [OSMFeature | undefined, Feature<Point> | undefined] {
    const filtered: OSMFeature[] = elements.filter(filter);
    if (!filtered.length) return [undefined, undefined];

    let nearest: Feature<Point>;
    let nearestFeature: OSMFeature;
    // @ts-ignore
    filtered.forEach((feature) => {
      // @ts-ignore
      const n = nearestPointOnLine(
        lineString(feature.geometry.map(({ lat, lon }) => [lon, lat])),
        p,
      );
      // @ts-ignore
      if (!nearest || n.properties.dist < nearest.properties.dist) {
        nearest = n;
        nearestFeature = feature;
      }
    });
    // @ts-ignore
    return [nearestFeature, nearest];
  }

  findPointsToAdd() {
    // @ts-ignore
    return overpassQuery(this.query(), this.coord, this.searchRadius).then(
      (elements: OSMFeature[]) => {
        const freshElems = elements.map((f) => {
          const cached = osmCache[f.id as number];
          // @ts-ignore
          return cached && cached.version > f.version ? cached : f;
        });
        [this.building, this.entrancePoint] = this.findNearestFeature(
          freshElems,
          (f) => !(f.tags && f.tags.highway),
          this.point,
        );
        if (!this.entrancePoint) this.entrancePoint = this.point;
        [this.road, this.accessPoint] = this.findNearestFeature(
          freshElems,
          (f) => f.tags && f.tags.highway,
          this.entrancePoint,
        );
        return this;
      },
    );
  }

  /**
   * Add the entrance as a new OSM node; delegate additional changes to building and/or path to addToBuilding and
   * connectRoad respectively.
   *
   * Return a promise for the created entrance.
   */
  createEntrance(
    osmEditContext: OSMEditContextType,
    entranceTags: any,
    pathTags: any,
  ): Promise<OSMFeature> {
    if (!this.entrancePoint)
      return Promise.reject(new Error("Could not determine entrance point."));
    if (!osmEditContext.changeset)
      return Promise.reject(new Error("No active changeset."));

    const tags = { ...entranceTags };

    // If entrance address is the same as building address, do not duplicate the address information in the
    // entrance node; if building address is not set, set it based on entrance:
    if (tags["addr:housenumber"] || tags["addr:street"])
      if (this.building && this.building.tags)
        if (
          this.building.tags["addr:housenumber"] ||
          this.building.tags["addr:street"]
        ) {
          if (
            tags["addr:housenumber"] ==
              this.building.tags["addr:housenumber"] &&
            tags["addr:street"] == this.building.tags["addr:street"]
          ) {
            delete tags["addr:housenumber"];
            delete tags["addr:street"];
          }
        } else {
          this.building.tags["addr:housenumber"] = tags["addr:housenumber"];
          this.building.tags["addr:street"] = tags["addr:street"];
          delete tags["addr:housenumber"];
          delete tags["addr:street"];
        }

    const [lon, lat] = this.entrancePoint.geometry.coordinates;
    const props = { changesetId: osmEditContext.changeset.id, lat, lon, tags };

    return osmApiCall(`node/create`, CreateNode, props, osmEditContext).then(
      ({ response, text }) => {
        if (!response.ok) throw new Error(text);
        const osmId = parseInt(text);
        const entrance: OSMFeature = {
          id: osmId,
          lat,
          lon,
          type: "node",
          tags,
        };
        return this.addToBuilding(osmEditContext, entrance)
          .then(
            () =>
              pathTags && this.connectRoad(osmEditContext, entrance, pathTags),
          )
          .then(() => entrance);
      },
    );
  }

  /**
   * If a building was found, modify the building to include the passed entrance.
   *
   * Return a promise for the entrance.
   */
  addToBuilding(
    osmEditContext: OSMEditContextType,
    entrance: OSMFeature,
  ): Promise<any> {
    if (!this.entrancePoint)
      return Promise.reject(new Error("Could not determine entrance point."));
    if (!osmEditContext.changeset)
      return Promise.reject(new Error("No active changeset."));
    if (!this.building) return Promise.resolve(entrance);

    // @ts-ignore
    const { index } = this.entrancePoint.properties;
    // @ts-ignore
    this.building.nodes.splice(index + 1, 0, entrance.id);
    // @ts-ignore
    this.building.geometry = this.newBuildingGeometry();
    const props = {
      changesetId: osmEditContext.changeset.id,
      way: this.building,
    };

    return osmApiCall(
      `way/${this.building.id}`,
      UpdateWay,
      props,
      osmEditContext,
    ).then(({ response, text }) => {
      if (!response.ok) throw new Error(text);
      // @ts-ignore
      osmCache[this.building.id] = this.building;
      // @ts-ignore
      this.building.version += 1;
      return entrance;
    });
  }

  newBuildingGeometry() {
    if (!this.building || !this.building.geometry || !this.entrancePoint)
      return;
    // @ts-ignore
    const { index } = this.entrancePoint.properties;
    const [lon, lat] = this.entrancePoint.geometry.coordinates;
    const newGeom = [...this.building.geometry];
    newGeom.splice(index + 1, 0, { lat, lon });
    return newGeom;
  }

  /**
   * If a path was found near the entrance, connect the entrance to the path with a new OSM way.
   *
   * Return a promise for the entrance.
   */
  connectRoad(
    osmEditContext: OSMEditContextType,
    entrance: OSMFeature,
    tags: any,
  ) {
    if (!osmEditContext.changeset)
      return Promise.reject(new Error("No active changeset."));
    if (!this.road || !this.accessPoint) return Promise.resolve(entrance);

    const { properties, geometry } = this.accessPoint;
    // @ts-ignore
    const { index } = properties;
    const [lon, lat] = geometry.coordinates;
    const props = {
      changesetId: osmEditContext.changeset.id,
      lat,
      lon,
      tags: {},
    };

    return osmApiCall(`node/create`, CreateNode, props, osmEditContext)
      .then(({ response, text }) => {
        if (!response.ok) throw new Error(text);
        const osmId = parseInt(text);
        // @ts-ignore
        this.road.nodes.splice(index + 1, 0, osmId);
        // @ts-ignore
        this.road.geometry = this.newRoadGeometry();
        // @ts-ignore
        const props = {
          changesetId: osmEditContext.changeset.id,
          way: this.road,
        };
        // @ts-ignore
        return osmApiCall(
          `way/${this.road.id}`,
          UpdateWay,
          props,
          osmEditContext,
        ).then(({ response, text }) => {
          if (!response.ok) throw new Error(text);
          // @ts-ignore
          osmCache[this.road.id] = this.road;
          // @ts-ignore
          this.road.version += 1;
          const props = {
            // @ts-ignore
            changesetId: osmEditContext.changeset.id,
            way: { nodes: [osmId, entrance.id], tags },
          };
          return osmApiCall(`way/create`, CreateWay, props, osmEditContext);
        });
      })
      .then(({ response, text }) => {
        if (!response.ok) throw new Error(text);
        return entrance;
      });
  }

  newRoadGeometry() {
    if (!this.road || !this.road.geometry || !this.accessPoint) return;
    // @ts-ignore
    const { index } = this.accessPoint.properties;
    const [lon, lat] = this.accessPoint.geometry.coordinates;
    const newGeom = [...this.road.geometry];
    newGeom.splice(index + 1, 0, { lat, lon });
    return newGeom;
  }
}
