import React from "react";

const CreateWay = ({ changesetId, way }) => (
  <osm>
    <way changeset={changesetId} visible="true">
      {Object.entries(way.tags).map(([k, v]) => (
        <tag k={k} v={v} key={k} />
      ))}
      {way.nodes.map((nodeId) => (
        <nd key={nodeId} replaceWithRef={nodeId} />
      ))}
    </way>
  </osm>
);

export default CreateWay;
