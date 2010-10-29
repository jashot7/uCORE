/*
 * Google Earth API for Ext JS
 * Copyright(c) 2008, Bjorn Sandvik
 * bjorn@thematicmapping.org
 * http://thematicmapping.org
 *
 * License: GNU General Public License v3
 *
 * Version: 1.1
 *
 */

Ext.namespace('Ext.ux');

// JLC -- function provided by Mike Wall @ Texeltek
Ext.ux.toggleTreeNodeChecked = function(node, checked) {
  if (node.attributes.checked !== undefined) {
    node.attributes.checked = checked;
    node.ui.toggleCheck(checked);
    node.attributes.kml.setVisibility(checked);
  }
};

/**
 *
 * @class GEarthPanel
 * @extends Ext.Panel
 */
Ext.ux.GEarthPanel = Ext.extend(Ext.Panel, {
  initComponent: function() {
    // Default values
    var defConfig = {
      border: true,
      earthLayers: {
        LAYER_BORDERS:   true,
        LAYER_ROADS:     false,
        LAYER_BUILDINGS: false,
        LAYER_TERRAIN:   true
      },
      earthOptions: {
        setStatusBarVisibility:    false,
        setGridVisibility:         false,
        setOverviewMapVisibility:  false,
        setScaleLegendVisibility:  false,
        setAtmosphereVisibility:   true,
        setMouseNavigationEnabled: true
      },
      kmlTreePanel: null
    };

    Ext.applyIf(this, defConfig);
    Ext.ux.GEarthPanel.superclass.initComponent.call(this);
    this.addEvents('earthLoaded');
  },

  // Create Google Earth instance when panel is rendered
  afterRender: function() {
    Ext.ux.GEarthPanel.superclass.afterRender.call(this);
    google.earth.createInstance(this.body.dom, this.onEarthReady.createDelegate(this), {});
  },
  
  // Called by above function
  onEarthReady: function(object) {
    this.earth = object;
    this.earth.getWindow().setVisibility(true);
    this.earth.getNavigationControl().setVisibility(this.earth.VISIBILITY_SHOW);
    this.setLayers(this.earthLayers);
    this.setOptions(this.earthOptions);

    // Create TreePanel to show KML documents
    this.kmlTreePanel = new Ext.tree.TreePanel({
      xtype: 'treepanel',
      border: false,
      bodyStyle: 'padding-bottom: 15px',
      root: new Ext.tree.TreeNode({
        text: 'KML Documents',
        iconCls: 'folder',
        expanded: true
      }),
      rootVisible: false,
      scope: this,
      userCheckedNode : null,
      listeners: {
        checkchange: {
          fn: function(node, checked) {
            if (this.userCheckedNode === null) { 
              // JLC -- only want to walk up and down the tree for the node the user checked
              this.userCheckedNode = node; 

              if (checked) {
                this.scope.checkParentsAndChildren(node);
              } else {
                this.scope.uncheckParentsAndChildren(node);
              }

              this.userCheckedNode = null;
            }
          }
        }
      }
    });

    this.fireEvent('earthLoaded', this);
  },
  
  // JLC -- function provided by Mike Wall @ Texeltek
  checkParentsAndChildren: function(node) {
    node.bubble(function(parent) {
      Ext.ux.toggleTreeNodeChecked(parent, true);
    });

    node.cascade(function(child){
      Ext.ux.toggleTreeNodeChecked(child, true);
    });

    return;
  },
  
  // JLC -- function provided by Mike Wall @ Texeltek
  uncheckParentsAndChildren: function(node) {
    node.bubble(function(parent) {
      if ((parent !== node) && (parent.findChild('checked', true) !== null)) {
        return false;  //at least one other child of the parent was checked, so stop
      }

      Ext.ux.toggleTreeNodeChecked(parent, false);
    });

    node.cascade(function(child){
      Ext.ux.toggleTreeNodeChecked(child, false);
    });

    return;
  },

  // Return Google Earth instance
  getEarth: function() {
    return this.earth;
  },

  // Set Google Earth layers
  setLayers: function(layers) {
    for (layer in layers){
      this.earth.getLayerRoot().enableLayerById(this.earth[layer], layers[layer]);
    }
  },

    // Returns FormPanel containing Google Earth layers
  getLayersPanel: function() {
    // Define layer labels
    var layerNames = {
      LAYER_BORDERS: 'Borders and names',
      LAYER_ROADS: 'Roads',
      LAYER_BUILDINGS: 'Buildings',
      LAYER_TERRAIN: 'Terrain'
    }

    // Create checkbox for each layer
    var items = [];

    for (layer in this.earthLayers) {
      items.push({
        boxLabel: layerNames[layer],
        checked: this.earthLayers[layer],
        name: layer,
        earth: this.earth,
        handler: function(layer, visibility) {
          this.earth.getLayerRoot().enableLayerById(this.earth[layer.name], visibility);
        }.createDelegate(this)
      });
    }

    // Create FormPanel with all layers
    var layersPanel = new Ext.FormPanel({
      title: 'Google Earth Layers',
      defaultType: 'checkbox',
      defaults: {
        hideLabel: true
      },
      items: items
    });

    return layersPanel;
  },

  // Set Google Earth options
  setOptions: function(options) {
    for (option in options){
      this.earth.getOptions()[option](options[option]);
    }
  },

  // Returns FormPanel containing Google Earth options
  getOptionsPanel: function() {
    // Define option labels
    var optionLabels = {
      setStatusBarVisibility: 'Show status bar',
      setGridVisibility: 'Show grid',
      setOverviewMapVisibility: 'Show overview map',
      setScaleLegendVisibility: 'Show scale legend',
      setAtmosphereVisibility: 'Show atmosphere',
      setMouseNavigationEnabled: 'Enable mouse navigation'
    }

    // Create checkbox for each option
    var items = [];

    for (option in this.earthOptions) {
      items.push({
        boxLabel: optionLabels[option],
        checked: this.earthOptions[option],
        name: option,
        handler: function(option, visibility) {
          this.earth.getOptions()[option.name](visibility);
        }.createDelegate(this)
      });
    }

    // Create FormPanel with all options
    var optionsPanel = new Ext.FormPanel({
      title: 'Options',
      defaultType: 'checkbox',
      defaults: {
        hideLabel: true
      },
      items: items
    });

    return optionsPanel;
  },

  // Returns FormPanel for finding locations
  getLocationPanel: function() {
    var locationPanel = new Ext.FormPanel({
      title: 'Find Location',
      labelAlign: 'top',
      items: new Ext.form.TriggerField({
        fieldLabel: 'Location',
        triggerClass: 'x-form-search-trigger',
        anchor: '100%',
        name: 'location',
        scope: this,
        onTriggerClick: function() {
          this.scope.findLocation(this.getValue());
        },
        listeners: {specialkey: {fn: function(f, e) {
          if (e.getKey() == e.ENTER) {
            this.onTriggerClick();
          }
        }}}
      })
    });

    return locationPanel;
  },

  // Fly to location (geocoding) - used by above function
  // Based on http://earth-api-samples.googlecode.com/svn/trunk/examples/geocoder.html
  findLocation: function(geocodeLocation) {
    var geocoder = new google.maps.ClientGeocoder();
    geocoder.getLatLng(geocodeLocation, function(point) {
      if (point) {
        var lookAt = this.earth.createLookAt('');
        lookAt.set(point.y, point.x, 10, this.earth.ALTITUDE_RELATIVE_TO_GROUND, 0, 60, 20000);
        this.earth.getView().setAbstractView(lookAt);
      }
    }.createDelegate(this));
  },

  // Returns FormPanel for KML documents
  getKmlPanel: function() {
    var kmlUrlField = new Ext.form.TriggerField({
      fieldLabel: 'Search',
      triggerClass: 'x-form-search-trigger',
      anchor: '100%',
      name: 'url',
      value: '',
      selectOnFocus: true,
      scope: this,
      onTriggerClick: function() {
        var value = this.getValue();

        if (value.match('^http')) {
            google.earth.fetchKml(this.scope.earth, value, this.scope.addKml.createDelegate(this.scope));
        } else if (value.match('^show')) {
            // XXX duplicate code here. need to refactor
            Ext.Ajax.request({
                url: '../search-mongo/',
                params: 'q=' + value,
                method: 'GET',
                scope: this,
                //disableCaching: false,
                success: function(response) {
                    // XXX Nehal's response will be a url to a KMZ. call google.earth.fetchKml()
                    //alert('success: ' + response.responseText);
                    //this.scope.addKml.createDelegate(this.scope, [this.scope.earth.parseKml(response.responseText)]);
                    this.scope.addKml(this.scope.earth.parseKml(response.responseText));
                },
                failure: function(response) {
                    alert('failure: ' + response.status + ' ' + response.statusText);
                }
            });
        } else {
            Ext.Ajax.request({
                url: '../search-links/',
                params: 'q=' + value,
                method: 'GET',
                //disableCaching: false,
                success: function(response) {
                    // XXX here, the response is a HTML doc. how do we display that?
                    alert('success: ' + response.responseText);
                },
                failure: function(response) {
                    alert('failure: ' + response.status + ' ' + response.statusText);
                }
            });
        }

        this.reset();
      },
      listeners: {specialkey: {fn: function(f, e) {
        if (e.getKey() == e.ENTER) {
          this.onTriggerClick();
        }
      }}}
    });

    var kmlPanel = new Ext.FormPanel({
      title: 'KML Documents',
      labelAlign: 'top',
      // JLC -- reorder the items so the form for adding kmls is on top
      //items: [this.kmlTreePanel, kmlUrlField],
      items: [kmlUrlField, this.kmlTreePanel],

      // JLC -- allow scrolling
      autoScroll: true
    });

    return kmlPanel;
  },

  // Load and display KML file
  fetchKml: function(kmlUrl) {
    google.earth.fetchKml(this.earth, kmlUrl, this.addKml.createDelegate(this));
  },

  // Add KML object (called by above function)
  addKml: function(kmlObject) {
    if (kmlObject) {
      this.earth.getFeatures().appendChild(kmlObject);
      this.kmlTreePanel.getRootNode().appendChild(this.treeNodeFromKml(kmlObject));
    } else {
      alert('Bad KML');
    }
  },

  // Create KML tree (called by above function)
  treeNodeFromKml: function(kmlObject) {
    var result = this.createKmlTreeNode(kmlObject);

    if (kmlObject.getFeatures().hasChildNodes()) {
      var subNodes = kmlObject.getFeatures().getChildNodes();

      for(var i = 0; i < subNodes.getLength(); i++) {
        var subNode = subNodes.item(i);
          
        switch(subNode.getType()) {
        case 'KmlFolder':
        case 'KmlDocument':
          var node = this.treeNodeFromKml(subNode); // Recursion
          break;
        default:
          var node = this.createKmlTreeNode(subNode);
          break;
        }

        result.appendChild(node);
      }
    }

    return result;
  },

  // Create KML tree node (called by above function)
  createKmlTreeNode: function(kmlEl) {
    var node = new Ext.tree.TreeNode({
      text: kmlEl.getName(),
      checked: (kmlEl.getType() != 'KmlPlacemark' ? (kmlEl.getVisibility() ? true : false) : null),
      expanded: (kmlEl.getOpen() ? true : false),
      iconCls: kmlEl.getType(),
      kml: kmlEl
    });

    return node;
  }
});

Ext.reg('gearthpanel', Ext.ux.GEarthPanel);
