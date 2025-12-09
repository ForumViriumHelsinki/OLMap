import React from 'react';

const CreateChangeset = ({ comment }) => (
  <osm>
    <changeset>
      <tag k="created_by" v="OLMap" />
      <tag k="comment" v={comment} />
    </changeset>
  </osm>
);

export default CreateChangeset;
