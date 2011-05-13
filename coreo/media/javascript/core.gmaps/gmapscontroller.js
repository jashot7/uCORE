/**
 * Class: GmapsController
 * 
 * Interface between Google Maps and the Core maps implementation. 
 * This class handles events from the core events framework for 
 * interacting with Google Maps.
 *
 * Namespace: 
 *  core.gmaps
 * 
 * Properties:
 * 	gmaps - The google maps instance.
 * Dependencies:
 *	- Google Maps instance
 * 
 */
if (!window.core)
	window.core = {};
if (!window.core.gmaps)
	window.core.gmaps = {};

(function(ns) {
	var MapsOverlayStore = core.gmaps.MapsOverlayStore;
	if (!MapsOverlayStore)
		throw "Dependency not found: core.gmaps.MapsOverlayStore";
	var ShowFeatureEvent = core.events.ShowFeatureEvent;
	if (!ShowFeatureEvent)
		throw "Dependency not found: core.events.ShowFeatureEvent";
	var HideFeatureEvent = core.events.HideFeatureEvent;
	if (!HideFeatureEvent)
		throw "Dependency not found: core.events.HideFeatureEvent";
	var FeatureInfoEvent = core.events.FeatureInfoEvent;
	if (!FeatureInfoEvent)
		throw "Dependency not found: core.events.FeatureInfoEvent";
	var GeoDataLoadedEvent = core.events.GeoDataLoadedEvent;
	if (!GeoDataLoadedEvent)
		throw "Dependency not found: core.events.GeoDataLoadedEvent";
	var GeoDataUpdateEndEvent = core.events.GeoDataUpdateEndEvent;
	if (!GeoDataUpdateEndEvent)
		throw "Dependency not found: core.events.GeoDataUpdateEndEvent";



	var GmapsController = function(gmaps, eventChannel) {
	    this.gmaps = gmaps;
	    this.mapsOverlayStore = new MapsOverlayStore(this.gmaps);
	    this.eventChannel = eventChannel;
	    this._init();

	};
	GmapsController.prototype = {

		_init: function() {

		    	if (this.eventChannel) {
				this.eventChannel.subscribe(GeoDataUpdateEndEvent.type, $.proxy(function(event) {
					console.log(event);
					this.update(event.geoData);
				}, this));
				this.eventChannel.subscribe(GeoDataLoadedEvent.type, $.proxy(function(event) {
					console.log(event);
					this.add(event.geoData);
				}, this));
				this.eventChannel.subscribe(ShowFeatureEvent.type, $.proxy(function(event) {
					console.log(event);
					this.show(event.geoData);
				}, this));
				this.eventChannel.subscribe(HideFeatureEvent.type, $.proxy(function(event) {
					console.log(event);
					this.hide(event.geoData);
				}, this));
				this.eventChannel.subscribe(FeatureInfoEvent.type, $.proxy(function(event) {
					console.log(event);
					this.flyTo(event.geoData);
					this.info(event.geoData);
				}, this));
			}

		},
		
		update: function(geodate) {
		    alert("update");
		},
		add: function(geoData) {
		    alert("add object!");
		    console.log("maps-add(" + geoData.id + ")");
		    this.mapsOverlayStore.getOrCreateMapsOverlay(geoData, $.proxy(function(mapsOverlay) {
			console.log("Maps Overlay Created");
			//this.ge.getFeatures().appendChild(kmlObject);
			this.gmaps.addOverlay(mapsOverlay);
		    }, this));

			    

		},
		
		/**
		 * Function: show
		 * 
		 * Displays a feature on the Google Maps instance.
		 * 
		 * Parameters:
		 *   geoData - <GeoData>. The feature to display.
		 */
		show: function(geoData) {
			//this._show(geoData, true);
			alert("show object!");
		},

		/**
		 * Function: hide
		 * 
		 * Removes a feature from the Google Maps instance.
		 * 
		 * Parameters:
		 *   geoData - <GeoData>. The feature to be removed.
		 */
		hide: function(geoData) {
			var mapsOverlayObject = this.mapsOverlayStore.getMapsOverlay(geoData);
			if (mapsOverlayObject) {
				alert("hide object!");
			}
		},

		/**
		 * Function: info
		 * 
		 * Displays the information balloon for a feature on the Google Earth 
		 * instance.
		 * 
		 * Parameters:
		 *   geoData - <GeoData>. The feature for which to display the 
		 *         information balloon.
		 */
		info: function(geoData) {
			alert("info on object");

			/*// TODO: look at parent GeoData nodes if this node doesn't exist
			// TODO: allow showing info of a node even if it isn't being shown (checked)
			this.ge.setBalloon(null);
			var kmlObject = this.kmlObjectStore.getKmlObject(geoData);
			if (kmlObject) {
				var balloon = this.ge.createFeatureBalloon('');
				balloon.setFeature(kmlObject);
				// balloon.setMinWidth(400);
				// balloon.setMaxHeight(400);
				balloon.setCloseButtonEnabled(true);
				this.ge.setBalloon(balloon);
			}*/
		},

		/**
		 * Function: flyTo
		 * 
		 * Pans the view of the Google Earth instance to a feature.
		 * 
		 * Parameters:
		 *   geoData - <GeoData>. The feature to pan to.
		 */
		flyTo: function(geoData) {
			alert("fly to object");
			// TODO: look at parent GeoData nodes if this node doesn't exist.
			// TODO: allow flying to a node even if it isn't being shown (checked)
			/*var kmlObject = this.kmlObjectStore.getKmlObject(geoData);
			if (kmlObject) {
				this.gex.util.flyToObject(kmlObject, { boundsFallback: true });
			}*/
		}
		
	};
	ns.GmapsController = GmapsController;
	
})(window.core.gmaps);
