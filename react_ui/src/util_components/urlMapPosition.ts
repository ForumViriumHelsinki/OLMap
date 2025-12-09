const urlMapPosition = {
  read: () => window.location.hash.split('@')[1]?.split(',').map(Number),

  write: (lat: number, lng: number, zoom: number) =>
    window.history.replaceState(
      null,
      '',
      window.location.href.split('@')[0] + '@' + [lat, lng, zoom].join(','),
    ),
};

export default urlMapPosition;
