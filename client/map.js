Template.map.onCreated(() => {
  require([
    'esri/map',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/layers/ImageParameters',
    'esri/geometry/Extent',
    'esri/SpatialReference',
    'esri/tasks/locator',
    'esri/geometry/Point',
    'esri/geometry/Multipoint',
    'esri/tasks/IdentifyTask',
    'esri/tasks/IdentifyParameters',
    'esri/dijit/Popup',
    'esri/layers/FeatureLayer',
    'esri/layers/LabelLayer',
    'esri/Color',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/TextSymbol',
    'esri/renderers/SimpleRenderer',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/on',
    'dojo/domReady!'
  ], (Map,
    Tiled,
    ArcGISDynamicMapServiceLayer,
    ImageParameters,
    Extent,
    SpatialReference,
    Locator,
    Point,
    Multipoint,
    IdentifyTask,
    IdentifyParameters,
    Popup,
    FeatureLayer,
    LabelLayer,
    Color,
    SimpleLineSymbol,
    SimpleFillSymbol,
    TextSymbol,
    SimpleRenderer,
    dom,
    domConstruct,
    on) => {

    EsriMap.FeatureLayer = FeatureLayer;
    EsriMap.SpatialReference = SpatialReference;
    EsriMap.IdentifyParameters = IdentifyParameters;
    EsriMap.Extent = Extent;
    EsriMap.IdentifyTask = IdentifyTask;
    EsriMap.Point = Point;
    EsriMap.Locator = Locator;
    EsriMap.Color = Color;
    EsriMap.SimpleRenderer = SimpleRenderer;
    EsriMap.SimpleFillSymbol = SimpleFillSymbol;
    EsriMap.SimpleLineSymbol = SimpleLineSymbol;
    EsriMap.TextSymbol = TextSymbol;
    EsriMap.LabelLayer = LabelLayer;
    EsriMap.Popup = Popup;
    EsriMap.on = on;

    const popup = new Popup({
      fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
          new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]))
    }, domConstruct.create("div"));

    EsriMap.map = new Map('map', {
      sliderOrientation: 'horizontal',
      center: [-121.77515409216302, 47.434674437283064],
      zoom: 9,
      infoWindow: popup
    });

    const tiles = [
      'http://gismaps.kingcounty.gov/ArcGIS/rest/services/BaseMaps/' +
      'KingCo_GenericBase/MapServer'
    ];
    tiles.map(tile => {
      EsriMap.map.addLayer(new Tiled(tile));
    });

    EsriMap.map.on('load', () => {
      EsriMap.addFeatureLayer('baseLayer',
        'http://gismaps.kingcounty.gov/arcgis/rest/services/' +
        'Districts/KingCo_Electoral_Districts/MapServer/0');
    });
    EsriMap.map.on('extent-change', (evt) => {
      EsriMap.center.set({
        lat: evt.extent.getCenter().getLatitude(),
        lon: evt.extent.getCenter().getLongitude()
      });
      EsriMap.visibleLayers.set(EsriMap.map.getLayersVisibleAtScale());
    });
    EsriMap.map.on('zoom-end', (evt) => {
      EsriMap.zoomLevel.set(evt.level);
    });
    EsriMap.map.on('click', (evt) => {
      EsriMap.deviceOrAddress.set(null);
      EsriMap.runPointInfo(evt.mapPoint);
    });
  });
});

EsriMap.runPointInfo = (point) => {
  const electoralURL =
    'http://gismaps.kingcounty.gov/ArcGIS/rest/services/Districts' +
    '/KingCo_Electoral_Districts/MapServer';
  const identifyParams = new EsriMap.IdentifyParameters();
  const identifyTask = new EsriMap.IdentifyTask(electoralURL);
  identifyParams.geometry = point;
  identifyParams.tolerance = 0;
  identifyParams.layerIds = [];
  identifyParams.layerOption = EsriMap.IdentifyParameters.LAYER_OPTION_ALL;
  identifyParams.mapExtent = new EsriMap.Extent(
    point.x,
    point.y,
    point.x,
    point.y,
    point.spatialReference
  );
  identifyTask.execute(identifyParams, (idResults) => {
    let message = '';
    idResults.map(result => {
      message = message + '<b>' +
        result.layerName + '</b> : ' +
        result.value + '<br>';
    });
    EsriMap.map.infoWindow.setContent(message);
    EsriMap.map.infoWindow.resize(400, 250);
    EsriMap.map.infoWindow.show(point);
    EsriMap.map.centerAndZoom(point, 15);
  });
};

EsriMap.addFeatureLayer = (id, url) => {
  const fl = new EsriMap.FeatureLayer(url, {
    id: id,
    mode: EsriMap.FeatureLayer.MODE_ONDEMAND,
    outFields: ['*'],
    maxAllowableOffset: calcOffset()
  });

  EsriMap.map.on('zoom-end', (evt) => {
    setMaxOffset(fl);
  });

  const labelField = 'NAME';
  const statesColor = new EsriMap.Color('#666');
  const statesLine = new EsriMap.SimpleLineSymbol('solid', statesColor, 1.5);
  const statesSymbol = new EsriMap.SimpleFillSymbol('solid', statesLine, null);
  const statesRenderer = new EsriMap.SimpleRenderer(statesSymbol);

  fl.setRenderer(statesRenderer);
  EsriMap.map.addLayer(fl);

  const statesLabel = new EsriMap.TextSymbol().setColor(statesColor);
  statesLabel.font.setSize('14pt');
  statesLabel.font.setFamily('arial');
  const statesLabelRenderer = new EsriMap.SimpleRenderer(statesLabel);
  const labels = new EsriMap.LabelLayer({
    id: 'labels'
  });
  labels.addFeatureLayer(fl, statesLabelRenderer, '{' + labelField + '}');
  EsriMap.map.addLayer(labels);
  EsriMap.visibleLayers.set(EsriMap.map.getLayersVisibleAtScale());
};

function setMaxOffset(fl) {
  fl.setMaxAllowableOffset(calcOffset());
}

function calcOffset() {
  return (EsriMap.map.extent.getWidth() / EsriMap.map.width);
}
