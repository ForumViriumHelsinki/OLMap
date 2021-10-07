import React from 'react';

const UpdateNode = ({changesetId, node, tags}) =>
  <osm>
    <node changeset={changesetId} id={node.id} lat={node.lat} lon={node.lon} version={node.version} visible="true">
      {Object.entries(tags).map(([k, v]) => <tag k={k} v={v} key={k}/>)}
    </node>
  </osm>;

export default UpdateNode;
