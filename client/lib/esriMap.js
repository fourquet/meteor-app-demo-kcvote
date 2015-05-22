/* jshint -W020 */
EsriMap = {
  center: new ReactiveVar(null),
  zoomLevel: new ReactiveVar(null),
  visibleLayers: new ReactiveVar(null),
  deviceOrAddress: new ReactiveVar(null),
  addresses: new ReactiveVar(null),
  setMapToAddress: function (addressCandidate) {
    'use strict';
    EsriMap.deviceOrAddress.set('address');
    EsriMap.runPointInfo(new EsriMap.Point(
      addressCandidate.location.x,
      addressCandidate.location.y,
      addressCandidate.location.spatialReference
    ));
  }
};
