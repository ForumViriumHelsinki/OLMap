import React from 'react';

const CreateNode = ({changesetId, lon, lat, tags}) =>
  <osm>
    <node changeset={changesetId} lat={lat} lon={lon}>
      {Object.entries(tags).map(([k, v]) => <tag k={k} v={v} key={k}/>)}
    </node>
  </osm>;

export default CreateNode;
