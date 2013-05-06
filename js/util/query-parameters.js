// Copyright 2002-2013, University of Colorado

/**
 * Reads query parameters from browser window's URL.
 * This file must be loaded before requirejs is started up, and this file cannot be loaded as an AMD module.
 * The easiest way to do this is via a <script> tag in your HTML file.
 *
 * This also updates the locale in the require.js config file, and hence should be loaded after requirejs is loaded.
 *
 * @author Sam Reid, PhET
 * @author Chris Malley (PixelZoom, Inc.)
 */
(function() {
  "use strict";

  if ( !window.phetcommon ) {
    window.phetcommon = {};
  }

  /**
   * Retrieves the first occurrence of a query parameter based on its key.
   * Returns undefined if the query parameter is not found.
   * @param {String} key
   * @return {String}
   */
  window.phetcommon.getQueryParameter = function ( key ) {
    var value;
    if ( typeof window != 'undefined' && window.location.search ) {
      var params = window.location.search.slice( 1 ).split( "&" );
      for ( var i = 0; i < params.length; i++ ) {
        var nameValuePair = params[i].split( "=" );
        if ( nameValuePair[0] === key ) {
          value = decodeURI( nameValuePair[1] ).toLowerCase();
          break;
        }
      }
    }
    return value;
  };

  /**
   * If you're using the i18n.js plugin for requirejs, add this to config.js:
   *
   * config: {
   *       i18n: {
   *         locale: window.phetcommon.locale
   *       }
   *     }
   *
   * Specify the locale in your URL like this: "http://path/to/my/sim.html?locale=fr
   */
  window.phetcommon.locale = window.phetcommon.getQueryParameter( "locale" ) || "en_US";

  // Is the sim running in developer mode?
  window.phetcommon.dev = window.phetcommon.getQueryParameter( "dev" );

  //If running under require.js, apply the locale there as well.
  //See https://github.com/phetsims/ohms-law/issues/16?source=c
  if ( require && require.config ) {
    require.config( {config: { i18n: { locale: window.phetcommon.locale } }} );
  }
}());