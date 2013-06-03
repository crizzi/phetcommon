/*
 * PhET Simulations can be recorded and played back.  This serves a few purposes:
 * 1. During research interviews (with student consent) the session can be recorded for future playback.
 * 2. (possibly) Saving a simulation state for loading later.  Could also be done by exporting state, but that would require extra work.
 * 3. Live broadcasting from one screen to another (sim sharing), for remote learning or projecting a student's sim onto the room's projector
 * 4. Standardize performance testing of a realistic scenario.  For instance, you can record a session and play it back automatically to test scenery performance.
 * 5. Teacher can record sessions for future evaluation.
 * 6. Sim event data collection: when recording logging information for how the user interacts with the UI, also record the model state so it doesn't
 *    have to be recreated in a Finite State Machine afterwards.
 *
 * For recording within a simulation (like Moving Man), another structure would be required.  This is focused on recording the entire session, not
 * just some of the events within a particular model.
 *
 * This implementation just records all state changes, but we could alternatively investigate tracking
 * method calls (like command pattern) or trigger calls, etc.
 *
 * History: Adapted from phetsims/fort/wiretap.js
 * 
 * @author Sam Reid (PhET Interactive Simulations)
 * 
 * TODO: Rename to log since it will log things other than properties (such as trigger, and array changes)
 * TODO: Factor out class into one file, and singleton instance to another file
 * TODO: Remove extra cruft leftover from wiretap.js
 */
define( function( require ) {
  "use strict";

  var Vector2 = require( 'DOT/Vector2' );

  //Enable it if 'log' query parameter specified.  TODO: Switch to has.js?
  var enabled = window && window.phetcommon && window.phetcommon.getQueryParameter && window.phetcommon.getQueryParameter( 'log' );

  var cid = 0;

  function PropertyLog() {

    //Keep track of all the models
    this.properties = {};
    this.collections = {};

    //Keep track of the changes to all the models
    this.log = [];

    //Replacer and reviver for the JSON.  Could be moved to the models themselves to decouple/simplify.
    this.replacer = function( key, value ) {
//      console.log( "value", value, "value.constructor.name", value===null? 'null' : value===undefined? 'undefined': value.constructor.name );
      if ( value && value.constructor.name === 'Vector2' ) {
        return {x: value.x, y: value.y, jsonClass: 'Vector2'};
      }
      return value;
    };

    this.reviver = function( key, value ) {
      if ( value && value.jsonClass && value.jsonClass === 'Vector2' ) {
        return new Vector2( value.x, value.y );
      }
      return value;
    };
  }

  PropertyLog.prototype = {

    /**
     * When a property is created, register it for recording and playback.
     * Store its unique cid so that it can be discovered later during playback.
     * @param property
     */
    registerProperty: function( property ) {
      property.cid = cid++;
      if ( !enabled ) {
        return;
      }
      var propertyLog = this;
      this.properties[property.cid] = property;

      property.link( function( value ) {
        var entry = {time: Date.now(), cid: property.cid, action: 'change', value: JSON.stringify( value, propertyLog.replacer )};
//        console.log( entry );
        propertyLog.log.push( entry );
      } );
    },
    stepUntil: function( log, playbackTime, logIndex ) {
      var propertyLog = this;
      while ( logIndex < log.length ) {
        //find any events that passed in this time frame
        //Note, may handle multiple events before calling scene.updateScene()
        var time = log[logIndex].time;
        if ( time <= playbackTime ) {
          var entry = log[logIndex];
          var cid = entry.cid;

          //if it is a change, then set the value
          if ( entry.action === 'change' ) {
            if ( entry.value ) {
              propertyLog.properties[cid].value = JSON.parse( entry.value, propertyLog.reviver );
            }
            else {
              console.log( "missing value for index: ", logIndex, entry );
            }
          }
          else if ( entry.action === 'trigger' ) {
            propertyLog.properties[cid].trigger( entry.event );
          }
          else if ( entry.action === 'add' ) {
            propertyLog.collections[entry.collectionCid].add( propertyLog.properties[entry.cid] );
          }
          else if ( entry.action === 'remove' ) {
            propertyLog.collections[entry.collectionCid].remove( propertyLog.properties[entry.cid] );
          }
          else if ( entry.action === 'reset' ) {
            propertyLog.collections[entry.collectionCid].reset();
          }
          else if ( entry.action === 'sort' ) {
            propertyLog.collections[entry.collectionCid].sort();
          }

          logIndex++;
        }
        else {
          break;
        }
      }
      return logIndex;
    }
  };

  //It is a singleton, so just return the one and only instance.
  //For unknown reasons, running the unit tests was creating 2 wiretap instances.  So use global space to prevent it (for now?)
  window.phet = window.phet || {};
  window.phet.propertyLog = window.phet.propertyLog || new PropertyLog();

  return window.phet.propertyLog;
} );