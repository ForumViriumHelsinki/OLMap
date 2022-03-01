import React from 'react';

const UpdateWay = ({changesetId, way}) =>
  <osm>
    <way changeset={changesetId} id={way.id} version={way.version} visible="true">
      {Object.entries(way.tags).map(([k, v]) => <tag k={k} v={v} key={k}/>)}
      {way.nodes.map((nodeId) => <nd key={nodeId} replaceWithRef={nodeId}/>)}
    </way>
  </osm>;

export default UpdateWay;
