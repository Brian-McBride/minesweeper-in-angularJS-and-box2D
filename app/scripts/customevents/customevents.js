/**
 * Created by Brian on 5/30/2014.
 */


angular.module('Broadcaster', ['ngResource'])
  .factory('Events', function () {
    var el = document.createElement('div')
    var EventsListener = {
      on:function (event, callback, unsubscribeOnResponse) {
        $(el).on(event, function () {
          if (unsubscribeOnResponse) {
            $(el).off(event, el, callback)
          }
          callback.apply(this, arguments) //invoke client callback
        })
      },
      emit:function (event) {
        $(el).trigger(event, arguments)
      }
    };
    return EventsListener;
  });