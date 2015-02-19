'use strict';

describe('myApp.guests module', function() {

  beforeEach(module('myApp.guests'));

  describe('guests controller', function(){

    it('should get guest', inject(function($controller) {
      //spec body
      var GuestsCtrl = $controller('GuestsCtrl');
      expect(GuestsCtrl).toBeDefined();
      expect(GuestsCtrl.guests).toBeDefined();
    }));

  });
});